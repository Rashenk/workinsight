const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const MONTHS_RU = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
function currentPeriod() {
  const d = new Date();
  return `${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

// SQLite's LOWER() doesn't handle Cyrillic — do case-insensitive comparison in JS.
async function findProjectByName(name, excludeId = null) {
  const target = name.trim().toLocaleLowerCase('ru');
  const all = await allAsync('SELECT id, name FROM projects');
  return all.find(p => p.name.trim().toLocaleLowerCase('ru') === target && p.id !== excludeId) || null;
}

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
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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
    const trimmedName = name.trim();
    const duplicate = await findProjectByName(trimmedName);
    if (duplicate) {
      return res.status(400).json({ error: 'Проект с таким названием уже существует' });
    }

    // "Готово" allowed only at 100% of plan — new projects start at done=0
    if (stage === 'Готово' && (done_reels || 0) < (plan_reels || 0)) {
      return res.status(400).json({
        error: 'Этап «Готово» можно поставить только при 100% выполнении плана.'
      });
    }

    let responsible_name = '';
    const user = await getAsync('SELECT name FROM users WHERE id = ?', [responsible_id]);
    if (!user) {
      return res.status(400).json({ error: 'Responsible employee not found' });
    }
    responsible_name = user.name;

    await runAsync(`
      INSERT INTO projects (name, stage, responsible_id, responsible_name, platform, priority, plan_reels, done_reels, start_date, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [trimmedName, stage || '', responsible_id || null, responsible_name, platform || '', priority || 5, plan_reels || 0, done_reels || 0, start_date || '', comment || '']);

    const project = await getAsync('SELECT * FROM projects WHERE name = ? ORDER BY id DESC LIMIT 1', [trimmedName]);

    // Auto-create an empty analytics row so the project appears on the Analytics page
    await runAsync(`
      INSERT INTO analytics (project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)
    `, [project.id, project.name, project.responsible_id, project.responsible_name, start_date || '', currentPeriod()]);

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update project - admin only
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { name, stage, responsible_id, platform, priority, plan_reels, done_reels, start_date, comment, regular_posting_bonus } = req.body;

  try {
    const project = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (name && name.trim() !== project.name) {
      const duplicate = await findProjectByName(name.trim(), parseInt(req.params.id, 10));
      if (duplicate) {
        return res.status(400).json({ error: 'Проект с таким названием уже существует' });
      }
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

    const newResponsibleId = responsible_id !== undefined ? responsible_id : project.responsible_id;
    const newName = name ? name.trim() : project.name;
    const newStage = stage !== undefined ? stage : project.stage;
    const newPlan = plan_reels !== undefined ? plan_reels : project.plan_reels;
    const newDone = done_reels !== undefined ? done_reels : project.done_reels;

    // "Готово" allowed only when 100% of plan is done
    if (newStage === 'Готово' && newDone < newPlan) {
      return res.status(400).json({
        error: `Этап «Готово» можно поставить только при 100% выполнении плана. Сейчас сделано ${newDone} из ${newPlan}.`
      });
    }

    const newPostingBonus = regular_posting_bonus !== undefined
      ? (regular_posting_bonus ? 1 : 0)
      : project.regular_posting_bonus;

    await runAsync(`
      UPDATE projects
      SET name = ?, stage = ?, responsible_id = ?, responsible_name = ?, platform = ?, priority = ?, plan_reels = ?, done_reels = ?, regular_posting_bonus = ?, start_date = ?, comment = ?
      WHERE id = ?
    `, [newName, newStage, newResponsibleId,
      responsible_name, platform || project.platform, priority !== undefined ? priority : project.priority,
      newPlan, newDone, newPostingBonus,
      start_date || project.start_date, comment || project.comment, req.params.id]);

    // Keep tasks in sync: task.responsible always mirrors project.responsible
    await runAsync(
      'UPDATE tasks SET project_name = ?, responsible_id = ?, responsible_name = ? WHERE project_id = ?',
      [newName, newResponsibleId, responsible_name, req.params.id]
    );

    // Keep analytics in sync with project rename / reassignment
    await runAsync(
      'UPDATE analytics SET project_name = ?, responsible_id = ?, responsible_name = ? WHERE project_id = ?',
      [newName, newResponsibleId, responsible_name, req.params.id]
    );

    const updated = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE project - admin only
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const project = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await runAsync('DELETE FROM analytics WHERE project_id = ?', [req.params.id]);
    await runAsync('DELETE FROM tasks WHERE project_id = ?', [req.params.id]);
    await runAsync('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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

    // Cascade to tasks of this project
    await runAsync(
      'UPDATE tasks SET responsible_id = ?, responsible_name = ? WHERE project_id = ?',
      [userId, user.name, req.params.id]
    );

    // Cascade to analytics of this project
    await runAsync(
      'UPDATE analytics SET responsible_id = ?, responsible_name = ? WHERE project_id = ?',
      [userId, user.name, req.params.id]
    );

    const updated = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
