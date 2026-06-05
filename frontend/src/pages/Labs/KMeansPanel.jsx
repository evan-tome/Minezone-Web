import { useState, useEffect, useMemo } from 'react';
import { FaCloud, FaSearch } from 'react-icons/fa';
import { fetchPlayerCluster, fetchClusterMap } from '../../api/stats.js';
import {
    ScatterChart, Scatter, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from 'recharts';

const KMEANS_STAT_NAMES = {
    kdr:      'K/D ratio',
    wlr:      'win rate',
    mvp_rate: 'MVP rate',
    kills_pg: 'kills per game',
};

const CLUSTER_PALETTE = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#6b7280'];

export function KMeansPanel() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [mapData, setMapData] = useState(null);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetchClusterMap().then(setMapData).catch(() => {});
    }, []);

    const groupedPoints = useMemo(() => {
        if (!mapData) return Array(CLUSTER_PALETTE.length).fill([]);
        const centroids = mapData.centroid_2d;
        const groups = Array.from({ length: CLUSTER_PALETTE.length }, () => []);
        for (const p of mapData.map_points) {
            let nearest = 0, minDist = Infinity;
            for (const c of centroids) {
                const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
                if (d < minDist) { minDist = d; nearest = c.id; }
            }
            groups[nearest].push(p);
        }
        return groups;
    }, [mapData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        setNotFound(false);
        try {
            setResult(await fetchPlayerCluster(username.trim()));
        } catch (err) {
            if (err.status === 404) setNotFound(true);
            else setError('The ML service is unavailable. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="labs-feature">
            <div className="labs-feature-header">
                <div className="labs-feature-icon-wrap">
                    <FaCloud />
                </div>
                <div className="labs-feature-text">
                    <h2 className="labs-feature-title">Clusters</h2>
                    <p className="labs-feature-desc">
                        Enter a username to place them into a playstyle group,
                        each shaped by how players cluster across K/D, win rate, MVP rate,
                        and kills per game. Shows who else in the server plays the same way.
                    </p>
                </div>
            </div>

            <form className="labs-form" onSubmit={handleSubmit}>
                <div className="labs-input-wrap">
                    <FaSearch className="labs-input-icon" />
                    <input
                        className="labs-input"
                        type="text"
                        placeholder="Minecraft username..."
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
                <button className="labs-btn" type="submit" disabled={loading || !username.trim()}>
                    {loading ? <><span className="labs-spinner" />Analyzing</> : 'Analyze'}
                </button>
            </form>

            {loading && (
                <div className="labs-scanning">
                    <div className="labs-scan-line" />
                    <span className="labs-scan-text">Placing player in cluster<span className="labs-scan-dots" /></span>
                </div>
            )}
            {notFound && !loading && (
                <div className="labs-error labs-error-notfound">No player found with that username.</div>
            )}
            {error && !loading && <div className="labs-error">{error}</div>}

            {result && !loading && (
                <div className="labs-results-meta">
                    <span className="labs-results-tag">ANALYSIS COMPLETE</span>
                    <a className="labs-results-player" href={`/stats/${result.username}`}>{result.username}</a>
                </div>
            )}

            {mapData && (
                <>
                    <div className="labs-cluster-axis-info">
                        <span>Based on {Object.values(KMEANS_STAT_NAMES).join(', ')}</span>
                    </div>
                    <div className="labs-cluster-map">
                        <ResponsiveContainer width="100%" height={440}>
                            <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                                <XAxis type="number" dataKey="x" hide domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                                <YAxis type="number" dataKey="y" hide domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                                <Tooltip
                                    cursor={false}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        if (d._type === 'player') return (
                                            <div className="chart-tooltip">
                                                <p className="chart-tooltip-name">{result?.username}</p>
                                                <p className="chart-tooltip-value" style={{ color: CLUSTER_PALETTE[result?.cluster_id] }}>Group {result?.cluster_id + 1}</p>
                                            </div>
                                        );
                                        if (d._type === 'centroid') return (
                                            <div className="chart-tooltip">
                                                <p className="chart-tooltip-name">Group {d.id + 1}</p>
                                                <p className="chart-tooltip-value" style={{ color: CLUSTER_PALETTE[d.id] }}>Center</p>
                                            </div>
                                        );
                                        return (
                                            <div className="chart-tooltip">
                                                <p className="chart-tooltip-name">{d.n}</p>
                                                <p className="chart-tooltip-value" style={{ color: CLUSTER_PALETTE[d.c] }}>Group {d.c + 1}</p>
                                            </div>
                                        );
                                    }}
                                />
                                {groupedPoints.map((pts, i) => (
                                    <Scatter key={i} name={`group-${i}`} data={pts} fill={CLUSTER_PALETTE[i]} fillOpacity={0.35} isAnimationActive={false} r={3} />
                                ))}
                                <Scatter
                                    name="centroid"
                                    data={mapData.centroid_2d.map(p => ({ ...p, _type: 'centroid' }))}
                                    isAnimationActive={false}
                                    shape={({ cx, cy, payload }) => (
                                        <g key={payload.id}>
                                            <circle cx={cx} cy={cy} r={7} fill={CLUSTER_PALETTE[payload.id]} fillOpacity={0.9} />
                                            <text x={cx} y={cy - 11} textAnchor="middle" fill={CLUSTER_PALETTE[payload.id]} fontSize={10} fontWeight={700}>G{payload.id + 1}</text>
                                        </g>
                                    )}
                                />
                                {result && (
                                    <Scatter
                                        name="player"
                                        data={[{ ...result.player_pos, _type: 'player' }]}
                                        isAnimationActive={false}
                                        shape={({ cx, cy }) => (
                                            <g>
                                                <circle cx={cx} cy={cy} r={9} fill="white" stroke={CLUSTER_PALETTE[result.cluster_id]} strokeWidth={3} />
                                            </g>
                                        )}
                                    />
                                )}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {mapData.centroid_2d.map(c => (
                            <span key={c.id} style={{ fontSize: '0.78rem', color: CLUSTER_PALETTE[c.id], display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: CLUSTER_PALETTE[c.id], display: 'inline-block' }} />
                                Group {c.id + 1}
                            </span>
                        ))}
                        {result && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                                {result.username}
                            </span>
                        )}
                    </div>
                </>
            )}

            {result && !loading && (
                <div>
                    <div style={{ marginTop: '16px' }}>
                        <p className="labs-tech-label" style={{ marginBottom: '4px' }}>
                            Nearby Players
                            <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '8px' }}>
                                most similar to {result.username} in Group {result.cluster_id + 1} ({result.cluster_size.toLocaleString()} players)
                            </span>
                        </p>
                        <div className="labs-cluster-player-list">
                            {result.similar_players.map(name => (
                                <a key={name} href={`/stats/${name}`} className="labs-cluster-player">{name}</a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="labs-tech-details">
                <span className="labs-tech-label">How It Works</span>
                <ul className="labs-tech-list">
                    <li><span>Grouping</span>Players are clustered by K/D ratio, win rate, MVP rate, and kills per game, each converted to a server-wide percentile so no single stat dominates.</li>
                    <li><span>Number of groups</span>Chosen automatically by testing K=2 through K=8 and picking the point where adding more groups stops meaningfully improving the fit.</li>
                    <li><span>Placement</span>Your stats are converted to the same percentile scale and you're placed in whichever group's center is closest.</li>
                    <li><span>Nearby players</span>The members of your group with the most similar stat profile to yours.</li>
                </ul>
            </div>
        </div>
    );
}
