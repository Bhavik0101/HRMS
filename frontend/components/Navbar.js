'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, clearSession } from '../lib/api';

const statusColor = {
  present: 'bg-present',
  on_leave: 'bg-onleave',
  absent: 'bg-absent',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  const links = [
    { href: '/employees', label: 'Employees' },
    { href: '/attendance', label: 'Attendance' },
    { href: '/timeoff', label: 'Time Off' },
  ];

  function logout() {
    clearSession();
    router.push('/signin');
  }

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-panel/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-display text-lg tracking-wide text-white">
          HRMS
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                pathname?.startsWith(l.href)
                  ? 'bg-accent/20 text-accent2'
                  : 'text-gray-400 hover:bg-panel2 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        <span className={`status-dot ${statusColor[user?.status] || 'bg-gray-500'}`} title={user?.status} />
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-semibold text-white"
        >
          {user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '?'}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-11 w-44 overflow-hidden rounded-lg border border-line bg-panel2 shadow-card">
            <Link
              href="/profile"
              className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-panel"
              onClick={() => setMenuOpen(false)}
            >
              My Profile
            </Link>
            <button
              onClick={logout}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-panel"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
