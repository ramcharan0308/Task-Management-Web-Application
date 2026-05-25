import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { todo: '#7878a0', inprogress: '#7c6af7', done: '#4ade80' };
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const PRIORITY_COLORS = { low: '#4ade80', medium: '#facc15', high: '#f87171' };

const s = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { marginBottom: '32px' },
  h1: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  sub: { fontSize: '14px', color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px',
  },
  statLabel: { fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: 700, lineHeight: 1 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' },
  chartCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '24px',
  },
  chartTitle: { fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '20px' },
  overdueCard: {
    background: 'var(--bg-card)', border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '16px',
  },
  overdueTitle: { fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--red)', letterSpacing: '1px', marginBottom: '16px' },
  taskRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 0', borderBottom: '1px solid var(--border)',
  },
  badge: {
    fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 8px',
    borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
  },
  legend: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' },
  legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ ...s.page, color: 'var(--text-muted)', paddingTop: '80px', textAlign: 'center' }}>Loading dashboard...</div>;

  const byStatus = data?.byStatus || [];
  const statusMap = Object.fromEntries(byStatus.map(s => [s.status, s.count]));
  const pieData = ['todo', 'inprogress', 'done'].map(k => ({ name: STATUS_LABELS[k], value: statusMap[k] || 0, key: k }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={s.sub}>Here's what's happening across your projects.</p>
      </div>

      <div style={s.grid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>TOTAL TASKS</div>
          <div style={{ ...s.statValue, color: 'var(--accent-bright)' }}>{data?.totalTasks ?? 0}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>IN PROGRESS</div>
          <div style={{ ...s.statValue, color: 'var(--accent)' }}>{statusMap.inprogress || 0}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>COMPLETED</div>
          <div style={{ ...s.statValue, color: 'var(--green)' }}>{statusMap.done || 0}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>OVERDUE</div>
          <div style={{ ...s.statValue, color: data?.overdueCount > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{data?.overdueCount ?? 0}</div>
        </div>
      </div>

      <div style={s.chartsRow}>
        <div style={s.chartCard}>
          <div style={s.chartTitle}>TASKS BY STATUS</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={s.legend}>
            {pieData.map(d => (
              <div key={d.key} style={s.legendItem}>
                <div style={{ ...s.legendDot, background: STATUS_COLORS[d.key] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div style={s.chartCard}>
          <div style={s.chartTitle}>TASKS PER USER</div>
          {(data?.tasksByUser || []).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', paddingTop: '40px', textAlign: 'center' }}>
              No assigned tasks yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.tasksByUser} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }} />
                <Bar dataKey="task_count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={s.chartsRow}>
        <div style={s.chartCard}>
          <div style={s.chartTitle}>PROJECTS</div>
          {data?.projects?.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', paddingTop: '40px', textAlign: 'center' }}>
              No projects yet.{' '}
              <span style={{ color: 'var(--accent-bright)', cursor: 'pointer' }} onClick={() => navigate('/projects')}>Create one →</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(data?.projects || []).map(p => (
                <div
                  key={p.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', cursor: 'pointer', border: '1px solid var(--border)' }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <span style={{ fontSize: '14px' }}>{p.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data?.overdueTasks?.length > 0 && (
        <div style={s.overdueCard}>
          <div style={s.overdueTitle}>⚠ OVERDUE TASKS ({data.overdueTasks.length})</div>
          {data.overdueTasks.map(t => (
            <div key={t.id} style={s.taskRow}>
              <span style={{ ...s.badge, background: 'var(--red-dim)', color: 'var(--red)' }}>{t.priority}</span>
              <span style={{ flex: 1, fontSize: '14px' }}>{t.title}</span>
              {t.project_name && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.project_name}</span>}
              <span style={{ fontSize: '12px', color: 'var(--red)', fontFamily: 'var(--mono)' }}>{t.due_date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
