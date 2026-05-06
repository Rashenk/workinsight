const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
    let rows;
    if (req.user.role === 'employee') {
        rows = db.prepare('SELECT * FROM reports WHERE user_name = ? ORDER BY report_date DESC, report_time DESC').all(req.user.name);
    } else {
        rows = db.prepare('SELECT * FROM reports ORDER BY report_date DESC, report_time DESC').all();
    }
    res.json(rows);
});

router.post('/', (req, res) => {
    const { report_date, project, reels_created, reels_published, platforms, comment, screenshot } = req.body;
    if (!report_date || !project) return res.status(400).json({ error: 'Заполните обязательные поля' });

    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    db.prepare(
        'INSERT INTO reports (report_date, report_time, user_name, project, reels_created, reels_published, platforms, comment, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(report_date, time, req.user.name, project, reels_created || 0, reels_published || 0, platforms || '', comment || '', screenshot || null);

    // Mark checklist as done
    db.prepare(`
        INSERT INTO daily_checklist (employee_name, project, check_date, published)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(employee_name, project, check_date) DO UPDATE SET published = 1
    `).run(req.user.name, project, report_date);

    res.json({ ok: true });
});

// Daily checklist — get today's status for all active projects
router.get('/checklist', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const name = req.user.name;

    const projects = req.user.role === 'employee'
        ? db.prepare("SELECT * FROM projects WHERE responsible = ? AND stage = 'В работе'").all(name)
        : db.prepare("SELECT * FROM projects WHERE stage = 'В работе'").all();

    const checklist = projects.map(p => {
        const entry = db.prepare(
            'SELECT * FROM daily_checklist WHERE employee_name = ? AND project = ? AND check_date = ?'
        ).get(p.responsible, p.name, today);
        return {
            project: p.name,
            responsible: p.responsible,
            published: entry ? entry.published === 1 : false
        };
    });

    res.json(checklist);
});

// Mark checklist item
router.post('/checklist/mark', (req, res) => {
    const { project, published } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
        INSERT INTO daily_checklist (employee_name, project, check_date, published)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(employee_name, project, check_date) DO UPDATE SET published = ?
    `).run(req.user.name, project, today, published ? 1 : 0, published ? 1 : 0);

    res.json({ ok: true });
});

module.exports = router;
