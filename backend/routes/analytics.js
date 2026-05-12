const express = require('express');
const { db } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET analytics
router.get('/', verifyToken, (req, res) => {
  try {
    let analytics;
    if (req.user.role === 'admin') {
      analytics = db.prepare('SELECT * FROM analytics ORDER BY id DESC').all();
    } else {
      analytics = db.prepare('SELECT * FROM analytics WHERE responsible_id = ? ORDER BY id DESC').all(req.user.id);
    }
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create analytics record
router.post('/', verifyToken, (req, res) => {
  const { project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO analytics (project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(project_id || null, project_name || '', responsible_id || null, responsible_name || '', start_date || '', views || 0, subs || 0, total_subs || 0, interactions || 0, period || '');

    const analytics = db.prepare('SELECT * FROM analytics WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update analytics record
router.put('/:id', verifyToken, (req, res) => {
  const { project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period } = req.body;

  try {
    const analytics = db.prepare('SELECT * FROM analytics WHERE id = ?').get(req.params.id);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    // Employee can only update their own records
    if (req.user.role !== 'admin' && analytics.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare(`
      UPDATE analytics
      SET project_id = ?, project_name = ?, responsible_id = ?, responsible_name = ?, start_date = ?, views = ?, subs = ?, total_subs = ?, interactions = ?, period = ?
      WHERE id = ?
    `).run(project_id !== undefined ? project_id : analytics.project_id, project_name || analytics.project_name,
      responsible_id !== undefined ? responsible_id : analytics.responsible_id, responsible_name || analytics.responsible_name,
      start_date || analytics.start_date, views !== undefined ? views : analytics.views, subs !== undefined ? subs : analytics.subs,
      total_subs !== undefined ? total_subs : analytics.total_subs, interactions !== undefined ? interactions : analytics.interactions,
      period || analytics.period, req.params.id);

    const updated = db.prepare('SELECT * FROM analytics WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE analytics record
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const analytics = db.prepare('SELECT * FROM analytics WHERE id = ?').get(req.params.id);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    // Employee can only delete their own records
    if (req.user.role !== 'admin' && analytics.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare('DELETE FROM analytics WHERE id = ?').run(req.params.id);
    res.json({ message: 'Analytics record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
