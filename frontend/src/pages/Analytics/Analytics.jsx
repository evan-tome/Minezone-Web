import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, CartesianGrid, Legend, PieChart, Pie,
    AreaChart, Area, ComposedChart, LineChart, Line,
} from 'recharts';
import { FaUsers, FaGamepad, FaMedal, FaSkull, FaFish, FaClock, FaExclamationTriangle, FaChartLine, FaMap, FaShieldAlt, FaCalendarDay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { fetchOverview, fetchLevelDistribution, fetchTopByStat, fetchWinRates, fetchAllClassStats, fetchMapPopularity, fetchGamesOverTime, fetchGamesOverTimeByType, fetchPlayersOverTime, fetchNewPlayersOverTime, fetchPeakHours, fetchKDRatios, fetchGamesByDay, fetchMapClasses } from '../../api/analytics.js';
import { MatchCard } from '../Stats/RecentMatches.jsx';
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

function WinsOnlyTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name">{label}</p>
            <p className="chart-tooltip-value" style={{ color: '#4ade80' }}>Won: {d.won.toLocaleString()}</p>
        </div>
    );
}

const CATEGORIES = [
    { id: 'activity', label: 'Activity', icon: <FaChartLine /> },
    { id: 'maps',     label: 'Maps',     icon: <FaMap /> },
    { id: 'classes',  label: 'Classes',  icon: <FaShieldAlt /> },
    { id: 'games',    label: 'Games',    icon: <FaCalendarDay /> },
];

// Renders a skeleton while loading, an error message (with retry) on failure, a quiet
// empty state when the fetch succeeded with nothing to show, or the chart otherwise —
// every chart card goes through the same three states instead of just vanishing.
function ChartCard({ title, children, full, action, status = 'ready', empty, minHeight = 280, onRetry }) {
    return (
        <div className={`chart-card ${full ? 'chart-card-full' : ''}`}>
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
    const rated = data.map(d => ({ ...d, winRate: d.played > 0 ? (d.won / d.played) * 100 : 0 }));
    return (
        <>
            <div className="category-legend">
                <span><span className="category-legend-swatch" style={{ opacity: 0.4, background: 'var(--muted)' }} />Games Played</span>
                <span><span className="category-legend-swatch" style={{ background: 'var(--muted)' }} />Games Won</span>
                <span><span className="category-legend-swatch category-legend-outline" style={{ borderColor: 'var(--muted)' }} />Win Rate</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={rated} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="count" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tickFormatter={v => `${v}%`}
                        tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                    <Bar yAxisId="count" dataKey="played" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {rated.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} opacity={0.4} />)}
                    </Bar>
                    <Bar yAxisId="count" dataKey="won" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {rated.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} />)}
                    </Bar>
                    <Bar yAxisId="rate" dataKey="winRate" fill="transparent" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {rated.map(entry => <Cell key={entry.name} fill="transparent" stroke={CATEGORY_COLORS[entry.name] ?? '#888'} strokeWidth={2} />)}
                    </Bar>
                </ComposedChart>
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

function todayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Shifts a YYYY-MM-DD string by `delta` days, parsing/formatting the components directly
// so the result doesn't drift with the viewer's timezone offset.
function shiftDate(dateStr, delta) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const KNOWN_TYPES = ['classic', 'frenzy', 'duel'];
const TREND_TYPES = [{ key: 'total', label: 'All' }, { key: 'classic', label: 'Classic' }, { key: 'frenzy', label: 'Frenzy' }, { key: 'duel', label: 'Duel' }];

function MapNameTick({ x, y, payload, onSelect }) {
    return (
        <g transform={`translate(${x},${y})`} onClick={() => onSelect?.(payload.value)} style={{ cursor: onSelect ? 'pointer' : undefined }}>
            <rect x={-120} y={-13} width={120} height={26} fill="transparent" />
            <text
                x={0} y={0} dy={4}
                textAnchor="end"
                fontSize={12}
                className="player-tick"
            >
                {payload.value}
            </text>
        </g>
    );
}

