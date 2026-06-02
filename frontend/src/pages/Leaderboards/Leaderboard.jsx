import { useState, useEffect, useRef } from "react";
import ErrorScreen from "../../components/ErrorScreen";
import { FaChevronDown } from "react-icons/fa";
import { RANKS } from "../../utils/ranks.js";
import "./Leaderboard.css";

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Leaderboard({ players, categoryKey, onCategoryChange, categories, loading, error }) {
    const [focusedRow, setFocusedRow] = useState(0);
    const tableRef = useRef(null);
    const catIdx = categories.findIndex(c => c.key === categoryKey);

    useEffect(() => {
        const onKey = (e) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();

            if (e.key === 'ArrowUp') {
                setFocusedRow(r => Math.max(0, r - 1));
            } else if (e.key === 'ArrowDown') {
                setFocusedRow(r => Math.min(players.length - 1, r + 1));
            } else if (e.key === 'ArrowLeft') {
                const nextIdx = Math.max(0, catIdx - 1);
                if (nextIdx !== catIdx) { onCategoryChange(categories[nextIdx].key); setFocusedRow(0); }
            } else if (e.key === 'ArrowRight') {
                const nextIdx = Math.min(categories.length - 1, catIdx + 1);
                if (nextIdx !== catIdx) { onCategoryChange(categories[nextIdx].key); setFocusedRow(0); }
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [catIdx, categories, onCategoryChange, players.length]);

    useEffect(() => {
        tableRef.current?.querySelector(`[data-row="${focusedRow}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [focusedRow]);

    if (error) return <ErrorScreen title="Leaderboard error" message={error} />;
    if (loading) return <div className="lb-empty">Loading...</div>;
    if (players.length === 0) return <div className="lb-empty">No data yet.</div>;

    return (
        <div className="leaderboard">
            <div className="lb-table-wrap" ref={tableRef}>
                <table className="lb-table">
                    <thead>
                        <tr>
                            <th className="lb-th-rank" scope="col">#</th>
                            <th className="lb-th-player" scope="col">Player</th>
                            {categories.map(col => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`lb-th-sortable${col.key === categoryKey ? ' lb-col-active' : ''}`}
                                    onClick={() => { onCategoryChange(col.key); setFocusedRow(0); }}
                                >
                                    <span className="lb-th-inner">
                                        {col.label}
                                        <FaChevronDown className={`lb-sort-icon${col.key !== categoryKey ? ' lb-sort-dim' : ''}`} />
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, index) => (
                            <tr
                                key={player.UUID}
                                data-row={index}
                                className={`lb-row${index === focusedRow ? ' lb-row-focused' : ''}`}
                                onClick={() => setFocusedRow(index)}
                            >
                                <td>
                                    <div className={`rank${index < 3 ? ` rank-${index + 1}` : ''}`}>
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
                                        <span className="lb-name-wrap">
                                            {(() => {
                                                const rank = RANKS.get(player.RoleID);
                                                if (!rank || rank.label === 'Default') return null;
                                                return (
                                                    <span className="lb-rank-tag" style={{ color: rank.color, borderColor: rank.color, background: hexToRgba(rank.color, 0.1) }}>
                                                        {rank.label}
                                                    </span>
                                                );
                                            })()}
                                            <a href={`/stats/${player.LastPlayerName}`} className="player-name">
                                                {player.LastPlayerName}
                                            </a>
                                        </span>
                                    </div>
                                </td>
                                {categories.map(col => (
                                    <td key={col.key} className={col.key === categoryKey ? 'lb-col-active' : ''}>
                                        {Number(player[col.key] ?? 0).toLocaleString()}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Leaderboard;
