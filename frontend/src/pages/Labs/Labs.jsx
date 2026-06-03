import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { fetchRecommendation, fetchArchetype, fetchWinPrediction, fetchGamePrediction, fetchTrend, fetchPlayerCluster, fetchClusterMap } from '../../api/stats.js';
import { CLASSES } from '../../utils/classes.js';
import './Labs.css';
import {
    FaFlask, FaLightbulb, FaUser, FaChartLine, FaCloud,
    FaFire, FaLock, FaSearch, FaSkull, FaCrown, FaBolt, FaStar, FaTrophy, FaChartArea, FaChevronDown, FaBrain,
} from 'react-icons/fa';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ScatterChart, Scatter,
    ResponsiveContainer,
} from 'recharts';

const ML_FEATURES = [
    { id: 'recommender', label: 'Class Recommender', icon: <FaLightbulb />, available: true },
    { id: 'predictor',   label: 'Win Predictor',     icon: <FaChartLine />, available: true },
    { id: 'match',       label: 'Match Predictor',   icon: <FaTrophy />,    available: true },
    { id: 'clusters',    label: 'Clusters',  icon: <FaCloud />,     available: true },
];

const TOOL_FEATURES = [
    { id: 'trend',     label: 'Performance Trend', icon: <FaChartArea />, available: true },
    { id: 'archetype', label: 'Player Archetype',  icon: <FaUser />,      available: true },
];

function getClassName(id) {
    return CLASSES.get(id)?.name ?? 'Unknown';
}

function RecommendCard({ rec, rank }) {
    return (
        <div
            className={`labs-rec-card labs-rec-rank-${rank}`}
            style={{ animationDelay: `${(rank - 1) * 0.1}s` }}
        >
            <span className="labs-rec-rank-num">0{rank}</span>
            <div className="labs-rec-body">
                <span className="labs-rec-class">{getClassName(rec.classId)}</span>
                <div className="labs-rec-bar-track">
                    <div
                        className="labs-rec-bar"
                        style={{
                            '--pct': `${rec.confidence}%`,
                            animationDelay: `${(rank - 1) * 0.1 + 0.15}s`,
                        }}
                    />
                </div>
            </div>
            <span className="labs-rec-confidence">{rec.confidence}%</span>
        </div>
    );
}

