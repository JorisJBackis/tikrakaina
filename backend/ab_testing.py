#!/usr/bin/env python3
"""
A/B Testing Module for Old vs New ML Model
Runs both models simultaneously and logs results for comparison
"""

import pickle
import json
import re
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from database import supabase
from geopy.distance import geodesic

# Import old model utilities
from model_utils import scrape_listing as scrape_old, featurise as featurise_old, _parse_number, _geocode_addr

# Import new model utilities (only the ones that exist)
from vilrent_utils import (
    parse_dl_block,
    add_primary_heating_dummies,
    zyte_fetch_html,
    make_session,
    USER_AGENTS
)

logger = logging.getLogger(__name__)

# ============================================================================
# MODEL LOADING
# ============================================================================

class DualModelPredictor:
    """Loads and manages both old and new models for A/B testing"""

    def __init__(self):
        self.old_model = None
        self.new_model = None
        self.feature_order = None
        self.district_categories = None
        self._load_models()

    def _load_models(self):
        """Load both models and necessary configs"""
        try:
            # Load old model
            with open("model.pkl", "rb") as f:
                self.old_model = pickle.load(f)
            logger.info("✅ Old model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load old model: {e}")

        try:
            # Load new model
            with open("model_new.pkl", "rb") as f:
                self.new_model = pickle.load(f)
            logger.info("✅ New model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load new model: {e}")

        try:
            # Load new model configs
            with open("feature_order.json", "r") as f:
                self.feature_order = json.load(f)

            with open("district_categories.json", "r") as f:
                self.district_categories = pd.Index(json.load(f))

            logger.info("✅ New model configs loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load new model configs: {e}")

# ============================================================================
# FEATURE EXTRACTION FOR NEW MODEL
# ============================================================================

def featurise_new(raw_dict: dict, district_categories: pd.Index, feature_order: list) -> pd.DataFrame:
    """
    Transform scraped listing into new model-ready features.
    Key differences from old model:
    - Adds district_encoded (categorical)
    - Removes age_days
    """
    df = pd.DataFrame([raw_dict])

    # Ensure required columns exist
    listlike_defaults = {
        "Šildymas": [],
        "Ypatybės": [],
        "Papildomos patalpos": [],
    }

    for col, default in listlike_defaults.items():
        if col not in df.columns:
            df[col] = [json.dumps(default)]
        else:
            if isinstance(df.at[df.index[0], col], (list, tuple, set)):
                df[col] = df[col].map(lambda v: json.dumps(list(v), ensure_ascii=False))

    # Process building year
    df['Metai'] = (
        df.get('Metai', pd.Series([None]))
          .astype(str).str.extract(r'(\d{4})', expand=False).astype(float)
    )
    df['year_centered'] = df['Metai'] - 2000

    # Add heating dummies
    df = add_primary_heating_dummies(df)

    # Add amenity features
    df['has_lift'] = (
        df['Ypatybės']
          .map(lambda s: 'Yra liftas' in (json.loads(s) if pd.notnull(s) else []))
          .astype(int)
    )

    df['has_balcony_terrace'] = (
        df['Papildomos patalpos']
          .map(lambda s: any(x in {'Balkonas', 'Terasa'} for x in (json.loads(s) if pd.notnull(s) else [])))
          .astype(int)
    )

    df['has_parking_spot'] = (
        df['Papildomos patalpos']
          .map(lambda s: 'Vieta automobiliui' in (json.loads(s) if pd.notnull(s) else []))
          .astype(int)
    )

    # Extract location info
    city = _first_value(df, "city") or "Vilnius"
    district = _first_value(df, "district")
    street = _first_value(df, "street")
    house = _first_value(df, "Namo numeris")

    # Handle district encoding
    raw_dist = district if isinstance(district, str) else None
    if raw_dist not in district_categories:
        raw_dist = "Other"
    df["district_encoded"] = pd.Categorical([raw_dist], categories=district_categories)

    # Parse numerical features properly (don't assume they're already computed)
    df["area_m2"] = _parse_number(_first_value(df, "Plotas"))
    df["floor_total"] = _parse_number(_first_value(df, "Aukštų sk."))
    df["floor_current"] = _parse_number(_first_value(df, "Aukštas"))
    df["rooms"] = _parse_number(_first_value(df, "Kambarių sk."))

    # Calculate distance to center if not already computed
    lat = df.get('latitude', pd.Series([None])).iloc[0]
    lon = df.get('longitude', pd.Series([None])).iloc[0]

    # Use the same robust geocoding with fallbacks as the old model
    if pd.isna(lat) or pd.isna(lon):
        # Try with district first
        parts_with = [p for p in [city, district, street] if p]
        base_with = ", ".join(parts_with)
        addr_with = f"{base_with} {house}" if (base_with and house) else base_with

        lat, lon = _geocode_addr(addr_with)
        if (lat is None or lon is None) and house:
            lat, lon = _geocode_addr(base_with)

        # Retry without district if still no results
        if (lat is None or lon is None):
            parts_no = [p for p in [city, street] if p]
            base_no = ", ".join(parts_no)
            addr_no = f"{base_no} {house}" if (base_no and house) else base_no

            lat, lon = _geocode_addr(addr_no)
            if (lat is None or lon is None) and house:
                lat, lon = _geocode_addr(base_no)

    df["latitude"] = lat
    df["longitude"] = lon

    city_center = (54.6872, 25.2797)  # Vilnius center
    if pd.notnull(lat) and pd.notnull(lon):
        df["dist_to_center_km"] = geodesic((lat, lon), city_center).km
    else:
        df["dist_to_center_km"] = np.nan

    # Enforce exact feature order and types
    df = _coerce_dtypes_and_order(df, district_categories, feature_order)

    return df


