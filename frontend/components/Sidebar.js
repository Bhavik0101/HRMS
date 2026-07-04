'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, clearSession } from '../lib/api';
import {
  LayoutDashboard, Users, CalendarCheck,
  CalendarDays, Wallet, User as UserIcon, LogOut, X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUserState] = useState(null);

  useEffect(() => { setUserState(getUser()); }, []);

  // Auto-close sidebar on page change for mobile
  useEffect(() => {
    if (onClose) onClose();
  }, [pathname]);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/timeoff', label: 'Time Off', icon: CalendarDays },
    { href: '/payroll', label: 'Payroll', icon: Wallet },
  ];

  function logout() {
    clearSession();
    router.push('/signin');
  }

  if (!user) return null;

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`;
  const statusColors = { present: '#22C55E', on_leave: '#F59E0B', absent: '#EF4444' };
  const statusDot = statusColors[user.status] ?? '#6B7280';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`glass-sidebar fixed top-0 bottom-0 left-0 w-64 flex flex-col shrink-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6" style={{ borderBottom: '1px solid var(--t-border)' }}>
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* Neumorphic logo badge */}
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{
                background: 'var(--t-accent-grad)',
                boxShadow: '0 4px 12px var(--t-accent-glow), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              HR
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              <span style={{ color: 'var(--t-accent-s)' }}>Odoo</span>
              <span style={{ color: 'var(--t-text-muted)' }}> HRMS</span>
            </span>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {links.map((l) => {
          const active = pathname?.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${active ? 'nav-active' : 'text-gray-400 hover:text-white'
                }`}
              style={!active ? {
                borderLeft: '3px solid transparent',
              } : undefined}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 shrink-0"
                style={active ? {
                  background: 'var(--t-accent-glow-sm)',
                  boxShadow: '0 0 10px var(--t-accent-glow), inset 2px 2px 5px rgba(0,0,0,0.3)',
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.4), -1px -1px 4px rgba(255,255,255,0.03)',
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: active ? 'var(--t-accent-s)' : 'inherit' }}
                />
              </span>
              <span className="truncate">{l.label}</span>

              {active && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: 'var(--t-accent-s)', boxShadow: '0 0 6px var(--t-accent-s)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="p-3" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{
            background: 'var(--t-surface)',
            boxShadow: 'inset 3px 3px 8px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(255,255,255,0.03)',
            border: '1px solid var(--t-border)',
          }}
        >
          <div className="relative shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{
                background: 'var(--t-accent-grad)',
                boxShadow: '3px 3px 8px rgba(0,0,0,0.5), -1px -1px 5px rgba(255,255,255,0.04), 0 0 10px var(--t-accent-glow)',
              }}
            >
              {initials}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
              style={{
                background: statusDot,
                borderColor: 'var(--t-surface)',
                boxShadow: `0 0 6px ${statusDot}`,
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs capitalize" style={{ color: 'var(--t-accent-s)', opacity: 0.8 }}>
              {user.role}
            </p>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <Link
            href="/profile"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(255,255,255,0.03)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text-muted)',
            }}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Profile
          </Link>
          <button
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all duration-200 hover:text-red-400"
            style={{
              background: 'rgba(255,255,255,0.03)',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(255,255,255,0.03)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text-muted)',
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  </>
  );
}
