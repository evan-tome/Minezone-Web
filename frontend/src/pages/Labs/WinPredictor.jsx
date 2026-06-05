import { useState, useRef, useEffect } from 'react';
import { FaChartLine, FaSearch } from 'react-icons/fa';
import { fetchWinPrediction } from '../../api/stats.js';

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

export function WinPredictor() {
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
    const tracked = result?.tracked_win_rate;
    const trackedGames = result?.tracked_games;
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
                                    <span className="labs-predict-sublabel">recorded across all matches</span>
                                </span>
                                <span className="labs-predict-compare-val">{actual}%</span>
                            </div>
                            <div className="labs-predict-compare-divider" />
                            <div className="labs-predict-compare-row">
                                <span className="labs-predict-compare-label">
                                    Tracked games win rate
                                    <span className="labs-predict-sublabel">
                                        {trackedGames > 0 ? `${trackedGames} recorded matches on this server` : 'no recorded matches found'}
                                    </span>
                                </span>
                                <span className="labs-predict-compare-val">
                                    {tracked != null ? `${tracked}%` : '—'}
                                </span>
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