def _coerce_dtypes_and_order(X: pd.DataFrame, district_categories: pd.Index, feature_order: list) -> pd.DataFrame:
    """Force X to the exact dtypes and column order the model was trained with."""
    X = X.copy()

    CAT_COL = "district_encoded"
    NUMERIC_FEATS = [c for c in feature_order if c != CAT_COL]

    # Ensure the categorical column exists and is properly cast
    if CAT_COL not in X.columns:
        X[CAT_COL] = "Other"

    # Map unknowns to "Other" first
    mask_unseen = ~X[CAT_COL].isin(district_categories)
    if mask_unseen.any():
        X.loc[mask_unseen, CAT_COL] = "Other"
    X[CAT_COL] = pd.Categorical(X[CAT_COL], categories=district_categories)

    # Ensure all numeric features exist and are numeric (NaN allowed)
    for col in NUMERIC_FEATS:
        if col not in X.columns:
            X[col] = pd.NA
    X[NUMERIC_FEATS] = X[NUMERIC_FEATS].apply(pd.to_numeric, errors="coerce")

    # Reindex to exact training order
    X = X.reindex(columns=feature_order)

    return X


def _first_value(d, col):
    """Return the first value for column (handles list/tuple/str)."""
    v = d.get(col, pd.Series([None])).iloc[0]
    if isinstance(v, (list, tuple, set)):
        v = list(v)[0] if len(v) else None
    return v


def _parse_price(text):
    """Extract price from text like '750 €/mėn.' or '12.50 €/m²' or '1 850 €'"""
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return np.nan

    s = str(text)
    # Replace non-breaking spaces and commas
    s = s.replace("\u00A0", " ").replace(",", ".")
    # Remove currency symbols and common text
    s = s.replace("€", "").replace("/mėn.", "").replace("/m²", "").strip()

    # Remove spaces between digits (handles "1 850" → "1850")
    # But preserve decimal points (handles "29.99")
    s = re.sub(r'(\d)\s+(\d)', r'\1\2', s)

    # Now extract the number
    m = re.search(r"[-+]?\d+(?:\.\d+)?", s)
    return float(m.group(0)) if m else np.nan


