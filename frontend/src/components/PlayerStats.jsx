import './PlayerStats.css'

function PlayerStats({ player }) {
    return (
        <div className="player-stats">
            <h2>{player.LastPlayerName}'s Stats</h2>
            <ul>
                <li>Wins: {player.Wins}</li>
                <li>Losses: {player.Losses}</li>
            </ul>
        </div>
    );
}

export default PlayerStats;