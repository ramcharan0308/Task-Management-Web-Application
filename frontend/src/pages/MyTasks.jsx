import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text-muted)', inprogress: 'var(--accent)', done: 'var(--green)' };
const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };
const PRIORITY_BG = { low: 'var(--green-dim)', medium: 'var(--yellow-dim)', high: 'var(--red-dim)' };

const s = {
  page: { padding: '32px', maxWidth: '800px' },
  h1: { fontSize: '22px', fontWeight: 700, marginBottom: '6px' },
  sub: { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' },
  filter: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--mono)', cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', transition: 'all 0.15s' },
  filterBtnActive: { background: 'var(--accent-dim)', borderColor: 'var(--accent)', color: 'var(--accent-bright)' },
  taskCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '16px 20px', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px',
  },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0 },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: '14px', fontWeight: 500, marginBottom: '6px' },
  taskDesc: { fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 },
  taskMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  badge: { fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.3px' },
  statusSelect: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '6px 10px', color: 'var(--text)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--mono)',
  },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)' },
};

export default function MyTasks() {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const projRes = await api.get('/projects');
        setProjects(projRes.data);
        const taskArrays = await Promise.all(
          projRes.data.map(p => api.get(`/tasks?project_id=${p.id}`).then(r => r.data.map(t => ({ ...t, project_name: p.name, project_id: p.id }))))
        );
        const mine = taskArrays.flat().filter(t => t.assigned_to === user.id);
        setAllTasks(mine);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [user.id]);

  const handleStatusChange = async (task, newStatus) => {
    await api.patch(`/tasks/${task.id}`, { status: newStatus });
    setAllTasks(tasks => tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const filtered = allTasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
    return t.status === filter;
  });

  const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

  const filters = [
    { key: 'all', label: `All (${allTasks.length})` },
    { key: 'todo', label: `To Do (${allTasks.filter(t => t.status === 'todo').length})` },
    { key: 'inprogress', label: `In Progress (${allTasks.filter(t => t.status === 'inprogress').length})` },
    { key: 'done', label: `Done (${allTasks.filter(t => t.status === 'done').length})` },
    ...(overdue > 0 ? [{ key: 'overdue', label: `⚠ Overdue (${overdue})` }] : []),
  ];

  if (loading) return <div style={{ ...s.page, color: 'var(--text-muted)', paddingTop: '80px', textAlign: 'center' }}>Loading tasks...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.h1}>My Tasks</h1>
      <p style={s.sub}>Tasks assigned to you across all projects.</p>

      <div style={s.filter}>
        {filters.map(f => (
          <button
            key={f.key}
            style={{ ...s.filterBtn, ...(filter === f.key ? s.filterBtnActive : {}), ...(f.key === 'overdue' ? { borderColor: 'rgba(248,113,113,0.4)', color: filter === f.key ? 'var(--accent-bright)' : 'var(--red)' } : {}) }}
            onClick={() => setFilter(f.key)}
          >{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '15px', marginBottom: '6px' }}>
            {filter === 'all' ? 'No tasks assigned to you yet' : `No ${filter} tasks`}
          </p>
        </div>
      ) : (
        filtered.map(task => (
          <div key={task.id} style={s.taskCard}>
            <div style={{ ...s.statusDot, background: STATUS_COLORS[task.status] }} />
            <div style={s.taskBody}>
              <div style={s.taskTitle}>{task.title}</div>
              {task.description && <div style={s.taskDesc}>{task.description}</div>}
              <div style={s.taskMeta}>
                <span style={{ ...s.badge, background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                <span
                  style={{ ...s.badge, background: 'var(--accent-dim)', color: 'var(--accent-bright)', cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${task.project_id}`)}
                >{task.project_name}</span>
                {task.due_date && (
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--red)' : 'var(--text-muted)' }}>
                    Due {task.due_date}
                  </span>
                )}
              </div>
            </div>
            <select
              style={s.statusSelect}
              value={task.status}
              onChange={e => handleStatusChange(task, e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
}
