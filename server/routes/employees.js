const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM employees ORDER BY status, first_name').all();
    res.json(rows);
});

router.post('/', adminOnly, (req, res) => {
    const { first_name, last_name, city, employment, projects, status } = req.body;
    if (!first_name || !status) return res.status(400).json({ error: 'Заполните обязательные поля' });
    const result = db.prepare(
        'INSERT INTO employees (first_name, last_name, city, employment, projects, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(first_name, last_name || '', city || '', employment || '', projects || '', status);
    res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/:id', adminOnly, (req, res) => {
    const { first_name, last_name, city, employment, projects, status } = req.body;
    db.prepare(
        'UPDATE employees SET first_name=?, last_name=?, city=?, employment=?, projects=?, status=? WHERE id=?'
    ).run(first_name, last_name, city, employment, projects, status, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id', adminOnly, (req, res) => {
    db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

// Leaderboard — top employees by % of plan completed
router.get('/leaderboard', (req, res) => {
    const employees = db.prepare('SELECT * FROM employees WHERE status = ?').all('Активен');
    const projects = db.prepare('SELECT * FROM projects').all();

    const leaderboard = employees.map(emp => {
        const fullName = (emp.first_name + ' ' + (emp.last_name || '')).trim();
        const empProjects = projects.filter(p => p.responsible === fullName);
        const totalPlan = empProjects.reduce((s, p) => s + p.plan_reels, 0);
        const totalDone = empProjects.reduce((s, p) => s + p.done_reels, 0);
        const percent = totalPlan > 0 ? Math.round((totalDone / totalPlan) * 100) : 0;
        return { name: fullName, totalPlan, totalDone, percent, projectCount: empProjects.length };
    });

    leaderboard.sort((a, b) => b.percent - a.percent);
    res.json(leaderboard);
});

module.exports = router;
