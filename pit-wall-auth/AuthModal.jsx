import { useState, useEffect } from 'react';
import { signIn, signUp, signOut } from './supabase';

const T = {
  bg: '#08080c',
  surface: '#101018',
  surface2: '#181824',
  border: '#222232',
  text: '#f2f2f8',
  muted: '#707090',
  accent: '#ff2d2d',
  accent2: '#ff4040',
};

export default function AuthModal({ isOpen, onClose, onUser }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'profile'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEmail(''); setPassword(''); setUsername('');
      setError(''); setSuccess(''); setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { data, error } = await signIn(email, password);
      if (error) { setError(error.message); setLoading(false); return; }
      onUser(data.user);
      onClose();
    } else if (mode === 'signup') {
      if (!username.trim()) { setError('Username is required'); setLoading(false); return; }
      const { data, error } = await signUp(email, password, username);
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess('Check your email to confirm! Account created.');
      setMode('login');
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError('');
    // Guest mode: create a random guest user locally
    onUser({ id: 'guest', email: 'guest@pitwall', username: 'Guest' });
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: '40px 40px 32px',
        width: 400,
        maxWidth: '90vw',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: T.muted,
          fontSize: 20, cursor: 'pointer', lineHeight: 1,
        }}>×</button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: T.accent, textTransform: 'uppercase', marginBottom: 8 }}>Pit Wall</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text }}>
            {mode === 'login' ? 'Welcome back.' : 'Join Pit Wall.'}
          </h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: `1px solid ${T.border}` }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '10px', background: 'none', border: 'none',
                color: mode === m ? T.text : T.muted, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', textTransform: 'capitalize',
                borderBottom: `2px solid ${mode === m ? T.accent : 'transparent'}`,
                marginBottom: -1,
              }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your_driver_name"
                style={{ width: '100%', padding: '12px 14px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@email.com"
              style={{ width: '100%', padding: '12px 14px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: T.accent, fontSize: 13, marginBottom: 16, padding: '10px 12px', background: 'rgba(255,45,45,0.1)', borderRadius: 6, border: `1px solid rgba(255,45,45,0.2)` }}>{error}</div>}
          {success && <div style={{ color: '#22c55e', fontSize: 13, marginBottom: 16, padding: '10px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 6 }}>{success}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', background: loading ? T.muted : T.accent,
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.15s, background 0.15s',
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={handleGuest} style={{
            background: 'none', border: `1px solid ${T.border}`,
            color: T.muted, fontSize: 12, fontWeight: 600,
            padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          }}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
