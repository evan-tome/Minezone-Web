import os
import joblib
import mysql.connector
from pathlib import Path
from dotenv import load_dotenv
from recommender import ClassRecommender
from archetypes import ArchetypeClassifier
from win_predictor import WinPredictor
from game_predictor import GamePredictor
from kmeans import KMeansClusterer

_ml_dir = Path(__file__).parent
if not load_dotenv(_ml_dir / '.env'):
    load_dotenv(_ml_dir.parent / 'backend' / '.env')

MODELS_DIR = _ml_dir / 'models'

MODELS = [
    (ClassRecommender,    'recommender.joblib'),
    (ArchetypeClassifier, 'archetypes.joblib'),
    (WinPredictor,        'win_predictor.joblib'),
    (GamePredictor,       'game_predictor.joblib'),
    (KMeansClusterer,     'kmeans.joblib'),
]


def main():
    MODELS_DIR.mkdir(exist_ok=True)

    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        use_pure=True,
    )
    try:
        for cls, filename in MODELS:
            instance = cls()
            instance.train(conn)
            joblib.dump(instance, MODELS_DIR / filename)
            print(f"Saved {filename}")
    finally:
        conn.close()

    print("Training complete.")


if __name__ == '__main__':
    main()
