const express = require('express');
const router = express.Router();
const con = require('../db');
const { getPlayerProfile } = require('../cache');
const db = con.promise();

router.get('/', (req, res) => {
    const limit = Math.min(Number.parseInt(req.query.limit) || 10, 5000);
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

// Fetches the 20 most recent multiplayer games. The inner subquery filters to games
// with more than one player, then the outer join pulls all their rows at once so we
// can group them into game objects in JS without a second query.
router.get('/recent-matches', (req, res) => {
    const sql = `
        SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
               gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.firstblood, gp.winner,
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

        // Group the flat SQL rows (one per player) into game objects with a players array.
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
                first_blood: row.firstblood === 1 || row.firstblood === true,
                winner: row.winner === 1 || row.winner === true,
                level: row.Level,
                role_id: row.RoleID,
            });
        }

        res.setHeader('Cache-Control', 'public, max-age=30');
        res.json({ matches: Array.from(gamesMap.values()) });
    });
});

router.get('/match/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid match ID' });

    const sql = `
        SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
               gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.firstblood, gp.winner,
               pd.LastPlayerName, pd.UUID, pd.Level, pd.RoleID
        FROM scb_games g
        JOIN scb_game_players gp ON g.game_id = gp.game_id
        JOIN PlayerData pd ON gp.uuid = pd.UUID
        WHERE g.game_id = ?
        ORDER BY gp.placement ASC
    `;
    con.query(sql, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ error: 'Match not found' });

        const first = rows[0];
        const match = {
            game_id: first.game_id,
            game_type: first.game_type,
            map_name: first.map_name,
            end_time: first.end_time,
            game_duration_minutes: first.game_duration_minutes,
            players: rows.map(row => ({
                uuid: row.UUID,
                username: row.LastPlayerName,
                class_id: row.class_id,
                placement: row.placement,
                kills: row.kills,
                deaths: row.deaths,
                lives: row.lives,
                first_blood: row.firstblood === 1 || row.firstblood === true,
                winner: row.winner === 1 || row.winner === true,
                level: row.Level,
                role_id: row.RoleID,
            })),
        };

        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(match);
    });
});

router.get('/:username/profile', async (req, res) => {
    const { username } = req.params;
    try {
        const data = await getPlayerProfile(username, async () => {
            const playerSql = `
                SELECT
                    pd.UUID, pd.LastPlayerName, pd.RoleID, pd.Tokens, pd.Wins, pd.Kills,
                    pd.Deaths, pd.FlawlessWins, pd.Losses, pd.Winstreak, pd.BestWinstreak,
                    pd.Exp, pd.Level, pd.MatchMvps, pd.TotalCaught,
                    COUNT(DISTINCT pf.UUID) AS UniqueCaught,
                    (SELECT pc.ClassID FROM PlayerClasses pc WHERE pc.UUID = pd.UUID ORDER BY pc.GamesPlayed DESC LIMIT 1) AS FavClassID
                FROM PlayerData pd
                LEFT JOIN PlayerFishing pf ON pd.UUID = pf.UUID
                WHERE pd.LastPlayerName = ?
                GROUP BY pd.UUID
            `;
            const [playerRows] = await db.query(playerSql, [username]);
            if (!playerRows.length) {
                const err = new Error('Player not found');
                err.status = 404;
                throw err;
            }
            const { FavClassID, ...player } = playerRows[0];
            const { UUID } = player;

            // Use UUID directly, no PlayerData JOIN needed
            const [[parkourRows], [gameRows]] = await Promise.all([
                db.query(
                    `SELECT pp.ParkourID, pp.TotalTime
                     FROM PlayerParkour pp
                     WHERE pp.UUID = ?
                     ORDER BY pp.TotalTime ASC`,
                    [UUID]
                ),
                db.query(
                    `SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
                            gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.firstblood, gp.winner
                     FROM scb_game_players gp
                     JOIN scb_games g ON gp.game_id = g.game_id
                     WHERE gp.uuid = ?
                     ORDER BY g.game_id DESC
                     LIMIT 3`,
                    [UUID]
                ),
            ]);

            return {
                player,
                favclass: { ClassID: FavClassID ?? null },
                parkour: parkourRows,
                games: gameRows,
            };
        });
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json(data);
    } catch (err) {
        if (err.status === 404) return res.status(404).json({ error: 'Player not found' });
        res.status(500).json({ error: 'Database error' });
    }
});

const ML_URL = process.env.ML_URL || 'http://localhost:8000';

async function proxyML(path, res, options) {
    try {
        const r = await fetch(`${ML_URL}${path}`, options);
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch {
        res.status(503).json({ error: 'ML service unavailable' });
    }
}

router.get('/class-stats', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ClassID      AS class_id,
                   SUM(GamesPlayed) AS games,
                   SUM(GamesWon)    AS wins
            FROM PlayerClasses
            GROUP BY ClassID
            ORDER BY games DESC
        `);
        res.json(rows.map(r => ({
            class_id: r.class_id,
            games:    Number(r.games),
            wins:     Number(r.wins),
        })));
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/cluster-map', (req, res) => proxyML('/cluster-map', res));

router.get('/:username/cluster', (req, res) =>
    proxyML(`/cluster/${encodeURIComponent(req.params.username)}`, res)
);

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
        SELECT
            (SELECT pc1.ClassID FROM PlayerClasses pc1
             JOIN PlayerData pd1 ON pc1.UUID = pd1.UUID
             WHERE pd1.LastPlayerName = ?
             ORDER BY pc1.GamesPlayed DESC LIMIT 1) AS FavClassID,
            (SELECT pc2.ClassID FROM PlayerClasses pc2
             JOIN PlayerData pd2 ON pc2.UUID = pd2.UUID
             WHERE pd2.LastPlayerName = ?
             ORDER BY pc2.GamesWon DESC LIMIT 1) AS BestClassID
    `;
    con.query(sql, [username, username], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({
            ClassID: result[0]?.FavClassID ?? null,
            BestClassID: result[0]?.BestClassID ?? null,
        });
    });
});

router.get('/:username/games', (req, res) => {
    const { username } = req.params;

    const sql = `
        SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
               gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.firstblood, gp.winner
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

router.get('/:username/recommend', (req, res) =>
    proxyML(`/recommend/${encodeURIComponent(req.params.username)}`, res)
);

router.get('/:username/archetype', (req, res) =>
    proxyML(`/archetype/${encodeURIComponent(req.params.username)}`, res)
);

router.get('/:username/predict-win', (req, res) =>
    proxyML(`/predict-win/${encodeURIComponent(req.params.username)}`, res)
);


router.get('/:username/trend', async (req, res) => {
    const { username } = req.params;
    const classId = req.query.class_id ? parseInt(req.query.class_id) : null;
    try {
        const [players] = await db.query(
            'SELECT UUID, LastPlayerName FROM PlayerData WHERE LastPlayerName = ? LIMIT 1',
            [username]
        );
        if (!players.length) return res.status(404).json({ error: 'Player not found' });
        const player = players[0];
        const sql = classId
            ? `SELECT game_id, IF(placement = 1, 1, 0) AS won, kills, class_id
               FROM scb_game_players WHERE uuid = ? AND class_id = ?
               ORDER BY game_id DESC LIMIT 100`
            : `SELECT game_id, IF(placement = 1, 1, 0) AS won, kills, class_id
               FROM scb_game_players WHERE uuid = ?
               ORDER BY game_id DESC LIMIT 100`;
        const [games] = await db.query(sql, classId ? [player.UUID, classId] : [player.UUID]);

        // Only fetch per-class game counts when no class filter is active; the chart doesn't need them otherwise.
        let classCounts = null;
        if (!classId) {
            const [countRows] = await db.query(
                `SELECT class_id, LEAST(COUNT(*), 100) AS count
                 FROM scb_game_players
                 WHERE uuid = ? AND class_id IS NOT NULL
                 GROUP BY class_id`,
                [player.UUID]
            );
            classCounts = Object.fromEntries(countRows.map(r => [r.class_id, r.count]));
        }

        res.json({ username: player.LastPlayerName, games: games.reverse(), ...(classCounts && { class_counts: classCounts }) });
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/predict-game', (req, res) =>
    proxyML('/predict-game', res, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
    })
);

module.exports = router;
