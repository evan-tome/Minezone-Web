import { FaExclamationCircle } from "react-icons/fa";
import "./Leaderboard.css";

const COLUMNS = [
    { key: 'Wins',          label: 'Wins' },
    { key: 'FlawlessWins',  label: 'Flawless' },
    { key: 'Kills',         label: 'Kills' },
    { key: 'BestWinstreak', label: 'Best Winstreak' },
    { key: 'TotalCaught',   label: 'Fish Caught' },
    { key: 'Level',         label: 'Level' },
];

function Leaderboard({ players, categoryKey, error }) {
  return (
    <div className="leaderboard">
      {error ? (
        <div className="lb-error">
          <FaExclamationCircle className="lb-error-icon" />
          <p>{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="lb-empty">Loading...</div>
      ) : (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th className="lb-th-rank">#</th>
                <th className="lb-th-player">Player</th>
                {COLUMNS.map(col => (
                  <th key={col.key} className={col.key === categoryKey ? 'lb-col-active' : ''}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.UUID} className="lb-row">
                  <td>
                    <div className={`rank rank-${index + 1 <= 3 ? index + 1 : ''}`}>
                      {index + 1}
                    </div>
                  </td>
                  <td>
                    <div className="player-info">
                      <img
                        src={`https://minotar.net/helm/${player.UUID}/128.png`}
                        alt={player.LastPlayerName}
                        className="player-head"
                      />
                      <a href={`/stats/${player.LastPlayerName}`} className="player-name">
                        {player.LastPlayerName}
                      </a>
                    </div>
                  </td>
                  {COLUMNS.map(col => (
                    <td key={col.key} className={col.key === categoryKey ? 'lb-col-active' : ''}>
                      {Number(player[col.key] ?? 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
