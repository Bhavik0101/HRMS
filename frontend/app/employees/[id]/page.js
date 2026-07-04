'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { api, getUser } from '../../../lib/api';

// This page opens in a VIEW-ONLY (non-editable) mode, per the wireframe note:
// "Make these cards clickable, and on click, the employee information page
// should open in a view-only (non-editable) mode."
export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [viewer, setViewer] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/signin');
      return;
    }
    setViewer(u);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      const { employee } = await api.getEmployee(id);
      setEmployee(employee);
      const u = getUser();
      if (['admin', 'hr'].includes(u.role)) {
        try {
          const { salary } = await api.getSalary(id);
          setSalary(salary);
        } catch (_) {}
      }
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4 inline-block rounded-full border border-line px-3 py-1 text-xs text-gray-500">
          View-only
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-xl font-semibold text-white">
            {employee.first_name?.[0]}
            {employee.last_name?.[0]}
          </div>
          <div>
            <h1 className="font-display text-2xl text-white">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-sm text-gray-500">
              {employee.login_id} · {employee.designation || employee.role} · {employee.department}
            </p>
          </div>
        </div>

        {msg && <p className="mt-3 text-sm text-absent">{msg}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Email" value={employee.email} />
          <ReadOnlyField label="Phone" value={employee.phone} />
          <ReadOnlyField label="Residential Address" value={employee.residential_address} />
          <ReadOnlyField label="Date of Birth" value={employee.date_of_birth} />
          <ReadOnlyField label="Blood Group" value={employee.blood_group} />
          <ReadOnlyField label="Date of Joining" value={employee.date_of_joining} />
          <div className="sm:col-span-2">
            <ReadOnlyField label="About" value={employee.about} />
          </div>
          <div className="sm:col-span-2">
            <ReadOnlyField label="What I love about my job" value={employee.what_i_love_about_my_job} />
          </div>
        </div>

        {salary && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm uppercase tracking-wide text-gray-500">Salary Info (Admin only)</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Monthly Wage" value={`₹${salary.monthly_wage}`} />
              <ReadOnlyField label="Yearly Wage" value={`₹${salary.yearly_wage}`} />
              <ReadOnlyField label="Basic Salary" value={`₹${salary.basic_salary}`} />
              <ReadOnlyField label="House Rent Allowance" value={`₹${salary.house_rent_allowance}`} />
            </div>
          </div>
        )}
      </div>
    </div>
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
