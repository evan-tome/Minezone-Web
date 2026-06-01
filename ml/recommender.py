import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from collections import Counter


class ClassRecommender:
    def __init__(self):
        self._model = None
        self._scaler = None
        self._feature_names = [
            "kd_ratio",
            "win_ratio",
            "flawless_ratio",
            "mvp_rate",
            "level",
            "winstreak_per_win"
        ]

    @property
    def ready(self):
        return self._model is not None

    # -----------------------------
    # FEATURE ENGINEERING
    # -----------------------------
    def _feature_vec(self, wins, losses, kills, deaths,
                     flawless_wins, match_mvps,
                     level, best_winstreak):

        wins = wins or 0
        losses = losses or 0
        kills = kills or 0
        deaths = deaths or 0
        flawless_wins = flawless_wins or 0
        match_mvps = match_mvps or 0
        level = level or 0
        best_winstreak = best_winstreak or 0

        total = wins + losses

        return [
            kills / max(deaths, 1),              # kd_ratio
            wins / max(total, 1),                # win_ratio
            flawless_wins / max(wins, 1),        # flawless_ratio
            match_mvps / max(total, 1),          # mvp_rate
            float(level),                        # level
            best_winstreak / max(wins, 1),       # winstreak_per_win
        ]

    # -----------------------------
    # TRAINING
    # -----------------------------
    def train(self, conn):
        cursor = conn.cursor(dictionary=True)

        # IMPORTANT: compute best class per player properly
        cursor.execute("""
            SELECT
                pd.UUID,
                pd.Wins,
                pd.Losses,
                pd.Kills,
                pd.Deaths,
                pd.FlawlessWins,
                pd.MatchMvps,
                pd.Level,
                pd.BestWinstreak,
                (
                    SELECT pc.ClassID
                    FROM PlayerClasses pc
                    WHERE pc.UUID = pd.UUID
                      AND pc.GamesPlayed >= 5
                      AND pc.ClassID NOT IN (25, 37, 38, 42, 43, 65, 69, 101, 102, 103, 104, 105)
                    ORDER BY (pc.GamesWon / NULLIF(pc.GamesPlayed, 0)) DESC
                    LIMIT 1
                ) AS BestClass
            FROM PlayerData pd
            WHERE (pd.Wins + pd.Losses) >= 10
        """)

        rows = cursor.fetchall()
        cursor.close()

        X = []
        y = []

        for row in rows:
            if row["BestClass"] is None:
                continue

            X.append(self._feature_vec(
                row['Wins'], row['Losses'],
                row['Kills'], row['Deaths'],
                row['FlawlessWins'], row['MatchMvps'],
                row['Level'], row['BestWinstreak']
            ))

            y.append(int(row["BestClass"]))

        if len(X) < 10:
            print(f"Not enough training data: {len(X)} samples")
            return

        X = np.array(X, dtype=float)
        y = np.array(y)

        # optional scaling (RandomForest doesn't require it but helps consistency)
        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        self._model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            random_state=42,
            class_weight="balanced"
        )

        self._model.fit(X_scaled, y)

        print(f"Model trained on {len(X)} samples")

    # -----------------------------
    # PREDICTION
    # -----------------------------
    def recommend(self, wins, losses, kills, deaths,
                  flawless_wins, match_mvps,
                  level, best_winstreak,
                  top_n=3):

        if not self.ready:
            return None

        x = self._feature_vec(
            wins, losses, kills, deaths,
            flawless_wins, match_mvps,
            level, best_winstreak
        )

        X = self._scaler.transform([x])

        probs = self._model.predict_proba(X)[0]
        classes = self._model.classes_

        ranked = sorted(
            zip(classes, probs),
            key=lambda x: x[1],
            reverse=True
        )

        return [
            {
                "classId": int(cls),
                "confidence": round(float(prob) * 100, 1)
            }
            for cls, prob in ranked[:top_n]
        ]