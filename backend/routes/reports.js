const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let reports;
    if (req.user.role === 'admin') {
      reports = await allAsync('SELECT * FROM reports ORDER BY date DESC, time DESC');
    } else {
      reports = await allAsync('SELECT * FROM reports WHERE user_id = ? ORDER BY date DESC, time DESC', [req.user.id]);
    }
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data } = req.body;

  try {
    await runAsync(`
      INSERT INTO reports (user_id, user_name, project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, req.user.name, project_id || null, project_name || '', date || '', time || '', reels_created || 0, reels_published || 0, platforms || '', comment || '', screenshot_data || '']);

    const report = await getAsync('SELECT * FROM reports ORDER BY id DESC LIMIT 1');
    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data } = req.body;

  try {
    const report = await getAsync('SELECT * FROM reports WHERE id = ?', [req.params.id]);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await runAsync(`
      UPDATE reports
      SET project_id = ?, project_name = ?, date = ?, time = ?, reels_created = ?, reels_published = ?, platforms = ?, comment = ?, screenshot_data = ?
      WHERE id = ?
    `, [project_id !== undefined ? project_id : report.project_id, project_name || report.project_name,
      date || report.date, time || report.time, reels_created !== undefined ? reels_created : report.reels_created,
      reels_published !== undefined ? reels_published : report.reels_published, platforms || report.platforms,
      comment || report.comment, screenshot_data || report.screenshot_data, req.params.id]);

    const updated = await getAsync('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const report = await getAsync('SELECT * FROM reports WHERE id = ?', [req.params.id]);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await runAsync('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
