import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler

_FEATURE_KEYS = ['flawless_rate', 'mvp_rate', 'kills_pg']

STAT_DISPLAY = {
    'flawless_rate': 'flawless rate',
    'mvp_rate':      'MVP rate',
    'kills_pg':      'kills per game',
}


class WinPredictor:
    def __init__(self):
        self._model = None
        self._scaler = None
        self._feature_corrs = None

    @property
    def ready(self):
        return self._model is not None

    def _to_features(self, wins, losses, kills, deaths,
                     flawless_wins, match_mvps, avg_kills_pg):
        total = wins + losses
        return [
            flawless_wins / max(wins + losses, 1),
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
                IF(gp.placement = 1, 1, 0) AS won
            FROM scb_game_players gp
            JOIN PlayerData pd ON pd.UUID = gp.uuid
            JOIN (
                SELECT uuid, AVG(kills) AS avg_kills_pg
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

        # Pearson correlation of each feature with target — used to determine direction at inference
        self._feature_corrs = np.array([
            float(np.corrcoef(X[:, i], y)[0, 1])
            for i in range(X.shape[1])
        ])

        base = GradientBoostingClassifier(n_estimators=100, max_depth=3, random_state=42)
        self._model = CalibratedClassifierCV(base, cv=5, method='sigmoid')
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

        # Average feature importances across the 5 calibration folds
        importances = np.mean([
            clf.estimator.feature_importances_
            for clf in self._model.calibrated_classifiers_
        ], axis=0)

        indexed = sorted(
            [(i, STAT_DISPLAY[k], float(importances[i])) for i, k in enumerate(_FEATURE_KEYS)],
            key=lambda x: x[2],
            reverse=True,
        )

        return {
            'win_probability': round(prob * 100, 1),
            'key_factors': [
                {
                    'stat':      name,
                    # up = player's value on this stat aligns with what wins (above avg on positive stat, or below avg on negative stat)
                    'direction': 'up' if (X_scaled[0][idx] > 0) == (self._feature_corrs[idx] > 0) else 'down',
                    'above_avg': bool(X_scaled[0][idx] > 0),
                }
                for idx, name, _ in indexed[:3]
            ],
        }
