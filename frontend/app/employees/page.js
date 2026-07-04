'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { LayoutGrid, List, Search } from 'lucide-react';

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'employee', department: '', designation: '', manager_id: '' });
  const [created, setCreated] = useState(null);
  const [msg, setMsg] = useState('');

  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');

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
      const data = await api.createEmployee({
        ...form,
        manager_id: form.manager_id || undefined
      });
      setCreated(data);
      setForm({ firstName: '', lastName: '', email: '', role: 'employee', department: '', designation: '', manager_id: '' });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const roles = [...new Set(employees.map(e => e.role).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    if (filterDept && emp.department !== filterDept) return false;
    if (filterRole && emp.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!emp.first_name?.toLowerCase().includes(q) && 
          !emp.last_name?.toLowerCase().includes(q) && 
          !emp.login_id?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-white">Employee Directory</h1>
          {isAdmin && (
            <button
              onClick={() => setShowNew((v) => !v)}
              className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
            >
              {showNew ? 'Close Form' : '+ New Employee'}
            </button>
          )}
        </div>

        {msg && <p className="mb-4 text-sm text-absent">{msg}</p>}

        {showNew && (
          <form onSubmit={handleCreate} className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-line bg-panel p-6 sm:grid-cols-2">
            <h2 className="sm:col-span-2 text-lg font-medium text-white mb-2">Create New Employee</h2>
            <Field label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Role</label>
              <select
                className="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
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
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Manager</label>
              <select
                className="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={form.manager_id}
                onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              >
                <option value="">None</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 mt-2">
              <button className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-6 py-2.5 text-sm font-semibold text-white">
                Create Employee
              </button>
            </div>
          </form>
        )}

        {created && (
          <div className="mb-8 rounded-lg border border-accent/40 bg-accent/10 p-5 text-sm text-gray-200 shadow-inner">
            <p className="font-medium text-white mb-2">Employee created successfully!</p>
            Please share these system-generated credentials with them securely:
            <div className="mt-3 font-mono text-accent2 bg-panel2 p-3 rounded border border-line inline-block">
              Login ID: {created.loginId} &nbsp;·&nbsp; Temp Password: {created.temporaryPassword}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 bg-panel p-3 rounded-xl border border-line">
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full bg-panel2 border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-accent outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none"
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              className="bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none capitalize"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          <div className="flex bg-panel2 rounded-lg p-1 border border-line shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-panel text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-panel text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Directory View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEmployees.map((emp) => (
              <a
                key={emp.id}
                href={`/employees/${emp.id}`}
                className="group flex flex-col items-center rounded-xl border border-line bg-panel p-6 shadow-card transition hover:border-accent hover:shadow-lg"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-2xl font-semibold text-white mb-4 group-hover:scale-105 transition-transform">
                  {emp.first_name?.[0]}
                  {emp.last_name?.[0]}
                </div>
                <h3 className="font-medium text-lg text-white text-center">
                  {emp.first_name} {emp.last_name}
                </h3>
                <p className="text-sm text-accent mt-1">{emp.designation || 'Employee'}</p>
                <p className="text-xs text-gray-500 mt-1">{emp.department || 'No Department'}</p>
                <div className="w-full h-px bg-line my-4"></div>
                <p className="text-xs text-gray-400 font-mono">{emp.login_id}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-panel overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-panel2 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-panel2/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-xs font-semibold text-white">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-white">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono">{emp.login_id}</td>
                    <td className="px-6 py-4 text-gray-300">{emp.department || '—'}</td>
                    <td className="px-6 py-4 text-gray-300 capitalize">{emp.role}</td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/employees/${emp.id}`} className="text-accent hover:text-accent2 text-xs font-medium">View Profile</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees match your search criteria.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">{label}</label>
      <input
        type={type}
        className="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
