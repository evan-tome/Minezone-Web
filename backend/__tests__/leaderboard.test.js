jest.mock('../cache', () => ({
    CATEGORY_MAP: { Wins: 'Wins', Kills: 'Kills', Level: 'Level' },
    getLeaderboard: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const { getLeaderboard } = require('../cache');
const leaderboardRouter = require('../routes/leaderboard');

const app = express();
app.use('/leaderboard', leaderboardRouter);

beforeEach(() => {
    getLeaderboard.mockReset();
});

describe('GET /leaderboard', () => {
    test('returns leaderboard data for a valid category', async () => {
        const mockData = [{ UUID: 'abc', LastPlayerName: 'Steve', Wins: 20 }];
        getLeaderboard.mockResolvedValue(mockData);

        const res = await request(app).get('/leaderboard?category=Wins');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockData);
        expect(getLeaderboard).toHaveBeenCalledWith('Wins');
    });

    test('returns 400 for an unrecognized category', async () => {
        const res = await request(app).get('/leaderboard?category=invalid');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid category');
        expect(getLeaderboard).not.toHaveBeenCalled();
    });

    test('returns 400 when category param is missing', async () => {
        const res = await request(app).get('/leaderboard');
        expect(res.status).toBe(400);
    });

    test('returns 500 when cache/DB throws', async () => {
        getLeaderboard.mockRejectedValue(new Error('DB error'));
        const res = await request(app).get('/leaderboard?category=Kills');
        expect(res.status).toBe(500);
    });
});
