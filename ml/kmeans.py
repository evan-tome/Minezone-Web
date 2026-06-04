import numpy as np

STAT_KEYS = ['kdr', 'wlr', 'mvp_rate', 'kills_pg']

MIN_PLAYERS = 30
MAX_ITER    = 100
N_INIT      = 10
MAP_SAMPLE  = 80  # points per cluster sent to the frontend
K_MIN, K_MAX = 2, 8


class KMeansClusterer:
    def __init__(self):
        self.k = None  # determined by elbow method during train()
        self._clusters        = None
        self._cluster_members = None  # {cluster_id: {'names': [...], 'vecs': np.array}}
        self._centers         = None  # precomputed (k, 2) array of 2D centroids
        self._stat_dists      = None
        self._pca_mean        = None
        self._pca_comps       = None
        self._pca_offset      = None  # 2D center for uniform scaling
        self._pca_scale       = None  # uniform scale so both axes share the same range
        self._map_points      = None
        self._centroid_2d     = None
        self._trained         = False

    @property
    def ready(self):
        return self._trained

    def _player_vector(self, row):
        # Converts a raw DB row into the four stat ratios we cluster on.
        # avg_kills_pg can be NULL for players who joined before per-game logging was added.
        wins   = row['Wins']
        losses = row['Losses']
        kills  = row['Kills']
        deaths = row['Deaths']
        total  = wins + losses
        return {
            'kdr':      kills / max(deaths, 1),
            'wlr':      wins / max(total, 1),
            'mvp_rate': row['MatchMvps'] / max(total, 1),
            'kills_pg': float(row['avg_kills_pg']) if row['avg_kills_pg'] else kills / max(total, 1),
        }

    def _to_percentile_vec(self, stats):
        # Returns a [0,1] percentile rank for each stat against the training distribution.
        # Binary search gives fractional position so tied values still get spread out.
        def rank(dist, value):
            lo, hi = 0, len(dist)
            while lo < hi:
                mid = (lo + hi) // 2
                if dist[mid] <= value:
                    lo = mid + 1
                else:
                    hi = mid
            return lo / len(dist)
        return np.array([rank(self._stat_dists[k], stats[k]) for k in STAT_KEYS])

    def _project_2d(self, x):
        # Applies the stored PCA transform and normalizes to roughly [-1, 1] using the training scale.
        raw = (x - self._pca_mean) @ self._pca_comps.T
        return (raw - self._pca_offset) / self._pca_scale

    def _find_k(self, X_2d):
        """Kneedle elbow method on 2D projections: run lightweight K-means over
        K_MIN..K_MAX and pick the K at maximum curvature of the inertia curve."""
        X = X_2d
        rng = np.random.default_rng(99)
        inertias = []
        for k in range(K_MIN, K_MAX + 1):
            best = float('inf')
            for _ in range(3):
                centers = X[rng.choice(len(X), k, replace=False)].copy()
                labels  = np.zeros(len(X), dtype=int)
                for _ in range(50):
                    d  = np.linalg.norm(X[:, None, :] - centers[None, :, :], axis=2)
                    nl = np.argmin(d, axis=1)
                    if np.all(nl == labels):
                        break
                    labels = nl
                    for c in range(k):
                        mask = labels == c
                        if mask.any():
                            centers[c] = X[mask].mean(axis=0)
                best = min(best, float(np.sum((X - centers[labels]) ** 2)))
            inertias.append(best)

        ks  = np.arange(K_MIN, K_MAX + 1, dtype=float)
        y   = np.array(inertias)
        x_n = (ks - ks[0]) / (ks[-1] - ks[0])
        y_n = (y - y[-1]) / (y[0] - y[-1] + 1e-10)
        # Distance from line connecting endpoints in normalized space
        dists = np.abs(x_n + y_n - 1) / np.sqrt(2)
        return int(ks[np.argmax(dists)])

    def train(self, conn):
        # Fetches all players with >= 10 games, builds percentile vectors, runs PCA,
        # picks K via the elbow method, then runs K-means N_INIT times and keeps the best run.
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT pd.UUID, pd.LastPlayerName,
                   pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                   pd.MatchMvps,
                   AVG(gp.kills) AS avg_kills_pg
            FROM PlayerData pd
            LEFT JOIN scb_game_players gp ON gp.uuid = pd.UUID
            WHERE (pd.Wins + pd.Losses) >= 10
              AND pd.Level > 0
            GROUP BY pd.UUID, pd.LastPlayerName,
                     pd.Wins, pd.Losses, pd.Kills, pd.Deaths,
                     pd.MatchMvps
        """)
        rows = cursor.fetchall()
        cursor.close()

        if len(rows) < MIN_PLAYERS:
            print(f"Not enough data to train K-means ({len(rows)} players).")
            return

        all_stats = [self._player_vector(r) for r in rows]
        names     = [r['LastPlayerName'] for r in rows]

        self._stat_dists = {k: sorted(s[k] for s in all_stats) for k in STAT_KEYS}
        X = np.array([self._to_percentile_vec(s) for s in all_stats])

        # PCA to 2D first - clustering happens in this space so map and
        # reported cluster are always consistent
        self._pca_mean  = X.mean(axis=0)
        _, _, Vt        = np.linalg.svd(X - self._pca_mean, full_matrices=False)
        self._pca_comps = Vt[:2]

        # Uniform scaling so both axes share the same unit - prevents visual
        # distortion from PCA components having different variances
        X_2d_raw         = (X - self._pca_mean) @ self._pca_comps.T
        self._pca_offset  = X_2d_raw.mean(axis=0)
        self._pca_scale   = float(np.abs(X_2d_raw - self._pca_offset).max()) or 1.0
        X_2d              = (X_2d_raw - self._pca_offset) / self._pca_scale

        self.k = self._find_k(X_2d)
        print(f"Elbow method selected K={self.k}.")

        # K-means on 2D projections
        rng = np.random.default_rng(42)
        best_inertia  = float('inf')
        best_labels   = None
        best_centers  = None

        for _ in range(N_INIT):
            centers = X_2d[rng.choice(len(X_2d), self.k, replace=False)].copy()
            labels  = np.zeros(len(X_2d), dtype=int)

            for _ in range(MAX_ITER):
                dists      = np.linalg.norm(X_2d[:, None, :] - centers[None, :, :], axis=2)
                new_labels = np.argmin(dists, axis=1)
                if np.all(new_labels == labels):
                    break
                labels = new_labels
                for c in range(self.k):
                    mask = labels == c
                    if mask.any():
                        centers[c] = X_2d[mask].mean(axis=0)

            inertia = float(np.sum((X_2d - centers[labels]) ** 2))
            if inertia < best_inertia:
                best_inertia = inertia
                best_labels  = labels.copy()
                best_centers = centers.copy()

        # Build cluster descriptors
        clusters = []
        for c in range(self.k):
            mask      = best_labels == c
            idxs      = np.where(mask)[0]
            center_2d = best_centers[c]
            # Centroid stats: mean of members' 4D percentile vecs for display
            mean_4d   = X[idxs].mean(axis=0)

            clusters.append({
                'id':        c,
                '_orig_c':   c,
                'center_2d': center_2d.tolist(),
                'centroid':  {k: round(float(mean_4d[j]) * 100, 1) for j, k in enumerate(STAT_KEYS)},
                'size':      int(mask.sum()),
            })

        clusters.sort(key=lambda cl: -cl['size'])
        for i, cl in enumerate(clusters):
            cl['id'] = i

        # Precompute 2D centers for classify()
        self._centers = np.array([cl['center_2d'] for cl in clusters])

        # Per-cluster member lookup: 4D vecs for player-relative similarity
        self._cluster_members = {}
        for cl in clusters:
            mask = best_labels == cl['_orig_c']
            idxs = np.where(mask)[0]
            self._cluster_members[cl['id']] = {
                'names': [names[i] for i in idxs],
                'vecs':  X[idxs],
            }

        # Build map data
        vis_rng    = np.random.default_rng(0)
        map_points = []
        centroid_2d = []

        for cl in clusters:
            mask   = best_labels == cl['_orig_c']
            idxs   = np.where(mask)[0]
            sample = vis_rng.choice(idxs, min(MAP_SAMPLE, len(idxs)), replace=False)
            for i in sample:
                map_points.append({
                    'x': round(float(X_2d[i, 0]), 3),
                    'y': round(float(X_2d[i, 1]), 3),
                    'c': cl['id'],
                    'n': names[i],
                })
            c = cl['center_2d']
            centroid_2d.append({'x': round(float(c[0]), 3), 'y': round(float(c[1]), 3), 'id': cl['id']})

        self._map_points  = map_points
        self._centroid_2d = centroid_2d
        self._clusters    = clusters
        self._trained     = True
        print(f"K-means trained on {len(rows)} players, {self.k} clusters.")

    def classify(self, wins, losses, kills, deaths, match_mvps, avg_kills_pg=None):
        # Returns the player's cluster, the 10 most similar players, and their 2D map position.
        if not self._trained:
            return None

        stats = self._player_vector({
            'Wins': wins, 'Losses': losses, 'Kills': kills, 'Deaths': deaths,
            'MatchMvps': match_mvps, 'avg_kills_pg': avg_kills_pg,
        })
        x    = self._to_percentile_vec(stats)
        x_2d = self._project_2d(x)

        # Assign cluster by 2D distance so it matches the map
        nearest = int(np.argmin(np.linalg.norm(self._centers - x_2d, axis=1)))
        cluster = self._clusters[nearest]

        # Similarity by 4D distance within the cluster
        members = self._cluster_members[cluster['id']]
        dists   = np.linalg.norm(members['vecs'] - x, axis=1)
        top_idx = np.argsort(dists)[:11]
        similar = [members['names'][i] for i in top_idx]

        return {
            'cluster_id':      cluster['id'],
            'cluster_size':    cluster['size'],
            'similar_players': similar,
            'player_pos':      {'x': round(float(x_2d[0]), 3), 'y': round(float(x_2d[1]), 3)},
        }

    def get_map_data(self):
        # Returns a sampled set of player points and centroid positions for the cluster map visualization.
        if not self._trained:
            return None
        return {'map_points': self._map_points, 'centroid_2d': self._centroid_2d}