function ClassRecommender() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        setNotFound(false);
        try {
            const data = await fetchRecommendation(username.trim());
            setResult(data);
        } catch (err) {
            if (err.status === 404) {
                setNotFound(true);
            } else {
                setError('The ML service is unavailable. Make sure it is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="labs-feature">
            <div className="labs-feature-header">
                <div className="labs-feature-icon-wrap">
                    <FaLightbulb />
                </div>
                <div className="labs-feature-text">
                    <h2 className="labs-feature-title">Class Recommender</h2>
                    <p className="labs-feature-desc">
                        Not sure which class fits your playstyle? Enter any username and we'll
                        analyze how they play, looking at their kill rate, win rate, and streaks,
                        then match them with the classes that similar players tend to dominate with.
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
                    {loading
                        ? <><span className="labs-spinner" />Analyzing</>
                        : 'Analyze'
                    }
                </button>
            </form>

            {loading && (
                <div className="labs-scanning">
                    <div className="labs-scan-line" />
                    <span className="labs-scan-text">Processing player data<span className="labs-scan-dots" /></span>
                </div>
            )}

            {notFound && !loading && (
                <div className="labs-error labs-error-notfound">
                    No player found with that username.
                </div>
            )}

            {error && !loading && (
                <div className="labs-error">{error}</div>
            )}

            {result && !loading && (
                <div className="labs-results">
                    <div className="labs-results-meta">
                        <span className="labs-results-tag">ANALYSIS COMPLETE</span>
                        <a className="labs-results-player" href={`/stats/${result.username}`}>{result.username}</a>
                    </div>
                    <div className="labs-rec-list">
                        {result.recommendations
                            .filter(rec => !CLASSES.get(rec.classId)?.vaulted)
                            .map((rec, i) => (
                                <RecommendCard key={rec.classId} rec={rec} rank={i + 1} />
                            ))}
                        {result.recommendations.length === 0 && (
                            <p className="labs-no-data">
                                Not enough match data to generate a recommendation.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="labs-tech-details">
                <span className="labs-tech-label">How It Works</span>
                <ul className="labs-tech-list">
                    <li><span>Class history</span>Your win rate per class is calculated from every class you've played 5+ games on.</li>
                    <li><span>Similar players</span>Your stats are matched against the server to find players with a similar profile, then we look at which classes they win with most.</li>
                    <li><span>Score</span>Each class is scored 50% from your own performance with it and 50% from what similar players tend to win with. Both signals need to agree for a class to rank highly.</li>
                </ul>
            </div>
        </div>
    );
}

const ARCHETYPE_META = {
    regular:    { icon: <FaCloud />, color: '#6b7280', tagline: 'High game count, low output' },
    phantom:    { icon: <FaBolt />,  color: '#8b5cf6', tagline: 'Wins without dying. High flawless rate.' },
    ace:        { icon: <FaCrown />, color: '#f59e0b', tagline: 'High MVP rate and first blood rate' },
    slayer:     { icon: <FaSkull />, color: '#ef4444', tagline: 'High K/D ratio and kills per game' },
    allrounder: { icon: <FaStar />,  color: '#3b82f6', tagline: 'Balanced across all stats' },
};

const RADAR_LABELS = {
    kdr:              'K/D',
    wlr:              'Win Rate',
    flawless_rate:    'Flawless',
    mvp_rate:         'MVP',
    first_blood_rate: 'First Blood',
};

function ArchetypePanel() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        setNotFound(false);
        try {
            setResult(await fetchArchetype(username.trim()));
        } catch (err) {
            if (err.status === 404) setNotFound(true);
            else setError('The ML service is unavailable. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    const meta = result ? ARCHETYPE_META[result.archetype.id] : null;

    const radarData = result
        ? Object.entries(result.percentiles).map(([k, v]) => ({
              stat: RADAR_LABELS[k] ?? k,
              value: v,
          }))
        : [];

    return (
        <div className="labs-feature">
            <div className="labs-feature-header">
                <div className="labs-feature-icon-wrap">
                    <FaUser />
                </div>
                <div className="labs-feature-text">
                    <h2 className="labs-feature-title">Player Archetype</h2>
                    <p className="labs-feature-desc">
                        Enter a username to see what kind of player they are. Based on their full
                        match history across kills, wins, streaks, and experience.
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
                    <span className="labs-scan-text">Processing player data<span className="labs-scan-dots" /></span>
                </div>
            )}

            {notFound && !loading && (
                <div className="labs-error labs-error-notfound">No player found with that username.</div>
            )}
            {error && !loading && (
                <div className="labs-error">{error}</div>
            )}

            {result && !loading && meta && (
                <div className="labs-archetype-result">
                    <div className="labs-results-meta">
                        <span className="labs-results-tag">ANALYSIS COMPLETE</span>
                        <a className="labs-results-player" href={`/stats/${result.username}`}>{result.username}</a>
                    </div>

                    <div className="labs-archetype-body">
                        <div className="labs-archetype-badge" style={{ '--arch-color': meta.color }}>
                            <span className="labs-archetype-icon">{meta.icon}</span>
                            <div>
                                <p className="labs-archetype-name">{result.archetype.name}</p>
                                <p className="labs-archetype-desc">{result.archetype.desc}</p>
                            </div>
                        </div>

                        <div className="labs-archetype-radar">
                            <ResponsiveContainer width="100%" height={240}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                    <PolarAngleAxis
                                        dataKey="stat"
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        dataKey="value"
                                        stroke={meta.color}
                                        fill={meta.color}
                                        fillOpacity={0.15}
                                        strokeWidth={1.5}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="labs-archetype-breakdown">
                            <p className="labs-tech-label" style={{ marginBottom: '12px' }}>Archetype Breakdown</p>
                            {result.scores.map(s => {
                                const m = ARCHETYPE_META[s.id];
                                return (
                                    <div key={s.id} className="labs-arch-row">
                                        <span className="labs-arch-row-icon" style={{ color: m.color }}>{m.icon}</span>
                                        <div className="labs-arch-row-label">
                                            <span className="labs-arch-row-name">{s.name}</span>
                                            <span className="labs-arch-row-tagline">{m.tagline}</span>
                                        </div>
                                        <div className="labs-arch-bar-track">
                                            <div
                                                className="labs-arch-bar"
                                                style={{ '--pct': `${s.pct}%`, '--color': m.color }}
                                            />
                                        </div>
                                        <span className="labs-arch-row-pct">{s.pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="labs-tech-details">
                <span className="labs-tech-label">How It Works</span>
                <ul className="labs-tech-list">
                    <li><span>Archetypes</span>Five profiles: Slayer (K/D + kills), Phantom (flawless wins), Ace (MVPs + first bloods), All-Rounder (balanced), Coaster (high game count, low output).</li>
                    <li><span>Scoring</span>Each stat is ranked as a server-wide percentile and scored against each archetype's profile. The closest match wins.</li>
                </ul>
            </div>
        </div>
    );
}

function WinGauge({ pct }) {
    const arcRef = useRef(null);
    const radius = 54;
    const circ = 2 * Math.PI * radius;
    const targetOffset = circ - (pct / 100) * circ;
    const color = '#f59e0b';

    useEffect(() => {
        const el = arcRef.current;
        if (!el) return;
        el.style.strokeDashoffset = circ;
        const raf = requestAnimationFrame(() => {
            el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
            el.style.strokeDashoffset = targetOffset;
        });
        return () => cancelAnimationFrame(raf);
    }, [pct, circ, targetOffset]);

    return (
        <svg viewBox="0 0 120 120" className="win-gauge-svg">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
                ref={arcRef}
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
                transform="rotate(-90 60 60)"
            />
            <text x="60" y="56" textAnchor="middle" className="win-gauge-pct" fill={color}>{pct}%</text>
            <text x="60" y="72" textAnchor="middle" className="win-gauge-sub">WIN PROBABILITY</text>
        </svg>
    );
}

function WinPredictor() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        setNotFound(false);
        try {
            setResult(await fetchWinPrediction(username.trim()));
        } catch (err) {
            if (err.status === 404) setNotFound(true);
            else setError('The ML service is unavailable. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    const pct = result?.win_probability;
    const actual = result?.actual_win_rate;
    const delta = pct != null && actual != null ? Math.round((pct - actual) * 10) / 10 : null;

    return (
        <div className="labs-feature">
            <div className="labs-feature-header">
                <div className="labs-feature-icon-wrap">
                    <FaChartLine />
                </div>
                <div className="labs-feature-text">
                    <h2 className="labs-feature-title">Win Predictor</h2>
                    <p className="labs-feature-desc">
                        See the win rate a player's stats predict, and how it compares to how
                        they're actually performing. If the numbers differ, it means they're either
                        over or underperforming relative to players with a similar profile.
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
                    {loading ? <><span className="labs-spinner" />Analyzing</> : 'Predict'}
                </button>
            </form>

            {loading && (
                <div className="labs-scanning">
                    <div className="labs-scan-line" />
                    <span className="labs-scan-text">Processing player data<span className="labs-scan-dots" /></span>
                </div>
            )}

            {notFound && !loading && (
                <div className="labs-error labs-error-notfound">No player found with that username.</div>
            )}
            {error && !loading && (
                <div className="labs-error">{error}</div>
            )}

            {result && !loading && (
                <div className="labs-predict-result">
                    <div className="labs-results-meta">
                        <span className="labs-results-tag">ANALYSIS COMPLETE</span>
                        <a className="labs-results-player" href={`/stats/${result.username}`}>{result.username}</a>
                    </div>

                    <div className="labs-predict-body">
                        <div className="labs-predict-gauge-wrap">
                            <WinGauge pct={pct} />
                        </div>

                        <div className="labs-predict-compare">
                            <div className="labs-predict-compare-row">
                                <span className="labs-predict-compare-label">
                                    Career win rate
                                    <span className="labs-predict-sublabel">matches what shows on their stats page</span>
                                </span>
                                <span className="labs-predict-compare-val">{actual}%</span>
                            </div>
                            <div className="labs-predict-compare-divider" />
                            <div className="labs-predict-compare-row">
                                <span className="labs-predict-compare-label">
                                    Expected win rate
                                    <span className="labs-predict-sublabel">what players with similar stats typically win</span>
                                </span>
                                <span className="labs-predict-compare-val" style={{ color: '#f59e0b' }}>
                                    {pct}%
                                    {delta !== null && delta !== 0 && (
                                        <span className="labs-predict-delta" style={{ color: delta > 0 ? '#22c55e' : '#ef4444' }}>
                                            {delta > 0 ? ` +${delta}%` : ` ${delta}%`}
                                        </span>
                                    )}
                                </span>
                            </div>
                            {delta !== null && (
                                <p className="labs-predict-insight">
                                    {delta > 5
                                        ? `${result.username}'s stats predict a higher win rate than their career record shows.`
                                        : delta < -5
                                        ? `${result.username} is winning more than players with similar stats typically do.`
                                        : `${result.username}'s career win rate lines up with what their stats predict.`
                                    }
                                </p>
                            )}
                        </div>

                        {result.key_factors?.length > 0 && (
                            <div className="labs-predict-factors">
                                <span className="labs-tech-label" style={{ marginBottom: '10px' }}>What's driving this prediction</span>
                                {result.key_factors.map(f => (
                                    <div key={f.stat} className="labs-predict-factor-row">
                                        <span className={`labs-predict-factor-arrow ${f.direction}`}>
                                            {f.direction === 'up' ? '↑' : '↓'}
                                        </span>
                                        <div className="labs-predict-factor-body">
                                            <span className="labs-predict-factor-stat">{f.stat}</span>
                                            <span className="labs-predict-factor-effect">
                                                {f.above_avg ? 'Above the server average.' : 'Below the server average.'}
                                                {' '}
                                                {f.direction === 'up' ? 'Predicts more wins.' : 'Predicts fewer wins.'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="labs-tech-details">
                <span className="labs-tech-label">How It Works</span>
                <ul className="labs-tech-list">
                    <li><span>Expected win rate</span>Trained on server match history to predict what win rate a player's stat profile typically produces. May differ from their actual career rate since it's based on how players with similar stats tend to perform.</li>
                    <li><span>Driving factors</span>The three stats with the most influence on the prediction, each showing whether it's above or below the server average and whether that pushes the number up or down.</li>
                </ul>
            </div>
        </div>
    );
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

function TrendPanel() {
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
        ? [...new Map(
            baseResult.games
                .filter(g => g.class_id != null)
                .map(g => [g.class_id, g.class_id])
          ).values()]
            .map(id => ({ id, name: getClassName(id), count: baseResult.games.filter(g => g.class_id === id).length }))
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

function MatchCard({ prediction, rank }) {
    return (
        <div
            className={`labs-rec-card labs-rec-rank-${Math.min(rank, 3)}`}
            style={{ animationDelay: `${(rank - 1) * 0.08}s` }}
        >
            <span className="labs-rec-rank-num">{rank < 10 ? `0${rank}` : rank}</span>
            <div className="labs-rec-body">
                <a className="labs-rec-class" href={`/stats/${prediction.username}`}>
                    {prediction.username}
                </a>
                <div className="labs-rec-bar-track">
                    <div
                        className="labs-rec-bar"
                        style={{
                            '--pct': `${prediction.win_probability}%`,
                            animationDelay: `${(rank - 1) * 0.08 + 0.15}s`,
                        }}
                    />
                </div>
            </div>
            <span className="labs-rec-confidence">{prediction.win_probability}%</span>
        </div>
    );
}

function MatchPredictor() {
    const [inputVal, setInputVal] = useState('');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const addPlayer = () => {
        const names = inputVal.trim().split(/\s+/).filter(Boolean);
        if (!names.length) return;
        setPlayers(prev => {
            const existing = new Set(prev.map(p => p.toLowerCase()));
            const toAdd = names.filter(n => !existing.has(n.toLowerCase()));
            return [...prev, ...toAdd].slice(0, 8);
        });
        setInputVal('');
        setResult(null);
        setError(null);
    };

    const removePlayer = (name) => {
        setPlayers(prev => prev.filter(p => p !== name));
        setResult(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (players.length < 2) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            setResult(await fetchGamePrediction(players));
        } catch (err) {
            setError(err.message || 'The ML service is unavailable. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="labs-feature">
            <div className="labs-feature-header">
                <div className="labs-feature-icon-wrap">
                    <FaTrophy />
                </div>
                <div className="labs-feature-text">
                    <h2 className="labs-feature-title">Match Predictor</h2>
                    <p className="labs-feature-desc">
                        Add 2 to 8 players and see who the model predicts will win.
                        Trained on historical match outcomes using each player's stats profile.
                    </p>
                </div>
            </div>

            <form className="labs-match-form" onSubmit={handleSubmit}>
                <div className="labs-match-input-row">
                    <div className="labs-input-wrap">
                        <FaSearch className="labs-input-icon" />
                        <input
                            className="labs-input"
                            type="text"
                            placeholder={players.length >= 8 ? 'Maximum 8 players' : 'Add a player...'}
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ''))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } }}
                            autoComplete="off"
                            spellCheck={false}
                            disabled={players.length >= 8}
                        />
                    </div>
                    <button
                        type="button"
                        className="labs-btn"
                        onClick={addPlayer}
                        disabled={!inputVal.trim() || players.length >= 8}
                    >
                        Add
                    </button>
                </div>

                {players.length > 0 && (
                    <div className="labs-match-chips">
                        {players.map(name => (
                            <span key={name} className="labs-match-chip">
                                {name}
                                <button
                                    type="button"
                                    className="labs-match-chip-remove"
                                    onClick={() => removePlayer(name)}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <button
                    className="labs-btn"
                    type="submit"
                    disabled={loading || players.length < 2}
                >
                    {loading
                        ? <><span className="labs-spinner" />Predicting</>
                        : players.length >= 2
                            ? `Predict (${players.length} players)`
                            : 'Add at least 2 players'
                    }
                </button>
            </form>

            {loading && (
                <div className="labs-scanning">
                    <div className="labs-scan-line" />
                    <span className="labs-scan-text">Analyzing matchup<span className="labs-scan-dots" /></span>
                </div>
            )}

            {error && !loading && (
                <div className="labs-error labs-error-notfound">{error}</div>
            )}

            {result && !loading && (
                <div className="labs-results">
                    <div className="labs-results-meta">
                        <span className="labs-results-tag">PREDICTION COMPLETE</span>
                    </div>
                    <div className="labs-rec-list">
                        {result.predictions.map((p, i) => (
                            <MatchCard key={p.username} prediction={p} rank={i + 1} />
                        ))}
                    </div>
                </div>
            )}

            <div className="labs-tech-details">
                <span className="labs-tech-label">How It Works</span>
                <ul className="labs-tech-list">
                    <li><span>Model</span>Trained on historical matches to learn which stat patterns predict who places first. Each player is scored from their profile and probabilities are scaled relative to the pool, so they always sum to 100%.</li>
                </ul>
            </div>
        </div>
    );
}

const KMEANS_STAT_NAMES = {
    kdr:      'K/D ratio',
    wlr:      'win rate',
    mvp_rate: 'MVP rate',
    kills_pg: 'kills per game',
};

const CLUSTER_PALETTE = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#6b7280'];


function KMeansPanel() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [mapData, setMapData] = useState(null);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetchClusterMap().then(setMapData).catch(() => {});
    }, []);

    // Recolor dots by 2D nearest centroid so they always match the group assignment.
    // Recolor by nearest centroid in 2D; stored p.c labels may be from an older model.
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

function PointField() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const target = { x: -9999, y: -9999 };
        let points = [];
        let animId;

        function sqDist(a, b) {
            return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        }

        function easeInOutCirc(t) {
            return t < 0.5
                ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
                : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2;
        }

        function shiftPoint(p) {
            p.startX = p.x;
            p.startY = p.y;
            p.targetX = p.originX - 50 + Math.random() * 100;
            p.targetY = p.originY - 50 + Math.random() * 100;
            p.duration = (1 + Math.random()) * 1000;
            p.elapsed = 0;
        }

        function init() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const W = canvas.width;
            const H = canvas.height;
            points = [];

            for (let x = 0; x < W; x += W / 20) {
                for (let y = 0; y < H; y += H / 20) {
                    const px = x + Math.random() * (W / 20);
                    const py = y + Math.random() * (H / 20);
                    points.push({
                        x: px, y: py,
                        originX: px, originY: py,
                        startX: px, startY: py,
                        targetX: px, targetY: py,
                        duration: (1 + Math.random()) * 1000,
                        elapsed: Math.random() * 1000,
                        active: 0, circleActive: 0,
                        radius: 2 + Math.random() * 2,
                        closest: [],
                    });
                }
            }

            for (const p1 of points) {
                p1.closest = [...points]
                    .filter(p => p !== p1)
                    .sort((a, b) => sqDist(p1, a) - sqDist(p1, b))
                    .slice(0, 5);
            }
        }

        let lastTs = 0;
        function tick(ts) {
            const dt = Math.min(ts - lastTs, 50);
            lastTs = ts;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of points) {
                p.elapsed += dt;
                const t = Math.min(p.elapsed / p.duration, 1);
                const e = easeInOutCirc(t);
                p.x = p.startX + (p.targetX - p.startX) * e;
                p.y = p.startY + (p.targetY - p.startY) * e;
                if (t >= 1) shiftPoint(p);

                const d = sqDist(target, p);
                if (d < 4000)       { p.active = 0.3;  p.circleActive = 0.6; }
                else if (d < 20000) { p.active = 0.1;  p.circleActive = 0.3; }
                else if (d < 40000) { p.active = 0.02; p.circleActive = 0.1; }
                else                { p.active = 0;    p.circleActive = 0;   }

                if (p.active > 0) {
                    for (const q of p.closest) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(245,159,11,${p.active})`;
                        ctx.stroke();
                    }
                }
                if (p.circleActive > 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(245,159,11,${p.circleActive})`;
                    ctx.fill();
                }
            }

            animId = requestAnimationFrame(tick);
        }

        init();
        animId = requestAnimationFrame(tick);

        const onMove = e => { target.x = e.clientX; target.y = e.clientY; };
        const onResize = () => { cancelAnimationFrame(animId); init(); animId = requestAnimationFrame(tick); };

        globalThis.addEventListener('mousemove', onMove);
        globalThis.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(animId);
            globalThis.removeEventListener('mousemove', onMove);
            globalThis.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="labs-point-field" />;
}

export function Labs() {
    const { module } = useParams();
    const navigate = useNavigate();
    const active = module || 'recommender';

    return (
        <div className="labs-page">
            <div className="labs-bg-grid" />
            <PointField />
            <div className="labs-glow labs-glow-cyan" />
            <div className="labs-glow labs-glow-purple" />

            <Navbar />

            <div className="labs-layout">
                <aside className="labs-sidebar">
                    <div className="labs-sidebar-sticky">
                        <div className="labs-sidebar-brand">
                            <FaFlask className="labs-sidebar-flask" />
                            <div className="labs-sidebar-brand-text">
                                <span className="labs-sidebar-name">LABS</span>
                                <span className="labs-sidebar-badge">BETA</span>
                            </div>
                        </div>

                        <p className="labs-sidebar-about">
                            Experimental features built on Minezone player data. Prediction tools retrain
                            daily as new matches are recorded.
                        </p>

                        <p className="labs-sidebar-section-label">Predictions</p>

                        <nav className="labs-sidebar-nav">
                            {ML_FEATURES.map(f => (
                                <button
                                    key={f.id}
                                    className={`labs-sidebar-item${active === f.id ? ' active' : ''}${f.available ? '' : ' locked'}`}
                                    onClick={() => f.available && navigate(`/labs/${f.id}`)}
                                >
                                    <span className="labs-sidebar-item-icon">{f.icon}</span>
                                    <span className="labs-sidebar-item-label">{f.label}</span>
                                    {!f.available && <FaLock className="labs-sidebar-lock" />}
                                </button>
                            ))}
                        </nav>

                        <p className="labs-sidebar-section-label" style={{ marginTop: '20px' }}>Tools</p>

                        <nav className="labs-sidebar-nav">
                            {TOOL_FEATURES.map(f => (
                                <button
                                    key={f.id}
                                    className={`labs-sidebar-item${active === f.id ? ' active' : ''}${f.available ? '' : ' locked'}`}
                                    onClick={() => f.available && navigate(`/labs/${f.id}`)}
                                >
                                    <span className="labs-sidebar-item-icon">{f.icon}</span>
                                    <span className="labs-sidebar-item-label">{f.label}</span>
                                    {!f.available && <FaLock className="labs-sidebar-lock" />}
                                </button>
                            ))}
                        </nav>

                    </div>
                </aside>

                <main className="labs-content">
                    {active === 'recommender' && <ClassRecommender />}
                    {active === 'archetype'   && <ArchetypePanel />}
                    {active === 'predictor'   && <WinPredictor />}
                    {active === 'match'       && <MatchPredictor />}
                    {active === 'trend'       && <TrendPanel />}
                    {active === 'clusters'     && <KMeansPanel />}
                </main>
            </div>
            <Footer />
        </div>
    );
}
