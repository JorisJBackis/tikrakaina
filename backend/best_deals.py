#!/usr/bin/env python3
"""
Best Deals Finder - Uses EXACT same prediction logic as production website.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
from geopy.distance import geodesic
import re

from model_utils import _geocode_addr

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY"))
CITY_CENTER = (54.6872, 25.2797)


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def featurize_from_db(row, district_categories, feature_order):
    """
    Convert DB row to model features using EXACT same logic as production.
    """
    raw = row.get('raw_features', {})
    if isinstance(raw, str):
        raw = json.loads(raw)

    # Extract basic features
    area = float(row.get('area_m2') or raw.get('area_m2') or 0)
    rooms = float(row.get('rooms') or raw.get('rooms') or 0)
    floor_current = float(row.get('floor_current') or raw.get('floor_current') or 0)
    floor_total = float(row.get('floor_total') or raw.get('floor_total') or 0)
    year_built = float(row.get('year_built') or raw.get('year_built') or 2000)
    year_centered = year_built - 2000

    # District
    district = row.get('district') or raw.get('district') or 'Other'
    if district not in district_categories:
        district = 'Other'

    # Geocode for distance - SAME fallback order as production (ab_testing.py)
    street = row.get('street') or raw.get('street') or ''
    house_number = raw.get('house_number') or ''
    lat, lon = None, None

    # Build address with house number if available
    street_with_house = f"{street} {house_number}".strip() if house_number else street

    # 1. Try: city + district + street + house
    if street_with_house and district:
        lat, lon = _geocode_addr(f"Vilnius, {district}, {street_with_house}")

    # 2. If fail: Try city + district + street (without house)
    if (lat is None or lon is None) and street and district and house_number:
        lat, lon = _geocode_addr(f"Vilnius, {district}, {street}")

    # 3. If fail: Try city + street + house (WITHOUT district)
    if (lat is None or lon is None) and street_with_house:
        lat, lon = _geocode_addr(f"Vilnius, {street_with_house}")

    # 4. If fail: Try city + street (WITHOUT district, without house)
    if (lat is None or lon is None) and street:
        lat, lon = _geocode_addr(f"Vilnius, {street}")

    # 5. If still fail: Try district only
    if (lat is None or lon is None) and district:
        lat, lon = _geocode_addr(f"Vilnius, {district}")

    if lat and lon:
        dist_to_center = geodesic((lat, lon), CITY_CENTER).km
    else:
        dist_to_center = np.nan

    # Heating - extract primary type
    heating = raw.get('heating', [])
    if isinstance(heating, str):
        heating = [heating]
    primary_heat = heating[0] if heating else ""

    heat_Centrinis = 1 if 'Centrinis' in primary_heat else 0
    heat_Dujinis = 1 if 'Dujinis' in primary_heat else 0
    heat_Elektra = 1 if 'Elektra' in primary_heat else 0

    # Amenities
    features_list = raw.get('features', [])
    additional = raw.get('additional_rooms', [])

    has_lift = 1 if 'Yra liftas' in features_list else 0
    has_balcony_terrace = 1 if any(x in additional for x in ['Balkonas', 'Terasa']) else 0
    has_parking_spot = 1 if 'Vieta automobiliui' in additional else 0

    # Build feature dict
    features = {
        'rooms': rooms,
        'floor_current': floor_current,
        'floor_total': floor_total,
        'area_m2': area,
        'year_centered': year_centered,
        'dist_to_center_km': dist_to_center,
        'heat_Centrinis': heat_Centrinis,
        'heat_Dujinis': heat_Dujinis,
        'heat_Elektra': heat_Elektra,
        'has_lift': has_lift,
        'has_balcony_terrace': has_balcony_terrace,
        'has_parking_spot': has_parking_spot,
        'district_encoded': district,
    }

    # Create DataFrame
    df = pd.DataFrame([features])
    df['district_encoded'] = pd.Categorical([district], categories=district_categories)

    # Reorder to exact feature order
    df = df.reindex(columns=feature_order)

    return df, dist_to_center, lat, lon


def main(limit=2000, days=12):
    print(f"Loading NEW model (same as production)...")

    with open('model_new.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('feature_order.json', 'r') as f:
        feature_order = json.load(f)
    with open('district_categories.json', 'r') as f:
        district_categories = pd.Index(json.load(f))

    # Calculate date cutoff
    from datetime import timedelta
    cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"Fetching ACTIVE listings posted after {cutoff_date} (last {days} days)...")
    supabase = get_supabase()

    # Fetch listings (with pagination if needed for large limits)
    if limit <= 1000:
        result = supabase.from_('listing_lifecycle').select(
            'listing_id, last_price, url, first_seen_at'
        ).eq('status', 'ACTIVE').gte('first_seen_at', cutoff_date).limit(limit).execute()
        all_lifecycle_rows = result.data
    else:
        # Paginated fetch for limits > 1000
        all_lifecycle_rows = []
        page_size = 1000
        offset = 0
        while len(all_lifecycle_rows) < limit:
            result = supabase.from_('listing_lifecycle').select(
                'listing_id, last_price, url, first_seen_at'
            ).eq('status', 'ACTIVE').gte('first_seen_at', cutoff_date).range(offset, offset + page_size - 1).execute()
            if not result.data:
                break
            all_lifecycle_rows.extend(result.data)
            if len(result.data) < page_size:
                break
            offset += page_size

    print(f"Fetched {len(all_lifecycle_rows)} listings")

    listings = []
    for row in all_lifecycle_rows:
        snap = supabase.from_('listing_snapshots').select(
            'area_m2, rooms, district, street, floor_current, floor_total, year_built, date_posted, raw_features'
        ).eq('listing_id', row['listing_id']).limit(1).execute()

        if snap.data:
            row.update(snap.data[0])
            listings.append(row)

    print(f"Found {len(listings)} listings\n")

    results = []
    for i, row in enumerate(listings):
        listing_id = row['listing_id']
        actual_price = row['last_price']
        district = row.get('district', 'Unknown')
        area = float(row.get('area_m2', 0) or 0)

        print(f"[{i+1}/{len(listings)}] {listing_id} ({district})...", end=" ", flush=True)

        try:
            features_df, dist, lat, lon = featurize_from_db(row, district_categories, feature_order)

            pred_per_m2 = model.predict(features_df)[0]
            predicted_total = pred_per_m2 * area if area > 0 else 0

            if predicted_total > 0 and actual_price > 0:
                deal_score = (predicted_total - actual_price) / predicted_total * 100
                results.append({
                    'listing_id': listing_id,
                    'url': row.get('url', ''),
                    'district': district,
                    'street': row.get('street', ''),
                    'rooms': int(row.get('rooms', 0) or 0),
                    'area_m2': area,
                    'floor_current': int(row.get('floor_current', 0) or 0),
                    'floor_total': int(row.get('floor_total', 0) or 0),
                    'year_built': int(row.get('year_built', 0) or 0),
                    'actual_price': actual_price,
                    'predicted_price': round(predicted_total),
                    'pred_per_m2': round(pred_per_m2, 2),
                    'deal_score': round(deal_score, 1),
                    'latitude': lat,
                    'longitude': lon,
                    'dist_to_center_km': round(dist, 3) if dist else None,
                    'first_seen_at': row.get('first_seen_at'),
                })
                print(f"€{actual_price} vs €{round(predicted_total)} ({deal_score:+.1f}%)")
            else:
                print("skip")
        except Exception as e:
            print(f"error: {e}")

    results.sort(key=lambda x: x['deal_score'], reverse=True)

    # Calculate stats
    total = len(results)
    top_5_pct = int(total * 0.05)
    top_10_pct = int(total * 0.10)
    good_deals = [r for r in results if r['deal_score'] > 0]

    print(f"\n{'='*70}")
    print(f"ANALYSIS: {total} listings processed")
    print(f"{'='*70}")
    print(f"Good deals (below predicted): {len(good_deals)} ({len(good_deals)/total*100:.1f}%)")
    print(f"Top 5% threshold: {results[top_5_pct-1]['deal_score']:.1f}% below predicted" if top_5_pct > 0 else "")
    print(f"Top 10% threshold: {results[top_10_pct-1]['deal_score']:.1f}% below predicted" if top_10_pct > 0 else "")

    print(f"\n{'='*70}")
    print(f"TOP 5% BEST DEALS ({top_5_pct} listings)")
    print(f"{'='*70}")

    for i, r in enumerate(results[:top_5_pct]):
        print(f"{i+1:2}. {r['deal_score']:+5.1f}%  €{r['actual_price']:>4} (pred €{r['predicted_price']:>4})  "
              f"{r['rooms']}r/{r['area_m2']:.0f}m²  {r['district']}")
        print(f"    {r['url']}")

    print(f"\n{'='*70}")
    print(f"TOP 10% BEST DEALS ({top_10_pct} listings)")
    print(f"{'='*70}")

    for i, r in enumerate(results[:top_10_pct]):
        if i >= top_5_pct:  # Only show the ones not already shown
            print(f"{i+1:2}. {r['deal_score']:+5.1f}%  €{r['actual_price']:>4} (pred €{r['predicted_price']:>4})  "
                  f"{r['rooms']}r/{r['area_m2']:.0f}m²  {r['district']}")
            print(f"    {r['url']}")

    # Save results to JSON (backup)
    output_file = 'best_deals_results.json'
    with open(output_file, 'w') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'days_analyzed': days,
            'total_listings': total,
            'good_deals_count': len(good_deals),
            'top_5_pct': results[:top_5_pct],
            'top_10_pct': results[:top_10_pct],
            'all_results': results
        }, f, indent=2, default=str)
    print(f"\nResults saved to {output_file}")

    # Save to database
    print(f"\nSaving {len(results)} results to database...")
    save_to_database(supabase, results)

    return results


def save_to_database(supabase, results):
    """Save deal analysis results to Supabase."""
    run_id = datetime.now().strftime('%Y%m%d_%H%M%S')

    for r in results:
        try:
            supabase.from_('deal_analysis').upsert({
                'listing_id': r['listing_id'],
                'run_id': run_id,
                'url': r['url'],
                'district': r['district'],
                'street': r.get('street'),
                'rooms': r['rooms'],
                'area_m2': r['area_m2'],
                'floor_current': r.get('floor_current'),
                'floor_total': r.get('floor_total'),
                'year_built': r.get('year_built'),
                'actual_price': r['actual_price'],
                'predicted_price': r['predicted_price'],
                'pred_per_m2': r['pred_per_m2'],
                'deal_score': r['deal_score'],
                'latitude': r.get('latitude'),
                'longitude': r.get('longitude'),
                'dist_to_center_km': r.get('dist_to_center_km'),
                'analyzed_at': datetime.now().isoformat(),
            }, on_conflict='listing_id').execute()
        except Exception as e:
            print(f"  Error saving {r['listing_id']}: {e}")

    print(f"✓ Saved to deal_analysis table (run_id: {run_id})")


if __name__ == "__main__":
    import sys
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    main(limit=limit, days=days)
