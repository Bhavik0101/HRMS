'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken, setUser } from '../../lib/api';
import { Building2, User2, Mail, Phone, Lock, Sparkles } from 'lucide-react';

function GlassField({ label, icon: Icon, type = 'text', value, onChange, required = false, placeholder = '' }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.7)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'rgba(139,92,246,0.6)' }} />
        )}
        <input
          type={type}
          className="glass-input w-full py-3 text-sm"
          style={{ paddingLeft: Icon ? '2.5rem' : '0.875rem', paddingRight:'0.875rem' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '', firstName: '', lastName: '',
    email: '', phone: '', password: '', confirmPassword: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
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
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background:'var(--t-bg)' }}
    >
      <div className="aurora-orb" style={{ width:600, height:600, top:-250, left:-150, background:'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 65%)' }} />
      <div className="aurora-orb" style={{ width:500, height:500, bottom:-200, right:-100, background:'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 65%)', animationDelay:'5s' }} />

      <div className="relative w-full max-w-md z-10 animate-in">
        <div style={{ position:'absolute', inset:-2, borderRadius:24, background:'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(192,132,252,0.15), transparent)', filter:'blur(2px)', zIndex:-1 }} />

        <div style={{
          background:'var(--t-glass-bg)',
          backdropFilter:'blur(32px) saturate(1.5)',
          WebkitBackdropFilter:'blur(32px) saturate(1.5)',
          border:'1px solid var(--t-border)',
          borderRadius:22,
          boxShadow:'0 24px 64px var(--t-card-shadow), inset 0 1px 0 rgba(255,255,255,0.08)',
          padding:'2.5rem',
        }}>
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ background:'linear-gradient(135deg,#8B5CF6,#C084FC)', boxShadow:'0 4px 14px rgba(139,92,246,0.5)' }}>HR</span>
            <span className="font-display text-lg font-bold"><span style={{color:'#C084FC'}}>Odoo</span><span className="text-white"> HRMS</span></span>
          </div>

          <h1 className="font-display text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-sm mb-6" style={{ color:'var(--t-text-muted)' }}>Register your company to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassField label="Company Name" icon={Building2} value={form.companyName} onChange={(v) => update('companyName', v)} required placeholder="Acme Corp" />
            <div className="grid grid-cols-2 gap-3">
              <GlassField label="First Name" icon={User2} value={form.firstName} onChange={(v) => update('firstName', v)} required placeholder="John" />
              <GlassField label="Last Name" value={form.lastName} onChange={(v) => update('lastName', v)} required placeholder="Doe" />
            </div>
            <GlassField label="Email" icon={Mail} type="email" value={form.email} onChange={(v) => update('email', v)} required placeholder="you@company.com" />
            <GlassField label="Phone" icon={Phone} value={form.phone} onChange={(v) => update('phone', v)} placeholder="+91 98765 43210" />
            <GlassField label="Password" icon={Lock} type="password" value={form.password} onChange={(v) => update('password', v)} required placeholder="••••••••" />
            <GlassField label="Confirm Password" icon={Lock} type="password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} required placeholder="••••••••" />

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#FCA5A5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-glow w-full py-3 text-sm font-semibold text-white flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
              ) : (
                <><Sparkles className="w-4 h-4" />Create Account</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color:'var(--t-text-dim)' }}>
            Already have an account?{' '}
            <Link href="/signin" className="font-medium hover:opacity-80 transition-opacity" style={{ color:'#C084FC' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
