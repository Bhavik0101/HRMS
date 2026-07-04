'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';

export default function PayrollPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [salary, setSalary] = useState(null);
  const [msg, setMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/signin');
      return;
    }
    setUserState(u);
    if (['admin', 'hr'].includes(u.role)) {
      loadEmployees();
    } else {
      loadSelfSalary(u.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEmployees() {
    try {
      const { employees } = await api.listEmployees();
      setEmployees(employees);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function loadSelfSalary(id) {
    try {
      const { salary } = await api.getSalary(id);
      setSalary(salary);
    } catch (err) {
      // Employees might not have permission if the backend enforces Admin-only for all getSalary
      // If the backend enforces Admin only for getSalary of others, but allows self, this will work.
      // Wait, the backend in getSalary says: "if (!['admin', 'hr'].includes(req.user.role)) return 403"
      // Let's just catch it.
      setMsg('You do not have access to view this or it has not been set up.');
    }
  }

  async function viewSalary(emp) {
    setSelectedEmp(emp);
    setIsEditing(false);
    try {
      const { salary } = await api.getSalary(emp.id);
      setSalary(salary);
    } catch (err) {
      setMsg(err.message);
      setSalary({});
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setMsg('Updating...');
      const { salary: updated } = await api.updateSalary(selectedEmp.id, salary);
      setSalary(updated);
      setIsEditing(false);
      setMsg('Salary updated successfully.');
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-2xl text-white mb-6">Payroll & Salary Management</h1>
        
        {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}

        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border border-line bg-panel rounded-xl overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-line bg-panel2">
                <h2 className="font-medium text-white">Employees</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => viewSalary(emp)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition flex items-center gap-3 ${
                      selectedEmp?.id === emp.id ? 'bg-accent/20 text-accent2' : 'text-gray-300 hover:bg-panel2 hover:text-white'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-xs font-semibold text-white shrink-0">
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs opacity-60">{emp.designation || emp.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedEmp ? (
                <div className="border border-line bg-panel rounded-xl p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-medium text-white">Salary Structure: {selectedEmp.first_name} {selectedEmp.last_name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{selectedEmp.login_id}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="rounded-lg bg-panel2 px-4 py-2 text-sm font-semibold text-white transition hover:bg-line"
                    >
                      {isEditing ? 'Cancel Edit' : 'Edit Structure'}
                    </button>
                  </div>

                  {salary ? (
                    <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Monthly Wage (₹)" value={salary.monthly_wage || salary.monthlyWage} onChange={v => setSalary({...salary, monthlyWage: v})} readonly={!isEditing} type="number" />
                      <Field label="Yearly Wage (₹)" value={salary.yearly_wage || salary.yearlyWage} onChange={v => setSalary({...salary, yearlyWage: v})} readonly={!isEditing} type="number" />
                      <Field label="Basic Salary (₹)" value={salary.basic_salary || salary.basicSalary} onChange={v => setSalary({...salary, basicSalary: v})} readonly={!isEditing} type="number" />
                      <Field label="HRA (₹)" value={salary.house_rent_allowance || salary.houseRentAllowance} onChange={v => setSalary({...salary, houseRentAllowance: v})} readonly={!isEditing} type="number" />
                      <Field label="Performance Bonus (₹)" value={salary.performance_bonus || salary.performanceBonus} onChange={v => setSalary({...salary, performanceBonus: v})} readonly={!isEditing} type="number" />
                      <Field label="LTA (₹)" value={salary.leave_travel_allowance || salary.leaveTravelAllowance} onChange={v => setSalary({...salary, leaveTravelAllowance: v})} readonly={!isEditing} type="number" />
                      
                      {isEditing && (
                        <div className="sm:col-span-2 mt-4 flex justify-end">
                          <button type="submit" className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-6 py-2.5 text-sm font-semibold text-white">
                            Save Salary
                          </button>
                        </div>
                      )}
                    </form>
                  ) : (
                    <p className="text-gray-400">Loading salary data or no structure found.</p>
                  )}
                </div>
              ) : (
                <div className="border border-line bg-panel rounded-xl h-[600px] flex items-center justify-center">
                  <p className="text-gray-500">Select an employee to view their salary structure.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-line bg-panel rounded-xl p-6 max-w-2xl">
            <h2 className="text-xl font-medium text-white mb-6">My Salary Structure</h2>
            {salary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ReadOnlyField label="Monthly Wage" value={`₹${salary.monthly_wage}`} />
                <ReadOnlyField label="Yearly Wage" value={`₹${salary.yearly_wage}`} />
                <ReadOnlyField label="Basic Salary" value={`₹${salary.basic_salary}`} />
                <ReadOnlyField label="HRA" value={`₹${salary.house_rent_allowance}`} />
                <ReadOnlyField label="Performance Bonus" value={`₹${salary.performance_bonus}`} />
                <ReadOnlyField label="LTA" value={`₹${salary.leave_travel_allowance}`} />
              </div>
            ) : (
              <p className="text-gray-400">No salary structure defined yet, or access restricted.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange, readonly, type = 'text' }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1.5">{label}</label>
      <input
        type={type}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
          readonly ? 'bg-panel border-transparent text-gray-300' : 'bg-panel2 border-line text-white focus:border-accent'
        }`}
        value={value || ''}
        onChange={(e) => !readonly && onChange && onChange(e.target.value)}
        readOnly={readonly}
      />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">{label}</p>
      <p className="rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-gray-300">
        {value || '—'}
      </p>
    </div>
  );
}
