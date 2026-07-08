import { useState } from 'react';
import { FaLightbulb, FaSearch } from 'react-icons/fa';
import { fetchRecommendation } from '../../api/stats.js';
import { CLASSES } from '../../utils/classes.js';

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

export function ClassRecommender() {
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
                <div className="labs-feature-title-row">
                    <div className="labs-feature-icon-wrap">
                        <FaLightbulb />
                    </div>
                    <h2 className="labs-feature-title">Class Recommender</h2>
                </div>
                <p className="labs-feature-desc">
                    Not sure which class fits your playstyle? Enter any username and we'll
                    analyze how they play, looking at their kill rate, win rate, and streaks,
                    then match them with the classes that similar players tend to dominate with.
                </p>
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
                        <a className="labs-results-player" href={`/stats/${result.username}`}>{result.username}</a>
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
                    <li><span>Class history</span>Your win rate per class is calculated from every class you've played 5+ games on.</li>
                    <li><span>Similar players</span>Your stats are matched against the server to find players with a similar profile, then we look at which classes they win with most.</li>
                    <li><span>Score</span>Each class is scored 50% from your own performance with it and 50% from what similar players tend to win with. Both signals need to agree for a class to rank highly.</li>
                </ul>
            </div>
        </div>
    );
}
