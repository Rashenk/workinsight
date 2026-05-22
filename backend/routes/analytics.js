const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let analytics;
    if (req.user.role === 'admin') {
      analytics = await allAsync('SELECT * FROM analytics ORDER BY id DESC');
    } else {
      analytics = await allAsync('SELECT * FROM analytics WHERE responsible_id = ? ORDER BY id DESC', [req.user.id]);
    }
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period } = req.body;

  try {
    // Ensure employee can only create analytics for themselves, admin can create for anyone
    const finalResponsibleId = req.user.role === 'admin' && responsible_id ? responsible_id : req.user.id;
    const finalResponsibleName = req.user.role === 'admin' && responsible_name ? responsible_name : req.user.name;

    await runAsync(`
      INSERT INTO analytics (project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [project_id || null, project_name || '', finalResponsibleId, finalResponsibleName, start_date || '', views || 0, subs || 0, total_subs || 0, interactions || 0, period || '']);

    const analytics = await getAsync('SELECT * FROM analytics ORDER BY id DESC LIMIT 1');
    res.status(201).json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period } = req.body;

  try {
    const analytics = await getAsync('SELECT * FROM analytics WHERE id = ?', [req.params.id]);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    if (req.user.role !== 'admin' && analytics.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only an admin may reassign a record to a different responsible user
    const finalResponsibleId = req.user.role === 'admin' && responsible_id !== undefined
      ? responsible_id : analytics.responsible_id;
    const finalResponsibleName = req.user.role === 'admin' && responsible_name
      ? responsible_name : analytics.responsible_name;

    await runAsync(`
      UPDATE analytics
      SET project_id = ?, project_name = ?, responsible_id = ?, responsible_name = ?, start_date = ?, views = ?, subs = ?, total_subs = ?, interactions = ?, period = ?
      WHERE id = ?
    `, [project_id !== undefined ? project_id : analytics.project_id, project_name || analytics.project_name,
      finalResponsibleId, finalResponsibleName,
      start_date || analytics.start_date, views !== undefined ? views : analytics.views, subs !== undefined ? subs : analytics.subs,
      total_subs !== undefined ? total_subs : analytics.total_subs, interactions !== undefined ? interactions : analytics.interactions,
      period || analytics.period, req.params.id]);

    const updated = await getAsync('SELECT * FROM analytics WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const analytics = await getAsync('SELECT * FROM analytics WHERE id = ?', [req.params.id]);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    if (req.user.role !== 'admin' && analytics.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await runAsync('DELETE FROM analytics WHERE id = ?', [req.params.id]);
    res.json({ message: 'Analytics record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
