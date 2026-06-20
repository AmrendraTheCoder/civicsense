import React from 'react';
import { CivicProvider, useCivic } from './context/CivicContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NotificationToasts from './components/NotificationToasts';
import Dashboard from './views/Dashboard';
import FileComplaint from './views/FileComplaint';
import VoiceAssistant from './views/VoiceAssistant';
import PredictiveAnalytics from './views/PredictiveAnalytics';

// ── Background ambient decoration ───────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-15 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)', filter: 'blur(60px)', animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-72 rounded-full opacity-10 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '4s' }} />
    </div>
  );
}

// ── View Router ──────────────────────────────────────────────────────────────
function ViewRouter() {
  const { activeView } = useCivic();
  const views = {
    'dashboard':            <Dashboard />,
    'file-complaint':       <FileComplaint />,
    'voice-assistant':      <VoiceAssistant />,
    'predictive-analytics': <PredictiveAnalytics />,
  };
  return (
    <div key={activeView} className="animate-fade-in-up">
      {views[activeView] || <Dashboard />}
    </div>
  );
}

// ── Layout Shell ─────────────────────────────────────────────────────────────
function AppShell() {
  const { sidebarOpen } = useCivic();

  return (
    <div className="min-h-screen relative">
      <AmbientBackground />

      {/* Top navbar */}
      <Navbar />

      {/* Sidebar (desktop) + Bottom nav (mobile) */}
      <Sidebar />

      {/* Main content area
          Desktop: offset by sidebar width
          Mobile:  no left margin, extra bottom padding for bottom nav */}
      <main
        id="main-content"
        className="relative z-10 pt-16 min-h-screen transition-all duration-300"
        style={{
          marginLeft: 0,
        }}
      >
        {/* Desktop margin via inline style, overridden on md+ */}
        <style>{`
          @media (min-width: 768px) {
            #main-content { margin-left: ${sidebarOpen ? '256px' : '64px'}; }
          }
        `}</style>

        {/* Content wrapper: extra bottom padding on mobile for bottom nav */}
        <div className="p-4 md:p-5 lg:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
          <ViewRouter />
        </div>
      </main>

      {/* Toast stack */}
      <NotificationToasts />
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <CivicProvider>
      <AppShell />
    </CivicProvider>
  );
}
