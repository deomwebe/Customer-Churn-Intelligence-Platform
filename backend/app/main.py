from pathlib import Path
from typing import List
from io import StringIO

import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .schemas import (
    CustomerInput,
    PredictionResponse,
    PredictionRecordOut,
    BatchPredictionResponse,
)
from .predictor import predict_customer
from .explainer import explain_prediction
from .database import SessionLocal, engine
from .models import Base
from .crud import create_prediction_record, get_recent_predictions

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Customer Churn Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize_batch_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [col.strip() for col in df.columns]

    column_aliases = {
        "Age": "Age",
        "Gender": "Gender",
        "Tenure": "Tenure",
        "Usage Frequency": "Usage_Frequency",
        "Usage_Frequency": "Usage_Frequency",
        "Support Calls": "Support_Calls",
        "Support_Calls": "Support_Calls",
        "Payment Delay": "Payment_Delay",
        "Payment_Delay": "Payment_Delay",
        "Subscription Type": "Subscription_Type",
        "Subscription_Type": "Subscription_Type",
        "Contract Length": "Contract_Length",
        "Contract_Length": "Contract_Length",
        "Total Spend": "Total_Spend",
        "Total_Spend": "Total_Spend",
        "Last Interaction": "Last_Interaction",
        "Last_Interaction": "Last_Interaction",
    }

    df = df.rename(columns=column_aliases)

    required_columns = [
        "Age",
        "Gender",
        "Tenure",
        "Usage_Frequency",
        "Support_Calls",
        "Payment_Delay",
        "Subscription_Type",
        "Contract_Length",
        "Total_Spend",
        "Last_Interaction",
    ]

    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    df = df[required_columns]

    numeric_columns = [
        "Age",
        "Tenure",
        "Usage_Frequency",
        "Support_Calls",
        "Payment_Delay",
        "Total_Spend",
        "Last_Interaction",
    ]

    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    if df.isnull().any().any():
        raise ValueError("CSV contains invalid or missing values in required fields.")

    df["Age"] = df["Age"].astype(int)
    df["Tenure"] = df["Tenure"].astype(int)
    df["Usage_Frequency"] = df["Usage_Frequency"].astype(int)
    df["Support_Calls"] = df["Support_Calls"].astype(int)
    df["Payment_Delay"] = df["Payment_Delay"].astype(int)
    df["Last_Interaction"] = df["Last_Interaction"].astype(int)
    df["Total_Spend"] = df["Total_Spend"].astype(float)

    return df


@app.get("/health")
def health():
    return {"message": "API is running"}


@app.post("/predict", response_model=PredictionResponse)
def predict(input_data: CustomerInput, db: Session = Depends(get_db)):
    try:
        input_dict = input_data.dict()

        result = predict_customer(input_dict)
        explanation = explain_prediction(input_dict)

        full_result = {
            **result,
            **explanation
        }

        create_prediction_record(db, input_dict, result)

        return full_result
    except Exception as e:
        print("Prediction error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_batch(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

        contents = await file.read()
        decoded = contents.decode("utf-8")
        df = pd.read_csv(StringIO(decoded))

        df = normalize_batch_dataframe(df)

        results = []

        for _, row in df.iterrows():
            input_dict = {
                "Age": int(row["Age"]),
                "Gender": str(row["Gender"]),
                "Tenure": int(row["Tenure"]),
                "Usage_Frequency": int(row["Usage_Frequency"]),
                "Support_Calls": int(row["Support_Calls"]),
                "Payment_Delay": int(row["Payment_Delay"]),
                "Subscription_Type": str(row["Subscription_Type"]),
                "Contract_Length": str(row["Contract_Length"]),
                "Total_Spend": float(row["Total_Spend"]),
                "Last_Interaction": int(row["Last_Interaction"]),
            }

            result = predict_customer(input_dict)

            create_prediction_record(db, input_dict, result)

            results.append({
                **input_dict,
                **result
            })

        high_risk_count = sum(1 for r in results if r["risk_level"] == "High")
        medium_risk_count = sum(1 for r in results if r["risk_level"] == "Medium")
        low_risk_count = sum(1 for r in results if r["risk_level"] == "Low")

        return {
            "total_records": len(results),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Batch prediction error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predictions", response_model=List[PredictionRecordOut])
def list_predictions(limit: int = 20, db: Session = Depends(get_db)):
    return get_recent_predictions(db, limit=limit)


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")