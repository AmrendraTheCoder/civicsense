// ─────────────────────────────────────────────────────────────────────────────
//  simulateClaude.js
//  Simulates a Claude 3.5 Sonnet LLM API call for civic complaint analysis.
//  Returns a streaming async-generator of terminal log lines and a final result.
// ─────────────────────────────────────────────────────────────────────────────

// ── Category Detection Rules ─────────────────────────────────────────────────
const CATEGORY_RULES = [
  {
    keywords: ['pothole', 'road', 'flyover', 'pavement', 'footpath', 'traffic',
               'highway', 'street damage', 'broken road', 'crater', 'asphalt',
               'carriageway', 'divider', 'speed breaker'],
    category: 'Roads',
    dept: 'PWD (Public Works Department)',
    deptCode: 'PWD-DL',
    confidence: 0.94,
  },
  {
    keywords: ['water', 'pipe', 'leakage', 'waterlogging', 'water logging',
               'flooding', 'flood', 'supply', 'jal', 'drainage', 'sewage overflow',
               'ground floor water', 'submerged', 'inundated', 'seepage', 'tanker'],
    category: 'Water',
    dept: 'Delhi Jal Board (DJB)',
    deptCode: 'DJB-DL',
    confidence: 0.91,
  },
  {
    keywords: ['garbage', 'sanitation', 'sewage', 'sewer', 'waste', 'kachra',
               'cleaning', 'stench', 'rodent', 'mosquito', 'open drain', 'nali'],
    category: 'Sanitation',
    dept: 'MCD Sanitation Wing',
    deptCode: 'MCD-SAN',
    confidence: 0.89,
  },
  {
    keywords: ['light', 'electric', 'electricity', 'power', 'bijli', 'transformer',
               'wire', 'outage', 'streetlight', 'street light', 'dark', 'cable',
               'voltage', 'blackout', 'current'],
    category: 'Electricity',
    dept: 'BSES / NDMC Electrical',
    deptCode: 'BSES-DL',
    confidence: 0.92,
  },
  {
    keywords: ['park', 'garden', 'bench', 'tree', 'encroachment', 'footpath blocked',
               'public space', 'playground', 'open space'],
    category: 'Public Spaces',
    dept: 'Delhi Development Authority (DDA)',
    deptCode: 'DDA-PS',
    confidence: 0.85,
  },
];

// ── Severity / Priority Rules ────────────────────────────────────────────────
const SEVERITY_RULES = [
  {
    keywords: ['severe', 'critical', 'urgent', 'dangerous', 'accident', 'entering',
               'flooding', 'deep', 'major', 'emergency', 'injury', 'risk',
               'health hazard', 'no water', '3 days', '5 days', 'week'],
    priority: 'High',
    score: 9.2,
    label: 'CRITICAL',
    color: 'text-rose-400',
  },
  {
    keywords: ['broken', 'damaged', 'non-functional', 'blocked', 'overflow',
               'leaking', 'not working', 'frequent', 'repeated', 'days',
               'inconvenience'],
    priority: 'Med',
    score: 6.1,
    label: 'MODERATE',
    color: 'text-amber-400',
  },
  {
    keywords: ['minor', 'small', 'slight', 'little', 'low', 'minimal',
               'occasional', 'sometimes'],
    priority: 'Low',
    score: 2.8,
    label: 'LOW',
    color: 'text-emerald-400',
  },
];

// ── Entity Extraction ────────────────────────────────────────────────────────
const ENTITY_PATTERNS = [
  { re: /house\s+[\w\d]+/gi,              type: 'LOC',  tag: 'address'    },
  { re: /\b[A-Z]?\d+[A-Z]?\b/g,          type: 'ID',   tag: 'identifier' },
  { re: /\b(road|street|nagar|ward|sector|block|lane)\b/gi, type: 'AREA', tag: 'area' },
  { re: /\b(ground floor|first floor|basement)\b/gi, type: 'LOC', tag: 'location' },
  { re: /\b(pothole|waterlog|leakage|garbage|light)\b/gi,  type: 'ISSUE', tag: 'issue' },
  { re: /\b(severe|deep|major|minor|broken)\b/gi,   type: 'SEVERITY', tag: 'severity' },
  { re: /\b\d+\s*(days?|weeks?|hours?|months?)\b/gi,type: 'DURATION', tag: 'duration' },
];

