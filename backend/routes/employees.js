const express = require('express');
const { db } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// GET all employees
router.get('/', verifyToken, requireAdmin, (req, res) => {
  try {
    const employees = db.prepare('SELECT id, email, name, phone, city, employment, status, role FROM users WHERE role = ? ORDER BY name').all('employee');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create employee
router.post('/', verifyToken, requireAdmin, (req, res) => {
  const { email, name, phone, city, employment, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    const defaultPassword = bcrypt.hashSync('password123', 10);
    const result = db.prepare(`
      INSERT INTO users (email, name, phone, city, employment, status, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'employee')
    `).run(email || '', name, phone || '', city || '', employment || '', status || 'Активен', defaultPassword);

    const employee = db.prepare('SELECT id, email, name, phone, city, employment, status FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update employee
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
  const { email, name, phone, city, employment, status } = req.body;

  try {
    const employee = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'employee');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    db.prepare(`
      UPDATE users
      SET email = ?, name = ?, phone = ?, city = ?, employment = ?, status = ?
      WHERE id = ?
    `).run(email || employee.email, name || employee.name, phone || employee.phone, city || employee.city, employment || employee.employment, status || employee.status, req.params.id);

    const updated = db.prepare('SELECT id, email, name, phone, city, employment, status FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE employee
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'employee');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
