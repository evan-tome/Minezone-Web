import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

_VAULTED       = {25, 37, 38, 42, 43, 65, 69, 101, 102, 103, 104, 105}
MIN_GAMES_PER_DAY = 2
MIN_DAYS          = 5
SHORT_WINDOW      = 5   # recent trend
LONG_WINDOW       = 14  # historical baseline


class BalanceMonitor:
    """
    Compares each class's recent rolling win rate (5-day) against its
    longer-term baseline (14-day). Trains Isolation Forest on the deviation
    across all classes so it learns what a normal short-term fluctuation
    looks like, then flags classes whose recent average has diverged unusually.
    Returns one result per class, not per day.
    """

    def __init__(self):
        self._model   = None
        self._scaler  = None
        self._flagged = []

    @property
    def ready(self):
        return self._model is not None

    def train(self, df_class_daily):
        df = df_class_daily[df_class_daily['games'] >= MIN_GAMES_PER_DAY].copy()
        df['win_rate'] = df['wins'] / df['games']
        df['date'] = pd.to_datetime(df['date'])

        records = []
        latest  = []

        for class_id, group in df.groupby('class_id'):
            group = group.sort_values('date').copy()
            if len(group) < MIN_DAYS:
                continue

            group['short_avg'] = group['win_rate'].rolling(SHORT_WINDOW, min_periods=2).mean()
            group['long_avg']  = group['win_rate'].rolling(LONG_WINDOW,  min_periods=4).mean()
            group['deviation'] = group['short_avg'] - group['long_avg']
            group['class_id']  = class_id

            valid = group.dropna(subset=['deviation'])
            if valid.empty:
                continue

            records.append(valid)
            entry = valid.iloc[-1].copy()
            entry['games_recent'] = int(group.tail(SHORT_WINDOW)['games'].sum())
            latest.append(entry)

        if not records:
            print("Not enough time-series data for balance monitor.")
            return

        all_data  = pd.concat(records, ignore_index=True)
        latest_df = pd.DataFrame(latest).reset_index(drop=True)

        # Train on all historical deviations so the model knows what normal looks like
        X = all_data[['deviation']].values.astype(float)
        self._scaler = StandardScaler()
        x_scaled = self._scaler.fit_transform(X)

        self._model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
        self._model.fit(x_scaled)

        # Score only the most recent state of each class
        x_latest = self._scaler.transform(latest_df[['deviation']].values.astype(float))
        latest_df['score']   = self._model.score_samples(x_latest)
        latest_df['flagged'] = self._model.predict(x_latest) == -1

        self._flagged = [
            {
                'class_id':     int(row['class_id']),
                'recent_avg':   round(float(row['short_avg'])    * 100, 1),
                'baseline':     round(float(row['long_avg'])     * 100, 1),
                'deviation':    round(float(row['deviation'])    * 100, 1),
                'games_recent': int(row['games_recent']),
                'as_of':        str(row['date'].date()),
            }
            for _, row in latest_df[latest_df['flagged']].sort_values('score').iterrows()
        ]

        n = latest_df['class_id'].nunique()
        print(f"Balance monitor trained on {len(all_data)} class-days across {n} classes, {len(self._flagged)} flagged.")

    def get_flagged(self):
        if not self.ready:
            return None
        return self._flagged
