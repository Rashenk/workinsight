const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Project.done_reels is the sum of reels_published across that project's reports.
// Also auto-transitions stage 'В работе' → 'Готово' when 100% reached.
async function recalcProjectDoneReels(projectId) {
  if (!projectId) return;
  await runAsync(
    `UPDATE projects
     SET done_reels = COALESCE((SELECT SUM(reels_published) FROM reports WHERE project_id = ?), 0)
     WHERE id = ?`,
    [projectId, projectId]
  );
  const project = await getAsync('SELECT done_reels, plan_reels, stage FROM projects WHERE id = ?', [projectId]);
  if (project && project.stage === 'В работе' && project.plan_reels > 0 && project.done_reels >= project.plan_reels) {
    await runAsync(`UPDATE projects SET stage = 'Готово' WHERE id = ?`, [projectId]);
  }
}

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
    const newReels = parseInt(reels_published, 10) || 0;

    if (project_id) {
      const project = await getAsync('SELECT plan_reels, done_reels, name FROM projects WHERE id = ?', [project_id]);
      if (project && project.plan_reels > 0) {
        const remaining = project.plan_reels - project.done_reels;
        if (newReels > remaining) {
          return res.status(400).json({
            error: `Нельзя отправить больше, чем осталось по плану. Проект «${project.name}»: план ${project.plan_reels}, уже сделано ${project.done_reels}, осталось ${Math.max(0, remaining)}.`
          });
        }
      }
    }

    await runAsync(`
      INSERT INTO reports (user_id, user_name, project_id, project_name, date, time, reels_created, reels_published, platforms, comment, screenshot_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, req.user.name, project_id || null, project_name || '', date || '', time || '', reels_created || 0, newReels, platforms || '', comment || '', screenshot_data || '']);

    const report = await getAsync('SELECT * FROM reports ORDER BY id DESC LIMIT 1');
    await recalcProjectDoneReels(report.project_id);
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

    const finalProjectId = project_id !== undefined ? project_id : report.project_id;
    const finalReels = reels_published !== undefined ? (parseInt(reels_published, 10) || 0) : report.reels_published;

    if (finalProjectId) {
      const project = await getAsync('SELECT plan_reels, done_reels, name FROM projects WHERE id = ?', [finalProjectId]);
      if (project && project.plan_reels > 0) {
        // If the project didn't change, subtract this report's previous contribution
        const ownContribution = finalProjectId === report.project_id ? (report.reels_published || 0) : 0;
        const remaining = project.plan_reels - (project.done_reels - ownContribution);
        if (finalReels > remaining) {
          return res.status(400).json({
            error: `Нельзя отправить больше, чем осталось по плану. Проект «${project.name}»: план ${project.plan_reels}, доступно ${Math.max(0, remaining)}.`
          });
        }
      }
    }

    await runAsync(`
      UPDATE reports
      SET project_id = ?, project_name = ?, date = ?, time = ?, reels_created = ?, reels_published = ?, platforms = ?, comment = ?, screenshot_data = ?
      WHERE id = ?
    `, [finalProjectId, project_name || report.project_name,
      date || report.date, time || report.time, reels_created !== undefined ? reels_created : report.reels_created,
      finalReels, platforms || report.platforms,
      comment || report.comment, screenshot_data || report.screenshot_data, req.params.id]);

    const updated = await getAsync('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    // Recalc both old and new project if the report was reassigned
    await recalcProjectDoneReels(report.project_id);
    if (updated.project_id && updated.project_id !== report.project_id) {
      await recalcProjectDoneReels(updated.project_id);
    }
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
    await recalcProjectDoneReels(report.project_id);
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
