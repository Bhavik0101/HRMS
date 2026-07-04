'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken, setUser } from '../../lib/api';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const data = await api.signup(form);
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
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-8 shadow-card">
        <h1 className="font-display text-2xl text-white">Sign Up</h1>
        <p className="mt-1 text-sm text-gray-400">
          Register your company. Your Login ID will be generated automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Company Name" value={form.companyName} onChange={(v) => update('companyName', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" value={form.firstName} onChange={(v) => update('firstName', v)} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => update('lastName', v)} required />
          </div>
          <Field label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => update('password', v)}
            required
          />
          <Field
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(v) => update('confirmPassword', v)}
            required
          />

          {error && <p className="text-sm text-absent">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-accent to-accent2 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/signin" className="text-accent2 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
