import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  MicIcon, MicOffIcon, Volume2Icon, Volume1Icon, VolumeXIcon,
  ZapIcon, BotIcon, UserIcon, RefreshCwIcon, SparklesIcon,
  ArrowRightIcon, CheckCircle2Icon, CircleIcon, RadioIcon,
  MapPinIcon, SendIcon, CpuIcon, RouteIcon, WifiIcon,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

// ─────────────────────────────────────────────────────────────────────────────
//  INTENT ENGINE — keyword rules for EN + HI
// ─────────────────────────────────────────────────────────────────────────────
const INTENTS = [
  {
    id: 'road',
    keywords: ['road broken', 'pothole', 'road damage', 'broken road', 'road repair',
               'crater', 'flyover', 'pavement broken', 'road bad', 'no road'],
    hindiKeywords: ['सड़क टूटी', 'गड्ढा', 'सड़क खराब', 'सड़क टूट गई', 'रोड टूटा'],
    category: 'Roads',
    priority: 'High',
    dept: 'PWD (Public Works Department)',
    deptCode: 'PWD-DL',
    color: '#3b82f6',
    enResponse: "I've logged a **High-priority** complaint for the **Roads Department (PWD)**. A field engineer will be dispatched within 24 hours. Your Ticket ID has been generated.",
    hiResponse: "मैंने **रोड विभाग (PWD)** के लिए एक **उच्च-प्राथमिकता** शिकायत दर्ज की है। 24 घंटों में एक फील्ड इंजीनियर भेजा जाएगा।",
  },
  {
    id: 'water',
    keywords: ['water', 'flooding', 'water logging', 'waterlogged', 'pani', 'flood',
               'water supply', 'no water', 'pipe burst', 'leakage', 'sewage overflow',
               'water entered', 'water entering', 'submerged'],
    hindiKeywords: ['पानी भर गया है', 'पानी भरना', 'बाढ़', 'जलभराव', 'पानी आ गया',
                   'पानी नहीं है', 'पाइप टूट गया', 'रिसाव', 'पानी भर', 'नल बंद'],
    category: 'Water',
    priority: 'High',
    dept: 'Delhi Jal Board (DJB)',
    deptCode: 'DJB-DL',
    color: '#06b6d4',
    enResponse: "I've logged a **High-priority** complaint for the **Delhi Jal Board (DJB)**. Water logging and supply issues are flagged as critical. A DJB team will respond within 12 hours.",
    hiResponse: "मैंने **दिल्ली जल बोर्ड (DJB)** के लिए एक **उच्च-प्राथमिकता** शिकायत दर्ज की है। जलभराव की समस्या को गंभीर माना गया है। DJB की टीम 12 घंटों में जवाब देगी।",
  },
  {
    id: 'sanitation',
    keywords: ['garbage', 'sewer', 'sanitation', 'kachra', 'waste', 'cleaning',
               'dirty', 'stench', 'rodent', 'mosquito', 'drain blocked'],
    hindiKeywords: ['कचरा', 'सीवर', 'गंदगी', 'सफाई नहीं', 'बदबू', 'चूहे', 'मच्छर'],
    category: 'Sanitation',
    priority: 'Med',
    dept: 'MCD Sanitation Wing',
    deptCode: 'MCD-SAN',
    color: '#10b981',
    enResponse: "I've logged a **Medium-priority** sanitation complaint for **MCD**. The sanitation crew will be dispatched within 48 hours to address the issue.",
    hiResponse: "मैंने **MCD सफाई विभाग** के लिए एक शिकायत दर्ज की है। सफाई दल 48 घंटों में भेजा जाएगा।",
  },
  {
    id: 'electricity',
    keywords: ['light', 'electric', 'electricity', 'power', 'bijli', 'transformer',
               'wire', 'outage', 'streetlight', 'dark', 'no power', 'blackout'],
    hindiKeywords: ['बिजली नहीं', 'लाइट नहीं', 'अंधेरा', 'ट्रांसफार्मर', 'तार टूटा', 'बिजली कट'],
    category: 'Electricity',
    priority: 'High',
    dept: 'BSES / NDMC Electrical',
    deptCode: 'BSES-DL',
    color: '#f59e0b',
    enResponse: "I've logged a **High-priority** electricity complaint for **BSES / NDMC**. Power outages are treated as urgent. An electrical crew will respond within 6 hours.",
    hiResponse: "मैंने **BSES / NDMC** के लिए एक **उच्च-प्राथमिकता** बिजली शिकायत दर्ज की है। 6 घंटों में इलेक्ट्रिकल टीम जवाब देगी।",
  },
];

