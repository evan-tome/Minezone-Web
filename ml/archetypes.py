import numpy as np

ARCHETYPES = [
    {
        'id':    'regular',
        'name':  'Coaster',
        'desc':  'Always in the lobby. Clocks more games than most. The wins and kills will come.',
        'weights': None,  # custom scoring: games_pct × (1 - avg_performance)
    },
    {
        'id':    'phantom',
        'name':  'Phantom',
        'desc':  'Wins without dying. Slips through matches clean and is nearly impossible to pin down.',
        'weights': {'flawless_rate': 4.0},
    },
    {
        'id':    'ace',
        'name':  'Ace',
        'desc':  'Always the standout player. Gets first blood, earns the MVP, and does it consistently.',
        'weights': {'mvp_rate': 2.5, 'first_blood_rate': 1.5},
    },
    {
        'id':    'slayer',
        'name':  'Slayer',
        'desc':  'Racks up kills every game. Aggressive, relentless, and always in the thick of the fight.',
        'weights': {'kdr': 2.0, 'kills_pg': 2.0},
    },
    {
        'id':    'allrounder',
        'name':  'All-Rounder',
        'desc':  'No obvious weakness. Holds their own across every stat that matters.',
        'weights': None,  # custom scoring: avg_pct × balance
    },
]

STAT_LABELS = {
    'kdr':              'K/D Ratio',
    'wlr':              'Win Rate',
    'flawless_rate':    'Flawless Rate',
    'mvp_rate':         'MVP Rate',
    'kills_pg':         'Kills Per Game',
    'first_blood_rate': 'First Blood Rate',
    'games':            'Games Played',
}

WEIGHT_TOTAL = 4.0

# Stats used to measure "performance" for the Regular archetype check
_PERF_KEYS = ['kdr', 'wlr', 'mvp_rate', 'first_blood_rate']


class ArchetypeClassifier:
    def __init__(self):
        self._distributions = {}
        self._trained = False

    @property
    def ready(self):
        return self._trained

    def _compute_stats(self, wins, losses, kills, deaths,
                       flawless_wins, match_mvps,
                       avg_kills_pg=None, first_bloods=None):
        total = wins + losses
        return {
            'kdr':              kills / max(deaths, 1),
            'wlr':              wins / max(total, 1),
            'flawless_rate':    flawless_wins / max(wins, 1),
            'mvp_rate':         match_mvps / max(total, 1),
            'kills_pg':         avg_kills_pg if avg_kills_pg is not None else kills / max(total, 1),
            'first_blood_rate': (first_bloods or 0) / max(total, 1),
            'games':            float(total),
        }

    def train(self, conn):
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                pd.UUID,
                pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                pd.FlawlessWins, pd.MatchMvps,
                AVG(gp.kills) AS avg_kills_pg,
                SUM(gp.firstblood) AS first_bloods
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
                r['FlawlessWins'], r['MatchMvps'],
                float(r['avg_kills_pg']) if r['avg_kills_pg'] is not None else None,
                int(r['first_bloods']) if r['first_bloods'] is not None else 0,
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
                 flawless_wins, match_mvps,
                 avg_kills_pg=None, first_bloods=None):
        if not self.ready:
            return None

        stats = self._compute_stats(wins, losses, kills, deaths,
                                    flawless_wins, match_mvps,
                                    avg_kills_pg, first_bloods)
        pct = {k: self._percentile(k, v) for k, v in stats.items()}

        radar_keys = ['kdr', 'wlr', 'flawless_rate', 'mvp_rate', 'first_blood_rate']

        raw = {}
        for arch in ARCHETYPES:
            if arch['id'] == 'regular':
                # High only when game count is elite AND performance is below average.
                # Good players are pulled away by their performance archetypes.
                avg_perf = float(np.mean([pct.get(k, 0.5) for k in _PERF_KEYS]))
                raw['regular'] = pct.get('games', 0.5) * WEIGHT_TOTAL * max(0.0, 1.0 - avg_perf)
            elif arch['id'] == 'allrounder':
                # Weight by avg performance so uniformly-bad players don't qualify.
                avg_pct = float(np.mean([pct[k] for k in radar_keys]))
                variance = float(np.var([pct[k] for k in radar_keys]))
                raw['allrounder'] = WEIGHT_TOTAL * avg_pct * max(0.0, 1.0 - 6.0 * variance)
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
