import { useState } from 'react';
import { Link } from 'react-router-dom';
import './PlayerStats.css'
import { RANKS } from '../../utils/ranks.js';
import { CLASSES } from '../../utils/classes.js';
import { FaTrophy, FaFish, FaBolt, FaMedal, FaCoins, FaStar,
         FaSkull, FaShieldAlt, FaChartLine, FaUsers, FaClock,
         FaTimes, FaFire, FaCrown, FaList, FaHistory, FaUser, FaCopy } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';


function hexToRgba(hex, alpha) {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getClassName(id) {
    return CLASSES.get(id)?.name || "Unknown";
}

// Parkour times are stored as nanoseconds by the Java plugin.
function formatTime(nanoseconds) {
    const totalSeconds = Math.floor(nanoseconds / 1e9);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function StatCell({ label, value, accent, icon }) {
    return (
        <div className="stat-cell">
            <span className="stat-cell-label">
                {icon && <span className="stat-cell-icon">{icon}</span>}
                {label}
            </span>
            <span className={`stat-cell-value${accent ? " accent" : ""}`}>{value}</span>
        </div>
    );
}

function SectionTitle({ icon, children }) {
    return (
        <div className="ps-section-title">
            {icon && <span className="ps-section-icon">{icon}</span>}
            {children}
        </div>
    );
}

// Returns a number with its English ordinal suffix (1st, 2nd, 3rd, 4th...).
function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function GameCard({ game }) {
    const won = game.winner === 1 || game.winner === true;
    const date = new Date(game.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return (
        <Link to={`/match/${game.game_id}`} className={`game-card ${won ? 'game-card-win' : 'game-card-loss'}`}>
            <div className="game-card-header">
                <span className={`game-card-result ${won ? 'win' : 'loss'}`}>{won ? 'Win' : 'Loss'}</span>
                {game.first_blood && <span className="gc-firstblood-tag">First Blood</span>}
                <span className="game-card-date">{date}</span>
            </div>
            <div className="game-card-map">{game.map_name}</div>
            <div className="game-card-stats">
                <div className="game-card-stat">
                    <span className="game-card-stat-label"><FaMedal /> Place</span>
                    <span className="game-card-stat-value">{ordinal(game.placement)}</span>
                </div>
                <div className="game-card-stat">
                    <span className="game-card-stat-label"><FaSkull /> Kills</span>
                    <span className="game-card-stat-value">{game.kills}</span>
                </div>
                <div className="game-card-stat">
                    <span className="game-card-stat-label"><FaShieldAlt /> Deaths</span>
                    <span className="game-card-stat-value">{game.deaths}</span>
                </div>
                <div className="game-card-stat">
                    <span className="game-card-stat-label"><FaUser /> Class</span>
                    <span className="game-card-stat-value">{getClassName(game.class_id)}</span>
                </div>
            </div>
        </Link>
    );
}

function PlayerStats({ player }) {
    const [copied, setCopied] = useState(false);
    const headUrl = `https://minotar.net/helm/${player.UUID}/128.png`;
    const rank = player.RoleID !== 0 ? RANKS.get(player.RoleID) : undefined;

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    const expPct = Math.min((player.Exp / 2500) * 100, 100).toFixed(1);
    const wlr = player.Losses > 0 ? (player.Wins / player.Losses).toFixed(2) : player.Wins;
    const kdr = player.Deaths > 0 ? (player.Kills / player.Deaths).toFixed(2) : player.Kills;
    const matches = player.Wins + player.Losses;

    return (
        <div className="ps-card">

            {/* Header */}
            <div className="ps-header">
                <img className="ps-avatar" src={headUrl} alt={player.LastPlayerName} />
                <div className="ps-identity">
                    <h2 className="ps-username">{player.LastPlayerName}</h2>
                    {rank && <span className="ps-rank-badge" style={{ color: rank.color, borderColor: rank.color, background: hexToRgba(rank.color, 0.06) }}>
                        {rank.label}
                    </span>}
                </div>
                <button className={`ps-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy} aria-label="Copy player profile link">
                    <FaCopy aria-hidden="true" />
                </button>
            </div>

            {/* General Profile */}
            <div className="ps-progression">
                <div className="ps-prog-item">
                    <span className="ps-prog-label"><FaMedal /> Level</span>
                    <span className="ps-prog-value">{player.Level}</span>
                </div>
                <div className="ps-prog-item ps-exp-item">
                    <div className="ps-prog-top">
                        <span className="ps-prog-label"><FaStar /> EXP</span>
                        <span className="ps-prog-value">{player.Exp.toLocaleString()} / 2,500</span>
                    </div>
                    <div className="ps-exp-bar">
                        <div className="ps-exp-fill" style={{ width: `${expPct}%` }} />
                    </div>
                </div>
                <div className="ps-prog-item">
                    <span className="ps-prog-label"><FaCoins /> Tokens</span>
                    <span className="ps-prog-value">{player.Tokens.toLocaleString()}</span>
                </div>
            </div>

            {/* Super Craft Bros */}
            <SectionTitle icon={<FaTrophy />}>Super Craft Bros</SectionTitle>
            <div className="ps-stat-grid ps-grid-1">
                <StatCell label="Matches Played"  value={matches.toLocaleString()}               icon={<FaUsers />} />
            </div>
            <div className="ps-stat-grid ps-grid-4">
                <StatCell label="Wins"          value={player.Wins.toLocaleString()}         icon={<FaTrophy />} />
                <StatCell label="Losses"        value={player.Losses.toLocaleString()}        icon={<FaTimes />} />
                <StatCell label="W/L Ratio"     value={wlr}                                  icon={<FaChartLine />} accent />
                <StatCell label="Flawless Wins" value={player.FlawlessWins.toLocaleString()} icon={<FaStar />} />
            </div>
            <div className="ps-stat-grid ps-grid-4">
                <StatCell label="Kills"     value={player.Kills.toLocaleString()}     icon={<FaSkull />} />
                <StatCell label="Deaths"    value={player.Deaths.toLocaleString()}    icon={<FaShieldAlt />} />
                <StatCell label="K/D Ratio" value={kdr}                               icon={<FaChartLine />} accent />
                <StatCell label="MVPs"      value={player.MatchMvps.toLocaleString()} icon={<FaMedal />} />
            </div>
            <div className="ps-stat-grid ps-grid-2">
                <StatCell label="Winstreak"      value={player.Winstreak.toLocaleString()}     icon={<FaFire />} />
                <StatCell label="Best Winstreak" value={player.BestWinstreak.toLocaleString()} icon={<FaCrown />} accent />
            </div>
            <div className="ps-stat-grid ps-grid-2">
                <StatCell label="Favorite Class" value={player.FavClass ? getClassName(player.FavClass) : "N/A"} icon={<IoSparkles />} />
                <StatCell label="Best Class" value={player.BestClass ? getClassName(player.BestClass) : "N/A"} icon={<FaTrophy />} accent />
            </div>

            {/* Recent Games */}
            {player.RecentGames?.length > 0 && <>
                <SectionTitle icon={<FaHistory />}>Recent Games</SectionTitle>
                <div className="game-cards">
                    {player.RecentGames.map(g => <GameCard key={g.game_id} game={g} />)}
                </div>
            </>}

            {/* Fishing */}
            <SectionTitle icon={<FaFish />}>Fishing</SectionTitle>
            <div className="ps-stat-grid ps-grid-2">
                <StatCell label="Total Fish Caught" value={player.TotalCaught.toLocaleString()}                 icon={<FaFish />} />
                <StatCell label="Species Caught"    value={`${player.UniqueCaught?.toLocaleString()}/100`} icon={<FaList />} />
            </div>

            {/* Parkour */}
            <SectionTitle icon={<FaBolt />}>Parkour</SectionTitle>
            <div className="ps-stat-grid ps-grid-1">
                <StatCell label="Best Time" value={player.TotalTime ? formatTime(player.TotalTime) : "N/A"} icon={<FaClock />} />
            </div>

        </div>
    );
}

export default PlayerStats;
