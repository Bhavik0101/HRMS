'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggle, mounted } = useTheme();

  if (!mounted) return null; // prevent SSR mismatch

  const isDark = theme === 'dark';

  if (compact) {
    // Icon-only minimal version for tight spaces
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="neumorphic-btn flex h-9 w-9 items-center justify-center rounded-xl text-base transition-all"
        aria-label="Toggle theme"
      >
        {isDark ? '🌙' : '☀️'}
      </button>
    );
  }

  return (
    <label className="theme-toggle" title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      {/* Moon icon */}
      <span
        className="text-sm select-none transition-all duration-300"
        style={{
          opacity: isDark ? 1 : 0.35,
          transform: isDark ? 'scale(1)' : 'scale(0.8)',
          filter: isDark ? 'drop-shadow(0 0 4px #8B5CF6)' : 'none',
        }}
      >
        🌙
      </span>

      {/* The track + thumb */}
      <div className="theme-toggle-track" onClick={toggle} role="switch" aria-checked={!isDark}>
        <div className="theme-toggle-thumb">
          <span style={{ fontSize: 11 }}>{isDark ? '🌙' : '☀️'}</span>
        </div>
      </div>

      {/* Sun icon */}
      <span
        className="text-sm select-none transition-all duration-300"
        style={{
          opacity: !isDark ? 1 : 0.35,
          transform: !isDark ? 'scale(1)' : 'scale(0.8)',
          filter: !isDark ? 'drop-shadow(0 0 4px #f59e0b)' : 'none',
        }}
      >
        ☀️
      </span>
    </label>
  );
}
