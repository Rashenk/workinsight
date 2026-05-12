const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await allAsync('SELECT * FROM tasks ORDER BY id DESC');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment } = req.body;

  if (!task_name) {
    return res.status(400).json({ error: 'Task name required' });
  }

  try {
    await runAsync(`
      INSERT INTO tasks (project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [project_id || null, project_name || '', task_name, start_date || '', end_date || '', responsible_id || null, responsible_name || '', stage || '', comment || '']);

    const task = await getAsync('SELECT * FROM tasks WHERE task_name = ? ORDER BY id DESC LIMIT 1', [task_name]);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment } = req.body;

  try {
    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await runAsync(`
      UPDATE tasks
      SET project_id = ?, project_name = ?, task_name = ?, start_date = ?, end_date = ?, responsible_id = ?, responsible_name = ?, stage = ?, comment = ?
      WHERE id = ?
    `, [project_id !== undefined ? project_id : task.project_id, project_name || task.project_name, task_name || task.task_name,
      start_date || task.start_date, end_date || task.end_date, responsible_id !== undefined ? responsible_id : task.responsible_id,
      responsible_name || task.responsible_name, stage || task.stage, comment || task.comment, req.params.id]);

    const updated = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await runAsync('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
