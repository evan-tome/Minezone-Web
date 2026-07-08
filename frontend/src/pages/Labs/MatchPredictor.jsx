import { useState } from 'react';
import { FaTrophy, FaSearch } from 'react-icons/fa';
import { fetchGamePrediction } from '../../api/stats.js';

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

export function MatchPredictor() {
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
                <div className="labs-feature-title-row">
                    <div className="labs-feature-icon-wrap">
                        <FaTrophy />
                    </div>
                    <h2 className="labs-feature-title">Match Predictor</h2>
                </div>
                <p className="labs-feature-desc">
                    Add 2 to 8 players and see who the model predicts will win.
                    Trained on historical match outcomes using each player's stats profile.
                </p>
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
