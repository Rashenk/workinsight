const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM expenses ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, amount } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название обязательно' });
  }

  try {
    await runAsync(
      'INSERT INTO expenses (name, amount) VALUES (?, ?)',
      [name.trim(), parseInt(amount, 10) || 0]
    );
    const row = await getAsync('SELECT * FROM expenses ORDER BY id DESC LIMIT 1');
    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { name, amount } = req.body;
  try {
    const row = await getAsync('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Expense not found' });

    await runAsync(
      'UPDATE expenses SET name = ?, amount = ? WHERE id = ?',
      [name ? name.trim() : row.name, amount !== undefined ? (parseInt(amount, 10) || 0) : row.amount, req.params.id]
    );
    const updated = await getAsync('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const row = await getAsync('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Expense not found' });

    await runAsync('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
