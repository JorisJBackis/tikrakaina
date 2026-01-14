from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import asyncio
import logging
from pathlib import Path

# Import our model utilities (OLD - kept for compatibility)
from model_utils import scrape_listing, featurise, predict_from_url

# Import A/B testing module (NEW - runs both models)
from ab_testing import DualModelPredictor, run_dual_prediction, get_ab_test_stats, get_ab_test_history

# Import SHAP explainer for model explanations
from shap_explainer import get_explainer as get_shap_explainer, explain_prediction

# Import SumUp routes
from sumup_routes import router as sumup_router, webhook_router
from auth_routes import router as auth_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="TikraKaina API",
    description="AI-powered real estate valuation for Lithuanian rental market",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now (can restrict later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the OLD model once at startup (kept for fallback)
MODEL_PATH = Path("model.pkl")
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    logger.info("✅ Old model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load old model: {e}")
    model = None

# Initialize A/B Testing System (loads BOTH models)
try:
    dual_predictor = DualModelPredictor()
    logger.info("🚀 A/B Testing System initialized - Both models loaded!")
except Exception as e:
    logger.error(f"❌ Failed to initialize A/B testing system: {e}")
    dual_predictor = None

# Initialize SHAP Explainer for model explanations
shap_explainer = None
try:
    shap_explainer = get_shap_explainer()
    logger.info("🧠 SHAP Explainer initialized!")
except Exception as e:
    logger.warning(f"⚠️ SHAP Explainer failed to initialize: {e}")
    shap_explainer = None

# Include routers
app.include_router(sumup_router)
app.include_router(webhook_router)
app.include_router(auth_router)

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    url: HttpUrl = Field(..., description="Aruodas.lt listing URL")
    user_id: Optional[str] = Field(None, description="User ID for tracking")

class ManualDataRequest(BaseModel):
    rooms: int
    area_m2: float
    floor_current: int
    floor_total: int
    year_centered: int
    dist_to_center_km: float
    has_lift: bool
    has_balcony_terrace: bool
    has_parking_spot: bool
    heat_Centrinis: bool
    heat_Dujinis: bool
    heat_Elektra: bool
    district: Optional[str] = "Other"  # District for categorical encoding
    is_rental: bool

class ManualPredictionRequest(BaseModel):
    manual_data: ManualDataRequest

class PredictionResponse(BaseModel):
    success: bool
    price_per_m2: Optional[float] = None
    total_price: Optional[float] = None
    confidence: Optional[float] = None
    listing_price: Optional[float] = None  # Actual price from aruodas listing
    price_difference: Optional[float] = None  # Our prediction - listing price
    price_difference_percent: Optional[float] = None  # Percentage difference
    deal_rating: Optional[str] = None  # "GOOD_DEAL", "FAIR_PRICE", "OVERPRICED"
    features: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, str]] = None
    shap_explanation: Optional[Dict[str, Any]] = None  # SHAP-based explanation
    error: Optional[str] = None

class StatsResponse(BaseModel):
    total_predictions: int
    average_price_per_m2: float
    district_stats: List[Dict[str, Any]]
    price_trends: List[Dict[str, Any]]
    last_updated: datetime

class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    status: str
    model_loaded: bool
    timestamp: datetime
    version: str

# Cache for storing recent predictions (in production, use Redis)
prediction_cache = {}

