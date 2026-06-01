import { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { fetchRecommendation, fetchArchetype } from '../../api/stats.js';
import { CLASSES } from '../../utils/classes.js';
import './Labs.css';
import {
    FaFlask, FaLightbulb, FaUser, FaChartLine,
    FaFire, FaLock, FaSearch, FaSkull, FaCrown, FaShieldAlt, FaStar,
} from 'react-icons/fa';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

const FEATURES = [
    { id: 'recommender', label: 'Class Recommender', icon: <FaLightbulb />, available: true },
    { id: 'archetype',   label: 'Player Archetype',  icon: <FaUser />,      available: true },
    { id: 'predictor',   label: 'Win Predictor',     icon: <FaChartLine />, available: false },
    { id: 'rival',       label: 'Rival Finder',      icon: <FaFire />,      available: false },
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
                <div>
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
                        <span className="labs-results-player">{result.username}</span>
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
                    <li><span>Model</span>A Random Forest classifier with 200 decision trees. Balanced class weights ensure that rarely-played classes still get fair representation in predictions.</li>
                    <li><span>Features</span>Each player is represented by six stats: K/D ratio, win rate, flawless win rate, MVP rate, level, and best winstreak. These capture both how aggressive and how successful a player tends to be.</li>
                    <li><span>Training data</span>Only players with at least 10 matches are included, and only classes with at least 5 games played are considered as valid targets. This filters out noise from players or classes with too little data.</li>
                    <li><span>Refresh</span>The model retrains on all current server data once a day, so recommendations stay accurate as the player base grows.</li>
                </ul>
            </div>
        </div>
    );
}

const ARCHETYPE_META = {
    slayer:     { icon: <FaSkull />,     color: '#ef4444', tagline: 'High K/D ratio and kills per game' },
    tactician:  { icon: <FaChartLine />, color: '#3b82f6', tagline: 'High win rate and flawless win rate' },
    clutch:     { icon: <FaCrown />,     color: '#f59e0b', tagline: 'High MVP rate and best winstreak' },
    veteran:    { icon: <FaShieldAlt />, color: '#10b981', tagline: 'High level and total games played' },
    allrounder: { icon: <FaStar />,      color: '#8b5cf6', tagline: 'Balanced K/D, win rate, MVP, and level' },
};

const RADAR_LABELS = {
    kdr:           'K/D',
    wlr:           'Win Rate',
    flawless_rate: 'Flawless',
    mvp_rate:      'MVP',
    level:         'Level',
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
                <div>
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
                        <span className="labs-results-player">{result.username}</span>
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
                    <li><span>Archetypes</span>Five distinct playstyle profiles: Slayer, Tactician, Clutch, Veteran, and All-Rounder. Each is defined by a different combination of stats.</li>
                    <li><span>Scoring</span>Each player's stats are converted to server-wide percentile ranks, then scored against each archetype's stat profile. The best match wins.</li>
                    <li><span>Game data</span>Where available, per-game data from recorded matches is used to improve kills-per-game accuracy.</li>
                    <li><span>Refresh</span>Percentile distributions retrain daily as new players and matches are added.</li>
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
    const [active, setActive] = useState('recommender');

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
                            AI-powered tools built on Minezone player data. Features are experimental
                            and updated as we collect more data.
                        </p>

                        <p className="labs-sidebar-section-label">Features</p>

                        <nav className="labs-sidebar-nav">
                            {FEATURES.map(f => (
                                <button
                                    key={f.id}
                                    className={`labs-sidebar-item${active === f.id ? ' active' : ''}${f.available ? '' : ' locked'}`}
                                    onClick={() => f.available && setActive(f.id)}
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
                </main>
            </div>
            <Footer />
        </div>
    );
}
