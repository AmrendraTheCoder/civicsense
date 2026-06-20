import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTriangleIcon, CheckCircle2Icon, ClockIcon, ActivityIcon,
  MapPinIcon, ArrowUpIcon, ArrowRightIcon, FilterIcon,
  ThumbsUpIcon, ZapIcon, TrendingUpIcon, BarChart2Icon,
  UsersIcon, StarIcon, RefreshCwIcon, MaximizeIcon,
} from 'lucide-react';
import {
  MapContainer, TileLayer, Marker, Popup, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useCivic } from '../context/CivicContext';
import { DashboardSkeleton } from '../components/Skeletons';

// ── Fix Leaflet default icon path (Vite asset issue) ─────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom SVG Marker factory ─────────────────────────────────────────────────
function makeMarkerIcon(priority, status) {
  const colorMap = {
    High: { fill: '#f43f5e', stroke: '#fb7185', glow: 'rgba(244,63,94,0.5)' },
    Med:  { fill: '#f59e0b', stroke: '#fbbf24', glow: 'rgba(245,158,11,0.5)' },
    Low:  { fill: '#10b981', stroke: '#34d399', glow: 'rgba(16,185,129,0.5)' },
  };
  const { fill, stroke, glow } = colorMap[priority] || colorMap.Med;
  const isResolved = status === 'Resolved';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="grad" cx="40%" cy="30%">
        <stop offset="0%" stop-color="${stroke}"/>
        <stop offset="100%" stop-color="${fill}"/>
      </radialGradient>
    </defs>
    <circle cx="16" cy="38" r="3" fill="rgba(0,0,0,0.4)" />
    <path d="M16 2C9.37 2 4 7.37 4 14c0 9 12 24 12 24S28 23 28 14C28 7.37 22.63 2 16 2z"
      fill="${isResolved ? 'rgba(16,185,129,0.6)' : 'url(#grad)'}"
      stroke="${stroke}" stroke-width="1.5" filter="url(#glow)"
      opacity="${isResolved ? 0.7 : 1}" />
    <circle cx="16" cy="14" r="5" fill="white" opacity="${isResolved ? 0.5 : 0.9}"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    iconSize:   [32, 40],
    iconAnchor: [16, 40],
    popupAnchor:[0, -40],
    className:  '',
  });
}

