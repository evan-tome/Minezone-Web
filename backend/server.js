const express = require('express');
const cors = require('cors');
require('dotenv').config();
let mysql = require('mysql');

const app = express();
app.use(cors({origin: "http://localhost:5173"}));
app.use(express.json());
const PORT = 8080;

let con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const CATEGORY_MAP = {
    Wins: "Wins",
    FlawlessWins: "FlawlessWins",
    Kills: "Kills",
    BestWinstreak: "BestWinstreak",
    TotalCaught: "TotalCaught",
    Level: "Level"
};

const CACHE_TTL = 1 * 60 * 1000; // refresh every minute
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

con.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL!");
});

app.get('/', (req, res) => {
    res.send('Hello')
})

app.get('/stats', (req, res) => {
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = Number.parseInt(req.query.offset) || 0;

    const sql = "SELECT " +
            "UUID, LastPlayerName, RoleID, Tokens, Wins, Kills, Deaths, FlawlessWins, Losses, Winstreak, BestWinstreak, Exp, Level, MatchMvps, TotalCaught" +
            " FROM PlayerData ORDER BY Level DESC LIMIT ? OFFSET ?";
    con.query(sql, [limit, offset], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        res.json(result);
    });
})

app.get('/stats/:username', (req, res) => {
    const username = req.params.username;

    const sql = "SELECT " +
        "UUID, LastPlayerName, RoleID, Tokens, Wins, Kills, Deaths, FlawlessWins, Losses, Winstreak, BestWinstreak, Exp, Level, MatchMvps, TotalCaught" +
        " FROM PlayerData WHERE LastPlayerName = ?";
    con.query(sql, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Player not found" });
        }
        res.json(result[0]);
    });
})

app.get('/leaderboard', (req, res) => {
    const category = req.query.category;

    if (!CATEGORY_MAP[category]) {
        return res.status(400).json({ error: "Invalid category" });
    }

    getLeaderboard(category)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});

app.listen(PORT, () => {
    console.log(`Minezone website backend running on port ${PORT}`);
});