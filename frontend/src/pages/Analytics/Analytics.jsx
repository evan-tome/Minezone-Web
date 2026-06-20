import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, CartesianGrid, Legend, PieChart, Pie,
    AreaChart, Area,
} from 'recharts';
import { FaUsers, FaGamepad, FaMedal, FaSkull, FaFish, FaClock, FaChevronDown, FaExclamationTriangle } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { fetchOverview, fetchLevelDistribution, fetchTopByStat, fetchWinRates, fetchAllClassStats, fetchMapPopularity, fetchGamesOverTime, fetchPeakHours, fetchKDRatios } from '../../api/analytics.js';
import { CLASSES } from '../../utils/classes.js';
import '../../App.css';
import './Analytics.css';

const ACCENT = '#e09304';
const BAR_COLORS = ['#e09304', '#d4900a', '#c88010', '#bc7016', '#b0601c',
                    '#a45022', '#984028', '#8c302e', '#802034', '#74103a'];

function getClassName(id) {
    return CLASSES.get(id)?.name ?? `Class ${id}`;
}

// Classifies a class by how it's unlocked: donor rank beats level unlock beats token cost beats free.
function getCategory(id) {
    const c = CLASSES.get(id);
    if (!c) return null;
    if (c.rank)       return 'Donor';
    if (c.level > 0)  return 'Level';
    if (c.cost > 0)   return 'Token';
    return 'Free';
}

const CATEGORY_COLORS = { Free: '#4ade80', Token: '#e09304', Level: '#60a5fa', Donor: '#c084fc' };

function StatCard({ icon, label, value }) {
    return (
        <div className="stat-card">
            <span className="stat-card-icon">{icon}</span>
            <span className="stat-card-value">{value}</span>
            <span className="stat-card-label">{label}</span>
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="stat-card" aria-hidden="true">
            <span className="skeleton-pulse" style={{ width: 18, height: 18, borderRadius: '50%' }} />
            <span className="skeleton-pulse" style={{ width: '55%', height: 16, borderRadius: 4 }} />
            <span className="skeleton-pulse" style={{ width: '75%', height: 9, borderRadius: 4 }} />
        </div>
    );
}

function StatCardError() {
    return (
        <div className="stat-card stat-card-error">
            <FaExclamationTriangle className="stat-card-error-icon" />
            <span className="stat-card-label">Failed to load</span>
        </div>
    );
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name">{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} className="chart-tooltip-value" style={{ color: p.color }}>
                    {p.name}: {Number(p.value).toLocaleString()}
                </p>
            ))}
        </div>
    );
}

function PlayerTick({ x, y, payload, navigate }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0} y={0} dy={4}
                textAnchor="end"
                fontSize={12}
                className="player-tick"
                onClick={() => navigate(`/stats/${payload.value}`)}
            >
                {payload.value}
            </text>
        </g>
    );
}

function ClassesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const winRate = d.played > 0 ? ((d.won / d.played) * 100).toFixed(1) : '0.0';
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name">{label}</p>
            <p className="chart-tooltip-value" style={{ color: '#e09304' }}>Played: {d.played.toLocaleString()}</p>
            <p className="chart-tooltip-value" style={{ color: '#4ade80' }}>Won: {d.won.toLocaleString()}</p>
            <p className="chart-tooltip-name">Win Rate: {winRate}%</p>
        </div>
    );
}

function ChartSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section className="chart-section">
            <button type="button" className="chart-section-title" onClick={() => setOpen(o => !o)} aria-expanded={open}>
                <FaChevronDown className={`chart-section-chevron ${open ? '' : 'collapsed'}`} />
                {title}
            </button>
            {open && <div className="chart-section-body">{children}</div>}
        </section>
    );
}

