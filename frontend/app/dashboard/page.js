'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { api, getUser } from '../../lib/api';
import { Clock, CheckCircle2, UserCheck, ChevronRight, Users, CalendarDays, ArrowRight } from 'lucide-react';


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUserState]             = useState(null);
  const [employees, setEmployees]        = useState([]);
  const [attendanceToday, setAttToday]   = useState(null);
  const [loading, setLoading]            = useState(true);
  const [msg, setMsg]                    = useState('');
  const [checkInAnim, setCheckInAnim]    = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
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
      setAttToday(mine || null);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  }

  async function handleCheckIn() {
    try {
      setCheckInAnim(true);
      await api.checkIn();
      const u = getUser(); u.status = 'present';
      localStorage.setItem('hrms_user', JSON.stringify(u));
      await load();
    } catch (err) { setMsg(err.message); }
    finally { setTimeout(() => setCheckInAnim(false), 1000); }
  }

  async function handleCheckOut() {
    try { await api.checkOut(); await load(); }
    catch (err) { setMsg(err.message); }
  }

  if (!user) return null;
  const isAdmin = ['admin', 'hr'].includes(user.role);
  const now     = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const statusColors = { present:'#10B981', on_leave:'#F59E0B', absent:'#EF4444' };
  const statCards = isAdmin ? [
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'var(--t-accent-p)' },
    { label: 'Present Today', value: employees.filter(e => e.status === 'present').length, icon: UserCheck, color: '#10B981' },
    { label: 'On Leave', value: employees.filter(e => e.status === 'on_leave').length, icon: CalendarDays, color: '#F59E0B' },
  ] : [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'var(--t-text-label)' }}>
              {greeting}
            </p>
            <h1 className="font-display text-3xl font-bold text-white">
              {user.first_name} {user.last_name}
            </h1>
            <p className="mt-1 text-sm" style={{ color:'var(--t-text-muted)' }}>
              {isAdmin ? 'Here is your team at a glance.' : "Here's your workday summary."}
            </p>
          </div>

          {/* Check-in / Check-out button */}
          <div className="flex items-center gap-3">
            {!attendanceToday?.check_in && (
              <button
                onClick={handleCheckIn}
                className={`btn-glow flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl ${checkInAnim ? 'scale-95' : ''} transition-transform`}
              >
                <Clock className="w-4 h-4" />
                Check In
              </button>
            )}
            {attendanceToday?.check_in && !attendanceToday?.check_out && (
              <button
                onClick={handleCheckOut}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all"
                style={{
                  background:'rgba(245,158,11,0.15)',
                  border:'1px solid rgba(245,158,11,0.3)',
                  boxShadow:'0 0 14px rgba(245,158,11,0.2)',
                }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color:'#F59E0B' }} />
                Check Out
              </button>
            )}
            {attendanceToday?.check_out && (
              <span
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium"
                style={{
                  background:'rgba(34,197,94,0.1)',
                  border:'1px solid rgba(34,197,94,0.25)',
                  color:'#22C55E',
                  boxShadow:'0 0 12px rgba(34,197,94,0.15)',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {attendanceToday.work_hours}h logged
              </span>
            )}
          </div>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5' }}>
            {msg}
          </div>
        )}

        {/* ── Admin stat cards ── */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {statCards.map((s) => {
               const Icon = s.icon;
               return (
                 <div key={s.label} className="glass-card shine-card p-6">
                   <div className="flex items-center justify-between mb-4">
                     <span
                       className="flex h-11 w-11 items-center justify-center rounded-xl"
                       style={{
                         background: s.color === 'var(--t-accent-p)' ? 'var(--t-accent-glow-sm)' : s.color === '#10B981' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                         boxShadow: `4px 4px 10px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03), 0 0 10px ${s.color === 'var(--t-accent-p)' ? 'rgba(79,70,229,0.3)' : s.color === '#10B981' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                       }}
                     >
                       <Icon className="w-5 h-5" style={{ color: s.color }} />
                     </span>
                     <span className="text-3xl font-bold font-display" style={{ color: s.color }}>
                       {loading ? '–' : s.value}
                     </span>
                   </div>
                   <p className="text-sm font-medium" style={{ color:'var(--t-text-muted)' }}>{s.label}</p>
                 </div>
               );
            })}
          </div>
        )}

        {/* ── Quick links ── */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color:'var(--t-text-label)' }}>
            Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickLink href="/profile"    title="My Profile"  desc="View & edit your details"  glow="var(--t-accent-p)" />
            <QuickLink href="/attendance" title="Attendance"  desc="Daily & weekly records"     glow="#10B981" />
            <QuickLink href="/timeoff"    title="Time Off"    desc="Apply & track leave"        glow="var(--t-accent-s)" />
          </div>
        </div>

        {/* ── Employees grid (admin) ── */}
        {isAdmin && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color:'var(--t-text-label)' }}>
                Team Members
              </h2>
              <a href="/employees" className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70" style={{ color:'var(--t-accent-s)' }}>
                View all <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="glass-card h-24 animate-pulse" style={{ background:'var(--t-accent-glow-sm)' }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {employees.slice(0, 6).map((emp) => {
                  const dotColor = statusColors[emp.status] ?? '#6B7280';
                  return (
                    <a
                      key={emp.id}
                      href={`/employees/${emp.id}`}
                      className="glass-card group flex items-center gap-4 p-4"
                    >
                      <div className="relative shrink-0">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{
                            background:'var(--t-accent-grad)',
                            boxShadow:'3px 3px 8px rgba(0,0,0,0.5), 0 0 10px var(--t-accent-glow)',
                          }}
                        >
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                          style={{ background:dotColor, borderColor:'var(--t-surface)', boxShadow:`0 0 6px ${dotColor}` }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color:'var(--t-text-label)' }}>
                          {emp.designation || emp.role}
                        </p>
                        <p className="text-xs truncate" style={{ color:'var(--t-text-dim)' }}>{emp.department}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:'var(--t-accent-p)' }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function QuickLink({ href, title, desc, glow }) {
  return (
    <a
      href={href}
      className="glass-card group flex flex-col justify-between p-5 relative overflow-hidden"
    >
      {/* Corner glow */}
      <div
        style={{
          position:'absolute', top:-20, right:-20,
          width:80, height:80, borderRadius:'50%',
          background:`radial-gradient(circle, ${glow === 'var(--t-accent-p)' || glow === 'var(--t-accent-s)' ? glow : '#10B981'}25 0%, transparent 70%)`,
          filter:'blur(8px)',
          pointerEvents:'none',
          transition:'opacity 0.3s',
        }}
      />
      <div>
        <p className="font-display font-semibold text-base text-white">{title}</p>
        <p className="mt-1 text-sm" style={{ color:'var(--t-text-muted)' }}>{desc}</p>
      </div>
      <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color: glow === 'var(--t-accent-p)' || glow === 'var(--t-accent-s)' ? 'var(--t-accent-p)' : '#10B981' }}>
        Open <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}


