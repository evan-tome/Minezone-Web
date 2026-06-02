import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { MatchCard } from '../Stats/RecentMatches';
import { fetchMatch } from '../../api/stats';
import ErrorScreen from '../../components/ErrorScreen';
import { FaArrowLeft, FaCopy } from 'react-icons/fa';
import '../../App.css';
import './Match.css';

export function Match() {
    const { id } = useParams();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setLoading(true);
        setMatch(null);
        setError(null);
        fetchMatch(id)
            .then(data => { setMatch(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="app dark-page">
            <Navbar />
            <main className="main match-main">
                <div className="match-topbar">
                    <Link to="/stats" state={{ tab: 'games' }} className="match-back-link">
                        <FaArrowLeft aria-hidden="true" />
                        Recent Matches
                    </Link>
                </div>

                {loading && <p className="match-status">Loading match...</p>}
                {error && <ErrorScreen title="Match not found" message={error} />}
                {match && (
                    <div className="match-content">
                        <div className="match-id-row">
                            <p className="match-id-label">Match #{match.game_id}</p>
                            <button className={`match-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy} aria-label="Copy match link">
                                <FaCopy aria-hidden="true" />
                            </button>
                        </div>
                        <MatchCard match={match} linked={false} />
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
