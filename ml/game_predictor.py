import numpy as np
from collections import defaultdict
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

    def train(self, conn):
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                gp.game_id,
                gp.uuid,
                gp.placement,
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
        """)
        rows = cursor.fetchall()
        cursor.close()

        games = defaultdict(list)
        for row in rows:
            games[row['game_id']].append(row)

        # Only games with 2+ players and exactly one winner
        valid_games = {
            gid: players for gid, players in games.items()
            if len(players) >= 2
            and sum(1 for p in players if p['placement'] == 1) == 1
        }

        if len(valid_games) < 50:
            print(f"Not enough data to train game predictor ({len(valid_games)} games).")
            return

        # Compute raw features for every (game_id, uuid)
        feat_map = {}
        all_feats = []
        for gid, players in valid_games.items():
            for p in players:
                f = self._to_features(
                    p['Wins'] or 0, p['Losses'] or 0,
                    p['Kills'] or 0, p['Deaths'] or 0,
                    p['FlawlessWins'] or 0, p['MatchMvps'] or 0,
                    float(p['avg_kills_pg']) if p['avg_kills_pg'] is not None else None,
                    float(p['avg_first_blood'] or 0),
                )
                feat_map[(gid, p['uuid'])] = f
                all_feats.append(f)

        self._scaler = StandardScaler()
        self._scaler.fit(np.array(all_feats, dtype=float))

        # Pairwise training: winner features minus each loser's features
        # P(winner beats loser) = sigmoid(β · (feat_winner - feat_loser))
        # No intercept — constant shifts cancel in the softmax at inference
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

        X = np.array(X, dtype=float)
        y = np.array(y)

        self._model = LogisticRegression(fit_intercept=False, max_iter=1000, random_state=42)
        self._model.fit(X, y)
        print(f"Game predictor trained on {len(valid_games)} games.")

    def predict(self, players):
        """
        players: list of dicts — username, wins, losses, kills, deaths,
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
