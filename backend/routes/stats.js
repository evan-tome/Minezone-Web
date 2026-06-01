const express = require('express');
const router = express.Router();
const con = require('../db');

router.get('/', (req, res) => {
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = Number.parseInt(req.query.offset) || 0;

    const sql = `
        SELECT
            pd.UUID,
            pd.LastPlayerName,
            pd.RoleID,
            pd.Tokens,
            pd.Wins,
            pd.Kills,
            pd.Deaths,
            pd.FlawlessWins,
            pd.Losses,
            pd.Winstreak,
            pd.BestWinstreak,
            pd.Exp,
            pd.Level,
            pd.MatchMvps,
            pd.TotalCaught,
            COUNT(pf.UUID) AS UniqueCaught
        FROM PlayerData pd
        LEFT JOIN PlayerFishing pf ON pd.UUID = pf.UUID
        GROUP BY pd.UUID
        ORDER BY pd.Level DESC
        LIMIT ? OFFSET ?
    `;
    con.query(sql, [limit, offset], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(result);
    });
});

router.get('/recent-matches', (req, res) => {
    const sql = `
        SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
               gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.winner,
               pd.LastPlayerName, pd.UUID, pd.Level, pd.RoleID
        FROM scb_games g
        JOIN scb_game_players gp ON g.game_id = gp.game_id
        JOIN PlayerData pd ON gp.uuid = pd.UUID
        WHERE g.game_id IN (
            SELECT game_id FROM (
                SELECT g2.game_id FROM scb_games g2
                JOIN scb_game_players gp2 ON g2.game_id = gp2.game_id
                GROUP BY g2.game_id
                HAVING COUNT(gp2.uuid) > 1
                ORDER BY g2.game_id DESC
                LIMIT 20
            ) AS recent
        )
        ORDER BY g.game_id DESC, gp.placement ASC
    `;
    con.query(sql, (err, rows) => {
        if (err) {
            console.error('recent-matches query failed:', err.message);
            return res.status(500).json({ error: err.message });
        }

        const gamesMap = new Map();
        for (const row of rows) {
            if (!gamesMap.has(row.game_id)) {
                gamesMap.set(row.game_id, {
                    game_id: row.game_id,
                    game_type: row.game_type,
                    map_name: row.map_name,
                    end_time: row.end_time,
                    game_duration_minutes: row.game_duration_minutes,
                    players: [],
                });
            }
            gamesMap.get(row.game_id).players.push({
                uuid: row.UUID,
                username: row.LastPlayerName,
                class_id: row.class_id,
                placement: row.placement,
                kills: row.kills,
                deaths: row.deaths,
                lives: row.lives,
                winner: row.winner === 1 || row.winner === true,
                level: row.Level,
                role_id: row.RoleID,
            });
        }

        res.json({ matches: Array.from(gamesMap.values()) });
    });
});

router.get('/:username', (req, res) => {
    const { username } = req.params;

    const sql = `
        SELECT
            pd.UUID,
            pd.LastPlayerName,
            pd.RoleID,
            pd.Tokens,
            pd.Wins,
            pd.Kills,
            pd.Deaths,
            pd.FlawlessWins,
            pd.Losses,
            pd.Winstreak,
            pd.BestWinstreak,
            pd.Exp,
            pd.Level,
            pd.MatchMvps,
            pd.TotalCaught,
            COUNT(pf.UUID) AS UniqueCaught
        FROM PlayerData pd
        LEFT JOIN PlayerFishing pf ON pd.UUID = pf.UUID
        WHERE pd.LastPlayerName = ?
        GROUP BY pd.UUID
    `;
    con.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(404).json({ error: "Player not found" });
        res.json(result[0]);
    });
});

router.get('/:username/fishing', (req, res) => {
    const { username } = req.params;

    const sql = `
        SELECT pf.FishID, pf.TimesCaught
        FROM PlayerFishing pf
        JOIN PlayerData pd ON pf.UUID = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY pf.FishID ASC
    `;
    con.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ username, fishing: result });
    });
});

router.get('/:username/parkour', (req, res) => {
    const { username } = req.params;

    const sql = `
        SELECT pp.ParkourID, pp.TotalTime
        FROM PlayerParkour pp
        JOIN PlayerData pd ON pp.UUID = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY pp.TotalTime ASC
    `;
    con.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ username, parkour: result });
    });
});

router.get('/:username/favclass', (req, res) => {
    const { username } = req.params;

    const sql = `
        SELECT pc.ClassID
        FROM PlayerClasses pc
        JOIN PlayerData pd ON pc.UUID = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY pc.GamesPlayed DESC
        LIMIT 1
    `;
    con.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ ClassID: result[0]?.ClassID ?? null });
    });
});

router.get('/:username/games', (req, res) => {
    const { username } = req.params;

    const sql = `
        SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
               gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.winner
        FROM scb_game_players gp
        JOIN scb_games g ON gp.game_id = g.game_id
        JOIN PlayerData pd ON gp.uuid = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY g.game_id DESC
        LIMIT 3
    `;
    con.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ games: result });
    });
});

const ML_URL = process.env.ML_URL || 'http://localhost:8000';

router.get('/:username/recommend', async (req, res) => {
    const { username } = req.params;
    try {
        const r = await fetch(`${ML_URL}/recommend/${encodeURIComponent(username)}`);
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch {
        res.status(503).json({ error: 'ML service unavailable' });
    }
});

router.get('/:username/archetype', async (req, res) => {
    const { username } = req.params;
    try {
        const r = await fetch(`${ML_URL}/archetype/${encodeURIComponent(username)}`);
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch {
        res.status(503).json({ error: 'ML service unavailable' });
    }
});

module.exports = router;
