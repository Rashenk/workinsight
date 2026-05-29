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
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, sales, period } = req.body;

  try {
    // Ensure employee can only create analytics for themselves, admin can create for anyone
    const finalResponsibleId = req.user.role === 'admin' && responsible_id ? responsible_id : req.user.id;
    const finalResponsibleName = req.user.role === 'admin' && responsible_name ? responsible_name : req.user.name;

    // Upsert: one analytics row per project. Re-creating updates the existing row.
    const existing = project_id
      ? await getAsync('SELECT * FROM analytics WHERE project_id = ?', [project_id])
      : null;

    if (existing) {
      if (req.user.role !== 'admin' && existing.responsible_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      await runAsync(`
        UPDATE analytics
        SET project_name = ?, responsible_id = ?, responsible_name = ?, start_date = ?, views = ?, subs = ?, total_subs = ?, interactions = ?, sales = ?, period = ?
        WHERE id = ?
      `, [project_name || existing.project_name, finalResponsibleId, finalResponsibleName, start_date || existing.start_date,
          views || 0, subs || 0, total_subs || 0, interactions || 0, sales || 0, period || existing.period, existing.id]);
      const updated = await getAsync('SELECT * FROM analytics WHERE id = ?', [existing.id]);
      return res.json(updated);
    }

    await runAsync(`
      INSERT INTO analytics (project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, sales, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [project_id || null, project_name || '', finalResponsibleId, finalResponsibleName, start_date || '', views || 0, subs || 0, total_subs || 0, interactions || 0, sales || 0, period || '']);

    const analytics = await getAsync('SELECT * FROM analytics ORDER BY id DESC LIMIT 1');
    res.status(201).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, sales, period } = req.body;

  try {
    const analytics = await getAsync('SELECT * FROM analytics WHERE id = ?', [req.params.id]);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    if (req.user.role !== 'admin' && analytics.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent moving record onto a project that already has an analytics row
    if (project_id !== undefined && project_id !== analytics.project_id) {
      const conflict = await getAsync('SELECT id FROM analytics WHERE project_id = ? AND id != ?', [project_id, req.params.id]);
      if (conflict) {
        return res.status(400).json({ error: 'У этого проекта уже есть запись аналитики' });
      }
    }

    // Only an admin may reassign a record to a different responsible user
    const finalResponsibleId = req.user.role === 'admin' && responsible_id !== undefined
      ? responsible_id : analytics.responsible_id;
    const finalResponsibleName = req.user.role === 'admin' && responsible_name
      ? responsible_name : analytics.responsible_name;

    await runAsync(`
      UPDATE analytics
      SET project_id = ?, project_name = ?, responsible_id = ?, responsible_name = ?, start_date = ?, views = ?, subs = ?, total_subs = ?, interactions = ?, sales = ?, period = ?
      WHERE id = ?
    `, [project_id !== undefined ? project_id : analytics.project_id, project_name || analytics.project_name,
      finalResponsibleId, finalResponsibleName,
      start_date || analytics.start_date, views !== undefined ? views : analytics.views, subs !== undefined ? subs : analytics.subs,
      total_subs !== undefined ? total_subs : analytics.total_subs, interactions !== undefined ? interactions : analytics.interactions,
      sales !== undefined ? sales : analytics.sales,
      period || analytics.period, req.params.id]);

    const updated = await getAsync('SELECT * FROM analytics WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
