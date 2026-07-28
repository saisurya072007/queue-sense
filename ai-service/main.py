"""
SmartGov AI – Kakinada
AI Service FastAPI App
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
from datetime import datetime
import os

from model import get_models

app = FastAPI(
    title="SmartGov AI Service",
    description="Queue prediction API for Kakinada government services",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
wait_model, crowd_model, feature_names = get_models()
CROWD_LABELS = ['low', 'medium', 'high', 'very_high']


class PredictRequest(BaseModel):
    office_id: Optional[str] = None
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
    is_holiday: Optional[int] = 0
    token_number: Optional[int] = 0
    current_token: Optional[int] = 0
    position_in_queue: Optional[int] = None
    avg_service_time: Optional[float] = 8.0
    historical_avg: Optional[float] = 20.0


class PredictResponse(BaseModel):
    predicted_wait_minutes: float
    crowd_level: str
    crowd_label: str
    confidence: int
    best_time_to_visit: str
    features_used: dict


@app.get("/")
def root():
    return {
        "service": "SmartGov AI – Kakinada Queue Prediction",
        "status": "healthy",
        "models_loaded": True,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
def health():
    return {"status": "healthy", "models": "loaded"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        now = datetime.now()
        hour = req.hour if req.hour is not None else now.hour
        day_of_week = req.day_of_week if req.day_of_week is not None else now.weekday()
        is_lunch_break = 1 if hour in [13, 14] else 0
        position = req.position_in_queue if req.position_in_queue is not None else max(0, req.token_number - req.current_token)
        
        features = {
            'hour': hour,
            'day_of_week': day_of_week,
            'is_holiday': req.is_holiday,
            'is_lunch_break': is_lunch_break,
            'historical_avg': req.historical_avg,
            'position_in_queue': position,
            'avg_service_time': req.avg_service_time,
        }
        
        X = np.array([[features[f] for f in feature_names]])
        
        # Predictions
        wait_pred = float(wait_model.predict(X)[0])
        wait_pred = max(0, round(wait_pred, 1))
        
        crowd_pred = int(crowd_model.predict(X)[0])
        crowd_proba = crowd_model.predict_proba(X)[0]
        confidence = int(max(crowd_proba) * 100)
        
        # Best time to visit
        if hour < 10:
            best_time = "Right now! Low crowd in early morning."
        elif 10 <= hour <= 12:
            best_time = "After 2:00 PM – post-lunch has shorter queues."
        elif 13 <= hour <= 14:
            best_time = "After 2:30 PM – queue resumes after lunch break."
        elif 14 <= hour <= 16:
            best_time = "Tomorrow 9:00–10:00 AM for shortest wait."
        else:
            best_time = "Next morning 9:00–10:00 AM is best."
        
        return PredictResponse(
            predicted_wait_minutes=wait_pred,
            crowd_level=CROWD_LABELS[crowd_pred],
            crowd_label=CROWD_LABELS[crowd_pred].replace('_', ' ').title(),
            confidence=confidence,
            best_time_to_visit=best_time,
            features_used=features
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/best-time/{office_id}")
def get_best_time(office_id: str):
    """Get hourly crowd predictions for a given office"""
    predictions = []
    day_of_week = datetime.now().weekday()
    
    for hour in range(9, 18):
        X = np.array([[hour, day_of_week, 0, 1 if hour in [13, 14] else 0, 20.0, 5, 8.0]])
        crowd_pred = int(crowd_model.predict(X)[0])
        wait_pred = float(wait_model.predict(X)[0])
        
        predictions.append({
            'hour': hour,
            'label': f"{hour}:00",
            'crowd_level': CROWD_LABELS[crowd_pred],
            'estimated_wait_minutes': max(0, round(wait_pred, 0)),
        })
    
    return {"office_id": office_id, "hourly_predictions": predictions}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
