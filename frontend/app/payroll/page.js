'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { IndianRupee, Pencil, Check, X } from 'lucide-react';

function SalaryField({ label, value, onChange, readonly, type = 'text', suffix, prefix='₹', description }) {
  return (
    <div className="flex flex-col justify-center">
      <div className="flex justify-between items-end mb-1">
        <label className="text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.8)' }}>
          {label}
        </label>
      </div>
      {description && <p className="text-[10px] mb-2 leading-tight" style={{ color:'var(--t-text-dim)' }}>{description}</p>}
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color:'rgba(139,92,246,0.8)' }}>{prefix}</span>}
        <input
          type={type}
          readOnly={readonly}
          className="w-full rounded-xl py-2 text-sm transition-all"
          style={readonly ? {
            background: 'rgba(139,92,246,0.05)',
            border: '1px solid rgba(139,92,246,0.1)',
            color: '#e2e2f0',
            paddingLeft: prefix ? '2rem' : '1rem',
            paddingRight: suffix ? '4rem' : '1rem',
            outline: 'none',
          } : {
            background: 'rgba(10,10,18,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#e2e2f0',
            paddingLeft: prefix ? '2rem' : '1rem',
            paddingRight: suffix ? '4rem' : '1rem',
            outline: 'none',
            boxShadow: 'inset 3px 3px 7px rgba(0,0,0,0.4), 0 0 8px rgba(139,92,246,0.1)',
          }}
          value={value || ''}
          onChange={(e) => !readonly && onChange && onChange(e.target.value)}
        />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color:'rgba(192,132,252,0.6)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ComponentRow({ label, description, amountValue, pctValue, prefix='₹', onChangeAmount, readonly }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-white mb-0.5">{label}</p>
        <p className="text-[10px]" style={{ color:'var(--t-text-dim)' }}>{description}</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color:'rgba(139,92,246,0.8)' }}>{prefix}</span>
          <input
            type="number"
            readOnly={readonly}
            className="w-full rounded-lg py-1.5 text-sm transition-all"
            style={readonly ? {
              background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)', color: '#e2e2f0', paddingLeft: '1.5rem', paddingRight: '2rem', outline: 'none'
            } : {
              background: 'rgba(10,10,18,0.7)', border: '1px solid rgba(139,92,246,0.3)', color: '#e2e2f0', paddingLeft: '1.5rem', paddingRight: '2rem', outline: 'none'
            }}
            value={amountValue || ''}
            onChange={(e) => !readonly && onChangeAmount && onChangeAmount(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color:'rgba(192,132,252,0.6)' }}>/ mo</span>
        </div>
        <div className="relative w-20 shrink-0">
          <input
            type="text"
            readOnly
            className="w-full rounded-lg py-1.5 text-sm transition-all text-right"
            style={{
              background: 'rgba(139,92,246,0.02)', border: '1px solid transparent', color: 'rgba(192,132,252,0.8)', paddingRight: '1.5rem', outline: 'none'
            }}
            value={pctValue || ''}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color:'rgba(192,132,252,0.8)' }}>%</span>
        </div>
      </div>
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
    catch (err) { setMsg(err.message); setSalary({}); }
  }

  const handleWageChange = (v) => {
    const wage = parseFloat(v) || 0;
    const basic = wage * 0.50;
    const hra = basic * 0.50; // 50% of basic
    const std = wage * 0.1667;
    const bonus = wage * 0.0833;
    const lta = wage * 0.0833;
    const fixed = wage - (basic + hra + std + bonus + lta);
    const pf = basic * 0.12;
    
    setSalary(s => ({
      ...s,
      monthlyWage: wage,
      yearlyWage: wage * 12,
      basicSalary: basic.toFixed(2),
      houseRentAllowance: hra.toFixed(2),
      standardAllowance: std.toFixed(2),
      performanceBonus: bonus.toFixed(2),
      leaveTravelAllowance: lta.toFixed(2),
      fixedAllowance: fixed.toFixed(2),
      employeePf: pf.toFixed(2),
      employerPf: pf.toFixed(2),
      professionalTax: 200,
    }));
  };

  async function handleSave(e) {
    e.preventDefault();
    try {
      setMsg('Updating…');
      const payload = {
        monthlyWage: salary.monthlyWage ?? salary.monthly_wage,
        yearlyWage: salary.yearlyWage ?? salary.yearly_wage,
        basicSalary: salary.basicSalary ?? salary.basic_salary,
        houseRentAllowance: salary.houseRentAllowance ?? salary.house_rent_allowance,
        standardAllowance: salary.standardAllowance ?? salary.standard_allowance,
        performanceBonus: salary.performanceBonus ?? salary.performance_bonus,
        leaveTravelAllowance: salary.leaveTravelAllowance ?? salary.leave_travel_allowance,
        fixedAllowance: salary.fixedAllowance ?? salary.fixed_allowance,
        employeePf: salary.employeePf ?? salary.employee_pf,
        employerPf: salary.employerPf ?? salary.employer_pf,
        professionalTax: salary.professionalTax ?? salary.professional_tax,
        workingDaysPerWeek: salary.workingDaysPerWeek ?? salary.working_days_per_week,
        breakTime: salary.breakTime ?? salary.break_time,
        providentFundRate: 12.00
      };
      
      const { salary: updated } = await api.updateSalary(selectedEmp.id, payload);
      setSalary(updated);
      setIsEditing(false);
      setMsg('✓ Salary updated successfully.');
    } catch (err) { setMsg(err.message); }
  }

  if (!user) return null;
  const isAdmin = ['admin','hr'].includes(user.role);

  const FormContent = () => (
    <>
      <div className="mb-6 pb-6 border-b border-white/10">
        <h3 className="font-display text-lg text-white mb-4">Salary Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SalaryField label="Month Wage" value={salary.monthlyWage ?? salary.monthly_wage} onChange={handleWageChange} readonly={!isEditing} type="number" suffix="/ Month" />
            <SalaryField label="Yearly wage" value={salary.yearlyWage ?? salary.yearly_wage} onChange={v => setSalary({...salary, yearlyWage:v})} readonly={!isEditing} type="number" suffix="/ Yearly" />
          </div>
          <div className="space-y-4">
            <SalaryField label="No of working days in a week" value={salary.workingDaysPerWeek ?? salary.working_days_per_week} onChange={v => setSalary({...salary, workingDaysPerWeek:v})} readonly={!isEditing} type="number" prefix="" />
            <SalaryField label="Break Time" value={salary.breakTime ?? salary.break_time} onChange={v => setSalary({...salary, breakTime:v})} readonly={!isEditing} type="number" prefix="" suffix="/ hrs" />
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-white/10">
        <h3 className="font-display text-lg text-white mb-4">Salary Components</h3>
        <div className="space-y-1">
          <ComponentRow 
            label="Basic Salary" 
            description="Define Basic salary from company cost compute it based on monthly Wages"
            amountValue={salary.basicSalary ?? salary.basic_salary}
            pctValue="50.00"
            onChangeAmount={v => setSalary({...salary, basicSalary: v})}
            readonly={!isEditing}
          />
          <ComponentRow 
            label="House Rent Allowance" 
            description="HRA provided to employees 50% of the basic salary"
            amountValue={salary.houseRentAllowance ?? salary.house_rent_allowance}
            pctValue="50.00"
            onChangeAmount={v => setSalary({...salary, houseRentAllowance: v})}
            readonly={!isEditing}
          />
          <ComponentRow 
            label="Standard Allowance" 
            description="A standard allowance is a predetermined, fixed amount provided to employee as part of their salary"
            amountValue={salary.standardAllowance ?? salary.standard_allowance}
            pctValue="16.67"
            onChangeAmount={v => setSalary({...salary, standardAllowance: v})}
            readonly={!isEditing}
          />
          <ComponentRow 
            label="Performance Bonus" 
            description="Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary"
            amountValue={salary.performanceBonus ?? salary.performance_bonus}
            pctValue="8.33"
            onChangeAmount={v => setSalary({...salary, performanceBonus: v})}
            readonly={!isEditing}
          />
          <ComponentRow 
            label="Leave Travel Allowance" 
            description="LTA is paid by the company to employees to cover their travel expenses and calculated as a % of the basic salary"
            amountValue={salary.leaveTravelAllowance ?? salary.leave_travel_allowance}
            pctValue="8.33"
            onChangeAmount={v => setSalary({...salary, leaveTravelAllowance: v})}
            readonly={!isEditing}
          />
          <ComponentRow 
            label="Fixed Allowance" 
            description="fixed allowance portion of wages is determined after calculating all salary components"
            amountValue={salary.fixedAllowance ?? salary.fixed_allowance}
            pctValue="11.67"
            onChangeAmount={v => setSalary({...salary, fixedAllowance: v})}
            readonly={!isEditing}
          />
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-white/10">
        <h3 className="font-display text-lg text-white mb-4">Provident Fund (PF) Contribution</h3>
        <div className="space-y-1">
          <ComponentRow 
            label="Employee" 
            description="PF is calculated based on the basic salary"
            amountValue={salary.employeePf ?? salary.employee_pf}
            pctValue="12.00"
            onChangeAmount={v => setSalary({...salary, employeePf: v})}
            readonly={!isEditing}
          />
          <ComponentRow 
            label="Employer" 
            description="PF is calculated based on the basic salary"
            amountValue={salary.employerPf ?? salary.employer_pf}
            pctValue="12.00"
            onChangeAmount={v => setSalary({...salary, employerPf: v})}
            readonly={!isEditing}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-display text-lg text-white mb-4">Tax Deductions</h3>
        <ComponentRow 
          label="Professional Tax" 
          description="Professional Tax deducted from the Gross salary"
          amountValue={salary.professionalTax ?? salary.professional_tax}
          pctValue=""
          onChangeAmount={v => setSalary({...salary, professionalTax: v})}
          readonly={!isEditing}
        />
      </div>

      {isEditing && (
        <div className="flex justify-end pt-4">
          <button type="submit" className="btn-glow flex items-center gap-2 px-7 py-2.5 text-sm font-semibold text-white rounded-xl">
            <Check className="w-4 h-4" />
            Save Salary Structure
          </button>
        </div>
      )}
    </>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'rgba(192,132,252,0.6)' }}>Compensation</p>
          <h1 className="font-display text-3xl font-bold text-white">Payroll & Salary</h1>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{
            background: msg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)',
            border: msg.startsWith('✓') ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(139,92,246,0.2)',
            color: msg.startsWith('✓') ? '#22C55E' : '#C084FC',
          }}>
            {msg}
          </div>
        )}

        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 glass-card overflow-hidden flex flex-col h-[600px] lg:h-[800px]">
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(139,92,246,0.1)', background:'rgba(139,92,246,0.04)' }}>
                <h2 className="font-display font-semibold text-white">Employees</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => viewSalary(emp)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-1 text-left transition-all"
                    style={selectedEmp?.id === emp.id ? {
                      background:'rgba(139,92,246,0.15)', boxShadow:'inset 2px 2px 6px rgba(0,0,0,0.35)', borderLeft:'3px solid #8B5CF6',
                    } : { background:'transparent', borderLeft:'3px solid transparent' }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white overflow-hidden"
                      style={{ background:'linear-gradient(135deg,#8B5CF6,#C084FC)', boxShadow:'2px 2px 6px rgba(0,0,0,0.4)' }}>
                      {emp.profile_picture_url ? (
                        <img src={emp.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <>{emp.first_name?.[0]}{emp.last_name?.[0]}</>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs truncate" style={{ color:'var(--t-text-dim)' }}>{emp.designation || emp.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              {selectedEmp ? (
                <div className="glass-card p-6 md:p-8">
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/10">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white mb-1">
                        Salary Structure: {selectedEmp.first_name} {selectedEmp.last_name}
                      </h2>
                      <p className="text-sm font-mono" style={{ color:'rgba(192,132,252,0.6)' }}>
                        {selectedEmp.designation || 'Employee'} • {selectedEmp.login_id}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
                      style={isEditing ? {
                        background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#FCA5A5',
                      } : {
                        background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#e2e2f0', boxShadow:'3px 3px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {isEditing ? <><X className="w-3.5 h-3.5" />Cancel Edit</> : <><Pencil className="w-3.5 h-3.5" />Edit Structure</>}
                    </button>
                  </div>

                  {salary ? (
                    <form onSubmit={handleSave} className="space-y-2">
                      <FormContent />
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
                    Select an employee to view or edit their salary structure
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 md:p-10 max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-white mb-8 pb-6 border-b border-white/10">My Salary Structure</h2>
            {salary ? (
              <div className="space-y-2 pointer-events-none">
                <FormContent />
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
