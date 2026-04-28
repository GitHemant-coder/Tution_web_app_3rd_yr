import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

def train():
    # File paths
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_dir, 'dataset', 'student_performance.csv')
    model_path = os.path.join(base_dir, 'api', 'ml_model', 'model.pkl')

    # Load data
    print(f"Loading dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Rename columns for convenience (matching our internal logic)
    df = df.rename(columns={
        'Attendance_%': 'attendance',
        'QuizScore_%': 'quiz_score',
        'StudyHours_PerDay': 'study_hours',
        'PerformanceScore': 'performance_score'
    })

    # Prepare features and target
    X = df[['quiz_score', 'attendance', 'study_hours']]
    y = df['performance_score']

    # Train model
    print("Training RandomForest model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save model
    print(f"Saving model to {model_path}...")
    joblib.dump(model, model_path)
    print("Training complete!")

if __name__ == "__main__":
    train()