// ── Fit map to all markers ────────────────────────────────────────────────────
function FitBounds({ complaints }) {
  const map = useMap();
  useEffect(() => {
    if (!complaints.length) return;
    const bounds = L.latLngBounds(complaints.map(c => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [complaints.length]);
  return null;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, unit, sub, accent, delta, delay }) {
  const [displayed, setDisplayed] = useState(0);
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    const step  = numVal / 30;
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, numVal);
      setDisplayed(Math.round(current * 10) / 10);
      if (current >= numVal) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [numVal]);

  return (
    <div className="glass rounded-2xl p-5 card-hover animate-fade-in-up relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}>
      {/* Accent glow blob */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-25"
        style={{ background: accent }} />

      <div className="flex items-start justify-between mb-4 relative">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}55)`, border: `1px solid ${accent}44` }}>
          <Icon size={19} style={{ color: accent }} />
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <ArrowUpIcon size={11} style={{ transform: delta < 0 ? 'rotate(180deg)' : 'none' }} />
            {Math.abs(delta)}%
          </div>
        )}
      </div>

      <div className="relative">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-display text-white">{displayed}</span>
          {unit && <span className="text-lg font-medium text-slate-400">{unit}</span>}
        </div>
        <p className="text-sm font-medium text-slate-300 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Interactive Map Panel ────────────────────────────────────────────────────
function InteractiveMap({ complaints }) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const PRIORITY_LABEL = { High: '🔴 HIGH', Med: '🟡 MED', Low: '🟢 LOW' };
  const STATUS_COLOR   = { Submitted: '#3b82f6', 'In Review': '#f59e0b', Resolved: '#10b981' };

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: '400px' }}>
      {/* Map header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <MapPinIcon size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-white">Live Complaint Map</span>
          <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
            {complaints.length} pins
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          {[['High','#f43f5e'],['Med','#f59e0b'],['Low','#10b981']].map(([p,c]) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} />
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Leaflet map */}
      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={11}
        style={{ height: 'calc(100% - 48px)', width: '100%' }}
        whenReady={() => setMapLoaded(true)}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
        />

        <FitBounds complaints={complaints.filter(c => c.lat && c.lng)} />

        {complaints.filter(c => c.lat && c.lng).map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={makeMarkerIcon(c.priority, c.status)}
          >
            <Popup maxWidth={240} minWidth={200}>
              <div className="p-1">
                {/* Ticket ID */}
                <div className="flex items-center justify-between mb-2">
                  <code className="text-xs font-mono text-blue-300 font-bold">{c.id}</code>
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      background: `${STATUS_COLOR[c.status]}22`,
                      color: STATUS_COLOR[c.status],
                      border: `1px solid ${STATUS_COLOR[c.status]}44`,
                    }}>
                    {c.status}
                  </span>
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-white leading-snug mb-2 pr-2"
                  style={{ fontSize: '0.8rem' }}>
                  {c.title}
                </p>

                {/* Meta pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>
                    {c.category}
                  </span>
                  <span className="text-xs font-bold"
                    style={{ color: c.priority === 'High' ? '#f43f5e' : c.priority === 'Med' ? '#f59e0b' : '#10b981' }}>
                    {PRIORITY_LABEL[c.priority]}
                  </span>
                </div>

                {/* Ward */}
                {c.ward && (
                  <div className="flex items-center gap-1 mt-2" style={{ color: '#64748b', fontSize: '0.7rem' }}>
                    <MapPinIcon size={10} />
                    <span>{c.ward}</span>
                  </div>
                )}

                {/* AI Summary */}
                {c.aiSummary && (
                  <p className="mt-2 pt-2 text-xs leading-relaxed"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '0.7rem' }}>
                    {c.aiSummary}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Native SVG Departmental Bar Chart ───────────────────────────────────────
function DeptBarChart({ complaints }) {
  const [hovered, setHovered] = useState(null);
  const [animated, setAnimated] = useState(false);
  const chartRef = useRef(null);

  const DEPTS = [
    { key: 'Roads',        label: 'Roads',         icon: '🛣️',  color: '#3b82f6', dark: '#1d4ed8' },
    { key: 'Sanitation',   label: 'Sanitation',    icon: '🗑️',  color: '#10b981', dark: '#065f46' },
    { key: 'Water',        label: 'Water',         icon: '💧',  color: '#06b6d4', dark: '#0e7490' },
    { key: 'Electricity',  label: 'Electricity',   icon: '⚡',  color: '#f59e0b', dark: '#92400e' },
    { key: 'Public Spaces',label: 'Public Spaces', icon: '🌳',  color: '#8b5cf6', dark: '#4c1d95' },
    { key: 'Other',        label: 'Other',         icon: '📋',  color: '#64748b', dark: '#334155' },
  ];

  const data = DEPTS.map(d => ({
    ...d,
    total: complaints.filter(c => c.category === d.key).length,
    open:  complaints.filter(c => c.category === d.key && c.status !== 'Resolved').length,
    resolved: complaints.filter(c => c.category === d.key && c.status === 'Resolved').length,
  })).filter(d => d.total > 0);

  const maxVal = Math.max(...data.map(d => d.total), 1);

  // Trigger animation on mount
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (chartRef.current) obs.observe(chartRef.current);
    return () => obs.disconnect();
  }, []);

  // SVG dimensions
  const W    = 560;
  const H    = 260;
  const padL = 110;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const rowH  = chartH / Math.max(data.length, 1);
  const barH  = Math.min(rowH * 0.55, 26);

  // Grid lines
  const gridLines = 4;

  return (
    <div className="glass rounded-2xl overflow-hidden" ref={chartRef}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart2Icon size={15} className="text-violet-400" />
            Departmental Breakdown
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">Open complaints per department</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(255,255,255,0.3)' }} />
            Open
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(16,185,129,0.5)' }} />
            Resolved
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="px-4 py-4">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
            No departmental data yet — file a complaint to see it here.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ maxHeight: '280px' }}
          >
            <defs>
              {data.map(d => (
                <linearGradient key={d.key} id={`bar-${d.key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={d.dark} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={d.color} stopOpacity="0.9" />
                </linearGradient>
              ))}
              {/* Grid line pattern */}
              {Array.from({ length: gridLines }).map((_, i) => (
                <line
                  key={i}
                  x1={padL + (chartW / gridLines) * i}
                  y1={padT}
                  x2={padL + (chartW / gridLines) * i}
                  y2={padT + chartH}
                />
              ))}
            </defs>

            {/* Grid lines */}
            {Array.from({ length: gridLines + 1 }).map((_, i) => {
              const x = padL + (chartW / gridLines) * i;
              const val = Math.round((maxVal / gridLines) * i);
              return (
                <g key={i}>
                  <line x1={x} y1={padT} x2={x} y2={padT + chartH}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4,4" />
                  {i > 0 && (
                    <text x={x} y={padT + chartH + 16}
                      textAnchor="middle" fill="#334155" fontSize="11" fontFamily="Inter, sans-serif">
                      {val}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Y-axis baseline */}
            <line x1={padL} y1={padT} x2={padL} y2={padT + chartH}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Bars */}
            {data.map((d, i) => {
              const y       = padT + i * rowH + (rowH - barH) / 2;
              const totalW  = animated ? (d.total / maxVal) * chartW : 0;
              const openW   = animated ? (d.open / maxVal) * chartW : 0;
              const resolvedW = totalW - openW;
              const isHov   = hovered === d.key;

              return (
                <g key={d.key}
                  onMouseEnter={() => setHovered(d.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'default' }}>

                  {/* Row hover background */}
                  {isHov && (
                    <rect x={0} y={padT + i * rowH} width={W} height={rowH}
                      fill={`${d.color}08`} rx="4" />
                  )}

                  {/* Department label */}
                  <text x={padL - 8} y={y + barH / 2 + 4}
                    textAnchor="end" fill={isHov ? d.color : '#64748b'}
                    fontSize="12" fontFamily="Inter, sans-serif" fontWeight={isHov ? '600' : '400'}>
                    {d.icon} {d.label}
                  </text>

                  {/* Open bar (background bar — full total) */}
                  <rect x={padL} y={y} width={totalW} height={barH}
                    fill={`${d.color}22`} rx="5"
                    style={{ transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)', transitionDelay: `${i * 100}ms` }} />

                  {/* Open portion */}
                  <rect x={padL} y={y} width={openW} height={barH}
                    fill={`url(#bar-${d.key})`} rx="5" opacity={0.9}
                    style={{ transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)', transitionDelay: `${i * 100 + 50}ms` }} />

                  {/* Resolved segment (stacked on right) */}
                  {resolvedW > 0 && (
                    <rect x={padL + openW} y={y + barH * 0.2} width={resolvedW} height={barH * 0.6}
                      fill="#10b981" rx="3" opacity="0.5"
                      style={{ transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)', transitionDelay: `${i * 100 + 80}ms` }} />
                  )}

                  {/* Count label */}
                  <text x={padL + totalW + 6} y={y + barH / 2 + 4}
                    fill={isHov ? d.color : '#475569'} fontSize="12"
                    fontFamily="Inter, sans-serif" fontWeight="700">
                    {d.total}
                  </text>

                  {/* Tooltip on hover */}
                  {isHov && (
                    <g>
                      <rect x={padL + totalW - 10} y={y - 32} width={100} height={26}
                        fill="rgba(15,22,41,0.95)" rx="6"
                        stroke={`${d.color}44`} strokeWidth="1" />
                      <text x={padL + totalW + 40} y={y - 14}
                        textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="Inter, sans-serif">
                        {d.open} open · {d.resolved} resolved
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* X-axis label */}
            <text x={padL + chartW / 2} y={H - 2}
              textAnchor="middle" fill="#1e293b" fontSize="10" fontFamily="Inter, sans-serif">
              Number of Complaints
            </text>
          </svg>
        )}
      </div>

      {/* Summary row */}
      {data.length > 0 && (
        <div className="px-5 pb-4 flex items-center gap-4 flex-wrap">
          {data.map(d => (
            <div key={d.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
              <span className="text-xs text-slate-600">{d.label}: <strong className="text-slate-300">{d.open}</strong></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    Submitted:  { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',    dot: 'bg-blue-400' },
    'In Review':{ cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
    Resolved:   { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  }[status] || {};
  return (
    <span className={`status-badge border flex items-center gap-1.5 ${cfg.cls}`}>
      <span className={`priority-indicator ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Category Chip ────────────────────────────────────────────────────────────
const CategoryChip = ({ category }) => {
  const cfg = {
    Roads:        'text-blue-300   bg-blue-500/12   border-blue-500/20',
    Sanitation:   'text-emerald-300 bg-emerald-500/12 border-emerald-500/20',
    Water:        'text-cyan-300   bg-cyan-500/12   border-cyan-500/20',
    Electricity:  'text-amber-300  bg-amber-500/12  border-amber-500/20',
    'Public Spaces':'text-violet-300 bg-violet-500/12 border-violet-500/20',
  }[category] || 'text-slate-300 bg-slate-500/12 border-slate-500/20';
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg}`}>
      {category}
    </span>
  );
};

// ─── Resolution Rate Ring ─────────────────────────────────────────────────────
function ResolutionRing({ rate, label }) {
  const r    = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(rate, 100) / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
          <circle cx="50" cy="50" r={r} fill="none"
            stroke="url(#ringGrad2)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
          <defs>
            <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-display text-white">{rate}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1.5 text-center">{label}</p>
    </div>
  );
}

// ─── Complaint Row ─────────────────────────────────────────────────────────────
function ComplaintRow({ complaint, delay = 0 }) {
  const { updateComplaintStatus } = useCivic();
  const [expanded, setExpanded] = useState(false);

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
  };

  const dotColor = { High: '#f43f5e', Med: '#f59e0b', Low: '#10b981' }[complaint.priority] || '#64748b';

  return (
    <div className="glass rounded-xl overflow-hidden card-hover animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => setExpanded(!expanded)}>

      <div className="p-4 flex items-start gap-3">
        {/* Priority dot */}
        <span className="w-2 h-2 rounded-full mt-2 shrink-0 animate-pulse"
          style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{complaint.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <CategoryChip category={complaint.category} />
                <StatusBadge status={complaint.status} />
                {complaint.language === 'Hindi' && (
                  <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md font-semibold">हिंदी</span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-600">{timeAgo(complaint.timestamp)}</p>
              <div className="flex items-center gap-1 justify-end mt-1 text-xs text-slate-500">
                <ThumbsUpIcon size={10} /><span>{complaint.upvotes ?? 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
            <MapPinIcon size={11} />
            <span className="truncate">{complaint.ward || 'Delhi'}</span>
            <span>·</span>
            <span className="font-mono">{complaint.id}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t animate-fade-in-up" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">{complaint.description}</p>
          {complaint.aiSummary && (
            <div className="mt-3 p-2.5 rounded-lg flex gap-2"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <ZapIcon size={13} className="text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-violet-400 font-semibold">AI Summary: </span>
                {complaint.aiSummary}
              </p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs text-slate-600 mr-auto">
              Submitted by: <span className="text-slate-400">{complaint.submittedBy || 'Anonymous'}</span>
            </p>
            {complaint.status !== 'Resolved' && (
              <button
                onClick={e => { e.stopPropagation(); updateComplaintStatus(complaint.id, 'Resolved'); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors font-medium">
                ✓ Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { complaints, stats, setActiveView } = useCivic();
  const [filter, setFilter]     = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data-fetch skeleton (clears after 800ms)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // ── Dynamic metrics (always computed, even while skeleton shows) ─────────
  const metrics = useMemo(() => {
    const total     = complaints.length;
    const resolved  = complaints.filter(c => c.status === 'Resolved').length;
    const resRate   = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Avg response time: mean of (now - timestamp) for In Review, capped at 120h
    const inReview  = complaints.filter(c => c.status === 'In Review');
    const avgHrs    = inReview.length > 0
      ? Math.round(inReview.reduce((acc, c) => acc + (Date.now() - new Date(c.timestamp)) / 3600000, 0) / inReview.length)
      : 0;

    const highCount = complaints.filter(c => c.priority === 'High').length;

    return { total, resRate, avgHrs, highCount, resolved };
  }, [complaints]);

  const filters  = ['All', 'High', 'In Review', 'Submitted', 'Resolved'];
  const filtered = complaints.filter(c => {
    if (filter === 'All') return true;
    if (['High','Med','Low'].includes(filter)) return c.priority === filter;
    return c.status === filter;
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="animate-fade-in-up flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
            <h1 className="text-2xl font-bold font-display text-white">Overview Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500 ml-4">Real-time civic intelligence — Delhi Municipal Region</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ActivityIcon}
          label="Total Complaints"
          value={metrics.total}
          sub="All time — city-wide"
          accent="#3b82f6"
          delta={12}
          delay={0}
        />
        <MetricCard
          icon={TrendingUpIcon}
          label="Resolution Rate"
          value={metrics.resRate}
          unit="%"
          sub={`${metrics.resolved} of ${metrics.total} resolved`}
          accent="#10b981"
          delta={5}
          delay={80}
        />
        <MetricCard
          icon={ClockIcon}
          label="Avg Response Time"
          value={metrics.avgHrs || stats.avgResolutionDays * 24}
          unit="hrs"
          sub="For In Review cases"
          accent="#f59e0b"
          delta={-8}
          delay={160}
        />
        <MetricCard
          icon={AlertTriangleIcon}
          label="High Priority"
          value={metrics.highCount}
          sub="Requires immediate action"
          accent="#f43f5e"
          delta={metrics.highCount > 3 ? 4 : -2}
          delay={240}
        />
      </div>

      {/* ── Map + Resolution Ring ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map — 3 cols */}
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <InteractiveMap complaints={complaints} />
        </div>

        {/* Side stats — 1 col */}
        <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '260ms' }}>
          {/* Resolution ring */}
          <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Resolution Rate</p>
            <ResolutionRing rate={metrics.resRate} label={`${metrics.resolved} resolved`} />
          </div>

          {/* Status breakdown */}
          <div className="glass rounded-2xl p-5 flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Status Split</p>
            <div className="space-y-3">
              {[
                { label: 'Submitted', count: stats.submitted, color: '#3b82f6' },
                { label: 'In Review', count: stats.inReview,  color: '#f59e0b' },
                { label: 'Resolved',  count: stats.resolved,  color: '#10b981' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold" style={{ color }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${metrics.total > 0 ? (count / metrics.total) * 100 : 0}%`,
                        background: color,
                        opacity: 0.8,
                      }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Satisfaction */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <p className="text-xs text-slate-600 mb-1">Citizen Satisfaction</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => (
                  <StarIcon key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
                <StarIcon size={13} className="text-amber-400 fill-amber-400/30" />
                <span className="text-xs text-slate-500 ml-1">4.3 / 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Departmental Bar Chart ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <DeptBarChart complaints={complaints} />
      </div>

      {/* ── Complaints List ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '360ms' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white text-sm">Active Complaints</h2>
            <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              {filtered.length} records
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterIcon size={13} className="text-slate-600" />
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  filter === f
                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                    : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((c, i) => (
            <ComplaintRow key={c.id} complaint={c} delay={i * 50} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm glass rounded-2xl">
              No complaints match this filter.
            </div>
          )}
        </div>

        <button onClick={() => setActiveView('file-complaint')}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors card-hover"
          style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <ArrowRightIcon size={14} />
          File a new complaint
        </button>
      </div>
    </div>
  );
}
