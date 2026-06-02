import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [mode, setMode] = useState('landing'); // landing | phone | email
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const { data } = await api.post(endpoint, form);
      login(data.user, data.token);
      toast.success(`Welcome${isRegister ? '' : ' back'}, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo login for testing
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', {
        email: 'demo@civicpulse.in', password: 'demo1234'
      });
      login(data.user, data.token);
      navigate('/');
    } catch {
      // If demo account doesn't exist, create it
      try {
        const { data } = await api.post('/api/auth/register', {
          name: 'Demo Citizen', email: 'demo@civicpulse.in', password: 'demo1234'
        });
        login(data.user, data.token);
        navigate('/');
      } catch (err2) {
        toast.error('Demo login failed. Please set up the backend first.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)'
      }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ paddingTop: 80, paddingBottom: 32, textAlign: 'center' }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 12px 40px rgba(59,130,246,0.35)'
        }}>
          <svg width="36" height="36" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 36 36">
            <path d="M18 3L3 11v9c0 7 6 13 15 15 9-2 15-8 15-15v-9L18 3z"/>
            <path d="M12 18l4 4 8-8" strokeWidth="2.5"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
          CivicsPulse
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
          Raise issues. Track resolutions.<br/>Hold your representative accountable.
        </p>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{
          display: 'flex',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 32
        }}
      >
        {[['12.4K', 'Issues Raised'], ['78%', 'Resolved'], ['227', 'Ward Reps']].map(([val, lbl]) => (
          <div key={lbl} style={{
            flex: 1, padding: '14px 8px', textAlign: 'center',
            borderRight: '1px solid var(--border)'
          }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </motion.div>

      {/* Auth form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {mode === 'landing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setMode('email')} style={{
              width: '100%', padding: '14px',
              background: 'var(--accent)',
              border: 'none', borderRadius: 14,
              fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
              <span style={{ fontSize: 16 }}>✉</span> Continue with Email
            </button>

            <button onClick={() => setMode('phone')} style={{
              width: '100%', padding: '14px',
              background: 'transparent', border: '1px solid var(--border2)',
              borderRadius: 14, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
              <span style={{ fontSize: 16 }}>📱</span> Continue with Phone (OTP)
            </button>

            <button onClick={handleDemoLogin} disabled={loading} style={{
              width: '100%', padding: '12px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 14, fontSize: 13, fontWeight: 600, color: 'var(--green2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {loading ? 'Loading...' : '⚡ Quick Demo — Explore the App'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              By continuing you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        )}

        {(mode === 'email' || mode === 'phone') && (
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <button type="button" onClick={() => setMode('landing')}
                style={{ color: 'var(--text3)', fontSize: 20 }}>←</button>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18 }}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </h2>
            </div>

            {isRegister && (
              <input placeholder="Full name" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            )}
            <input
              type="email" placeholder="Email address"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
            <input
              type="password" placeholder="Password (min 8 chars)"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required minLength={8}
            />

            <button type="submit" disabled={loading} style={{
              padding: 14, background: 'var(--accent)',
              border: 'none', borderRadius: 14,
              fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            <button type="button" onClick={() => setIsRegister(!isRegister)}
              style={{ fontSize: 13, color: 'var(--accent2)', textAlign: 'center' }}>
              {isRegister ? 'Already have an account? Sign in' : 'New here? Create account'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
