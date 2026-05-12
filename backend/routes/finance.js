const express = require('express');
const { getAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/params', verifyToken, async (req, res) => {
  try {
    const params = await getAsync('SELECT * FROM finance_params WHERE id = 1');
    res.json(params || { id: 1, base_salary: 4000, base_reels: 80, other_expenses: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/params', verifyToken, requireAdmin, async (req, res) => {
  const { base_salary, base_reels, other_expenses } = req.body;

  try {
    await runAsync(`
      INSERT OR REPLACE INTO finance_params (id, base_salary, base_reels, other_expenses)
      VALUES (1, ?, ?, ?)
    `, [base_salary || 4000, base_reels || 80, other_expenses || 0]);

    const params = await getAsync('SELECT * FROM finance_params WHERE id = 1');
    res.json(params);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
