from sqlalchemy.orm import Session
from .models import PredictionRecord


def create_prediction_record(db: Session, input_data: dict, result_data: dict):
    record = PredictionRecord(
        Age=input_data["Age"],
        Gender=input_data["Gender"],
        Tenure=input_data["Tenure"],
        Usage_Frequency=input_data["Usage_Frequency"],
        Support_Calls=input_data["Support_Calls"],
        Payment_Delay=input_data["Payment_Delay"],
        Subscription_Type=input_data["Subscription_Type"],
        Contract_Length=input_data["Contract_Length"],
        Total_Spend=input_data["Total_Spend"],
        Last_Interaction=input_data["Last_Interaction"],
        prediction=result_data["prediction"],
        churn_probability=result_data["churn_probability"],
        risk_level=result_data["risk_level"],
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_recent_predictions(db: Session, limit: int = 20):
    return (
        db.query(PredictionRecord)
        .order_by(PredictionRecord.created_at.desc())
        .limit(limit)
        .all()
    )