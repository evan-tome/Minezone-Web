const con = require('./db');

const CATEGORY_MAP = {
    Wins: "Wins",
    FlawlessWins: "FlawlessWins",
    Kills: "Kills",
    BestWinstreak: "BestWinstreak",
    TotalCaught: "TotalCaught",
    Level: "Level"
};

const CACHE_TTL = 1 * 60 * 1000;
const leaderboardCache = {};
const lastFetch = {};
const pending = {};

function getLeaderboard(category) {
    const now = Date.now();
    if (leaderboardCache[category] && (now - lastFetch[category] < CACHE_TTL)) {
        return Promise.resolve(leaderboardCache[category]);
    }

    if (pending[category]) {
        return pending[category];
    }

    const column = CATEGORY_MAP[category];

    pending[category] = new Promise((resolve, reject) => {
        const sql = `
            SELECT UUID, LastPlayerName, Wins, FlawlessWins, Kills, BestWinstreak, TotalCaught, Level
            FROM PlayerData
            WHERE ${column} > 0
            ORDER BY ${column} DESC
            LIMIT 25
        `;

        con.query(sql, (err, result) => {
            pending[category] = null;

            if (err) return reject(err);

            leaderboardCache[category] = result;
            lastFetch[category] = Date.now();

            resolve(result);
        });
    });

    return pending[category];
}

module.exports = { CATEGORY_MAP, getLeaderboard };
