import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

_FEATURES = ['game_count', 'avg_kills', 'avg_firstblood', 'avg_players_per_game']
MIN_DAYS = 14


class PipelineMonitor:
    """
    Detects anomalous days in game logging using Isolation Forest trained on
    historical daily aggregates. Catches multi-dimensional issues that simple
    threshold checks miss — e.g., game count looks normal but player counts per
    game have silently dropped, indicating partial logging failure.
    """

    def __init__(self):
        self._model = None
        self._scaler = None
        self._status = None

    @property
    def ready(self):
        return self._model is not None

    def train(self, df_daily):
        if len(df_daily) < MIN_DAYS:
            print(f"Not enough daily data for pipeline monitor ({len(df_daily)} days, need {MIN_DAYS}).")
            return

        df = df_daily.sort_values('date').copy()

        # Exclude the last 3 days from the baseline so a current outage
        # doesn't distort what "normal" looks like
        train_df = df.iloc[:-3] if len(df) > 3 else df
        x_train = train_df[_FEATURES].fillna(0).values.astype(float)

        self._scaler = StandardScaler()
        x_train_scaled = self._scaler.fit_transform(x_train)

        # contamination=0.05 → expects up to 5% of historical days to be unusual
        self._model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
        self._model.fit(x_train_scaled)

        # Score the most recent 7 days against the learned baseline
        recent = df.tail(7)
        x_recent = self._scaler.transform(recent[_FEATURES].fillna(0).values.astype(float))
        scores = self._model.score_samples(x_recent)
        preds  = self._model.predict(x_recent)

        issues = [
            {
                'date':                 str(row['date']),
                'anomaly_score':        round(float(scores[i]), 4),
                'game_count':           int(row['game_count']),
                'avg_kills':            round(float(row['avg_kills']), 2),
                'avg_players_per_game': round(float(row['avg_players_per_game']), 2),
            }
            for i, (_, row) in enumerate(recent.iterrows())
            if preds[i] == -1
        ]

        self._status = {
            'healthy':       len(issues) == 0,
            'issues':        issues,
            'days_analyzed': len(recent),
            'baseline_days': len(train_df),
        }

        label = 'healthy' if self._status['healthy'] else f"{len(issues)} day(s) flagged"
        print(f"Pipeline monitor trained on {len(train_df)} days — {label}.")

    def get_status(self):
        if not self.ready:
            return None
        return self._status
