'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken, setUser } from '../../lib/api';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword]             = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.signin({ loginIdOrEmail, password });
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--t-bg)' }}
    >
      {/* Aurora orbs */}
      <div className="aurora-orb" style={{ width:700, height:700, top:-300, left:-200, background:'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)' }} />
      <div className="aurora-orb" style={{ width:500, height:500, bottom:-200, right:-100, background:'radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 65%)', animationDelay:'5s' }} />

      <div className="relative w-full max-w-sm z-10 animate-in">
        {/* Glow ring behind card */}
        <div
          style={{
            position:'absolute', inset:-2,
            borderRadius:24,
            background:'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(192,132,252,0.2), transparent)',
            filter:'blur(2px)',
            zIndex:-1,
          }}
        />

        {/* Card */}
        <div
          style={{
            background:'var(--t-glass-bg)',
            backdropFilter:'blur(32px) saturate(1.5)',
            WebkitBackdropFilter:'blur(32px) saturate(1.5)',
            border:'1px solid var(--t-border)',
            borderRadius:22,
            boxShadow:'0 24px 64px var(--t-card-shadow), inset 0 1px 0 rgba(255,255,255,0.08)',
            padding: '2.5rem',
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{
                  background:'linear-gradient(135deg,#8B5CF6,#C084FC)',
                  boxShadow:'0 4px 14px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >HR</span>
              <span className="font-display text-lg font-bold">
                <span style={{color:'#C084FC'}}>Odoo</span>
                <span className="text-white"> HRMS</span>
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm" style={{ color:'var(--t-text-muted)' }}>
              Every workday, perfectly aligned.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login ID field */}
            <div>
              <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.7)' }}>
                Login ID / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'rgba(139,92,246,0.6)' }} />
                <input
                  className="glass-input w-full pl-10 pr-4 py-3 text-sm"
                  placeholder="your@email.com"
                  value={loginIdOrEmail}
                  onChange={(e) => setLoginIdOrEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.7)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'rgba(139,92,246,0.6)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="glass-input w-full pl-10 pr-10 py-3 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color:'rgba(139,92,246,0.6)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-2.5 text-sm"
                style={{
                  background:'rgba(239,68,68,0.1)',
                  border:'1px solid rgba(239,68,68,0.25)',
                  color:'#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-3 text-sm font-semibold text-white mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color:'var(--t-text-dim)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium transition-colors hover:opacity-80" style={{ color:'#C084FC' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
