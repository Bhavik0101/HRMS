'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { ChevronLeft, ChevronRight, Clock, UserCheck } from 'lucide-react';

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ value }) {
  const map = {
    present:   'badge-present',
    on_leave:  'badge-on-leave',
    absent:    'badge-absent',
    half_day:  'badge-pending',
    late:      'badge-pending',
  };
  return (
    <span className={`badge ${map[value] || 'badge-pending'}`}>
      {value?.replace('_', ' ') || '—'}
    </span>
  );
}

export default function AttendancePage() {
  const router  = useRouter();
  const [user, setUserState]   = useState(null);
  const [records, setRecords]  = useState([]);
  const [date, setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg]          = useState('');
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
    setUserState(u);
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function load(d) {
    setLoading(true);
    try {
      const isAdmin = ['admin', 'hr'].includes(getUser().role);
      const { attendance } = await api.listAttendance(isAdmin ? { date: d } : {});
      setRecords(attendance);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
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
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'rgba(192,132,252,0.6)' }}>
              Records
            </p>
            <h1 className="font-display text-3xl font-bold text-white">Attendance</h1>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftDate(-1)}
                className="neumorphic-btn p-2.5 text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input px-4 py-2.5 text-sm font-medium"
              />
              <button
                onClick={() => shiftDate(1)}
                className="neumorphic-btn p-2.5 text-gray-400 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5' }}>
            {msg}
          </div>
        )}

        {/* Stats strip (admin only) */}
        {isAdmin && !loading && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Total Records', value: records.length, icon: Clock, color:'#8B5CF6' },
              { label:'Present', value: records.filter(r => r.status === 'present').length, icon: UserCheck, color:'#22C55E' },
              { label:'Absent / Leave', value: records.filter(r => ['absent','on_leave'].includes(r.status)).length, icon: Clock, color:'#F59E0B' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                    style={{ background:`${s.color}18`, boxShadow:`3px 3px 8px rgba(0,0,0,0.4), 0 0 8px ${s.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color:s.color }} />
                  </span>
                  <div>
                    <p className="text-xl font-bold font-display" style={{ color:s.color }}>{s.value}</p>
                    <p className="text-xs" style={{ color:'var(--t-text-muted)' }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="glass-table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="glass-table-head">
                  {isAdmin && <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Employee</th>}
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Check In</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Check Out</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Work Hours</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Extra</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2" style={{ color:'rgba(192,132,252,0.5)' }}>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Loading…
                    </div>
                  </td></tr>
                )}
                {!loading && records.length === 0 && (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center text-sm" style={{ color:'var(--t-text-dim)' }}>
                    No attendance records found.
                  </td></tr>
                )}
                {!loading && records.map((r) => (
                  <tr key={r.id} className="glass-table-row">
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shrink-0"
                            style={{ background:'linear-gradient(135deg,#8B5CF6,#C084FC)', boxShadow:'2px 2px 6px rgba(0,0,0,0.4)' }}>
                            {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                          </div>
                          <span className="text-white font-medium text-sm">
                            {r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : '—'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm" style={{ color:'var(--t-text-muted)' }}>{r.attendance_date}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm" style={{ color: r.check_in ? '#22C55E' : 'var(--t-text-dim)' }}>
                        {fmtTime(r.check_in)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm" style={{ color: r.check_out ? '#F59E0B' : 'var(--t-text-dim)' }}>
                        {fmtTime(r.check_out)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-white">{r.work_hours ?? '—'}</td>
                    <td className="px-5 py-4 font-mono text-sm" style={{ color:'rgba(192,132,252,0.8)' }}>{r.extra_hours ?? '—'}</td>
                    <td className="px-5 py-4"><StatusBadge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
