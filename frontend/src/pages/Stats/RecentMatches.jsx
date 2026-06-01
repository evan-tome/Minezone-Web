import './RecentMatches.css';
import { CLASSES } from '../../utils/classes.js';
import { RANKS } from '../../utils/ranks.js';
import { FaCrown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 5;

function getClassName(id) {
    const name = CLASSES.get(id)?.name || 'Unknown';
    return name.replace(/([A-Z])/g, ' $1').trim();
}

function getRank(id) {
    return RANKS.get(id) || { label: 'Default', color: '#aaa' };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatMode(raw) {
    return raw
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        + ' · '
        + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function MatchCard({ match }) {
    const navigate = useNavigate();

    return (
        <div className="rm-card">
            <div className="rm-card-header">
                <div className="rm-card-header-left">
                    <span className="rm-mode-badge">{formatMode(match.game_type)}</span>
                    <span className="rm-map">{match.map_name}</span>
                </div>
                <div className="rm-card-header-right">
                    <span className="rm-meta">{formatDate(match.end_time)}</span>
                    <span className="rm-meta rm-duration">{match.game_duration_minutes} min</span>
                </div>
            </div>

            <div className="rm-player-list">
                <div className="rm-player-row rm-player-header">
                    <span className="rm-col-place">Place</span>
                    <span className="rm-col-name">Player</span>
                    <span className="rm-col-class">Class</span>
                    <span className="rm-col-stat">Kills</span>
                    <span className="rm-col-stat">Deaths</span>
                    <span className="rm-col-stat">Lives</span>
                </div>

                {match.players.map(p => {
                    const rank = getRank(p.role_id);
                    return (
                        <div key={p.uuid} className={`rm-player-row ${p.winner ? 'rm-winner' : ''}`}>
                            <span className="rm-col-place rm-place-num">
                                <span className="rm-crown-slot">{p.placement === 1 && <FaCrown className="rm-crown" />}</span>
                                {ordinal(p.placement)}
                            </span>
                            <span className="rm-col-name rm-name-cell">
                                <span className="rm-level">Lv. {p.level}</span>
                                {rank.label !== 'Default' && (
                                    <span className="rm-rank-tag" style={{ color: rank.color, borderColor: rank.color, background: hexToRgba(rank.color, 0.06) }}>{rank.label}</span>
                                )}
                                <button className="rm-name-btn" onClick={() => navigate(`/stats/${p.username}`)}>
                                    {p.username}
                                </button>
                                {p.first_blood && (
                                    <span className="rm-firstblood-tag">First Blood</span>
                                )}
                            </span>
                            <span className="rm-col-class rm-class">{getClassName(p.class_id)}</span>
                            <span className="rm-col-stat rm-kills">{p.kills}</span>
                            <span className="rm-col-stat rm-deaths">{p.deaths}</span>
                            <span className="rm-col-stat rm-lives">{p.lives}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RecentMatches({ matches, loading, error }) {
    const [page, setPage] = useState(0);

    const totalPages = Math.ceil((matches?.length ?? 0) / PAGE_SIZE);
    const paginated = matches?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];

    const body = () => {
        if (loading) return <p className="rm-status">Loading recent matches...</p>;
        if (error)   return <p className="rm-status rm-status-error">Failed to load matches: {error}</p>;
        if (!matches?.length) return <p className="rm-status">No matches recorded yet.</p>;
        return (
            <>
                <div className="rm-list">
                    {paginated.map(m => <MatchCard key={m.game_id} match={m} />)}
                </div>
                {totalPages > 1 && (
                    <div className="rm-pagination">
                        <button className="rm-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                            <FaChevronLeft />
                        </button>
                        <span className="rm-page-info">{page + 1} / {totalPages}</span>
                        <button className="rm-page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="rm-section">
            <div className="rm-section-header">
                <h2>Recent Matches</h2>
                {matches?.length > 0 && <span className="rm-section-sub">Last {matches.length} games</span>}
            </div>
            {body()}
        </div>
    );
}

export default RecentMatches;
