const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await allAsync('SELECT * FROM tasks ORDER BY id DESC');
    } else {
      // Employees see only tasks assigned to them
      tasks = await allAsync('SELECT * FROM tasks WHERE responsible_id = ? ORDER BY id DESC', [req.user.id]);
    }
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment } = req.body;

  if (!task_name) {
    return res.status(400).json({ error: 'Task name required' });
  }

  try {
    // Ensure employee can only create tasks for themselves, admin can create for anyone
    const finalResponsibleId = req.user.role === 'admin' && responsible_id ? responsible_id : req.user.id;
    const finalResponsibleName = req.user.role === 'admin' && responsible_name ? responsible_name : req.user.name;

    await runAsync(`
      INSERT INTO tasks (project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [project_id || null, project_name || '', task_name, start_date || '', end_date || '', finalResponsibleId, finalResponsibleName, stage || '', comment || '']);

    const task = await getAsync('SELECT * FROM tasks WHERE task_name = ? AND responsible_id = ? ORDER BY id DESC LIMIT 1', [task_name, finalResponsibleId]);
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment } = req.body;

  try {
    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only admin or the responsible person can edit the task
    if (req.user.role !== 'admin' && task.responsible_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only an admin may reassign a task to a different responsible user
    const finalResponsibleId = req.user.role === 'admin' && responsible_id !== undefined
      ? responsible_id : task.responsible_id;
    const finalResponsibleName = req.user.role === 'admin' && responsible_name
      ? responsible_name : task.responsible_name;

    await runAsync(`
      UPDATE tasks
      SET project_id = ?, project_name = ?, task_name = ?, start_date = ?, end_date = ?, responsible_id = ?, responsible_name = ?, stage = ?, comment = ?
      WHERE id = ?
    `, [project_id !== undefined ? project_id : task.project_id, project_name || task.project_name, task_name || task.task_name,
      start_date || task.start_date, end_date || task.end_date, finalResponsibleId,
      finalResponsibleName, stage || task.stage, comment || task.comment, req.params.id]);

    const updated = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Only admin can delete tasks
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await runAsync('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
