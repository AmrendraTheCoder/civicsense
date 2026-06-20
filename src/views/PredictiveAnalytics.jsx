import React, { useState, useEffect } from 'react';
import {
  BrainCircuitIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  ZapIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TargetIcon,
  CloudRainIcon,
  ThermometerIcon,
  ActivityIcon,
  SparklesIcon,
  ShieldAlertIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

// ── Mock predictive data ────────────────────────────────────────────────────
const WEEKLY_TREND = [
  { day: 'Mon', value: 8, predicted: 9 },
  { day: 'Tue', value: 12, predicted: 11 },
  { day: 'Wed', value: 7, predicted: 8 },
  { day: 'Thu', value: 15, predicted: 14 },
  { day: 'Fri', value: 11, predicted: 13 },
  { day: 'Sat', value: 6, predicted: 7 },
  { day: 'Sun', value: 4, predicted: 5 },
];

const HOTSPOT_ZONES = [
  { zone: 'Connaught Place', ward: 'Ward 42', risk: 92, category: 'Roads', trend: 'up', delta: '+24%' },
  { zone: 'Rohini Sector 22', ward: 'Ward 7', risk: 88, category: 'Sanitation', trend: 'up', delta: '+18%' },
  { zone: 'Dhaula Kuan', ward: 'Ward 38', risk: 76, category: 'Electricity', trend: 'down', delta: '-5%' },
  { zone: 'Lajpat Nagar', ward: 'Ward 61', risk: 71, category: 'Water', trend: 'up', delta: '+12%' },
  { zone: 'Karol Bagh', ward: 'Ward 55', risk: 65, category: 'Sanitation', trend: 'down', delta: '-8%' },
];

const AI_INSIGHTS = [
  {
    id: 'ins-1',
    type: 'warning',
    icon: CloudRainIcon,
    title: 'Monsoon Surge Predicted',
    body: 'Based on IMD weather data and historical patterns, expect a 340% spike in Road and Sanitation complaints in Rohini, Dwarka, and Najafgarh between July 10–25. Pre-position 12 additional cleaning crews.',
    confidence: 94,
    impact: 'High',
    tag: 'Seasonal Pattern',
  },
  {
    id: 'ins-2',
    type: 'alert',
    icon: ShieldAlertIcon,
    title: 'Infrastructure Stress Cluster',
    body: 'Ward cluster 38-42 (Dhaula Kuan to Connaught Place) shows correlated street-light and road failures — typical of aging electrical conduit beneath road surface. Joint inspection recommended.',
    confidence: 87,
    impact: 'High',
    tag: 'Root Cause Analysis',
  },
  {
    id: 'ins-3',
    type: 'success',
    icon: CheckCircle2Icon,
    title: 'Sanitation Improvement Signal',
    body: 'Karol Bagh ward shows 35% reduction in sanitation complaints over 3 weeks following dedicated Sunday morning drives. Recommend replicating this in Sadar Bazaar and Paharganj wards.',
    confidence: 91,
    impact: 'Med',
    tag: 'Best Practice',
  },
  {
    id: 'ins-4',
    type: 'info',
    icon: TargetIcon,
    title: 'Resource Allocation Optimisation',
    body: 'Water complaint resolution time can be reduced by 2.1 days by rerouting DJB crew from North Delhi to East Delhi on Wednesdays. This saves an estimated ₹4.2L/month in overtime.',
    confidence: 78,
    impact: 'Med',
    tag: 'Efficiency Gain',
  },
];

const CATEGORY_FORECAST = [
  { name: 'Roads', current: 2, next: 3, change: '+50%', color: '#3b82f6' },
  { name: 'Sanitation', current: 2, next: 4, change: '+100%', color: '#10b981' },
  { name: 'Water', current: 1, next: 2, change: '+100%', color: '#06b6d4' },
  { name: 'Electricity', current: 1, next: 1, change: '0%', color: '#f59e0b' },
];

// ── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

// ── Hotspot Row ──────────────────────────────────────────────────────────────
function HotspotRow({ data, delay }) {
  const { zone, ward, risk, category, trend, delta } = data;
  const riskColor = risk >= 85 ? '#f43f5e' : risk >= 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 animate-fade-in-up"
      style={{ borderColor: 'rgba(255,255,255,0.05)', animationDelay: `${delay}ms` }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${riskColor}18` }}
      >
        <MapPinIcon size={14} style={{ color: riskColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{zone}</p>
        <p className="text-xs text-slate-600">{ward} · {category}</p>
      </div>

      {/* Risk bar */}
      <div className="hidden sm:flex flex-col items-end gap-1 w-32">
        <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${risk}%`, background: riskColor }}
          />
        </div>
        <p className="text-[10px] font-semibold" style={{ color: riskColor }}>{risk}% risk</p>
      </div>

      <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-rose-400' : 'text-emerald-400'}`}>
        {trend === 'up' ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
        {delta}
      </div>
    </div>
  );
}

// ── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({ data, delay }) {
  const { icon: Icon, title, body, confidence, impact, tag, type } = data;
  const typeConfig = {
    warning: { border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.08)', badge: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    alert: { border: 'rgba(244,63,94,0.25)', bg: 'rgba(244,63,94,0.08)', badge: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    success: { border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)', badge: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    info: { border: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.08)', badge: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  }[type];

  return (
    <div className="rounded-xl p-4 card-hover animate-fade-in-up"
      style={{
        background: typeConfig.bg,
        border: `1px solid ${typeConfig.border}`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: typeConfig.border }}
        >
          <Icon size={16} className={typeConfig.badge.split(' ')[0]} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{title}</p>
            <span className={`status-badge border ${typeConfig.badge}`}>{tag}</span>
            <span className={`status-badge border ${impact === 'High' ? 'text-rose-400 bg-rose-500/15 border-rose-500/30' : 'text-amber-400 bg-amber-500/15 border-amber-500/30'}`}>
              {impact} Impact
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">{body}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600 font-medium">{confidence}% confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weekly Trend Chart ───────────────────────────────────────────────────────
function TrendChart() {
  const maxVal = Math.max(...WEEKLY_TREND.map((d) => Math.max(d.value, d.predicted)));

  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-white text-sm">Weekly Complaint Volume</h3>
          <p className="text-xs text-slate-500 mt-0.5">Actual vs AI Predicted</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#3b82f6' }} />
            <span className="text-slate-600">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-dashed" style={{ borderColor: '#8b5cf6', background: 'transparent' }} />
            <span className="text-slate-600">Predicted</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2 h-36">
        {WEEKLY_TREND.map(({ day, value, predicted }, i) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full relative flex gap-0.5 items-end" style={{ height: '100px' }}>
              {/* Actual bar */}
              <div className="flex-1 rounded-t-md chart-bar"
                style={{
                  height: `${(value / maxVal) * 100}%`,
                  background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                  animationDelay: `${i * 80}ms`,
                }}
              />
              {/* Predicted bar */}
              <div className="flex-1 rounded-t-md chart-bar"
                style={{
                  height: `${(predicted / maxVal) * 100}%`,
                  border: '1px dashed rgba(139,92,246,0.6)',
                  background: 'rgba(139,92,246,0.15)',
                  animationDelay: `${i * 80 + 40}ms`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-600">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Forecast Table ───────────────────────────────────────────────────────────
function ForecastTable() {
  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">30-Day Category Forecast</h3>
          <p className="text-xs text-slate-500 mt-0.5">AI predictions for July 2024</p>
        </div>
        <CalendarIcon size={15} className="text-slate-600" />
      </div>
      <div className="space-y-3">
        {CATEGORY_FORECAST.map(({ name, current, next, change, color }) => {
          const isUp = change.startsWith('+');
          return (
            <div key={name} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-sm text-slate-400 w-24 flex-shrink-0">{name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(current / 5) * 100}%`, background: color }} />
              </div>
              <span className="text-xs text-slate-600 w-4 text-center flex-shrink-0">{current}</span>
              <span className="text-xs text-slate-700">→</span>
              <span className="text-xs font-bold text-white w-4 flex-shrink-0">{next}</span>
              <span className={`text-xs font-semibold ${isUp ? 'text-rose-400' : change === '0%' ? 'text-slate-500' : 'text-emerald-400'}`}>
                {change}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────
export default function PredictiveAnalytics() {
  const { complaints, stats } = useCivic();
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #8b5cf6, #06b6d4)' }} />
          <h1 className="text-2xl font-bold font-display text-white">Predictive Analytics</h1>
        </div>
        <p className="text-sm text-slate-500 ml-4">AI-powered civic intelligence — forecasting, hotspots, and insights</p>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Prediction Accuracy', value: 94, suffix: '%', icon: TargetIcon, color: 'from-violet-500 to-blue-600' },
          { label: 'Issues Predicted', value: 23, suffix: '', icon: BrainCircuitIcon, color: 'from-blue-500 to-cyan-600' },
          { label: 'Avg. Resolution', value: 4, suffix: '.2 days', icon: ActivityIcon, color: 'from-amber-500 to-orange-600' },
          { label: 'At-Risk Zones', value: 5, suffix: '', icon: ShieldAlertIcon, color: 'from-rose-500 to-rose-600' },
        ].map(({ label, value, suffix, icon: Icon, color }, i) => (
          <div key={label} className="glass rounded-2xl p-5 card-hover animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-3xl font-bold font-display text-white">
              <AnimatedCounter target={value} suffix={suffix} />
            </p>
            <p className="text-sm text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { id: 'insights', label: 'AI Insights', icon: SparklesIcon },
          { id: 'hotspots', label: 'Hotspot Zones', icon: MapPinIcon },
          { id: 'trends', label: 'Trends', icon: TrendingUpIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`analytics-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={activeTab === id ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))' } : {}}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'insights' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuitIcon size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-300">AI-Generated Insights</h2>
            <span className="text-xs text-slate-700 bg-white/5 px-2 py-0.5 rounded-full">{AI_INSIGHTS.length} insights</span>
          </div>
          {AI_INSIGHTS.map((ins, i) => (
            <InsightCard key={ins.id} data={ins} delay={i * 80} />
          ))}
        </div>
      )}

      {activeTab === 'hotspots' && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white text-sm">High-Risk Zones</h3>
              <p className="text-xs text-slate-500 mt-0.5">Predicted complaint clusters for next 14 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
              <AlertTriangleIcon size={13} />
              Live Risk Score
            </div>
          </div>

          {/* Mock Map Placeholder */}
          <div className="rounded-xl mb-4 overflow-hidden relative"
            style={{
              height: '180px',
              background: 'linear-gradient(135deg, rgba(15,22,41,1) 0%, rgba(10,15,30,1) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
            {/* Mock pins */}
            {[
              { x: '28%', y: '35%', color: '#f43f5e', size: 'w-5 h-5', label: 'CP' },
              { x: '55%', y: '20%', color: '#f43f5e', size: 'w-4 h-4', label: 'RN' },
              { x: '42%', y: '55%', color: '#f59e0b', size: 'w-4 h-4', label: 'DK' },
              { x: '65%', y: '60%', color: '#f59e0b', size: 'w-3.5 h-3.5', label: 'LN' },
              { x: '35%', y: '40%', color: '#10b981', size: 'w-3.5 h-3.5', label: 'KB' },
            ].map(({ x, y, color, size, label }) => (
              <div key={label} className="absolute flex flex-col items-center" style={{ left: x, top: y, transform: 'translate(-50%,-50%)' }}>
                <div className={`${size} rounded-full flex items-center justify-center map-pin-pulse cursor-pointer`}
                  style={{ background: color, boxShadow: `0 0 10px ${color}60` }}
                >
                  <span className="text-[7px] font-bold text-white">{label}</span>
                </div>
              </div>
            ))}
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-600 font-medium">Delhi NCR — Complaint Risk Heatmap (Mock)</div>
          </div>

          {HOTSPOT_ZONES.map((z, i) => (
            <HotspotRow key={z.zone} data={z} delay={i * 60} />
          ))}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendChart />
          <ForecastTable />
        </div>
      )}
    </div>
  );
}
