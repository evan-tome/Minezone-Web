const express = require('express');
const cors = require('cors');
require('dotenv').config();
const con = require('./db');
const statsRouter = require('./routes/stats');
const leaderboardRouter = require('./routes/leaderboard');
const serverRouter = require('./routes/server');
const analyticsRouter = require('./routes/analytics');

const app = express();
const PORT = 8080;

app.disable('x-powered-by');
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get('/', (req, res) => res.send('Hello'));
app.use('/stats', statsRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/server', serverRouter);
app.use('/analytics', analyticsRouter);

con.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL!");
    app.listen(PORT, () => {
        console.log(`Minezone website backend running on port ${PORT}`);
    });
});
