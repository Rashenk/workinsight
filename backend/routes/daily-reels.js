const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get daily reels with reel counts for current month
router.get('/', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;

    let query = `
      SELECT dr.*,
             p.name as project_name,
             p.platform,
             u.id as responsible_id,
             u.name as responsible_name
      FROM daily_reels dr
      JOIN projects p ON dr.project_id = p.id
      LEFT JOIN users u ON dr.responsible_id = u.id
      WHERE dr.date >= ?
    `;
    const params = [monthStart];

    // If not admin, only show own records
    if (req.user.role !== 'admin') {
      query += ` AND dr.responsible_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY dr.date DESC, p.name ASC`;

    const reels = await allAsync(query, params);
    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly summary for a specific user
router.get('/summary/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;

    const summary = await allAsync(
      `SELECT p.id, p.name, p.platform,
              COALESCE(SUM(dr.reel_count), 0) as total_reels
       FROM projects p
       LEFT JOIN daily_reels dr ON p.id = dr.project_id
         AND dr.responsible_id = ?
         AND dr.date >= ?
       WHERE p.responsible_id = ?
       GROUP BY p.id
       ORDER BY p.name`,
      [userId, monthStart, userId]
    );

    const totalReels = summary.reduce((sum, p) => sum + p.total_reels, 0);

    res.json({
      summary,
      totalReels,
      monthlyGoal: 80,
      remaining: Math.max(0, 80 - totalReels)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard - all users with their monthly progress
router.get('/admin/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;

    const dashboard = await allAsync(
      `SELECT u.id, u.name, u.email,
              COALESCE(SUM(dr.reel_count), 0) as total_reels
       FROM users u
       LEFT JOIN daily_reels dr ON u.id = dr.responsible_id
         AND dr.date >= ?
       WHERE u.role = 'employee'
       GROUP BY u.id
       ORDER BY total_reels DESC`,
      [monthStart]
    );

    const enriched = dashboard.map(emp => ({
      ...emp,
      monthlyGoal: 80,
      remaining: Math.max(0, 80 - emp.total_reels),
      percentage: Math.round((emp.total_reels / 80) * 100)
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or update reel count for a specific day
router.post('/add/:projectId/:date', verifyToken, async (req, res) => {
  try {
    const { projectId, date } = req.params;
    const { count = 1 } = req.body;
    const userId = req.user.id;

    // Verify that the project is assigned to this user (or user is admin)
    const project = await getAsync('SELECT id, responsible_id FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.responsible_id !== userId) {
      return res.status(403).json({ error: 'Project not assigned to you' });
    }

    // Check if record exists
    const existing = await getAsync(
      `SELECT * FROM daily_reels
       WHERE project_id = ? AND responsible_id = ? AND date = ?`,
      [projectId, userId, date]
    );

    if (existing) {
      // Update existing record
      const newCount = existing.reel_count + count;
      await runAsync(
        `UPDATE daily_reels
         SET reel_count = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [Math.max(0, newCount), existing.id]
      );
    } else {
      // Create new record
      await runAsync(
        `INSERT INTO daily_reels (project_id, responsible_id, date, reel_count)
         VALUES (?, ?, ?, ?)`,
        [projectId, userId, date, count]
      );
    }

    const record = await getAsync(
      `SELECT * FROM daily_reels
       WHERE project_id = ? AND responsible_id = ? AND date = ?`,
      [projectId, userId, date]
    );

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set reel count to specific value (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { reel_count, notes } = req.body;

    await runAsync(
      `UPDATE daily_reels
       SET reel_count = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [reel_count || 0, notes || '', req.params.id]
    );

    const updated = await getAsync('SELECT * FROM daily_reels WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a daily reel record (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await runAsync('DELETE FROM daily_reels WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