// Renders a skeleton while loading, an error message (with retry) on failure, a quiet
// empty state when the fetch succeeded with nothing to show, or the chart otherwise —
// every chart card goes through the same three states instead of just vanishing.
function ChartCard({ title, children, full, action, rowSpan, status = 'ready', empty, minHeight = 280, onRetry }) {
    return (
        <div className={`chart-card ${full ? 'chart-card-full' : ''}`}
             style={rowSpan ? { gridRow: `span ${rowSpan}` } : undefined}>
            <div className="chart-card-header">
                <h3 className="chart-card-title">{title}</h3>
                {status === 'ready' && !empty && action}
            </div>
            {status === 'loading' && (
                <div className="chart-skeleton skeleton-pulse" style={{ height: minHeight }} aria-label="Loading chart" />
            )}
            {status === 'error' && (
                <div className="chart-error" style={{ height: minHeight }}>
                    <FaExclamationTriangle className="chart-error-icon" />
                    <p>Couldn't load this chart.</p>
                    {onRetry && <button type="button" className="chart-error-retry" onClick={onRetry}>Retry</button>}
                </div>
            )}
            {status === 'ready' && empty && (
                <div className="chart-empty" style={{ height: minHeight }}>
                    <p>No data yet.</p>
                </div>
            )}
            {status === 'ready' && !empty && children}
        </div>
    );
}

// Shared "ranked leaderboard" bar chart: same rank-gradient coloring, value labels,
// and tooltip shape across every Top 10 / win-rate / K-D list so they read as one family.
function HorizontalBar({
    data, dataKey = 'value', nameKey = 'name', unit,
    domain, height = 300, formatValue, tooltipExtra,
}) {
    const navigate = useNavigate();
    const fmtValue = formatValue ?? (v => Number(v).toLocaleString());
    const fmtTooltip = v => `${fmtValue(v)}${unit ? ` ${unit}` : ''}`;
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={domain} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={nameKey} width={110} axisLine={false} tickLine={false}
                    tick={(props) => <PlayerTick {...props} navigate={navigate} />} />
                <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name">{label}</p>
                            <p className="chart-tooltip-value" style={{ color: ACCENT }}>{fmtTooltip(d[dataKey])}</p>
                            {tooltipExtra && <p className="chart-tooltip-name">{tooltipExtra(d)}</p>}
                        </div>
                    );
                }} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={22}
                    label={{ position: 'right', formatter: fmtValue, fill: 'var(--muted)', fontSize: 12 }}>
                    {data.map((entry, i) => <Cell key={entry[nameKey]} fill={BAR_COLORS[i] ?? BAR_COLORS.at(-1)} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function VerticalBar({ data, dataKey = 'value', nameKey = 'name' }) {
    // With many categories, thin out the x-axis ticks rather than cramming
    // (or angling) every label.
    const tickInterval = data.length > 60 ? Math.ceil(data.length / 60) : 0;
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey={nameKey} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                    interval={tickInterval} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey={dataKey} fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
}

function CategoryTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const winRate = d.played > 0 ? ((d.won / d.played) * 100).toFixed(1) : '0.0';
    const color = CATEGORY_COLORS[label] ?? '#888';
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name" style={{ color, fontWeight: 700 }}>{label}</p>
            <p className="chart-tooltip-value" style={{ color, opacity: 0.55 }}>Played: {d.played.toLocaleString()}</p>
            <p className="chart-tooltip-value" style={{ color }}>Won: {d.won.toLocaleString()}</p>
            <p className="chart-tooltip-name" style={{ color: 'var(--muted)' }}>Win Rate: {winRate}%</p>
        </div>
    );
}

function CategoryChart({ data }) {
    return (
        <>
            <div className="category-legend">
                <span><span className="category-legend-swatch" style={{ opacity: 0.4, background: 'var(--muted)' }} />Games Played</span>
                <span><span className="category-legend-swatch" style={{ background: 'var(--muted)' }} />Games Won</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                    <Bar dataKey="played" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {data.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} opacity={0.4} />)}
                    </Bar>
                    <Bar dataKey="won" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {data.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </>
    );
}

