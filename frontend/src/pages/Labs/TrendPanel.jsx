import { useState, useRef, useEffect } from 'react';
import { FaChartArea, FaSearch, FaChevronDown } from 'react-icons/fa';
import { fetchTrend } from '../../api/stats.js';
import { CLASSES } from '../../utils/classes.js';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';

function getClassName(id) {
    return CLASSES.get(id)?.name ?? 'Unknown';
}

function buildChartData(games) {
    const W = 5;
    return games.map((_, i) => {
        const slice = games.slice(Math.max(0, i - W + 1), i + 1);
        const wins = slice.filter(g => g.won).length;
        return {
            game: i + 1,
            winRate: Math.round(wins / slice.length * 100),
            kills: parseFloat((slice.reduce((s, g) => s + g.kills, 0) / slice.length).toFixed(1)),
        };
    });
}

function getTrend(data) {
    if (data.length < 3) return 'consistent';
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((s, d) => s + d.winRate, 0) / n;
    let num = 0, den = 0;
    data.forEach((d, i) => {
        num += (i - xMean) * (d.winRate - yMean);
        den += (i - xMean) ** 2;
    });
    const slope = den === 0 ? 0 : num / den;
    if (slope >  1) return 'improving';
    if (slope < -1) return 'declining';
    return 'consistent';
}

const TREND_META = {
    improving:  { label: 'Improving',  color: '#22c55e' },
    declining:  { label: 'Declining',  color: '#ef4444' },
    consistent: { label: 'Consistent', color: '#f59e0b' },
};

