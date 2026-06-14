import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

EXCLUDED_CLASSES = {25, 37, 38, 42, 43, 65, 69, 101, 102, 103, 104, 105}
BAYESIAN_ALPHA = 5

# Non-vaulted class IDs, must match frontend classes.js
VALID_CLASS_IDS = {
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 41, 44, 45, 46,
    47, 48, 49, 50, 51, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66,
    67, 68, 70, 71, 72,
}


class ClassRecommender:
    def __init__(self):
        self._model = None        # RF: used to suggest unexplored classes
        self._scaler = None
        self._class_avg_wr = {}   # ClassID → avg win rate across all players (Bayesian prior)

    @property
    def ready(self):
        return self._model is not None and bool(self._class_avg_wr)

    # -----------------------------
    # HELPERS
    # -----------------------------

    def _player_features(self, wins, losses, kills, deaths,
                         flawless_wins, match_mvps, level, best_winstreak):
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
            kills / max(deaths, 1),
            wins / max(total, 1),
            flawless_wins / max(wins, 1),
            match_mvps / max(total, 1),
            float(level),
            best_winstreak / max(wins, 1),
        ]

    def _bayesian_wr(self, class_id, games_played, games_won):
        avg = self._class_avg_wr.get(class_id, 0.5)
        return (games_won + BAYESIAN_ALPHA * avg) / (games_played + BAYESIAN_ALPHA)

    # -----------------------------
    # TRAINING
    # -----------------------------

    def train(self, df_players, df_classes):
        valid = df_classes[df_classes['ClassID'].isin(VALID_CLASS_IDS)]

        if valid.empty:
            print("No class data found for training")
            return

        # Per-class average win rate across all players (Bayesian prior)
        wr = valid['GamesWon'] / valid['GamesPlayed']
        self._class_avg_wr = valid.assign(wr=wr).groupby('ClassID')['wr'].mean().to_dict()

        # Group class rows by player UUID, keeping only valid class IDs
        player_classes = {}
        for row in valid.itertuples(index=False):
            player_classes.setdefault(row.UUID, []).append({
                'ClassID': row.ClassID,
                'GamesPlayed': row.GamesPlayed,
                'GamesWon': row.GamesWon,
            })

        players = (
            df_players[
                df_players['UUID'].isin(player_classes) &
                (df_players['total_games'] >= 10)
            ]
            .set_index('UUID')
        )

        X, y = [], []
        for uuid, classes in player_classes.items():
            if uuid not in players.index:
                continue
            p = players.loc[uuid]

            # Label = Bayesian best class (more reliable than raw win rate for small samples)
            best = max(classes, key=lambda c: self._bayesian_wr(int(c['ClassID']), c['GamesPlayed'], c['GamesWon']))
            best_cid = int(best['ClassID'])

            X.append(self._player_features(
                p['Wins'], p['Losses'], p['Kills'], p['Deaths'],
                p['FlawlessWins'], p['MatchMvps'], p['Level'], p['BestWinstreak'],
            ))
            y.append(best_cid)

        if len(X) < 10:
            print(f"Not enough training data: {len(X)} samples")
            return

        X = np.array(X, dtype=float)
        y = np.array(y)

        self._scaler = StandardScaler()
        x_scaled = self._scaler.fit_transform(X)

        self._model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=2,
            max_features='sqrt',
            class_weight='balanced',
            random_state=42,
        )
        self._model.fit(x_scaled, y)
        print(f"Model trained on {len(X)} samples, {len(set(y))} classes")

    # -----------------------------
    # PREDICTION
    # -----------------------------

    def recommend(self, wins, losses, kills, deaths,
                  flawless_wins, match_mvps, level, best_winstreak,
                  class_stats=None, top_n=3):

        if not self.ready:
            return None

        # RF archetype signal: how well does each class fit this player's style?
        player_feats = self._player_features(
            wins, losses, kills, deaths,
            flawless_wins, match_mvps, level, best_winstreak,
        )
        X = self._scaler.transform([player_feats])
        probs = self._model.predict_proba(X)[0]
        prob_map = {int(cls): float(p) for cls, p in zip(self._model.classes_, probs)}
        max_prob = max(probs) or 1e-9

        # Score played classes: 50% archetype fit (RF) + 50% personal win rate.
        # RF probability is normalized relative to the highest-predicted class so
        # the two signals are on the same 0–1 scale.
        played_scored = []
        for c in (class_stats or []):
            cid = int(c['ClassID'])
            if cid not in VALID_CLASS_IDS or c['GamesPlayed'] < 5:
                continue
            rf_norm = prob_map.get(cid, 0.0) / max_prob
            win_rate = min(c['GamesWon'] / c['GamesPlayed'], 1.0)
            score = 0.5 * rf_norm + 0.5 * win_rate
            played_scored.append((score, cid))

        played_scored.sort(reverse=True)
        results = [
            {"classId": cid, "confidence": round(score * 100, 1)}
            for score, cid in played_scored[:top_n]
        ]

        if len(results) >= top_n:
            return results

        # Not enough played history, pad with RF explore suggestions
        played_ids = {cid for _, cid in played_scored}
        n_needed = top_n - len(results)

        explore = []
        for cls, prob in sorted(zip(self._model.classes_, probs), key=lambda t: t[1], reverse=True):
            cid = int(cls)
            if cid in VALID_CLASS_IDS and cid not in played_ids:
                explore.append({"classId": cid, "confidence": round(float(prob) / max_prob * 100, 1)})
                if len(explore) >= n_needed:
                    break

        return results + explore
