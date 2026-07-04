import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden" data-applayout="true" style={{ background: 'var(--t-bg)' }}>
      {/* Ambient aurora orbs */}
      <div
        className="aurora-orb"
        style={{
          width: 600, height: 600,
          top: -200, left: -200,
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: 500, height: 500,
          bottom: -100, right: 100,
          background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)',
          animationDelay: '4s',
        }}
      />

      <Sidebar />

      <main
        className="flex-1 overflow-y-auto relative"
        style={{ zIndex: 10 }}
      >
        {children}
      </main>
    </div>
  );
}
