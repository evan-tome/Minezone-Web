const express = require('express');
const router = express.Router();

const ML_URL = process.env.ML_URL || 'http://localhost:8000';

async function proxyML(path, res) {
    try {
        const r = await fetch(`${ML_URL}${path}`);
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.json(data);
    } catch {
        res.status(503).json({ error: 'ML service unavailable' });
    }
}

router.get('/anomalies',       (req, res) => proxyML('/internal/anomalies',       res));
router.get('/pipeline-health', (req, res) => proxyML('/internal/pipeline-health', res));
router.get('/balance',         (req, res) => proxyML('/internal/balance',         res));

module.exports = router;
