'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken, setUser } from '../../lib/api';

export default function SignInPage() {
  const router = useRouter();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-8 shadow-card">
        <h1 className="font-display text-2xl text-white">Sign In</h1>
        <p className="mt-1 text-sm text-gray-400">Every workday, perfectly aligned.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Login ID / Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
              value={loginIdOrEmail}
              onChange={(e) => setLoginIdOrEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-absent">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-accent to-accent2 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent2 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
