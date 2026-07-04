'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-hidden" data-applayout="true" style={{ background: 'var(--t-bg)' }}>
      {/* Ambient aurora orbs */}
      <div
        className="aurora-orb"
        style={{
          width: 600, height: 600,
          top: -200, left: -200,
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: 500, height: 500,
          bottom: -100, right: 100,
          background: 'radial-gradient(circle, rgba(2,132,199,0.04) 0%, transparent 70%)',
          animationDelay: '4s',
        }}
      />

      {/* Mobile Top Header Bar */}
      <header
        className="lg:hidden flex h-16 items-center justify-between px-6 z-30 sticky top-0 backdrop-blur-md"
        style={{
          background: 'var(--t-glass-bg)',
          borderBottom: '1px solid var(--t-border)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
              style={{
                background: 'var(--t-accent-grad)',
                boxShadow: '0 4px 10px var(--t-accent-glow)',
              }}
            >
              HR
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-gray-800">
              <span style={{ color: 'var(--t-accent-s)' }}>Odoo</span> HRMS
            </span>
          </Link>
        </div>
      </header>

      {/* Sidebar with responsive props */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Scrollable Main Content Area */}
      <main
        className="flex-1 overflow-y-auto relative w-full"
        style={{ zIndex: 10 }}
      >
        {children}
      </main>
    </div>
  );
}
