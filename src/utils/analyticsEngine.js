// ─────────────────────────────────────────────────────────────────────────────
//  analyticsEngine.js
//  Derives trend data, risk scores, and AI insights from live complaints array.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Public Spaces', 'Other'];

const CAT_META = {
  Roads:          { color: '#3b82f6', icon: '🛣️',  dept: 'PWD',  sla: 24  },
  Sanitation:     { color: '#10b981', icon: '🗑️',  dept: 'MCD',  sla: 48  },
  Water:          { color: '#06b6d4', icon: '💧',  dept: 'DJB',  sla: 12  },
  Electricity:    { color: '#f59e0b', icon: '⚡',  dept: 'BSES', sla: 6   },
  'Public Spaces':{ color: '#8b5cf6', icon: '🌳',  dept: 'DDA',  sla: 72  },
  Other:          { color: '#64748b', icon: '📋',  dept: 'MCD',  sla: 96  },
};

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── 1. TREND DATA  ────────────────────────────────────────────────────────────
// Builds a 14-day trailing complaint-volume series seeded from real timestamps.

export function buildTrendData(complaints, days = 14) {
  const now   = Date.now();
  const DAY   = 86400000;
  const points = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - i * DAY;
    const dayEnd   = dayStart + DAY;

    // Real complaints within this day's window
    const real = complaints.filter(c => {
      const t = new Date(c.timestamp).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;

    // Synthetic wave to simulate realistic municipal volume (seed + noise)
    const weekday = new Date(dayStart).getDay();             // 0=Sun,6=Sat
    const base    = weekday === 0 || weekday === 6 ? 4 : 9;  // weekends quieter
    const noise   = Math.sin((days - i) * 0.9 + 1.2) * 2.5 + Math.cos((days - i) * 0.4) * 1.5;
    const synthetic = Math.max(1, Math.round(base + noise + real));

    // High-priority sub-series
    const highReal = complaints.filter(c => {
      const t = new Date(c.timestamp).getTime();
      return t >= dayStart && t < dayEnd && c.priority === 'High';
    }).length;
    const highSynth = Math.max(0, Math.round(synthetic * 0.38 + highReal));

    // AI predicted (slight forward offset)
    const predicted = Math.max(1, Math.round(synthetic * (1 + (Math.sin(days - i) * 0.15))));

    const label = i === 0 ? 'Today'
      : i === 1 ? 'Yesterday'
      : new Date(dayStart).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    points.push({ label, synthetic, highSynth, predicted, dayStart });
  }

  return points;
}

// ── 2. CATEGORY RISK SCORES ───────────────────────────────────────────────────
// Scores each category 0–100 based on open complaints, priority weighting, SLA breach.

export function computeCategoryRisk(complaints) {
  return CATEGORIES.map(cat => {
    const total    = complaints.filter(c => c.category === cat).length;
    const open     = complaints.filter(c => c.category === cat && c.status !== 'Resolved').length;
    const high     = complaints.filter(c => c.category === cat && c.priority === 'High' && c.status !== 'Resolved').length;
    const slaHrs   = CAT_META[cat]?.sla ?? 48;

    // SLA breaches: complaints older than SLA target
    const now = Date.now();
    const breached = complaints.filter(c => {
      if (c.category !== cat || c.status === 'Resolved') return false;
      return (now - new Date(c.timestamp).getTime()) > slaHrs * 3600000;
    }).length;

    // Score formula (0–100)
    const raw = high * 25 + open * 10 + breached * 15;
    const score = Math.min(100, Math.round(raw));

    // Simulated 48h trend (+/-)
    const trend  = high > 0 ? Math.round(high * 20 + Math.random() * 15) : Math.round(-5 - Math.random() * 10);
    const isUp   = trend > 0;

    return {
      category: cat,
      ...CAT_META[cat],
      total, open, high, breached, score, trend, isUp,
    };
  }).sort((a, b) => b.score - a.score);
}

// ── 3. ZONE RISK SCORES ───────────────────────────────────────────────────────
// Ranks wards/locations by complaint density and priority.

export function computeZoneRisk(complaints) {
  const wardMap = {};
  complaints.forEach(c => {
    if (!c.ward) return;
    if (!wardMap[c.ward]) wardMap[c.ward] = { ward: c.ward, total: 0, high: 0, open: 0 };
    wardMap[c.ward].total++;
    if (c.priority === 'High') wardMap[c.ward].high++;
    if (c.status !== 'Resolved') wardMap[c.ward].open++;
  });

  const zones = Object.values(wardMap).map(z => {
    const raw   = z.high * 30 + z.open * 12 + z.total * 5;
    const score = Math.min(100, raw);
    const cats  = complaints
      .filter(c => c.ward === z.ward && c.status !== 'Resolved')
      .map(c => c.category);
    const topCat = cats.sort((a, b) =>
      cats.filter(x => x === b).length - cats.filter(x => x === a).length
    )[0] || 'Mixed';

    // Simulate realistic trend
    const delta = z.high > 0 ? Math.round(z.high * 18 + Math.random() * 12) : Math.round(-3 - Math.random() * 8);

    return { ...z, score, topCat, delta, color: CAT_META[topCat]?.color ?? '#64748b' };
  });

  // Pad with synthetic zones if real data is sparse
  const SYNTHETIC_ZONES = [
    { ward: 'Rohini Sector 22, Ward 7',    topCat: 'Sanitation', score: 88, total: 14, high: 4, open: 11, delta: 22 },
    { ward: 'Connaught Place, Ward 42',    topCat: 'Roads',       score: 84, total: 12, high: 3, open: 10, delta: 18 },
    { ward: 'Dhaula Kuan, Ward 38',        topCat: 'Electricity', score: 76, total: 9,  high: 3, open: 7,  delta: -5 },
    { ward: 'Lajpat Nagar, Ward 61',       topCat: 'Water',       score: 71, total: 8,  high: 2, open: 6,  delta: 12 },
    { ward: 'Karol Bagh, Ward 55',         topCat: 'Sanitation',  score: 65, total: 7,  high: 1, open: 4,  delta: -8 },
    { ward: 'Dwarka Sector 10, Ward 19',   topCat: 'Roads',       score: 52, total: 5,  high: 1, open: 4,  delta: 6  },
    { ward: 'Janakpuri, Ward 24',          topCat: 'Electricity', score: 38, total: 4,  high: 0, open: 3,  delta: -2 },
    { ward: 'Pitampura, Ward 14',          topCat: 'Water',       score: 31, total: 3,  high: 0, open: 2,  delta: 4  },
  ].map(z => ({ ...z, color: CAT_META[z.topCat]?.color ?? '#64748b' }));

  const real = zones.sort((a, b) => b.score - a.score).slice(0, 5);
  const merged = [...real];
  SYNTHETIC_ZONES.forEach(s => {
    if (!merged.find(r => r.ward === s.ward)) merged.push(s);
  });
  return merged.sort((a, b) => b.score - a.score).slice(0, 8);
}

// ── 4. AI INSIGHT STREAM ─────────────────────────────────────────────────────
// Async generator that yields insight cards one-by-one simulating an LLM call.

export async function* streamInsights(complaints) {
  await delay(600); // "API call" latency

  const cats      = computeCategoryRisk(complaints);
  const zones     = computeZoneRisk(complaints);
  const topCat    = cats[0];
  const topZone   = zones[0];
  const total     = complaints.length;
  const highCount = complaints.filter(c => c.priority === 'High').length;
  const resolved  = complaints.filter(c => c.status === 'Resolved').length;
  const resRate   = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const now       = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short' });

  // ── Insight 1: Top category spike ───────────────────────────────────────
  if (topCat && topCat.score > 0) {
    await delay(400);
    yield {
      id: 'ins-cat-spike',
      type: 'critical',
      icon: '🚨',
      title: `${topCat.category} Complaints Spiking`,
      body: `⚠️ Warning: ${topCat.category} complaints in ${topZone?.ward?.split(',')[0] || 'the city'} have risen +${Math.abs(topCat.trend)}% in the last 48 hours (${topCat.open} open, ${topCat.high} high-priority). Recommend proactive dispatch to ${topCat.dept} before SLA breach in ${topCat.sla}hrs.`,
      confidence: 91,
      impact: 'High',
      tag: 'Spike Detection',
      color: topCat.color,
    };
  }

  // ── Insight 2: SLA breach risk ───────────────────────────────────────────
  await delay(500);
  const slaAtRisk = cats.filter(c => c.breached > 0);
  if (slaAtRisk.length > 0) {
    yield {
      id: 'ins-sla',
      type: 'warning',
      icon: '⏰',
      title: 'SLA Breach Risk Detected',
      body: `${slaAtRisk.map(c => c.category).join(', ')} department(s) have ${slaAtRisk.reduce((a,c) => a+c.breached, 0)} complaints that have exceeded their target response windows. Recommend immediate escalation to ward officers and field inspectors.`,
      confidence: 96,
      impact: 'High',
      tag: 'SLA Monitor',
      color: '#f43f5e',
    };
  }

  // ── Insight 3: Resolution rate ───────────────────────────────────────────
  await delay(450);
  yield {
    id: 'ins-resolution',
    type: resRate < 40 ? 'warning' : 'info',
    icon: resRate < 40 ? '📉' : '📈',
    title: resRate < 40 ? 'Resolution Rate Below Target' : 'Resolution Rate Healthy',
    body: `Current resolution rate is ${resRate}% (${resolved}/${total} closed). ${
      resRate < 40
        ? `This is below the 60% civic benchmark. ${highCount} high-priority cases need immediate closure to prevent escalation.`
        : `The system is performing within acceptable municipal KPIs. Continue monitoring high-priority backlog of ${highCount} cases.`
    }`,
    confidence: 88,
    impact: resRate < 40 ? 'High' : 'Medium',
    tag: 'KPI Analysis',
    color: resRate < 40 ? '#f59e0b' : '#10b981',
  };

  // ── Insight 4: Top zone hotspot ──────────────────────────────────────────
  await delay(400);
  if (topZone) {
    yield {
      id: 'ins-zone',
      type: 'warning',
      icon: '🗺️',
      title: `Hotspot: ${topZone.ward?.split(',')[0]}`,
      body: `${topZone.ward} has the highest risk score (${topZone.score}/100) with ${topZone.open} unresolved complaints, ${topZone.high} flagged high-priority. Primary issue category: ${topZone.topCat}. Recommend zone-level task force deployment by ${now}.`,
      confidence: 83,
      impact: 'High',
      tag: 'Geo-Intelligence',
      color: topZone.color,
    };
  }

  // ── Insight 5: Seasonal / predictive ────────────────────────────────────
  await delay(350);
  yield {
    id: 'ins-seasonal',
    type: 'info',
    icon: '🌧️',
    title: 'Monsoon Infrastructure Alert',
    body: 'Historical civic data pattern: expect a 280–340% surge in Road and Sanitation complaints between July 10–August 15. Pre-position sanitation crews in Rohini, Dwarka, and Najafgarh. Road repair work should be accelerated before seasonal rainfall.',
    confidence: 94,
    impact: 'High',
    tag: 'Seasonal Forecast',
    color: '#8b5cf6',
  };
}
