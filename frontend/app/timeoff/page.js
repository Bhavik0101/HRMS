'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

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
  // User is a manager if they have requests in the list that belong to their direct reports
  const isManager = requests.some(r => r.employees?.manager_id === user.id);
  const canReviewOthers = isAdmin || isManager;
  
  const paidLeft = allocation ? allocation.paid_time_off_total - allocation.paid_time_off_used : 0;
  const sickLeft = allocation ? allocation.sick_leave_total - allocation.sick_leave_used : 0;

  // Calendar rendering logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  function getLeavesForDay(day) {
    const leaves = [];
    for (const req of requests) {
      if (req.status !== 'approved') continue;
      
      const reqStart = new Date(req.start_date);
      const reqEnd = new Date(req.end_date);
      reqStart.setHours(0,0,0,0);
      reqEnd.setHours(0,0,0,0);
      const current = new Date(day);
      current.setHours(0,0,0,0);

      if (current >= reqStart && current <= reqEnd) {
        leaves.push(req);
      }
    }
    return leaves;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-white">Time Off</h1>
          {!isAdmin && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-4 py-2 text-sm font-semibold text-white"
            >
              {showForm ? 'Cancel Request' : 'Apply for Leave'}
            </button>
          )}
        </div>

        {msg && <p className="mb-4 text-sm text-absent">{msg}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {!isAdmin && allocation && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-line bg-panel p-5">
                  <p className="text-sm text-gray-400">Paid Time Off</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{paidLeft}</p>
                  <p className="text-xs text-gray-500 mt-1">days available</p>
                </div>
                <div className="rounded-xl border border-line bg-panel p-5">
                  <p className="text-sm text-gray-400">Sick Leave</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{sickLeft}</p>
                  <p className="text-xs text-gray-500 mt-1">days available</p>
                </div>
              </div>
            )}

            {showForm && (
              <form onSubmit={submitRequest} className="rounded-xl border border-line bg-panel p-5 space-y-4">
                <h3 className="font-medium text-white mb-2">New Leave Request</h3>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Type</label>
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
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Remarks</label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </div>
                <button className="w-full rounded-lg bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-semibold text-white">
                  Submit Request
                </button>
              </form>
            )}

            <div className="rounded-xl border border-line bg-panel">
              <div className="px-5 py-4 border-b border-line">
                <h3 className="font-medium text-white">{canReviewOthers ? 'Requests & Approvals' : 'My Requests'}</h3>
              </div>
              <div className="divide-y divide-line max-h-96 overflow-y-auto">
                {requests.length === 0 ? (
                  <p className="px-5 py-6 text-center text-sm text-gray-500">No requests found.</p>
                ) : (
                  requests.map((r) => (
                    <div key={r.id} className="px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          {r.employees && r.employee_id !== user.id && (
                            <p className="text-sm font-medium text-white mb-1">
                              {r.employees.first_name} {r.employees.last_name}
                            </p>
                          )}
                          <p className="text-sm text-gray-300">{typeLabels[r.time_off_type]}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{r.start_date} to {r.end_date}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${statusBadge[r.status]}`}>
                          {r.status}
                        </span>
                      </div>
                      {(isAdmin || r.employees?.manager_id === user.id) && r.status === 'pending' && r.employee_id !== user.id && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => review(r.id, 'approved')} className="flex-1 rounded-md bg-present/10 border border-present/20 px-2 py-1.5 text-xs font-medium text-present hover:bg-present/20 transition">Approve</button>
                          <button onClick={() => review(r.id, 'rejected')} className="flex-1 rounded-md bg-absent/10 border border-absent/20 px-2 py-1.5 text-xs font-medium text-absent hover:bg-absent/20 transition">Reject</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-line bg-panel overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-panel2">
                <h2 className="text-lg font-medium text-white">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 rounded bg-panel border border-line text-gray-400 hover:text-white transition">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 rounded bg-panel border border-line text-gray-400 hover:text-white transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 border-b border-line text-center bg-panel/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 auto-rows-[100px] divide-x divide-y divide-line border-l border-line">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const dayLeaves = getLeavesForDay(day);

                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`relative p-2 transition-colors overflow-y-auto ${!isCurrentMonth ? 'bg-panel2/30 opacity-50' : 'bg-panel hover:bg-panel2/50'} ${
                        idx < 7 ? 'border-t-0' : ''
                      }`}
                      onClick={() => {
                        if (!isAdmin && !showForm) {
                          setShowForm(true);
                          setForm({ ...form, startDate: format(day, 'yyyy-MM-dd'), endDate: format(day, 'yyyy-MM-dd') });
                        }
                      }}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs mb-1 ${isTodayDate ? 'bg-accent text-white font-bold' : 'text-gray-400'}`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayLeaves.map(leave => (
                          <div key={leave.id} className="rounded bg-onleave/20 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-onleave border border-onleave/30 truncate">
                            {leave.employee_id !== user.id && leave.employees 
                              ? `${leave.employees.first_name}: ${typeLabels[leave.time_off_type]}`
                              : typeLabels[leave.time_off_type]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