# Stats cache (mock data for now)
MOCK_STATS = {
    "total_predictions": 47892,
    "average_price_per_m2": 15.74,
    "district_stats": [
        {"district": "Senamiestis", "avg_price": 2100, "listings": 342},
        {"district": "Žirmūnai", "avg_price": 1580, "listings": 456},
        {"district": "Antakalnis", "avg_price": 1750, "listings": 289},
        {"district": "Šnipiškės", "avg_price": 1820, "listings": 198},
        {"district": "Užupis", "avg_price": 1950, "listings": 176},
        {"district": "Naujamiestis", "avg_price": 1650, "listings": 523},
        {"district": "Vilkpėdė", "avg_price": 1450, "listings": 387},
        {"district": "Karoliniškės", "avg_price": 1420, "listings": 412},
    ],
    "price_trends": [
        {"month": "2024-01", "avg_price": 1450},
        {"month": "2024-02", "avg_price": 1520},
        {"month": "2024-03", "avg_price": 1480},
        {"month": "2024-04", "avg_price": 1610},
        {"month": "2024-05", "avg_price": 1680},
        {"month": "2024-06", "avg_price": 1750},
        {"month": "2024-07", "avg_price": 1820},
        {"month": "2024-08", "avg_price": 1890},
    ]
}

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        timestamp=datetime.now(),
        version="1.0.0"
    )

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict rental price for a given Aruodas.lt listing
    🆕 NOW RUNS BOTH OLD AND NEW MODELS FOR A/B TESTING!
    Returns NEW model prediction to user, logs both for comparison
    """
    if dual_predictor is None and model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models not loaded"
        )

    url_str = str(request.url)

    # Normalize mobile/English URLs to standard desktop URLs
    # Handles: m.aruodas.lt, en.aruodas.lt, m.en.aruodas.lt -> www.aruodas.lt
    original_url = url_str
    url_str = url_str.replace("//m.en.aruodas.lt/", "//www.aruodas.lt/")
    url_str = url_str.replace("//en.aruodas.lt/", "//www.aruodas.lt/")
    url_str = url_str.replace("//m.aruodas.lt/", "//www.aruodas.lt/")
    if url_str != original_url:
        logger.info(f"📱 Normalized URL to: {url_str}")

    # Check if URL is from aruodas.lt
    if "aruodas.lt" not in url_str:
        return PredictionResponse(
            success=False,
            error="Please provide a valid aruodas.lt listing URL"
        )

    # Check cache
    if url_str in prediction_cache:
        cached_result = prediction_cache[url_str]
        if datetime.now() - cached_result["timestamp"] < timedelta(minutes=5):
            logger.info(f"📦 Returning cached prediction for {url_str}")
            return cached_result["response"]

    try:
        # 🚀 RUN DUAL PREDICTION (both old and new models)
        if dual_predictor:
            logger.info(f"🔬 Running A/B Test: Old Model vs New Model")
            ab_result = await run_dual_prediction(url_str, dual_predictor, request.user_id)

            # If new model succeeded, use its prediction
            if ab_result.get("success") and ab_result["new_model"].get("success"):
                new_model_data = ab_result["new_model"]

                # Generate analysis for the new model prediction
                analysis = generate_analysis(
                    new_model_data["price_per_m2"],
                    new_model_data["total_price"],
                    new_model_data["features_used"]
                )

                # Calculate confidence
                confidence = calculate_confidence(new_model_data["features_used"])

                # Extract listing price and calculate deal rating
                listing_price = None
                price_diff = None
                price_diff_pct = None
                deal_rating = None

                # Get actual price from ab_result (already extracted in ab_testing.py)
                if ab_result.get("actual_price") and ab_result["actual_price"].get("actual_price_total"):
                    listing_price = ab_result["actual_price"]["actual_price_total"]
                    logger.info(f"💰 Listing price from ab_result: €{listing_price}")

                    if listing_price:
                        price_diff, price_diff_pct, deal_rating = calculate_deal_rating(
                            new_model_data["total_price"],
                            listing_price
                        )
                        logger.info(f"📊 Deal rating: {deal_rating} ({price_diff_pct:+.1f}%)")

                # Generate SHAP explanation
                shap_explanation = None
                if shap_explainer:
                    try:
                        shap_explanation = get_shap_explanation(new_model_data["features_used"])
                        logger.info(f"🧠 SHAP explanation generated")
                    except Exception as e:
                        logger.warning(f"⚠️ SHAP explanation failed: {e}")

                response = PredictionResponse(
                    success=True,
                    price_per_m2=new_model_data["price_per_m2"],
                    total_price=new_model_data["total_price"],
                    confidence=confidence,
                    listing_price=listing_price,
                    price_difference=price_diff,
                    price_difference_percent=price_diff_pct,
                    deal_rating=deal_rating,
                    features=new_model_data["features_used"],
                    analysis=analysis,
                    shap_explanation=shap_explanation
                )

                # Cache the result
                prediction_cache[url_str] = {
                    "timestamp": datetime.now(),
                    "response": response
                }

                logger.info(f"✅ Returned NEW model prediction: €{response.price_per_m2}/m²")
                logger.info(f"📊 Comparison: {ab_result['comparison'].get('diff_pct_per_m2', 0):+.1f}% difference")

                return response

            # If new model failed but old model succeeded, fall back to old model
            elif ab_result["old_model"].get("success"):
                logger.warning("⚠️  New model failed, falling back to old model")
                old_model_data = ab_result["old_model"]

                analysis = generate_analysis(
                    old_model_data["price_per_m2"],
                    old_model_data["total_price"],
                    old_model_data["features_used"]
                )

                confidence = calculate_confidence(old_model_data["features_used"])

                response = PredictionResponse(
                    success=True,
                    price_per_m2=old_model_data["price_per_m2"],
                    total_price=old_model_data["total_price"],
                    confidence=confidence,
                    features=old_model_data["features_used"],
                    analysis=analysis
                )

                return response
            else:
                raise Exception("Both models failed")

        # Fallback to old model only (if dual predictor not available)
        else:
            logger.warning("⚠️  A/B testing not available, using old model only")
            logger.info(f"Scraping listing: {url_str}")
            raw_data = scrape_listing(url_str)

            logger.info("Processing features")
            features_df = featurise(raw_data)

            logger.info("Making prediction")
            pred_price_pm2 = model.predict(features_df)[0]

            area = features_df["area_m2"].iloc[0]
            total_price = pred_price_pm2 * area if pd.notnull(area) else None

            feature_dict = features_df.iloc[0].to_dict()
            feature_dict = {k: (v if pd.notnull(v) else None) for k, v in feature_dict.items()}

            analysis = generate_analysis(pred_price_pm2, total_price, feature_dict)
            confidence = calculate_confidence(feature_dict)

            response = PredictionResponse(
                success=True,
                price_per_m2=round(pred_price_pm2, 2),
                total_price=round(total_price, 0) if total_price else None,
                confidence=confidence,
                features=feature_dict,
                analysis=analysis
            )

            prediction_cache[url_str] = {
                "timestamp": datetime.now(),
                "response": response
            }

            return response

    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        return PredictionResponse(
            success=False,
            error=f"Failed to process listing: {str(e)}"
        )

@app.post("/api/predict-manual", response_model=PredictionResponse)
async def predict_manual(request: ManualPredictionRequest):
    """
    Predict rental price from manually entered property data.
    NOW USES THE NEW MODEL (same as URL scraper) for consistency!
    """
    if dual_predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )

    try:
        data = request.manual_data

        # Prepare features in the exact format the NEW model expects
        # Use the same district categories and feature order as the new model
        from ab_testing import _coerce_dtypes_and_order

        # Build feature dict matching the new model's expected format
        features_dict = {
            'rooms': float(data.rooms),
            'area_m2': float(data.area_m2),
            'floor_current': float(data.floor_current),
            'floor_total': float(data.floor_total),
            'year_centered': float(data.year_centered),
            'dist_to_center_km': float(data.dist_to_center_km),
            'has_lift': float(int(data.has_lift)),
            'has_balcony_terrace': float(int(data.has_balcony_terrace)),
            'has_parking_spot': float(int(data.has_parking_spot)),
            'heat_Centrinis': float(int(data.heat_Centrinis)),
            'heat_Dujinis': float(int(data.heat_Dujinis)),
            'heat_Elektra': float(int(data.heat_Elektra)),
        }

        # Create DataFrame
        features_df = pd.DataFrame([features_dict])

        # Handle district encoding - validate against known categories
        district_val = data.district if data.district else "Other"
        if district_val not in dual_predictor.district_categories:
            logger.warning(f"Unknown district '{district_val}', mapping to 'Other'")
            district_val = "Other"

        features_df["district_encoded"] = pd.Categorical(
            [district_val],
            categories=dual_predictor.district_categories
        )

        # Apply the same dtype coercion and column ordering as URL scraper
        features_df = _coerce_dtypes_and_order(
            features_df,
            dual_predictor.district_categories,
            dual_predictor.feature_order
        )

        logger.info(f"Making prediction with manual data (NEW MODEL): {features_dict}")
        logger.info(f"District: {district_val}")

        # Make prediction using NEW model
        pred_price_pm2 = dual_predictor.new_model.predict(features_df)[0]
        total_price = pred_price_pm2 * data.area_m2

        # High confidence for complete manual data
        confidence = 95.0

        # Generate analysis using the same function as URL scraper
        analysis = generate_analysis(
            pred_price_pm2,
            total_price,
            features_dict
        )

        # Generate SHAP explanation
        shap_explanation = None
        if shap_explainer:
            try:
                # Add district to features_dict for SHAP
                features_for_shap = features_dict.copy()
                features_for_shap["district_encoded"] = district_val
                shap_explanation = get_shap_explanation(features_for_shap)
                logger.info(f"🧠 SHAP explanation generated for manual prediction")
            except Exception as e:
                logger.warning(f"⚠️ SHAP explanation failed: {e}")

        result = PredictionResponse(
            success=True,
            price_per_m2=round(float(pred_price_pm2), 2),
            total_price=round(float(total_price), 2),
            confidence=confidence,
            features={k: (float(v) if isinstance(v, (int, float, np.number)) else str(v))
                     for k, v in features_df.iloc[0].to_dict().items()},
            analysis=analysis,
            shap_explanation=shap_explanation
        )

        logger.info(f"✅ Manual prediction (NEW MODEL): €{result.price_per_m2}/m² (€{result.total_price} total)")
        return result

    except Exception as e:
        logger.error(f"❌ Failed to process manual data: {str(e)}")
        logger.exception(e)  # Log full traceback
        return PredictionResponse(
            success=False,
            error=f"Failed to process manual data: {str(e)}"
        )

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get market statistics (free tier)
    """
    return StatsResponse(
        total_predictions=MOCK_STATS["total_predictions"],
        average_price_per_m2=MOCK_STATS["average_price_per_m2"],
        district_stats=MOCK_STATS["district_stats"],
        price_trends=MOCK_STATS["price_trends"],
        last_updated=datetime.now()
    )

