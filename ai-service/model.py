"""
SmartGov AI – Kakinada
AI Service: Queue Wait Time Prediction using Scikit-learn Random Forest
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os
import random
from datetime import datetime, timedelta

# ============================================================
# SYNTHETIC TRAINING DATA GENERATOR
# ============================================================

def generate_training_data(n_samples=5000):
    """Generate realistic synthetic queue data for Kakinada offices"""
    random.seed(42)
    np.random.seed(42)
    
    data = []
    
    for _ in range(n_samples):
        # Random hour (office hours 9 AM to 5 PM)
        hour = random.randint(9, 17)
        
        # Random day (0=Sunday, 6=Saturday)
        day_of_week = random.randint(0, 6)
        
        # Holidays (roughly 15 days a year)
        is_holiday = 1 if random.random() < 0.04 else 0
        
        # Lunch break
        is_lunch_break = 1 if (hour == 13 or hour == 14) else 0
        
        # Calculate base crowd based on time
        if is_holiday:
            base_visitors = random.randint(0, 5)
        elif day_of_week in [0, 6]:  # Weekend
            base_visitors = random.randint(5, 20)
        elif is_lunch_break:
            base_visitors = random.randint(15, 35)
        elif 10 <= hour <= 12:  # Morning peak
            base_visitors = random.randint(20, 50)
        elif 14 <= hour <= 16:  # Afternoon peak
            base_visitors = random.randint(18, 45)
        elif hour == 9 or hour == 17:  # Opening/closing
            base_visitors = random.randint(5, 15)
        else:
            base_visitors = random.randint(10, 30)
        
        # Historical average (simulated)
        historical_avg = base_visitors * (1 + np.random.normal(0, 0.1))
        
        # Position in queue
        position_in_queue = random.randint(0, base_visitors)
        
        # Average service time per token (minutes)
        avg_service_time = random.uniform(5, 15)
        
        # Actual wait time (target)
        wait_time = max(0, position_in_queue * avg_service_time * (1 + np.random.normal(0, 0.15)))
        
        # Crowd level label
        if base_visitors <= 10:
            crowd_level = 0  # low
        elif base_visitors <= 25:
            crowd_level = 1  # medium
        elif base_visitors <= 40:
            crowd_level = 2  # high
        else:
            crowd_level = 3  # very_high
        
        data.append({
            'hour': hour,
            'day_of_week': day_of_week,
            'is_holiday': is_holiday,
            'is_lunch_break': is_lunch_break,
            'historical_avg': round(historical_avg, 2),
            'position_in_queue': position_in_queue,
            'avg_service_time': round(avg_service_time, 2),
            'wait_time_minutes': round(wait_time, 2),  # Target for regression
            'crowd_level': crowd_level,  # Target for classification
        })
    
    return pd.DataFrame(data)


# ============================================================
# TRAIN MODELS
# ============================================================

def train_models():
    """Train wait time prediction and crowd level classification models"""
    print("🤖 Generating training data...")
    df = generate_training_data(5000)
    
    features = ['hour', 'day_of_week', 'is_holiday', 'is_lunch_break', 
                 'historical_avg', 'position_in_queue', 'avg_service_time']
    
    X = df[features]
    y_wait = df['wait_time_minutes']
    y_crowd = df['crowd_level']
    
    X_train, X_test, y_wait_train, y_wait_test = train_test_split(X, y_wait, test_size=0.2, random_state=42)
    _, _, y_crowd_train, y_crowd_test = train_test_split(X, y_crowd, test_size=0.2, random_state=42)
    
    # Wait Time Regressor
    print("🌲 Training Random Forest Regressor (wait time)...")
    wait_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    wait_model.fit(X_train, y_wait_train)
    
    y_pred_wait = wait_model.predict(X_test)
    mae = mean_absolute_error(y_wait_test, y_pred_wait)
    print(f"✅ Wait Time MAE: {mae:.2f} minutes")
    
    # Crowd Level Classifier
    print("🌲 Training Gradient Boosting Classifier (crowd level)...")
    crowd_model = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    crowd_model.fit(X_train, y_crowd_train)
    
    crowd_acc = crowd_model.score(X_test, y_crowd_test)
    print(f"✅ Crowd Level Accuracy: {crowd_acc*100:.1f}%")
    
    # Save models
    os.makedirs('models', exist_ok=True)
    joblib.dump(wait_model, 'models/wait_time_model.pkl')
    joblib.dump(crowd_model, 'models/crowd_level_model.pkl')
    joblib.dump(features, 'models/features.pkl')
    print("💾 Models saved to models/")
    
    return wait_model, crowd_model, features


# ============================================================
# LOAD OR TRAIN MODELS
# ============================================================

def get_models():
    """Load existing models or train new ones"""
    try:
        wait_model = joblib.load('models/wait_time_model.pkl')
        crowd_model = joblib.load('models/crowd_level_model.pkl')
        features = joblib.load('models/features.pkl')
        print("✅ Models loaded from disk")
        return wait_model, crowd_model, features
    except FileNotFoundError:
        print("⚠️  Models not found, training new ones...")
        return train_models()


if __name__ == '__main__':
    print("=== SmartGov AI Model Training ===")
    wait_model, crowd_model, features = train_models()
    print("\n=== Testing Prediction ===")
    
    test_input = {
        'hour': 11, 'day_of_week': 1, 'is_holiday': 0, 'is_lunch_break': 0,
        'historical_avg': 25.0, 'position_in_queue': 10, 'avg_service_time': 8.0
    }
    
    X_test = np.array([[test_input[f] for f in features]])
    wait_pred = wait_model.predict(X_test)[0]
    crowd_pred = crowd_model.predict(X_test)[0]
    crowd_labels = ['low', 'medium', 'high', 'very_high']
    
    print(f"Test Input: {test_input}")
    print(f"Predicted Wait: {wait_pred:.1f} minutes")
    print(f"Predicted Crowd: {crowd_labels[crowd_pred]}")
    print("✅ Training complete!")
