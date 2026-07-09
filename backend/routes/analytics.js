const express = require('express');
const router = express.Router();
const con = require('../db');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Wraps a static SQL query with a simple in-memory cache. The `pending` promise is shared
// so concurrent requests during a cache miss don't each fire their own DB query.
function makeCache(query) {
    let cached = null;
    let lastFetch = 0;
    let pending = null;

    return function get() {
        const now = Date.now();
        if (cached && now - lastFetch < CACHE_TTL) return Promise.resolve(cached);
        if (pending) return pending;

        pending = new Promise((resolve, reject) => {
            con.query(query, (err, result) => {
                pending = null;
                if (err) return reject(err);
                // Unwrap single-row results so callers don't have to index into an array.
                const data = Array.isArray(result) && result.length === 1 ? result[0] : result;
                cached = data;
                lastFetch = Date.now();
                resolve(data);
            });
        });

        return pending;
    };
}

const getOverview = makeCache(`
    SELECT
        COUNT(*)               AS totalPlayers,
        SUM(Wins + Losses)     AS totalGames,
        ROUND(AVG(Level), 1)   AS avgLevel,
        SUM(TotalCaught)       AS totalFishCaught,
        SUM(Kills)             AS totalKills,
        (SELECT SUM(game_duration_minutes) FROM scb_games) AS totalGameMinutes
    FROM PlayerData
`);

const getLevelDistribution = makeCache(`
    SELECT
        FLOOR(Level / 2) * 2 AS bucket,
        COUNT(*)              AS count
    FROM PlayerData
    GROUP BY bucket
    ORDER BY bucket ASC
`);

const VAULTED_IDS = '25, 37, 38, 42, 43, 65, 69, 101, 102, 103, 104, 105';

const getAllClassStats = makeCache(`
    SELECT
        ClassID,
        SUM(GamesPlayed) AS totalPlayed,
        SUM(GamesWon)    AS totalWon
    FROM PlayerClasses
    WHERE ClassID NOT IN (${VAULTED_IDS})
    GROUP BY ClassID
`);

const getWinRates = makeCache(`
    SELECT
        LastPlayerName,
        Wins,
        Losses,
        (Wins + Losses)                            AS TotalGames,
        ROUND(Wins / (Wins + Losses) * 100, 1)    AS WinRate
    FROM PlayerData
    WHERE (Wins + Losses) >= 20
    ORDER BY WinRate DESC
    LIMIT 15
`);

const getKDRatios = makeCache(`
    SELECT
        LastPlayerName,
        Kills,
        Deaths,
        ROUND(Kills / Deaths, 2) AS KDRatio
    FROM PlayerData
    WHERE Deaths > 0 AND (Wins + Losses) >= 20
    ORDER BY KDRatio DESC
    LIMIT 15
`);

const getMapPopularityClassic = makeCache(`
    SELECT
        g.map_name,
        COUNT(*) AS game_count
    FROM scb_games g
    INNER JOIN (
        SELECT game_id
        FROM scb_game_players
        GROUP BY game_id
        HAVING COUNT(*) > 1
    ) multi ON multi.game_id = g.game_id
    WHERE g.map_name IS NOT NULL AND g.map_name != ''
      AND LOWER(g.game_type) = 'classic'
    GROUP BY g.map_name
    ORDER BY game_count DESC
`);

const getMapPopularityDuel = makeCache(`
    SELECT
        g.map_name,
        COUNT(*) AS game_count
    FROM scb_games g
    INNER JOIN (
        SELECT game_id
        FROM scb_game_players
        GROUP BY game_id
        HAVING COUNT(*) > 1
    ) multi ON multi.game_id = g.game_id
    WHERE g.map_name IS NOT NULL AND g.map_name != ''
      AND LOWER(g.game_type) = 'duel'
    GROUP BY g.map_name
    ORDER BY game_count DESC
`);

const getGamesOverTime = makeCache(`
    SELECT
        DATE(end_time) AS date,
        COUNT(*)       AS games
    FROM scb_games
    WHERE end_time >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    GROUP BY date
    ORDER BY date ASC
`);

const getGamesOverTimeByType = makeCache(`
    SELECT
        DATE(end_time)   AS date,
        LOWER(game_type) AS game_type,
        COUNT(*)         AS games
    FROM scb_games
    WHERE end_time >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    GROUP BY date, game_type
    ORDER BY date ASC
`);

const getPlayersOverTime = makeCache(`
    SELECT
        DATE(g.end_time)        AS date,
        COUNT(DISTINCT gp.uuid) AS players
    FROM scb_games g
    JOIN scb_game_players gp ON g.game_id = gp.game_id
    WHERE g.end_time >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    GROUP BY date
    ORDER BY date ASC
`);

// Total plays per day: every player-slot across every game counts once, so a 4-player
// game contributes 4 (unlike players-over-time, which counts distinct players).
const getTotalPlaysOverTime = makeCache(`
    SELECT
        DATE(g.end_time) AS date,
        COUNT(*)         AS plays
    FROM scb_games g
    JOIN scb_game_players gp ON g.game_id = gp.game_id
    WHERE g.end_time >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    GROUP BY date
    ORDER BY date ASC
`);

