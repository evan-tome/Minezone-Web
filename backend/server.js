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

con.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL!");
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

        const sql = "SELECT LastPlayerName, Wins, Losses FROM PlayerData WHERE LastPlayerName = ?";
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
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
    }
}).listen(8080, () => console.log("Server running on port 8080"));
