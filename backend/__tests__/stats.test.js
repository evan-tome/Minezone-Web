jest.mock('../db', () => ({ query: jest.fn() }));

const express = require('express');
const request = require('supertest');
const con = require('../db');
const statsRouter = require('../routes/stats');

const app = express();
app.use('/stats', statsRouter);

function mockQuery(data, error = null) {
    con.query.mockImplementation((sql, paramsOrCb, cb) => {
        const callback = typeof paramsOrCb === 'function' ? paramsOrCb : cb;
        callback(error, data);
    });
}

beforeEach(() => {
    con.query.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('GET /stats', () => {
    test('returns player list', async () => {
        const players = [{ UUID: '1', LastPlayerName: 'Steve', Level: 10 }];
        mockQuery(players);
        const res = await request(app).get('/stats');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(players);
    });

    test('uses default limit=10 and offset=0', async () => {
        mockQuery([]);
        await request(app).get('/stats');
        expect(con.query.mock.calls[0][1]).toEqual([10, 0]);
    });

    test('passes provided limit and offset', async () => {
        mockQuery([]);
        await request(app).get('/stats?limit=5&offset=20');
        expect(con.query.mock.calls[0][1]).toEqual([5, 20]);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB down'));
        const res = await request(app).get('/stats');
        expect(res.status).toBe(500);
    });
});

describe('GET /stats/recent-matches', () => {
    const rows = [
        {
            game_id: 1, game_type: 'skywars', map_name: 'Island', end_time: null,
            game_duration_minutes: 10, class_id: 1, placement: 1, kills: 3, deaths: 0,
            lives: 3, firstblood: 1, winner: 1, LastPlayerName: 'Steve', UUID: 'aaa', Level: 5, RoleID: 0,
        },
        {
            game_id: 1, game_type: 'skywars', map_name: 'Island', end_time: null,
            game_duration_minutes: 10, class_id: 2, placement: 2, kills: 0, deaths: 1,
            lives: 2, firstblood: 0, winner: 0, LastPlayerName: 'Alex', UUID: 'bbb', Level: 3, RoleID: 0,
        },
    ];

    test('groups rows into matches with player arrays', async () => {
        mockQuery(rows);
        const res = await request(app).get('/stats/recent-matches');
        expect(res.status).toBe(200);
        expect(res.body.matches).toHaveLength(1);
        expect(res.body.matches[0].players).toHaveLength(2);
    });

    test('maps firstblood and winner booleans correctly', async () => {
        mockQuery(rows);
        const res = await request(app).get('/stats/recent-matches');
        const [p1, p2] = res.body.matches[0].players;
        expect(p1.first_blood).toBe(true);
        expect(p1.winner).toBe(true);
        expect(p2.first_blood).toBe(false);
        expect(p2.winner).toBe(false);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/stats/recent-matches');
        expect(res.status).toBe(500);
    });
});

describe('GET /stats/match/:id', () => {
    const rows = [
        {
            game_id: 42, game_type: 'skywars', map_name: 'Island', end_time: null,
            game_duration_minutes: 8, class_id: 1, placement: 1, kills: 2, deaths: 0,
            lives: 3, firstblood: 0, winner: 1, LastPlayerName: 'Steve', UUID: 'aaa', Level: 5, RoleID: 0,
        },
    ];

    test('returns match with players', async () => {
        mockQuery(rows);
        const res = await request(app).get('/stats/match/42');
        expect(res.status).toBe(200);
        expect(res.body.game_id).toBe(42);
        expect(res.body.players).toHaveLength(1);
        expect(res.body.players[0].username).toBe('Steve');
    });

    test('returns 400 for non-numeric id', async () => {
        const res = await request(app).get('/stats/match/abc');
        expect(res.status).toBe(400);
    });

    test('returns 404 when match not found', async () => {
        mockQuery([]);
        const res = await request(app).get('/stats/match/999');
        expect(res.status).toBe(404);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/stats/match/1');
        expect(res.status).toBe(500);
    });
});

describe('GET /stats/:username', () => {
    test('returns player profile', async () => {
        mockQuery([{ UUID: 'aaa', LastPlayerName: 'Steve', Level: 10 }]);
        const res = await request(app).get('/stats/Steve');
        expect(res.status).toBe(200);
        expect(res.body.LastPlayerName).toBe('Steve');
    });

    test('returns 404 when player not found', async () => {
        mockQuery([]);
        const res = await request(app).get('/stats/unknown');
        expect(res.status).toBe(404);
    });

    test('returns 500 on DB error', async () => {
        mockQuery(null, new Error('DB error'));
        const res = await request(app).get('/stats/Steve');
        expect(res.status).toBe(500);
    });
});

describe('GET /stats/:username/fishing', () => {
    test('returns fishing catches for player', async () => {
        mockQuery([{ FishID: 1, TimesCaught: 5 }, { FishID: 2, TimesCaught: 3 }]);
        const res = await request(app).get('/stats/Steve/fishing');
        expect(res.status).toBe(200);
        expect(res.body.username).toBe('Steve');
        expect(res.body.fishing).toHaveLength(2);
    });

    test('returns empty array when no fishing data', async () => {
        mockQuery([]);
        const res = await request(app).get('/stats/Steve/fishing');
        expect(res.status).toBe(200);
        expect(res.body.fishing).toEqual([]);
    });
});

describe('GET /stats/:username/parkour', () => {
    test('returns parkour times for player', async () => {
        mockQuery([{ ParkourID: 1, TotalTime: 120 }]);
        const res = await request(app).get('/stats/Steve/parkour');
        expect(res.status).toBe(200);
        expect(res.body.username).toBe('Steve');
        expect(res.body.parkour).toHaveLength(1);
    });
});

describe('GET /stats/:username/favclass', () => {
    test('returns most-played class ID', async () => {
        mockQuery([{ ClassID: 3 }]);
        const res = await request(app).get('/stats/Steve/favclass');
        expect(res.status).toBe(200);
        expect(res.body.ClassID).toBe(3);
    });

    test('returns null when player has no class data', async () => {
        mockQuery([]);
        const res = await request(app).get('/stats/Steve/favclass');
        expect(res.status).toBe(200);
        expect(res.body.ClassID).toBeNull();
    });
});

describe('GET /stats/:username/games', () => {
    test('returns last 3 games', async () => {
        mockQuery([
            { game_id: 10, game_type: 'skywars' },
            { game_id: 9, game_type: 'skywars' },
        ]);
        const res = await request(app).get('/stats/Steve/games');
        expect(res.status).toBe(200);
        expect(res.body.games).toHaveLength(2);
    });
});

describe('GET /stats/:username/recommend', () => {
    test('proxies successful ML response', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ recommendation: 'Archer' }),
        });
        const res = await request(app).get('/stats/Steve/recommend');
        expect(res.status).toBe(200);
        expect(res.body.recommendation).toBe('Archer');
    });

    test('returns 503 when ML service is unreachable', async () => {
        global.fetch.mockRejectedValue(new Error('ECONNREFUSED'));
        const res = await request(app).get('/stats/Steve/recommend');
        expect(res.status).toBe(503);
        expect(res.body.error).toBe('ML service unavailable');
    });

    test('forwards non-ok ML status codes', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: 'Player not found' }),
        });
        const res = await request(app).get('/stats/Steve/recommend');
        expect(res.status).toBe(404);
    });
});

describe('GET /stats/:username/archetype', () => {
    test('proxies ML archetype response', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ archetype: 'Defender' }),
        });
        const res = await request(app).get('/stats/Steve/archetype');
        expect(res.status).toBe(200);
        expect(res.body.archetype).toBe('Defender');
    });

    test('returns 503 when ML service is unreachable', async () => {
        global.fetch.mockRejectedValue(new Error('ECONNREFUSED'));
        const res = await request(app).get('/stats/Steve/archetype');
        expect(res.status).toBe(503);
    });
});

describe('GET /stats/:username/predict-win', () => {
    test('proxies ML win prediction response', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ win_probability: 0.72 }),
        });
        const res = await request(app).get('/stats/Steve/predict-win');
        expect(res.status).toBe(200);
        expect(res.body.win_probability).toBe(0.72);
    });

    test('returns 503 when ML service is unreachable', async () => {
        global.fetch.mockRejectedValue(new Error('ECONNREFUSED'));
        const res = await request(app).get('/stats/Steve/predict-win');
        expect(res.status).toBe(503);
    });
});
