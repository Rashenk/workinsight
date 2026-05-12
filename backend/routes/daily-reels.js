const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get daily reels for current user and their assigned projects
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT dr.*,
             p.name as project_name,
             u.name as responsible_name
      FROM daily_reels dr
      JOIN projects p ON dr.project_id = p.id
      JOIN users u ON dr.responsible_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // If not admin, only show assigned projects
    if (req.user.role !== 'admin') {
      query += ` AND dr.responsible_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY dr.date DESC LIMIT 365`;

    const reels = await allAsync(query, params);
    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily reels for specific project
router.get('/project/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const reels = await allAsync(
      `SELECT dr.*,
              p.name as project_name,
              u.name as responsible_name
       FROM daily_reels dr
       JOIN projects p ON dr.project_id = p.id
       JOIN users u ON dr.responsible_id = u.id
       WHERE dr.project_id = ?
       ORDER BY dr.date DESC`,
      [projectId]
    );

    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle reel completion for today
router.post('/toggle/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user.id;

    // Check if record exists
    const existing = await getAsync(
      `SELECT * FROM daily_reels
       WHERE project_id = ? AND responsible_id = ? AND date = ?`,
      [projectId, userId, today]
    );

    if (existing) {
      // Toggle completion
      await runAsync(
        `UPDATE daily_reels SET completed = NOT completed, updated_at = datetime('now')
         WHERE id = ?`,
        [existing.id]
      );

      const updated = await getAsync('SELECT * FROM daily_reels WHERE id = ?', [existing.id]);
      res.json(updated);
    } else {
      // Create new record with completed = 1
      await runAsync(
        `INSERT INTO daily_reels (project_id, responsible_id, date, completed)
         VALUES (?, ?, ?, ?)`,
        [projectId, userId, today, 1]
      );

      const created = await getAsync(
        `SELECT * FROM daily_reels
         WHERE project_id = ? AND responsible_id = ? AND date = ?`,
        [projectId, userId, today]
      );
      res.json(created);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly checklist for a project
router.get('/monthly/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const userId = req.user.id;

    // Get all days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const checklist = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const record = await getAsync(
        `SELECT * FROM daily_reels
         WHERE project_id = ? AND responsible_id = ? AND date = ?`,
        [projectId, userId, dateStr]
      );

      checklist.push({
        date: dateStr,
        day,
        completed: record ? record.completed : false,
        notes: record ? record.notes : ''
      });
    }

    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notes for a daily reel
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { notes } = req.body;
    await runAsync(
      `UPDATE daily_reels SET notes = ?, updated_at = datetime('now') WHERE id = ?`,
      [notes || '', req.params.id]
    );

    const updated = await getAsync('SELECT * FROM daily_reels WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
