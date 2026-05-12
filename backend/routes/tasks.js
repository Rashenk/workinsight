const express = require('express');
const { db } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET tasks
router.get('/', verifyToken, (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY id DESC').all();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create task
router.post('/', verifyToken, (req, res) => {
  const { project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment } = req.body;

  if (!task_name) {
    return res.status(400).json({ error: 'Task name required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO tasks (project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(project_id || null, project_name || '', task_name, start_date || '', end_date || '', responsible_id || null, responsible_name || '', stage || '', comment || '');

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id', verifyToken, (req, res) => {
  const { project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment } = req.body;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare(`
      UPDATE tasks
      SET project_id = ?, project_name = ?, task_name = ?, start_date = ?, end_date = ?, responsible_id = ?, responsible_name = ?, stage = ?, comment = ?
      WHERE id = ?
    `).run(project_id !== undefined ? project_id : task.project_id, project_name || task.project_name, task_name || task.task_name,
      start_date || task.start_date, end_date || task.end_date, responsible_id !== undefined ? responsible_id : task.responsible_id,
      responsible_name || task.responsible_name, stage || task.stage, comment || task.comment, req.params.id);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
