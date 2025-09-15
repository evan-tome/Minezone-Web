import './PlayerStats.css'

function PlayerStats({ player }) {
    const headUrl = `https://minotar.net/helm/${player.UUID}/128.png`;

    return (
        <div className="player-stats">
            <div className="stats-header">
                <img className="player-head" src={headUrl} alt="Head"/>
                <h2>{player.LastPlayerName}'s Stats</h2>
            </div>
            <div className="overall-stats">
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
            </div>
        </div>
    );
}

export default PlayerStats;