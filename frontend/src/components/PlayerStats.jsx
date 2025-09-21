import './PlayerStats.css'

function PlayerStats({ player }) {
    const headUrl = `https://minotar.net/helm/${player.UUID}/128.png`;

    const RanksMap = new Map([
        [0, "DEFAULT"],
        [6, "VIP"],
        [8, "CAPTAIN"],
        [3, "TRAINEE"],
        [4, "MODERATOR"],
        [16, "SR_MODERATOR"],
        [1, "ADMIN"],
        [5, "DEVELOPER"],
        [7, "SUPERVISOR"],
        [2, "OWNER"],
        [9, "QA"],
        [10, "MEDIA"],
        [11, "PARTNER"],
        [12, "STAFF_MANAGER"],
        [13, "DIRECTOR"],
        [14, "BUILDER"],
        [17, "SUPREME"],
        [18, "HR"]
    ]);

    function getRankNameById(id) {
        return RanksMap.get(id) || "DEFAULT";
    }


    return (
        <div className="stats-card">
            <div className="profile">
                <img className="player-head" src={headUrl} alt="Head" />
            </div>

            <div className="username-banner">{player.LastPlayerName}</div>
            <div className="rank-banner">{getRankNameById(player.RoleID)}</div>

            <div className="top-stats">
                <div className="stat-box yellow">
                    Tokens<br />
                    <span>{player.Tokens}</span>
                </div>
                <div className="stat-box green">
                    EXP<br />
                    <span>{player.Exp}/2500</span>
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{ width: `${(player.Exp / 2500) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="stat-box orange">
                    Level<br />
                    <span>{player.Level}</span>
                </div>
            </div>

            <div className="stat-box green">
                Matches Played<br />
                <span>{player.Wins + player.Losses}</span>
            </div>
            
            <div className="stats">
                <div className="stat-box green">
                    Current Winstreak<br />
                    <span>{player.Winstreak}</span>
                </div>
                <div className="stat-box red">
                    Best Winstreak<br />
                    <span>{player.BestWinstreak}</span>
                </div>
                <div className="stat-box orange">
                    Match MVPs<br />
                    <span>{player.MatchMvps}</span>
                </div>
            </div>

            <div className="stats">
                <div className="stat-box green">
                    Wins<br />
                    <span>{player.Wins}</span>
                </div>
                <div className="stat-box red">
                    Losses<br />
                    <span>{player.Losses}</span>
                </div>
                <div className="stat-box orange">
                    WLR<br />
                    <span>{player.Losses > 0 ? (player.Wins / player.Losses).toFixed(3) : player.Wins}</span>
                </div>
                <div className="stat-box green">
                    Kills<br />
                    <span>{player.Kills}</span>
                </div>
                <div className="stat-box red">
                    Deaths<br />
                    <span>{player.Deaths}</span>
                </div>
                <div className="stat-box orange">
                    KDR<br />
                    <span>{player.Deaths > 0 ? (player.Kills / player.Deaths).toFixed(3) : player.Kills}</span>
                </div>
            </div>

            <div className="stat-box yellow">
                Lifetime Caught<br />
                <span>{player.TotalCaught}</span>
            </div>
        </div>
    );
}

export default PlayerStats;