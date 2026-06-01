import os
import threading
import mysql.connector.pooling
from flask import Flask, jsonify
from pathlib import Path
from dotenv import load_dotenv
from recommender import ClassRecommender
from archetypes import ArchetypeClassifier

_ml_dir = Path(__file__).parent
if not load_dotenv(_ml_dir / '.env'):
    load_dotenv(_ml_dir.parent / 'backend' / '.env')

app = Flask(__name__)

_pool = None
recommender = None
archetype_clf = None


def make_pool():
    return mysql.connector.pooling.MySQLConnectionPool(
        pool_name="minezone_ml",
        pool_size=5,
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        use_pure=True,
    )


def train_model():
    conn = _pool.get_connection()
    try:
        recommender.train(conn)
        archetype_clf.train(conn)
    finally:
        conn.close()


def _retrain_loop():
    try:
        train_model()
    except Exception as e:
        print("Retrain failed:", e)

    t = threading.Timer(86400, _retrain_loop)
    t.daemon = True
    t.start()


@app.route('/recommend/<username>', methods=['GET'])
def recommend(username):
    if not recommender.ready:
        return jsonify(error="Model not ready — not enough player data yet"), 503

    conn = _pool.get_connection()

    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT LastPlayerName, Wins, Losses, Kills, Deaths,
                       FlawlessWins, MatchMvps, Level, BestWinstreak
                FROM PlayerData
                WHERE LastPlayerName = %s
                  AND (Wins + Losses) >= 1
                ORDER BY (Wins + Losses) DESC
                LIMIT 1
                """,
                (username,),
            )

            player = cursor.fetchone()

    finally:
        conn.close()

    if not player:
        return jsonify(error="Player not found or has no played games"), 404

    recs = recommender.recommend(
        wins=player["Wins"],
        losses=player["Losses"],
        kills=player["Kills"],
        deaths=player["Deaths"],
        flawless_wins=player["FlawlessWins"],
        match_mvps=player["MatchMvps"],
        level=player["Level"],
        best_winstreak=player["BestWinstreak"],
    )

    if recs is None:
        return jsonify(error="Model not available"), 503

    return jsonify(username=player["LastPlayerName"], recommendations=recs)


@app.route('/archetype/<username>', methods=['GET'])
def archetype(username):
    if not archetype_clf.ready:
        return jsonify(error='Archetype classifier not ready'), 503

    conn = _pool.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT LastPlayerName, Wins, Losses, Kills, Deaths,
                       FlawlessWins, MatchMvps, Level, BestWinstreak
                FROM PlayerData
                WHERE LastPlayerName = %s
                  AND (Wins + Losses) >= 1
                LIMIT 1
                """,
                (username,),
            )
            player = cursor.fetchone()

            avg_kills_pg = None
            if player:
                cursor.execute(
                    """
                    SELECT AVG(gp.kills) AS avg_kills
                    FROM scb_game_players gp
                    JOIN PlayerData pd ON gp.uuid = pd.UUID
                    WHERE pd.LastPlayerName = %s
                    """,
                    (username,),
                )
                row = cursor.fetchone()
                if row and row['avg_kills'] is not None:
                    avg_kills_pg = float(row['avg_kills'])
    finally:
        conn.close()

    if not player:
        return jsonify(error='Player not found'), 404

    result = archetype_clf.classify(
        wins=player['Wins'],
        losses=player['Losses'],
        kills=player['Kills'],
        deaths=player['Deaths'],
        flawless_wins=player['FlawlessWins'],
        match_mvps=player['MatchMvps'],
        level=player['Level'],
        best_winstreak=player['BestWinstreak'],
        avg_kills_pg=avg_kills_pg,
    )

    if result is None:
        return jsonify(error='Classifier not available'), 503

    return jsonify(username=player['LastPlayerName'], **result)


if __name__ == "__main__":
    _pool = make_pool()
    recommender = ClassRecommender()
    archetype_clf = ArchetypeClassifier()

    train_model()

    retrain_timer = threading.Timer(86400, _retrain_loop)
    retrain_timer.daemon = True
    retrain_timer.start()

    app.run(port=8000)