@app.get("/api/districts")
async def get_districts():
    """
    Get list of districts with average prices
    """
    return {
        "success": True,
        "districts": MOCK_STATS["district_stats"]
    }

@app.get("/api/trends")
async def get_trends():
    """
    Get price trends over time
    """
    return {
        "success": True,
        "trends": MOCK_STATS["price_trends"],
        "forecast": [
            {"month": "2024-09", "avg_price": 1920, "predicted": True},
            {"month": "2024-10", "avg_price": 1950, "predicted": True},
            {"month": "2024-11", "avg_price": 1980, "predicted": True},
        ]
    }

def generate_analysis(price_pm2: float, total_price: float, features: dict) -> dict:
    """
    Generate analysis insights based on prediction
    """
    analysis = {}
    
    # Price assessment
    avg_price = MOCK_STATS["average_price_per_m2"]
    if price_pm2 < avg_price * 0.85:
        analysis["value_rating"] = "EXCELLENT"
        analysis["value_description"] = "This property is significantly below market average"
    elif price_pm2 < avg_price * 0.95:
        analysis["value_rating"] = "GOOD"
        analysis["value_description"] = "This property offers good value for money"
    elif price_pm2 < avg_price * 1.05:
        analysis["value_rating"] = "FAIR"
        analysis["value_description"] = "This property is priced at market rate"
    elif price_pm2 < avg_price * 1.15:
        analysis["value_rating"] = "ABOVE_AVERAGE"
        analysis["value_description"] = "This property is slightly above market average"
    else:
        analysis["value_rating"] = "PREMIUM"
        analysis["value_description"] = "This property is in the premium segment"
    
    # Location insights
    if features.get("dist_to_center_km"):
        dist = features["dist_to_center_km"]
        if dist < 2:
            analysis["location_rating"] = "EXCELLENT"
            analysis["location_insight"] = f"Prime location, only {dist:.1f}km from city center"
        elif dist < 4:
            analysis["location_rating"] = "GOOD"
            analysis["location_insight"] = f"Good location, {dist:.1f}km from city center"
        else:
            analysis["location_rating"] = "SUBURBAN"
            analysis["location_insight"] = f"Suburban location, {dist:.1f}km from city center"
    
    # Amenities
    amenity_score = 0
    amenity_features = []
    
    if features.get("has_lift"):
        amenity_score += 1
        amenity_features.append("elevator")
    if features.get("has_balcony_terrace"):
        amenity_score += 1
        amenity_features.append("balcony/terrace")
    if features.get("has_parking_spot"):
        amenity_score += 1
        amenity_features.append("parking")
    if features.get("heat_Centrinis"):
        amenity_score += 1
        amenity_features.append("central heating")
    
    if amenity_score >= 3:
        analysis["amenities_rating"] = "EXCELLENT"
        analysis["amenities_description"] = f"Well-equipped with {', '.join(amenity_features)}"
    elif amenity_score >= 2:
        analysis["amenities_rating"] = "GOOD"
        analysis["amenities_description"] = f"Good amenities: {', '.join(amenity_features)}"
    else:
        analysis["amenities_rating"] = "BASIC"
        analysis["amenities_description"] = "Basic amenities"
    
    return analysis

