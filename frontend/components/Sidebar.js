'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, clearSession } from '../lib/api';
import { LayoutDashboard, Users, CalendarCheck, CalendarDays, Wallet, User as UserIcon, LogOut } from 'lucide-react';

const statusColor = {
  present: 'bg-present',
  on_leave: 'bg-onleave',
  absent: 'bg-absent',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUserState] = useState(null);

  useEffect(() => {
    setUserState(getUser());
  }, []);

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

  return (
    <aside className="sticky top-0 h-screen w-64 flex flex-col border-r border-line bg-panel shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-line">
        <Link href="/dashboard" className="font-display text-xl tracking-wide text-white font-bold">
          <span className="text-accent2">Odoo</span> HRMS
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {links.map((l) => {
          const active = pathname?.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-accent/20 to-transparent text-accent2'
                  : 'text-gray-400 hover:bg-panel2 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-accent2' : 'text-gray-500'}`} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-xl bg-panel2 p-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-semibold text-white">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-panel2 ${
                statusColor[user.status] || 'bg-gray-500'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <Link
            href="/profile"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-panel2 py-2 text-xs font-medium text-gray-300 hover:bg-line hover:text-white transition"
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </Link>
          <button
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-panel2 py-2 text-xs font-medium text-gray-300 hover:bg-absent/20 hover:text-absent transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
