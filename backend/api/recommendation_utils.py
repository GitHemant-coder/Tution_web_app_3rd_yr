import pandas as pd
import numpy as np
import os
from django.conf import settings

# Paths
# Note: Using absolute paths derived from settings.BASE_DIR
def get_paths():
    materials_path = os.path.join(settings.BASE_DIR, 'dataset', 'study_materials.csv')
    interactions_path = os.path.join(settings.BASE_DIR, 'dataset', 'student_interactions.csv')
    return materials_path, interactions_path

def get_recommendations(student_id, top_n=3):
    """
    Returns recommended materials for a given student_id using 
    Item-Based Collaborative Filtering.
    """
    try:
        materials_path, interactions_path = get_paths()
        
        if not os.path.exists(materials_path) or not os.path.exists(interactions_path):
            return []

        materials_df = pd.read_csv(materials_path)
        interactions_df = pd.read_csv(interactions_path)

        # Create User-Item Matrix
        if interactions_df.empty:
            return materials_df.head(top_n).to_dict(orient='records')

        user_item_matrix = interactions_df.pivot_table(
            index='student_id', 
            columns='material_id', 
            values='rating'
        ).fillna(0)

        # If student not in interactions or has no history
        if student_id not in user_item_matrix.index:
            # Fallback: Popular materials (highest average rating)
            avg_ratings = interactions_df.groupby('material_id')['rating'].mean().sort_values(ascending=False)
            popular_ids = avg_ratings.index.tolist()
            if not popular_ids:
                return materials_df.head(top_n).to_dict(orient='records')
            return materials_df[materials_df['material_id'].isin(popular_ids[:top_n])].to_dict(orient='records')

        # Item-Based CF logic:
        # Calculate Item-Item Similarity matrix manually
        items_matrix = user_item_matrix.T
        
        # Subtract mean for centered cosine similarity
        items_centered = items_matrix.apply(lambda x: x - x.mean() if x.sum() > 0 else x, axis=1)
        
        # Dot product
        item_sim = items_centered.values @ items_centered.values.T
        
        # Norms
        norms = np.sqrt(np.diag(item_sim))
        
        # Similarity = Dot Product / (Norm1 * Norm2)
        # Avoid division by zero
        norms[norms == 0] = 1.0
        item_sim = item_sim / norms[:, None]
        item_sim = item_sim / norms[None, :]
        
        item_sim_df = pd.DataFrame(item_sim, index=user_item_matrix.columns, columns=user_item_matrix.columns)
        
        # Get user's ratings
        user_ratings = user_item_matrix.loc[student_id]
        viewed_items = user_ratings[user_ratings > 0].index.tolist()
        
        # Calculate recommendation scores
        scores = pd.Series(0.0, index=user_item_matrix.columns)
        
        for item in viewed_items:
            rating = user_ratings[item]
            similarity_scores = item_sim_df[item]
            scores += similarity_scores * rating
            
        # Remove already viewed items
        scores = scores.drop(labels=viewed_items, errors='ignore')
        
        # Get top N material IDs
        top_material_ids = scores.sort_values(ascending=False).head(top_n).index.tolist()
        
        # Fallback if student viewed all materials
        if not top_material_ids:
            avg_ratings = interactions_df.groupby('material_id')['rating'].mean().sort_values(ascending=False)
            top_material_ids = avg_ratings.head(top_n).index.tolist()
            if not top_material_ids:
                return materials_df.head(top_n).to_dict(orient='records')
        
        # Map to material details
        recommended = materials_df[materials_df['material_id'].isin(top_material_ids)]
        return recommended.to_dict(orient='records')
        
    except Exception as e:
        print(f"Error in recommendation: {e}")
        # Return first N materials as safe fallback
        try:
            materials_path, _ = get_paths()
            return pd.read_csv(materials_path).head(top_n).to_dict(orient='records')
        except:
            return []

def log_interaction(student_id, material_id, rating=5):
    """
    Logs a student interaction (view/rating) to the CSV.
    """
    try:
        _, interactions_path = get_paths()
        
        new_row = {
            'student_id': student_id,
            'material_id': material_id,
            'rating': rating,
            'timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        if os.path.exists(interactions_path):
            df = pd.read_csv(interactions_path)
            # Update if already exists, otherwise append
            mask = (df['student_id'] == student_id) & (df['material_id'] == material_id)
            if mask.any():
                df.loc[mask, 'rating'] = rating
                df.loc[mask, 'timestamp'] = new_row['timestamp']
            else:
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            df.to_csv(interactions_path, index=False)
        else:
            pd.DataFrame([new_row]).to_csv(interactions_path, index=False)
            
        return True
    except Exception as e:
        print(f"Error logging interaction: {e}")
        return False

def get_all_materials():
    """Returns all available study materials."""
    try:
        materials_path, _ = get_paths()
        if os.path.exists(materials_path):
            return pd.read_csv(materials_path).to_dict(orient='records')
        return []
    except Exception as e:
        print(f"Error getting materials: {e}")
        return []
