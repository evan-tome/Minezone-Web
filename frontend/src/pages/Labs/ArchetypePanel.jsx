import { useState } from 'react';
import { FaUser, FaSearch, FaCloud, FaBolt, FaCrown, FaSkull, FaStar } from 'react-icons/fa';
import { fetchArchetype } from '../../api/stats.js';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

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

export function ArchetypePanel() {
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
