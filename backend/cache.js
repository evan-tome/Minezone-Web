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
            SELECT UUID, LastPlayerName, RoleID, Wins, FlawlessWins, Kills, BestWinstreak, TotalCaught, Level
            FROM PlayerData
            WHERE ${column} > 0
            ORDER BY ${column} DESC
            LIMIT 100
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

const PLAYER_TTL = 60 * 1000;
const playerCache = {};
const playerFetch = {};
const playerPending = {};

function getPlayerProfile(username, fetcher) {
    const key = username.toLowerCase();
    const now = Date.now();
    if (playerCache[key] && (now - playerFetch[key] < PLAYER_TTL)) {
        return Promise.resolve(playerCache[key]);
    }
    if (playerPending[key]) return playerPending[key];

    playerPending[key] = fetcher()
        .then(data => {
            playerCache[key] = data;
            playerFetch[key] = Date.now();
            playerPending[key] = null;
            return data;
        })
        .catch(err => {
            playerPending[key] = null;
            throw err;
        });

    return playerPending[key];
}

module.exports = { CATEGORY_MAP, getLeaderboard, getPlayerProfile };
