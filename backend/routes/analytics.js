const express = require('express');
const router = express.Router();
const con = require('../db');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
        MAX(BestWinstreak)     AS topWinstreak
    FROM PlayerData
`);

const getLevelDistribution = makeCache(`
    SELECT
        FLOOR(Level / 5) * 5 AS bucket,
        COUNT(*)              AS count
    FROM PlayerData
    GROUP BY bucket
    ORDER BY bucket ASC
`);

const getTopClasses = makeCache(`
    SELECT
        ClassID,
        SUM(GamesPlayed) AS totalPlayed,
        SUM(GamesWon)    AS totalWon
    FROM PlayerClasses
    GROUP BY ClassID
    ORDER BY totalPlayed DESC
    LIMIT 20
`);

const getBottomClasses = makeCache(`
    SELECT
        ClassID,
        SUM(GamesPlayed) AS totalPlayed,
        SUM(GamesWon)    AS totalWon
    FROM PlayerClasses
    GROUP BY ClassID
    HAVING totalPlayed > 0
    ORDER BY totalWon ASC
    LIMIT 20
`);

const getAllClassStats = makeCache(`
    SELECT
        ClassID,
        SUM(GamesPlayed) AS totalPlayed,
        SUM(GamesWon)    AS totalWon
    FROM PlayerClasses
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

const getMapPopularity = makeCache(`
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

const getPeakHours = makeCache(`
    SELECT
        HOUR(end_time) AS hour,
        COUNT(*)       AS games
    FROM scb_games
    GROUP BY hour
    ORDER BY hour ASC
`);

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
router.get('/top-classes',          (req, res) => send(getTopClasses, req, res));
router.get('/bottom-classes',       (req, res) => send(getBottomClasses, req, res));
router.get('/winrates',             (req, res) => send(getWinRates, req, res));
router.get('/all-class-stats',      (req, res) => send(getAllClassStats, req, res));
router.get('/kd-ratios',            (req, res) => send(getKDRatios, req, res));
router.get('/maps',                 (req, res) => send(getMapPopularity, req, res));
router.get('/over-time',            (req, res) => send(getGamesOverTime, req, res));
router.get('/peak-hours',           (req, res) => send(getPeakHours, req, res));

module.exports = router;
