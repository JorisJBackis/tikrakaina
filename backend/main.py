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

# Import our model utilities
from model_utils import scrape_listing, featurise, predict_from_url

# Import SumUp routes
from sumup_routes import router as sumup_router, webhook_router

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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://vilrent.lt",
        "https://www.vilrent.lt",
        "https://vilrent.com",
        "https://www.vilrent.com",
        "https://tikrakaina-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once at startup
MODEL_PATH = Path("model.pkl")
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None

# Include routers
app.include_router(sumup_router)
app.include_router(webhook_router)

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
    age_days: int = 20
    is_rental: bool

class ManualPredictionRequest(BaseModel):
    manual_data: ManualDataRequest

class PredictionResponse(BaseModel):
    success: bool
    price_per_m2: Optional[float] = None
    total_price: Optional[float] = None
    confidence: Optional[float] = None
    features: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, str]] = None
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
    """
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    url_str = str(request.url)
    
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
            logger.info(f"Returning cached prediction for {url_str}")
            return cached_result["response"]
    
    try:
        # Scrape the listing
        logger.info(f"Scraping listing: {url_str}")
        raw_data = scrape_listing(url_str)
        
        # Process features
        logger.info("Processing features")
        features_df = featurise(raw_data)
        
        # Make prediction
        logger.info("Making prediction")
        pred_price_pm2 = model.predict(features_df)[0]
        
        # Get area for total price calculation
        area = features_df["area_m2"].iloc[0]
        total_price = pred_price_pm2 * area if pd.notnull(area) else None
        
        # Prepare feature dictionary
        feature_dict = features_df.iloc[0].to_dict()
        feature_dict = {k: (v if pd.notnull(v) else None) for k, v in feature_dict.items()}
        
        # Generate analysis (simplified for MVP)
        analysis = generate_analysis(pred_price_pm2, total_price, feature_dict)
        
        # Calculate confidence (mock for now)
        confidence = calculate_confidence(feature_dict)
        
        response = PredictionResponse(
            success=True,
            price_per_m2=round(pred_price_pm2, 2),
            total_price=round(total_price, 0) if total_price else None,
            confidence=confidence,
            features=feature_dict,
            analysis=analysis
        )
        
        # Cache the result
        prediction_cache[url_str] = {
            "timestamp": datetime.now(),
            "response": response
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return PredictionResponse(
            success=False,
            error=f"Failed to process listing: {str(e)}"
        )

@app.post("/api/predict-manual", response_model=PredictionResponse)
async def predict_manual(request: ManualPredictionRequest):
    """
    Predict rental price from manually entered property data
    """
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    try:
        data = request.manual_data
        
        # Create a DataFrame with the manual data in the format expected by the model
        features_df = pd.DataFrame([{
            'rooms': data.rooms,
            'area_m2': data.area_m2,
            'floor_current': data.floor_current,
            'floor_total': data.floor_total,
            'year_centered': data.year_centered,
            'dist_to_center_km': data.dist_to_center_km,
            'has_lift': int(data.has_lift),
            'has_balcony_terrace': int(data.has_balcony_terrace),
            'has_parking_spot': int(data.has_parking_spot),
            'heat_Centrinis': int(data.heat_Centrinis),
            'heat_Dujinis': int(data.heat_Dujinis),
            'heat_Elektra': int(data.heat_Elektra),
            'age_days': data.age_days
        }])
        
        logger.info(f"Making prediction with manual data: {features_df.iloc[0].to_dict()}")
        
        # Make prediction
        pred_price_pm2 = model.predict(features_df)[0]
        total_price = pred_price_pm2 * data.area_m2
        
        # Calculate confidence (mock for now, based on data completeness)
        confidence = 95.0  # High confidence for complete manual data
        
        # Analysis based on the data
        analysis = {
            "value_rating": "FAIR" if pred_price_pm2 < 15 else "GOOD" if pred_price_pm2 < 18 else "EXCELLENT",
            "location_rating": "EXCELLENT" if data.dist_to_center_km < 3 else "GOOD" if data.dist_to_center_km < 7 else "BASIC",
            "amenities_rating": "EXCELLENT" if (data.has_lift + data.has_balcony_terrace + data.has_parking_spot) >= 2 else "GOOD" if (data.has_lift + data.has_balcony_terrace + data.has_parking_spot) == 1 else "BASIC"
        }
        
        result = PredictionResponse(
            success=True,
            price_per_m2=round(pred_price_pm2, 2),
            total_price=round(total_price, 2),
            confidence=confidence,
            features=features_df.iloc[0].to_dict(),
            analysis=analysis
        )
        
        logger.info(f"Manual prediction successful: €{result.price_per_m2}/m² (€{result.total_price} total)")
        return result
        
    except Exception as e:
        logger.error(f"Failed to process manual data: {str(e)}")
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

if __name__ == "__main__":
    import uvicorn, os
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),  # use Railway's port if available
        reload=True
    )
