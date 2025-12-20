#!/usr/bin/env python3
"""
SHAP Explainer Module for TikraKaina
Provides model explanations using TreeSHAP for LightGBM predictions.

Optimized for production:
- Uses kmeans-summarized background data for speed
- Caches explainer at startup
- Provides human-readable explanations in Lithuanian
"""

import json
import logging
import pickle
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import shap

logger = logging.getLogger(__name__)

# Human-readable feature names in Lithuanian
FEATURE_NAMES_LT = {
    "rooms": "Kambariai",
    "floor_current": "Aukštas",
    "floor_total": "Aukštų skaičius",
    "area_m2": "Plotas",
    "year_centered": "Statybos metai",
    "dist_to_center_km": "Atstumas iki centro",
    "heat_Centrinis": "Centrinis šildymas",
    "heat_Dujinis": "Dujinis šildymas",
    "heat_Elektra": "Elektrinis šildymas",
    "has_lift": "Liftas",
    "has_balcony_terrace": "Balkonas/Terasa",
    "has_parking_spot": "Parkavimo vieta",
    "district_encoded": "Rajonas"
}

# Feature descriptions for tooltips
FEATURE_DESCRIPTIONS = {
    "rooms": "Kambarių skaičius bute",
    "floor_current": "Kuriame aukšte yra butas",
    "floor_total": "Kiek aukštų turi pastatas",
    "area_m2": "Bendras buto plotas kvadratiniais metrais",
    "year_centered": "Pastato statybos metai (santykiniai)",
    "dist_to_center_km": "Atstumas iki Vilniaus centro kilometrais",
    "heat_Centrinis": "Ar butas turi centrinį šildymą",
    "heat_Dujinis": "Ar butas turi dujinį šildymą",
    "heat_Elektra": "Ar butas turi elektrinį šildymą",
    "has_lift": "Ar pastate yra liftas",
    "has_balcony_terrace": "Ar butas turi balkoną arba terasą",
    "has_parking_spot": "Ar yra parkavimo vieta",
    "district_encoded": "Vilniaus rajonas, kuriame yra butas"
}

# District average prices per m² (from actual map data - vilnius_rent_ppm2_by_eldership.html)
# Uses nominative case district names (as used in our model)
DISTRICT_AVERAGES = {
    "Senamiestis": 19.1,
    "Šnipiškės": 18.09,
    "Naujamiestis": 17.84,
    "Žvėrynas": 17.67,
    "Rasos": 17.36,
    "Viršuliškės": 15.07,
    "Žirmūnai": 14.73,
    "Naujininkai": 14.66,
    "Vilkpėdė": 14.33,
    "Antakalnis": 14.29,
    "Paneriai": 14.2,
    "Pilaitė": 14.0,
    "Lazdynai": 13.76,
    "Verkiai": 13.07,
    "Karoliniškės": 13.04,
    "Justiniškės": 12.5,
    "Naujoji Vilnia": 12.38,
    "Pašilaičiai": 12.1,
    "Šeškinė": 12.0,
    "Fabijoniškės": 11.84,
    "Grigiškės": 11.48,
}


