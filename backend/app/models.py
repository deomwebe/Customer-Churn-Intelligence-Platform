from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)

    Age = Column(Integer, nullable=False)
    Gender = Column(String, nullable=False)
    Tenure = Column(Integer, nullable=False)
    Usage_Frequency = Column(Integer, nullable=False)
    Support_Calls = Column(Integer, nullable=False)
    Payment_Delay = Column(Integer, nullable=False)
    Subscription_Type = Column(String, nullable=False)
    Contract_Length = Column(String, nullable=False)
    Total_Spend = Column(Float, nullable=False)
    Last_Interaction = Column(Integer, nullable=False)

    prediction = Column(Integer, nullable=False)
    churn_probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)