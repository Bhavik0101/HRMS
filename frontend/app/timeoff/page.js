'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, Umbrella } from 'lucide-react';

const typeLabels = {
  paid_time_off: 'Paid Time Off',
  sick_leave:    'Sick Leave',
  unpaid_leave:  'Unpaid Leave',
};

const typeColors = {
  paid_time_off: '#8B5CF6',
  sick_leave:    '#22C55E',
  unpaid_leave:  '#F59E0B',
};

export default function TimeOffPage() {
  const router = useRouter();
  const [user, setUserState]         = useState(null);
  const [allocation, setAllocation]  = useState(null);
  const [requests, setRequests]      = useState([]);
  const [showForm, setShowForm]      = useState(false);
  const [form, setForm]              = useState({ timeOffType:'paid_time_off', startDate:'', endDate:'', remarks:'' });
  const [msg, setMsg]                = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
    setUserState(u);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const [{ allocation }, { requests }] = await Promise.all([api.getAllocation(), api.listTimeoffRequests()]);
      setAllocation(allocation);
      setRequests(requests);
    } catch (err) { setMsg(err.message); }
  }

  async function submitRequest(e) {
    e.preventDefault();
    try {
      await api.createTimeoffRequest(form);
      setShowForm(false);
      setForm({ timeOffType:'paid_time_off', startDate:'', endDate:'', remarks:'' });
      load();
    } catch (err) { setMsg(err.message); }
  }

  async function review(id, status) {
    try { await api.reviewTimeoffRequest(id, { status }); load(); }
    catch (err) { setMsg(err.message); }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);
  const isManager = requests.some(r => r.employees?.manager_id === user.id);
  const canReviewOthers = isAdmin || isManager;

  const paidLeft = allocation ? allocation.paid_time_off_total - allocation.paid_time_off_used : 0;
  const sickLeft = allocation ? allocation.sick_leave_total - allocation.sick_leave_used : 0;

  const monthStart   = startOfMonth(currentDate);
  const monthEnd     = endOfMonth(currentDate);
  const calDays      = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  function getLeavesForDay(day) {
    return requests.filter(req => {
      if (req.status !== 'approved') return false;
      const s = new Date(req.start_date); s.setHours(0,0,0,0);
      const e = new Date(req.end_date);   e.setHours(0,0,0,0);
      const d = new Date(day);            d.setHours(0,0,0,0);
      return d >= s && d <= e;
    });
  }

  const statusBadgeClass = { pending:'badge-pending', approved:'badge-approved', rejected:'badge-rejected' };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'rgba(192,132,252,0.6)' }}>Leave Management</p>
            <h1 className="font-display text-3xl font-bold text-white">Time Off</h1>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowForm(v => !v)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${!showForm ? 'btn-glow text-white' : ''}`}
              style={showForm ? { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#FCA5A5' } : undefined}
            >
              {showForm ? <><X className="w-4 h-4" />Cancel</> : <><Plus className="w-4 h-4" />Apply for Leave</>}
            </button>
          )}
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5' }}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT PANEL */}
          <div className="lg:col-span-1 space-y-5">

            {/* Balance cards */}
            {!isAdmin && allocation && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Paid Time Off', left: paidLeft, total: allocation.paid_time_off_total, color:'#8B5CF6', icon: CalendarDays },
                  { label:'Sick Leave',    left: sickLeft,  total: allocation.sick_leave_total,    color:'#22C55E', icon: Umbrella },
                ].map(({ label, left, total, color, icon: Icon }) => (
                  <div key={label} className="glass-card p-4 relative overflow-hidden">
                    <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${color}20, transparent)`, filter:'blur(8px)' }} />
                    <Icon className="w-5 h-5 mb-3" style={{ color }} />
                    <p className="text-3xl font-bold font-display" style={{ color }}>{left}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--t-text-muted)' }}>of {total} days left</p>
                    <p className="text-xs mt-1 font-medium" style={{ color:'var(--t-text-dim)' }}>{label}</p>
                    {/* Progress bar */}
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width:`${Math.max(0,(left/total)*100)}%`, background:color, boxShadow:`0 0 6px ${color}` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Request form */}
            {showForm && (
              <div className="glass-card p-5 space-y-4 animate-in">
                <h3 className="font-display font-semibold text-white">New Leave Request</h3>
                <form onSubmit={submitRequest} className="space-y-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Type</label>
                    <select className="glass-input w-full px-4 py-2.5 text-sm" value={form.timeOffType} onChange={e => setForm({...form, timeOffType:e.target.value})}>
                      <option value="paid_time_off">Paid Time Off</option>
                      <option value="sick_leave">Sick Leave</option>
                      <option value="unpaid_leave">Unpaid Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[['startDate','Start Date'],['endDate','End Date']].map(([k, lbl]) => (
                      <div key={k}>
                        <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>{lbl}</label>
                        <input type="date" required className="glass-input w-full px-4 py-2.5 text-sm"
                          value={form[k]} onChange={e => setForm({...form, [k]:e.target.value})} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Remarks</label>
                    <textarea rows={2} className="glass-input w-full px-4 py-2.5 text-sm resize-none"
                      value={form.remarks} onChange={e => setForm({...form, remarks:e.target.value})} />
                  </div>
                  <button type="submit" className="btn-glow w-full py-2.5 text-sm font-semibold text-white rounded-xl">Submit Request</button>
                </form>
              </div>
            )}

            {/* Requests list */}
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(139,92,246,0.1)' }}>
                <h3 className="font-display font-semibold text-white">
                  {canReviewOthers ? 'Requests & Approvals' : 'My Requests'}
                </h3>
              </div>
              <div className="divide-y overflow-y-auto max-h-96" style={{ '--tw-divide-opacity':1 }}>
                {requests.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm" style={{ color:'var(--t-text-dim)' }}>No requests found.</p>
                ) : requests.map(r => (
                  <div key={r.id} className="px-5 py-4 transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom:'1px solid rgba(139,92,246,0.07)' }}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        {r.employees && r.employee_id !== user.id && (
                          <p className="text-sm font-semibold text-white truncate mb-0.5">
                            {r.employees.first_name} {r.employees.last_name}
                          </p>
                        )}
                        <p className="text-sm font-medium" style={{ color: typeColors[r.time_off_type] || '#C084FC' }}>
                          {typeLabels[r.time_off_type]}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color:'var(--t-text-dim)' }}>
                          {r.start_date} → {r.end_date}
                        </p>
                      </div>
                      <span className={`badge shrink-0 ${statusBadgeClass[r.status] || 'badge-pending'}`}>
                        {r.status}
                      </span>
                    </div>
                    {(isAdmin || r.employees?.manager_id === user.id) && r.status === 'pending' && r.employee_id !== user.id && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => review(r.id, 'approved')}
                          className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                          style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => review(r.id, 'rejected')}
                          className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444' }}>
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Calendar */}
          <div className="lg:col-span-2">
            <div className="glass-card overflow-hidden">
              {/* Calendar header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid var(--t-border)', background:'rgba(139,92,246,0.05)' }}>
                <h2 className="font-display text-lg font-semibold text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  {[
                    [subMonths, ChevronLeft, 'prev'],
                    [addMonths, ChevronRight, 'next'],
                  ].map(([fn, Icon, key]) => (
                    <button
                      key={key}
                      onClick={() => setCurrentDate(fn(currentDate, 1))}
                      className="neumorphic-btn p-2 text-gray-400 hover:text-white"
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 text-center" style={{ borderBottom:'1px solid var(--t-border)', background:'var(--t-surface2)' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="py-3 text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.5)' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7" style={{ gridAutoRows:'90px' }}>
                {calDays.map((day, idx) => {
                  const inMonth  = isSameMonth(day, currentDate);
                  const todayDay = isToday(day);
                  const leaves   = getLeavesForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className="relative p-2 overflow-hidden cursor-pointer transition-colors"
                      style={{
                        background: todayDay
                          ? 'rgba(139,92,246,0.08)'
                          : !inMonth
                            ? 'rgba(0,0,0,0.2)'
                            : 'transparent',
                        borderRight:  (idx+1) % 7 !== 0 ? '1px solid rgba(139,92,246,0.07)' : 'none',
                        borderBottom: idx < calDays.length - 7 ? '1px solid rgba(139,92,246,0.07)' : 'none',
                        opacity: inMonth ? 1 : 0.4,
                      }}
                      onClick={() => {
                        if (!isAdmin && !showForm) {
                          setShowForm(true);
                          setForm({ ...form, startDate: format(day,'yyyy-MM-dd'), endDate: format(day,'yyyy-MM-dd') });
                        }
                      }}
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mb-1"
                        style={todayDay
                          ? { background:'linear-gradient(135deg,#8B5CF6,#C084FC)', color:'#fff', boxShadow:'0 0 10px rgba(139,92,246,0.5)' }
                          : { color:'var(--t-text-dim)' }}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {leaves.map(leave => (
                          <div
                            key={leave.id}
                            className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight truncate"
                            style={{
                              background:`${typeColors[leave.time_off_type]}1A`,
                              border:`1px solid ${typeColors[leave.time_off_type]}30`,
                              color: typeColors[leave.time_off_type],
                            }}
                          >
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
