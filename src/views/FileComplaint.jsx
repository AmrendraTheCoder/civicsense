import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MicIcon, MicOffIcon, SendIcon, CheckCircle2Icon, AlertCircleIcon,
  ChevronDownIcon, SparklesIcon, XIcon, TerminalIcon, CopyIcon,
  RotateCcwIcon, ZapIcon, BrainCircuitIcon, MapPinIcon,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { streamClaudeAnalysis } from '../utils/simulateClaude';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Public Spaces', 'Other'];

const PRIORITY_CONFIG = {
  High: { cls: 'border-rose-500/60 bg-rose-500/15 text-rose-400',   dot: '#f43f5e' },
  Med:  { cls: 'border-amber-500/60 bg-amber-500/15 text-amber-400', dot: '#f59e0b' },
  Low:  { cls: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400', dot: '#10b981' },
};

const DICTATION_SAMPLES = [
  "Severe water logging and deep pothole outside house 4B, water entering ground floor for past 3 days.",
  "Street lights non-functional on the entire stretch of Rohini Sector 22 for past 2 weeks, causing accidents at night.",
  "Garbage not collected for 5 consecutive days in Block C, Janakpuri. Stench and mosquito breeding near park.",
  "Water supply pipe leaking badly near bus stop, Ward 61. Road also flooded — urgent attention needed.",
  "Electricity transformer sparking dangerously near school premises in Karol Bagh, Ward 55.",
];

const DELHI_ZONES = [
  'Connaught Place, Ward 42', 'Lajpat Nagar, Ward 61', 'Rohini Sector 22, Ward 7',
  'Dhaula Kuan, Ward 38', 'Karol Bagh, Ward 55', 'Dwarka Sector 10, Ward 19',
  'Janakpuri, Ward 24', 'Mayur Vihar Phase 1, Ward 83', 'Saket, Ward 73', 'Pitampura, Ward 14',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Terminal log line renderer */
function TerminalLine({ line, index }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const phaseColors = {
    INIT:     'text-violet-400', PARSE:    'text-cyan-400',
    NER:      'text-blue-400',   CLASSIFY: 'text-indigo-400',
    SEVERITY: 'text-orange-400', SUMMARIZE:'text-yellow-400',
    TICKET:   'text-emerald-400',ROUTE:    'text-teal-400',
    COMMIT:   'text-green-400',
  };

  const levelColors = {
    info:    'text-slate-300',
    warn:    'text-amber-400',
    success: 'text-emerald-400',
    error:   'text-rose-400',
  };

  const prefix = String(index + 1).padStart(3, '0');

  if (line.type === 'phase') {
    return (
      <div className="flex items-center gap-2 mt-3 mb-1 animate-fade-in-up">
        <span className="text-slate-700 font-mono text-xs">{prefix}</span>
        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${phaseColors[line.label] || 'text-slate-400'}`}
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          [{line.label}]
        </span>
        <span className={`font-mono text-xs font-semibold ${phaseColors[line.label] || 'text-slate-300'}`}>
          {line.text}
        </span>
        <span className="text-slate-700 font-mono text-xs ml-auto">+{line.ms}ms</span>
      </div>
    );
  }

  if (line.type === 'entity') {
    const tagColor = {
      address: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      area:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      issue:   'bg-rose-500/20 text-rose-300 border-rose-500/30',
      severity:'bg-orange-500/20 text-orange-300 border-orange-500/30',
      duration:'bg-purple-500/20 text-purple-300 border-purple-500/30',
      identifier:'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      location:'bg-teal-500/20 text-teal-300 border-teal-500/30',
    }[line.entity.tag] || 'bg-slate-500/20 text-slate-300';

    return (
      <div className="flex items-center gap-2 pl-6 py-0.5 animate-fade-in-up">
        <span className="text-slate-700 font-mono text-xs">{prefix}</span>
        <span className="text-slate-600 font-mono text-xs">  └─</span>
        <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${tagColor}`}>
          [{line.entity.type}]
        </span>
        <span className="font-mono text-xs text-slate-300">"{line.entity.text}"</span>
        <span className="text-slate-700 text-xs ml-1">tag:{line.entity.tag}</span>
      </div>
    );
  }

  if (line.type === 'category') {
    const pct = Math.round(line.confidence * 100);
    return (
      <div className="flex items-center gap-2 pl-6 animate-fade-in-up">
        <span className="text-slate-700 font-mono text-xs">{prefix}</span>
        <span className="text-slate-600 font-mono text-xs">  └─</span>
        <span className="font-mono text-xs font-bold text-indigo-300">{line.category}</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-24">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
        <span className="text-indigo-400 font-mono text-xs">{pct}%</span>
      </div>
    );
  }

  if (line.type === 'priority') {
    const colors = { High: 'text-rose-400', Med: 'text-amber-400', Low: 'text-emerald-400' };
    return (
      <div className="flex items-center gap-2 animate-fade-in-up">
        <span className="text-slate-700 font-mono text-xs">{prefix}</span>
        <span className={`font-mono text-xs font-bold ${colors[line.priority]}`}>
          ⚡ PRIORITY: {line.label}  [{line.score}/10]
        </span>
      </div>
    );
  }

  if (line.type === 'route') {
    return (
      <div className="flex items-center gap-2 animate-fade-in-up">
        <span className="text-slate-700 font-mono text-xs">{prefix}</span>
        <span className="font-mono text-xs text-teal-400">→ ROUTE:</span>
        <span className="font-mono text-xs text-teal-300 font-semibold">{line.dept}</span>
        <span className="font-mono text-xs text-slate-600">[{line.code}]</span>
      </div>
    );
  }

  // Default log line
  return (
    <div className="flex items-start gap-2 animate-fade-in-up">
      <span className="text-slate-700 font-mono text-xs shrink-0">{prefix}</span>
      <span className={`font-mono text-xs ${levelColors[line.level] || 'text-slate-300'}`}>
        {line.text}
      </span>
      {line.ms !== undefined && (
        <span className="text-slate-700 font-mono text-xs ml-auto shrink-0">+{line.ms}ms</span>
      )}
    </div>
  );
}

/** The AI Terminal panel */
function TerminalPanel({ logs, isRunning, result, onClose }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-t-2xl shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <TerminalIcon size={13} className="text-slate-500 ml-1" />
        <span className="text-slate-500 text-xs font-mono">claude-civic-processor — zsh</span>
        <div className="ml-auto flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RUNNING
            </span>
          )}
          {!isRunning && result && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              DONE  [{result.totalMs}ms]
            </span>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5 font-mono text-sm custom-scrollbar"
        style={{ background: 'rgba(5,5,15,0.95)', minHeight: 0 }}>
        {/* Prompt line */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-emerald-400 text-xs">civic@delhi-ai</span>
          <span className="text-slate-500 text-xs">~</span>
          <span className="text-slate-500 text-xs">$</span>
          <span className="text-slate-300 text-xs">claude analyze --civic --stream --model sonnet-3.5</span>
        </div>

        {logs.map((line, i) => (
          <TerminalLine key={i} line={line} index={i} />
        ))}

        {isRunning && (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse rounded-sm" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Result card — appears after completion */}
      {!isRunning && result && (
        <div className="shrink-0 p-4 space-y-3 rounded-b-2xl"
          style={{ background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2Icon size={16} className="text-emerald-400" />
            <span className="text-emerald-300 font-semibold text-sm">Analysis Complete</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Ticket ID',  result.ticketId,              'text-emerald-300 font-mono font-bold'],
              ['Category',   result.allCategories.join(' + '), 'text-indigo-300'],
              ['Priority',   result.priority,               result.priority === 'High' ? 'text-rose-400 font-bold' : result.priority === 'Med' ? 'text-amber-400' : 'text-emerald-400'],
              ['Routed To',  result.dept,                  'text-teal-300'],
            ].map(([k, v, cls]) => (
              <div key={k} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-slate-600 text-xs mb-0.5">{k}</p>
                <p className={`text-xs ${cls}`}>{v}</p>
              </div>
            ))}
          </div>

          {result.aiSummary && (
            <p className="text-xs text-slate-400 italic leading-relaxed border-l-2 border-emerald-500/30 pl-3">
              {result.aiSummary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Success overlay after state commit */
function SuccessCard({ complaint, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 animate-scale-in">
      <div className="relative w-24 h-24 mb-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
          <CheckCircle2Icon size={40} className="text-white" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" style={{ animationDuration: '1.8s' }} />
      </div>

      <h2 className="text-3xl font-bold font-display text-white mb-2">Complaint Registered!</h2>
      <p className="text-slate-400 text-sm mb-6">Your issue has been logged and routed to the correct department.</p>

      {/* Ticket card */}
      <div className="w-full max-w-sm p-5 rounded-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))',
          border: '1px solid rgba(16,185,129,0.25)',
        }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-slate-500 uppercase tracking-widest">Ticket ID</span>
          <button
            onClick={() => navigator.clipboard?.writeText(complaint?.id || '')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <CopyIcon size={11} /> Copy
          </button>
        </div>
        <p className="text-2xl font-mono font-bold text-emerald-300 mb-4">{complaint?.id}</p>
        <div className="space-y-2 text-sm">
          {[
            ['Category',  complaint?.category || '—'],
            ['Priority',  complaint?.priority || '—'],
            ['Status',    'Submitted → AI Triage'],
            ['Ward',      complaint?.ward || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-600">{k}</span>
              <span className="text-slate-300 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-500 mb-8">
        <p>✅ Logged in CivicContext state</p>
        <p>✅ AI summary generated &amp; attached</p>
        <p>✅ Department notified via SMS</p>
        <p>✅ SLA timer started</p>
      </div>

      <button id="file-another-btn" onClick={onReset} className="btn-primary px-10 py-3">
        File Another Complaint
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FileComplaint() {
  const { addComplaint } = useCivic();

  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'Med',
    ward: '', language: 'English',
  });
  const [errors, setErrors]     = useState({});
  const [dictating, setDictating] = useState(false);
  const [dictationSample, setDictationSample] = useState(0);

  // AI terminal state
  const [phase, setPhase] = useState('idle'); // idle | processing | done
  const [termLogs, setTermLogs] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [filedComplaint, setFiledComplaint] = useState(null);

  // Voice dictation wave animation
  const waveRef = useRef(null);
  const dictTimerRef = useRef(null);

  // ── Field setter ──────────────────────────────────────────────────────────
  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  // ── Voice dictation toggle ────────────────────────────────────────────────
  const toggleDictation = useCallback(() => {
    if (dictating) {
      // Stop dictation
      clearTimeout(dictTimerRef.current);
      setDictating(false);
    } else {
      // Start dictation — simulate recording for 2.2s then fill
      setDictating(true);
      const sample = DICTATION_SAMPLES[dictationSample % DICTATION_SAMPLES.length];
      setDictationSample(i => i + 1);

      dictTimerRef.current = setTimeout(() => {
        setDictating(false);
        set('description', sample);
        // Auto-suggest title from first 8 words
        if (!form.title) {
          const words = sample.split(' ').slice(0, 8).join(' ');
          set('title', words.replace(/[.,]/g, ''));
        }
      }, 2200);
    }
  }, [dictating, dictationSample, form.title]);

  useEffect(() => () => clearTimeout(dictTimerRef.current), []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())                              errs.title = 'Title is required';
    if (!form.description.trim() || form.description.length < 15)
      errs.description = 'Please describe the issue in at least 15 characters';
    return errs;
  };

  // ── Submit handler — triggers AI pipeline ─────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setPhase('processing');
    setTermLogs([]);
    setAiResult(null);

    const rawText = `${form.title}. ${form.description}`;
    let finalResult = null;

    // Stream the async generator line by line
    const gen = streamClaudeAnalysis(rawText);
    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        finalResult = value;   // generator return value
        break;
      }
      setTermLogs(prev => [...prev, value]);
    }

    // Merge AI results with any manually-set form fields
    const mergedCategory = form.category || finalResult.category;
    const mergedPriority  = form.priority !== 'Med' ? form.priority : finalResult.priority;

    const result = addComplaint({
      ...form,
      category:  mergedCategory,
      priority:  mergedPriority,
      aiSummary: finalResult.aiSummary,
      lat: 28.6 + Math.random() * 0.15,
      lng: 77.1 + Math.random() * 0.15,
    });

    // Override the generated ID with the AI ticket ID for display
    const displayComplaint = { ...result, id: finalResult.ticketId };

    setAiResult(finalResult);
    setFiledComplaint(displayComplaint);
    setPhase('done');
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setForm({ title:'', description:'', category:'', priority:'Med', ward:'', language:'English' });
    setErrors({});
    setPhase('idle');
    setTermLogs([]);
    setAiResult(null);
    setFiledComplaint(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  SUCCESS STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'done' && filedComplaint && aiResult) {
    return (
      <div className="max-w-3xl mx-auto">
        <SuccessCard complaint={filedComplaint} onReset={reset} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN LAYOUT  (form left + terminal right when processing)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="animate-fade-in-up mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
          <h1 className="text-2xl font-bold font-display text-white">File a Complaint</h1>
        </div>
        <p className="text-sm text-slate-500 ml-4">
          Describe your civic issue — our AI will categorize and route it automatically.
        </p>
      </div>

      <div className={`grid gap-6 transition-all duration-500 ${phase === 'processing' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>

        {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 animate-fade-in-up space-y-5" style={{ animationDelay: '60ms' }}>

          {/* Title */}
          <div>
            <label htmlFor="fc-title" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="fc-title"
              type="text"
              placeholder="e.g., Deep pothole causing accidents near flyover"
              className="civic-input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={120}
              disabled={phase === 'processing'}
            />
            {errors.title && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircleIcon size={11} />{errors.title}
              </p>
            )}
          </div>

          {/* Description + Voice Dictation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="fc-description" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Description <span className="text-rose-500">*</span>
              </label>

              {/* Voice Dictation Toggle */}
              <button
                id="voice-dictation-toggle"
                type="button"
                onClick={toggleDictation}
                disabled={phase === 'processing'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 ${
                  dictating
                    ? 'border-rose-500/60 bg-rose-500/15 text-rose-400 animate-pulse'
                    : 'border-white/10 text-slate-500 hover:border-violet-500/40 hover:text-violet-400'
                }`}
              >
                {dictating ? (
                  <>
                    <MicIcon size={12} className="animate-bounce" />
                    <span>Listening…</span>
                    <span className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="w-0.5 rounded-full bg-rose-400"
                          style={{
                            height: `${6 + Math.random() * 10}px`,
                            animation: `voice-wave 0.4s ease-in-out ${i * 0.08}s infinite alternate`,
                          }} />
                      ))}
                    </span>
                  </>
                ) : (
                  <>
                    <MicOffIcon size={12} />
                    <span>Voice Dictation</span>
                  </>
                )}
              </button>
            </div>

            {/* Dictation active indicator */}
            {dictating && (
              <div className="mb-2 p-2 rounded-lg flex items-center gap-2 text-xs text-rose-300 animate-fade-in-up"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Recording… speak your complaint clearly.
              </div>
            )}

            <textarea
              id="fc-description"
              rows={6}
              placeholder="Describe the issue in detail — location, duration, impact on residents…&#10;&#10;Or click 'Voice Dictation' above to auto-fill with a sample."
              className="civic-input resize-none font-sans"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              disabled={phase === 'processing' || dictating}
            />
            <div className="flex justify-between mt-1">
              {errors.description
                ? <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircleIcon size={11} />{errors.description}</p>
                : <span />
              }
              <p className="text-xs text-slate-700">{form.description.length} chars</p>
            </div>
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category dropdown */}
            <div>
              <label htmlFor="fc-category" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Category
                <span className="ml-1.5 text-violet-500 text-xs normal-case font-normal">(AI will auto-detect)</span>
              </label>
              <div className="relative">
                <select
                  id="fc-category"
                  className="civic-select pr-8"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  disabled={phase === 'processing'}
                >
                  <option value="">Auto (AI detects)</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDownIcon size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              </div>
            </div>

            {/* Priority dropdown */}
            <div>
              <label htmlFor="fc-priority" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Priority
                <span className="ml-1.5 text-violet-500 text-xs normal-case font-normal">(AI will score)</span>
              </label>
              <div className="flex gap-2">
                {['High','Med','Low'].map(p => (
                  <button
                    key={p}
                    type="button"
                    id={`priority-${p}`}
                    onClick={() => set('priority', p)}
                    disabled={phase === 'processing'}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                      form.priority === p ? PRIORITY_CONFIG[p].cls : 'border-white/10 text-slate-600 hover:border-white/20 disabled:opacity-40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ward / Area */}
          <div>
            <label htmlFor="fc-ward" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Ward / Area
            </label>
            <div className="relative">
              <MapPinIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                id="fc-ward"
                className="civic-select pl-9 pr-8"
                value={form.ward}
                onChange={e => set('ward', e.target.value)}
                disabled={phase === 'processing'}
              >
                <option value="">Select ward / area</option>
                {DELHI_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <ChevronDownIcon size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>

          {/* AI Info strip */}
          <div className="flex items-start gap-3 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <BrainCircuitIcon size={15} className="text-violet-400 mt-0.5 shrink-0" />
            <p className="text-slate-500 leading-relaxed">
              When you click <strong className="text-violet-400">Submit</strong>, Claude 3.5 Sonnet will
              analyze your description, extract entities, classify the category &amp; priority,
              generate a unique ticket ID, and route to the correct department — live in the terminal.
            </p>
          </div>

          {/* Submit button */}
          <button
            id="submit-complaint-btn"
            type="button"
            onClick={handleSubmit}
            disabled={phase === 'processing'}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {phase === 'processing' ? (
              <>
                <ZapIcon size={16} className="animate-pulse" />
                AI Processing…
              </>
            ) : (
              <>
                <SparklesIcon size={16} />
                Submit &amp; Analyze with AI
                <SendIcon size={15} />
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT: AI Terminal (only shown when processing/done) ────────── */}
        {phase === 'processing' && (
          <div className="glass rounded-2xl overflow-hidden animate-fade-in-up flex flex-col"
            style={{ minHeight: '500px', animationDelay: '100ms' }}>
            <TerminalPanel
              logs={termLogs}
              isRunning={true}
              result={null}
              onClose={reset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
