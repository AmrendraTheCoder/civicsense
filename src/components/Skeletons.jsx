import React from 'react';

// ── Skeleton primitives ───────────────────────────────────────────────────────
export function SkeletonBox({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg animate-shimmer ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className="h-3 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ── MetricCard skeleton ───────────────────────────────────────────────────────
export function MetricCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 rounded-2xl animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }} />

      <div className="flex items-start justify-between mb-4">
        <SkeletonBox className="w-11 h-11 rounded-xl" />
        <SkeletonBox className="w-10 h-4 rounded-full" />
      </div>

      <SkeletonBox className="w-20 h-8 rounded-lg mb-2" />
      <SkeletonBox className="w-32 h-3 rounded mb-1" />
      <SkeletonBox className="w-24 h-3 rounded opacity-50" />
    </div>
  );
}

// ── Chart skeleton ────────────────────────────────────────────────────────────
export function ChartSkeleton({ height = 260 }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="space-y-2">
          <SkeletonBox className="w-36 h-4 rounded" />
          <SkeletonBox className="w-24 h-3 rounded opacity-60" />
        </div>
        <SkeletonBox className="w-20 h-6 rounded-full" />
      </div>

      {/* Chart area */}
      <div className="px-5 py-6 flex items-end gap-3" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const h = 30 + Math.sin(i * 0.9 + 1) * 40 + Math.random() * 30;
          return (
            <SkeletonBox
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${h}%`, minWidth: 0 }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Map skeleton ──────────────────────────────────────────────────────────────
export function MapSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-4 h-4 rounded" />
          <SkeletonBox className="w-32 h-4 rounded" />
        </div>
        <SkeletonBox className="w-16 h-5 rounded-full" />
      </div>

      {/* Map placeholder */}
      <div className="relative w-full" style={{ height: 'calc(100% - 48px)' }}>
        <SkeletonBox className="absolute inset-0 rounded-none" style={{ opacity: 0.5 }} />

        {/* Fake grid lines */}
        {[20, 45, 70].map(pct => (
          <div key={pct} className="absolute inset-x-0 h-px opacity-10"
            style={{ top: `${pct}%`, background: 'rgba(255,255,255,0.2)' }} />
        ))}
        {[20, 50, 80].map(pct => (
          <div key={pct} className="absolute inset-y-0 w-px opacity-10"
            style={{ left: `${pct}%`, background: 'rgba(255,255,255,0.2)' }} />
        ))}

        {/* Fake pins */}
        {[[30,40],[55,60],[70,25],[45,75],[80,55]].map(([x,y], i) => (
          <div key={i} className="absolute w-4 h-4 rounded-full animate-pulse"
            style={{
              left: `${x}%`, top: `${y}%`,
              transform: 'translate(-50%,-50%)',
              background: ['#f43f5e','#f59e0b','#10b981','#3b82f6','#8b5cf6'][i],
              opacity: 0.4,
              boxShadow: `0 0 10px ${['#f43f5e','#f59e0b','#10b981','#3b82f6','#8b5cf6'][i]}66`,
            }} />
        ))}

        {/* Loading badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(9,14,28,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Loading map tiles…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Complaint row skeleton ────────────────────────────────────────────────────
export function ComplaintRowSkeleton() {
  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3">
      <SkeletonBox className="w-2 h-2 rounded-full mt-2 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <SkeletonBox className="w-3/4 h-4 rounded" />
            <div className="flex gap-2">
              <SkeletonBox className="w-16 h-4 rounded-md" />
              <SkeletonBox className="w-16 h-4 rounded-md" />
            </div>
          </div>
          <SkeletonBox className="w-12 h-3 rounded shrink-0" />
        </div>
        <div className="flex gap-2 mt-2">
          <SkeletonBox className="w-3 h-3 rounded" />
          <SkeletonBox className="w-32 h-3 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Full Dashboard skeleton ───────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBox className="w-52 h-7 rounded-lg" />
          <SkeletonBox className="w-64 h-3 rounded" />
        </div>
        <SkeletonBox className="w-8 h-4 rounded-full" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <MetricCardSkeleton key={i} />)}
      </div>

      {/* Map + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3"><MapSkeleton /></div>
        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-5">
            <SkeletonBox className="w-24 h-3 rounded mb-4" />
            <div className="flex justify-center"><SkeletonBox className="w-24 h-24 rounded-full" /></div>
          </div>
          <div className="glass rounded-2xl p-5 flex-1">
            <SkeletonBox className="w-20 h-3 rounded mb-4" />
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <SkeletonBox className="w-16 h-3 rounded" />
                    <SkeletonBox className="w-8 h-3 rounded" />
                  </div>
                  <SkeletonBox className="w-full h-1.5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <ChartSkeleton height={260} />

      {/* Complaint rows */}
      <div className="space-y-3">
        {[0,1,2].map(i => <ComplaintRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