function MapPopularityChart({ data, selected, onSelect }) {
    const height = Math.max(100, data.length * 26 + 16);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 52, top: 8, bottom: 4 }}
                className={onSelect ? 'map-chart-clickable' : undefined}
                onClick={onSelect ? e => e?.activePayload?.length && onSelect(e.activePayload[0].payload.name) : undefined}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false}
                    tick={(props) => <MapNameTick {...props} onSelect={onSelect} />} />
                <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name">{label}</p>
                            <p className="chart-tooltip-value" style={{ color: ACCENT }}>{payload[0].value.toLocaleString()} games</p>
                        </div>
                    );
                }} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16} background={{ fill: 'transparent' }}
                    isAnimationActive={false}
                    label={{ position: 'right', formatter: v => `${v.toLocaleString()}`, fill: 'var(--muted)', fontSize: 12 }}>
                    {data.map((entry, i) => (
                        <Cell key={entry.name} fill={BAR_COLORS[i] ?? BAR_COLORS.at(-1)}
                            opacity={selected && selected !== entry.name ? 0.35 : 1} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function GamesOverTimeChart({ data, dataKey = 'games', valueLabel = 'games', color = ACCENT, gradientId = 'gamesGrad' }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
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
                            <p className="chart-tooltip-value" style={{ color }}>{payload[0].value} {valueLabel}</p>
                        </div>
                    );
                }} cursor={{ stroke: color, strokeWidth: 1 }} />
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: color }} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

const TYPE_COLORS = { classic: '#34d399', frenzy: '#60a5fa', duel: '#c084fc' };

function GamesOverTimeMultiChart({ data, types, onPointClick }) {
    const series = types.length > 0 ? types : ['total'];
    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                className={onPointClick ? 'map-chart-clickable' : undefined}
                onClick={onPointClick ? e => e?.activeLabel && onPointClick(e.activeLabel) : undefined}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={formatDate} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                        <div className="chart-tooltip">
                            <p className="chart-tooltip-name">{formatDate(label)}</p>
                            {payload.map(p => (
                                <p key={p.dataKey} className="chart-tooltip-value" style={{ color: p.color }}>
                                    {p.dataKey === 'total' ? 'Games' : p.name}: {p.value}
                                </p>
                            ))}
                        </div>
                    );
                }} cursor={{ stroke: ACCENT, strokeWidth: 1 }} />
                <Legend height={30} wrapperStyle={{ fontSize: '0.85rem', color: 'var(--muted)' }} />
                {series.map(key => (
                    <Line key={key} type="monotone" dataKey={key}
                        name={key === 'total' ? 'Games' : key[0].toUpperCase() + key.slice(1)}
                        stroke={key === 'total' ? ACCENT : TYPE_COLORS[key]} strokeWidth={2}
                        dot={false} activeDot={{ r: 4 }} />
                ))}
            </LineChart>
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

