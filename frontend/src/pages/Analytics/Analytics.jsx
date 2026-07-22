import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, CartesianGrid, Legend, PieChart, Pie,
    AreaChart, Area, ComposedChart, LineChart, Line,
} from 'recharts';
import { FaUsers, FaGamepad, FaMedal, FaSkull, FaFish, FaClock, FaChartLine, FaMap, FaShieldAlt, FaCalendarDay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { fetchOverview, fetchLevelDistribution, fetchTopByStat, fetchWinRates, fetchAllClassStats, fetchMapPopularity, fetchGamesOverTime, fetchGamesOverTimeByType, fetchPlayersOverTime, fetchTotalPlaysOverTime, fetchNewPlayersOverTime, fetchPeakHours, fetchKDRatios, fetchGamesByDay, fetchMapClasses } from '../../api/analytics.js';
import { MatchCard } from '../Stats/RecentMatches.jsx';
import { CLASSES } from '../../utils/classes.js';
import '../../App.css';
import './Analytics.css';

const ACCENT = '#e09304';
// Themes recharts' built-in tooltip box to match the site's dark theme, instead of
// a fully custom tooltip component.
const TOOLTIP_STYLE = {
    contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: "'Inter', system-ui, sans-serif", fontSize: '0.85rem', fontWeight: 500 },
    labelStyle: { color: 'var(--muted)', fontWeight: 500 },
    itemStyle: { color: 'var(--text)', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500, padding: '1px 0' },
    separator: ': ',
};
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

const CATEGORIES = [
    { id: 'activity', label: 'Activity', icon: <FaChartLine /> },
    { id: 'maps',     label: 'Maps',     icon: <FaMap /> },
    { id: 'classes',  label: 'Classes',  icon: <FaShieldAlt /> },
    { id: 'games',    label: 'Games',    icon: <FaCalendarDay /> },
];

// Renders a skeleton while loading, a quiet empty state when there's nothing to show
// (including on fetch failure), or the chart otherwise.
function ChartCard({ title, children, full, action, status = 'ready', empty, minHeight = 280 }) {
    return (
        <div className={`chart-card ${full ? 'chart-card-full' : ''}`}>
            <div className="chart-card-header">
                <h3 className="chart-card-title">{title}</h3>
                {status === 'ready' && !empty && action}
            </div>
            {status === 'loading' && (
                <div className="chart-skeleton skeleton-pulse" style={{ height: minHeight }} aria-label="Loading chart" />
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

// Y-axis tick for HorizontalBar: renders the player's name as a clickable link to their profile.
function PlayerNameTick({ x, y, payload, onNavigate }) {
    return (
        <text x={x} y={y} dy={4} textAnchor="end" fill="var(--muted)" fontSize={12}
            className="analytics-player-tick" onClick={() => onNavigate(payload.value)}>
            {payload.value}
        </text>
    );
}

// Shared "ranked leaderboard" bar chart: same rank-gradient coloring and value labels
// across every Top 10 / win-rate / K-D list so they read as one family.
function HorizontalBar({
    data, dataKey = 'value', nameKey = 'name', unit = 'Value',
    domain, height = 300, formatValue,
}) {
    const navigate = useNavigate();
    const fmtValue = formatValue ?? (v => Number(v).toLocaleString());
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={domain} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={nameKey} width={110}
                    tick={<PlayerNameTick onNavigate={name => navigate(`/stats/${name}`)} />}
                    axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={fmtValue} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey={dataKey} name={unit} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}
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
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey={dataKey} name="Count" fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={20} isAnimationActive={false} />
            </BarChart>
        </ResponsiveContainer>
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
                    <Tooltip {...TOOLTIP_STYLE}
                        formatter={(value, name) => name === 'Win Rate' ? [`${value.toFixed(1)}%`, name] : [Number(value).toLocaleString(), name]}
                        cursor={{ fill: 'var(--accent-soft)' }}
                    />
                    <Bar yAxisId="count" dataKey="played" name="Games Played" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                        {rated.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} opacity={0.4} />)}
                    </Bar>
                    <Bar yAxisId="count" dataKey="won" name="Games Won" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                        {rated.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} />)}
                    </Bar>
                    <Bar yAxisId="rate" dataKey="winRate" name="Win Rate" fill="transparent" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
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
                    isAnimationActive={false}
                >
                    {data.map(entry => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} />
                    ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={value => Number(value).toLocaleString()} />
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

// Shifts a YYYY-MM string by `delta` months.
function shiftMonth(monthStr, delta) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthStr() {
    return todayStr().slice(0, 7);
}

function daysInMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(y, m, 0).getDate();
}

