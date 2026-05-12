const express = require('express');
const { db } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET finance params - everyone can see
router.get('/params', verifyToken, (req, res) => {
  try {
    const params = db.prepare('SELECT * FROM finance_params WHERE id = 1').get();
    res.json(params || { id: 1, base_salary: 4000, base_reels: 80, other_expenses: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update finance params - admin only
router.put('/params', verifyToken, requireAdmin, (req, res) => {
  const { base_salary, base_reels, other_expenses } = req.body;

  try {
    db.prepare(`
      INSERT OR REPLACE INTO finance_params (id, base_salary, base_reels, other_expenses)
      VALUES (1, ?, ?, ?)
    `).run(base_salary || 4000, base_reels || 80, other_expenses || 0);

    const params = db.prepare('SELECT * FROM finance_params WHERE id = 1').get();
    res.json(params);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
