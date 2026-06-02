const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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

// General limit: 300 requests per minute per IP
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
});

// Stats limit: 120 per minute per IP (~2/sec, blocks scrapers but not normal browsing)
const statsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many player lookups, please slow down.' },
});

app.use(generalLimiter);

app.get('/', (req, res) => res.send('Hello'));
app.use('/stats', statsLimiter, statsRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/server', serverRouter);
app.use('/analytics', analyticsRouter);

con.getConnection((err, connection) => {
    if (err) throw err;
    connection.release();
    console.log("Connected to MySQL!");
    app.listen(PORT, () => {
        console.log(`Minezone website backend running on port ${PORT}`);
    });
});
