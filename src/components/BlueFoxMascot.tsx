import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronRight, 
  Play, 
  Pause,
  Moon,
  Flame,
  Hand,
  Gift,
  Smile,
  X
} from 'lucide-react';

export type FoxExpression = 'running' | 'sleeping' | 'hi' | 'welcome' | 'jumping' | 'howling';

interface ExpressionConfig {
  id: FoxExpression;
  label: string;
  nepaliLabel: string;
  speech: string;
  nepaliSpeech: string;
  icon: string;
  badgeColor: string;
}

const EXPRESSIONS: ExpressionConfig[] = [
  {
    id: 'running',
    label: 'Running',
    nepaliLabel: 'दौडिँदै',
    speech: 'Running fast to fetch Momo! 🏃💨',
    nepaliSpeech: 'खाजा लिन दौडिँदै छु!',
    icon: '🏃',
    badgeColor: 'bg-amber-500 text-slate-950',
  },
  {
    id: 'sleeping',
    label: 'Sleeping',
    nepaliLabel: 'सुत्दै',
    speech: 'Zzz... Khata is safe & sound! 💤',
    nepaliSpeech: 'खाता सुरक्षित छ, आनन्दले सुत्दै छु!',
    icon: '😴',
    badgeColor: 'bg-indigo-500 text-white',
  },
  {
    id: 'hi',
    label: 'Hi! Wave',
    nepaliLabel: 'नमस्ते',
    speech: 'Namaste! Hi there friend! 👋',
    nepaliSpeech: 'नमस्ते साथी! कस्तो छ?',
    icon: '👋',
    badgeColor: 'bg-emerald-500 text-slate-950',
  },
  {
    id: 'welcome',
    label: 'Welcome',
    nepaliLabel: 'स्वागतम्',
    speech: 'Welcome to Blue Fox Khaja Khata! 🎉',
    nepaliSpeech: 'ब्लु फक्स खाजा खातामा स्वागत छ!',
    icon: '🦊',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'jumping',
    label: 'Jumping Joy',
    nepaliLabel: 'उफ्रिँदै',
    speech: 'Hooray! Khata balanced! 🐾⭐',
    nepaliSpeech: 'हुर्रे! खाता हिसाब मिल्यो!',
    icon: '⭐',
    badgeColor: 'bg-purple-600 text-white',
  },
  {
    id: 'howling',
    label: 'Wolf Howl',
    nepaliLabel: 'हुइँया (हाउल)',
    speech: 'Awooooooo! Blue Fox Howl! 🐺🎶',
    nepaliSpeech: 'आऊऊऊऊऊ! जङ्गली ब्वाँसोको आवाज!',
    icon: '🐺',
    badgeColor: 'bg-cyan-500 text-slate-950',
  },
];

// Synthesize a realistic cute wolf / fox howl using Web Audio API
function playWolfHowlAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Primary wolf howl oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(3.5, now);

    // Wolf howl pitch curve: rises gradually, holds melodically, then trails down
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.7);
    osc.frequency.exponentialRampToValueAtTime(590, now + 1.4);
    osc.frequency.exponentialRampToValueAtTime(360, now + 2.6);
    osc.frequency.exponentialRampToValueAtTime(220, now + 3.4);

    // Subtle vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5.2, now);
    lfoGain.gain.setValueAtTime(14, now);
    lfo.connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + 3.4);

    // Amplitude envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.6);
    gain.gain.linearRampToValueAtTime(0.22, now + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 3.4);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

