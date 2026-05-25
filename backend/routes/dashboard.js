const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard?project_id=X
router.get('/', (req, res) => {
  const { project_id } = req.query;
  const userId = req.user.id;

  if (project_id) {
    // Project-specific dashboard
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(project_id, userId);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(project_id).count;

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
    `).all(project_id);

    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY priority
    `).all(project_id);

    const overdueTasks = db.prepare(`
      SELECT t.*, u.name as assigned_to_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ? AND t.due_date < date('now') AND t.status != 'done'
      ORDER BY t.due_date ASC
    `).all(project_id);

    const tasksByUser = db.prepare(`
      SELECT u.id, u.name, COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN t.status = 'inprogress' THEN 1 ELSE 0 END) as inprogress_count,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN tasks t ON t.assigned_to = u.id AND t.project_id = ?
      WHERE pm.project_id = ?
      GROUP BY u.id, u.name
    `).all(project_id, project_id);

    return res.json({
      totalTasks,
      byStatus,
      byPriority,
      overdueTasks,
      tasksByUser,
      overdueCount: overdueTasks.length
    });
  }

  // Global dashboard across all user's projects
  const projects = db.prepare(`
    SELECT p.id, p.name FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
  `).all(userId);

  const projectIds = projects.map(p => p.id);

  if (projectIds.length === 0) {
    return res.json({
      totalTasks: 0, byStatus: [], byPriority: [], overdueTasks: [], overdueCount: 0, tasksByUser: [], projects: []
    });
  }

  const placeholders = projectIds.map(() => '?').join(',');

  const totalTasks = db.prepare(
    `SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`
  ).get(...projectIds).count;

  const byStatus = db.prepare(
    `SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY status`
  ).all(...projectIds);

  const overdueTasks = db.prepare(
    `SELECT t.*, u.name as assigned_to_name, p.name as project_name
     FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN projects p ON t.project_id = p.id
     WHERE t.project_id IN (${placeholders}) AND t.due_date < date('now') AND t.status != 'done'
     ORDER BY t.due_date ASC LIMIT 10`
  ).all(...projectIds);

  const tasksByUser = db.prepare(
    `SELECT u.id, u.name, COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count,
      SUM(CASE WHEN t.status = 'inprogress' THEN 1 ELSE 0 END) as inprogress_count,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count
     FROM tasks t
     JOIN users u ON t.assigned_to = u.id
     WHERE t.project_id IN (${placeholders})
     GROUP BY u.id, u.name
     ORDER BY task_count DESC`
  ).all(...projectIds);

  res.json({
    totalTasks,
    byStatus,
    overdueTasks,
    overdueCount: overdueTasks.length,
    tasksByUser,
    projectCount: projects.length,
    projects
  });
});

module.exports = router;