/**
 * Extract named entities from the raw text.
 * Returns an array of { text, type, tag }.
 */
function extractEntities(text) {
  const found = [];
  const seen = new Set();

  ENTITY_PATTERNS.forEach(({ re, type, tag }) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const val = m[0].trim();
      if (!seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase());
        found.push({ text: val, type, tag });
      }
    }
  });

  return found.slice(0, 8); // cap for display
}

/**
 * Score text against a rule's keyword list.
 * Returns a 0–1 relevance score.
 */
function scoreRule(text, keywords) {
  const lower = text.toLowerCase();
  let hits = 0;
  keywords.forEach((kw) => {
    if (lower.includes(kw.toLowerCase())) hits++;
  });
  return hits / Math.max(keywords.length, 1);
}

/**
 * Determine categories (may return 1 or 2) from text.
 */
function detectCategories(text) {
  const scored = CATEGORY_RULES.map((rule) => ({
    ...rule,
    score: scoreRule(text, rule.keywords),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];

  // If second is within 70% of best score AND both have meaningful hits → multi-category
  const results = [best];
  if (second.score > 0 && second.score >= best.score * 0.65) {
    results.push(second);
  }
  return results;
}

/**
 * Determine severity/priority from text.
 */
function detectPriority(text) {
  const scored = SEVERITY_RULES.map((rule) => ({
    ...rule,
    matchScore: scoreRule(text, rule.keywords),
  })).sort((a, b) => b.matchScore - a.matchScore);

  return scored[0];
}

/**
 * Generate a realistic ticket ID.
 */
function generateTicketId(category) {
  const prefix = {
    Roads: 'RD', Water: 'WL', Sanitation: 'SAN',
    Electricity: 'EL', 'Public Spaces': 'PS',
  }[category] || 'CMP';
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day   = String(new Date().getDate()).padStart(2, '0');
  const rand  = String(Math.floor(1000 + Math.random() * 8999));
  return `DL-${prefix}-${month}${day}-${rand}`;
}

/**
 * Format elapsed time for terminal display.
 */
function ts(ms) {
  const s = (ms / 1000).toFixed(1);
  return `[+${String(s).padStart(5, '0')}s]`;
}

// ── Delay helper ─────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
//  Main export: async generator that yields log-line objects one by one.
//
//  Each yielded object:
//    { type: 'log'|'entity'|'category'|'result', ... }
//
//  On completion, the generator returns the full analysis result.
// ─────────────────────────────────────────────────────────────────────────────

export async function* streamClaudeAnalysis(rawText) {
  const start = Date.now();
  const elapsed = () => Date.now() - start;

  // ── Phase 0: Initialise ──────────────────────────────────────────────────
  yield { type: 'phase', label: 'INIT', text: 'Initializing Claude 3.5 Sonnet…', ms: elapsed() };
  await delay(420);

  yield { type: 'log', level: 'info', text: `Model: claude-3-5-sonnet-20241022  |  max_tokens: 1024`, ms: elapsed() };
  await delay(220);

  const tokens = Math.ceil(rawText.split(/\s+/).length * 1.3);
  yield { type: 'log', level: 'info', text: `Tokenizing input… ${tokens} tokens detected`, ms: elapsed() };
  await delay(380);

  // ── Phase 1: Text Analysis ────────────────────────────────────────────────
  yield { type: 'phase', label: 'PARSE', text: 'Analyzing semantic context…', ms: elapsed() };
  await delay(500);

  yield { type: 'log', level: 'info', text: `Language detection: English (confidence 0.98)`, ms: elapsed() };
  await delay(200);

  yield { type: 'log', level: 'info', text: `Intent classification: CIVIC_COMPLAINT  (p=0.997)`, ms: elapsed() };
  await delay(300);

  // ── Phase 2: Entity Extraction ────────────────────────────────────────────
  yield { type: 'phase', label: 'NER', text: 'Running Named Entity Recognition (NER)…', ms: elapsed() };
  await delay(350);

  const entities = extractEntities(rawText);
  for (const ent of entities) {
    yield { type: 'entity', entity: ent, ms: elapsed() };
    await delay(140);
  }

  if (entities.length === 0) {
    yield { type: 'log', level: 'warn', text: `No specific entities found — using full text for classification`, ms: elapsed() };
    await delay(200);
  }

  // ── Phase 3: Category Classification ─────────────────────────────────────
  yield { type: 'phase', label: 'CLASSIFY', text: 'Running multi-label category classifier…', ms: elapsed() };
  await delay(450);

  const categories = detectCategories(rawText);
  for (const cat of categories) {
    const pct = (cat.confidence * 100).toFixed(1);
    yield {
      type: 'category',
      category: cat.category,
      confidence: cat.confidence,
      text: `Category → ${cat.category.toUpperCase()}  (confidence: ${pct}%)`,
      ms: elapsed(),
    };
    await delay(280);
  }

  if (categories.length > 1) {
    yield { type: 'log', level: 'warn', text: `Multi-category complaint detected → splitting ticket`, ms: elapsed() };
    await delay(200);
  }

  // ── Phase 4: Priority Scoring ─────────────────────────────────────────────
  yield { type: 'phase', label: 'SEVERITY', text: 'Assessing severity and impact score…', ms: elapsed() };
  await delay(400);

  const priorityResult = detectPriority(rawText);
  yield {
    type: 'log', level: 'info',
    text: `Severity keywords matched: ${priorityResult.keywords.filter(k => rawText.toLowerCase().includes(k)).slice(0,4).join(', ') || 'general'}`,
    ms: elapsed(),
  };
  await delay(280);

  yield {
    type: 'priority',
    priority: priorityResult.priority,
    score: priorityResult.score,
    label: priorityResult.label,
    text: `Priority Score: ${priorityResult.score}/10  →  ${priorityResult.label}`,
    ms: elapsed(),
  };
  await delay(320);

  // ── Phase 5: AI Summary Generation ───────────────────────────────────────
  yield { type: 'phase', label: 'SUMMARIZE', text: 'Generating AI summary…', ms: elapsed() };
  await delay(550);

  const primaryCategory = categories[0].category;
  const aiSummary = `${priorityResult.label} severity ${primaryCategory.toLowerCase()} issue detected. ${
    categories.length > 1 ? `Cross-department coordination required (${categories.map(c => c.dept).join(' + ')}).` : `Assigned to ${categories[0].dept}.`
  } Immediate field inspection recommended.`;

  yield { type: 'log', level: 'success', text: `AI Summary: "${aiSummary}"`, ms: elapsed() };
  await delay(200);

  // ── Phase 6: Ticket Generation ────────────────────────────────────────────
  yield { type: 'phase', label: 'TICKET', text: 'Generating unique Ticket ID…', ms: elapsed() };
  await delay(350);

  const ticketId = generateTicketId(primaryCategory);
  yield { type: 'log', level: 'success', text: `Ticket ID assigned: ${ticketId}`, ms: elapsed() };
  await delay(200);

  // ── Phase 7: Routing ──────────────────────────────────────────────────────
  yield { type: 'phase', label: 'ROUTE', text: 'Routing complaint to department(s)…', ms: elapsed() };
  await delay(400);

  for (const cat of categories) {
    yield {
      type: 'route',
      dept: cat.dept,
      code: cat.deptCode,
      text: `→ Routed to ${cat.dept}  [${cat.deptCode}]`,
      ms: elapsed(),
    };
    await delay(260);
  }

  // ── Phase 8: Commit ───────────────────────────────────────────────────────
  yield { type: 'phase', label: 'COMMIT', text: 'Committing to CivicContext state…', ms: elapsed() };
  await delay(300);

  yield { type: 'log', level: 'info', text: `SLA deadline: ${priorityResult.priority === 'High' ? '24 hours' : priorityResult.priority === 'Med' ? '72 hours' : '7 days'}`, ms: elapsed() };
  await delay(200);

  yield { type: 'log', level: 'info', text: `SMS notification queued for ward officer`, ms: elapsed() };
  await delay(220);

  yield { type: 'log', level: 'success', text: `✓ Complaint registered successfully  [${elapsed()}ms total]`, ms: elapsed() };
  await delay(100);

  // ── Return final result object ────────────────────────────────────────────
  return {
    ticketId,
    category: primaryCategory,
    allCategories: categories.map(c => c.category),
    priority: priorityResult.priority,
    dept: categories.map(c => c.dept).join(' + '),
    entities,
    aiSummary,
    totalMs: elapsed(),
  };
}