export const BlueFoxMascot: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [bubbleOpen, setBubbleOpen] = useState<boolean>(true);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const autoTimerRef = useRef<any>(null);

  const currentExpr = EXPRESSIONS[currentIndex];

  // Expression changes on every 5 seconds
  useEffect(() => {
    if (!isAutoCycling) return;

    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % EXPRESSIONS.length;
        // If next expression is howling and sound is enabled, trigger audio
        if (EXPRESSIONS[next].id === 'howling' && soundEnabled) {
          playWolfHowlAudio();
        }
        return next;
      });
    }, 5000); // exactly 5 seconds

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [isAutoCycling, soundEnabled]);

  // Handle manual selection
  const handleSelectExpression = (idx: number) => {
    setCurrentIndex(idx);
    if (EXPRESSIONS[idx].id === 'howling' && soundEnabled) {
      playWolfHowlAudio();
    }
  };

  const handleMascotClick = () => {
    // Cycle to next expression on direct mascot click
    const next = (currentIndex + 1) % EXPRESSIONS.length;
    setCurrentIndex(next);
    if (EXPRESSIONS[next].id === 'howling' && soundEnabled) {
      playWolfHowlAudio();
    }
    setBubbleOpen(true);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState && currentExpr.id === 'howling') {
      playWolfHowlAudio();
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 select-none group font-sans print:hidden" id="bluefox-3d-mascot-container">
      
      {/* Dynamic Speech Bubble */}
      {bubbleOpen && (
        <div className="absolute -top-20 left-0 sm:left-2 w-56 sm:w-64 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-blue-500/40 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{currentExpr.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${currentExpr.badgeColor}`}>
                {currentExpr.label} • {currentExpr.nepaliLabel}
              </span>
            </div>
            <button 
              onClick={() => setBubbleOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              title="Close speech bubble"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-bold text-blue-100 mt-1.5 leading-snug">
            {currentExpr.speech}
          </p>
          <p className="text-[11px] text-amber-300 font-medium mt-0.5">
            {currentExpr.nepaliSpeech}
          </p>

          {/* Speech bubble pointer notch */}
          <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900/95" />
        </div>
      )}

      {/* Main 3D Mascot Button */}
      <div className="relative flex items-end gap-2">
        <button
          onClick={handleMascotClick}
          className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-blue-900/80 via-blue-950/90 to-slate-950/95 border-2 border-blue-400/50 shadow-2xl backdrop-blur-md p-1.5 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 hover:border-cyan-400 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)]"
          title="Blue Fox 3D Mascot • Click to change mood or trigger animation!"
          id="btn-bluefox-mascot"
        >
          {/* Ambient 3D Rim Glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-indigo-500/20 pointer-events-none" />

          {/* 3D Animated Fox Character SVG */}
          <div className={`relative w-full h-full flex items-center justify-center fox-animation-wrapper expression-${currentExpr.id}`}>
            <svg 
              viewBox="0 0 160 160" 
              className={`w-full h-full drop-shadow-[0_8px_16px_rgba(2,132,199,0.5)] transition-transform duration-500 ${
                currentExpr.id === 'jumping' ? 'animate-bounce' : ''
              } ${
                currentExpr.id === 'running' ? 'animate-pulse' : ''
              }`}
            >
              <defs>
                {/* 3D Gradients for Fox Coat */}
                <linearGradient id="foxBlue3d" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="45%" stopColor="#0284c7" />
                  <stop offset="85%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>

                <linearGradient id="foxWhiteFur" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                <radialGradient id="foxCheekGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="foxEyeGloss" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
              </defs>

              {/* Bushy Fox Tail with 3D curve and white tip */}
              <g className={`transition-all duration-500 origin-[105px_100px] ${
                currentExpr.id === 'running' ? 'rotate-[-20deg] scale-110' :
                currentExpr.id === 'sleeping' ? 'rotate-[35deg] translate-x-[-12px]' :
                currentExpr.id === 'howling' ? 'rotate-[-10deg]' :
                'rotate-0'
              }`}>
                {/* Tail Base */}
                <path
                  d="M105,95 C135,80 155,105 145,130 C138,145 110,140 95,115 Z"
                  fill="url(#foxBlue3d)"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                {/* Tail White Tip */}
                <path
                  d="M138,118 C148,124 144,136 136,134 C128,132 125,124 138,118 Z"
                  fill="url(#foxWhiteFur)"
                />
              </g>

              {/* Fox Body */}
              <ellipse 
                cx="80" 
                cy="102" 
                rx="34" 
                ry="30" 
                fill="url(#foxBlue3d)" 
                stroke="#0369a1" 
                strokeWidth="1.5"
              />

              {/* White Chest & Belly Fur */}
              <path
                d="M62,94 C68,118 92,118 98,94 C92,90 68,90 62,94 Z"
                fill="url(#foxWhiteFur)"
              />

              {/* Ears */}
              {/* Left Ear */}
              <g className={`transition-transform duration-300 origin-[52px_45px] ${
                currentExpr.id === 'sleeping' ? 'rotate-[-25deg]' :
                currentExpr.id === 'howling' ? 'rotate-[-15deg]' :
                'rotate-0'
              }`}>
                <polygon 
                  points="42,55 58,15 72,48" 
                  fill="url(#foxBlue3d)" 
                  stroke="#0284c7" 
                  strokeWidth="1.5" 
                />
                {/* Inner Left Ear Pink */}
                <polygon 
                  points="48,50 58,24 66,45" 
                  fill="#f472b6" 
                  opacity="0.85" 
                />
              </g>

              {/* Right Ear */}
              <g className={`transition-transform duration-300 origin-[108px_45px] ${
                currentExpr.id === 'sleeping' ? 'rotate-[25deg]' :
                currentExpr.id === 'howling' ? 'rotate-[15deg]' :
                'rotate-0'
              }`}>
                <polygon 
                  points="118,55 102,15 88,48" 
                  fill="url(#foxBlue3d)" 
                  stroke="#0284c7" 
                  strokeWidth="1.5" 
                />
                {/* Inner Right Ear Pink */}
                <polygon 
                  points="112,50 102,24 94,45" 
                  fill="#f472b6" 
                  opacity="0.85" 
                />
              </g>

              {/* Head */}
              <g className={`transition-transform duration-500 origin-[80px_65px] ${
                currentExpr.id === 'howling' ? 'rotate-[-28deg] translate-y-[-6px]' :
                currentExpr.id === 'sleeping' ? 'rotate-[8deg] translate-y-[6px]' :
                currentExpr.id === 'welcome' ? 'rotate-[6deg]' :
                'rotate-0'
              }`}>
                {/* Main Head Shape with Cheek Fluffs */}
                <path
                  d="M44,65 C40,55 55,42 80,42 C105,42 120,55 116,65 C124,75 115,88 100,85 C95,95 85,98 80,98 C75,98 65,95 60,85 C45,88 36,75 44,65 Z"
                  fill="url(#foxBlue3d)"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />

                {/* White Muzzle & Cheeks */}
                <path
                  d="M54,72 C62,65 72,66 80,68 C88,66 98,65 106,72 C108,82 95,94 80,94 C65,94 52,82 54,72 Z"
                  fill="url(#foxWhiteFur)"
                />

                {/* Cheerful Blush Cheeks */}
                <circle cx="58" cy="74" r="7" fill="url(#foxCheekGlow)" />
                <circle cx="102" cy="74" r="7" fill="url(#foxCheekGlow)" />

                {/* EYES according to Expression */}
                {currentExpr.id === 'sleeping' ? (
                  // Sleeping peaceful curved closed eyes
                  <g stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none">
                    <path d="M62,62 Q68,69 74,62" />
                    <path d="M86,62 Q92,69 98,62" />
                  </g>
                ) : currentExpr.id === 'howling' ? (
                  // Howling eyes closed tight with passion
                  <g stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none">
                    <path d="M62,60 L72,64" />
                    <path d="M98,60 L88,64" />
                  </g>
                ) : currentExpr.id === 'jumping' || currentExpr.id === 'welcome' ? (
                  // Joyful smiling anime eyes (^_^)
                  <g stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none">
                    <path d="M60,65 Q68,54 74,65" />
                    <path d="M86,65 Q92,54 100,65" />
                  </g>
                ) : (
                  // Bright sparkling alert 3D eyes
                  <g>
                    <ellipse cx="67" cy="62" rx="6" ry="7" fill="url(#foxEyeGloss)" />
                    <circle cx="65" cy="59" r="2.2" fill="#ffffff" />
                    <circle cx="69" cy="64" r="1.1" fill="#ffffff" />

                    <ellipse cx="93" cy="62" rx="6" ry="7" fill="url(#foxEyeGloss)" />
                    <circle cx="91" cy="59" r="2.2" fill="#ffffff" />
                    <circle cx="95" cy="64" r="1.1" fill="#ffffff" />
                  </g>
                )}

                {/* Cute Black Snout / Nose */}
                <ellipse cx="80" cy="76" rx="4.5" ry="3.2" fill="#0f172a" />
                <ellipse cx="79" cy="75" rx="1.5" ry="1" fill="#ffffff" opacity="0.8" />

                {/* Mouth according to Expression */}
                {currentExpr.id === 'howling' ? (
                  // Open Howling O-shape mouth
                  <ellipse cx="80" cy="86" rx="5" ry="7.5" fill="#0f172a" stroke="#e11d48" strokeWidth="1.5" />
                ) : currentExpr.id === 'sleeping' ? (
                  // Gentle tiny smile
                  <path d="M77,81 Q80,83 83,81" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                ) : (
                  // Happy cat/fox mouth :3
                  <path d="M74,80 Q77,84 80,81 Q83,84 86,80" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
              </g>

              {/* PAWS & ARMS */}
              {currentExpr.id === 'hi' ? (
                // Waving front paw
                <g className="animate-spin origin-[102px_98px]" style={{ animationDuration: '0.8s', animationDirection: 'alternate', animationIterationCount: 'infinite' }}>
                  <path d="M100,98 C108,82 120,78 126,86 C126,94 114,106 102,106 Z" fill="url(#foxWhiteFur)" stroke="#0284c7" strokeWidth="1.5" />
                  {/* Little paw pads */}
                  <circle cx="120" cy="85" r="2" fill="#f43f5e" />
                </g>
              ) : currentExpr.id === 'running' ? (
                // Paws in running stride
                <g>
                  <ellipse cx="56" cy="128" rx="8" ry="5" fill="url(#foxWhiteFur)" />
                  <ellipse cx="104" cy="128" rx="8" ry="5" fill="url(#foxWhiteFur)" />
                </g>
              ) : (
                // Normal cute sitting paws
                <g>
                  <ellipse cx="68" cy="126" rx="8" ry="6" fill="url(#foxWhiteFur)" stroke="#cbd5e1" strokeWidth="1" />
                  <ellipse cx="92" cy="126" rx="8" ry="6" fill="url(#foxWhiteFur)" stroke="#cbd5e1" strokeWidth="1" />
                </g>
              )}

              {/* Special Floating Expression Particles */}
              {currentExpr.id === 'sleeping' && (
                <g className="animate-pulse" fill="#93c5fd" fontWeight="bold" fontSize="14" fontFamily="sans-serif">
                  <text x="105" y="45">Z</text>
                  <text x="120" y="32" fontSize="18">Z</text>
                  <text x="138" y="18" fontSize="22">z</text>
                </g>
              )}

              {currentExpr.id === 'howling' && (
                <g stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.8">
                  <path d="M42,32 A28,28 0 0,0 24,65" className="animate-ping" />
                  <path d="M34,22 A42,42 0 0,0 12,65" />
                </g>
              )}

              {currentExpr.id === 'running' && (
                <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
                  <line x1="20" y1="110" x2="38" y2="110" />
                  <line x1="12" y1="120" x2="32" y2="120" />
                  <line x1="24" y1="130" x2="42" y2="130" />
                </g>
              )}
            </svg>
          </div>

          {/* Active 5-second pulse badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 text-[9px] text-slate-950 font-black items-center justify-center">
              5s
            </span>
          </span>
        </button>

        {/* Small Control Actions Strip */}
        <div className="flex flex-col gap-1.5 pb-1">
          {/* Sound Toggle (for wolf howl) */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-xl border transition-all text-xs flex items-center justify-center shadow-lg ${
              soundEnabled 
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold' 
                : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={soundEnabled ? 'Howl sound is ON (Tap to mute)' : 'Howl sound is OFF (Tap to enable sound)'}
            id="btn-fox-sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Panel Drawer Toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-blue-300 border border-slate-700 shadow-lg text-xs flex items-center justify-center transition-colors"
            title="Choose Fox Expressions / Settings"
            id="btn-fox-panel-toggle"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Expression Selection Drawer / Quick Menu */}
      {panelOpen && (
        <div className="absolute bottom-24 left-0 w-64 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl border border-blue-500/40 animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🦊</span>
              <span className="text-xs font-bold text-blue-200">Blue Fox Moods (हर ५ सेकेन्ड)</span>
            </div>
            <button 
              onClick={() => setPanelOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {EXPRESSIONS.map((expr, idx) => (
              <button
                key={expr.id}
                onClick={() => {
                  handleSelectExpression(idx);
                  setPanelOpen(false);
                  setBubbleOpen(true);
                }}
                className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                  currentIndex === idx 
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md' 
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/80 text-xs'
                }`}
              >
                <span className="text-base shrink-0">{expr.icon}</span>
                <div className="truncate">
                  <p className="text-[11px] font-bold truncate leading-tight">{expr.label}</p>
                  <p className="text-[9px] text-blue-300 truncate">{expr.nepaliLabel}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => setIsAutoCycling(!isAutoCycling)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {isAutoCycling ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isAutoCycling ? 'Pause 5s Cycle' : 'Resume 5s Cycle'}</span>
            </button>

            <button
              onClick={toggleSound}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 text-cyan-400" /> : <VolumeX className="w-3 h-3" />}
              <span>{soundEnabled ? 'Howl Audio: ON' : 'Audio: OFF'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
