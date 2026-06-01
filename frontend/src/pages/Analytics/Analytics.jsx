import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, CartesianGrid, Legend,
} from 'recharts';
import { FaUsers, FaGamepad, FaMedal, FaSkull, FaFish, FaFire } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { fetchOverview, fetchLevelDistribution, fetchTopByStat, fetchTopClasses, fetchWinRates, fetchAllClassStats } from '../../api/analytics.js';
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

function ChartCard({ title, children, full, action }) {
    return (
        <div className={`chart-card ${full ? 'chart-card-full' : ''}`}>
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

function WinRateTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-name">{label}</p>
            <p className="chart-tooltip-value" style={{ color: '#4ade80' }}>{d.winRate}% win rate</p>
            <p className="chart-tooltip-name">{d.wins}W / {d.losses}L — {d.total} games</p>
        </div>
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
        <ResponsiveContainer width="100%" height={420}>
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
    const [classes, setClasses]       = useState([]);
    const [classSort, setClassSort]   = useState('played');
    const [winRates, setWinRates]         = useState([]);
    const [classCategories, setClassCategories] = useState([]);

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
            setLevels(d.map(b => ({ name: `${b.bucket}–${b.bucket + 4}`, value: b.count })))
        ).catch(() => {});

        fetchTopClasses().then(d =>
            setClasses(d.map(c => ({
                name: getClassName(c.ClassID),
                played: Number(c.totalPlayed),
                won: Number(c.totalWon ?? 0),
            })))
        ).catch(() => {});

        fetchAllClassStats().then(rows => {
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

                    {winRates.length > 0 && (
                        <ChartCard title="Top Win Rates (min. 20 games)" full>
                            <WinRateChart data={winRates} />
                        </ChartCard>
                    )}

                    {classes.length > 0 && (
                        <ChartCard
                            title="Top Classes — Games Played vs Won"
                            full
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
                                </div>
                            }
                        >
                            <ClassesChart
                                data={[...classes].sort((a, b) => b[classSort] - a[classSort])}
                            />
                        </ChartCard>
                    )}
                </div>

            </div>
            <Footer />
        </div>
    );
}
