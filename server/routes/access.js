const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminOnly);

router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM access_data ORDER BY project').all();
    res.json(rows);
});

router.post('/', (req, res) => {
    const { project, tg_link, login, password_encrypted, note } = req.body;
    if (!project) return res.status(400).json({ error: 'Выберите проект' });
    const result = db.prepare(
        'INSERT INTO access_data (project, tg_link, login, password_encrypted, note) VALUES (?, ?, ?, ?, ?)'
    ).run(project, tg_link || '', login || '', password_encrypted || '', note || '');
    res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    const { project, tg_link, login, password_encrypted, note } = req.body;
    db.prepare(
        'UPDATE access_data SET project=?, tg_link=?, login=?, password_encrypted=?, note=? WHERE id=?'
    ).run(project, tg_link, login, password_encrypted, note, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM access_data WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