function formatMonthLabel(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Fills gaps in a {date, games}[] series to match the selected scope: every day of the last
// week, every day of the given month (capped at today), or left as-is for "all time" (whose
// span is unbounded, so zero-filling isn't meaningful).
function fillRangeDays(data, scope, month) {
    const byDate = {};
    data.forEach(r => { byDate[r.date.slice(0, 10)] = r.games; });

    if (scope === 'all') {
        return Object.keys(byDate).sort().map(d => ({ date: d, games: byDate[d] }));
    }

    const today = todayStr();
    if (scope === 'week') {
        return Array.from({ length: 7 }, (_, i) => {
            const d = shiftDate(today, -(6 - i));
            return { date: d, games: byDate[d] ?? 0 };
        });
    }

    const days = daysInMonth(month);
    return Array.from({ length: days }, (_, i) => {
        const d = `${month}-${String(i + 1).padStart(2, '0')}`;
        return d > today ? null : { date: d, games: byDate[d] ?? 0 };
    }).filter(Boolean);
}

function periodTotal(data) {
    return data.reduce((s, r) => s + r.games, 0);
}

function periodLabel(scope, month) {
    if (scope === 'week') return 'this week';
    if (scope === 'all') return 'all time';
    return month === currentMonthStr() ? 'this month' : `in ${formatMonthLabel(month)}`;
}

const TIME_SCOPES = [{ key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'all', label: 'All Time' }];

// First calendar month with any recorded game data — the month picker can't go earlier.
const EARLIEST_MONTH = '2026-05';

// Shared control for the trend charts: a Week / Month / All Time scope toggle, plus a
// prev/next month picker that only appears in "Month" scope so any past month can be browsed.
function TimeRangeControl({ scope, onScope, month, onMonth }) {
    return (
        <div className="chart-card-action-row">
            {scope === 'month' && (
                <div className="games-by-day-calendar">
                    <button type="button" className="games-by-day-nav" aria-label="Previous month"
                        disabled={month <= EARLIEST_MONTH}
                        onClick={() => onMonth(shiftMonth(month, -1))}>
                        <FaChevronLeft />
                    </button>
                    <span className="analytics-month-label">{formatMonthLabel(month)}</span>
                    <button type="button" className="games-by-day-nav" aria-label="Next month"
                        disabled={month >= currentMonthStr()}
                        onClick={() => onMonth(shiftMonth(month, 1))}>
                        <FaChevronRight />
                    </button>
                </div>
            )}
            <div className="chart-sort-toggle">
                {TIME_SCOPES.map(({ key, label }) => (
                    <button key={key} className={scope === key ? 'active' : ''} onClick={() => onScope(key)}>
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function MonthStat({ value, label }) {
    return (
        <div className="chart-month-stat">
            <span className="chart-month-stat-value">{Number(value).toLocaleString()}</span>
            <span className="chart-month-stat-label">{label}</span>
        </div>
    );
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

function MapPopularityChart({ data, selected, onSelect }) {
    const height = Math.max(100, data.length * 26 + 16);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 52, top: 8, bottom: 4 }}
                className={onSelect ? 'map-chart-clickable' : undefined}
                onClick={onSelect ? e => e?.activePayload?.length && onSelect(e.activePayload[0].payload.name) : undefined}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={value => Number(value).toLocaleString()} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="value" name="Games" radius={[0, 4, 4, 0]} maxBarSize={16} background={{ fill: 'transparent' }} isAnimationActive={false}
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

function GamesOverTimeChart({ data, dataKey = 'games', valueLabel = 'Games', color = ACCENT }) {
    const name = valueLabel.charAt(0).toUpperCase() + valueLabel.slice(1);
    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={formatDate} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} labelFormatter={formatDate} cursor={{ stroke: color, strokeWidth: 1 }} />
                <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.15} dot={false} isAnimationActive={false} />
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
                <Tooltip {...TOOLTIP_STYLE} labelFormatter={formatDate} cursor={{ stroke: ACCENT, strokeWidth: 1 }} />
                <Legend height={30} wrapperStyle={{ fontSize: '0.85rem', color: 'var(--muted)' }} />
                {series.map(key => (
                    <Line key={key} type="monotone" dataKey={key}
                        name={key === 'total' ? 'Games' : key[0].toUpperCase() + key.slice(1)}
                        stroke={key === 'total' ? ACCENT : TYPE_COLORS[key]} strokeWidth={2}
                        dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
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
                <Tooltip {...TOOLTIP_STYLE} formatter={value => Number(value).toLocaleString()} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="games" name="Games" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
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
                <Tooltip {...TOOLTIP_STYLE} formatter={value => Number(value).toLocaleString()} cursor={{ fill: 'var(--accent-soft)' }} />
                {!winsOnly && <Legend wrapperStyle={{ fontSize: '0.85rem', color: 'var(--muted)', paddingTop: '12px' }} />}
                {!winsOnly && <Bar dataKey="played" name="Games Played" fill="#e09304" radius={[0, 3, 3, 0]} maxBarSize={14} isAnimationActive={false} />}
                <Bar dataKey="won" name="Games Won" fill="#4ade80" radius={[0, 3, 3, 0]} maxBarSize={winsOnly ? 22 : 14} isAnimationActive={false} />
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
    const [totalPlaysOverTime, setTotalPlaysOverTime]   = useState([]);
    const [newPlayersOverTime, setNewPlayersOverTime]   = useState([]);
    const [timeScope, setTimeScope]                     = useState('month');
    const [timeMonth, setTimeMonth]                     = useState(currentMonthStr);
    const [peakHours, setPeakHours]             = useState([]);
    const [gamesByDayDate, setGamesByDayDate]   = useState(todayStr);
    const [gamesByDay, setGamesByDay]           = useState([]);
    const [gamesByDayPage, setGamesByDayPage]   = useState(0);
    const [activeCategory, setActiveCategory]   = useState('activity');
    const [selectedMap, setSelectedMap]         = useState(null);
    const [mapClasses, setMapClasses]           = useState([]);

    // Tracks 'loading' | 'ready' per data source so each chart card can show a skeleton
    // vs. its content. A failed fetch also lands on 'ready' with empty data, which the
    // chart renders as its normal "No data yet" state rather than a distinct error UI.
    const [status, setStatus] = useState({
        overview: 'loading', topWins: 'loading', topKills: 'loading', topStreak: 'loading',
        topFish: 'loading', levels: 'loading', classes: 'loading', winRates: 'loading',
        kdRatios: 'loading', mapPopularity: 'loading', gamesOverTime: 'loading', peakHours: 'loading',
        gamesByDay: 'loading', mapClasses: 'loading', gamesOverTimeByType: 'loading',
        newPlayersOverTime: 'loading', playersOverTime: 'loading', totalPlaysOverTime: 'loading',
    });
    const setStat = (key, value) => setStatus(s => ({ ...s, [key]: value }));

    // Once a chart has loaded successfully at least once, later reloads (range/mode/date
    // changes) keep showing the existing chart instead of swapping in a skeleton — so its
    // size and position stay put instead of collapsing and popping back on every refetch.
    const loadedOnce = useRef(new Set());

    const load = (key, fetcher, onData) => {
        if (!loadedOnce.current.has(key)) setStat(key, 'loading');
        fetcher()
            .then(d => { onData(d); setStat(key, 'ready'); loadedOnce.current.add(key); })
            .catch(() => { setStat(key, 'ready'); loadedOnce.current.add(key); });
    };

    const loadOverview   = () => load('overview', fetchOverview, setOverview);
    const loadTopWins    = () => load('topWins', () => fetchTopByStat('Wins'), d => setTopWins(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.Wins }))));
    const loadTopKills   = () => load('topKills', () => fetchTopByStat('Kills'), d => setTopKills(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.Kills }))));
    const loadTopStreak  = () => load('topStreak', () => fetchTopByStat('BestWinstreak'), d => setTopStreak(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.BestWinstreak }))));
    const loadTopFish    = () => load('topFish', () => fetchTopByStat('TotalCaught'), d => setTopFish(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.TotalCaught }))));
    const loadLevels     = () => load('levels', fetchLevelDistribution, d => setLevels(d.map(b => ({ name: `${b.bucket}-${b.bucket + 1}`, value: b.count }))));
    const loadWinRates   = () => load('winRates', fetchWinRates, d => setWinRates(d.map(p => ({
        name: p.LastPlayerName, winRate: Number(p.WinRate), wins: Number(p.Wins), losses: Number(p.Losses), total: Number(p.TotalGames),
    }))));
    const loadKdRatios   = () => load('kdRatios', fetchKDRatios, d => setKdRatios(d.map(p => ({
        name: p.LastPlayerName, kd: Number(p.KDRatio), kills: Number(p.Kills), deaths: Number(p.Deaths),
    }))));
    // Range sent to the API: 'week' / 'all' pass through as-is, and 'month' scope resolves
    // to the specific YYYY-MM being browsed (defaults to the current month).
    const apiRange = timeScope === 'month' ? timeMonth : timeScope;

    const loadGamesOverTime         = () => load('gamesOverTime', () => fetchGamesOverTime(apiRange), d => setGamesOverTime(fillRangeDays(d.map(r => ({ date: r.date, games: Number(r.games) })), timeScope, timeMonth)));
    const loadGamesOverTimeByType   = () => load('gamesOverTimeByType', () => fetchGamesOverTimeByType(apiRange), d => setGamesOverTimeByType(d.map(r => ({ date: r.date, gameType: r.game_type, games: Number(r.games) }))));
    const loadPlayersOverTime       = () => load('playersOverTime', () => fetchPlayersOverTime(apiRange), d => setPlayersOverTime(fillRangeDays(d.map(r => ({ date: r.date, games: Number(r.players) })), timeScope, timeMonth)));
    const loadTotalPlaysOverTime    = () => load('totalPlaysOverTime', () => fetchTotalPlaysOverTime(apiRange), d => setTotalPlaysOverTime(fillRangeDays(d.map(r => ({ date: r.date, games: Number(r.plays) })), timeScope, timeMonth)));
    const loadNewPlayersOverTime    = () => load('newPlayersOverTime', () => fetchNewPlayersOverTime(apiRange), d => setNewPlayersOverTime(fillRangeDays(d.map(r => ({ date: r.date, games: Number(r.new_players) })), timeScope, timeMonth)));

    const loadClasses = () => load('classes', fetchAllClassStats, rows => {
        setAllClasses(
            rows.filter(c => CLASSES.has(c.ClassID)).map(c => ({
                name: getClassName(c.ClassID), played: Number(c.totalPlayed), won: Number(c.totalWon ?? 0),
            }))
        );

        const totals = { Free: { played: 0, won: 0 }, Token: { played: 0, won: 0 }, Level: { played: 0, won: 0 }, Donor: { played: 0, won: 0 } };
        rows.forEach(r => {
            const cat = getCategory(r.ClassID);
            if (cat && totals[cat]) {
                totals[cat].played += Number(r.totalPlayed);
                totals[cat].won    += Number(r.totalWon ?? 0);
            }
        });
        setClassCategories(Object.entries(totals).map(([name, { played, won }]) => ({ name, played, won })));
    });

    const loadPeakHours = () => load('peakHours', fetchPeakHours, d => {
        const byHour = {};
        d.forEach(r => { byHour[Number(r.hour)] = Number(r.games); });
        // Fill all 24 hours so the chart has no gaps for hours with zero games.
        setPeakHours(Array.from({ length: 24 }, (_, h) => ({ hour: formatHour(h), games: byHour[h] ?? 0 })));
    });

    // The trendline filter above the chart is the single source of truth for game type;
    // a lone specific type narrows the DB query, while "All" or multiple types fetches
    // everything and filters client-side so the two views never disagree.
    const effectiveTypes = gamesOverTimeTypes.includes('total') ? [] : gamesOverTimeTypes;
    const dayTypeFilter = effectiveTypes.length === 1 ? effectiveTypes[0] : '';
    const gamesOverTimeTypesKey = gamesOverTimeTypes.join(',');

    const loadGamesByDay    = () => load('gamesByDay', () => fetchGamesByDay(gamesByDayDate, dayTypeFilter), d => setGamesByDay(d.matches ?? []));
    const loadMapPopularity = () => load('mapPopularity', () => fetchMapPopularity(mapMode), d => setMapPopularity(d.map(r => ({ name: r.map_name, value: Number(r.game_count) }))));
    const loadMapClasses    = (mapName) => load('mapClasses', () => fetchMapClasses(mapName, mapMode), rows => setMapClasses(
        rows.map(r => ({ name: getClassName(r.class_id), played: Number(r.played), won: Number(r.won ?? 0) }))
            .filter(c => c.won > 0)
            .slice(0, 5)
    ));

    // Only the "activity" tab's data loads on mount; the other tabs fetch lazily the
    // first time they're opened (see loadedCategories effect below) so the page doesn't
    // fire ~13 simultaneous requests/queries for charts the visitor may never look at.
    const loadedCategories = useRef(new Set(['activity']));
    const skipMapEffect = useRef(true);
    const skipGamesByDayEffect = useRef(true);
    const skipRangeEffect = useRef(true);

    useEffect(() => {
        loadOverview();
        loadTopWins();
        loadTopKills();
        loadTopStreak();
        loadTopFish();
        loadLevels();
        loadWinRates();
        loadKdRatios();
        loadGamesOverTime();
        loadPlayersOverTime();
        loadTotalPlaysOverTime();
        loadNewPlayersOverTime();
        loadPeakHours();
    }, []);

    useEffect(() => {
        if (loadedCategories.current.has(activeCategory)) return;
        loadedCategories.current.add(activeCategory);
        if (activeCategory === 'classes') loadClasses();
        if (activeCategory === 'maps') loadMapPopularity();
        if (activeCategory === 'games') {
            loadGamesOverTimeByType();
            loadGamesByDay();
        }
    }, [activeCategory]);

    useEffect(() => {
        if (skipRangeEffect.current) { skipRangeEffect.current = false; return; }
        loadGamesOverTime();
        loadPlayersOverTime();
        loadTotalPlaysOverTime();
        loadNewPlayersOverTime();
        if (loadedCategories.current.has('games')) loadGamesOverTimeByType();
    }, [apiRange]);

    useEffect(() => {
        if (skipMapEffect.current) { skipMapEffect.current = false; return; }
        loadMapPopularity();
        setSelectedMap(null);
    }, [mapMode]);

    useEffect(() => {
        if (selectedMap) loadMapClasses(selectedMap);
    }, [selectedMap]);

    useEffect(() => {
        if (skipGamesByDayEffect.current) { skipGamesByDayEffect.current = false; return; }
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
                                        minHeight={220}>
                                        <PeakHoursChart data={peakHours} />
                                    </ChartCard>
                                </div>

                                <div className="analytics-trend-header">
                                    <h3 className="chart-card-title">Activity Trends</h3>
                                    <TimeRangeControl scope={timeScope} onScope={setTimeScope} month={timeMonth} onMonth={setTimeMonth} />
                                </div>

                                <div className="chart-section-grid">
                                    <ChartCard title="Games Played" status={status.gamesOverTime} empty={gamesOverTime.length === 0}
                                        minHeight={220}
                                        action={status.gamesOverTime === 'ready' && gamesOverTime.length > 0 && (
                                            <MonthStat value={periodTotal(gamesOverTime)} label={`Games ${periodLabel(timeScope, timeMonth)}`} />
                                        )}>
                                        <GamesOverTimeChart data={gamesOverTime} />
                                    </ChartCard>

                                    <ChartCard title="Players per Day" status={status.playersOverTime} empty={playersOverTime.length === 0}
                                        minHeight={220}
                                        action={status.playersOverTime === 'ready' && playersOverTime.length > 0 && (
                                            <MonthStat value={periodTotal(playersOverTime)} label={`Players ${periodLabel(timeScope, timeMonth)}`} />
                                        )}>
                                        <GamesOverTimeChart data={playersOverTime} valueLabel="players" color="#60a5fa" />
                                    </ChartCard>

                                    <ChartCard title="Individual Plays" status={status.totalPlaysOverTime} empty={totalPlaysOverTime.length === 0}
                                        minHeight={220}
                                        action={status.totalPlaysOverTime === 'ready' && totalPlaysOverTime.length > 0 && (
                                            <MonthStat value={periodTotal(totalPlaysOverTime)} label={`Individual plays ${periodLabel(timeScope, timeMonth)}`} />
                                        )}>
                                        <GamesOverTimeChart data={totalPlaysOverTime} valueLabel="individual plays" color="#c084fc" />
                                    </ChartCard>

                                    <ChartCard title="First Games Played" status={status.newPlayersOverTime} empty={newPlayersOverTime.length === 0}
                                        minHeight={220}
                                        action={status.newPlayersOverTime === 'ready' && newPlayersOverTime.length > 0 && (
                                            <MonthStat value={periodTotal(newPlayersOverTime)} label={`New players ${periodLabel(timeScope, timeMonth)}`} />
                                        )}>
                                        <GamesOverTimeChart data={newPlayersOverTime} valueLabel="new players" color="#34d399" />
                                    </ChartCard>
                                </div>

                                <div className="chart-section-grid leaderboard-grid">
                                    <ChartCard title="Player Level Distribution" full status={status.levels} empty={levels.length === 0}
                                        minHeight={280}>
                                        <VerticalBar data={levels} />
                                    </ChartCard>

                                    <ChartCard title="Top 10 by Wins" status={status.topWins} empty={topWins.length === 0}
                                        minHeight={300}>
                                        <HorizontalBar data={topWins} unit="Wins" />
                                    </ChartCard>

                                    <ChartCard title="Top 10 by Kills" status={status.topKills} empty={topKills.length === 0}
                                        minHeight={300}>
                                        <HorizontalBar data={topKills} unit="Kills" />
                                    </ChartCard>

                                    <ChartCard title="Top 10 Best Winstreaks" status={status.topStreak} empty={topStreak.length === 0}
                                        minHeight={300}>
                                        <HorizontalBar data={topStreak} unit="Wins" />
                                    </ChartCard>

                                    <ChartCard title="Top 10 Fish Caught" status={status.topFish} empty={topFish.length === 0}
                                        minHeight={300}>
                                        <HorizontalBar data={topFish} unit="Fish" />
                                    </ChartCard>

                                    <ChartCard title="Top Win Rates (min. 20 games)" status={status.winRates} empty={winRates.length === 0}
                                        minHeight={380}>
                                        <HorizontalBar data={winRates} dataKey="winRate" unit="Win Rate" height={380} domain={[0, 100]}
                                            formatValue={v => `${v}%`} />
                                    </ChartCard>

                                    <ChartCard title="Top K/D Ratios (min. 20 games)" status={status.kdRatios} empty={kdRatios.length === 0}
                                        minHeight={380}>
                                        <HorizontalBar data={kdRatios} dataKey="kd" unit="K/D" height={380}
                                            formatValue={v => v.toFixed(2)} />
                                    </ChartCard>
                                </div>
                            </>
                        )}

                        {activeCategory === 'maps' && (
                            <div className="chart-section-grid">
                                <ChartCard title="Map Popularity" full status={status.mapPopularity} empty={mapPopularity.length === 0}
                                    minHeight={520} action={
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
                                        minHeight={200}
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
                                        minHeight={240}>
                                        <CategoryChart data={classCategories} />
                                    </ChartCard>

                                    <ChartCard title="% of Total Wins by Category" status={status.classes} empty={classCategories.length === 0}
                                        minHeight={280}>
                                        <CategoryPieChart data={classCategories} />
                                    </ChartCard>
                                </div>

                                <div className="chart-section-grid classes-pair">
                                    <ChartCard
                                        title="Most Performing Classes"
                                        status={status.classes} empty={allClasses.length === 0} minHeight={560}
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
                                        status={status.classes} empty={allClasses.length === 0} minHeight={560}
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
                                <div className="analytics-trend-header">
                                    <h3 className="chart-card-title">Games Played</h3>
                                    <TimeRangeControl scope={timeScope} onScope={setTimeScope} month={timeMonth} onMonth={setTimeMonth} />
                                </div>

                                <div className="chart-section-grid">
                                    <ChartCard title={`Games Played ${periodLabel(timeScope, timeMonth)}`} full status={status.gamesOverTimeByType} empty={gamesOverTimeByDate.length === 0}
                                        minHeight={220} action={
                                        <div className="chart-card-action-row">
                                            {status.gamesOverTimeByType === 'ready' && gamesOverTimeByDate.length > 0 && (
                                                <MonthStat value={gamesOverTimeByDate.reduce((s, r) => s + r.total, 0)} label={`Games ${periodLabel(timeScope, timeMonth)}`} />
                                            )}
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
