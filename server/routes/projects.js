const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
    let rows;
    if (req.user.role === 'employee') {
        rows = db.prepare('SELECT * FROM projects WHERE responsible = ? ORDER BY priority DESC').all(req.user.name);
    } else {
        rows = db.prepare('SELECT * FROM projects ORDER BY priority DESC').all();
    }
    res.json(rows);
});

router.post('/', (req, res) => {
    const { name, stage, responsible, platform, priority, plan_reels, done_reels, start_date, comment } = req.body;
    if (!name || !stage || !responsible || !platform) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    const result = db.prepare(
        'INSERT INTO projects (name, stage, responsible, platform, priority, plan_reels, done_reels, start_date, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, stage, responsible, platform, priority || 5, plan_reels || 0, done_reels || 0, start_date || '', comment || '');
    res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    const { name, stage, responsible, platform, priority, plan_reels, done_reels, start_date, comment } = req.body;
    db.prepare(
        'UPDATE projects SET name=?, stage=?, responsible=?, platform=?, priority=?, plan_reels=?, done_reels=?, start_date=?, comment=? WHERE id=?'
    ).run(name, stage, responsible, platform, priority, plan_reels, done_reels, start_date, comment, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id', adminOnly, (req, res) => {
    db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
