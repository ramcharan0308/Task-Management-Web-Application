const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Helper: check project membership
const getMembership = (projectId, userId) =>
  db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);

// GET /api/tasks?project_id=X - list tasks for a project
router.get('/', (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  const membership = getMembership(project_id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  let query = `
    SELECT t.*, 
      u1.name as assigned_to_name, u1.email as assigned_to_email,
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.project_id = ?
  `;

  const tasks = db.prepare(query + ' ORDER BY t.created_at DESC').all(project_id);
  res.json(tasks);
});

// POST /api/tasks - create task (admin only)
router.post('/', (req, res) => {
  const { project_id, title, description, due_date, priority, assigned_to } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ error: 'project_id and title are required' });
  }

  const membership = getMembership(project_id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });
  if (membership.role !== 'admin') return res.status(403).json({ error: 'Only admins can create tasks' });

  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  // Validate assigned_to is a project member
  if (assigned_to) {
    const assigneeMember = getMembership(project_id, assigned_to);
    if (!assigneeMember) return res.status(400).json({ error: 'Assigned user is not a project member' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_to, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, title.trim(), description?.trim() || null, due_date || null, priority || 'medium', assigned_to || null, req.user.id);

  const task = db.prepare(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// PATCH /api/tasks/:id - update task
router.patch('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = getMembership(task.project_id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  const isAdmin = membership.role === 'admin';
  const isAssignee = task.assigned_to === req.user.id;

  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ error: 'You can only update tasks assigned to you' });
  }

  const { title, description, due_date, priority, status, assigned_to } = req.body;

  // Members can only update status
  if (!isAdmin && (title || description || due_date || priority || assigned_to !== undefined)) {
    return res.status(403).json({ error: 'Members can only update task status' });
  }

  const validStatuses = ['todo', 'inprogress', 'done'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updates = {
    title: title?.trim() ?? task.title,
    description: description?.trim() ?? task.description,
    due_date: due_date ?? task.due_date,
    priority: priority ?? task.priority,
    status: status ?? task.status,
    assigned_to: assigned_to !== undefined ? (assigned_to || null) : task.assigned_to,
    updated_at: new Date().toISOString()
  };

  db.prepare(`
    UPDATE tasks SET title=?, description=?, due_date=?, priority=?, status=?, assigned_to=?, updated_at=?
    WHERE id=?
  `).run(updates.title, updates.description, updates.due_date, updates.priority, updates.status, updates.assigned_to, updates.updated_at, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u1.name as assigned_to_name, u1.email as assigned_to_email, u2.name as created_by_name
    FROM tasks t LEFT JOIN users u1 ON t.assigned_to = u1.id LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /api/tasks/:id - admin only
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = getMembership(task.project_id, req.user.id);
  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete tasks' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
