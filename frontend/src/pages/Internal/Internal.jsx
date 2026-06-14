import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWrench, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import { fetchAnomalies, fetchPipelineHealth, fetchBalance } from '../../api/internal.js';
import { CLASSES } from '../../utils/classes.js';
import '../../App.css';
import './Internal.css';

function AnomalyTab() {
    const [flagged, setFlagged] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAnomalies()
            .then(d => setFlagged(d.flagged))
            .catch(e => setError(e.message));
    }, []);

    if (error) return <div className="internal-error">{error}</div>;
    if (!flagged) return <div className="internal-loading">Loading…</div>;

    return (
        <div className="internal-section">
            <div className="internal-section-header">
                <h2>Suspicious Players</h2>
                <p className="internal-desc">
                    Sorted by how unusual their stats are. Click a row to view the profile.
                </p>
            </div>

            {flagged.length === 0 ? (
                <div className="internal-empty">Nothing flagged right now.</div>
            ) : (
                <div className="internal-table-wrap">
                    <table className="internal-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th>KDR</th>
                                <th>Win %</th>
                                <th>Flawless %</th>
                                <th>MVP %</th>
                                <th>Kills/G</th>
                                <th>Level</th>
                                <th>Games</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flagged.map((p, i) => (
                                <tr
                                    key={p.username}
                                    className="internal-row-link"
                                    onClick={() => navigate(`/stats/${p.username}`)}
                                >
                                    <td className="internal-rank">{i + 1}</td>
                                    <td className="internal-username">{p.username}</td>
                                    <td>{p.kdr}</td>
                                    <td>{p.win_rate}%</td>
                                    <td>{p.flawless_rate}%</td>
                                    <td>{p.mvp_rate}%</td>
                                    <td>{p.kills_pg}</td>
                                    <td>{p.level}</td>
                                    <td>{p.total_games.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PipelineTab() {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPipelineHealth()
            .then(setStatus)
            .catch(e => setError(e.message));
    }, []);

    if (error) return <div className="internal-error">{error}</div>;
    if (!status) return <div className="internal-loading">Loading…</div>;

    const { healthy, issues = [], days_analyzed, baseline_days } = status;
    const dayWord = issues.length === 1 ? 'day' : 'days';
    const healthLabel = healthy ? 'Healthy' : `${issues.length} ${dayWord} look off`;

    return (
        <div className="internal-section">
            <div className="internal-section-header">
                <h2>Pipeline Health</h2>
                <p className="internal-desc">
                    Checks whether game data is coming in normally. Flags days where something looks off, like a sudden drop in games or kills.
                </p>
            </div>

            <div className={`internal-health-badge ${healthy ? 'healthy' : 'issues'}`}>
                {healthy ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <span>{healthLabel}</span>
            </div>

            <div className="internal-pipeline-meta">
                <span>{days_analyzed} recent days checked</span>
                <span>{baseline_days}-day baseline</span>
            </div>

            {issues.length > 0 && (
                <div className="internal-table-wrap">
                    <table className="internal-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Games</th>
                                <th>Avg Kills</th>
                                <th>Avg Players/Game</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map(issue => (
                                <tr key={issue.date}>
                                    <td>{issue.date}</td>
                                    <td>{issue.game_count.toLocaleString()}</td>
                                    <td>{issue.avg_kills}</td>
                                    <td>{issue.avg_players_per_game}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function BalanceTab() {
    const [flagged, setFlagged] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBalance()
            .then(d => setFlagged(d.flagged))
            .catch(e => setError(e.message));
    }, []);

    if (error) return <div className="internal-error">{error}</div>;
    if (!flagged) return <div className="internal-loading">Loading…</div>;

    return (
        <div className="internal-section">
            <div className="internal-section-header">
                <h2>Class Balance</h2>
                <p className="internal-desc">
                    Classes whose win rate over the last 5 days has shifted significantly from their 14-day average.
                </p>
            </div>

            {flagged.length === 0 ? (
                <div className="internal-empty">No unusual shifts detected.</div>
            ) : (
                <div className="internal-table-wrap">
                    <table className="internal-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Last 5 Days</th>
                                <th>14-Day Avg</th>
                                <th>Change</th>
                                <th>Games</th>
                                <th>As Of</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flagged.map(cls => {
                                const sign = cls.deviation > 0 ? '+' : '';
                                return (
                                    <tr key={cls.class_id}>
                                        <td className="internal-classname">
                                            {CLASSES.get(cls.class_id)?.name ?? `Class ${cls.class_id}`}
                                        </td>
                                        <td>{cls.recent_avg}%</td>
                                        <td>{cls.baseline}%</td>
                                        <td className={cls.deviation > 0 ? 'internal-positive' : 'internal-negative'}>
                                            {sign}{cls.deviation}%
                                        </td>
                                        <td>{cls.games_recent?.toLocaleString() ?? 'N/A'}</td>
                                        <td className="internal-date">{cls.as_of}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const TABS = [
    { id: 'anomalies', label: 'Suspicious Players', Panel: AnomalyTab },
    { id: 'pipeline',  label: 'Pipeline Health',    Panel: PipelineTab },
    { id: 'balance',   label: 'Class Balance',      Panel: BalanceTab },
];

export function Internal() {
    const [active, setActive] = useState('anomalies');
    const { Panel } = TABS.find(t => t.id === active);

    return (
        <div className="app dark-page">
            <Navbar />
            <div className="main internal-main">
                <div className="internal-header">
                    <h1><FaWrench /> Developer Tools</h1>
                    <p>Internal tools for keeping tabs on the server. Not for players.</p>
                </div>

                <div className="internal-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`internal-tab-btn${active === tab.id ? ' active' : ''}`}
                            onClick={() => setActive(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <Panel />
            </div>
        </div>
    );
}
