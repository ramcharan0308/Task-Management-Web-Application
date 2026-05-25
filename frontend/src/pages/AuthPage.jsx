import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
    backgroundSize: '60px 60px', opacity: 0.3,
  },
  glow: {
    position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
    width: '600px', height: '600px',
    background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '3px',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)',
  },
  h1: {
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '6px',
    lineHeight: 1.2,
  },
  sub: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '32px',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontFamily: 'var(--mono)',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    color: 'var(--text)',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    letterSpacing: '0.3px',
  },
  error: {
    background: 'var(--red-dim)',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--red)',
    marginBottom: '16px',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  link: {
    color: 'var(--accent-bright)',
    cursor: 'pointer',
    marginLeft: '4px',
    fontWeight: 500,
  },
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const r = await api.post(endpoint, payload);
      login(r.data.user, r.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={styles.page}>
      <div style={styles.bg}>
        <div style={styles.grid} />
        <div style={styles.glow} />
      </div>
      <div style={styles.card}>
        <div style={styles.logo}><div style={styles.dot} /> TaskFlow</div>
        <h1 style={styles.h1}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p style={styles.sub}>{mode === 'login' ? 'Sign in to manage your projects' : 'Start collaborating with your team'}</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label}>FULL NAME</label>
              <input style={styles.input} type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Jane Smith" required />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>EMAIL</label>
            <input style={styles.input} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@company.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input style={styles.input} type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" required />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div style={styles.toggle}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <span style={styles.link} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  );
}
