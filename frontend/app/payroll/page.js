'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { IndianRupee, Pencil, Check, X } from 'lucide-react';

function SalaryField({ label, value, onChange, readonly, type = 'text' }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>
        {label}
      </label>
      <div className="relative">
        {!readonly && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:'rgba(139,92,246,0.6)' }}>₹</span>}
        <input
          type={type}
          readOnly={readonly}
          className="w-full rounded-xl py-2.5 text-sm transition-all"
          style={readonly ? {
            background: 'rgba(139,92,246,0.05)',
            border: '1px solid rgba(139,92,246,0.1)',
            color: '#e2e2f0',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            outline: 'none',
          } : {
            background: 'rgba(10,10,18,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#e2e2f0',
            paddingLeft: '2rem',
            paddingRight: '0.875rem',
            outline: 'none',
            boxShadow: 'inset 3px 3px 7px rgba(0,0,0,0.4), 0 0 8px rgba(139,92,246,0.1)',
          }}
          value={value || ''}
          onChange={(e) => !readonly && onChange && onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function ReadOnlyCard({ label, value }) {
  return (
    <div className="glass-card p-4 relative overflow-hidden">
      <div style={{ position:'absolute', top:-15, right:-15, width:60, height:60, borderRadius:'50%', background:'radial-gradient(circle, var(--t-accent-glow), transparent)', filter:'blur(6px)' }} />
      <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color:'var(--t-text-label)' }}>{label}</p>
      <p className="text-lg font-bold font-display" style={{ color:'var(--t-accent-s)' }}>{value || '—'}</p>
    </div>
  );
}

