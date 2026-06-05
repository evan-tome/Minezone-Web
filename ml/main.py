import os
import joblib
import mysql.connector.pooling
from flask import Flask, jsonify, request
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

app = Flask(__name__)

_pool = None
recommender = None
archetype_clf = None
win_predictor = None
game_predictor = None
kmeans_clf = None


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


def _load(filename, fallback_cls):
    path = MODELS_DIR / filename
    if path.exists():
        try:
            obj = joblib.load(path)
            print(f"Loaded {filename}")
            return obj
        except Exception as e:
            print(f"Failed to load {filename}: {e}")
    else:
        print(f"Model not found: {filename} (run train.py first)")
    return fallback_cls()


@app.route('/cluster-map', methods=['GET'])
def cluster_map():
    result = kmeans_clf.get_map_data()
    if result is None:
        return jsonify(error='K-means not ready: not enough player data'), 503
    return jsonify(**result)


@app.route('/cluster/<username>', methods=['GET'])
def cluster(username):
    if not kmeans_clf.ready:
        return jsonify(error='K-means not ready: not enough player data'), 503

    conn = _pool.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                       pd.MatchMvps,
                       AVG(gp.kills) AS avg_kills
                FROM PlayerData pd
                LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
                WHERE pd.LastPlayerName = %s
                  AND (pd.Wins + pd.Losses) >= 1
                GROUP BY pd.UUID, pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                         pd.MatchMvps
                LIMIT 1
                """,
                (username,),
            )
            player = cursor.fetchone()
    finally:
        conn.close()

    if not player:
        return jsonify(error='Player not found'), 404

    result = kmeans_clf.classify(
        wins=player['Wins'],
        losses=player['Losses'],
        kills=player['Kills'],
        deaths=player['Deaths'],
        match_mvps=player['MatchMvps'],
        avg_kills_pg=float(player['avg_kills']) if player['avg_kills'] is not None else None,
    )

    if result is None:
        return jsonify(error='Classifier not available'), 503

    similar = [p for p in result['similar_players'] if p.lower() != player['LastPlayerName'].lower()][:8]

    return jsonify(
        username=player['LastPlayerName'],
        cluster_id=result['cluster_id'],
        cluster_size=result['cluster_size'],
        similar_players=similar,
        player_pos=result['player_pos'],
    )


@app.route('/recommend/<username>', methods=['GET'])
def recommend(username):
    if not recommender.ready:
        return jsonify(error="Model not ready: not enough player data yet"), 503

    conn = _pool.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT UUID, LastPlayerName, Wins, Losses, Kills, Deaths,
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

            class_stats = []
            if player:
                cursor.execute(
                    "SELECT ClassID, GamesPlayed, GamesWon FROM PlayerClasses WHERE UUID = %s",
                    (player['UUID'],),
                )
                class_stats = cursor.fetchall()
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
        class_stats=class_stats,
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
                SELECT pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                       pd.FlawlessWins, pd.MatchMvps,
                       AVG(gp.kills) AS avg_kills,
                       SUM(gp.firstblood) AS first_bloods
                FROM PlayerData pd
                LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
                WHERE pd.LastPlayerName = %s
                  AND (pd.Wins + pd.Losses) >= 1
                GROUP BY pd.UUID, pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                         pd.FlawlessWins, pd.MatchMvps
                LIMIT 1
                """,
                (username,),
            )
            player = cursor.fetchone()
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
        avg_kills_pg=float(player['avg_kills']) if player['avg_kills'] is not None else None,
        first_bloods=int(player['first_bloods']) if player['first_bloods'] is not None else 0,
    )

    if result is None:
        return jsonify(error='Classifier not available'), 503

    return jsonify(username=player['LastPlayerName'], **result)


@app.route('/predict-win/<username>', methods=['GET'])
def predict_win(username):
    if not win_predictor.ready:
        return jsonify(error='Win predictor not ready'), 503

    conn = _pool.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                       pd.FlawlessWins, pd.MatchMvps,
                       AVG(gp.kills)   AS avg_kills,
                       SUM(gp.firstblood) AS first_bloods
                FROM PlayerData pd
                LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
                WHERE pd.LastPlayerName = %s
                  AND (pd.Wins + pd.Losses) >= 1
                GROUP BY pd.UUID, pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                         pd.FlawlessWins, pd.MatchMvps
                LIMIT 1
                """,
                (username,),
            )
            player = cursor.fetchone()
    finally:
        conn.close()

    if not player:
        return jsonify(error='Player not found'), 404

    result = win_predictor.predict(
        wins=player['Wins'],
        losses=player['Losses'],
        kills=player['Kills'],
        deaths=player['Deaths'],
        flawless_wins=player['FlawlessWins'],
        match_mvps=player['MatchMvps'],
        avg_kills_pg=float(player['avg_kills']) if player['avg_kills'] is not None else None,
    )

    if result is None:
        return jsonify(error='Predictor not available'), 503

    total = player['Wins'] + player['Losses']
    actual_wr = round(player['Wins'] / max(total, 1) * 100, 1)

    return jsonify(username=player['LastPlayerName'], actual_win_rate=actual_wr, **result)


@app.route('/predict-game', methods=['POST'])
def predict_game():
    if not game_predictor.ready:
        return jsonify(error='Game predictor not ready'), 503

    data = request.get_json(silent=True) or {}
    usernames = data.get('players', [])

    if len(usernames) < 2:
        return jsonify(error='At least 2 players required'), 400
    if len(usernames) > 8:
        return jsonify(error='Maximum 8 players allowed'), 400

    conn = _pool.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            placeholders = ','.join(['%s'] * len(usernames))
            cursor.execute(
                f"""
                SELECT pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                       pd.FlawlessWins, pd.MatchMvps,
                       AVG(gp.kills)      AS avg_kills,
                       SUM(gp.firstblood) AS first_bloods
                FROM PlayerData pd
                LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
                WHERE pd.LastPlayerName IN ({placeholders})
                  AND (pd.Wins + pd.Losses) >= 1
                GROUP BY pd.UUID, pd.LastPlayerName, pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                         pd.FlawlessWins, pd.MatchMvps
                """,
                usernames,
            )
            players = cursor.fetchall()
    finally:
        conn.close()

    found = {p['LastPlayerName'].lower() for p in players}
    missing = [u for u in usernames if u.lower() not in found]
    if missing:
        return jsonify(error=f"Players not found: {', '.join(missing)}"), 404

    player_inputs = [
        {
            'username':      p['LastPlayerName'],
            'wins':          p['Wins'],
            'losses':        p['Losses'],
            'kills':         p['Kills'],
            'deaths':        p['Deaths'],
            'flawless_wins': p['FlawlessWins'],
            'match_mvps':    p['MatchMvps'],
            'avg_kills_pg':  float(p['avg_kills']) if p['avg_kills'] is not None else None,
            'first_bloods':  int(p['first_bloods']) if p['first_bloods'] is not None else 0,
        }
        for p in players
    ]

    result = game_predictor.predict(player_inputs)

    if result is None:
        return jsonify(error='Predictor not available'), 503

    return jsonify(predictions=result)


if __name__ == "__main__":
    _pool = make_pool()
    recommender    = _load('recommender.joblib',    ClassRecommender)
    archetype_clf  = _load('archetypes.joblib',     ArchetypeClassifier)
    win_predictor  = _load('win_predictor.joblib',  WinPredictor)
    game_predictor = _load('game_predictor.joblib', GamePredictor)
    kmeans_clf     = _load('kmeans.joblib',          KMeansClusterer)

    app.run(host='0.0.0.0', port=8000)