def calculate_confidence(features: dict) -> float:
    """
    Calculate prediction confidence based on feature completeness
    """
    important_features = [
        'area_m2', 'rooms', 'floor_current', 'floor_total',
        'year_centered', 'dist_to_center_km'
    ]

    available = sum(1 for f in important_features if features.get(f) is not None)
    confidence = (available / len(important_features)) * 100

    # Adjust based on data quality
    if features.get("age_days") and features["age_days"] > 30:
        confidence *= 0.95  # Slightly lower confidence for older listings

    return round(confidence, 1)

def extract_listing_price(scraped_data: dict) -> Optional[float]:
    """
    Extract the listing price from scraped aruodas data
    """
    # Price is usually in "Kaina" field or similar
    price_str = scraped_data.get("Kaina", [None])[0] if isinstance(scraped_data.get("Kaina"), list) else scraped_data.get("Kaina")

    if price_str:
        # Extract number from string like "850 €/mėn." or "850"
        import re
        match = re.search(r'(\d+(?:\s*\d+)*)', str(price_str))
        if match:
            price = float(match.group(1).replace(' ', ''))
            return price
    return None

def calculate_deal_rating(predicted_price: float, listing_price: float) -> tuple:
    """
    Calculate deal rating based on price difference
    Returns: (difference_amount, difference_percent, rating)
    """
    difference = predicted_price - listing_price
    difference_percent = (difference / listing_price * 100) if listing_price > 0 else 0

    # Determine rating
    if difference_percent > 5:  # Our prediction is 5%+ higher = good deal
        rating = "GOOD_DEAL"
    elif difference_percent < -1:  # Our prediction is 1%+ lower = overpriced
        rating = "OVERPRICED"
    else:  # Within range = fair price
        rating = "FAIR_PRICE"

    return round(difference, 2), round(difference_percent, 1), rating


