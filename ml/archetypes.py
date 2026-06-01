import numpy as np

ARCHETYPES = [
    {
        'id':    'slayer',
        'name':  'Slayer',
        'desc':  'Racks up kills every match. Aggressive, hard to ignore in a fight, and always in the action.',
        'weights': {'kdr': 2.0, 'kills_pg': 2.0},
    },
    {
        'id':    'tactician',
        'name':  'Tactician',
        'desc':  'Wins more than raw stats suggest. Smart positioning and class reads over brute force.',
        'weights': {'wlr': 2.0, 'flawless_rate': 1.5, 'mvp_rate': 0.5},
    },
    {
        'id':    'clutch',
        'name':  'Clutch',
        'desc':  'Performs when it counts. Known for standout games, long streaks, and MVP moments.',
        'weights': {'mvp_rate': 2.0, 'streak_ratio': 1.5, 'flawless_rate': 0.5},
    },
    {
        'id':    'veteran',
        'name':  'Veteran',
        'desc':  'High level with plenty of games behind them. Has seen most situations and knows how to handle them.',
        'weights': {'level': 2.5, 'games': 1.5},
    },
    {
        'id':    'allrounder',
        'name':  'All-Rounder',
        'desc':  'No glaring weaknesses. Comfortable in any situation and adapts to whatever the match demands.',
        'weights': None,
    },
]

STAT_LABELS = {
    'kdr':           'K/D Ratio',
    'wlr':           'Win Rate',
    'flawless_rate': 'Flawless Rate',
    'mvp_rate':      'MVP Rate',
    'kills_pg':      'Kills Per Game',
    'streak_ratio':  'Winstreak Ratio',
    'level':         'Level',
    'games':         'Games Played',
}

WEIGHT_TOTAL = 4.0


class ArchetypeClassifier:
    def __init__(self):
        self._distributions = {}
        self._trained = False

    @property
    def ready(self):
        return self._trained

    def _compute_stats(self, wins, losses, kills, deaths,
                       flawless_wins, match_mvps, level, best_winstreak,
                       avg_kills_pg=None):
        total = wins + losses
        return {
            'kdr':           kills / max(deaths, 1),
            'wlr':           wins / max(total, 1),
            'flawless_rate': flawless_wins / max(wins, 1),
            'mvp_rate':      match_mvps / max(total, 1),
            'kills_pg':      avg_kills_pg if avg_kills_pg is not None else kills / max(total, 1),
            'streak_ratio':  best_winstreak / max(wins, 1),
            'level':         float(level),
            'games':         float(total),
        }

    def train(self, conn):
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                pd.UUID,
                pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                pd.FlawlessWins, pd.MatchMvps, pd.Level, pd.BestWinstreak,
                AVG(gp.kills) AS avg_kills_pg
            FROM PlayerData pd
            LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
            WHERE (pd.Wins + pd.Losses) >= 10
            GROUP BY pd.UUID
        """)
        rows = cursor.fetchall()
        cursor.close()

        if len(rows) < 10:
            print(f"Not enough data to train archetype classifier ({len(rows)} players).")
            return

        all_stats = [
            self._compute_stats(
                r['Wins'], r['Losses'], r['Kills'], r['Deaths'],
                r['FlawlessWins'], r['MatchMvps'], r['Level'], r['BestWinstreak'],
                float(r['avg_kills_pg']) if r['avg_kills_pg'] is not None else None,
            )
            for r in rows
        ]

        self._distributions = {
            k: sorted(s[k] for s in all_stats)
            for k in all_stats[0]
        }
        self._trained = True
        print(f"Archetype classifier trained on {len(rows)} players.")

    def _percentile(self, stat, value):
        dist = self._distributions.get(stat, [])
        if not dist:
            return 0.5
        lo, hi = 0, len(dist)
        while lo < hi:
            mid = (lo + hi) // 2
            if dist[mid] <= value:
                lo = mid + 1
            else:
                hi = mid
        return lo / len(dist)

    def classify(self, wins, losses, kills, deaths,
                 flawless_wins, match_mvps, level, best_winstreak,
                 avg_kills_pg=None):
        if not self.ready:
            return None

        stats = self._compute_stats(wins, losses, kills, deaths,
                                    flawless_wins, match_mvps, level, best_winstreak,
                                    avg_kills_pg)
        pct = {k: self._percentile(k, v) for k, v in stats.items()}

        radar_keys = ['kdr', 'wlr', 'flawless_rate', 'mvp_rate', 'level']

        raw = {}
        for arch in ARCHETYPES:
            if arch['id'] == 'allrounder':
                variance = float(np.var([pct[k] for k in radar_keys]))
                raw['allrounder'] = WEIGHT_TOTAL * max(0.0, 1.0 - 4.0 * variance)
            else:
                raw[arch['id']] = sum(pct.get(s, 0.5) * w for s, w in arch['weights'].items())

        total = sum(raw.values()) or 1.0
        scores = {k: round(v / total * 100, 1) for k, v in raw.items()}

        top_id = max(scores, key=lambda k: scores[k])
        top_arch = next(a for a in ARCHETYPES if a['id'] == top_id)

        return {
            'archetype': {
                'id':   top_arch['id'],
                'name': top_arch['name'],
                'desc': top_arch['desc'],
            },
            'scores': [
                {'id': a['id'], 'name': a['name'], 'pct': scores[a['id']]}
                for a in ARCHETYPES
            ],
            'percentiles': {k: round(pct[k] * 100, 1) for k in radar_keys},
        }
