jest.mock('../db', () => ({ query: jest.fn() }));

const express = require('express');
const request = require('supertest');

let app;
let con;

beforeEach(() => {
    jest.resetModules();
    jest.mock('../db', () => ({ query: jest.fn() }));
    con = require('../db');
    const analyticsRouter = require('../routes/analytics');
    app = express();
    app.use('/analytics', analyticsRouter);
});

function mockQuery(data, error = null) {
    con.query.mockImplementation((sql, cb) => cb(error, data));
}

describe('GET /analytics/overview', () => {
    test('returns aggregated overview stats', async () => {
        const overview = { totalPlayers: 100, totalGames: 500, avgLevel: 5.2 };
        mockQuery([overview]);
        const res = await request(app).get('/analytics/overview');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(overview);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/analytics/overview');
        expect(res.status).toBe(500);
    });
});

describe('GET /analytics/distribution/levels', () => {
    test('returns level distribution buckets', async () => {
        const distribution = [
            { bucket: 0, count: 10 },
            { bucket: 5, count: 25 },
            { bucket: 10, count: 15 },
        ];
        mockQuery(distribution);
        const res = await request(app).get('/analytics/distribution/levels');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(distribution);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/analytics/distribution/levels');
        expect(res.status).toBe(500);
    });
});

describe('GET /analytics/top-classes', () => {
    test('returns top classes with play counts', async () => {
        const classes = [
            { ClassID: 1, totalPlayed: 200, totalWon: 100 },
            { ClassID: 2, totalPlayed: 150, totalWon: 60 },
        ];
        mockQuery(classes);
        const res = await request(app).get('/analytics/top-classes');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(classes);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/analytics/top-classes');
        expect(res.status).toBe(500);
    });
});

describe('GET /analytics/all-class-stats', () => {
    test('returns all class stats without limit', async () => {
        const classes = [
            { ClassID: 3, totalPlayed: 80, totalWon: 40 },
            { ClassID: 4, totalPlayed: 50, totalWon: 20 },
        ];
        mockQuery(classes);
        const res = await request(app).get('/analytics/all-class-stats');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(classes);
    });
});

describe('GET /analytics/winrates', () => {
    test('returns top players by win rate', async () => {
        const players = [
            { LastPlayerName: 'Steve', Wins: 50, Losses: 10, TotalGames: 60, WinRate: 83.3 },
            { LastPlayerName: 'Alex', Wins: 30, Losses: 10, TotalGames: 40, WinRate: 75.0 },
        ];
        mockQuery(players);
        const res = await request(app).get('/analytics/winrates');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(players);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/analytics/winrates');
        expect(res.status).toBe(500);
    });
});