def extract_actual_price(raw_dict: dict) -> dict:
    """
    Extract actual listing price from scraped data.
    Returns dict with actual_price_total and actual_price_per_m2
    """
    result = {
        "actual_price_total": None,
        "actual_price_per_m2": None
    }

    # Try to get price from common fields
    # Aruodas uses "Kaina mėn." for rental monthly price
    price_fields = ["Kaina mėn.", "Kaina", "Nuomos kaina", "Kaina per mėnesį", "Price"]

    for field in price_fields:
        if field in raw_dict:
            price_val = _first_value(pd.DataFrame([raw_dict]), field)
            if price_val:
                parsed_price = _parse_price(price_val)
                if pd.notnull(parsed_price):
                    result["actual_price_total"] = parsed_price
                    break

    # Calculate price per m² if we have total price and area
    if result["actual_price_total"]:
        # Get area from raw_dict (already parsed by featurise)
        area = None
        if "area_m2" in raw_dict and pd.notnull(raw_dict["area_m2"]):
            area = raw_dict["area_m2"]
        elif "Plotas" in raw_dict:
            # Parse area from "Plotas" field if area_m2 not yet calculated
            import re
            plotas = _first_value(pd.DataFrame([raw_dict]), "Plotas")
            if plotas:
                plotas_str = str(plotas).replace(",", ".")
                match = re.search(r"([\d.]+)", plotas_str)
                if match:
                    area = float(match.group(1))

        if area and area > 0:
            result["actual_price_per_m2"] = result["actual_price_total"] / area

    return result


# ============================================================================
# DUAL PREDICTION RUNNER
# ============================================================================

