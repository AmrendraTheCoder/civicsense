import React from 'react';
import { CheckCircle2Icon, InfoIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { useCivic } from '../context/CivicContext';

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2Icon,
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    iconColor: 'text-emerald-400',
  },
  info: {
    icon: InfoIcon,
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangleIcon,
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    iconColor: 'text-amber-400',
  },
};

export default function NotificationToasts() {
  const { notifications } = useCivic();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none" id="notification-stack">
      {notifications.map((n) => {
        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div
            key={n.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl pointer-events-auto animate-slide-in-left min-w-[280px] max-w-[360px]"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <Icon size={16} className={`flex-shrink-0 ${cfg.iconColor}`} />
            <p className="text-sm text-slate-200 flex-1">{n.message}</p>
          </div>
        );
      })}
    </div>
  );
}