class ShapExplainer:
    """
    SHAP-based model explainer for rental price predictions.
    Uses TreeSHAP with kmeans-optimized background data for fast explanations.
    """

    def __init__(
        self,
        model_path: str = "model_new.pkl",
        feature_order_path: str = "feature_order.json",
        district_categories_path: str = "district_categories.json",
        training_data_path: str = "new-map/aruodas_rent_enriched_20November.csv",
        background_samples: int = 100
    ):
        self.model = None
        self.explainer = None
        self.feature_order = None
        self.district_categories = None
        self.expected_value = None
        self.background_samples = background_samples

        self._load_model(model_path)
        self._load_configs(feature_order_path, district_categories_path)
        self._create_explainer(training_data_path)

    def _load_model(self, model_path: str):
        """Load the LightGBM model"""
        try:
            with open(model_path, "rb") as f:
                self.model = pickle.load(f)
            logger.info("✅ SHAP: Model loaded successfully")
        except Exception as e:
            logger.error(f"❌ SHAP: Failed to load model: {e}")
            raise

    def _load_configs(self, feature_order_path: str, district_categories_path: str):
        """Load feature order and district categories"""
        try:
            with open(feature_order_path, "r") as f:
                self.feature_order = json.load(f)

            with open(district_categories_path, "r") as f:
                self.district_categories = pd.CategoricalDtype(categories=json.load(f))

            logger.info(f"✅ SHAP: Configs loaded ({len(self.feature_order)} features)")
        except Exception as e:
            logger.error(f"❌ SHAP: Failed to load configs: {e}")
            raise

    def _create_explainer(self, training_data_path: str):
        """
        Create SHAP TreeExplainer with kmeans-summarized background data.
        This is the key optimization for production speed.
        """
        try:
            # Load training data
            training_data_file = Path(training_data_path)
            if not training_data_file.exists():
                logger.warning(f"⚠️ SHAP: Training data not found at {training_data_path}")
                logger.info("🔄 SHAP: Creating explainer without background data (will use interventional)")
                self.explainer = shap.TreeExplainer(self.model)
                self.expected_value = self.explainer.expected_value
                return

            df = pd.read_csv(training_data_file)
            logger.info(f"📊 SHAP: Loaded {len(df)} training samples")

            # Prepare features in correct order
            background_df = self._prepare_background_data(df)

            if background_df is None or len(background_df) == 0:
                logger.warning("⚠️ SHAP: Could not prepare background data")
                self.explainer = shap.TreeExplainer(self.model)
                self.expected_value = self.explainer.expected_value
                return

            logger.info(f"🔄 SHAP: Creating TreeExplainer...")

            # For LightGBM with categorical features, we must use tree_path_dependent
            # and NOT pass background data (SHAP limitation)
            self.explainer = shap.TreeExplainer(
                self.model,
                feature_perturbation="tree_path_dependent"
            )

            self.expected_value = self.explainer.expected_value
            logger.info(f"📊 SHAP: Raw expected_value from explainer: {self.expected_value}")

            # If expected_value is None, compute from model predictions on training data
            if self.expected_value is None:
                logger.info("📊 SHAP: Computing expected_value from training data predictions...")
                predictions = self.model.predict(background_df)
                self.expected_value = float(np.mean(predictions))
                logger.info(f"📊 SHAP: Computed expected_value = {self.expected_value:.2f}")

            # Handle array expected_value
            base_val = self.expected_value
            if hasattr(base_val, '__len__') and len(base_val) > 0:
                base_val = float(base_val[0])
            elif base_val is not None:
                base_val = float(base_val)
            else:
                # Last resort fallback
                base_val = 14.0
            logger.info(f"✅ SHAP: Explainer created (base value: €{base_val:.2f}/m²)")

        except Exception as e:
            logger.error(f"❌ SHAP: Failed to create explainer: {e}")
            import traceback
            logger.error(f"❌ SHAP: Traceback: {traceback.format_exc()}")
            # Fallback to simple explainer
            self.explainer = shap.TreeExplainer(self.model)
            self.expected_value = self.explainer.expected_value

            # If expected_value is still None, use a reasonable default (~14 €/m² for Vilnius average)
            if self.expected_value is None:
                logger.warning("⚠️ SHAP: Fallback expected_value is None, using Vilnius average (14.0 €/m²)")
                self.expected_value = 14.0

            # Log the fallback expected value
            base_val = self.expected_value
            if hasattr(base_val, '__len__') and len(base_val) > 0:
                base_val = float(base_val[0])
            else:
                base_val = float(base_val)
            logger.info(f"✅ SHAP: Fallback explainer created (base value: €{base_val:.2f}/m²)")

    def _prepare_background_data(self, df: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Prepare training data in the format expected by the model"""
        try:
            # Select and prepare features
            result = pd.DataFrame()

            # Numeric features
            numeric_cols = [
                "rooms", "floor_current", "floor_total", "area_m2",
                "year_centered", "dist_to_center_km",
                "heat_Centrinis", "heat_Dujinis", "heat_Elektra",
                "has_lift", "has_balcony_terrace", "has_parking_spot"
            ]

            for col in numeric_cols:
                if col in df.columns:
                    result[col] = pd.to_numeric(df[col], errors='coerce')
                else:
                    result[col] = 0

            # Fill NaN values with median (required for kmeans)
            for col in numeric_cols:
                if result[col].isna().any():
                    median_val = result[col].median()
                    result[col] = result[col].fillna(median_val)
                    logger.info(f"📊 SHAP: Filled {col} NaNs with median {median_val:.2f}")

            # District categorical
            if "district" in df.columns:
                result["district_encoded"] = pd.Categorical(
                    df["district"].fillna("Other"),
                    dtype=self.district_categories
                )
            else:
                result["district_encoded"] = pd.Categorical(
                    ["Other"] * len(df),
                    dtype=self.district_categories
                )

            # Reorder columns
            result = result[self.feature_order]

            # Drop rows with too many NaNs
            result = result.dropna(thresh=len(self.feature_order) - 3)

            logger.info(f"📊 SHAP: Prepared {len(result)} background samples")
            return result

        except Exception as e:
            logger.error(f"❌ SHAP: Error preparing background data: {e}")
            return None

    def explain(self, features_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate SHAP explanation for a single prediction.

        Args:
            features_df: DataFrame with features in correct order

        Returns:
            Dictionary with SHAP values and human-readable explanations
        """
        if self.explainer is None:
            logger.error("❌ SHAP: Explainer not initialized")
            return {"error": "Explainer not initialized"}

        try:
            # Ensure correct column order
            features_df = features_df[self.feature_order].copy()
            logger.debug(f"📊 SHAP: Explaining prediction for features: {features_df.iloc[0].to_dict()}")

            # Get SHAP values
            shap_values = self.explainer.shap_values(features_df)
            logger.debug(f"📊 SHAP: Got shap_values type={type(shap_values)}, shape={getattr(shap_values, 'shape', 'N/A')}")

            # Handle different return formats
            if isinstance(shap_values, list):
                shap_values = shap_values[0]  # For multi-output models

            # Get values for first (only) row
            values = shap_values[0] if len(shap_values.shape) > 1 else shap_values
            logger.debug(f"📊 SHAP: Final values shape={values.shape}, sum={np.sum(values):.4f}")

            # Build explanation
            # Handle expected_value which might be array or scalar
            base_val = self.expected_value
            if hasattr(base_val, '__len__') and len(base_val) > 0:
                base_val = base_val[0]

            logger.debug(f"📊 SHAP: base_val={base_val}, predicted={float(base_val) + np.sum(values):.2f}")

            explanation = self._build_explanation(
                shap_values=values,
                feature_values=features_df.iloc[0],
                base_value=float(base_val)
            )

            logger.info(f"✅ SHAP: Explanation generated - base={explanation['base_value']:.2f}, predicted={explanation['predicted_value']:.2f}, +{len(explanation['top_positive'])} -{len(explanation['top_negative'])} factors")

            return explanation

        except Exception as e:
            logger.error(f"❌ SHAP: Explanation failed: {e}")
            import traceback
            logger.error(f"❌ SHAP: Traceback: {traceback.format_exc()}")
            return {"error": str(e)}

    def _build_explanation(
        self,
        shap_values: np.ndarray,
        feature_values: pd.Series,
        base_value: float
    ) -> Dict[str, Any]:
        """Build human-readable explanation from SHAP values"""

        # Extract district for comparison
        district = None
        if "district_encoded" in feature_values.index:
            district_val = feature_values["district_encoded"]
            district = str(district_val) if pd.notnull(district_val) else None

        # Create feature contributions list
        contributions = []

        for i, feature in enumerate(self.feature_order):
            shap_val = float(shap_values[i])
            feat_val = feature_values[feature]

            # Format feature value for display
            if feature == "district_encoded":
                display_val = str(feat_val)
            elif feature == "year_centered":
                # Convert back to actual year
                display_val = f"{int(feat_val + 2000)}" if pd.notnull(feat_val) else "Nežinoma"
            elif feature in ["has_lift", "has_balcony_terrace", "has_parking_spot",
                            "heat_Centrinis", "heat_Dujinis", "heat_Elektra"]:
                display_val = "Taip" if feat_val == 1 else "Ne"
            elif feature == "dist_to_center_km":
                display_val = f"{feat_val:.1f} km" if pd.notnull(feat_val) else "Nežinoma"
            elif feature == "area_m2":
                display_val = f"{feat_val:.1f} m²" if pd.notnull(feat_val) else "Nežinoma"
            else:
                display_val = str(int(feat_val)) if pd.notnull(feat_val) else "Nežinoma"

            contributions.append({
                "feature": feature,
                "feature_name_lt": FEATURE_NAMES_LT.get(feature, feature),
                "description": FEATURE_DESCRIPTIONS.get(feature, ""),
                "value": feat_val if not isinstance(feat_val, pd.Categorical) else str(feat_val),
                "display_value": display_val,
                "shap_value": round(shap_val, 4),
                "impact_eur_m2": round(shap_val, 2),
                "direction": "positive" if shap_val > 0 else "negative" if shap_val < 0 else "neutral"
            })

        # Sort by absolute impact (most important first)
        contributions_sorted = sorted(
            contributions,
            key=lambda x: abs(x["shap_value"]),
            reverse=True
        )

        # Calculate totals
        total_shap = sum(c["shap_value"] for c in contributions)
        predicted_value = base_value + total_shap

        # Group contributions by direction
        positive_contribs = [c for c in contributions_sorted if c["shap_value"] > 0.01]
        negative_contribs = [c for c in contributions_sorted if c["shap_value"] < -0.01]

        # Build waterfall data (for visualization)
        waterfall = self._build_waterfall(contributions_sorted, base_value)

        # Generate summary text
        summary = self._generate_summary(
            positive_contribs[:3],
            negative_contribs[:3],
            base_value,
            predicted_value
        )

        return {
            "base_value": round(base_value, 2),
            "predicted_value": round(predicted_value, 2),
            "total_shap": round(total_shap, 2),
            "contributions": contributions_sorted,
            "top_positive": positive_contribs[:5],
            "top_negative": negative_contribs[:5],
            "waterfall": waterfall,
            "summary": summary,
            "summary_lt": self._generate_summary_lt(
                positive_contribs[:3],
                negative_contribs[:3],
                base_value,
                predicted_value,
                district
            )
        }

    def _build_waterfall(
        self,
        contributions: List[Dict],
        base_value: float
    ) -> List[Dict]:
        """Build waterfall chart data"""
        waterfall = [
            {
                "label": "Bazinė kaina",
                "label_en": "Base price",
                "value": base_value,
                "cumulative": base_value,
                "type": "base"
            }
        ]

        cumulative = base_value

        # Add top contributions (limit to 8 for readability)
        top_contributions = contributions[:8]

        for contrib in top_contributions:
            if abs(contrib["shap_value"]) < 0.01:
                continue

            cumulative += contrib["shap_value"]
            waterfall.append({
                "label": contrib["feature_name_lt"],
                "label_en": contrib["feature"],
                "value": contrib["shap_value"],
                "cumulative": round(cumulative, 2),
                "display_value": contrib["display_value"],
                "type": "positive" if contrib["shap_value"] > 0 else "negative"
            })

        # Add "other" if there are more contributions
        if len(contributions) > 8:
            other_sum = sum(c["shap_value"] for c in contributions[8:])
            if abs(other_sum) > 0.01:
                cumulative += other_sum
                waterfall.append({
                    "label": "Kiti faktoriai",
                    "label_en": "Other factors",
                    "value": round(other_sum, 2),
                    "cumulative": round(cumulative, 2),
                    "type": "other"
                })

        # Final value
        waterfall.append({
            "label": "Galutinė kaina",
            "label_en": "Final price",
            "value": round(cumulative, 2),
            "cumulative": round(cumulative, 2),
            "type": "total"
        })

        return waterfall

    def _generate_summary(
        self,
        top_positive: List[Dict],
        top_negative: List[Dict],
        base_value: float,
        predicted_value: float
    ) -> str:
        """Generate English summary text"""
        parts = []

        parts.append(f"Starting from the Vilnius average of €{base_value:.2f}/m²:")

        if top_positive:
            increases = [
                f"{c['feature_name_lt']} ({c['display_value']}): +€{c['shap_value']:.2f}"
                for c in top_positive
            ]
            parts.append("Increases: " + ", ".join(increases))

        if top_negative:
            decreases = [
                f"{c['feature_name_lt']} ({c['display_value']}): €{c['shap_value']:.2f}"
                for c in top_negative
            ]
            parts.append("Decreases: " + ", ".join(decreases))

        parts.append(f"Final prediction: €{predicted_value:.2f}/m²")

        return " | ".join(parts)

    def _generate_summary_lt(
        self,
        top_positive: List[Dict],
        top_negative: List[Dict],
        base_value: float,
        predicted_value: float,
        district: Optional[str] = None
    ) -> str:
        """Generate Lithuanian summary text"""
        parts = []

        # Try district average first, fall back to Vilnius average
        district_avg = DISTRICT_AVERAGES.get(district) if district else None

        if district_avg:
            # Compare to district average
            diff = predicted_value - district_avg
            if diff > 0:
                parts.append(f"Jūsų buto kaina yra €{abs(diff):.2f}/m² AUKŠTESNĖ nei rajono ({district}) vidurkis.")
            elif diff < 0:
                parts.append(f"Jūsų buto kaina yra €{abs(diff):.2f}/m² ŽEMESNĖ nei rajono ({district}) vidurkis.")
            else:
                parts.append(f"Jūsų buto kaina atitinka rajono ({district}) vidurkį.")
        else:
            # Fall back to Vilnius average (base_value)
            diff = predicted_value - base_value
            if diff > 0:
                parts.append(f"Jūsų buto kaina yra €{abs(diff):.2f}/m² AUKŠTESNĖ nei Vilniaus vidurkis.")
            elif diff < 0:
                parts.append(f"Jūsų buto kaina yra €{abs(diff):.2f}/m² ŽEMESNĖ nei Vilniaus vidurkis.")
            else:
                parts.append("Jūsų buto kaina atitinka Vilniaus vidurkį.")

        # Use neutral wording: "Kainą labiausiai didina/mažina" instead of "teigiamą/neigiamą įtaką"
        if top_positive:
            main_positive = top_positive[0]
            explanation = ""
            # Add context for area (economies of scale)
            if main_positive['feature'] == 'area_m2':
                explanation = " — mažesni butai paprastai turi aukštesnę kainą už m²"
            parts.append(
                f"Kainą labiausiai didina: {main_positive['feature_name_lt']} "
                f"(+€{main_positive['shap_value']:.2f}/m²){explanation}."
            )

        if top_negative:
            main_negative = top_negative[0]
            explanation = ""
            # Add context for area (economies of scale)
            if main_negative['feature'] == 'area_m2':
                explanation = " — didesni butai paprastai turi žemesnę kainą už m²"
            parts.append(
                f"Kainą labiausiai mažina: {main_negative['feature_name_lt']} "
                f"(€{main_negative['shap_value']:.2f}/m²){explanation}."
            )

        return " ".join(parts)


# Singleton instance for the application
_explainer_instance: Optional[ShapExplainer] = None


def get_explainer() -> ShapExplainer:
    """Get or create the singleton SHAP explainer instance"""
    global _explainer_instance

    if _explainer_instance is None:
        logger.info("🚀 Initializing SHAP Explainer...")
        _explainer_instance = ShapExplainer()
        logger.info("✅ SHAP Explainer ready!")

    return _explainer_instance


def explain_prediction(features_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Convenience function to explain a prediction.

    Args:
        features_df: DataFrame with model features

    Returns:
        SHAP explanation dictionary
    """
    explainer = get_explainer()
    return explainer.explain(features_df)


# Test function
def test_explainer():
    """Test the SHAP explainer with a sample prediction"""
    import json

    print("🧪 Testing SHAP Explainer...")

    # Load configs
    with open("feature_order.json", "r") as f:
        feature_order = json.load(f)

    with open("district_categories.json", "r") as f:
        district_categories = json.load(f)

    # Create sample input
    sample_data = {
        "rooms": 2,
        "floor_current": 3,
        "floor_total": 5,
        "area_m2": 50.0,
        "year_centered": 0,  # Year 2000
        "dist_to_center_km": 3.5,
        "heat_Centrinis": 1,
        "heat_Dujinis": 0,
        "heat_Elektra": 0,
        "has_lift": 1,
        "has_balcony_terrace": 1,
        "has_parking_spot": 0,
        "district_encoded": "Žirmūnai"
    }

    # Create DataFrame
    df = pd.DataFrame([sample_data])
    df["district_encoded"] = pd.Categorical(
        df["district_encoded"],
        categories=district_categories
    )
    df = df[feature_order]

    # Get explanation
    explainer = get_explainer()
    explanation = explainer.explain(df)

    print("\n📊 SHAP Explanation Results:")
    print(f"Base value: €{explanation['base_value']}/m²")
    print(f"Predicted value: €{explanation['predicted_value']}/m²")
    print(f"Total SHAP: €{explanation['total_shap']}/m²")

    print("\n📈 Top Positive Contributions:")
    for c in explanation['top_positive'][:5]:
        print(f"  {c['feature_name_lt']}: {c['display_value']} → +€{c['shap_value']:.2f}/m²")

    print("\n📉 Top Negative Contributions:")
    for c in explanation['top_negative'][:5]:
        print(f"  {c['feature_name_lt']}: {c['display_value']} → €{c['shap_value']:.2f}/m²")

    print("\n🌊 Waterfall:")
    for w in explanation['waterfall']:
        if w['type'] == 'base':
            print(f"  {w['label']}: €{w['value']:.2f}/m²")
        elif w['type'] == 'total':
            print(f"  ─────────────────────────────")
            print(f"  {w['label']}: €{w['value']:.2f}/m²")
        else:
            sign = "+" if w['value'] > 0 else ""
            print(f"  {w['label']}: {sign}€{w['value']:.2f}/m² (= €{w['cumulative']:.2f})")

    print(f"\n📝 Summary (LT): {explanation['summary_lt']}")

    return explanation


if __name__ == "__main__":
    test_explainer()
