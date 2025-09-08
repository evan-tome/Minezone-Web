import './Leaderboard.css'

function Leaderboard({ players, category }) {
    return (
    <div className="leaderboard">
        <h2>Top 10 {category}</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>{category}</th>
                </tr>
            </thead>
            <tbody>
                {players.map((player, index) => (
                    <tr key={player.UUID}>
                        <td>{index + 1}</td>
                        <td>
                            <img src={`https://crafatar.com/avatars/${player.UUID}?size=32&overlay`}
                            alt={`${player.LastPlayerName}'s head`}
                            className="player-head-small" />
                            {player.LastPlayerName}
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