function ClassesChart({ data, height = 560, winsOnly = false }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={winsOnly ? <WinsOnlyTooltip /> : <ClassesTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                {!winsOnly && <Legend wrapperStyle={{ fontSize: '0.85rem', color: 'var(--muted)', paddingTop: '12px' }} />}
                {!winsOnly && <Bar dataKey="played" name="Games Played" fill="#e09304" radius={[0, 3, 3, 0]} maxBarSize={14} />}
                <Bar dataKey="won" name="Games Won" fill="#4ade80" radius={[0, 3, 3, 0]} maxBarSize={winsOnly ? 22 : 14} />
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
    const [gamesOverTimeByType, setGamesOverTimeByType] = useState([]);
    const [gamesOverTimeTypes, setGamesOverTimeTypes]   = useState(['total']);
    const [playersOverTime, setPlayersOverTime]         = useState([]);
    const [newPlayersOverTime, setNewPlayersOverTime]   = useState([]);
    const [peakHours, setPeakHours]             = useState([]);
    const [gamesByDayDate, setGamesByDayDate]   = useState(todayStr);
    const [gamesByDay, setGamesByDay]           = useState([]);
    const [gamesByDayPage, setGamesByDayPage]   = useState(0);
    const [activeCategory, setActiveCategory]   = useState('activity');
    const [selectedMap, setSelectedMap]         = useState(null);
    const [mapClasses, setMapClasses]           = useState([]);

    // Tracks 'loading' | 'ready' | 'error' per data source so every chart card can show
    // a skeleton, an error + retry, or its content instead of just appearing/disappearing.
    const [status, setStatus] = useState({
        overview: 'loading', topWins: 'loading', topKills: 'loading', topStreak: 'loading',
        topFish: 'loading', levels: 'loading', classes: 'loading', winRates: 'loading',
        kdRatios: 'loading', mapPopularity: 'loading', gamesOverTime: 'loading', peakHours: 'loading',
        gamesByDay: 'loading', mapClasses: 'loading', gamesOverTimeByType: 'loading',
        newPlayersOverTime: 'loading', playersOverTime: 'loading',
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

    const loadGamesOverTimeByType = () => {
        setStat('gamesOverTimeByType', 'loading');
        fetchGamesOverTimeByType()
            .then(d => {
                setGamesOverTimeByType(d.map(r => ({ date: r.date, gameType: r.game_type, games: Number(r.games) })));
                setStat('gamesOverTimeByType', 'ready');
            })
            .catch(() => setStat('gamesOverTimeByType', 'error'));
    };

    const loadPlayersOverTime = () => {
        setStat('playersOverTime', 'loading');
        fetchPlayersOverTime()
            .then(d => {
                setPlayersOverTime(d.map(r => ({ date: r.date, games: Number(r.players) })));
                setStat('playersOverTime', 'ready');
            })
            .catch(() => setStat('playersOverTime', 'error'));
    };

    const loadNewPlayersOverTime = () => {
        setStat('newPlayersOverTime', 'loading');
        fetchNewPlayersOverTime()
            .then(d => {
                setNewPlayersOverTime(d.map(r => ({ date: r.date, games: Number(r.new_players) })));
                setStat('newPlayersOverTime', 'ready');
            })
            .catch(() => setStat('newPlayersOverTime', 'error'));
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

    // The trendline filter above the chart is the single source of truth for game type;
    // a lone specific type narrows the DB query, while "All" or multiple types fetches
    // everything and filters client-side so the two views never disagree.
    const effectiveTypes = gamesOverTimeTypes.includes('total') ? [] : gamesOverTimeTypes;
    const dayTypeFilter = effectiveTypes.length === 1 ? effectiveTypes[0] : '';
    const gamesOverTimeTypesKey = gamesOverTimeTypes.join(',');

    const loadGamesByDay = () => {
        setStat('gamesByDay', 'loading');
        fetchGamesByDay(gamesByDayDate, dayTypeFilter)
            .then(d => { setGamesByDay(d.matches ?? []); setStat('gamesByDay', 'ready'); })
            .catch(() => setStat('gamesByDay', 'error'));
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

    const loadMapClasses = (mapName) => {
        setStat('mapClasses', 'loading');
        fetchMapClasses(mapName, mapMode)
            .then(rows => {
                setMapClasses(rows
                    .map(r => ({
                        name: getClassName(r.class_id),
                        played: Number(r.played),
                        won: Number(r.won ?? 0),
                    }))
                    .filter(c => c.won > 0)
                    .slice(0, 5));
                setStat('mapClasses', 'ready');
            })
            .catch(() => setStat('mapClasses', 'error'));
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
        loadGamesOverTimeByType();
        loadPlayersOverTime();
        loadNewPlayersOverTime();
        loadPeakHours();
    }, []);

    useEffect(() => {
        loadMapPopularity();
        setSelectedMap(null);
    }, [mapMode]);

    useEffect(() => {
        if (selectedMap) loadMapClasses(selectedMap);
    }, [selectedMap]);

    useEffect(() => {
        loadGamesByDay();
        setGamesByDayPage(0);
    }, [gamesByDayDate, dayTypeFilter]);

    // Re-filtering client-side (multiple specific types selected) doesn't refetch, but
    // should still reset to page 1 since the visible set changed.
    useEffect(() => {
        setGamesByDayPage(0);
    }, [gamesOverTimeTypesKey]);

    const gamesOverTimeByDate = useMemo(() => {
        const byDate = {};
        gamesOverTimeByType.forEach(r => {
            const d = String(r.date).slice(0, 10);
            if (!byDate[d]) byDate[d] = { date: d, classic: 0, frenzy: 0, duel: 0, total: 0 };
            if (KNOWN_TYPES.includes(r.gameType)) byDate[d][r.gameType] = r.games;
            byDate[d].total += r.games;
        });
        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }, [gamesOverTimeByType]);

    const visibleGamesByDay = effectiveTypes.length > 1
        ? gamesByDay.filter(m => effectiveTypes.includes(m.game_type?.toLowerCase()))
        : gamesByDay;
    const DAY_PAGE_SIZE = 5;
    const totalDayPages = Math.ceil(visibleGamesByDay.length / DAY_PAGE_SIZE);
    const pagedGamesByDay = visibleGamesByDay.slice(gamesByDayPage * DAY_PAGE_SIZE, (gamesByDayPage + 1) * DAY_PAGE_SIZE);

    return (
        <div className="app dark-page">
            <Navbar />
            <div className="main analytics-main">

                <div className="analytics-header">
                    <h1>Server Analytics</h1>
                    <p>Live statistics and trends from Minezone</p>
                </div>

                <div className="analytics-layout">
                    <aside className="analytics-sidebar">
                        <nav className="analytics-nav">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`analytics-nav-btn${activeCategory === cat.id ? ' active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    <span className="analytics-nav-icon">{cat.icon}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <div className="analytics-content">

                        {activeCategory === 'activity' && (
                            <>
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

                                <div className="chart-section-grid">
                                    <ChartCard title="Peak Hours (all time, ET)" full status={status.peakHours} empty={peakHours.length === 0}
                                        minHeight={220} onRetry={loadPeakHours}>
                                        <PeakHoursChart data={peakHours} />
                                    </ChartCard>

                                    <ChartCard title="Games Played: Last 60 Days" status={status.gamesOverTime} empty={gamesOverTime.length === 0}
                                        minHeight={220} onRetry={loadGamesOverTime}>
                                        <GamesOverTimeChart data={gamesOverTime} />
                                    </ChartCard>

                                    <ChartCard title="Players per Day: Last 60 Days" status={status.playersOverTime} empty={playersOverTime.length === 0}
                                        minHeight={220} onRetry={loadPlayersOverTime}>
                                        <GamesOverTimeChart data={playersOverTime} valueLabel="players" color="#60a5fa" gradientId="playersGrad" />
                                    </ChartCard>

                                    <ChartCard title="First Games Played: Last 60 Days" full status={status.newPlayersOverTime} empty={newPlayersOverTime.length === 0}
                                        minHeight={220} onRetry={loadNewPlayersOverTime}>
                                        <GamesOverTimeChart data={newPlayersOverTime} valueLabel="new players" color="#34d399" gradientId="newPlayersGrad" />
                                    </ChartCard>
                                </div>

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
                            </>
                        )}

                        {activeCategory === 'maps' && (
                            <div className="chart-section-grid">
                                <ChartCard title="Map Popularity" full status={status.mapPopularity} empty={mapPopularity.length === 0}
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
                                    <p className="map-chart-hint">Click a map to see its top classes by wins.</p>
                                    <MapPopularityChart data={mapPopularity} selected={selectedMap} onSelect={setSelectedMap} />
                                </ChartCard>

                                {selectedMap && (
                                    <ChartCard
                                        title={`Top 5 Winning Classes on ${selectedMap}`}
                                        full status={status.mapClasses} empty={mapClasses.length === 0}
                                        minHeight={200} onRetry={() => loadMapClasses(selectedMap)}
                                        action={
                                            <button type="button" className="chart-error-retry" onClick={() => setSelectedMap(null)}>
                                                Clear
                                            </button>
                                        }
                                    >
                                        <ClassesChart data={mapClasses} height={Math.max(160, mapClasses.length * 40 + 40)} winsOnly />
                                    </ChartCard>
                                )}
                            </div>
                        )}

                        {activeCategory === 'classes' && (
                            <>
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
                            </>
                        )}

                        {activeCategory === 'games' && (
                            <>
                                <div className="chart-section-grid">
                                    <ChartCard title="Games Played: Last 60 Days" full status={status.gamesOverTimeByType} empty={gamesOverTimeByDate.length === 0}
                                        minHeight={220} onRetry={loadGamesOverTimeByType} action={
                                        <div className="chart-sort-toggle">
                                            {TREND_TYPES.map(({ key, label }) => (
                                                <button
                                                    key={key}
                                                    className={gamesOverTimeTypes.includes(key) ? 'active' : ''}
                                                    onClick={() => setGamesOverTimeTypes(prev => {
                                                        if (prev.includes(key)) {
                                                            const next = prev.filter(x => x !== key);
                                                            return next.length > 0 ? next : prev;
                                                        }
                                                        return [...prev, key];
                                                    })}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    }>
                                        <p className="map-chart-hint">Click a point to see matches from that date.</p>
                                        <GamesOverTimeMultiChart data={gamesOverTimeByDate} types={gamesOverTimeTypes}
                                            onPointClick={setGamesByDayDate} />
                                    </ChartCard>
                                </div>

                                <div className="games-by-day">
                                    <div className="games-by-day-controls">
                                        <div className="games-by-day-calendar">
                                            <button type="button" className="games-by-day-nav" aria-label="Previous day"
                                                onClick={() => setGamesByDayDate(d => shiftDate(d, -1))}>
                                                <FaChevronLeft />
                                            </button>
                                            <input
                                                type="date"
                                                className="games-by-day-input"
                                                value={gamesByDayDate}
                                                max={todayStr()}
                                                onChange={e => setGamesByDayDate(e.target.value)}
                                            />
                                            <button type="button" className="games-by-day-nav" aria-label="Next day"
                                                disabled={gamesByDayDate >= todayStr()}
                                                onClick={() => setGamesByDayDate(d => shiftDate(d, 1))}>
                                                <FaChevronRight />
                                            </button>
                                            <button type="button" className="games-by-day-today"
                                                disabled={gamesByDayDate === todayStr()}
                                                onClick={() => setGamesByDayDate(todayStr())}>
                                                Today
                                            </button>
                                        </div>

                                        {status.gamesByDay === 'ready' && (
                                            <span className="games-by-day-count">
                                                {visibleGamesByDay.length} game{visibleGamesByDay.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {status.gamesByDay === 'loading' && <p className="games-by-day-status">Loading games...</p>}

                                    {status.gamesByDay === 'error' && (
                                        <div className="games-by-day-status">
                                            <FaExclamationTriangle className="chart-error-icon" />
                                            <p>Couldn't load games for this day.</p>
                                            <button type="button" className="chart-error-retry" onClick={loadGamesByDay}>Retry</button>
                                        </div>
                                    )}

                                    {status.gamesByDay === 'ready' && visibleGamesByDay.length === 0 && (
                                        <p className="games-by-day-status">No games played on this day.</p>
                                    )}

                                    {status.gamesByDay === 'ready' && visibleGamesByDay.length > 0 && (
                                        <>
                                            <div className="rm-list">
                                                {pagedGamesByDay.map(m => <MatchCard key={m.game_id} match={m} />)}
                                            </div>
                                            {totalDayPages > 1 && (
                                                <div className="rm-pagination">
                                                    <button className="rm-page-btn" onClick={() => setGamesByDayPage(p => p - 1)} disabled={gamesByDayPage === 0}>
                                                        <FaChevronLeft />
                                                    </button>
                                                    <span className="rm-page-info">{gamesByDayPage + 1} / {totalDayPages}</span>
                                                    <button className="rm-page-btn" onClick={() => setGamesByDayPage(p => p + 1)} disabled={gamesByDayPage >= totalDayPages - 1}>
                                                        <FaChevronRight />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                    </div>
                </div>

            </div>
            <Footer />
        </div>
    );
}
