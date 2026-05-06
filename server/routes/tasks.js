const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM tasks ORDER BY end_date ASC').all();
    res.json(rows);
});

router.post('/', (req, res) => {
    const { project, task, start_date, end_date, responsible, stage, comment } = req.body;
    if (!task || !project || !responsible || !stage) return res.status(400).json({ error: 'Заполните обязательные поля' });
    const result = db.prepare(
        'INSERT INTO tasks (project, task, start_date, end_date, responsible, stage, comment) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(project, task, start_date || '', end_date || '', responsible, stage, comment || '');
    res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    const { project, task, start_date, end_date, responsible, stage, comment } = req.body;
    db.prepare(
        'UPDATE tasks SET project=?, task=?, start_date=?, end_date=?, responsible=?, stage=?, comment=? WHERE id=?'
    ).run(project, task, start_date, end_date, responsible, stage, comment, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
