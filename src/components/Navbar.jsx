import React, { useState } from 'react';
import {
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
  ZapIcon,
  ChevronDownIcon,
  UserCircleIcon,
  SettingsIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

export default function Navbar() {
  const { sidebarOpen, setSidebarOpen, notifications, stats } = useCivic();
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const unreadCount = notifications.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 lg:px-6 gap-4"
      style={{
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left: Logo + Toggle */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          id="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-white/8 text-slate-400 hover:text-white"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
          >
            <ZapIcon size={16} className="text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }}
            />
          </div>
          <div>
            <span className="font-display font-bold text-white text-base tracking-tight leading-none">
              Civic<span className="gradient-text">AI</span>
            </span>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5 hidden sm:block">Citizen Services Platform</p>
          </div>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-auto hidden md:block">
        <div className="relative">
          <input
            id="global-search"
            type="text"
            placeholder="Search complaints, wards, issues…"
            className="civic-input pl-9 pr-4 py-2 text-sm"
            style={{ borderRadius: '9px' }}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded font-mono hidden lg:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Live status pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span className="text-emerald-400 font-medium">{stats.total} Active Cases</span>
        </div>

        {/* Mobile Search */}
        <button
          id="mobile-search-btn"
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
        >
          <SearchIcon size={18} />
        </button>

        {/* Notifications */}
        <button
          id="notifications-btn"
          className="relative p-2 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: 'white' }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            id="profile-btn"
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/8 transition-all"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}
            >
              AM
            </div>
            <span className="text-sm font-medium text-slate-300 hidden sm:block">Admin</span>
            <ChevronDownIcon size={14} className="text-slate-500 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1 z-50 animate-scale-in"
              style={{
                background: 'rgba(15, 22, 41, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm font-semibold text-white">Admin Officer</p>
                <p className="text-xs text-slate-500">civic.admin@delhi.gov.in</p>
              </div>
              {[
                { icon: UserCircleIcon, label: 'Profile' },
                { icon: ShieldCheckIcon, label: 'Permissions' },
                { icon: SettingsIcon, label: 'Settings' },
              ].map(({ icon: Icon, label }) => (
                <button key={label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
              <div className="border-t mt-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <LogOutIcon size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 p-3 md:hidden"
          style={{ background: 'rgba(10,15,30,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search complaints…"
              className="civic-input pl-9"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