function CategoryPieChart({ data }) {
    const total = data.reduce((s, d) => s + d.won, 0);
    const RADIAN = Math.PI / 180;
    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, won }) => {
        const r = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        const pct = total > 0 ? ((won / total) * 100).toFixed(1) : '0';
        return (
            <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
                {pct}%
            </text>
        );
    };
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="won"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={renderLabel}
                >
                    {data.map(entry => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} />
                    ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const pct = total > 0 ? ((d.won / total) * 100).toFixed(1) : '0.0';
                    const color = CATEGORY_COLORS[d.name] ?? '#888';
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name" style={{ color, fontWeight: 700 }}>{d.name}</p>
                            <p className="chart-tooltip-value" style={{ color }}>{pct}% of wins</p>
                            <p className="chart-tooltip-name">{d.won.toLocaleString()} total wins</p>
                        </div>
                    );
                }} />
                <Legend wrapperStyle={{ fontSize: '0.85rem', color: 'var(--muted)', paddingTop: '8px' }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

function formatHour(h) {
    if (h === 0)  return '12am';
    if (h < 12)  return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
}

function formatDate(dateStr) {
    // parse the components directly so the displayed day doesn't shift with the
    // viewer's timezone offset from the UTC-midnight value the API sends
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MapPopularityChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={520}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 52, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false}
                    tick={{ fill: 'var(--text)', fontSize: 12 }} />
                <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name">{label}</p>
                            <p className="chart-tooltip-value" style={{ color: ACCENT }}>{payload[0].value.toLocaleString()} games</p>
                        </div>
                    );
                }} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}
                    label={{ position: 'right', formatter: v => `${v.toLocaleString()}`, fill: 'var(--muted)', fontSize: 12 }}>
                    {data.map((entry, i) => <Cell key={entry.name} fill={BAR_COLORS[i] ?? BAR_COLORS.at(-1)} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function GamesOverTimeChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <defs>
                    <linearGradient id="gamesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={formatDate} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name">{formatDate(label)}</p>
                            <p className="chart-tooltip-value" style={{ color: ACCENT }}>{payload[0].value} games</p>
                        </div>
                    );
                }} cursor={{ stroke: ACCENT, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="games" stroke={ACCENT} strokeWidth={2} fill="url(#gamesGrad)" dot={false} activeDot={{ r: 4, fill: ACCENT }} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// Highlights only the busiest hour in accent color; all others render at reduced opacity.
function PeakHoursChart({ data }) {
    const peak = data.reduce((m, d) => d.games > m.games ? d : m, { games: 0 });
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                    interval={2} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name">{label}</p>
                            <p className="chart-tooltip-value" style={{ color: ACCENT }}>{payload[0].value} games</p>
                        </div>
                    );
                }} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="games" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {data.map(entry => (
                        <Cell key={entry.hour} fill={entry.hour === peak.hour ? ACCENT : 'var(--muted)'} opacity={entry.hour === peak.hour ? 1 : 0.45} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function ClassesChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={560}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ClassesTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Legend wrapperStyle={{ fontSize: '0.85rem', color: 'var(--muted)', paddingTop: '12px' }} />
                <Bar dataKey="played" name="Games Played" fill="#e09304" radius={[0, 3, 3, 0]} maxBarSize={14} />
                <Bar dataKey="won"    name="Games Won"    fill="#4ade80" radius={[0, 3, 3, 0]} maxBarSize={14} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function Analytics() {
    const [overview, setOverview]     = useState(null);
    const [topWins, setTopWins]       = useState([]);
    const [topKills, setTopKills]     = useState([]);
    const [topStreak, setTopStreak]   = useState([]);
    const [topFish, setTopFish]       = useState([]);
    const [levels, setLevels]         = useState([]);
    const [allClasses, setAllClasses]         = useState([]);
    const [classSort, setClassSort]           = useState('played');
    const [bottomClassSort, setBottomClassSort] = useState('won');
    const [winRates, setWinRates]         = useState([]);
    const [kdRatios, setKdRatios]         = useState([]);
    const [classCategories, setClassCategories] = useState([]);
    const [mapPopularity, setMapPopularity]     = useState([]);
    const [mapMode, setMapMode]                 = useState('classic');
    const [gamesOverTime, setGamesOverTime]     = useState([]);
    const [peakHours, setPeakHours]             = useState([]);

    // Tracks 'loading' | 'ready' | 'error' per data source so every chart card can show
    // a skeleton, an error + retry, or its content instead of just appearing/disappearing.
    const [status, setStatus] = useState({
        overview: 'loading', topWins: 'loading', topKills: 'loading', topStreak: 'loading',
        topFish: 'loading', levels: 'loading', classes: 'loading', winRates: 'loading',
        kdRatios: 'loading', mapPopularity: 'loading', gamesOverTime: 'loading', peakHours: 'loading',
    });
    const setStat = (key, value) => setStatus(s => ({ ...s, [key]: value }));

    const loadOverview = () => {
        setStat('overview', 'loading');
        fetchOverview()
            .then(d => { setOverview(d); setStat('overview', 'ready'); })
            .catch(() => setStat('overview', 'error'));
    };

    const loadTopWins = () => {
        setStat('topWins', 'loading');
        fetchTopByStat('Wins')
            .then(d => {
                setTopWins(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.Wins })));
                setStat('topWins', 'ready');
            })
            .catch(() => setStat('topWins', 'error'));
    };

    const loadTopKills = () => {
        setStat('topKills', 'loading');
        fetchTopByStat('Kills')
            .then(d => {
                setTopKills(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.Kills })));
                setStat('topKills', 'ready');
            })
            .catch(() => setStat('topKills', 'error'));
    };

    const loadTopStreak = () => {
        setStat('topStreak', 'loading');
        fetchTopByStat('BestWinstreak')
            .then(d => {
                setTopStreak(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.BestWinstreak })));
                setStat('topStreak', 'ready');
            })
            .catch(() => setStat('topStreak', 'error'));
    };

    const loadTopFish = () => {
        setStat('topFish', 'loading');
        fetchTopByStat('TotalCaught')
            .then(d => {
                setTopFish(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.TotalCaught })));
                setStat('topFish', 'ready');
            })
            .catch(() => setStat('topFish', 'error'));
    };

    const loadLevels = () => {
        setStat('levels', 'loading');
        fetchLevelDistribution()
            .then(d => {
                setLevels(d.map(b => ({ name: `${b.bucket}-${b.bucket + 1}`, value: b.count })));
                setStat('levels', 'ready');
            })
            .catch(() => setStat('levels', 'error'));
    };

    const loadClasses = () => {
        setStat('classes', 'loading');
        fetchAllClassStats()
            .then(rows => {
                const mapped = rows
                    .filter(c => CLASSES.has(c.ClassID))
                    .map(c => ({
                        name: getClassName(c.ClassID),
                        played: Number(c.totalPlayed),
                        won: Number(c.totalWon ?? 0),
                    }));
                setAllClasses(mapped);

                const totals = { Free: { played: 0, won: 0 }, Token: { played: 0, won: 0 }, Level: { played: 0, won: 0 }, Donor: { played: 0, won: 0 } };
                rows.forEach(r => {
                    const cat = getCategory(r.ClassID);
                    if (cat && totals[cat]) {
                        totals[cat].played += Number(r.totalPlayed);
                        totals[cat].won    += Number(r.totalWon ?? 0);
                    }
                });
                setClassCategories(
                    Object.entries(totals).map(([name, { played, won }]) => ({ name, played, won }))
                );
                setStat('classes', 'ready');
            })
            .catch(() => setStat('classes', 'error'));
    };

    const loadWinRates = () => {
        setStat('winRates', 'loading');
        fetchWinRates()
            .then(d => {
                setWinRates(d.map(p => ({
                    name: p.LastPlayerName,
                    winRate: Number(p.WinRate),
                    wins: Number(p.Wins),
                    losses: Number(p.Losses),
                    total: Number(p.TotalGames),
                })));
                setStat('winRates', 'ready');
            })
            .catch(() => setStat('winRates', 'error'));
    };

    const loadKdRatios = () => {
        setStat('kdRatios', 'loading');
        fetchKDRatios()
            .then(d => {
                setKdRatios(d.map(p => ({
                    name: p.LastPlayerName,
                    kd: Number(p.KDRatio),
                    kills: Number(p.Kills),
                    deaths: Number(p.Deaths),
                })));
                setStat('kdRatios', 'ready');
            })
            .catch(() => setStat('kdRatios', 'error'));
    };

    const loadGamesOverTime = () => {
        setStat('gamesOverTime', 'loading');
        fetchGamesOverTime()
            .then(d => {
                setGamesOverTime(d.map(r => ({ date: r.date, games: Number(r.games) })));
                setStat('gamesOverTime', 'ready');
            })
            .catch(() => setStat('gamesOverTime', 'error'));
    };

    const loadPeakHours = () => {
        setStat('peakHours', 'loading');
        fetchPeakHours()
            .then(d => {
                const byHour = {};
                d.forEach(r => { byHour[Number(r.hour)] = Number(r.games); });
                // Fill all 24 hours so the chart has no gaps for hours with zero games.
                setPeakHours(
                    Array.from({ length: 24 }, (_, h) => ({
                        hour: formatHour(h),
                        games: byHour[h] ?? 0,
                    }))
                );
                setStat('peakHours', 'ready');
            })
            .catch(() => setStat('peakHours', 'error'));
    };

    const loadMapPopularity = () => {
        setStat('mapPopularity', 'loading');
        fetchMapPopularity(mapMode)
            .then(d => {
                setMapPopularity(d.map(r => ({ name: r.map_name, value: Number(r.game_count) })));
                setStat('mapPopularity', 'ready');
            })
            .catch(() => setStat('mapPopularity', 'error'));
    };

    useEffect(() => {
        loadOverview();
        loadTopWins();
        loadTopKills();
        loadTopStreak();
        loadTopFish();
        loadLevels();
        loadClasses();
        loadWinRates();
        loadKdRatios();
        loadGamesOverTime();
        loadPeakHours();
    }, []);

    useEffect(() => {
        loadMapPopularity();
    }, [mapMode]);

    return (
        <div className="app dark-page">
            <Navbar />
            <div className="main analytics-main">

                <div className="analytics-header">
                    <h1>Server Analytics</h1>
                    <p>Live statistics and trends from Minezone</p>
                </div>

                <div className="overview-grid">
                    {status.overview === 'loading' && Array.from({ length: 6 }, (_, i) => <StatCardSkeleton key={i} />)}
                    {status.overview === 'error' && <StatCardError />}
                    {status.overview === 'ready' && overview && (
                        <>
                            <StatCard icon={<FaUsers />}   label="Total Players"  value={Number(overview.totalPlayers).toLocaleString()} />
                            <StatCard icon={<FaGamepad />}  label="Games Played"   value={Number(overview.totalGames).toLocaleString()} />
                            <StatCard icon={<FaMedal />}    label="Avg Level"      value={overview.avgLevel} />
                            <StatCard icon={<FaSkull />}    label="Total Kills"    value={Number(overview.totalKills).toLocaleString()} />
                            <StatCard icon={<FaFish />}     label="Fish Caught"    value={Number(overview.totalFishCaught).toLocaleString()} />
                            <StatCard icon={<FaClock />}    label="Total Game Time" value={(() => { const m = Number(overview.totalGameMinutes); const d = Math.floor(m / 1440); const h = Math.floor((m % 1440) / 60); return d > 0 ? `${d.toLocaleString()}d ${h}h` : `${h}h`; })()} />
                        </>
                    )}
                </div>

                <div className="charts-grid">

                    <ChartSection title="Activity Trends">
                        <div className="chart-section-grid map-time-group">
                            <ChartCard title="Map Popularity" rowSpan={2} status={status.mapPopularity} empty={mapPopularity.length === 0}
                                minHeight={520} onRetry={loadMapPopularity} action={
                                <div className="chart-sort-toggle">
                                    <button
                                        className={mapMode === 'classic' ? 'active' : ''}
                                        onClick={() => setMapMode('classic')}
                                    >Classic</button>
                                    <button
                                        className={mapMode === 'duel' ? 'active' : ''}
                                        onClick={() => setMapMode('duel')}
                                    >Duel</button>
                                </div>
                            }>
                                <MapPopularityChart data={mapPopularity} />
                            </ChartCard>

                            <ChartCard title="Peak Hours (all time, ET)" status={status.peakHours} empty={peakHours.length === 0}
                                minHeight={220} onRetry={loadPeakHours}>
                                <PeakHoursChart data={peakHours} />
                            </ChartCard>

                            <ChartCard title="Games Played: Last 60 Days" status={status.gamesOverTime} empty={gamesOverTime.length === 0}
                                minHeight={220} onRetry={loadGamesOverTime}>
                                <GamesOverTimeChart data={gamesOverTime} />
                            </ChartCard>
                        </div>
                    </ChartSection>

                    <ChartSection title="Player Leaderboards">
                        <div className="chart-section-grid leaderboard-grid">
                            <ChartCard title="Player Level Distribution" full status={status.levels} empty={levels.length === 0}
                                minHeight={280} onRetry={loadLevels}>
                                <VerticalBar data={levels} />
                            </ChartCard>

                            <ChartCard title="Top 10 by Wins" status={status.topWins} empty={topWins.length === 0}
                                minHeight={300} onRetry={loadTopWins}>
                                <HorizontalBar data={topWins} unit="wins" />
                            </ChartCard>

                            <ChartCard title="Top 10 by Kills" status={status.topKills} empty={topKills.length === 0}
                                minHeight={300} onRetry={loadTopKills}>
                                <HorizontalBar data={topKills} unit="kills" />
                            </ChartCard>

                            <ChartCard title="Top 10 Best Winstreaks" status={status.topStreak} empty={topStreak.length === 0}
                                minHeight={300} onRetry={loadTopStreak}>
                                <HorizontalBar data={topStreak} unit="wins" />
                            </ChartCard>

                            <ChartCard title="Top 10 Fish Caught" status={status.topFish} empty={topFish.length === 0}
                                minHeight={300} onRetry={loadTopFish}>
                                <HorizontalBar data={topFish} unit="fish" />
                            </ChartCard>

                            <ChartCard title="Top Win Rates (min. 20 games)" status={status.winRates} empty={winRates.length === 0}
                                minHeight={380} onRetry={loadWinRates}>
                                <HorizontalBar data={winRates} dataKey="winRate" height={380} domain={[0, 100]}
                                    formatValue={v => `${v}%`}
                                    tooltipExtra={d => `${d.wins}W / ${d.losses}L · ${d.total} games`} />
                            </ChartCard>

                            <ChartCard title="Top K/D Ratios (min. 20 games)" status={status.kdRatios} empty={kdRatios.length === 0}
                                minHeight={380} onRetry={loadKdRatios}>
                                <HorizontalBar data={kdRatios} dataKey="kd" height={380}
                                    formatValue={v => v.toFixed(2)}
                                    tooltipExtra={d => `${d.kills.toLocaleString()}K / ${d.deaths.toLocaleString()}D`} />
                            </ChartCard>
                        </div>
                    </ChartSection>

                    <ChartSection title="Class Performance">
                        <div className="chart-section-grid">
                            <ChartCard title="Wins by Class Category" status={status.classes} empty={classCategories.length === 0}
                                minHeight={240} onRetry={loadClasses}>
                                <CategoryChart data={classCategories} />
                            </ChartCard>

                            <ChartCard title="% of Total Wins by Category" status={status.classes} empty={classCategories.length === 0}
                                minHeight={280} onRetry={loadClasses}>
                                <CategoryPieChart data={classCategories} />
                            </ChartCard>
                        </div>

                        <div className="chart-section-grid classes-pair">
                            <ChartCard
                                title="Most Performing Classes"
                                status={status.classes} empty={allClasses.length === 0} minHeight={560} onRetry={loadClasses}
                                action={
                                    <div className="chart-sort-toggle">
                                        <button
                                            className={classSort === 'played' ? 'active' : ''}
                                            onClick={() => setClassSort('played')}
                                        >
                                            By Played
                                        </button>
                                        <button
                                            className={classSort === 'won' ? 'active' : ''}
                                            onClick={() => setClassSort('won')}
                                        >
                                            By Won
                                        </button>
                                        <button
                                            className={classSort === 'winRate' ? 'active' : ''}
                                            onClick={() => setClassSort('winRate')}
                                        >
                                            By Win Rate
                                        </button>
                                    </div>
                                }
                            >
                                <ClassesChart
                                    data={[...allClasses]
                                        .sort((a, b) => classSort === 'winRate'
                                            ? (b.won / b.played) - (a.won / a.played)
                                            : b[classSort] - a[classSort])
                                        .slice(0, 20)}
                                />
                            </ChartCard>

                            <ChartCard
                                title="Least Performing Classes"
                                status={status.classes} empty={allClasses.length === 0} minHeight={560} onRetry={loadClasses}
                                action={
                                    <div className="chart-sort-toggle">
                                        <button
                                            className={bottomClassSort === 'won' ? 'active' : ''}
                                            onClick={() => setBottomClassSort('won')}
                                        >
                                            By Won
                                        </button>
                                        <button
                                            className={bottomClassSort === 'played' ? 'active' : ''}
                                            onClick={() => setBottomClassSort('played')}
                                        >
                                            By Played
                                        </button>
                                        <button
                                            className={bottomClassSort === 'winRate' ? 'active' : ''}
                                            onClick={() => setBottomClassSort('winRate')}
                                        >
                                            By Win Rate
                                        </button>
                                    </div>
                                }
                            >
                                <ClassesChart
                                    data={[...allClasses]
                                        .sort((a, b) => bottomClassSort === 'winRate'
                                            ? (a.won / a.played) - (b.won / b.played)
                                            : a[bottomClassSort] - b[bottomClassSort])
                                        .slice(0, 20)}
                                />
                            </ChartCard>
                        </div>
                    </ChartSection>
                </div>

            </div>
            <Footer />
        </div>
    );
}