const GREET_KEYWORDS = ['hello', 'hi', 'namaste', 'नमस्ते', 'help', 'मदद'];

const FALLBACK_EN = "I've received your report. Could you give me more details — the exact location, duration of the problem, and how it's affecting residents?";
const FALLBACK_HI = "मैंने आपकी शिकायत सुन ली। कृपया अधिक जानकारी दें — सटीक स्थान, समस्या की अवधि, और यह लोगों को कैसे प्रभावित कर रहा है?";

const GREET_EN = "नमस्ते! I'm CivicAI 🏛️ — your multilingual voice assistant for Delhi civic services.\n\nSpeak or type in English or Hindi. Try saying: \"road broken\", \"पानी भर गया है\", \"garbage not collected\", or \"electricity outage\".";
const GREET_HI = "नमस्ते! मैं CivicAI हूं 🏛️ — दिल्ली नागरिक सेवाओं के लिए आपका बहुभाषी वॉयस असिस्टेंट।\n\nआप हिंदी या अंग्रेजी में बोल या लिख सकते हैं। कहें: \"सड़क टूटी है\", \"पानी भर गया है\", या \"कचरा नहीं उठा\"।";

function matchIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of INTENTS) {
    const allKws = [...intent.keywords, ...intent.hindiKeywords];
    if (allKws.some(kw => lower.includes(kw.toLowerCase()))) return intent;
  }
  if (GREET_KEYWORDS.some(kw => lower.includes(kw))) return { id: 'greet' };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PIPELINE STAGE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 'mic',    label: 'Mic Input',       icon: MicIcon,          desc: 'Capturing audio via WebRTC' },
  { id: 'text',   label: 'Transcription',   icon: RadioIcon,        desc: 'Web Speech API → text' },
  { id: 'ai',     label: 'AI Processing',   icon: CpuIcon,          desc: 'Intent + entity extraction' },
  { id: 'route',  label: 'Auto-Routing',    icon: RouteIcon,        desc: 'Department assignment' },
  { id: 'synth',  label: 'Audio Synthesis', icon: Volume2Icon,      desc: 'SpeechSynthesis API → TTS' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  WAVEFORM CANVAS  (animates while recording / speaking)
// ─────────────────────────────────────────────────────────────────────────────
function WaveformCanvas({ active, color = '#3b82f6', bars = 32 }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const barW = W / bars;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      phaseRef.current += active ? 0.12 : 0.02;

      for (let i = 0; i < bars; i++) {
        const t = i / bars;
        let amplitude;
        if (active) {
          amplitude = (
            Math.sin(phaseRef.current + t * Math.PI * 4) * 0.4 +
            Math.sin(phaseRef.current * 1.7 + t * Math.PI * 6) * 0.3 +
            Math.random() * 0.3
          );
          amplitude = Math.max(0.05, Math.abs(amplitude));
        } else {
          amplitude = 0.06 + Math.sin(phaseRef.current + t * Math.PI * 2) * 0.04;
        }

        const barH  = amplitude * H;
        const x     = i * barW + barW * 0.15;
        const y     = (H - barH) / 2;
        const alpha = active ? 0.7 + amplitude * 0.3 : 0.2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, color + 'cc');
        grad.addColorStop(1, color + '44');

        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW * 0.7, barH, 3);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, color, bars]);

  return (
    <canvas ref={canvasRef} width={320} height={56}
      className="w-full" style={{ display: 'block' }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PIPELINE VISUALIZER
// ─────────────────────────────────────────────────────────────────────────────
function PipelineVisualizer({ activeStage, completedStages }) {
  return (
    <div className="glass rounded-2xl px-4 py-4">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">
        Processing Pipeline
      </p>
      <div className="relative flex items-center justify-between">
        {/* Connector track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 mx-6"
          style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Animated fill */}
        {completedStages.length > 0 && (
          <div className="absolute top-1/2 -translate-y-1/2 h-0.5 mx-6 transition-all duration-500"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              left: 0,
              width: `${(completedStages.length / (PIPELINE_STAGES.length - 1)) * 100}%`,
            }} />
        )}

        {PIPELINE_STAGES.map((stage, i) => {
          const Icon  = stage.icon;
          const done  = completedStages.includes(stage.id);
          const active = activeStage === stage.id;

          return (
            <div key={stage.id} className="relative flex flex-col items-center gap-2 z-10">
              {/* Node */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-400 ${
                done
                  ? 'scale-105'
                  : active
                  ? 'scale-110'
                  : ''
              }`}
                style={{
                  background: done
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : active
                    ? 'rgba(59,130,246,0.2)'
                    : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '1px solid rgba(59,130,246,0.6)'
                    : done
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: active ? '0 0 16px rgba(59,130,246,0.4)' : done ? '0 0 12px rgba(139,92,246,0.3)' : 'none',
                }}>
                {done
                  ? <CheckCircle2Icon size={16} className="text-white" />
                  : <Icon size={15} className={active ? 'text-blue-300' : 'text-slate-600'} />
                }
                {active && (
                  <div className="absolute inset-0 rounded-xl animate-ping"
                    style={{ border: '2px solid rgba(59,130,246,0.5)', animationDuration: '1.2s' }} />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <p className={`text-[10px] font-semibold transition-colors ${
                  done ? 'text-blue-400' : active ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  {stage.label}
                </p>
                {(active || done) && (
                  <p className="text-[9px] text-slate-600 mt-0.5 max-w-16 text-center leading-tight hidden lg:block">
                    {stage.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 40); return () => clearTimeout(t); }, []);

  const renderContent = (text) =>
    text.split('**').map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-bold text-white">{part}</strong>
        : <span key={i}>{part}</span>
    );

  return (
    <div className={`flex gap-3 transition-all duration-300 ${isUser ? 'flex-row-reverse' : ''} ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
          : 'bg-gradient-to-br from-blue-500 to-violet-600'
      }`}>
        {isUser ? <UserIcon size={13} className="text-white" /> : <BotIcon size={13} className="text-white" />}
      </div>

      <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] text-slate-600 px-1">
          {isUser ? 'You' : 'CivicAI'} · {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.lang === 'hi' && <span className="ml-1 text-violet-500">[हिंदी]</span>}
        </span>

        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
          style={isUser
            ? { background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white' }
            : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }
          }>
          {renderContent(msg.content)}
        </div>

        {/* Complaint ticket badge */}
        {msg.ticketId && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg mt-1 text-xs animate-fade-in-up"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <CheckCircle2Icon size={11} className="text-emerald-400" />
            <span className="text-emerald-300 font-mono font-bold">{msg.ticketId}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{msg.dept}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator({ label = 'CivicAI is processing…' }) {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
        <BotIcon size={13} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
        <span className="text-xs text-slate-600 ml-1">{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUGGESTED PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_PROMPTS = [
  { text: 'Road broken near my house', lang: 'en', icon: '🛣️' },
  { text: 'पानी भर गया है — ground floor flooded', lang: 'hi', icon: '💧' },
  { text: 'Street lights not working for 2 weeks', lang: 'en', icon: '💡' },
  { text: 'कचरा नहीं उठा — 5 दिन हो गए', lang: 'hi', icon: '🗑️' },
  { text: 'Pothole causing accidents near flyover', lang: 'en', icon: '⚠️' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  TICKET ID GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function genTicket(category) {
  const prefix = { Roads:'RD', Water:'WL', Sanitation:'SAN', Electricity:'EL' }[category] || 'CMP';
  return `DL-${prefix}-${String(Math.floor(1000 + Math.random() * 8999))}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const { addComplaint, addNotification } = useCivic();

  const [lang, setLang]     = useState('en');
  const [messages, setMessages] = useState([{
    id: 1, role: 'assistant', ts: Date.now(),
    content: GREET_EN,
  }]);
  const [input, setInput]   = useState('');
  const [liveText, setLiveText] = useState('');     // interim transcript
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStage, setPipelineStage]     = useState(null);
  const [completedStages, setCompletedStages] = useState([]);
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef(null);
  const chatRef        = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);

  // ── Scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isProcessing]);

  // ── Pipeline helpers ─────────────────────────────────────────────────────
  const activateStage = useCallback(async (stage, delayMs = 0) => {
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    setPipelineStage(stage);
  }, []);

  const completeStage = useCallback((stage) => {
    setCompletedStages(prev => prev.includes(stage) ? prev : [...prev, stage]);
  }, []);

  const resetPipeline = useCallback(() => {
    setPipelineStage(null);
    setCompletedStages([]);
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text, lang) => {
    return new Promise(resolve => {
      synthRef.current?.cancel();
      const clean = text.replace(/\*\*/g, '');
      const utt   = new SpeechSynthesisUtterance(clean);
      utt.lang  = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utt.rate  = 0.88;
      utt.pitch = 1.05;
      utt.volume = 1;

      utt.onstart = () => setIsSpeaking(true);
      utt.onend   = () => { setIsSpeaking(false); resolve(); };
      utt.onerror = () => { setIsSpeaking(false); resolve(); };

      synthRef.current?.speak(utt);
    });
  }, []);

  // ── Core AI handler ──────────────────────────────────────────────────────
  const handleTranscript = useCallback(async (text, inputLang) => {
    if (!text.trim()) return;

    // Push user message
    setMessages(prev => [...prev, {
      id: Date.now(), role: 'user', content: text,
      ts: Date.now(), lang: inputLang,
    }]);
    setInput('');
    setLiveText('');
    setIsProcessing(true);
    resetPipeline();

    // ── Stage: Text ──────────────────────────────────────────────────────
    await activateStage('text');
    await new Promise(r => setTimeout(r, 350));
    completeStage('text');

    // ── Stage: AI Processing ─────────────────────────────────────────────
    await activateStage('ai');
    await new Promise(r => setTimeout(r, 600));
    const intent = matchIntent(text);
    completeStage('ai');

    let replyText, ticketId, dept;

    if (!intent || intent.id === 'greet') {
      // Greeting or unknown
      replyText = inputLang === 'hi' ? GREET_HI : GREET_EN;
      setPipelineStage(null);
      setIsProcessing(false);
      setMessages(prev => [...prev, {
        id: Date.now()+1, role: 'assistant', content: replyText, ts: Date.now(),
      }]);
      speak(replyText, inputLang);
      setIsSpeaking(true);
      return;
    }

    // ── Stage: Route ─────────────────────────────────────────────────────
    await activateStage('route');
    await new Promise(r => setTimeout(r, 500));
    completeStage('route');

    // Generate ticket & add to context
    ticketId = genTicket(intent.category);
    dept     = intent.dept;
    replyText = inputLang === 'hi' ? intent.hiResponse : intent.enResponse;

    addComplaint({
      title:       `[Voice] ${text.slice(0, 80)}`,
      description: text,
      category:    intent.category,
      priority:    intent.priority,
      aiSummary:   `Auto-filed via Voice Assistant. Intent: ${intent.id}. Routed to ${dept}.`,
      language:    inputLang === 'hi' ? 'Hindi' : 'English',
    });

    addNotification({ type: 'success', message: `Complaint ${ticketId} auto-filed via Voice AI!` });

    // ── Stage: Synth ─────────────────────────────────────────────────────
    await activateStage('synth');
    completeStage('synth');
    setIsProcessing(false);

    setMessages(prev => [...prev, {
      id: Date.now()+1, role: 'assistant',
      content: replyText, ts: Date.now(),
      ticketId, dept,
    }]);

    await speak(replyText, inputLang);
    resetPipeline();
  }, [activateStage, completeStage, resetPipeline, addComplaint, addNotification, speak]);

  // ── Web Speech API ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicSupported(false); return; }

    recognitionRef.current?.abort();
    const rec = new SR();
    rec.continuous   = false;
    rec.interimResults = true;
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setLiveText('');
      setPipelineStage('mic');
      setCompletedStages([]);
    };

    rec.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveText(final || interim);
      if (final) {
        completeStage('mic');
        handleTranscript(final.trim(), lang);
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        addNotification({ type: 'error', message: `Speech recognition error: ${e.error}` });
      }
      setIsListening(false);
      setLiveText('');
      setPipelineStage(null);
    };

    rec.onend = () => {
      setIsListening(false);
      if (!liveText) setLiveText('');
    };

    recognitionRef.current = rec;
    rec.start();
  }, [lang, completeStage, handleTranscript, addNotification, liveText]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  // ── Switch language ──────────────────────────────────────────────────────
  const switchLang = (l) => {
    stopListening();
    synthRef.current?.cancel();
    setLang(l);
    setLiveText('');
  };

  // ── Text submit ──────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    handleTranscript(input.trim(), lang);
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    stopListening();
    synthRef.current?.cancel();
    setMessages([{ id: Date.now(), role: 'assistant', content: GREET_EN, ts: Date.now() }]);
    setInput('');
    setLiveText('');
    resetPipeline();
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  // Cleanup
  useEffect(() => () => { recognitionRef.current?.abort(); synthRef.current?.cancel(); }, []);

  // ── Mic status colors ────────────────────────────────────────────────────
  const micActive   = isListening;
  const waveColor   = micActive ? '#f43f5e' : isSpeaking ? '#8b5cf6' : '#3b82f6';
  const waveActive  = micActive || isSpeaking;

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="animate-fade-in-up mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
            <h1 className="text-2xl font-bold font-display text-white">Voice Assistant</h1>
          </div>
          <p className="text-sm text-slate-500 ml-4">
            Browser-native Web Speech API · SpeechSynthesis TTS · Multilingual AI routing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex items-center p-1 rounded-xl gap-1"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ code:'en', label:'🇬🇧 EN' }, { code:'hi', label:'🇮🇳 HI' }].map(({ code, label }) => (
              <button key={code} id={`lang-toggle-${code}`}
                onClick={() => switchLang(code)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  lang === code
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
                style={lang === code ? { background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' } : {}}>
                {label}
              </button>
            ))}
          </div>

          <button id="reset-chat-btn" onClick={handleReset}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <RefreshCwIcon size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LEFT COLUMN: Mic + Waveform + Pipeline ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Big Mic Panel */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center gap-5 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            {/* Status label */}
            <div className="text-center">
              <p className={`text-sm font-semibold transition-colors ${
                isListening ? 'text-rose-400' : isSpeaking ? 'text-violet-400' : 'text-slate-400'
              }`}>
                {isListening ? '🔴 Listening…' : isSpeaking ? '🔊 Speaking…' : isProcessing ? '🧠 Processing…' : '🎙️ Ready'}
              </p>
              {lang === 'hi'
                ? <p className="text-xs text-slate-600 mt-0.5">हिंदी भाषा सक्रिय</p>
                : <p className="text-xs text-slate-600 mt-0.5">English language active</p>
              }
            </div>

            {/* Mic button */}
            <div className="relative">
              {/* Pulse rings */}
              {(isListening) && (
                <>
                  <div className="absolute inset-0 rounded-full animate-ping"
                    style={{ border: '2px solid rgba(244,63,94,0.5)', animationDuration: '1s', scale: '1.3' }} />
                  <div className="absolute inset-0 rounded-full animate-ping"
                    style={{ border: '2px solid rgba(244,63,94,0.3)', animationDuration: '1.5s', scale: '1.6', animationDelay: '0.3s' }} />
                </>
              )}
              {isSpeaking && (
                <div className="absolute inset-0 rounded-full animate-ping"
                  style={{ border: '2px solid rgba(139,92,246,0.5)', animationDuration: '1.2s', scale: '1.4' }} />
              )}

              <button
                id="main-mic-btn"
                onClick={toggleMic}
                disabled={isProcessing}
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50"
                style={{
                  background: isListening
                    ? 'linear-gradient(135deg, #f43f5e, #dc2626)'
                    : isSpeaking
                    ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                    : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: isListening
                    ? '0 0 32px rgba(244,63,94,0.5)'
                    : isSpeaking
                    ? '0 0 32px rgba(139,92,246,0.5)'
                    : '0 0 20px rgba(59,130,246,0.3)',
                  transform: isListening ? 'scale(1.05)' : 'scale(1)',
                }}>
                {isListening
                  ? <MicOffIcon size={32} className="text-white" />
                  : <MicIcon size={32} className="text-white" />
                }
              </button>
            </div>

            {/* Waveform */}
            <div className="w-full rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <WaveformCanvas active={waveActive} color={waveColor} bars={28} />
            </div>

            {/* Live transcript */}
            <div className="w-full min-h-12 text-center">
              {liveText ? (
                <p className="text-sm text-slate-200 leading-relaxed italic animate-fade-in-up">
                  "{liveText}"
                </p>
              ) : (
                <p className="text-xs text-slate-700">
                  {isListening
                    ? (lang === 'hi' ? 'सुन रहे हैं…' : 'Speak now…')
                    : (lang === 'hi' ? 'माइक बटन दबाएं' : 'Press the mic to speak')
                  }
                </p>
              )}
            </div>

            {/* Not supported warning */}
            {!micSupported && (
              <div className="w-full text-center p-3 rounded-xl text-xs text-amber-400"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                ⚠️ Web Speech API not supported in this browser. Use Chrome for full voice features.
              </div>
            )}
          </div>

          {/* Pipeline Visualizer */}
          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <PipelineVisualizer
              activeStage={pipelineStage}
              completedStages={completedStages}
            />
          </div>

          {/* Demo prompts */}
          <div className="glass rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
              Try These Demo Phrases
            </p>
            <div className="space-y-2">
              {DEMO_PROMPTS.map(({ text, lang: pLang, icon }) => (
                <button key={text}
                  onClick={() => { setInput(text); switchLang(pLang); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all card-hover flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>{icon}</span>
                  <span className="flex-1 truncate">{text}</span>
                  <ArrowRightIcon size={10} className="text-slate-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Chat ── */}
        <div className="lg:col-span-3 flex flex-col animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          {/* AI status bar */}
          <div className="glass rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
              <BotIcon size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">CivicAI Voice Engine</p>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Web Speech API · SpeechSynthesis TTS · EN + HI intent engine
              </p>
            </div>
            {isSpeaking && (
              <div className="flex items-center gap-1 text-xs text-violet-400">
                <Volume2Icon size={13} className="animate-pulse" />
                <span>Speaking</span>
              </div>
            )}
          </div>

          {/* Chat messages */}
          <div ref={chatRef}
            className="glass rounded-2xl flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            style={{ minHeight: '340px', maxHeight: '460px' }}>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {isProcessing && <TypingIndicator label="Analyzing intent…" />}
          </div>

          {/* Text input bar */}
          <div className="mt-3 shrink-0">
            <div className="flex gap-2 glass rounded-2xl p-2">
              {/* Inline mic */}
              <button
                id="inline-mic-btn"
                onClick={toggleMic}
                disabled={isProcessing}
                title={isListening ? 'Stop' : 'Start voice input'}
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-50 ${
                  isListening
                    ? 'bg-rose-500/80 text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/10'
                }`}>
                {isListening ? <MicOffIcon size={17} /> : <MicIcon size={17} />}
              </button>

              {/* Text input */}
              <textarea
                id="voice-text-input"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={lang === 'hi' ? 'यहाँ लिखें या माइक दबाएं…' : 'Type a complaint or press mic…'}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none resize-none pt-2.5 px-1"
                disabled={isListening || isProcessing}
              />

              {/* Send */}
              <button
                id="voice-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isProcessing || isListening}
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                style={{ background: input.trim() && !isProcessing ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)' }}>
                <SendIcon size={15} className="text-white" />
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-700 mt-2 flex items-center justify-center gap-1">
              <SparklesIcon size={10} />
              Browser-native APIs only · No third-party SDKs · Works offline
              {!micSupported && <span className="text-amber-600 ml-2">· Mic unavailable — use text</span>}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
