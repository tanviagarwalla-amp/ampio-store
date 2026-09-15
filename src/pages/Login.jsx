import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import { useStore } from '../store/StoreContext';

const ART = [
  { type: 'kurta', color: '#33456b' },
  { type: 'sneakers', color: '#f1efe9' },
  { type: 'handbag', color: '#8d5a2b' },
  { type: 'dress', color: '#d98a92' },
];

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, signup } = useStore();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await signup(form);
      navigate(params.get('next') || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-art" aria-hidden="true">
        {ART.map((a) => (
          <ProductArt key={a.type} type={a.type} color={a.color} alt="" />
        ))}
      </div>

      <div className="auth-form">
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
            Log in
          </button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
            Sign up
          </button>
        </div>

        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p>
          {mode === 'login'
            ? 'Log in to sync your bag, wishlist and order history.'
            : 'One account for your bag, wishlist and orders.'}
        </p>

        {mode === 'login' && (
          <div className="demo-creds">
            Demo account — email <code>demo@ampio.test</code> · password <code>ampio1234</code>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => setForm({ name: '', email: 'demo@ampio.test', password: 'ampio1234' })}
              >
                Fill demo credentials
              </button>
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field-grid">
            {mode === 'signup' && (
              <div className="field wide">
                <label htmlFor="name">Full name</label>
                <input id="name" value={form.name} onChange={set('name')} autoComplete="name" />
              </div>
            )}
            <div className="field wide">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="field wide">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={busy}>
            {busy && <span className="spinner" />}
            {busy ? 'Just a moment…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="mock-note" style={{ marginTop: 20 }}>
          Mock authentication — accounts live in this browser's localStorage only. Never use a real password
          here.
        </div>

        <p className="muted" style={{ fontSize: 13 }}>
          {mode === 'login' ? (
            <>
              New to AMPIO?{' '}
              <button type="button" className="btn-link" onClick={() => setMode('signup')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="btn-link" onClick={() => setMode('login')}>
                Log in
              </button>
            </>
          )}
          {' · '}
          <Link to="/">Back to store</Link>
        </p>
      </div>
    </div>
  );
}
