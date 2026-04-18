from pathlib import Path
import numpy as np
import pandas as pd
import shap

from .model_loader import pipeline

BASE_DIR = Path(__file__).resolve().parent.parent
TRAIN_PATH = BASE_DIR.parent / "data" / "customer_churn_dataset-training-master.csv"

PREPROCESSOR = pipeline.named_steps["preprocessor"]
MODEL = pipeline.named_steps["model"]


def _load_background_data():
    df = pd.read_csv(TRAIN_PATH)
    X = df.drop(columns=["Churn", "CustomerID"], errors="ignore")
    sample_size = min(100, len(X))
    return X.sample(n=sample_size, random_state=42)


BACKGROUND_DF = _load_background_data()
FEATURE_NAMES = PREPROCESSOR.get_feature_names_out().tolist()

BACKGROUND_TRANSFORMED = PREPROCESSOR.transform(BACKGROUND_DF)
if hasattr(BACKGROUND_TRANSFORMED, "toarray"):
    BACKGROUND_TRANSFORMED = BACKGROUND_TRANSFORMED.toarray()

EXPLAINER = shap.Explainer(
    MODEL,
    BACKGROUND_TRANSFORMED,
    feature_names=FEATURE_NAMES
)


def _format_feature_name(raw_name: str) -> str:
    name = raw_name.replace("num__", "").replace("cat__", "")

    if raw_name.startswith("cat__") and "_" in name:
        field, value = name.rsplit("_", 1)
        return f"{field} = {value}"

    return name


def _make_recommendation(risk_level: str, top_features: list[str]) -> str:
    feature_text = ", ".join(top_features).lower()

    if risk_level == "High":
        if "Payment Delay".lower() in feature_text:
            return "High churn risk. Prioritize payment support, proactive outreach, and a retention incentive."
        if "Support Calls".lower() in feature_text:
            return "High churn risk. Review service issues immediately and assign customer success follow-up."
        return "High churn risk. Escalate to the retention team, review the account, and offer a targeted intervention."

    if risk_level == "Medium":
        return "Medium churn risk. Monitor this customer closely and engage with a loyalty, service, or contract optimization campaign."

    return "Low churn risk. Maintain engagement, reward loyalty, and explore upsell or long-term retention opportunities."


def explain_prediction(data: dict):
    input_df = pd.DataFrame([{
        "Age": data["Age"],
        "Gender": data["Gender"],
        "Tenure": data["Tenure"],
        "Usage Frequency": data["Usage_Frequency"],
        "Support Calls": data["Support_Calls"],
        "Payment Delay": data["Payment_Delay"],
        "Subscription Type": data["Subscription_Type"],
        "Contract Length": data["Contract_Length"],
        "Total Spend": data["Total_Spend"],
        "Last Interaction": data["Last_Interaction"],
    }])

    transformed = PREPROCESSOR.transform(input_df)
    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()

    shap_values = EXPLAINER(transformed)

    values = shap_values.values[0]
    top_indices = np.argsort(np.abs(values))[::-1][:3]

    top_drivers = []
    top_feature_names = []

    for idx in top_indices:
        feature_name = _format_feature_name(FEATURE_NAMES[idx])
        direction = "increases" if values[idx] > 0 else "reduces"

        top_drivers.append({
            "feature": feature_name,
            "impact": float(values[idx]),
            "direction": direction
        })
        top_feature_names.append(feature_name)

    probability = pipeline.predict_proba(input_df)[0][1]

    if probability >= 0.70:
        risk_level = "High"
    elif probability >= 0.40:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    recommendation = _make_recommendation(risk_level, top_feature_names)

    return {
        "top_drivers": top_drivers,
        "recommendation": recommendation
    }