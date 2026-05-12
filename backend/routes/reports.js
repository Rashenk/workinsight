const express = require('express');
const { db } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET reports
router.get('/', verifyToken, (req, res) => {
  try {
    let reports;
    if (req.user.role === 'admin') {
      reports = db.prepare('SELECT * FROM reports ORDER BY date DESC, time DESC').all();
    } else {
      reports = db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY date DESC, time DESC').all(req.user.id);
    }
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create report
router.post('/', verifyToken, (req, res) => {
  const { project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO reports (user_id, user_name, project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, req.user.name, project_id || null, project_name || '', date || '', time || '', reels_created || 0, reels_published || 0, platforms || '', comment || '', screenshot_data || '');

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update report
router.put('/:id', verifyToken, (req, res) => {
  const { project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data } = req.body;

  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Employee can only update their own reports
    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare(`
      UPDATE reports
      SET project_id = ?, project_name = ?, date = ?, time = ?, reels_created = ?, reels_published = ?, platforms = ?, comment = ?, screenshot_data = ?
      WHERE id = ?
    `).run(project_id !== undefined ? project_id : report.project_id, project_name || report.project_name,
      date || report.date, time || report.time, reels_created !== undefined ? reels_created : report.reels_created,
      reels_published !== undefined ? reels_published : report.reels_published, platforms || report.platforms,
      comment || report.comment, screenshot_data || report.screenshot_data, req.params.id);

    const updated = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE report
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Employee can only delete their own reports
    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
