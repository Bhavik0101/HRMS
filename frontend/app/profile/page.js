'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser, setUser as saveUser } from '../../lib/api';
import { Lock, User2, CreditCard } from 'lucide-react';

const TABS = [
  { key:'personal', label:'Private Info',   icon: User2 },
  { key:'salary',   label:'Salary Info',    icon: CreditCard, adminOnly: true },
  { key:'security', label:'Security',       icon: Lock },
];

function GlassInput({ label, value, onChange, type = 'text', readonly = false, textarea = false }) {
  const sharedStyle = readonly ? {
    background: 'var(--t-code-bg)',
    border: '1px solid var(--t-code-border)',
    color: 'var(--t-text-muted)',
    borderRadius: 12,
    padding: '0.625rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  } : {
    background: 'var(--t-glass-input)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--t-border)',
    color: 'var(--t-text)',
    borderRadius: 12,
    padding: '0.625rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s',
  };

  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'var(--t-text-label)' }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          readOnly={readonly}
          style={{ ...sharedStyle, resize:'none' }}
          className="glass-input"
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          readOnly={readonly}
          style={sharedStyle}
          className={readonly ? '' : 'glass-input'}
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function SalaryCard({ label, value }) {
  return (
    <div className="glass-card p-4 relative overflow-hidden">
      <div style={{ position:'absolute', top:-15, right:-15, width:50, height:50, borderRadius:'50%', background:'radial-gradient(circle, var(--t-accent-glow), transparent)', filter:'blur(6px)' }} />
      <p className="text-xs font-medium tracking-widest uppercase mb-1.5" style={{ color:'var(--t-text-label)' }}>{label}</p>
      <p className="font-bold font-display text-lg" style={{ color:'var(--t-accent-s)' }}>{value || '—'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState]   = useState(null);
  const [tab, setTab]          = useState('personal');
  const [salary, setSalary]    = useState(null);
  const [form, setForm]        = useState({});
  const [msg, setMsg]          = useState('');
  const [pw, setPw]            = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
    load(u.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(id) {
    const { employee } = await api.getEmployee(id);
    setUserState(employee);
    setForm(employee);
    if (['admin','hr'].includes(employee.role)) {
      try { const { salary } = await api.getSalary(id); setSalary(salary); }
      catch (_) {}
    }
  }

  async function saveProfile() {
    try {
      const { employee } = await api.updateEmployee(user.id, {
        phone: form.phone,
        residential_address: form.residential_address,
        about: form.about,
        interests_hobbies: form.interests_hobbies,
        what_i_love_about_my_job: form.what_i_love_about_my_job,
      });
      setUserState(employee);
      saveUser(employee);
      setMsg('✓ Profile updated successfully');
    } catch (err) { setMsg(err.message); }
  }

  async function changePassword() {
    try {
      await api.changePassword({ newPassword: pw });
      setMsg('✓ Password changed successfully');
      setPw('');
    } catch (err) { setMsg(err.message); }
  }

  if (!user) return null;
  const isAdmin = ['admin','hr'].includes(user.role);
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`;
  const availableTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">

        {/* Avatar header */}
        <div className="glass-card p-6 flex items-center gap-5">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{
              background: 'var(--t-accent-grad)',
              boxShadow: '6px 6px 16px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.04), 0 0 20px var(--t-accent-glow)',
            }}
          >
            {initials}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color:'var(--t-text-label)' }}>
              {user.designation || user.role}
              {user.department && <span style={{ color:'var(--t-text-dim)' }}> · {user.department}</span>}
            </p>
            <p className="text-xs mt-1 font-mono" style={{ color:'var(--t-text-dim)' }}>{user.login_id}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background:'var(--t-surface2)', border:'1px solid var(--t-border)' }}>
          {availableTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setMsg(''); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={tab === key ? {
                background:'var(--t-accent-glow-sm)',
                boxShadow:'inset 2px 2px 6px rgba(0,0,0,0.4), 0 0 10px var(--t-accent-glow-sm)',
                color:'var(--t-accent-s)',
                border:'1px solid var(--t-border)',
              } : {
                color:'var(--t-text-dim)',
                border:'1px solid transparent',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{
            background: msg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: msg.startsWith('✓') ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
            color: msg.startsWith('✓') ? '#10B981' : '#FCA5A5',
          }}>
            {msg}
          </div>
        )}

        {/* Personal tab */}
        {tab === 'personal' && (
          <div className="glass-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput label="Login ID"  value={user.login_id}             readonly />
              <GlassInput label="Email"     value={user.email}                readonly />
              <GlassInput label="Phone"     value={form.phone}                onChange={(v) => setForm({...form, phone:v})} />
              <GlassInput label="Address"   value={form.residential_address}  onChange={(v) => setForm({...form, residential_address:v})} />
              <GlassInput label="Date of Birth"   value={user.date_of_birth}     readonly />
              <GlassInput label="Blood Group"     value={user.blood_group}       readonly />
              <GlassInput label="Date of Joining" value={user.date_of_joining}   readonly />
              <GlassInput label="Manager ID"      value={user.manager_id || '—'} readonly />
            </div>
            <GlassInput label="About" value={form.about} onChange={(v) => setForm({...form, about:v})} textarea />
            <GlassInput label="What I Love About My Job" value={form.what_i_love_about_my_job} onChange={(v) => setForm({...form, what_i_love_about_my_job:v})} textarea />
            <GlassInput label="Interests & Hobbies" value={form.interests_hobbies} onChange={(v) => setForm({...form, interests_hobbies:v})} textarea />
            <button onClick={saveProfile} className="btn-glow px-6 py-2.5 text-sm font-semibold text-white rounded-xl">
              Save Changes
            </button>
          </div>
        )}

        {/* Salary tab */}
        {tab === 'salary' && isAdmin && (
          <div className="space-y-4">
            {salary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SalaryCard label="Monthly Wage"        value={`₹${salary.monthly_wage}`} />
                <SalaryCard label="Yearly Wage"         value={`₹${salary.yearly_wage}`} />
                <SalaryCard label="Basic Salary"        value={`₹${salary.basic_salary}`} />
                <SalaryCard label="House Rent Allowance" value={`₹${salary.house_rent_allowance}`} />
                <SalaryCard label="Standard Allowance"  value={`₹${salary.standard_allowance}`} />
                <SalaryCard label="Performance Bonus"   value={`₹${salary.performance_bonus}`} />
                <SalaryCard label="Leave Travel Allowance" value={`₹${salary.leave_travel_allowance}`} />
                <SalaryCard label="Food Allowance"      value={`₹${salary.food_allowance}`} />
                <SalaryCard label="Provident Fund Rate" value={`${salary.provident_fund_rate}%`} />
                <SalaryCard label="Professional Tax"    value={`₹${salary.professional_tax}`} />
                <SalaryCard label="Working Days/Month"  value={salary.number_of_working_days} />
              </div>
            ) : (
              <p style={{ color:'var(--t-text-dim)' }}>No salary structure defined yet.</p>
            )}
          </div>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <div className="glass-card p-6 max-w-sm space-y-4">
            <GlassInput label="New Password" type="password" value={pw} onChange={setPw} />
            <button onClick={changePassword} className="btn-glow w-full py-2.5 text-sm font-semibold text-white rounded-xl">
              Update Password
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
