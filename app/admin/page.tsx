'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Background Decoration */}
      <div className={styles.loginBg}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
      </div>

      <div className={styles.loginCard}>
        {/* Logo */}
        <div className={styles.loginLogo}>
          <div className={styles.logoIcon}>🍱</div>
          <h1 className={styles.logoText}>TRC<span className={styles.logoSub}>Admin</span></h1>
        </div>

        <p className={styles.loginTagline}>Welcome back! Sign in to manage your cafe.</p>

        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>👤</span>
              <input
                className={`form-input ${styles.loginInput}`}
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                className={`form-input ${styles.loginInput}`}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className={styles.showPassBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className={`btn btn-primary btn-full btn-lg ${styles.loginBtn}`} disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p className={styles.loginHint}>
          For customers, visit the{' '}
          <a href="/user" className={styles.userLink}>User Portal →</a>
        </p>
      </div>
    </div>
  );
}
