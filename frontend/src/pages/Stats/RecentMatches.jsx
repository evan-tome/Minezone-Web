import './RecentMatches.css';
import { CLASSES } from '../../utils/classes.js';
import { RANKS } from '../../utils/ranks.js';
import { FaCrown, FaChevronLeft, FaChevronRight, FaStar, FaClock, FaLink } from 'react-icons/fa';
import { PiSwordBold } from "react-icons/pi";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorScreen from '../../components/ErrorScreen';

const PAGE_SIZE = 5;

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


function getMvp(players) {
    let mvp = null;
    for (const p of players) {
        if (!mvp || p.kills > mvp.kills) {
            mvp = p;
        } else if (p.kills === mvp.kills) {
            if (p.winner || p.deaths < mvp.deaths) mvp = p;
        }
    }
    return mvp?.kills > 0 ? mvp : null;
}

function isMvp(player, players) {
    return getMvp(players) === player;
}

function StatBadge({ icon, label, variant }) {
    return (
        <span className={`rm-stat-badge rm-badge-${variant}`} data-tooltip={label}>
            {icon}
        </span>
    );
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        + ' · '
        + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function MatchCard({ match, linked = true }) {
    return (
        <div className="rm-card">
            <div className="rm-card-header">
                <div className="rm-card-header-left">
                    <span className="rm-mode-label">{match.game_type.toUpperCase()}</span>
                    <span className="rm-map">{match.map_name}</span>
                </div>
                <div className="rm-card-header-right">
                    {linked && (
                        <Link to={`/match/${match.game_id}`} className="rm-permalink" aria-label={`Permalink for match ${match.game_id}`}>
                            <FaLink aria-hidden="true" />
                        </Link>
                    )}
                    <span className="rm-meta">{formatDate(match.end_time)}</span>
                    <span className="rm-meta rm-duration"><FaClock className="rm-duration-icon" />{match.game_duration_minutes} min</span>
                </div>
            </div>

            <div className="rm-player-list">
                <div className="rm-player-row rm-player-header">
                    <span className="rm-col-place">Place</span>
                    <span className="rm-col-name">Player</span>
                    <span className="rm-col-class">Class</span>
                    <span className="rm-col-stat">Kills</span>
                    <span className="rm-col-stat rm-deaths">Deaths</span>
                    <span className="rm-col-stat rm-lives">Lives</span>
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
                                <Link className="rm-name-btn" to={`/stats/${p.username}`}>
                                    {p.username}
                                </Link>
                                {(isMvp(p, match.players) || p.first_blood) && (
                                    <span className="rm-badge-group">
                                        {isMvp(p, match.players) && <StatBadge icon={<FaStar />} label="Match MVP" variant="mvp" />}
                                        {p.first_blood && <StatBadge icon={<PiSwordBold />} label="First Blood" variant="firstblood" />}
                                    </span>
                                )}
                            </span>
                            <span className="rm-col-class rm-class">{CLASSES.get(p.class_id)?.name || 'Unknown'}</span>
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

const MODES = ['', 'classic', 'frenzy', 'duel'];

function RecentMatches({ matches, loading, error }) {
    const [page, setPage] = useState(0);
    const [modeFilter, setModeFilter] = useState('');

    const allMatches = matches ?? [];
    const filtered = modeFilter
        ? allMatches.filter(m => m.game_type?.toLowerCase() === modeFilter)
        : allMatches;

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleMode = (mode) => {
        setModeFilter(mode);
        setPage(0);
    };

    return (
        <div className="rm-section">
            <div className="rm-section-header">
                <h2>Recent Matches</h2>
                {allMatches.length > 0 && <span className="rm-section-sub">Last {allMatches.length} games</span>}
                <div className="rm-mode-filters">
                    {MODES.map(mode => {
                        const count = mode
                            ? allMatches.filter(m => m.game_type?.toLowerCase() === mode).length
                            : allMatches.length;
                        return (
                            <button
                                key={mode || 'all'}
                                type="button"
                                className={`rm-mode-btn${modeFilter === mode ? ' active' : ''}`}
                                onClick={() => handleMode(mode)}
                                disabled={mode !== '' && count === 0}
                            >
                                {mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : 'All'}
                                <span className="rm-mode-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            {loading && <p className="rm-status">Loading recent matches...</p>}
            {error && <ErrorScreen title="Failed to load matches" message={error} />}
            {!loading && !error && !matches?.length && <p className="rm-status">No matches recorded yet.</p>}
            {!loading && !error && matches?.length > 0 && (
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
            )}
        </div>
    );
}

export default RecentMatches;