async def run_dual_prediction(
    url: str,
    predictor: DualModelPredictor,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run both models on the same URL and return comprehensive comparison.

    Returns:
    {
        "success": bool,
        "old_model": {...},
        "new_model": {...},
        "comparison": {...},
        "raw_data": {...}
    }
    """

    # Normalize mobile/English URLs to standard desktop URLs
    # Handles: m.aruodas.lt, en.aruodas.lt, m.en.aruodas.lt -> www.aruodas.lt
    original_url = url
    url = url.replace("//m.en.aruodas.lt/", "//www.aruodas.lt/")
    url = url.replace("//en.aruodas.lt/", "//www.aruodas.lt/")
    url = url.replace("//m.aruodas.lt/", "//www.aruodas.lt/")
    if url != original_url:
        logger.info(f"📱 Normalized URL to: {url}")

    result = {
        "success": False,
        "url": url,
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "old_model": {},
        "new_model": {},
        "comparison": {},
        "actual_price": {},
        "accuracy": {},
        "raw_data": {},
        "errors": []
    }

    # ========================================
    # SCRAPE LISTING (shared for both models)
    # ========================================
    try:
        logger.info(f"🔍 Scraping listing: {url}")
        raw_data = scrape_old(url)  # Use old scraper (it works fine)

        # Extract actual listing price
        actual_prices = extract_actual_price(raw_data)
        result["actual_price"] = actual_prices

        if actual_prices["actual_price_total"]:
            logger.info(f"💰 Actual listing price: €{actual_prices['actual_price_total']:.2f} "
                       f"(€{actual_prices['actual_price_per_m2']:.2f}/m²)")
        else:
            logger.warning("⚠️  Could not extract actual price from listing")

        result["raw_data"] = {
            "district": raw_data.get("district", ["Unknown"])[0] if "district" in raw_data else "Unknown",
            "area_m2": raw_data.get("area_m2"),
            "rooms": raw_data.get("rooms"),
            "floor": f"{raw_data.get('floor_current')}/{raw_data.get('floor_total')}",
        }
    except Exception as e:
        logger.error(f"❌ Scraping failed: {e}")
        result["errors"].append(f"Scraping error: {str(e)}")
        await log_ab_test_result(result)
        return result

    # ========================================
    # OLD MODEL PREDICTION
    # ========================================
    try:
        logger.info("🤖 Running OLD model...")
        features_old = featurise_old(raw_data)
        pred_old_pm2 = predictor.old_model.predict(features_old)[0]
        area = features_old["area_m2"].iloc[0]
        total_old = pred_old_pm2 * area if pd.notnull(area) else None

        result["old_model"] = {
            "success": True,
            "price_per_m2": round(float(pred_old_pm2), 2),
            "total_price": round(float(total_old), 2) if total_old else None,
            "features_used": features_old.iloc[0].to_dict()
        }
        logger.info(f"✅ Old model: €{result['old_model']['price_per_m2']}/m² (€{result['old_model']['total_price']} total)")
    except Exception as e:
        logger.error(f"❌ Old model failed: {e}")
        result["old_model"] = {"success": False, "error": str(e)}
        result["errors"].append(f"Old model error: {str(e)}")

    # ========================================
    # NEW MODEL PREDICTION
    # ========================================
    try:
        logger.info("🚀 Running NEW model...")
        features_new = featurise_new(raw_data, predictor.district_categories, predictor.feature_order)
        pred_new_pm2 = predictor.new_model.predict(features_new)[0]
        area = features_new["area_m2"].iloc[0]
        total_new = pred_new_pm2 * area if pd.notnull(area) else None

        result["new_model"] = {
            "success": True,
            "price_per_m2": round(float(pred_new_pm2), 2),
            "total_price": round(float(total_new), 2) if total_new else None,
            "features_used": {k: (v if not isinstance(v, pd.Categorical) else str(v))
                             for k, v in features_new.iloc[0].to_dict().items()}
        }
        logger.info(f"✅ New model: €{result['new_model']['price_per_m2']}/m² (€{result['new_model']['total_price']} total)")
    except Exception as e:
        logger.error(f"❌ New model failed: {e}")
        result["new_model"] = {"success": False, "error": str(e)}
        result["errors"].append(f"New model error: {str(e)}")

    # ========================================
    # COMPARISON METRICS
    # ========================================
    if result["old_model"].get("success") and result["new_model"].get("success"):
        old_pm2 = result["old_model"]["price_per_m2"]
        new_pm2 = result["new_model"]["price_per_m2"]
        old_total = result["old_model"]["total_price"]
        new_total = result["new_model"]["total_price"]

        # Calculate differences between models
        diff_pm2 = new_pm2 - old_pm2
        diff_pct_pm2 = (diff_pm2 / old_pm2 * 100) if old_pm2 > 0 else 0

        diff_total = (new_total - old_total) if (new_total and old_total) else None
        diff_pct_total = (diff_total / old_total * 100) if (diff_total is not None and old_total and old_total > 0) else None

        result["comparison"] = {
            "diff_price_per_m2": round(diff_pm2, 2),
            "diff_pct_per_m2": round(diff_pct_pm2, 2),
            "diff_total_price": round(diff_total, 2) if diff_total else None,
            "diff_pct_total": round(diff_pct_total, 2) if diff_pct_total else None,
            "agreement": "HIGH" if abs(diff_pct_pm2) < 5 else "MEDIUM" if abs(diff_pct_pm2) < 10 else "LOW",
            "new_model_higher": new_pm2 > old_pm2
        }

        logger.info(f"📊 Model Difference: {diff_pm2:+.2f} EUR/m² ({diff_pct_pm2:+.1f}%) - Agreement: {result['comparison']['agreement']}")

        # ========================================
        # ACCURACY METRICS (vs actual price)
        # ========================================
        actual_pm2 = result["actual_price"].get("actual_price_per_m2")
        actual_total = result["actual_price"].get("actual_price_total")

        if actual_pm2 and actual_pm2 > 0:
            # Calculate errors for each model
            old_error_pm2 = old_pm2 - actual_pm2
            new_error_pm2 = new_pm2 - actual_pm2

            old_error_pct = (old_error_pm2 / actual_pm2 * 100)
            new_error_pct = (new_error_pm2 / actual_pm2 * 100)

            old_abs_error = abs(old_error_pm2)
            new_abs_error = abs(new_error_pm2)

            old_abs_error_pct = abs(old_error_pct)
            new_abs_error_pct = abs(new_error_pct)

            result["accuracy"] = {
                # Old model accuracy
                "old_error_per_m2": round(old_error_pm2, 2),
                "old_error_pct": round(old_error_pct, 2),
                "old_abs_error_per_m2": round(old_abs_error, 2),
                "old_abs_error_pct": round(old_abs_error_pct, 2),

                # New model accuracy
                "new_error_per_m2": round(new_error_pm2, 2),
                "new_error_pct": round(new_error_pct, 2),
                "new_abs_error_per_m2": round(new_abs_error, 2),
                "new_abs_error_pct": round(new_abs_error_pct, 2),

                # Which model is more accurate?
                "new_model_more_accurate": new_abs_error < old_abs_error,
                "accuracy_improvement_pct": round(((old_abs_error - new_abs_error) / old_abs_error * 100), 2) if old_abs_error > 0 else 0,

                # Rating
                "old_model_rating": "EXCELLENT" if old_abs_error_pct < 5 else "GOOD" if old_abs_error_pct < 10 else "FAIR" if old_abs_error_pct < 15 else "POOR",
                "new_model_rating": "EXCELLENT" if new_abs_error_pct < 5 else "GOOD" if new_abs_error_pct < 10 else "FAIR" if new_abs_error_pct < 15 else "POOR",
            }

            logger.info(f"🎯 OLD Model Accuracy: {old_error_pm2:+.2f} EUR/m² ({old_error_pct:+.1f}% error) - {result['accuracy']['old_model_rating']}")
            logger.info(f"🎯 NEW Model Accuracy: {new_error_pm2:+.2f} EUR/m² ({new_error_pct:+.1f}% error) - {result['accuracy']['new_model_rating']}")

            if result["accuracy"]["new_model_more_accurate"]:
                logger.info(f"✅ NEW model is MORE accurate ({result['accuracy']['accuracy_improvement_pct']:+.1f}% improvement)!")
            else:
                logger.info(f"⚠️  OLD model is still more accurate")

        else:
            result["accuracy"] = {"error": "Actual price not available"}
            logger.warning("⚠️  Cannot calculate accuracy metrics - actual price not found")

        result["success"] = True
    else:
        result["comparison"] = {"error": "One or both models failed"}

    # ========================================
    # LOG TO DATABASE
    # ========================================
    await log_ab_test_result(result)

    return result


# ============================================================================
# DATABASE LOGGING
# ============================================================================

async def log_ab_test_result(result: Dict[str, Any]):
    """Log A/B test result to Supabase"""
    try:
        # Prepare data for insertion
        log_entry = {
            "url": result["url"],
            "timestamp": result["timestamp"],
            "user_id": result.get("user_id"),
            "success": result["success"],

            # Actual listing price
            "actual_price_per_m2": result["actual_price"].get("actual_price_per_m2"),
            "actual_price_total": result["actual_price"].get("actual_price_total"),

            # Old model results
            "old_model_success": result["old_model"].get("success", False),
            "old_price_per_m2": result["old_model"].get("price_per_m2"),
            "old_total_price": result["old_model"].get("total_price"),
            "old_error": result["old_model"].get("error"),

            # New model results
            "new_model_success": result["new_model"].get("success", False),
            "new_price_per_m2": result["new_model"].get("price_per_m2"),
            "new_total_price": result["new_model"].get("total_price"),
            "new_error": result["new_model"].get("error"),

            # Comparison metrics (model vs model)
            "diff_price_per_m2": result["comparison"].get("diff_price_per_m2"),
            "diff_pct_per_m2": result["comparison"].get("diff_pct_per_m2"),
            "diff_total_price": result["comparison"].get("diff_total_price"),
            "diff_pct_total": result["comparison"].get("diff_pct_total"),
            "agreement_level": result["comparison"].get("agreement"),
            "new_model_higher": result["comparison"].get("new_model_higher"),

            # Accuracy metrics (model vs actual price)
            "old_error_per_m2": result["accuracy"].get("old_error_per_m2"),
            "old_error_pct": result["accuracy"].get("old_error_pct"),
            "old_abs_error_pct": result["accuracy"].get("old_abs_error_pct"),
            "new_error_per_m2": result["accuracy"].get("new_error_per_m2"),
            "new_error_pct": result["accuracy"].get("new_error_pct"),
            "new_abs_error_pct": result["accuracy"].get("new_abs_error_pct"),
            "new_model_more_accurate": result["accuracy"].get("new_model_more_accurate"),
            "accuracy_improvement_pct": result["accuracy"].get("accuracy_improvement_pct"),
            "old_model_rating": result["accuracy"].get("old_model_rating"),
            "new_model_rating": result["accuracy"].get("new_model_rating"),

            # Raw data for reference
            "district": result["raw_data"].get("district"),
            "area_m2": result["raw_data"].get("area_m2"),
            "rooms": result["raw_data"].get("rooms"),

            # Store full result as JSON for debugging
            "full_result": result
        }

        # Insert into Supabase
        supabase.table("ab_test_results").insert(log_entry).execute()
        logger.info(f"✅ Logged A/B test result to database")

    except Exception as e:
        logger.error(f"❌ Failed to log A/B test result: {e}")


# ============================================================================
# ANALYSIS FUNCTIONS
# ============================================================================

async def get_ab_test_stats() -> Dict[str, Any]:
    """Get comprehensive A/B testing statistics"""
    try:
        # Fetch all results
        response = supabase.table("ab_test_results").select("*").execute()

        if not response.data:
            return {
                "total_tests": 0,
                "message": "No A/B test data available yet"
            }

        df = pd.DataFrame(response.data)

        # Filter successful tests only
        successful = df[(df["old_model_success"] == True) & (df["new_model_success"] == True)]

        if len(successful) == 0:
            return {
                "total_tests": len(df),
                "successful_tests": 0,
                "message": "No successful dual predictions yet"
            }

        stats = {
            "total_tests": len(df),
            "successful_tests": len(successful),
            "failed_tests": len(df) - len(successful),

            # Price differences
            "avg_diff_per_m2": round(successful["diff_price_per_m2"].mean(), 2),
            "avg_diff_pct": round(successful["diff_pct_per_m2"].mean(), 2),
            "median_diff_pct": round(successful["diff_pct_per_m2"].median(), 2),
            "std_diff_pct": round(successful["diff_pct_per_m2"].std(), 2),

            # Agreement levels
            "high_agreement": int((successful["agreement_level"] == "HIGH").sum()),
            "medium_agreement": int((successful["agreement_level"] == "MEDIUM").sum()),
            "low_agreement": int((successful["agreement_level"] == "LOW").sum()),

            # New model comparison
            "new_model_higher_count": int(successful["new_model_higher"].sum()),
            "new_model_lower_count": int((~successful["new_model_higher"]).sum()),

            # Price ranges
            "old_model_avg_pm2": round(successful["old_price_per_m2"].mean(), 2),
            "new_model_avg_pm2": round(successful["new_price_per_m2"].mean(), 2),

            # Recent tests
            "recent_tests": successful.tail(10).to_dict('records')
        }

        return stats

    except Exception as e:
        logger.error(f"❌ Failed to get A/B test stats: {e}")
        return {"error": str(e)}


async def get_ab_test_history(limit: int = 50) -> list:
    """Get recent A/B test history"""
    try:
        response = supabase.table("ab_test_results") \
            .select("*") \
            .order("timestamp", desc=True) \
            .limit(limit) \
            .execute()

        return response.data
    except Exception as e:
        logger.error(f"❌ Failed to get A/B test history: {e}")
        return []
