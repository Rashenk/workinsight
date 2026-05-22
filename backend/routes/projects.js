const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all projects - employees see only their projects
router.get('/', verifyToken, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await allAsync('SELECT * FROM projects ORDER BY id DESC');
    } else {
      projects = await allAsync(`
        SELECT * FROM projects
        WHERE responsible_id = ?
        ORDER BY id DESC
      `, [req.user.id]);
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single project
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const project = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create project - admin only
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, stage, responsible_id, platform, priority, plan_reels, done_reels, start_date, comment } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name required' });
  }

  if (!responsible_id) {
    return res.status(400).json({ error: 'Project must be assigned to a responsible employee' });
  }

  try {
    let responsible_name = '';
    const user = await getAsync('SELECT name FROM users WHERE id = ?', [responsible_id]);
    if (!user) {
      return res.status(400).json({ error: 'Responsible employee not found' });
    }
    responsible_name = user.name;

    await runAsync(`
      INSERT INTO projects (name, stage, responsible_id, responsible_name, platform, priority, plan_reels, done_reels, start_date, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, stage || '', responsible_id || null, responsible_name, platform || '', priority || 5, plan_reels || 0, done_reels || 0, start_date || '', comment || '']);

    const project = await getAsync('SELECT * FROM projects WHERE name = ? ORDER BY id DESC LIMIT 1', [name]);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update project - admin only
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { name, stage, responsible_id, platform, priority, plan_reels, done_reels, start_date, comment } = req.body;

  try {
    const project = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let responsible_name = project.responsible_name;
    if (responsible_id !== undefined) {
      if (!responsible_id) {
        return res.status(400).json({ error: 'Project must be assigned to a responsible employee' });
      }
      if (responsible_id !== project.responsible_id) {
        const user = await getAsync('SELECT name FROM users WHERE id = ?', [responsible_id]);
        if (!user) {
          return res.status(400).json({ error: 'Responsible employee not found' });
        }
        responsible_name = user.name;
      }
    }

    await runAsync(`
      UPDATE projects
      SET name = ?, stage = ?, responsible_id = ?, responsible_name = ?, platform = ?, priority = ?, plan_reels = ?, done_reels = ?, start_date = ?, comment = ?
      WHERE id = ?
    `, [name || project.name, stage !== undefined ? stage : project.stage, responsible_id !== undefined ? responsible_id : project.responsible_id,
      responsible_name, platform || project.platform, priority !== undefined ? priority : project.priority,
      plan_reels !== undefined ? plan_reels : project.plan_reels, done_reels !== undefined ? done_reels : project.done_reels,
      start_date || project.start_date, comment || project.comment, req.params.id]);

    const updated = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE project - admin only
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const project = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await runAsync('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign project to employee
router.post('/:id/assign', verifyToken, requireAdmin, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const project = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const user = await getAsync('SELECT id, name FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await runAsync(`
      UPDATE projects
      SET responsible_id = ?, responsible_name = ?
      WHERE id = ?
    `, [userId, user.name, req.params.id]);

    const updated = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