// For every player, finds the date of their earliest recorded game (their "first game ever"),
// then counts how many of those first games fall within the last 60 days — i.e. new-player
// activity per day, not total games played.
const getNewPlayersOverTime = makeCache(`
    SELECT
        DATE(d.first_game) AS date,
        COUNT(*)           AS new_players
    FROM (
        SELECT gp.uuid, MIN(g.end_time) AS first_game
        FROM scb_game_players gp
        JOIN scb_games g ON gp.game_id = g.game_id
        GROUP BY gp.uuid
    ) d
    WHERE d.first_game >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    GROUP BY date
    ORDER BY date ASC
`);

const getPeakHours = makeCache(`
    SELECT
        HOUR(end_time) AS hour,
        COUNT(*)       AS games
    FROM scb_games
    GROUP BY hour
    ORDER BY hour ASC
`);

// Fetches every multiplayer game played on a given calendar day (server's local date on
// end_time), grouped into game objects the same shape as /stats/recent-matches so the
// frontend can reuse the same match card rendering. Optionally narrowed to one game type.
function getGamesByDay(date, gameType) {
    const typeFilter = gameType ? 'AND LOWER(g2.game_type) = ?' : '';
    const typeFilterOuter = gameType ? 'AND LOWER(g.game_type) = ?' : '';
    const sql = `
        SELECT g.game_id, g.game_type, g.map_name, g.end_time, g.game_duration_minutes,
               gp.class_id, gp.placement, gp.kills, gp.deaths, gp.lives, gp.firstblood, gp.winner,
               pd.LastPlayerName, pd.UUID, pd.Level, pd.RoleID
        FROM scb_games g
        JOIN scb_game_players gp ON g.game_id = gp.game_id
        JOIN PlayerData pd ON gp.uuid = pd.UUID
        WHERE DATE(g.end_time) = ? ${typeFilterOuter}
          AND g.game_id IN (
              SELECT game_id FROM (
                  SELECT g2.game_id FROM scb_games g2
                  JOIN scb_game_players gp2 ON g2.game_id = gp2.game_id
                  WHERE DATE(g2.end_time) = ? ${typeFilter}
                  GROUP BY g2.game_id
                  HAVING COUNT(gp2.uuid) > 1
              ) AS dayGames
          )
        ORDER BY g.end_time DESC, gp.placement ASC
    `;
    const params = gameType ? [date, gameType, date, gameType] : [date, date];
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, rows) => {
            if (err) return reject(err);

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

            resolve(Array.from(gamesMap.values()));
        });
    });
}

// Fetches the classes with the most wins on one map (optionally narrowed to one game
// type), for the "click a map to see its top classes" drill-down.
function getMapClasses(mapName, gameType) {
    const typeFilter = gameType ? 'AND LOWER(g.game_type) = ?' : '';
    const sql = `
        SELECT
            gp.class_id,
            COUNT(*)                                       AS played,
            SUM(CASE WHEN gp.winner = 1 THEN 1 ELSE 0 END) AS won
        FROM scb_games g
        JOIN scb_game_players gp ON g.game_id = gp.game_id
        WHERE g.map_name = ? ${typeFilter}
        GROUP BY gp.class_id
        ORDER BY won DESC
        LIMIT 10
    `;
    const params = gameType ? [mapName, gameType] : [mapName];
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// Runs a cached getter and sends the result as JSON, with a 5-minute browser cache hint.
function send(getter, req, res) {
    getter()
        .then(data => {
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.json(data);
        })
        .catch(() => res.status(500).json({ error: 'Database error' }));
}

router.get('/overview',             (req, res) => send(getOverview, req, res));
router.get('/distribution/levels',  (req, res) => send(getLevelDistribution, req, res));
router.get('/winrates',             (req, res) => send(getWinRates, req, res));
router.get('/all-class-stats',      (req, res) => send(getAllClassStats, req, res));
router.get('/kd-ratios',            (req, res) => send(getKDRatios, req, res));
router.get('/maps', (req, res) => {
    const gameType = req.query.gameType?.toLowerCase();
    const getter = gameType === 'duel' ? getMapPopularityDuel : getMapPopularityClassic;
    send(getter, req, res);
});
router.get('/over-time',            (req, res) => send(getGamesOverTime, req, res));
router.get('/over-time-by-type',    (req, res) => send(getGamesOverTimeByType, req, res));
router.get('/new-players-over-time', (req, res) => send(getNewPlayersOverTime, req, res));
router.get('/players-over-time',    (req, res) => send(getPlayersOverTime, req, res));
router.get('/total-plays-over-time', (req, res) => send(getTotalPlaysOverTime, req, res));
router.get('/peak-hours',           (req, res) => send(getPeakHours, req, res));
router.get('/games-by-day', (req, res) => {
    const date = req.query.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
        return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }
    const gameType = req.query.gameType?.toLowerCase() || null;
    getGamesByDay(date, gameType)
        .then(matches => res.json({ matches }))
        .catch(() => res.status(500).json({ error: 'Database error' }));
});
router.get('/map-classes', (req, res) => {
    const mapName = req.query.map;
    if (!mapName) return res.status(400).json({ error: 'map is required' });
    const gameType = req.query.gameType?.toLowerCase() || null;
    getMapClasses(mapName, gameType)
        .then(rows => res.json(rows))
        .catch(() => res.status(500).json({ error: 'Database error' }));
});

module.exports = router;
