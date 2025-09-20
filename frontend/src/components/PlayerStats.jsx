import './PlayerStats.css'

function PlayerStats({ player }) {
    const headUrl = `https://minotar.net/helm/${player.UUID}/128.png`;

    return (
        <div className="stats-card">
            <div className="profile">
                <img className="player-head" src={headUrl} alt="Head"/>
                <div className="username">{player.LastPlayerName}</div>
            </div>

            <div className="title">
                <div className="yellow">Level: {player.Level}</div>
                <div className="yellow">Progress: {player.Exp}/2500</div>
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${(player.Exp / 2500) * 100}%` }}></div>
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


            {/* <div className="overall-stats">
                <h3>Overall</h3>
                <ul>
                    <li>Level: {player.Level}</li>
                    <li>Tokens: {player.Tokens}</li>
                </ul>
            </div>
            <div className="scb-stats">
                <h3>SCB</h3>
                <ul>
                    <li>Matches Played: {player.Wins + player.Losses}</li>
                    <li>Wins: {player.Wins}</li>
                    <li>Losses: {player.Losses}</li>
                    <li>Winrate: {(player.Wins / player.Losses).toFixed(3)}</li>
                    <li>Flawless Wins: {player.FlawlessWins}</li>
                    <li>Kills: {player.Kills}</li>
                    <li>Deaths: {player.Deaths}</li>
                    <li>KDR: {(player.Kills / player.Deaths).toFixed(3)}</li>
                    <li>Winstreak: {player.Winstreak}</li>
                    <li>Best Winstreak: {player.BestWinstreak}</li>
                    <li>Match MVPs: {player.MatchMvps}</li>
                </ul>
            </div>
            <div className="fishing-stats">
                <h3>Fishing</h3>
                <ul>
                    <li>Lifetime Caught: {player.TotalCaught}</li>
                </ul>
            </div> */}
        </div>
    );
}

export default PlayerStats;