import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

_FEATURE_KEYS = ['kdr', 'wlr', 'flawless_rate', 'mvp_rate', 'kills_pg', 'first_blood_rate']


class GamePredictor:
    def __init__(self):
        self._model = None
        self._scaler = None

    @property
    def ready(self):
        return self._model is not None

    def _to_features(self, wins, losses, kills, deaths,
                     flawless_wins, match_mvps, avg_kills_pg, first_blood_rate):
        total = wins + losses
        return [
            kills / max(deaths, 1),
            wins / max(total, 1),
            flawless_wins / max(wins, 1),
            match_mvps / max(total, 1),
            avg_kills_pg if avg_kills_pg is not None else kills / max(total, 1),
            first_blood_rate or 0.0,
        ]

    def _compute_feat_map(self, valid_games):
        feat_map, all_feats = {}, []
        for gid, players in valid_games.items():
            for p in players:
                f = self._to_features(
                    p['Wins'] or 0, p['Losses'] or 0,
                    p['Kills'] or 0, p['Deaths'] or 0,
                    p['FlawlessWins'] or 0, p['MatchMvps'] or 0,
                    float(p['avg_kills_pg']),
                    float(p['avg_first_blood']),
                )
                feat_map[(gid, p['uuid'])] = f
                all_feats.append(f)
        return feat_map, all_feats

    def _build_pairwise(self, valid_games, feat_map):
        # Winner features minus each loser's features.
        # P(winner beats loser) = sigmoid(β · (feat_winner - feat_loser))
        # No intercept: constant shifts cancel in the softmax at inference.
        X, y = [], []
        for gid, players in valid_games.items():
            winner = next(p for p in players if p['placement'] == 1)
            w_scaled = self._scaler.transform([feat_map[(gid, winner['uuid'])]])[0]
            for p in players:
                if p['uuid'] == winner['uuid']:
                    continue
                p_scaled = self._scaler.transform([feat_map[(gid, p['uuid'])]])[0]
                X.append(w_scaled - p_scaled)
                y.append(1)
                X.append(p_scaled - w_scaled)
                y.append(0)
        return X, y

    def train(self, df_games):
        # Only games with 2+ players and exactly one winner
        valid_games = {
            gid: group.to_dict('records')
            for gid, group in df_games.groupby('game_id')
            if len(group) >= 2 and (group['placement'] == 1).sum() == 1
        }

        if len(valid_games) < 50:
            print(f"Not enough data to train game predictor ({len(valid_games)} games).")
            return

        feat_map, all_feats = self._compute_feat_map(valid_games)
        self._scaler = StandardScaler()
        self._scaler.fit(np.array(all_feats, dtype=float))

        X, y = self._build_pairwise(valid_games, feat_map)
        X = np.array(X, dtype=float)
        y = np.array(y)

        self._model = LogisticRegression(fit_intercept=False, max_iter=1000, random_state=42)
        self._model.fit(X, y)
        print(f"Game predictor trained on {len(valid_games)} games.")

    def predict(self, players):
        """
        players: list of dicts with keys username, wins, losses, kills, deaths,
                 flawless_wins, match_mvps, avg_kills_pg (opt), first_bloods (opt)
        Returns list sorted by win_probability descending.
        """
        if not self.ready:
            return None

        coefs = self._model.coef_[0]

        scored = []
        for p in players:
            total = (p['wins'] or 0) + (p['losses'] or 0)
            fbr = (p['first_bloods'] or 0) / max(total, 1)
            feats = self._to_features(
                p['wins'] or 0, p['losses'] or 0,
                p['kills'] or 0, p['deaths'] or 0,
                p['flawless_wins'] or 0, p['match_mvps'] or 0,
                p.get('avg_kills_pg'), fbr,
            )
            scaled = self._scaler.transform(np.array([feats], dtype=float))[0]
            scored.append({'username': p['username'], 'score': float(np.dot(coefs, scaled))})

        # Softmax: probabilities sum to 100% across the pool
        raw = np.array([s['score'] for s in scored], dtype=float)
        raw -= raw.max()  # numerical stability
        exp_raw = np.exp(raw)
        probs = exp_raw / exp_raw.sum()

        results = [
            {'username': s['username'], 'win_probability': round(float(probs[i]) * 100, 1)}
            for i, s in enumerate(scored)
        ]
        results.sort(key=lambda x: x['win_probability'], reverse=True)
        return results
