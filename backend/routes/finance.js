const express = require('express');
const { getAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/params', verifyToken, requireAdmin, async (req, res) => {
  try {
    const params = await getAsync('SELECT * FROM finance_params WHERE id = 1');
    res.json(params || {
      id: 1, base_salary: 4000, base_reels: 80, other_expenses: 0,
      bonus_threshold: 500000, bonus_amount: 1000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/params', verifyToken, requireAdmin, async (req, res) => {
  const { base_salary, base_reels, other_expenses, bonus_threshold, bonus_amount } = req.body;

  try {
    await runAsync(`
      INSERT OR REPLACE INTO finance_params (id, base_salary, base_reels, other_expenses, bonus_threshold, bonus_amount)
      VALUES (1, ?, ?, ?, ?, ?)
    `, [base_salary || 4000, base_reels || 80, other_expenses || 0,
      bonus_threshold || 500000, bonus_amount || 1000]);

    const params = await getAsync('SELECT * FROM finance_params WHERE id = 1');
    res.json(params);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
