from datetime import datetime
from pydantic import BaseModel


class CustomerInput(BaseModel):
    Age: int
    Gender: str
    Tenure: int
    Usage_Frequency: int
    Support_Calls: int
    Payment_Delay: int
    Subscription_Type: str
    Contract_Length: str
    Total_Spend: float
    Last_Interaction: int


class DriverOut(BaseModel):
    feature: str
    impact: float
    direction: str


class PredictionResponse(BaseModel):
    prediction: int
    churn_probability: float
    risk_level: str
    top_drivers: list[DriverOut]
    recommendation: str


class PredictionRecordOut(BaseModel):
    id: int
    Age: int
    Gender: str
    Tenure: int
    Usage_Frequency: int
    Support_Calls: int
    Payment_Delay: int
    Subscription_Type: str
    Contract_Length: str
    Total_Spend: float
    Last_Interaction: int
    prediction: int
    churn_probability: float
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True
       
        
        
        
class BatchPredictionRow(BaseModel):
    Age: int
    Gender: str
    Tenure: int
    Usage_Frequency: int
    Support_Calls: int
    Payment_Delay: int
    Subscription_Type: str
    Contract_Length: str
    Total_Spend: float
    Last_Interaction: int
    prediction: int
    churn_probability: float
    risk_level: str


class BatchPredictionResponse(BaseModel):
    total_records: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    results: list[BatchPredictionRow]