export default function PayrollPage() {
  const router = useRouter();
  const [user, setUserState]         = useState(null);
  const [employees, setEmployees]    = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [salary, setSalary]          = useState(null);
  const [msg, setMsg]                = useState('');
  const [isEditing, setIsEditing]    = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
    setUserState(u);
    if (['admin','hr'].includes(u.role)) loadEmployees();
    else loadSelfSalary(u.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEmployees() {
    try { const { employees } = await api.listEmployees(); setEmployees(employees); }
    catch (err) { setMsg(err.message); }
  }

  async function loadSelfSalary(id) {
    try { const { salary } = await api.getSalary(id); setSalary(salary); }
    catch { setMsg('You do not have access to view this or it has not been set up.'); }
  }

  async function viewSalary(emp) {
    setSelectedEmp(emp);
    setIsEditing(false);
    try { const { salary } = await api.getSalary(emp.id); setSalary(salary); }
    catch { setMsg(emp.message); setSalary({}); }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setMsg('Updating…');
      const { salary: updated } = await api.updateSalary(selectedEmp.id, salary);
      setSalary(updated);
      setIsEditing(false);
      setMsg('✓ Salary updated successfully.');
    } catch (err) { setMsg(err.message); }
  }

  if (!user) return null;
  const isAdmin = ['admin','hr'].includes(user.role);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'var(--t-text-label)' }}>Compensation</p>
          <h1 className="font-display text-3xl font-bold text-white">Payroll & Salary</h1>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{
            background: msg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'var(--t-accent-glow-sm)',
            border: msg.startsWith('✓') ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--t-border)',
            color: msg.startsWith('✓') ? '#10B981' : 'var(--t-accent-s)',
          }}>
            {msg}
          </div>
        )}

        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Employee list */}
            <div className="glass-card overflow-hidden flex flex-col" style={{ height:600 }}>
              <div className="px-5 py-4" style={{ borderBottom:'1px solid var(--t-border)', background:'var(--t-surface2)' }}>
                <h2 className="font-display font-semibold text-white">Employees</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => viewSalary(emp)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-1 text-left transition-all"
                    style={selectedEmp?.id === emp.id ? {
                      background:'var(--t-accent-glow-sm)',
                      boxShadow:'inset 2px 2px 6px rgba(0,0,0,0.35)',
                      borderLeft:'3px solid var(--t-accent-p)',
                    } : {
                      background:'transparent',
                      borderLeft:'3px solid transparent',
                    }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{
                        background:'var(--t-accent-grad)',
                        boxShadow:'2px 2px 6px rgba(0,0,0,0.4)',
                      }}>
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs truncate" style={{ color:'var(--t-text-dim)' }}>{emp.designation || emp.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Salary panel */}
            <div className="lg:col-span-2">
              {selectedEmp ? (
                <div className="glass-card p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">
                        {selectedEmp.first_name} {selectedEmp.last_name}
                      </h2>
                      <p className="text-sm mt-0.5 font-mono" style={{ color:'rgba(192,132,252,0.6)' }}>
                        {selectedEmp.login_id}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
                      style={isEditing ? {
                        background:'rgba(239,68,68,0.1)',
                        border:'1px solid rgba(239,68,68,0.25)',
                        color:'#FCA5A5',
                      } : {
                        background:'rgba(255,255,255,0.04)',
                        border:'1px solid rgba(255,255,255,0.08)',
                        color:'#e2e2f0',
                        boxShadow:'3px 3px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {isEditing ? <><X className="w-3.5 h-3.5" />Cancel</> : <><Pencil className="w-3.5 h-3.5" />Edit</>}
                    </button>
                  </div>

                  {salary ? (
                    <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SalaryField label="Monthly Wage (₹)"     value={salary.monthly_wage || salary.monthlyWage}         onChange={v => setSalary({...salary, monthlyWage:v})}         readonly={!isEditing} type="number" />
                      <SalaryField label="Yearly Wage (₹)"      value={salary.yearly_wage || salary.yearlyWage}           onChange={v => setSalary({...salary, yearlyWage:v})}          readonly={!isEditing} type="number" />
                      <SalaryField label="Basic Salary (₹)"     value={salary.basic_salary || salary.basicSalary}         onChange={v => setSalary({...salary, basicSalary:v})}         readonly={!isEditing} type="number" />
                      <SalaryField label="HRA (₹)"              value={salary.house_rent_allowance || salary.houseRentAllowance} onChange={v => setSalary({...salary, houseRentAllowance:v})} readonly={!isEditing} type="number" />
                      <SalaryField label="Performance Bonus (₹)"value={salary.performance_bonus || salary.performanceBonus}     onChange={v => setSalary({...salary, performanceBonus:v})}  readonly={!isEditing} type="number" />
                      <SalaryField label="LTA (₹)"              value={salary.leave_travel_allowance || salary.leaveTravelAllowance} onChange={v => setSalary({...salary, leaveTravelAllowance:v})} readonly={!isEditing} type="number" />
                      {isEditing && (
                        <div className="sm:col-span-2 flex justify-end mt-2">
                          <button type="submit" className="btn-glow flex items-center gap-2 px-7 py-2.5 text-sm font-semibold text-white rounded-xl">
                            <Check className="w-4 h-4" />
                            Save Salary
                          </button>
                        </div>
                      )}
                    </form>
                  ) : (
                    <p style={{ color:'var(--t-text-dim)' }}>Loading salary data…</p>
                  )}
                </div>
              ) : (
                <div className="glass-card flex flex-col items-center justify-center gap-3 text-center" style={{ height:600 }}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background:'rgba(139,92,246,0.1)', boxShadow:'4px 4px 12px rgba(0,0,0,0.4)', border:'1px solid rgba(139,92,246,0.15)' }}>
                    <IndianRupee className="w-8 h-8" style={{ color:'rgba(139,92,246,0.5)' }} />
                  </div>
                  <p className="text-sm" style={{ color:'var(--t-text-muted)' }}>
                    Select an employee to view their salary structure
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Self-view
          <div className="glass-card p-6 max-w-2xl">
            <h2 className="font-display text-xl font-bold text-white mb-6">My Salary Structure</h2>
            {salary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadOnlyCard label="Monthly Wage"        value={`₹${salary.monthly_wage}`} />
                <ReadOnlyCard label="Yearly Wage"         value={`₹${salary.yearly_wage}`} />
                <ReadOnlyCard label="Basic Salary"        value={`₹${salary.basic_salary}`} />
                <ReadOnlyCard label="HRA"                 value={`₹${salary.house_rent_allowance}`} />
                <ReadOnlyCard label="Performance Bonus"   value={`₹${salary.performance_bonus}`} />
                <ReadOnlyCard label="LTA"                 value={`₹${salary.leave_travel_allowance}`} />
              </div>
            ) : (
              <p style={{ color:'var(--t-text-dim)' }}>No salary structure defined yet, or access restricted.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
