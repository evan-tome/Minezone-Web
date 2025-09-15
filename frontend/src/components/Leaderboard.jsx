import './Leaderboard.css'

function Leaderboard({ players, category }) {
    return (
    <div className="leaderboard">
        <h2>Most {category}</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>{category}</th>
                </tr>
            </thead>
            <tbody>
                {players.map((player, index) => (
                    <tr key={player.UUID}>
                        <td>{index + 1}</td>
                        <td>
                            <img src={`https://minotar.net/helm/${player.UUID}/128.png`}
                            alt={`${player.LastPlayerName}'s head`}
                            className="player-head-small" />
                            <a href={`/stats/${player.LastPlayerName}`}>{player.LastPlayerName}</a>
                        </td>
                        <td>{player[category]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
    );
}

export default Leaderboard;