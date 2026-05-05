import { FaExclamationCircle } from "react-icons/fa";
import "./Leaderboard.css";

function Leaderboard({ players, categoryKey, categoryLabel, error }) {
  return (
    <div className="leaderboard">
      <h2>{categoryLabel}</h2>

      {error ? (
        <div className="lb-error">
          <FaExclamationCircle className="lb-error-icon" />
          <p>{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="lb-empty">Loading...</div>
      ) : (
        <div className="leaderboard-list">
          {players.map((player, index) => (
            <div className="leaderboard-row" key={player.UUID}>
              <div className="player-info">
                <div className={`rank rank-${index + 1 <= 3 ? index + 1 : ""}`}>
                  {index + 1}
                </div>
                <img
                  src={`https://minotar.net/helm/${player.UUID}/128.png`}
                  alt={player.LastPlayerName}
                  className="player-head"
                />
                <a href={`/stats/${player.LastPlayerName}`} className="player-name">
                  {player.LastPlayerName}
                </a>
              </div>
              <div className="player-score">
                {Number(player[categoryKey] ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
