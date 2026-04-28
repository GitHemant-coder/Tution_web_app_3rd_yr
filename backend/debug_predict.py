import os
import django
import sys

# Set up Django environment
sys.path.append('c:/Users/DIYA HARIHAR PANDA/Downloads/Tutition_Project/Tutition_Project/Tutition_Project/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'student_analysis.settings')
django.setup()

from api.utils import get_dataset
import pandas as pd
import joblib
from django.conf import settings

def test_prediction():
    try:
        df = get_dataset()
        print("Columns:", df.columns.tolist())
        student_id = 1
        student = df[df['id'] == student_id]
        print("Student found:", not student.empty)
        if not student.empty:
            student_data = student.iloc[0]
            quiz_score = float(student_data['quiz_score'])
            attendance = float(student_data['attendance'])
            study_hours = float(student_data['study_hours'])
            print(f"Features: Quiz={quiz_score}, Attendance={attendance}, Study={study_hours}")
            
            model_path = os.path.join(settings.BASE_DIR, 'api', 'ml_model', 'model.pkl')
            print("Model path exists:", os.path.exists(model_path))
            
            model = joblib.load(model_path)
            features = pd.DataFrame([[quiz_score, attendance, study_hours]], 
                                   columns=['quiz_score', 'attendance', 'study_hours'])
            
            # Check model expected features if possible
            if hasattr(model, 'feature_names_in_'):
                print("Model features:", model.feature_names_in_)
            
            prediction = model.predict(features)
            print("Prediction:", prediction[0])
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_prediction()
