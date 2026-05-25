const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects - list all projects for current user
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, pm.role, u.name as creator_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    JOIN users u ON p.created_by = u.id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// POST /api/projects - create project
router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const result = db.prepare(
    'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
  ).run(name.trim(), description?.trim() || null, req.user.id);

  // Creator becomes admin
  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...project, role: 'admin' });
});

// GET /api/projects/:id - project details
router.get('/:id', (req, res) => {
  const member = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json({ ...project, role: member.role, members });
});

// POST /api/projects/:id/members - add member (admin only)
router.post('/:id/members', (req, res) => {
  const admin = db.prepare(
    "SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'"
  ).get(req.params.id, req.user.id);
  if (!admin) return res.status(403).json({ error: 'Only admins can add members' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const userToAdd = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!userToAdd) return res.status(404).json({ error: 'User not found with that email' });

  const existing = db.prepare(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(req.params.id, userToAdd.id);
  if (existing) return res.status(409).json({ error: 'User is already a member' });

  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(req.params.id, userToAdd.id, 'member');

  res.status(201).json({ message: 'Member added', user: userToAdd });
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', (req, res) => {
  const admin = db.prepare(
    "SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'"
  ).get(req.params.id, req.user.id);
  if (!admin) return res.status(403).json({ error: 'Only admins can remove members' });

  if (parseInt(req.params.userId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot remove yourself from the project' });
  }

  db.prepare(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
  ).run(req.params.id, req.params.userId);

  res.json({ message: 'Member removed' });
});

// DELETE /api/projects/:id - delete project (admin only)
router.delete('/:id', (req, res) => {
  const admin = db.prepare(
    "SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'"
  ).get(req.params.id, req.user.id);
  if (!admin) return res.status(403).json({ error: 'Only admins can delete projects' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

module.exports = router;
