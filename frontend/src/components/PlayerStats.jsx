import './PlayerStats.css'

const RANKS = new Map([
    [0, { label: "Default", color: "#aaa" }],
    [6, { label: "VIP", color: "#fff460" }],
    [8, { label: "Pro", color: "#508bfa" }],
    [17, { label: "Supreme", color: "#ff5555" }],
    [3, { label: "Trainee", color: "#157c15" }],
    [4, { label: "Moderator", color: "#ffbb00" }],
    [16, { label: "Sr. Moderator", color: "#55ff55" }],
    [12, { label: "Staff Manager", color: "#ff5555" }],
    [7, { label: "Supervisor", color: "#2ba198" }],
    [13, { label: "Director", color: "#ff5555" }],
    [14, { label: "Builder", color: "#ffbb00" }],
    [9, { label: "QA", color: "#55ff55" }],
    [10, { label: "Media", color: "#55ffff" }],
    [11, { label: "Partner", color: "#55ffff" }],
    [5, { label: "Developer", color: "#ffbb00" }],
    [18, { label: "HR", color: "#cf55ff" }],
    [1, { label: "Admin", color: "#ff5555" }],
    [2, { label: "Owner", color: "#ff5555" }],
]);

function getRank(id) {
    return RANKS.get(id) || { label: "Default", color: "#aaa" };
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
    const flawless = player.FlawlessWins;

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
                <StatCell label="Flawless Wins" value={flawless.toLocaleString()} />
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

            {/* Fishing */}
            <SectionTitle>Fishing</SectionTitle>
            <div className="ps-stat-grid ps-grid-2">
                <StatCell label="Total Fish Caught" value={player.TotalCaught.toLocaleString()} />
                <StatCell label="Species Caught" value={`${player.TotalCaught.toLocaleString()}/100`} />
            </div>

            {/* Parkour */}
            <SectionTitle>Parkour</SectionTitle>
            <div className="ps-stat-grid ps-grid-1">
                <StatCell label="Best Time" value={player.TotalCaught.toLocaleString()} />
            </div>

        </div>
    );
}

export default PlayerStats;
