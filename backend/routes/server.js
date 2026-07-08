const express = require('express');
const router = express.Router();
const { status } = require('minecraft-server-util');
const con = require('../db');

const HOST = 'minezone.club';
const PORT = 25565;
const CACHE_TTL = 30 * 1000;

let cached = null;
let lastFetch = 0;
let pending = null;

function enrichPlayers(names) {
    if (!names || names.length === 0) return Promise.resolve([]);
    const placeholders = names.map(() => '?').join(',');
    return new Promise((resolve) => {
        con.query(
            `SELECT LastPlayerName, RoleID, Level FROM PlayerData WHERE LastPlayerName IN (${placeholders})`,
            names,
            (err, rows) => {
                if (err) return resolve(names.map(n => ({ name: n, roleId: 0, level: 0 })));
                const map = new Map(rows.map(r => [r.LastPlayerName, r]));
                resolve(names.map(n => {
                    const row = map.get(n);
                    return { name: n, roleId: row?.RoleID ?? 0, level: row?.Level ?? 0 };
                }));
            }
        );
    });
}

function fetchStatus() {
    const now = Date.now();
    if (cached && now - lastFetch < CACHE_TTL) return Promise.resolve(cached);
    if (pending) return pending;

    pending = status(HOST, PORT, { timeout: 5000 })
        .then(result => {
            const names = (result.players.sample || []).map(p => p.name);
            return enrichPlayers(names).then(players => {
                cached = { online: result.players.online, max: result.players.max, players };
                lastFetch = Date.now();
                pending = null;
                return cached;
            });
        })
        .catch(() => {
            pending = null;
            if (cached) return cached;
            return { online: 0, max: 0, offline: true, players: [] };
        });

    return pending;
}

router.get('/status', (req, res) => {
    fetchStatus()
        .then(data => res.json(data))
        .catch(() => res.status(500).json({ error: 'Failed to reach server' }));
});

module.exports = router;
