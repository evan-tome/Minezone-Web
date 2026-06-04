import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, CartesianGrid, Legend, PieChart, Pie,
    AreaChart, Area,
} from 'recharts';
import { FaUsers, FaGamepad, FaMedal, FaSkull, FaFish, FaFire } from 'react-icons/fa';
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

function ChartCard({ title, children, full, action, rowSpan }) {
    return (
        <div className={`chart-card ${full ? 'chart-card-full' : ''}`}
             style={rowSpan ? { gridRow: `span ${rowSpan}` } : undefined}>
            <div className="chart-card-header">
                <h3 className="chart-card-title">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function HorizontalBar({ data, dataKey = 'value', nameKey = 'name' }) {
    const navigate = useNavigate();
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={nameKey} width={110} axisLine={false} tickLine={false}
                    tick={(props) => <PlayerTick {...props} navigate={navigate} />} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {data.map((entry, i) => <Cell key={entry[nameKey]} fill={BAR_COLORS[i] ?? BAR_COLORS.at(-1)} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function VerticalBar({ data, dataKey = 'value', nameKey = 'name' }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey={nameKey} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey={dataKey} fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={36} />
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

function WinRateTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name">{label}</p>
            <p className="chart-tooltip-value" style={{ color: '#4ade80' }}>{d.winRate}% win rate</p>
            <p className="chart-tooltip-name">{d.wins}W / {d.losses}L · {d.total} games</p>
        </div>
    );
}

function formatHour(h) {
    if (h === 0)  return '12am';
    if (h < 12)  return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MapPopularityChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={520}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 52, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false}
                    tick={{ fill: 'var(--text)', fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}
                    label={{ position: 'right', formatter: v => v.toLocaleString(), fill: 'var(--muted)', fontSize: 12 }}>
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

function KDTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name">{label}</p>
            <p className="chart-tooltip-value" style={{ color: '#60a5fa' }}>{d.kd.toFixed(2)} K/D</p>
            <p className="chart-tooltip-name">{d.kills.toLocaleString()}K / {d.deaths.toLocaleString()}D</p>
        </div>
    );
}

function KDChart({ data }) {
    const navigate = useNavigate();
    return (
        <ResponsiveContainer width="100%" height={380}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false}
                    tick={(props) => <PlayerTick {...props} navigate={navigate} />} />
                <Tooltip content={<KDTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="kd" name="K/D" radius={[0, 4, 4, 0]} maxBarSize={18} fill="#60a5fa"
                    label={{ position: 'right', formatter: v => v.toFixed(2), fill: 'var(--muted)', fontSize: 12 }} />
            </BarChart>
        </ResponsiveContainer>
    );
}

function WinRateChart({ data }) {
    const navigate = useNavigate();
    return (
        <ResponsiveContainer width="100%" height={380}>
            <BarChart layout="vertical" data={data} margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false}
                    tick={(props) => <PlayerTick {...props} navigate={navigate} />} />
                <Tooltip content={<WinRateTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="winRate" name="Win Rate" radius={[0, 4, 4, 0]} maxBarSize={18} fill="#4ade80" label={{ position: 'right', formatter: v => `${v}%`, fill: 'var(--muted)', fontSize: 12 }} />
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
    const [gamesOverTime, setGamesOverTime]     = useState([]);
    const [peakHours, setPeakHours]             = useState([]);

    useEffect(() => {
        fetchOverview().then(setOverview).catch(() => {});

        fetchTopByStat('Wins').then(d =>
            setTopWins(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.Wins })))
        ).catch(() => {});

        fetchTopByStat('Kills').then(d =>
            setTopKills(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.Kills })))
        ).catch(() => {});

        fetchTopByStat('BestWinstreak').then(d =>
            setTopStreak(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.BestWinstreak })))
        ).catch(() => {});

        fetchTopByStat('TotalCaught').then(d =>
            setTopFish(d.slice(0, 10).map(p => ({ name: p.LastPlayerName, value: p.TotalCaught })))
        ).catch(() => {});

        fetchLevelDistribution().then(d =>
            setLevels(d.map(b => ({ name: `${b.bucket}-${b.bucket + 4}`, value: b.count })))
        ).catch(() => {});

        fetchAllClassStats().then(rows => {
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
        }).catch(() => {});

        fetchWinRates().then(d =>
            setWinRates(d.map(p => ({
                name: p.LastPlayerName,
                winRate: Number(p.WinRate),
                wins: Number(p.Wins),
                losses: Number(p.Losses),
                total: Number(p.TotalGames),
            })))
        ).catch(() => {});

        fetchKDRatios().then(d =>
            setKdRatios(d.map(p => ({
                name: p.LastPlayerName,
                kd: Number(p.KDRatio),
                kills: Number(p.Kills),
                deaths: Number(p.Deaths),
            })))
        ).catch(() => {});

        fetchMapPopularity().then(d =>
            setMapPopularity(d.map(r => ({ name: r.map_name, value: Number(r.game_count) })))
        ).catch(() => {});

        fetchGamesOverTime().then(d =>
            setGamesOverTime(d.map(r => ({ date: r.date, games: Number(r.games) })))
        ).catch(() => {});

        fetchPeakHours().then(d => {
            const byHour = {};
            d.forEach(r => { byHour[Number(r.hour)] = Number(r.games); });
            setPeakHours(
                Array.from({ length: 24 }, (_, h) => ({
                    hour: formatHour(h),
                    games: byHour[h] ?? 0,
                }))
            );
        }).catch(() => {});
    }, []);

    return (
        <div className="app dark-page">
            <Navbar />
            <div className="main analytics-main">

                <div className="analytics-header">
                    <h1>Server Analytics</h1>
                    <p>Live statistics and trends from Minezone</p>
                </div>

                {overview && (
                    <div className="overview-grid">
                        <StatCard icon={<FaUsers />}   label="Total Players"  value={Number(overview.totalPlayers).toLocaleString()} />
                        <StatCard icon={<FaGamepad />}  label="Games Played"   value={Number(overview.totalGames).toLocaleString()} />
                        <StatCard icon={<FaMedal />}    label="Avg Level"      value={overview.avgLevel} />
                        <StatCard icon={<FaSkull />}    label="Total Kills"    value={Number(overview.totalKills).toLocaleString()} />
                        <StatCard icon={<FaFish />}     label="Fish Caught"    value={Number(overview.totalFishCaught).toLocaleString()} />
                        <StatCard icon={<FaFire />}     label="Top Winstreak"  value={Number(overview.topWinstreak).toLocaleString()} />
                    </div>
                )}

                <div className="charts-grid">
                    {(mapPopularity.length > 0 || peakHours.length > 0 || gamesOverTime.length > 0) && (
                        <div className="map-time-group">
                            {mapPopularity.length > 0 && (
                                <ChartCard title="Map Popularity" rowSpan={2}>
                                    <MapPopularityChart data={mapPopularity} />
                                </ChartCard>
                            )}
                            {peakHours.length > 0 && (
                                <ChartCard title="Peak Hours (all time, ET)">
                                    <PeakHoursChart data={peakHours} />
                                </ChartCard>
                            )}
                            {gamesOverTime.length > 0 && (
                                <ChartCard title="Games Played: Last 60 Days">
                                    <GamesOverTimeChart data={gamesOverTime} />
                                </ChartCard>
                            )}
                        </div>
                    )}

                    <ChartCard title="Top 10 by Wins">
                        <HorizontalBar data={topWins} />
                    </ChartCard>

                    <ChartCard title="Top 10 by Kills">
                        <HorizontalBar data={topKills} />
                    </ChartCard>

                    <ChartCard title="Player Level Distribution" full>
                        <VerticalBar data={levels} />
                    </ChartCard>

                    <ChartCard title="Top 10 Best Winstreaks">
                        <HorizontalBar data={topStreak} />
                    </ChartCard>

                    <ChartCard title="Top 10 Fish Caught">
                        <HorizontalBar data={topFish} />
                    </ChartCard>

                    {classCategories.length > 0 && (
                        <ChartCard title="Wins by Class Category">
                            <CategoryChart data={classCategories} />
                        </ChartCard>
                    )}

                    {classCategories.length > 0 && (
                        <ChartCard title="% of Total Wins by Category">
                            <CategoryPieChart data={classCategories} />
                        </ChartCard>
                    )}

                    {winRates.length > 0 && (
                        <ChartCard title="Top Win Rates (min. 20 games)">
                            <WinRateChart data={winRates} />
                        </ChartCard>
                    )}

                    {kdRatios.length > 0 && (
                        <ChartCard title="Top K/D Ratios (min. 20 games)">
                            <KDChart data={kdRatios} />
                        </ChartCard>
                    )}

                    {allClasses.length > 0 && (
                        <ChartCard
                            title="Most Active Classes"
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
                    )}

                    {allClasses.length > 0 && (
                        <ChartCard
                            title="Least Active Classes"
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
                    )}
                </div>

            </div>
            <Footer />
        </div>
    );
}
