import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

_FEATURES = ['kdr', 'wlr', 'flawless_rate', 'mvp_rate', 'kills_pg', 'Level']
MIN_GAMES = 20
MIN_PLAYERS = 50


class AnomalyDetector:
    """
    Flags statistically unusual players using Isolation Forest on six
    normalized stat ratios. Learns the joint distribution of normal play
    so it catches cheaters who excel across multiple stats simultaneously,
    not just a single outlier metric.
    """

    def __init__(self):
        self._model = None
        self._scaler = None
        self._flagged = []

    @property
    def ready(self):
        return self._model is not None

    def train(self, df_players):
        df = df_players[df_players['total_games'] >= MIN_GAMES].copy()

        if len(df) < MIN_PLAYERS:
            print(f"Not enough data for anomaly detector ({len(df)} players).")
            return

        df['kdr']           = df['Kills'] / df['Deaths'].clip(lower=1)
        df['wlr']           = df['Wins'] / df['total_games']
        df['flawless_rate'] = df['FlawlessWins'] / df['Wins'].clip(lower=1)
        df['mvp_rate']      = df['MatchMvps'] / df['total_games']
        df['kills_pg']      = df['avg_kills_pg']

        X = df[_FEATURES].values.astype(float)

        self._scaler = StandardScaler()
        x_scaled = self._scaler.fit_transform(X)

        # contamination=0.02 → expects ~2% of players to be anomalous
        self._model = IsolationForest(n_estimators=200, contamination=0.02, random_state=42)
        self._model.fit(x_scaled)

        df['anomaly_score'] = self._model.score_samples(x_scaled)
        df['flagged']       = self._model.predict(x_scaled) == -1

        flagged_df = df[df['flagged']].nsmallest(50, 'anomaly_score')
        self._flagged = [
            {
                'username':      row['LastPlayerName'],
                'score':         round(float(row['anomaly_score']), 4),
                'kdr':           round(float(row['kdr']), 2),
                'win_rate':      round(float(row['wlr']) * 100, 1),
                'flawless_rate': round(float(row['flawless_rate']) * 100, 1),
                'mvp_rate':      round(float(row['mvp_rate']) * 100, 1),
                'kills_pg':      round(float(row['kills_pg']), 2),
                'level':         int(row['Level']),
                'total_games':   int(row['total_games']),
            }
            for _, row in flagged_df.iterrows()
        ]

        print(f"Anomaly detector trained on {len(df)} players, {len(self._flagged)} flagged.")

    def get_flagged(self):
        if not self.ready:
            return None
        return self._flagged
