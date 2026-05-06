const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminOnly);

router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM analytics ORDER BY start_date DESC').all();
    res.json(rows);
});

router.post('/', (req, res) => {
    const { project, responsible, start_date, views, subs, total_subs, interactions, period } = req.body;
    if (!project || !responsible) return res.status(400).json({ error: 'Заполните обязательные поля' });
    const result = db.prepare(
        'INSERT INTO analytics (project, responsible, start_date, views, subs, total_subs, interactions, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(project, responsible, start_date || '', views || 0, subs || 0, total_subs || 0, interactions || 0, period || '');
    res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    const { project, responsible, start_date, views, subs, total_subs, interactions, period } = req.body;
    db.prepare(
        'UPDATE analytics SET project=?, responsible=?, start_date=?, views=?, subs=?, total_subs=?, interactions=?, period=? WHERE id=?'
    ).run(project, responsible, start_date, views, subs, total_subs, interactions, period, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM analytics WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
