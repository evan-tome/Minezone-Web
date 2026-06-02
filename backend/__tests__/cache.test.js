jest.mock('../db', () => ({ query: jest.fn() }));

function freshModules() {
    jest.resetModules();
    jest.mock('../db', () => ({ query: jest.fn() }));
    const con = require('../db');
    const { CATEGORY_MAP, getLeaderboard } = require('../cache');
    return { con, CATEGORY_MAP, getLeaderboard };
}

describe('CATEGORY_MAP', () => {
    test('contains all expected categories', () => {
        const { CATEGORY_MAP } = freshModules();
        expect(Object.keys(CATEGORY_MAP)).toEqual([
            'Wins', 'FlawlessWins', 'Kills', 'BestWinstreak', 'TotalCaught', 'Level',
        ]);
    });

    test('each key maps to its own name', () => {
        const { CATEGORY_MAP } = freshModules();
        for (const key of Object.keys(CATEGORY_MAP)) {
            expect(CATEGORY_MAP[key]).toBe(key);
        }
    });
});

describe('getLeaderboard', () => {
    test('queries DB on cache miss and returns result', async () => {
        const { con, getLeaderboard } = freshModules();
        const mockData = [{ UUID: 'abc', LastPlayerName: 'Steve', Wins: 5 }];
        con.query.mockImplementation((sql, cb) => cb(null, mockData));

        const result = await getLeaderboard('Wins');
        expect(result).toEqual(mockData);
        expect(con.query).toHaveBeenCalledTimes(1);
    });

    test('returns cached data without re-querying within TTL', async () => {
        const { con, getLeaderboard } = freshModules();
        const mockData = [{ UUID: 'abc', LastPlayerName: 'Steve', Wins: 5 }];
        con.query.mockImplementation((sql, cb) => cb(null, mockData));

        await getLeaderboard('Wins');
        const result = await getLeaderboard('Wins');

        expect(result).toEqual(mockData);
        expect(con.query).toHaveBeenCalledTimes(1);
    });

    test('deduplicates concurrent requests for the same category', async () => {
        const { con, getLeaderboard } = freshModules();
        let capturedCb;
        con.query.mockImplementation((sql, cb) => { capturedCb = cb; });

        const p1 = getLeaderboard('Kills');
        const p2 = getLeaderboard('Kills');

        capturedCb(null, [{ UUID: '1', Kills: 10 }]);

        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toEqual(r2);
        expect(con.query).toHaveBeenCalledTimes(1);
    });

    test('issues separate queries for different categories', async () => {
        const { con, getLeaderboard } = freshModules();
        con.query.mockImplementation((sql, cb) => cb(null, []));

        await getLeaderboard('Wins');
        await getLeaderboard('Kills');

        expect(con.query).toHaveBeenCalledTimes(2);
    });

    test('rejects on DB error', async () => {
        const { con, getLeaderboard } = freshModules();
        con.query.mockImplementation((sql, cb) => cb(new Error('connection lost')));

        await expect(getLeaderboard('Level')).rejects.toThrow('connection lost');
    });

    test('cache hit for one category does not affect another', async () => {
        const { con, getLeaderboard } = freshModules();
        con.query.mockImplementation((sql, cb) => cb(null, []));

        await getLeaderboard('Wins');
        await getLeaderboard('Wins'); // hit — no extra query
        await getLeaderboard('Level'); // different category — new query

        expect(con.query).toHaveBeenCalledTimes(2);
    });
});
