'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api, getUser } from '../../lib/api';

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'employee', department: '', designation: '' });
  const [created, setCreated] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/signin');
      return;
    }
    setUserState(u);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const { employees } = await api.listEmployees();
      setEmployees(employees);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const data = await api.createEmployee(form);
      setCreated(data);
      setForm({ firstName: '', lastName: '', email: '', role: 'employee', department: '', designation: '' });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-white">Employees</h1>
          {isAdmin && (
            <button
              onClick={() => setShowNew((v) => !v)}
              className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-semibold text-white"
            >
              {showNew ? 'Close' : '+ New Employee'}
            </button>
          )}
        </div>

        {msg && <p className="mt-3 text-sm text-absent">{msg}</p>}

        {showNew && (
          <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-line bg-panel p-5 sm:grid-cols-2">
            <Field label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Role</label>
              <select
                className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
            <div className="sm:col-span-2">
              <button className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-5 py-2 text-sm font-semibold text-white">
                Create Employee
              </button>
            </div>
          </form>
        )}

        {created && (
          <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-gray-200">
            Employee created. Share these system-generated credentials with them:
            <div className="mt-2 font-mono text-accent2">
              Login ID: {created.loginId} &nbsp;·&nbsp; Temp Password: {created.temporaryPassword}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <a
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="rounded-xl border border-line bg-panel p-4 shadow-card transition hover:border-accent"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-semibold text-white">
                {emp.first_name?.[0]}
                {emp.last_name?.[0]}
              </div>
              <p className="mt-3 font-medium text-white">
                {emp.first_name} {emp.last_name}
              </p>
              <p className="text-xs text-gray-500">{emp.designation || emp.role}</p>
              <p className="text-xs text-gray-600">{emp.login_id}</p>
            </a>
          ))}
        </div>
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
