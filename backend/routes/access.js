const express = require('express');
const { getAsync, allAsync, runAsync, encryptPassword, decryptPassword } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const access = await allAsync('SELECT * FROM access ORDER BY project_name');
    const decrypted = access.map(a => ({
      ...a,
      password: a.password_encrypted ? decryptPassword(a.password_encrypted) : ''
    }));
    res.json(decrypted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { project_id, project_name, tg_link, login, password, note } = req.body;

  if (!project_name || !login || !password) {
    return res.status(400).json({ error: 'Project name, login and password required' });
  }

  try {
    const encrypted = encryptPassword(password);
    await runAsync(`
      INSERT INTO access (project_id, project_name, tg_link, login, password_encrypted, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [project_id || null, project_name, tg_link || '', login, encrypted, note || '']);

    const record = await getAsync('SELECT id, project_id, project_name, tg_link, login, note FROM access ORDER BY id DESC LIMIT 1');
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { project_id, project_name, tg_link, login, password, note } = req.body;

  try {
    const record = await getAsync('SELECT * FROM access WHERE id = ?', [req.params.id]);

    if (!record) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    const encrypted = password ? encryptPassword(password) : record.password_encrypted;

    await runAsync(`
      UPDATE access
      SET project_id = ?, project_name = ?, tg_link = ?, login = ?, password_encrypted = ?, note = ?
      WHERE id = ?
    `, [project_id !== undefined ? project_id : record.project_id, project_name || record.project_name,
      tg_link || record.tg_link, login || record.login, encrypted, note !== undefined ? note : record.note, req.params.id]);

    const updated = await getAsync('SELECT id, project_id, project_name, tg_link, login, note FROM access WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const record = await getAsync('SELECT * FROM access WHERE id = ?', [req.params.id]);

    if (!record) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    await runAsync('DELETE FROM access WHERE id = ?', [req.params.id]);
    res.json({ message: 'Access record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
