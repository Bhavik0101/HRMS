'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/signin');
      return;
    }
    setUserState(u);
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function load(d) {
    try {
      const isAdmin = ['admin', 'hr'].includes(getUser().role);
      const { attendance } = await api.listAttendance(isAdmin ? { date: d } : {});
      setRecords(attendance);
    } catch (err) {
      setMsg(err.message);
    }
  }

  function shiftDate(days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-display text-2xl text-white">Attendance</h1>

        {isAdmin && (
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => shiftDate(-1)} className="rounded-md border border-line px-3 py-1 text-gray-400">
              ‹
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-line bg-panel2 px-3 py-1.5 text-sm text-white"
            />
            <button onClick={() => shiftDate(1)} className="rounded-md border border-line px-3 py-1 text-gray-400">
              ›
            </button>
          </div>
        )}

        {msg && <p className="mt-3 text-sm text-absent">{msg}</p>}

        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel2 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {isAdmin && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Work Hours</th>
                <th className="px-4 py-3">Extra Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                    No attendance records found.
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r.id} className="border-t border-line bg-panel">
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-300">
                      {r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-300">{r.attendance_date}</td>
                  <td className="px-4 py-3 text-gray-300">{fmtTime(r.check_in)}</td>
                  <td className="px-4 py-3 text-gray-300">{fmtTime(r.check_out)}</td>
                  <td className="px-4 py-3 text-gray-300">{r.work_hours}</td>
                  <td className="px-4 py-3 text-gray-300">{r.extra_hours}</td>
                  <td className="px-4 py-3 capitalize text-gray-300">{r.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
