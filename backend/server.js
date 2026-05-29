require('dotenv').config();
let mysql = require('mysql');
let http = require('http');
let url = require('url');

let con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const LEADERBOARD_CATEGORIES = ["Wins", "FlawlessWins", "Kills", "BestWinstreak", "TotalCaught", "Level"];
const CACHE_TTL = 1 * 60 * 1000; // refresh every minute
const leaderboardCache = {};

function refreshLeaderboards() {
    LEADERBOARD_CATEGORIES.forEach(category => {
        const sql = `
            SELECT UUID, LastPlayerName, Wins, FlawlessWins, Kills, BestWinstreak, TotalCaught, Level
            FROM PlayerData
            WHERE ${category} > 0
            ORDER BY ${category} DESC
            LIMIT 50
        `;
        con.query(sql, (err, result) => {
            if (!err) leaderboardCache[category] = result;
        });
    });
}

con.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL!");
    refreshLeaderboards();
    setInterval(refreshLeaderboards, CACHE_TTL);
});

http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname === "/player") {
        const username = reqUrl.query.username;
        if (!username) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "No username provided" }));
        }

        const sql = "SELECT " +
            "UUID, LastPlayerName, RoleID, Tokens, Wins, Kills, Deaths, FlawlessWins, Losses, Winstreak, BestWinstreak, Exp, Level, MatchMvps, TotalCaught" +
            " FROM PlayerData WHERE LastPlayerName = ?";
        con.query(sql, [username], (err, result) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Database error" }));
            }

            if (result.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Player not found" }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result[0]));
        });

    } else if (reqUrl.pathname === "/leaderboard") {
        const category = reqUrl.query.category;

        if (!LEADERBOARD_CATEGORIES.includes(category)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid category" }));
        }

        const cached = leaderboardCache[category];
        if (!cached) {
            res.writeHead(503, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Data not ready yet, try again shortly." }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(cached));

    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
    }
}).listen(8080, () => console.log("Server running on port 8080"));
