'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';

const statusColor = {
  present: 'bg-present',
  on_leave: 'bg-onleave',
  absent: 'bg-absent',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const [empData, attData] = await Promise.all([
        api.listEmployees(),
        api.listAttendance({ date: new Date().toISOString().slice(0, 10) }),
      ]);
      setEmployees(empData.employees);
      const u = getUser();
      const mine = attData.attendance.find((a) => a.employee_id === u.id);
      setAttendanceToday(mine || null);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    try {
      await api.checkIn();
      const u = getUser();
      u.status = 'present';
      localStorage.setItem('hrms_user', JSON.stringify(u));
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function handleCheckOut() {
    try {
      await api.checkOut();
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white">
              Welcome back, {user.first_name}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {isAdmin ? 'Here is your team at a glance.' : "Here's your workday summary."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!attendanceToday?.check_in && (
              <button
                onClick={handleCheckIn}
                className="rounded-lg bg-present px-4 py-2 text-sm font-semibold text-black"
              >
                Check In
              </button>
            )}
            {attendanceToday?.check_in && !attendanceToday?.check_out && (
              <button
                onClick={handleCheckOut}
                className="rounded-lg bg-onleave px-4 py-2 text-sm font-semibold text-black"
              >
                Check Out
              </button>
            )}
            {attendanceToday?.check_out && (
              <span className="rounded-lg border border-line px-4 py-2 text-sm text-gray-400">
                Day complete · {attendanceToday.work_hours}h logged
              </span>
            )}
          </div>
        </div>

        {msg && <p className="mt-4 text-sm text-absent">{msg}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickLink href="/profile" title="My Profile" desc="View & edit your details" />
          <QuickLink href="/attendance" title="Attendance" desc="Daily & weekly records" />
          <QuickLink href="/timeoff" title="Time Off" desc="Apply & track leave" />
        </div>

        {isAdmin && (
          <div className="mt-10">
            <h2 className="mb-4 text-sm uppercase tracking-wide text-gray-500">Employees</h2>
            {loading ? (
              <p className="text-gray-500">Loading…</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((emp) => (
                  <a
                    key={emp.id}
                    href={`/employees/${emp.id}`}
                    className="relative rounded-xl border border-line bg-panel p-4 shadow-card transition hover:border-accent"
                  >
                    <span
                      className={`status-dot absolute right-4 top-4 ${statusColor[emp.status] || 'bg-gray-500'}`}
                    />
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
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function QuickLink({ href, title, desc }) {
  return (
    <a href={href} className="rounded-xl border border-line bg-panel p-5 shadow-card transition hover:border-accent">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </a>
  );
}
