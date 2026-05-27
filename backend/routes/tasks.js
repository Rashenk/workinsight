const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await allAsync('SELECT * FROM tasks ORDER BY id DESC');
    } else {
      tasks = await allAsync('SELECT * FROM tasks WHERE responsible_id = ? ORDER BY id DESC', [req.user.id]);
    }
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Task responsible is always inherited from the project's responsible.
// Look up the project and derive responsible_id / responsible_name from it.
async function resolveProjectResponsible(projectId) {
  if (!projectId) return { id: null, name: '', project_name: '' };
  const proj = await getAsync(
    'SELECT id, name, responsible_id, responsible_name FROM projects WHERE id = ?',
    [projectId]
  );
  if (!proj) return null;
  return { id: proj.responsible_id, name: proj.responsible_name || '', project_name: proj.name || '' };
}

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { project_id, task_name, start_date, end_date, stage, comment } = req.body;

  if (!task_name) {
    return res.status(400).json({ error: 'Task name required' });
  }
  if (!project_id) {
    return res.status(400).json({ error: 'Project required' });
  }

  try {
    const owner = await resolveProjectResponsible(project_id);
    if (!owner) {
      return res.status(400).json({ error: 'Project not found' });
    }

    await runAsync(`
      INSERT INTO tasks (project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [project_id, owner.project_name, task_name, start_date || '', end_date || '', owner.id, owner.name, stage || '', comment || '']);

    const task = await getAsync('SELECT * FROM tasks ORDER BY id DESC LIMIT 1');
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { project_id, task_name, start_date, end_date, stage, comment } = req.body;

  try {
    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const finalProjectId = project_id !== undefined ? project_id : task.project_id;
    const owner = await resolveProjectResponsible(finalProjectId);
    if (!owner) {
      return res.status(400).json({ error: 'Project not found' });
    }

    await runAsync(`
      UPDATE tasks
      SET project_id = ?, project_name = ?, task_name = ?, start_date = ?, end_date = ?, responsible_id = ?, responsible_name = ?, stage = ?, comment = ?
      WHERE id = ?
    `, [finalProjectId, owner.project_name, task_name || task.task_name,
      start_date || task.start_date, end_date || task.end_date,
      owner.id, owner.name,
      stage || task.stage, comment || task.comment, req.params.id]);

    const updated = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
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