def get_shap_explanation(features: dict) -> Optional[Dict[str, Any]]:
    """
    Generate SHAP explanation for a prediction.
    Converts features dict to DataFrame and calls SHAP explainer.
    """
    if shap_explainer is None:
        return None

    try:
        # Load feature order and district categories
        with open("feature_order.json", "r") as f:
            feature_order = json.load(f)
        with open("district_categories.json", "r") as f:
            district_categories = json.load(f)

        # Build feature DataFrame
        feature_data = {}
        for feat in feature_order:
            if feat == "district_encoded":
                # Handle district categorical
                district_val = features.get("district_encoded", "Other")
                if isinstance(district_val, str):
                    feature_data[feat] = district_val
                else:
                    feature_data[feat] = str(district_val) if district_val else "Other"
            else:
                # Numeric features - handle None, NaN, and various types
                val = features.get(feat)
                try:
                    if val is None:
                        feature_data[feat] = 0.0
                    elif isinstance(val, (int, float, np.number)):
                        if pd.isna(val):
                            feature_data[feat] = 0.0
                        else:
                            feature_data[feat] = float(val)
                    elif isinstance(val, str):
                        feature_data[feat] = float(val) if val else 0.0
                    else:
                        feature_data[feat] = 0.0
                except (ValueError, TypeError):
                    feature_data[feat] = 0.0

        # Create DataFrame
        df = pd.DataFrame([feature_data])
        df["district_encoded"] = pd.Categorical(
            df["district_encoded"],
            categories=district_categories
        )
        df = df[feature_order]

        # Get SHAP explanation
        explanation = shap_explainer.explain(df)

        # Add area for total price calculation context
        if "area_m2" in features and features["area_m2"]:
            explanation["area_m2"] = float(features["area_m2"])

        return explanation

    except Exception as e:
        logger.error(f"❌ get_shap_explanation error: {e}")
        return None


