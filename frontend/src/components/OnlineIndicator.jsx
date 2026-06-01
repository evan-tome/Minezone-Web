import { useState, useEffect } from 'react';
import './OnlineIndicator.css';
import { fetchServerStatus } from '../api/server.js';
import { RANKS } from '../utils/ranks.js';

const OnlineIndicator = () => {
    const [status, setStatus] = useState(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const load = () => fetchServerStatus()
            .then(data => setStatus(data))
            .catch(() => setStatus(null));

        load();
        const id = setInterval(load, 30_000);
        return () => clearInterval(id);
    }, []);

    if (!status) return null;

    const players = status.players || [];

    return (
        <div
            className="online-indicator"
            tabIndex={0}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
            <span className={`online-dot ${status.offline ? 'offline' : ''}`} />
            <span className="online-count">
                {status.offline ? 'Offline' : `${status.online} online`}
            </span>

            {hovered && !status.offline && players.length > 0 && (
                <div className="online-tooltip">
                    <div className="online-tooltip-header">Online Players</div>
                    <ul className="online-tooltip-list">
                        {players.map((p) => {
                            const rank = p.roleId !== 0 ? RANKS.get(p.roleId) : undefined;
                            return (
                                <li key={p.name} className="online-tooltip-player">
                                    {rank && (
                                        <span
                                            className="player-rank-tag"
                                            style={{ color: rank.color, borderColor: rank.color }}
                                        >
                                            {rank.label}
                                        </span>
                                    )}
                                    <span className="player-name">{p.name}</span>
                                    <span className="player-level">Lv. {p.level}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default OnlineIndicator;
