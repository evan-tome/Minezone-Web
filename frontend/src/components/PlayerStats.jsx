import './PlayerStats.css'
import { RANKS } from '../utils/ranks';
import { CLASSES } from '../utils/classes';

function getRank(id) {
    return RANKS.get(id) || { label: "Default", color: "#aaa" };
}

function getClassName(id) {
    return CLASSES.get(id)?.name || "Unknown";
}

function formatTime(nanoseconds) {
    const totalSeconds = Math.floor(nanoseconds / 1e9);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function StatCell({ label, value, accent }) {
    return (
        <div className="stat-cell">
            <span className="stat-cell-label">{label}</span>
            <span className={`stat-cell-value${accent ? " accent" : ""}`}>{value}</span>
        </div>
    );
}

function SectionTitle({ children }) {
    return <div className="ps-section-title">{children}</div>;
}

function PlayerStats({ player }) {
    const headUrl = `https://minotar.net/helm/${player.UUID}/128.png`;
    const rank = getRank(player.RoleID);
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
                    <span className="ps-rank-badge" style={{ color: rank.color, borderColor: rank.color }}>
                        {rank.label}
                    </span>
                </div>
            </div>

            {/* General Profile */}
            <div className="ps-progression">
                <div className="ps-prog-item">
                    <span className="ps-prog-label">Level</span>
                    <span className="ps-prog-value">{player.Level}</span>
                </div>
                <div className="ps-prog-item ps-exp-item">
                    <div className="ps-prog-top">
                        <span className="ps-prog-label">EXP</span>
                        <span className="ps-prog-value">{player.Exp.toLocaleString()} / 2,500</span>
                    </div>
                    <div className="ps-exp-bar">
                        <div className="ps-exp-fill" style={{ width: `${expPct}%` }} />
                    </div>
                </div>
                <div className="ps-prog-item">
                    <span className="ps-prog-label">Tokens</span>
                    <span className="ps-prog-value">{player.Tokens.toLocaleString()}</span>
                </div>
            </div>

            {/* Super Craft Bros */}
            <SectionTitle>Super Craft Bros</SectionTitle>
            <div className="ps-stat-grid ps-grid-1">
                <StatCell label="Matches Played" value={matches.toLocaleString()} />
            </div>
            <div className="ps-stat-grid ps-grid-4">
                <StatCell label="Wins" value={player.Wins.toLocaleString()} />
                <StatCell label="Losses" value={player.Losses.toLocaleString()} />
                <StatCell label="W/L Ratio" value={wlr} accent />
                <StatCell label="Flawless Wins" value={player.FlawlessWins.toLocaleString()} />
            </div>
            <div className="ps-stat-grid ps-grid-4">
                <StatCell label="Kills" value={player.Kills.toLocaleString()} />
                <StatCell label="Deaths" value={player.Deaths.toLocaleString()} />
                <StatCell label="K/D Ratio" value={kdr} accent />
                <StatCell label="Match MVPs" value={player.MatchMvps.toLocaleString()} />
            </div>
            <div className="ps-stat-grid ps-grid-2">
                <StatCell label="Current Winstreak" value={player.Winstreak.toLocaleString()} />
                <StatCell label="Best Winstreak" value={player.BestWinstreak.toLocaleString()} accent />
            </div>
            <div className="ps-stat-grid ps-grid-1">
                <StatCell label="Favorite Class" value={player.FavClass ? getClassName(player.FavClass) : "N/A"} />
            </div>

            {/* Fishing */}
            <SectionTitle>Fishing</SectionTitle>
            <div className="ps-stat-grid ps-grid-2">
                <StatCell label="Total Fish Caught" value={player.TotalCaught.toLocaleString()} />
                <StatCell label="Species Caught" value={`${player.UniqueCaught?.toLocaleString()}/100`} />
            </div>

            {/* Parkour */}
            <SectionTitle>Parkour</SectionTitle>
            <div className="ps-stat-grid ps-grid-1">
                <StatCell label="Best Time" value={player.TotalTime ? formatTime(player.TotalTime) : "N/A"} />
            </div>

        </div>
    );
}

export default PlayerStats;
