import pandas as pd
from .model_loader import pipeline


def predict_customer(data: dict):
    df = pd.DataFrame([{
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

    pred = pipeline.predict(df)[0]
    prob = pipeline.predict_proba(df)[0][1]

    if prob >= 0.70:
        risk = "High"
    elif prob >= 0.40:
        risk = "Medium"
    else:
        risk = "Low"

    return {
        "prediction": int(pred),
        "churn_probability": float(prob),
        "risk_level": risk
    }