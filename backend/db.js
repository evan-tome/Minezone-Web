const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
});

const SLOW_MS = parseInt(process.env.DB_SLOW_MS) || 500;

function logQuery(sql, ms, err) {
    const preview = (typeof sql === 'string' ? sql : sql?.sql ?? '')
        .replace(/\s+/g, ' ').trim().slice(0, 120);
    if (err) {
        console.error(`[DB] ${ms}ms ERROR: ${preview}`);
    } else if (ms >= SLOW_MS) {
        console.warn(`[DB] ${ms}ms SLOW: ${preview}`);
    } else {
        console.log(`[DB] ${ms}ms: ${preview}`);
    }
}

// Wrap callback-style queries
const _query = pool.query.bind(pool);
pool.query = function (...args) {
    const start = Date.now();
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'function') {
        args[args.length - 1] = function (err, result, fields) {
            logQuery(args[0], Date.now() - start, err);
            lastArg(err, result, fields);
        };
    }
    return _query(...args);
};

// Wrap promise-style queries and pin the instance so pool.promise() always returns it
const promisePool = pool.promise();
const _promiseQuery = promisePool.query.bind(promisePool);
promisePool.query = async function (...args) {
    const start = Date.now();
    try {
        const result = await _promiseQuery(...args);
        logQuery(args[0], Date.now() - start, null);
        return result;
    } catch (err) {
        logQuery(args[0], Date.now() - start, err);
        throw err;
    }
};
pool.promise = () => promisePool;

module.exports = pool;
