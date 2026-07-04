'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser, setUser as saveUser } from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [tab, setTab] = useState('personal');
  const [salary, setSalary] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/signin');
      return;
    }
    load(u.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(id) {
    const { employee } = await api.getEmployee(id);
    setUserState(employee);
    setForm(employee);
    if (['admin', 'hr'].includes(employee.role)) {
      try {
        const { salary } = await api.getSalary(id);
        setSalary(salary);
      } catch (_) {}
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
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function changePassword() {
    try {
      await api.changePassword({ newPassword: pw });
      setMsg('Password changed successfully');
      setPw('');
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-xl font-semibold text-white">
            {user.first_name?.[0]}
            {user.last_name?.[0]}
          </div>
          <div>
            <h1 className="font-display text-2xl text-white">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-gray-500">
              {user.login_id} · {user.designation || user.role} · {user.department}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line">
          {['personal', ...(isAdmin ? ['salary'] : []), 'security'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize ${
                tab === t ? 'border-b-2 border-accent text-white' : 'text-gray-500'
              }`}
            >
              {t === 'personal' ? 'Private Info' : t === 'salary' ? 'Salary Info' : 'Security'}
            </button>
          ))}
        </div>

        {msg && <p className="mt-3 text-sm text-accent2">{msg}</p>}

        {tab === 'personal' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Login ID" value={user.login_id} />
            <ReadOnlyField label="Email" value={user.email} />
            <EditField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <EditField
              label="Residential Address"
              value={form.residential_address}
              onChange={(v) => setForm({ ...form, residential_address: v })}
            />
            <ReadOnlyField label="Date of Birth" value={user.date_of_birth} />
            <ReadOnlyField label="Blood Group" value={user.blood_group} />
            <ReadOnlyField label="Date of Joining" value={user.date_of_joining} />
            <ReadOnlyField label="Manager" value={user.manager_id || '—'} />

            <div className="sm:col-span-2">
              <EditField
                label="About"
                value={form.about}
                onChange={(v) => setForm({ ...form, about: v })}
                textarea
              />
            </div>
            <div className="sm:col-span-2">
              <EditField
                label="What I love about my job"
                value={form.what_i_love_about_my_job}
                onChange={(v) => setForm({ ...form, what_i_love_about_my_job: v })}
                textarea
              />
            </div>
            <div className="sm:col-span-2">
              <EditField
                label="Interests & Hobbies"
                value={form.interests_hobbies}
                onChange={(v) => setForm({ ...form, interests_hobbies: v })}
                textarea
              />
            </div>

            <div className="sm:col-span-2">
              <button
                onClick={saveProfile}
                className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-5 py-2 text-sm font-semibold text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {tab === 'salary' && isAdmin && (
          <div className="mt-6">
            {salary ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Monthly Wage" value={`₹${salary.monthly_wage}`} />
                <ReadOnlyField label="Yearly Wage" value={`₹${salary.yearly_wage}`} />
                <ReadOnlyField label="Basic Salary" value={`₹${salary.basic_salary}`} />
                <ReadOnlyField label="House Rent Allowance" value={`₹${salary.house_rent_allowance}`} />
                <ReadOnlyField label="Standard Allowance" value={`₹${salary.standard_allowance}`} />
                <ReadOnlyField label="Performance Bonus" value={`₹${salary.performance_bonus}`} />
                <ReadOnlyField label="Leave Travel Allowance" value={`₹${salary.leave_travel_allowance}`} />
                <ReadOnlyField label="Food Allowance" value={`₹${salary.food_allowance}`} />
                <ReadOnlyField label="Provident Fund Rate" value={`${salary.provident_fund_rate}%`} />
                <ReadOnlyField label="Professional Tax" value={`₹${salary.professional_tax}`} />
                <ReadOnlyField label="Working Days / Month" value={salary.number_of_working_days} />
              </div>
            ) : (
              <p className="text-gray-500">No salary structure defined yet.</p>
            )}
          </div>
        )}

        {tab === 'security' && (
          <div className="mt-6 max-w-sm space-y-3">
            <EditField label="New Password" type="password" value={pw} onChange={setPw} />
            <button
              onClick={changePassword}
              className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-5 py-2 text-sm font-semibold text-white"
            >
              Update Password
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-gray-300">
        {value || '—'}
      </p>
    </div>
  );
}

function EditField({ label, value, onChange, textarea = false, type = 'text' }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      {textarea ? (
        <textarea
          className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
