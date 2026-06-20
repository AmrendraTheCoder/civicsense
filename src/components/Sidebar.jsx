import React from 'react';
import {
  LayoutDashboardIcon,
  FilePlusIcon,
  MicIcon,
  BarChart3Icon,
  MapPinIcon,
  ShieldIcon,
  HelpCircleIcon,
  TrendingUpIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    badge: null,
    description: 'Overview & analytics',
  },
  {
    id: 'file-complaint',
    label: 'File Complaint',
    icon: FilePlusIcon,
    badge: 'New',
    description: 'Submit an issue',
  },
  {
    id: 'voice-assistant',
    label: 'Voice Assistant',
    icon: MicIcon,
    badge: 'AI',
    description: 'Speak your complaint',
  },
  {
    id: 'predictive-analytics',
    label: 'Predictive Analytics',
    icon: BarChart3Icon,
    badge: null,
    description: 'AI-powered insights',
  },
];

const QUICK_LINKS = [
  { icon: MapPinIcon, label: 'Geo Heatmap' },
  { icon: TrendingUpIcon, label: 'Trends' },
  { icon: ShieldIcon, label: 'Audit Logs' },
];

export default function Sidebar() {
  const { activeView, setActiveView, sidebarOpen, stats } = useCivic();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => {}}
        />
      )}

      <aside
        id="main-sidebar"
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 lg:w-16 -translate-x-full lg:translate-x-0'}
          overflow-hidden
        `}
        style={{
          background: 'rgba(9, 14, 28, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex flex-col h-full py-4 overflow-y-auto">
          {/* Section: Main Nav */}
          <div className="px-3 mb-2">
            {sidebarOpen && (
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                Navigation
              </p>
            )}
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon, badge, description }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    id={`nav-${id}`}
                    onClick={() => setActiveView(id)}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                      transition-all duration-200 w-full
                      ${isActive
                        ? 'sidebar-item-active text-blue-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                        style={{ background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }}
                      />
                    )}

                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-white/5 group-hover:bg-white/10 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon size={16} />
                    </div>

                    {sidebarOpen && (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{label}</span>
                            {badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                badge === 'AI'
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{description}</p>
                        </div>
                        {isActive && (
                          <ChevronRightIcon size={14} className="text-blue-400 flex-shrink-0" />
                        )}
                      </>
                    )}

                    {/* Tooltip when collapsed */}
                    {!sidebarOpen && (
                      <div className="
                        absolute left-full ml-3 px-3 py-1.5 rounded-lg text-sm font-medium
                        text-white pointer-events-none opacity-0 group-hover:opacity-100
                        transition-opacity duration-150 whitespace-nowrap z-50
                      "
                        style={{
                          background: 'rgba(15,22,41,0.98)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}
                      >
                        {label}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Divider */}
          {sidebarOpen && (
            <div className="mx-4 my-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          )}

          {/* Stats Card */}
          {sidebarOpen && (
            <div className="mx-3 mb-3 p-3 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.12) 100%)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-2">Live Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total', value: stats.total, color: 'text-blue-300' },
                  { label: 'High Priority', value: stats.highPriority, color: 'text-rose-400' },
                  { label: 'In Review', value: stats.inReview, color: 'text-amber-400' },
                  { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-1.5 rounded-lg bg-white/5">
                    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
                    <p className="text-[9px] text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {sidebarOpen && (
            <div className="px-3">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                Quick Access
              </p>
              {QUICK_LINKS.map(({ icon: Icon, label }) => (
                <button key={label}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Bottom: Help */}
          <div className="mt-auto px-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                <HelpCircleIcon size={16} />
              </div>
              {sidebarOpen && <span className="text-sm">Help & Support</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
