import os
import joblib
import pandas as pd
import mysql.connector
from pathlib import Path
from dotenv import load_dotenv
from recommender import ClassRecommender
from archetypes import ArchetypeClassifier
from win_predictor import WinPredictor
from game_predictor import GamePredictor
from kmeans import KMeansClusterer
from anomaly_detector import AnomalyDetector
from pipeline_monitor import PipelineMonitor
from balance_monitor import BalanceMonitor

_ml_dir = Path(__file__).parent
if not load_dotenv(_ml_dir / '.env'):
    load_dotenv(_ml_dir.parent / 'backend' / '.env')

MODELS_DIR = _ml_dir / 'models'

_VAULTED = '25, 37, 38, 42, 43, 65, 69, 101, 102, 103, 104, 105'


def load_data(conn):
    """Fetch and clean all training tables from MySQL into DataFrames."""

    # Aggregate player stats — shared by archetype, kmeans, and recommender models
    df_players = pd.read_sql("""
        SELECT
            pd.UUID, pd.LastPlayerName,
            pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
            pd.FlawlessWins, pd.MatchMvps, pd.Level, pd.BestWinstreak,
            AVG(gp.kills)      AS avg_kills_pg,
            SUM(gp.firstblood) AS first_bloods
        FROM PlayerData pd
        LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
        GROUP BY
            pd.UUID, pd.LastPlayerName,
            pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
            pd.FlawlessWins, pd.MatchMvps, pd.Level, pd.BestWinstreak
    """, conn)
    df_players['total_games'] = df_players['Wins'] + df_players['Losses']
    df_players['avg_kills_pg'] = df_players['avg_kills_pg'].fillna(
        df_players['Kills'] / df_players['total_games'].clip(lower=1)
    )
    df_players['first_bloods'] = df_players['first_bloods'].fillna(0).astype(int)

    # Per-player, per-class win/loss counts — used by the recommender
    df_classes = pd.read_sql(f"""
        SELECT UUID, ClassID, GamesPlayed, GamesWon
        FROM PlayerClasses
        WHERE ClassID NOT IN ({_VAULTED})
          AND GamesPlayed >= 5
    """, conn)

    # One row per game participant — used by win predictor and game predictor
    df_games = pd.read_sql("""
        SELECT
            gp.game_id, gp.uuid, gp.placement,
            pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
            pd.FlawlessWins, pd.MatchMvps,
            ag.avg_kills_pg,
            ag.avg_first_blood
        FROM scb_game_players gp
        JOIN PlayerData pd ON pd.UUID = gp.uuid
        JOIN (
            SELECT uuid,
                   AVG(kills)      AS avg_kills_pg,
                   AVG(firstblood) AS avg_first_blood
            FROM scb_game_players
            GROUP BY uuid
        ) ag ON ag.uuid = gp.uuid
        WHERE (pd.Wins + pd.Losses) >= 5
          AND gp.game_id IS NOT NULL
    """, conn)
    df_games['total_games'] = df_games['Wins'] + df_games['Losses']
    df_games['avg_kills_pg'] = df_games['avg_kills_pg'].fillna(
        df_games['Kills'] / df_games['total_games'].clip(lower=1)
    )
    df_games['avg_first_blood'] = df_games['avg_first_blood'].fillna(0)

    # Daily win/loss counts per class — used by the balance monitor
    df_class_daily = pd.read_sql(f"""
        SELECT
            DATE(g.end_time)                                      AS date,
            gp.class_id,
            SUM(IF(gp.placement = 1, 1, 0))                      AS wins,
            COUNT(*)                                              AS games
        FROM scb_game_players gp
        JOIN scb_games g ON g.game_id = gp.game_id
        WHERE g.end_time IS NOT NULL
          AND gp.class_id IS NOT NULL
          AND gp.class_id NOT IN ({_VAULTED})
        GROUP BY DATE(g.end_time), gp.class_id
        ORDER BY date ASC
    """, conn)

    # Daily game aggregates — used by the pipeline monitor
    df_daily = pd.read_sql("""
        SELECT
            DATE(g.end_time)                                          AS date,
            COUNT(DISTINCT g.game_id)                                 AS game_count,
            AVG(gp.kills)                                             AS avg_kills,
            AVG(gp.firstblood)                                        AS avg_firstblood,
            COUNT(gp.uuid) / COUNT(DISTINCT g.game_id)               AS avg_players_per_game
        FROM scb_games g
        JOIN scb_game_players gp ON gp.game_id = g.game_id
        WHERE g.end_time IS NOT NULL
        GROUP BY DATE(g.end_time)
        ORDER BY date ASC
    """, conn)

    return df_players, df_classes, df_games, df_daily, df_class_daily


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
        print("Loading data...")
        df_players, df_classes, df_games, df_daily, df_class_daily = load_data(conn)
        print(f"  {len(df_players):,} players  |  {len(df_classes):,} class rows  |  {len(df_games):,} game rows  |  {len(df_daily):,} days  |  {len(df_class_daily):,} class-days")
    finally:
        conn.close()

    models = [
        (ClassRecommender,    'recommender.joblib',       (df_players, df_classes)),
        (ArchetypeClassifier, 'archetypes.joblib',        (df_players,)),
        (WinPredictor,        'win_predictor.joblib',     (df_games,)),
        (GamePredictor,       'game_predictor.joblib',    (df_games,)),
        (KMeansClusterer,     'kmeans.joblib',            (df_players,)),
        (AnomalyDetector,     'anomaly_detector.joblib',  (df_players,)),
        (PipelineMonitor,     'pipeline_monitor.joblib',  (df_daily,)),
        (BalanceMonitor,      'balance_monitor.joblib',   (df_class_daily,)),
    ]

    for cls, filename, args in models:
        instance = cls()
        instance.train(*args)
        joblib.dump(instance, MODELS_DIR / filename)
        print(f"Saved {filename}")

    print("Training complete.")


if __name__ == '__main__':
    main()
