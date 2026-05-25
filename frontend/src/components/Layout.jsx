import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },
  sidebar: {
    width: '220px', minHeight: '100vh', background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)', padding: '24px 16px',
    display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0,
  },
  logo: {
    fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '3px',
    color: 'var(--accent)', textTransform: 'uppercase', padding: '0 8px',
    marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', borderRadius: 'var(--radius)',
    fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)',
    transition: 'all 0.15s', cursor: 'pointer', textDecoration: 'none',
    border: 'none', background: 'none', width: '100%',
  },
  navLinkActive: {
    color: 'var(--text)', background: 'var(--accent-dim)',
  },
  spacer: { flex: 1 },
  user: {
    borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px',
  },
  userInfo: {
    padding: '8px 12px', display: 'flex', flexDirection: 'column',
    gap: '2px', marginBottom: '4px',
  },
  userName: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  userEmail: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', borderRadius: 'var(--radius)',
    fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer',
    background: 'none', border: 'none', width: '100%', transition: 'all 0.15s',
  },
  main: { flex: 1, overflow: 'auto' },
};

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.navLinkActive : {}) })}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}><div style={s.dot} /> TaskFlow</div>
        <NavItem to="/" icon="⬡" label="Dashboard" />
        <NavItem to="/projects" icon="◈" label="Projects" />
        <NavItem to="/my-tasks" icon="◻" label="My Tasks" />
        <div style={s.spacer} />
        <div style={s.user}>
          <div style={s.userInfo}>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
