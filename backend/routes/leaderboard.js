const express = require('express');
const router = express.Router();
const { CATEGORY_MAP, getLeaderboard } = require('../cache');

router.get('/', (req, res) => {
    const { category } = req.query;

    if (!CATEGORY_MAP[category]) {
        return res.status(400).json({ error: "Invalid category" });
    }

    getLeaderboard(category)
        .then(data => res.status(200).json(data))
        .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;
