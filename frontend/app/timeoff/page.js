'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api, getUser } from '../../lib/api';

const typeLabels = {
  paid_time_off: 'Paid Time Off',
  sick_leave: 'Sick Leave',
  unpaid_leave: 'Unpaid Leave',
};

const statusBadge = {
  pending: 'bg-onleave/20 text-onleave',
  approved: 'bg-present/20 text-present',
  rejected: 'bg-absent/20 text-absent',
};

export default function TimeOffPage() {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ timeOffType: 'paid_time_off', startDate: '', endDate: '', remarks: '' });
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
      const [{ allocation }, { requests }] = await Promise.all([api.getAllocation(), api.listTimeoffRequests()]);
      setAllocation(allocation);
      setRequests(requests);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function submitRequest(e) {
    e.preventDefault();
    try {
      await api.createTimeoffRequest(form);
      setShowForm(false);
      setForm({ timeOffType: 'paid_time_off', startDate: '', endDate: '', remarks: '' });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function review(id, status) {
    try {
      await api.reviewTimeoffRequest(id, { status });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);
  const paidLeft = allocation ? allocation.paid_time_off_total - allocation.paid_time_off_used : 0;
  const sickLeft = allocation ? allocation.sick_leave_total - allocation.sick_leave_used : 0;

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-white">Time Off</h1>
          {!isAdmin && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-semibold text-white"
            >
              {showForm ? 'Close' : '+ New Request'}
            </button>
          )}
        </div>

        {!isAdmin && allocation && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-sm text-gray-400">Paid Time Off</p>
              <p className="mt-1 text-2xl font-semibold text-white">{paidLeft} days</p>
              <p className="text-xs text-gray-500">available of {allocation.paid_time_off_total}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-sm text-gray-400">Sick Leave</p>
              <p className="mt-1 text-2xl font-semibold text-white">{sickLeft} days</p>
              <p className="text-xs text-gray-500">available of {allocation.sick_leave_total}</p>
            </div>
          </div>
        )}

        {msg && <p className="mt-4 text-sm text-absent">{msg}</p>}

        {showForm && (
          <form onSubmit={submitRequest} className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-line bg-panel p-5 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Time Off Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={form.timeOffType}
                onChange={(e) => setForm({ ...form, timeOffType: e.target.value })}
              >
                <option value="paid_time_off">Paid Time Off</option>
                <option value="sick_leave">Sick Leave</option>
                <option value="unpaid_leave">Unpaid Leave</option>
              </select>
            </div>
            <div />
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Start Date</label>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">End Date</label>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wide text-gray-500">Remarks</label>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-5 py-2 text-sm font-semibold text-white">
                Submit Request
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel2 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {isAdmin && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-4 py-6 text-center text-gray-500">
                    No time off requests yet.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-line bg-panel">
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-300">
                      {r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-300">{typeLabels[r.time_off_type]}</td>
                  <td className="px-4 py-3 text-gray-300">{r.start_date}</td>
                  <td className="px-4 py-3 text-gray-300">{r.end_date}</td>
                  <td className="px-4 py-3 text-gray-300">{r.days_requested}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusBadge[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => review(r.id, 'approved')}
                            className="rounded-md bg-present/20 px-2.5 py-1 text-xs text-present"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => review(r.id, 'rejected')}
                            className="rounded-md bg-absent/20 px-2.5 py-1 text-xs text-absent"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">Reviewed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
