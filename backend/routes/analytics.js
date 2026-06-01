const express = require('express');
const router = express.Router();
const con = require('../db');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function makeCache(query) {
    let cached = null;
    let lastFetch = 0;
    let pending = null;

    return function get(res) {
        const now = Date.now();
        if (cached && now - lastFetch < CACHE_TTL) {
            return res.json(cached);
        }
        if (pending) {
            return pending.then(data => res.json(data)).catch(() => res.status(500).json({ error: 'Database error' }));
        }
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
        pending.then(data => res.json(data)).catch(() => res.status(500).json({ error: 'Database error' }));
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
    LIMIT 15
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

router.get('/overview',             (req, res) => getOverview(res));
router.get('/distribution/levels',  (req, res) => getLevelDistribution(res));
router.get('/top-classes',          (req, res) => getTopClasses(res));
router.get('/winrates',             (req, res) => getWinRates(res));
router.get('/all-class-stats',      (req, res) => getAllClassStats(res));

module.exports = router;