# ============================================================================
# A/B TESTING ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/api/ab-test/stats")
async def get_ab_stats():
    """
    Get comprehensive A/B testing statistics
    Shows comparison between old and new models
    """
    try:
        stats = await get_ab_test_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Failed to get A/B stats: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/ab-test/history")
async def get_ab_history(limit: int = 50):
    """
    Get recent A/B test history
    """
    try:
        history = await get_ab_test_history(limit)
        return {
            "success": True,
            "count": len(history),
            "data": history
        }
    except Exception as e:
        logger.error(f"Failed to get A/B history: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/ab-test/summary")
async def get_ab_summary():
    """
    Get quick summary of A/B testing results
    Perfect for dashboard display
    """
    try:
        stats = await get_ab_test_stats()

        if "error" in stats:
            return {
                "success": False,
                "error": stats["error"]
            }

        summary = {
            "total_tests": stats.get("total_tests", 0),
            "successful_tests": stats.get("successful_tests", 0),
            "avg_difference_pct": stats.get("avg_diff_pct", 0),
            "agreement": {
                "high": stats.get("high_agreement", 0),
                "medium": stats.get("medium_agreement", 0),
                "low": stats.get("low_agreement", 0)
            },
            "model_comparison": {
                "old_avg_price_pm2": stats.get("old_model_avg_pm2", 0),
                "new_avg_price_pm2": stats.get("new_model_avg_pm2", 0),
                "new_model_higher": stats.get("new_model_higher_count", 0),
                "old_model_higher": stats.get("new_model_lower_count", 0)
            }
        }

        return {
            "success": True,
            "data": summary
        }

    except Exception as e:
        logger.error(f"Failed to get A/B summary: {e}")
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn, os
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),  # use Railway's port if available
        reload=True
    )
