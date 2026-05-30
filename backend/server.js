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
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        res.json(result);
    });
})

app.get('/stats/:username', (req, res) => {
    const username = req.params.username;
    
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
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Player not found" });
        }
        res.json(result[0]);
    });
})

app.get('/stats/:username/fishing', (req, res) => {
    const username = req.params.username;

    const sql = `
        SELECT
            pf.FishID,
            pf.TimesCaught
        FROM PlayerFishing pf
        JOIN PlayerData pd ON pf.UUID = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY pf.FishID ASC
    `;

    con.query(sql, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            username,
            fishing: result
        });
    });
});

app.get('/stats/:username/parkour', (req, res) => {
    const username = req.params.username;

    const sql = `
        SELECT
            pp.ParkourID,
            pp.TotalTime
        FROM PlayerParkour pp
        JOIN PlayerData pd ON pp.UUID = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY pp.TotalTime ASC
    `;

    con.query(sql, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            username,
            parkour: result
        });
    });
});

app.get('/stats/:username/favclass', (req, res) => {
    const username = req.params.username;

    const sql = `
        SELECT
            pc.ClassID
        FROM PlayerClasses pc
        JOIN PlayerData pd ON pc.UUID = pd.UUID
        WHERE pd.LastPlayerName = ?
        ORDER BY pc.GamesPlayed DESC
        LIMIT 1
    `;

    con.query(sql, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            ClassID: result[0]?.ClassID ?? null
        });
    });
});

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