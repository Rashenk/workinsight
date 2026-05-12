const express = require('express');
const { db, encryptPassword, decryptPassword } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all access records - admin only
router.get('/', verifyToken, requireAdmin, (req, res) => {
  try {
    const access = db.prepare('SELECT * FROM access ORDER BY project_name').all();
    // Decrypt passwords
    const decrypted = access.map(a => ({
      ...a,
      password: a.password_encrypted ? decryptPassword(a.password_encrypted) : ''
    }));
    res.json(decrypted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create access record - admin only
router.post('/', verifyToken, requireAdmin, (req, res) => {
  const { project_id, project_name, tg_link, login, password, note } = req.body;

  if (!project_name || !login || !password) {
    return res.status(400).json({ error: 'Project name, login and password required' });
  }

  try {
    const encrypted = encryptPassword(password);
    const result = db.prepare(`
      INSERT INTO access (project_id, project_name, tg_link, login, password_encrypted, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(project_id || null, project_name, tg_link || '', login, encrypted, note || '');

    const record = db.prepare('SELECT id, project_id, project_name, tg_link, login, note FROM access WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update access record - admin only
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
  const { project_id, project_name, tg_link, login, password, note } = req.body;

  try {
    const record = db.prepare('SELECT * FROM access WHERE id = ?').get(req.params.id);

    if (!record) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    const encrypted = password ? encryptPassword(password) : record.password_encrypted;

    db.prepare(`
      UPDATE access
      SET project_id = ?, project_name = ?, tg_link = ?, login = ?, password_encrypted = ?, note = ?
      WHERE id = ?
    `).run(project_id !== undefined ? project_id : record.project_id, project_name || record.project_name,
      tg_link || record.tg_link, login || record.login, encrypted, note !== undefined ? note : record.note, req.params.id);

    const updated = db.prepare('SELECT id, project_id, project_name, tg_link, login, note FROM access WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE access record - admin only
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM access WHERE id = ?').get(req.params.id);

    if (!record) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    db.prepare('DELETE FROM access WHERE id = ?').run(req.params.id);
    res.json({ message: 'Access record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
