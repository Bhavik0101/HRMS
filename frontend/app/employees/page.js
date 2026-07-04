'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { LayoutGrid, List, Search, Plus, X } from 'lucide-react';

function GlassInput({ label, type = 'text', value, onChange, required = false }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'var(--t-text-label)' }}>
        {label}
      </label>
      <input
        type={type}
        className="glass-input w-full px-4 py-2.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function GlassSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'var(--t-text-label)' }}>
        {label}
      </label>
      <select
        className="glass-input w-full px-4 py-2.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUserState]       = useState(null);
  const [employees, setEmployees]  = useState([]);
  const [showNew, setShowNew]      = useState(false);
  const [form, setForm]            = useState({ firstName:'', lastName:'', email:'', role:'employee', department:'', designation:'', manager_id:'' });
  const [created, setCreated]      = useState(null);
  const [msg, setMsg]              = useState('');
  const [viewMode, setViewMode]    = useState('grid');
  const [search, setSearch]        = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
    setUserState(u);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { employees } = await api.listEmployees();
      setEmployees(employees);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const data = await api.createEmployee({ ...form, manager_id: form.manager_id || undefined });
      setCreated(data);
      setForm({ firstName:'', lastName:'', email:'', role:'employee', department:'', designation:'', manager_id:'' });
      setShowNew(false);
      load();
    } catch (err) { setMsg(err.message); }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const roles       = [...new Set(employees.map(e => e.role).filter(Boolean))];

  const filtered = employees.filter(emp => {
    if (filterDept && emp.department !== filterDept) return false;
    if (filterRole && emp.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!emp.first_name?.toLowerCase().includes(q) &&
          !emp.last_name?.toLowerCase().includes(q) &&
          !emp.login_id?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'var(--t-text-label)' }}>People</p>
            <h1 className="font-display text-3xl font-bold text-white">Employee Directory</h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowNew(v => !v); setCreated(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${showNew ? '' : 'btn-glow text-white'}`}
              style={showNew ? {
                background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.25)',
                color:'#FCA5A5',
              } : undefined}
            >
              {showNew ? <><X className="w-4 h-4" />Close</> : <><Plus className="w-4 h-4" />New Employee</>}
            </button>
          )}
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5' }}>
            {msg}
          </div>
        )}

        {/* Create form */}
        {showNew && (
          <div className="glass-card p-6 animate-in">
            <h2 className="font-display text-lg font-semibold text-white mb-5">Create New Employee</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GlassInput label="First Name" value={form.firstName} onChange={(v) => setForm({...form, firstName:v})} required />
              <GlassInput label="Last Name"  value={form.lastName}  onChange={(v) => setForm({...form, lastName:v})}  required />
              <GlassInput label="Email" type="email" value={form.email} onChange={(v) => setForm({...form, email:v})} required />
              <GlassSelect label="Role" value={form.role} onChange={(v) => setForm({...form, role:v})}>
                <option value="employee">Employee</option>
                <option value="hr">HR Officer</option>
                <option value="admin">Admin</option>
              </GlassSelect>
              <GlassInput label="Department"  value={form.department}  onChange={(v) => setForm({...form, department:v})} />
              <GlassInput label="Designation" value={form.designation} onChange={(v) => setForm({...form, designation:v})} />
              <GlassSelect label="Manager" value={form.manager_id} onChange={(v) => setForm({...form, manager_id:v})}>
                <option value="">None</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </GlassSelect>
              <div className="sm:col-span-2 flex justify-end mt-2">
                <button type="submit" className="btn-glow px-7 py-2.5 text-sm font-semibold text-white rounded-xl">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Created credentials */}
        {created && (
          <div className="glass-card p-5 animate-in" style={{ border:'1px solid var(--t-border)', background:'var(--t-accent-glow-sm)' }}>
            <p className="font-semibold text-white mb-2">✓ Employee created successfully!</p>
            <p className="text-sm mb-3" style={{ color:'var(--t-text-muted)' }}>
              Share these credentials securely:
            </p>
            <div className="flex items-center gap-4 font-mono text-sm rounded-xl p-4"
              style={{ background:'var(--t-code-bg)', border:'1px solid var(--t-code-border)', color:'var(--t-accent-s)' }}>
              <span>Login ID: <strong>{created.loginId}</strong></span>
              <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
              <span>Password: <strong>{created.temporaryPassword}</strong></span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'rgba(139,92,246,0.5)' }} />
              <input
                type="text"
                placeholder="Search employees…"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="glass-input px-4 py-2.5 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Depts</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="glass-input px-4 py-2.5 text-sm capitalize" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl p-1 gap-1 shrink-0"
            style={{ background:'var(--t-surface2)', border:'1px solid var(--t-border)' }}>
            {['grid','list'].map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="p-2 rounded-lg transition-all"
                style={viewMode === m ? {
                  background:'var(--t-accent-glow-sm)',
                  boxShadow:'inset 2px 2px 5px rgba(0,0,0,0.4)',
                  color:'var(--t-accent-s)',
                } : { color:'var(--t-text-dim)' }}
              >
                {m === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="glass-card h-48 animate-pulse" style={{ background:'var(--t-accent-glow-sm)' }} />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((emp) => (
              <a
                key={emp.id}
                href={`/employees/${emp.id}`}
                className="glass-card group flex flex-col items-center p-6 text-center"
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background:'var(--t-accent-grad)',
                    boxShadow:'4px 4px 12px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.04), 0 0 16px var(--t-accent-glow)',
                  }}
                >
                  {emp.first_name?.[0]}{emp.last_name?.[0]}
                </div>
                <h3 className="font-display font-semibold text-white">{emp.first_name} {emp.last_name}</h3>
                <p className="text-xs mt-1" style={{ color:'var(--t-accent-s)' }}>{emp.designation || 'Employee'}</p>
                <p className="text-xs mt-0.5" style={{ color:'var(--t-text-dim)' }}>{emp.department || '—'}</p>
                <hr className="glow-divider w-full my-4" />
                <p className="font-mono text-xs" style={{ color:'var(--t-text-dim)' }}>{emp.login_id}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="glass-table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="glass-table-head">
                  {['Employee','ID','Department','Role',''].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'var(--t-text-label)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} className="glass-table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shrink-0"
                          style={{ background:'var(--t-accent-grad)', boxShadow:'2px 2px 6px rgba(0,0,0,0.4)' }}>
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs" style={{ color:'var(--t-text-dim)' }}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs" style={{ color:'var(--t-accent-s)' }}>{emp.login_id}</td>
                    <td className="px-5 py-4 text-sm" style={{ color:'var(--t-text-muted)' }}>{emp.department || '—'}</td>
                    <td className="px-5 py-4 text-sm capitalize" style={{ color:'var(--t-text-muted)' }}>{emp.role}</td>
                    <td className="px-5 py-4 text-right">
                      <a href={`/employees/${emp.id}`} className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color:'var(--t-accent-s)' }}>
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color:'var(--t-text-dim)' }}>
            No employees match your filters.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
