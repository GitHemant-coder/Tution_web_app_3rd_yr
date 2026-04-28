import pandas as pd
import os
from django.conf import settings
import numpy as np

def get_dataset():
    csv_path = os.path.join(settings.BASE_DIR, 'dataset', 'student_performance.csv')
    df = pd.read_csv(csv_path)
    
    # Add an ID column if it doesn't exist (using 1-based index)
    if 'id' not in df.columns:
        df.insert(0, 'id', range(1, len(df) + 1))
        
    # Standardize column names for easier access or just use them as is
    # Let's map them to more JSON-friendly keys if we want, or keep original.
    # Original: Attendance_%, QuizScore_%, StudyHours_PerDay, PerformanceScore
    df = df.rename(columns={
        'Attendance_%': 'attendance',
        'QuizScore_%': 'quiz_score',
        'StudyHours_PerDay': 'study_hours',
        'PerformanceScore': 'performance_score'
    })
    
    # Calculate a pass/fail flag: Assuming passing score is 50.0
    # or maybe top 50 depending on standard. Let's use > 50.0 as passing
    df['is_passing'] = df['performance_score'] >= 50.0
    
    return df

def df_to_dict(df):
    return df.replace({np.nan: None}).to_dict(orient='records')

def save_material(title, description, subject, file_type, file_obj):
    """
    Saves the uploaded file to disk and adds metadata to study_materials.csv
    """
    try:
        csv_path = os.path.join(settings.BASE_DIR, 'dataset', 'study_materials.csv')
        materials_dir = os.path.join(settings.BASE_DIR, 'materials')
        os.makedirs(materials_dir, exist_ok=True)
        
        # Save physical file
        filename = file_obj.name.replace(' ', '_')
        file_path = os.path.join(materials_dir, filename)
        
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        
        # Update CSV
        df = pd.read_csv(csv_path)
        new_id = df['material_id'].max() + 1 if not df.empty else 1
        
        new_row = {
            'material_id': new_id,
            'title': title,
            'subject': subject,
            'type': file_type,
            'description': description,
            'file_url': f'materials/{filename}',
            'date': pd.Timestamp.now().strftime('%Y-%m-%d')
        }
        
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(csv_path, index=False)
        return True
    except Exception as e:
        print(f"Error saving material: {e}")
        return False
