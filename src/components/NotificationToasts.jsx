import React, { useState, useEffect } from 'react';
import { CheckCircle2Icon, InfoIcon, AlertTriangleIcon, XCircleIcon, XIcon, ZapIcon } from 'lucide-react';
import { useCivic } from '../context/CivicContext';

const TYPE_CONFIG = {
  success: {
    Icon: CheckCircle2Icon,
    bg:    'rgba(16,185,129,0.12)',
    border:'rgba(16,185,129,0.35)',
    bar:   '#10b981',
    iconCls:'text-emerald-400',
    label: 'Success',
  },
  info: {
    Icon: InfoIcon,
    bg:    'rgba(59,130,246,0.12)',
    border:'rgba(59,130,246,0.35)',
    bar:   '#3b82f6',
    iconCls:'text-blue-400',
    label: 'Info',
  },
  warning: {
    Icon: AlertTriangleIcon,
    bg:    'rgba(245,158,11,0.12)',
    border:'rgba(245,158,11,0.35)',
    bar:   '#f59e0b',
    iconCls:'text-amber-400',
    label: 'Warning',
  },
  error: {
    Icon: XCircleIcon,
    bg:    'rgba(244,63,94,0.12)',
    border:'rgba(244,63,94,0.35)',
    bar:   '#f43f5e',
    iconCls:'text-rose-400',
    label: 'Error',
  },
};

const TOAST_DURATION = 4000; // ms

function Toast({ notif, onDismiss }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
  const { Icon } = cfg;
  const [alive, setAlive] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const step = 100 / (TOAST_DURATION / 50);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p - step <= 0) {
          clearInterval(iv);
          setAlive(false);
          setTimeout(() => onDismiss(notif.id), 300);
          return 0;
        }
        return p - step;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [notif.id, onDismiss]);

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        alive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
      style={{
        background:    cfg.bg,
        border:       `1px solid ${cfg.border}`,
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        minWidth:      '300px',
        maxWidth:      '380px',
        padding:       '12px 14px 14px',
        boxShadow:    `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}`,
      }}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        <Icon size={17} className={cfg.iconCls} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${cfg.iconCls}`}>
          {cfg.label}
        </p>
        <p className="text-sm text-slate-200 leading-snug">{notif.message}</p>
      </div>

      {/* Close */}
      <button
        onClick={() => { setAlive(false); setTimeout(() => onDismiss(notif.id), 300); }}
        className="shrink-0 p-0.5 rounded-lg text-slate-600 hover:text-slate-300 transition-colors mt-0.5"
      >
        <XIcon size={13} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-50"
        style={{ width: `${progress}%`, background: cfg.bar, opacity: 0.7 }} />
    </div>
  );
}

export default function NotificationToasts() {
  const { notifications } = useCivic();
  const [dismissed, setDismissed] = useState(new Set());

  const onDismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  const visible = notifications.filter(n => !dismissed.has(n.id));

  if (visible.length === 0) return null;

  return (
    <div
      id="notification-stack"
      className="fixed z-[200] flex flex-col gap-2.5 pointer-events-none"
      style={{
        // On mobile: center bottom above the bottom nav; on desktop: bottom-right
        bottom: '80px',
        right: '16px',
      }}
    >
      {/* On mobile move above bottom nav */}
      <style>{`
        @media (min-width: 768px) {
          #notification-stack { bottom: 24px; right: 24px; }
        }
      `}</style>

      {visible.map(n => (
        <div key={n.id} className="pointer-events-auto animate-slide-in-right">
          <Toast notif={n} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
