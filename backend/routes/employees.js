const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const employees = await allAsync('SELECT id, email, name, phone, city, employment, status, role FROM users WHERE role = ? ORDER BY name', ['employee']);
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { email, name, phone, city, employment, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    const defaultPassword = bcrypt.hashSync('password123', 10);
    await runAsync(`
      INSERT INTO users (email, name, phone, city, employment, status, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'employee')
    `, [email || '', name, phone || '', city || '', employment || '', status || 'Активен', defaultPassword]);

    const employee = await getAsync('SELECT id, email, name, phone, city, employment, status FROM users WHERE name = ? AND role = ?', [name, 'employee']);
    res.status(201).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { email, name, phone, city, employment, status } = req.body;

  try {
    const employee = await getAsync('SELECT * FROM users WHERE id = ? AND role = ?', [req.params.id, 'employee']);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await runAsync(`
      UPDATE users
      SET email = ?, name = ?, phone = ?, city = ?, employment = ?, status = ?
      WHERE id = ?
    `, [email || employee.email, name || employee.name, phone || employee.phone, city || employee.city, employment || employee.employment, status || employee.status, req.params.id]);

    const updated = await getAsync('SELECT id, email, name, phone, city, employment, status FROM users WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const employee = await getAsync('SELECT * FROM users WHERE id = ? AND role = ?', [req.params.id, 'employee']);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