export function TrendPanel() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [baseResult, setBaseResult] = useState(null);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [classFilter, setClassFilter] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = e => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);
        setResult(null);
        setBaseResult(null);
        setError(null);
        setNotFound(false);
        setClassFilter('');
        try {
            const data = await fetchTrend(username.trim());
            setResult(data);
            setBaseResult(data);
        } catch (err) {
            if (err.status === 404) setNotFound(true);
            else setError('Failed to load trend data.');
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = async (classId) => {
        setClassFilter(classId);
        setDropdownOpen(false);
        if (!classId) {
            setResult(baseResult);
            return;
        }
        setLoading(true);
        try {
            setResult(await fetchTrend(result.username, classId));
        } catch {
            setError('Failed to load class trend data.');
        } finally {
            setLoading(false);
        }
    };

    const playedClasses = baseResult
        ? Object.entries(baseResult.class_counts ?? {})
            .map(([id, count]) => ({ id: Number(id), name: getClassName(Number(id)), count }))
            .filter(c => c.count >= 5)
            .sort((a, b) => b.count - a.count)
        : [];

    const activeGames = result?.games ?? [];

    const chartData  = buildChartData(activeGames);
    const trend      = getTrend(chartData);
    const trendMeta  = TREND_META[trend];
    const hasEnough  = activeGames.length >= 5;

    const recentGames    = activeGames.slice(-10);
    const recentWinRate  = recentGames.length
        ? Math.round(recentGames.filter(g => g.won).length / recentGames.length * 100)
        : null;
    const recentKills    = recentGames.length
        ? (recentGames.reduce((s, g) => s + g.kills, 0) / recentGames.length).toFixed(1)
        : null;
    const overallWinRate = activeGames.length
        ? Math.round(activeGames.filter(g => g.won).length / activeGames.length * 100)
        : null;
    const overallKills   = activeGames.length
        ? (activeGames.reduce((s, g) => s + g.kills, 0) / activeGames.length).toFixed(1)
        : null;

    return (
        <div className="labs-feature">
            <div className="labs-feature-header">
                <div className="labs-feature-icon-wrap">
                    <FaChartArea />
                </div>
                <div className="labs-feature-text">
                    <h2 className="labs-feature-title">Performance Trend</h2>
                    <p className="labs-feature-desc">
                        See how a player's win rate has shifted over their last 100 recorded games
                        and whether they're on an upward or downward trajectory.
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
                    {loading ? <><span className="labs-spinner" />Loading</> : 'Analyze'}
                </button>
            </form>

            {loading && (
                <div className="labs-scanning">
                    <div className="labs-scan-line" />
                    <span className="labs-scan-text">Loading match history<span className="labs-scan-dots" /></span>
                </div>
            )}

            {notFound && !loading && (
                <div className="labs-error labs-error-notfound">No player found with that username.</div>
            )}
            {error && !loading && (
                <div className="labs-error">{error}</div>
            )}

            {result && !loading && !hasEnough && (
                <div className="labs-error labs-error-notfound">
                    {classFilter
                        ? `Not enough recorded games with ${getClassName(Number(classFilter))} to show a trend. At least 5 are required.`
                        : 'Not enough recorded games to show a trend. At least 5 are required.'
                    }
                </div>
            )}

            {result && !loading && hasEnough && (
                <div className="labs-trend-result">
                    <div className="labs-results-meta">
                        <span className="labs-results-tag">ANALYSIS COMPLETE</span>
                        <a className="labs-results-player" href={`/stats/${result.username}`}>{result.username}</a>
                        {hasEnough && (
                            <span className="labs-trend-badge" style={{ color: trendMeta.color, borderColor: trendMeta.color }}>
                                {trendMeta.label}
                            </span>
                        )}
                    </div>

                    {baseResult && (
                        <div className="labs-trend-dropdown" ref={dropdownRef}>
                            <button
                                type="button"
                                className="labs-trend-dropdown-btn"
                                onClick={() => setDropdownOpen(o => !o)}
                            >
                                <span className="labs-trend-dropdown-selected">
                                    {classFilter ? getClassName(Number(classFilter)) : 'All classes'}
                                </span>
                                <span className="labs-trend-dropdown-count">
                                    {result.games.length} game{result.games.length !== 1 ? 's' : ''}
                                </span>
                                <FaChevronDown className={`labs-trend-dropdown-arrow${dropdownOpen ? ' open' : ''}`} />
                            </button>
                            {dropdownOpen && (
                                <div className="labs-trend-dropdown-menu">
                                    <button
                                        type="button"
                                        className={`labs-trend-dropdown-item${!classFilter ? ' active' : ''}`}
                                        onClick={() => handleClassChange('')}
                                    >
                                        <span>All classes</span>
                                        <span className="labs-trend-dropdown-item-count">{baseResult.games.length}</span>
                                    </button>
                                    {playedClasses.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={`labs-trend-dropdown-item${classFilter === String(c.id) ? ' active' : ''}`}
                                            onClick={() => handleClassChange(String(c.id))}
                                        >
                                            <span>{c.name}</span>
                                            <span className="labs-trend-dropdown-item-count">{c.count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="labs-trend-chart">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 24 }}>
                                <defs>
                                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={trendMeta.color} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={trendMeta.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="game" ticks={Array.from({ length: Math.floor(chartData.length / 10) }, (_, i) => (i + 1) * 10)} tick={{ fill: '#8a7860', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Game', fill: '#8a7860', fontSize: 11, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle' } }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#8a7860', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} label={{ value: 'Win Rate', angle: -90, fill: '#8a7860', fontSize: 11, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1200', border: '1px solid rgba(245,159,11,0.2)', borderRadius: 8, fontSize: '0.85rem' }}
                                    labelFormatter={v => `Game ${v}`}
                                    formatter={v => [`${v}%`, 'Win rate (5-game avg)']}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="winRate"
                                    stroke={trendMeta.color}
                                    strokeWidth={2}
                                    fill="url(#trendGrad)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: trendMeta.color }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="labs-trend-stats">
                        <div className="labs-trend-stat">
                            <span className="labs-trend-stat-label">Recent win rate</span>
                            <span className="labs-trend-stat-val">{recentWinRate}%</span>
                            <span className="labs-trend-stat-sub">last 10 games</span>
                        </div>
                        <div className="labs-trend-stat">
                            <span className="labs-trend-stat-label">Overall win rate</span>
                            <span className="labs-trend-stat-val">{overallWinRate}%</span>
                            <span className="labs-trend-stat-sub">all tracked games</span>
                        </div>
                        <div className="labs-trend-stat">
                            <span className="labs-trend-stat-label">Recent kills/game</span>
                            <span className="labs-trend-stat-val">{recentKills}</span>
                            <span className="labs-trend-stat-sub">last 10 games</span>
                        </div>
                        <div className="labs-trend-stat">
                            <span className="labs-trend-stat-label">Overall kills/game</span>
                            <span className="labs-trend-stat-val">{overallKills}</span>
                            <span className="labs-trend-stat-sub">all tracked games</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="labs-tech-details">
                <span className="labs-tech-label">How It Works</span>
                <ul className="labs-tech-list">
                    <li><span>Rolling average</span>Each point on the chart is the win rate across the 5 games leading up to it, smoothing out individual results to show the overall shape.</li>
                    <li><span>Trend direction</span>Determined by comparing the first and second halves of the window. Improving or declining if they differ by more than 10 points, otherwise consistent.</li>
                </ul>
            </div>
        </div>
    );
}
