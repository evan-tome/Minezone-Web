import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

_FEATURE_KEYS = ['kdr', 'wlr', 'flawless_rate', 'mvp_rate', 'kills_pg']

STAT_DISPLAY = {
    'kdr':           'K/D ratio',
    'wlr':           'win rate',
    'flawless_rate': 'flawless rate',
    'mvp_rate':      'MVP rate',
    'kills_pg':      'kills per game',
}


class WinPredictor:
    def __init__(self):
        self._model = None
        self._scaler = None

    @property
    def ready(self):
        return self._model is not None

    def _to_features(self, wins, losses, kills, deaths,
                     flawless_wins, match_mvps, avg_kills_pg):
        total = wins + losses
        return [
            kills / max(deaths, 1),
            wins / max(total, 1),
            flawless_wins / max(wins, 1),
            match_mvps / max(total, 1),
            avg_kills_pg if avg_kills_pg is not None else kills / max(total, 1),
        ]

    def train(self, conn):
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                pd.FlawlessWins, pd.MatchMvps,
                ag.avg_kills_pg,
                ag.avg_first_blood,
                IF(gp.placement = 1, 1, 0) AS won
            FROM scb_game_players gp
            JOIN PlayerData pd ON pd.UUID = gp.uuid
            JOIN (
                SELECT uuid,
                       AVG(kills)      AS avg_kills_pg,
                       AVG(firstblood) AS avg_first_blood
                FROM scb_game_players
                GROUP BY uuid
            ) ag ON ag.uuid = gp.uuid
            WHERE (pd.Wins + pd.Losses) >= 10
        """)
        rows = cursor.fetchall()
        cursor.close()

        if len(rows) < 50:
            print(f"Not enough data to train win predictor ({len(rows)} rows).")
            return

        X, y = [], []
        for r in rows:
            X.append(self._to_features(
                r['Wins'], r['Losses'], r['Kills'], r['Deaths'],
                r['FlawlessWins'], r['MatchMvps'],
                float(r['avg_kills_pg']) if r['avg_kills_pg'] is not None else None,
            ))
            y.append(int(r['won']))

        X = np.array(X, dtype=float)
        y = np.array(y)

        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        self._model = LogisticRegression(max_iter=1000, random_state=42)
        self._model.fit(X_scaled, y)
        print(f"Win predictor trained on {len(X)} game rows.")

    def predict(self, wins, losses, kills, deaths,
                flawless_wins, match_mvps,
                avg_kills_pg=None):
        if not self.ready:
            return None

        feats = self._to_features(
            wins, losses, kills, deaths,
            flawless_wins, match_mvps,
            avg_kills_pg,
        )

        X_scaled = self._scaler.transform(np.array([feats], dtype=float))
        prob = float(self._model.predict_proba(X_scaled)[0][1])

        # (original_index, display_name, contribution), index preserved so above_avg is correct
        coefs = self._model.coef_[0]
        indexed = sorted(
            [
                (i, STAT_DISPLAY[k], float(coefs[i] * X_scaled[0][i]))
                for i, k in enumerate(_FEATURE_KEYS)
            ],
            key=lambda x: abs(x[2]),
            reverse=True,
        )

        return {
            'win_probability': round(prob * 100, 1),
            'key_factors': [
                {
                    'stat':      name,
                    'direction': 'up' if impact >= 0 else 'down',
                    'above_avg': bool(X_scaled[0][idx] > 0),
                }
                for idx, name, impact in indexed[:3]
            ],
        }
