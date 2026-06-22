/* ═══════════════════════════════════════════════════════════════════════════
   QR ARCHITECT AI — Single-file React application
   ───────────────────────────────────────────────────────────────────────────
   Architecture (top → bottom):
     1. CONSTANTS        — formatters, validators, themes, presets, tabs
     2. PURE HELPERS     — hash, url state, theme scoring
     3. CUSTOM HOOKS     — useScriptLoader, useQR, useToasts, useHotkeys, useLocal
     4. ATOMIC UI        — Pill, Field, IconButton, Segmented, ColorInput, …
     5. FEATURE SECTIONS — Hero, AIEngine, TabBar, Editor, Designer, Preview
     6. APP              — composition only
   ═══════════════════════════════════════════════════════════════════════════ */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
  createContext, useContext, memo
} from 'react';
import {
  Link, Type, UserSquare2, Mail, Wifi, Palette, Download, Globe,
  Briefcase, MapPin, Phone, ImagePlus, Zap, Calendar, Bitcoin, Share2,
  Layers, Sparkles, Trash2, Sun, Moon, Copy, Check, AlertCircle, Loader2,
  ScanLine, Smartphone, Building2, ShieldCheck, History, Clock, X,
  FileImage, Command, RotateCcw, Keyboard, ChevronDown, Frame
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   1. CONSTANTS
   ───────────────────────────────────────────────────────────────────────── */

const CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js';

const FORMATTERS = {
  url: (d) => d.url || 'https://example.com',
  text: (d) => d.text || 'Enter text to generate a QR code.',
  email: (d) =>
    `mailto:${d.email || ''}?subject=${encodeURIComponent(d.subject || '')}&body=${encodeURIComponent(d.body || '')}`,
  wifi: (d) =>
    `WIFI:T:${d.encryption || 'WPA'};S:${d.ssid || ''};P:${d.password || ''};H:${d.hidden ? 'true' : 'false'};;`,
  vcard: (d) => [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${d.lastName || ''};${d.firstName || ''};;;`,
    `FN:${((d.firstName || '') + ' ' + (d.lastName || '')).trim()}`,
    d.company && `ORG:${d.company}`,
    d.jobTitle && `TITLE:${d.jobTitle}`,
    d.workPhone && `TEL;TYPE=work,voice:${d.workPhone}`,
    d.cellPhone && `TEL;TYPE=cell,voice:${d.cellPhone}`,
    d.email && `EMAIL;TYPE=work,internet:${d.email}`,
    d.website && `URL:${d.website}`,
    (d.street || d.city || d.state || d.zip || d.country) &&
      `ADR;TYPE=work:;;${d.street || ''};${d.city || ''};${d.state || ''};${d.zip || ''};${d.country || ''}`,
    'END:VCARD'
  ].filter(Boolean).join('\n'),
  appstore: (d) => {
    const ios = (d.iosUrl || '').trim();
    const android = (d.androidUrl || '').trim();
    if (ios && android) {
      const html = `<!doctype html><meta name=viewport content="width=device-width"><script>
var u=navigator.userAgent;
if(/android/i.test(u))location.replace(${JSON.stringify(android)});
else if(/iphone|ipad|ipod/i.test(u))location.replace(${JSON.stringify(ios)});
else document.write('<h3>Open on mobile</h3><p><a href=${JSON.stringify(ios)}>iOS</a> · <a href=${JSON.stringify(android)}>Android</a></p>');
</script>`;
      return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    }
    return ios || android || 'https://apps.apple.com';
  },
  crypto: (d) => {
    const addr = (d.address || '').trim();
    const amt = (d.amount || '').trim();
    if (!addr) return '';
    if (d.coin === 'ethereum') return `ethereum:${addr}${amt ? `?value=${amt}` : ''}`;
    return `${d.coin}:${addr}${amt ? `?amount=${amt}` : ''}`;
  },
  event: (d) => [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `SUMMARY:${d.summary || 'New Event'}`,
    d.location && `LOCATION:${d.location}`,
    d.description && `DESCRIPTION:${d.description}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].filter(Boolean).join('\n'),
};

const RE = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  btc: /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  ltc: /^(ltc1[a-z0-9]{25,62}|[LM3][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
};

const validate = {
  url: (d) => {
    if (!d.url) return { state: 'idle', message: 'Enter a URL' };
    try {
      const u = new URL(d.url);
      if (!['http:', 'https:'].includes(u.protocol))
        return { state: 'invalid', message: 'URL must use http:// or https://' };
      return { state: 'valid', message: 'Valid URL' };
    } catch { return { state: 'invalid', message: 'Invalid URL format' }; }
  },
  email: (d) => !d.email
    ? { state: 'idle', message: 'Enter an email' }
    : RE.email.test(d.email)
      ? { state: 'valid', message: 'Valid email address' }
      : { state: 'invalid', message: 'Malformed email address' },
  wifi: (d) => !d.ssid
    ? { state: 'idle', message: 'Enter a network name' }
    : { state: 'valid', message: 'Network ready' },
  vcard: (d) => {
    if (!d.firstName && !d.lastName) return { state: 'idle', message: 'Add a name' };
    if (d.email && !RE.email.test(d.email))
      return { state: 'invalid', message: 'Email address is malformed' };
    return { state: 'valid', message: 'Contact card ready' };
  },
  crypto: (d) => {
    if (!d.address) return { state: 'idle', message: 'Enter a wallet address' };
    const re = d.coin === 'ethereum' ? RE.eth : d.coin === 'litecoin' ? RE.ltc : RE.btc;
    return re.test(d.address)
      ? { state: 'valid', message: `Valid ${d.coin} address` }
      : { state: 'invalid', message: `Not a recognised ${d.coin} address` };
  },
  appstore: (d) => {
    const ios = d.iosUrl?.trim(), android = d.androidUrl?.trim();
    if (!ios && !android) return { state: 'idle', message: 'Add at least one store link' };
    for (const link of [ios, android].filter(Boolean)) {
      try { new URL(link); } catch { return { state: 'invalid', message: 'Invalid store URL' }; }
    }
    return {
      state: 'valid',
      message: ios && android ? 'Smart redirect enabled (iOS + Android)' : 'Single-platform link'
    };
  },
  event: (d) => d.summary
    ? { state: 'valid', message: 'Event ready' }
    : { state: 'idle', message: 'Add an event title' },
  text: (d) => d.text
    ? { state: 'valid', message: `${d.text.length} characters` }
    : { state: 'idle', message: 'Enter a message' },
};

const PRESETS = [
  { name: 'Midnight',  dots: '#818cf8', dots2: '#f472b6', corners: '#818cf8', bg: '#0b0f1e', type: 'dots' },
  { name: 'Corporate', dots: '#1e3a8a', dots2: '#1e3a8a', corners: '#1e3a8a', bg: '#ffffff', type: 'square' },
  { name: 'Botanical', dots: '#065f46', dots2: '#84cc16', corners: '#065f46', bg: '#f0fdf4', type: 'classy-rounded' },
  { name: 'Solaris',   dots: '#c2410c', dots2: '#f59e0b', corners: '#c2410c', bg: '#fff7ed', type: 'extra-rounded' },
  { name: 'Obsidian',  dots: '#0a0a0a', dots2: '#0a0a0a', corners: '#0a0a0a', bg: '#ffffff', type: 'square' },
  { name: 'Bubblegum', dots: '#f472b6', dots2: '#a78bfa', corners: '#f472b6', bg: '#fdf4ff', type: 'rounded' },
];

const AI_THEMES = {
  neon: {
    keywords: ['neon', 'cyberpunk', 'cyber', 'synthwave', 'retrowave', 'electric', 'vaporwave', 'miami', 'arcade', 'matrix'],
    patch: { dotsColor: '#22d3ee', dotsColor2: '#ec4899', isGradient: true, gradientType: 'linear', dotsType: 'dots',
      cornersSquareColor: '#a855f7', cornersSquareType: 'extra-rounded', cornersDotColor: '#22d3ee', cornersDotType: 'dot',
      backgroundColor: '#0b0f1e' }
  },
  corporate: {
    keywords: ['corporate', 'business', 'professional', 'enterprise', 'finance', 'banking', 'executive', 'law', 'office'],
    patch: { dotsColor: '#1e3a8a', dotsColor2: '#1e3a8a', isGradient: false, gradientType: 'linear', dotsType: 'square',
      cornersSquareColor: '#1e3a8a', cornersSquareType: 'square', cornersDotColor: '#1e3a8a', cornersDotType: 'square',
      backgroundColor: '#ffffff' }
  },
  nature: {
    keywords: ['nature', 'forest', 'organic', 'botanical', 'eco', 'leaf', 'green', 'plant', 'earth', 'woodland', 'moss'],
    patch: { dotsColor: '#065f46', dotsColor2: '#84cc16', isGradient: true, gradientType: 'linear', dotsType: 'rounded',
      cornersSquareColor: '#065f46', cornersSquareType: 'extra-rounded', cornersDotColor: '#065f46', cornersDotType: 'dot',
      backgroundColor: '#f7fee7' }
  },
  ocean: {
    keywords: ['ocean', 'sea', 'water', 'aqua', 'marine', 'wave', 'nautical', 'coast', 'deep', 'blue'],
    patch: { dotsColor: '#0369a1', dotsColor2: '#06b6d4', isGradient: true, gradientType: 'radial', dotsType: 'classy-rounded',
      cornersSquareColor: '#0369a1', cornersSquareType: 'extra-rounded', cornersDotColor: '#0ea5e9', cornersDotType: 'dot',
      backgroundColor: '#ecfeff' }
  },
  sunset: {
    keywords: ['sunset', 'sunrise', 'warm', 'golden', 'dawn', 'dusk', 'fire', 'amber', 'coral', 'orange'],
    patch: { dotsColor: '#c2410c', dotsColor2: '#db2777', isGradient: true, gradientType: 'linear', dotsType: 'classy',
      cornersSquareColor: '#c2410c', cornersSquareType: 'extra-rounded', cornersDotColor: '#be185d', cornersDotType: 'dot',
      backgroundColor: '#fff7ed' }
  },
  luxury: {
    keywords: ['luxury', 'gold', 'premium', 'royal', 'refined', 'elegant', 'boutique', 'couture', 'marble'],
    patch: { dotsColor: '#713f12', dotsColor2: '#eab308', isGradient: true, gradientType: 'linear', dotsType: 'classy-rounded',
      cornersSquareColor: '#713f12', cornersSquareType: 'extra-rounded', cornersDotColor: '#713f12', cornersDotType: 'dot',
      backgroundColor: '#fefce8' }
  },
  mono: {
    keywords: ['mono', 'monochrome', 'minimal', 'minimalism', 'brutal', 'brutalist', 'print', 'newspaper', 'swiss'],
    patch: { dotsColor: '#0a0a0a', dotsColor2: '#0a0a0a', isGradient: false, gradientType: 'linear', dotsType: 'square',
      cornersSquareColor: '#0a0a0a', cornersSquareType: 'square', cornersDotColor: '#0a0a0a', cornersDotType: 'square',
      backgroundColor: '#ffffff' }
  },
  pastel: {
    keywords: ['pastel', 'soft', 'candy', 'cute', 'dreamy', 'kawaii', 'bubblegum', 'cotton', 'baby'],
    patch: { dotsColor: '#f472b6', dotsColor2: '#a78bfa', isGradient: true, gradientType: 'linear', dotsType: 'rounded',
      cornersSquareColor: '#f472b6', cornersSquareType: 'extra-rounded', cornersDotColor: '#a78bfa', cornersDotType: 'dot',
      backgroundColor: '#fdf4ff' }
  },
};

const FRAMES = [
  { id: 'none',    label: 'None' },
  { id: 'scan',    label: 'SCAN ME' },
  { id: 'visit',   label: 'VISIT SITE' },
  { id: 'menu',    label: 'OUR MENU' },
  { id: 'follow',  label: 'FOLLOW US' },
  { id: 'connect', label: 'CONNECT' },
];

const TABS = [
  { id: 'url',      label: 'Link',    icon: Link },
  { id: 'vcard',    label: 'Contact', icon: UserSquare2 },
  { id: 'appstore', label: 'App',     icon: Smartphone },
  { id: 'email',    label: 'Email',   icon: Mail },
  { id: 'wifi',     label: 'Wi-Fi',   icon: Wifi },
  { id: 'crypto',   label: 'Crypto',  icon: Bitcoin },
  { id: 'event',    label: 'Event',   icon: Calendar },
  { id: 'text',     label: 'Text',    icon: Type },
];

const DEFAULT_INPUTS = {
  url: 'https://qr-architect.ai',
  text: '',
  email: '', subject: '', body: '',
  ssid: '', password: '', encryption: 'WPA', hidden: false,
  firstName: '', lastName: '', company: '', jobTitle: '',
  workPhone: '', cellPhone: '', website: '',
  street: '', city: '', state: '', zip: '', country: '',
  iosUrl: '', androidUrl: '',
  coin: 'bitcoin', address: '', amount: '',
  summary: '', location: '', description: '',
};

const DEFAULT_DESIGN = {
  dotsColor: '#6366f1', dotsColor2: '#ec4899',
  isGradient: true, gradientType: 'linear', dotsType: 'rounded',
  cornersSquareColor: '#6366f1', cornersSquareType: 'extra-rounded',
  cornersDotColor: '#ec4899', cornersDotType: 'dot',
  backgroundColor: '#ffffff',
  margin: 12, size: 300,
  logoUrl: '', aiPrompt: '', frame: 'none',
};

/* ─────────────────────────────────────────────────────────────────────────
   2. PURE HELPERS
   ───────────────────────────────────────────────────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 10);

const scoreAITheme = (prompt) => {
  const p = prompt.toLowerCase();
  const ranked = Object.entries(AI_THEMES)
    .map(([key, theme]) => ({
      key,
      score: theme.keywords.reduce((a, kw) => a + (p.includes(kw) ? 1 : 0), 0),
      patch: theme.patch,
    }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (top.score === 0) return null;
  const total = ranked.reduce((a, r) => a + r.score, 0);
  return { key: top.key, patch: top.patch, confidence: Math.min(1, top.score / Math.max(total, 1) + 0.2) };
};

const encodeState = (state) => {
  try { return btoa(encodeURIComponent(JSON.stringify(state))); } catch { return ''; }
};
const decodeState = (hash) => {
  try { return JSON.parse(decodeURIComponent(atob(hash))); } catch { return null; }
};

/* ─────────────────────────────────────────────────────────────────────────
   3. CUSTOM HOOKS
   ───────────────────────────────────────────────────────────────────────── */

function useScriptLoader(src, globalName) {
  const [state, setState] = useState(() =>
    (typeof window !== 'undefined' && window[globalName]) ? 'ready' : 'loading'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window[globalName]) { setState('ready'); return; }

    const onLoad = () => setState('ready');
    const onError = () => setState('error');
    const selector = `script[data-src="${src}"]`;
    let script = document.querySelector(selector);

    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.src = src;
      document.body.appendChild(script);
    }
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, [src, globalName]);

  return state;
}

function useLocal(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function useQR({ scriptReady, data, design }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [ready, setReady] = useState(false);

  const options = useMemo(() => ({
    width: design.size, height: design.size,
    data: data || ' ',
    margin: design.margin,
    image: design.logoUrl || undefined,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.38, margin: 8 },
    dotsOptions: {
      type: design.dotsType,
      ...(design.isGradient
        ? { gradient: { type: design.gradientType, colorStops: [
            { offset: 0, color: design.dotsColor },
            { offset: 1, color: design.dotsColor2 }
          ] } }
        : { color: design.dotsColor }),
    },
    backgroundOptions: { color: design.backgroundColor },
    cornersSquareOptions: { type: design.cornersSquareType, color: design.cornersSquareColor },
    cornersDotOptions: { type: design.cornersDotType, color: design.cornersDotColor },
  }), [data, design]);

  useEffect(() => {
    if (!scriptReady || !window.QRCodeStyling || !containerRef.current) return;
    try {
      if (!instanceRef.current) {
        instanceRef.current = new window.QRCodeStyling(options);
        instanceRef.current.append(containerRef.current);
      } else {
        instanceRef.current.update(options);
      }
      setReady(true);
    } catch (e) {
      console.error('QR render failed:', e);
      setReady(false);
    }
  }, [options, scriptReady]);

  return { containerRef, instance: instanceRef, ready };
}

const ToastContext = createContext(null);
const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((toast) => {
    const id = uid();
    setToasts((t) => [...t, { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), toast.duration || 3000);
  }, []);
  const value = useMemo(() => ({
    success: (message) => push({ tone: 'success', message }),
    error:   (message) => push({ tone: 'error', message }),
    info:    (message) => push({ tone: 'info', message }),
  }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`toast-in pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium ${
            t.tone === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white' :
            t.tone === 'error'   ? 'bg-red-500/90 border-red-400/50 text-white' :
                                   'bg-slate-900/90 border-white/10 text-slate-100'
          }`}>
            {t.tone === 'success' && <Check size={15} />}
            {t.tone === 'error' && <AlertCircle size={15} />}
            {t.tone === 'info' && <Sparkles size={15} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useHotkeys(map) {
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      for (const combo in map) {
        const [m, k] = combo.split('+');
        if (m === 'mod' && mod && key === k) {
          const target = e.target;
          if (k === 'c' && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) continue;
          e.preventDefault();
          map[combo]();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map]);
}

/* ─────────────────────────────────────────────────────────────────────────
   4. ATOMIC UI
   ───────────────────────────────────────────────────────────────────────── */

const cx = (...cls) => cls.filter(Boolean).join(' ');

const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

function Pill({ tone = 'idle', icon: Icon, children, className }) {
  const { isDark } = useTheme();
  const tones = {
    idle:    isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-300',
    valid:   isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300',
    invalid: isDark ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-300',
    info:    isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-300',
  };
  return (
    <div className={cx('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', tones[tone], className)}>
      {Icon && <Icon size={12} />}
      {children}
    </div>
  );
}

function Field({ label, name, type = 'text', placeholder, icon: Icon, multiline, options, colSpan, value, onChange }) {
  const { isDark } = useTheme();
  const base = cx(
    'w-full rounded-xl border-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all',
    isDark
      ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white/10'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500'
  );
  return (
    <div className={cx('flex flex-col gap-1.5 mb-4', colSpan === 2 && 'md:col-span-2')}>
      <label className={cx('text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className={cx('absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none', isDark ? 'text-slate-500' : 'text-slate-400')}>
            <Icon size={15} />
          </div>
        )}
        {options ? (
          <select name={name} value={value} onChange={onChange} className={cx(base, 'pl-3 pr-8 py-2.5')}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : multiline ? (
          <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
            className={cx(base, Icon ? 'pl-10' : 'pl-3', 'pr-3 py-2.5 resize-none')} />
        ) : (
          <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            className={cx(base, Icon ? 'pl-10' : 'pl-3', 'pr-3 py-2.5')} />
        )}
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options, columns }) {
  const { isDark, borderSoft, glassSoft, textMuted } = useTheme();
  return (
    <div className={cx('grid gap-2', columns && `grid-cols-${columns}`)}
         style={{ gridTemplateColumns: `repeat(${columns || options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              'h-10 rounded-xl border-2 text-xs font-medium transition flex items-center justify-center gap-1.5',
              active
                ? (isDark
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]')
                : (isDark
                    ? cx(borderSoft, glassSoft, textMuted, 'hover:bg-white/10')
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50')
            )}
          >
            {o.render ? o.render(active) : o.label}
          </button>
        );
      })}
    </div>
  );
}

function ColorInput({ value, onChange, label }) {
  const { isDark, textDim } = useTheme();
  return (
    <div className="space-y-2">
      {label && <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', textDim)}>{label}</span>}
      <div className={cx('flex items-center gap-2 rounded-xl border-2 px-2 py-1.5', isDark ? 'border-white/10 bg-white/5' : 'bg-white border-slate-300')}>
        <input type="color" value={value} onChange={onChange}
          className="w-8 h-8 p-0 border-0 bg-transparent rounded cursor-pointer" />
        <span className="text-xs font-mono-x">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  const { isDark, textDim, textMuted } = useTheme();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', textDim)}>{label}</span>
        <span className={cx('text-xs font-mono-x', textMuted)}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cx(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer',
          isDark ? 'bg-white/10' : 'bg-slate-300',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br',
          '[&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-pink-500',
          '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/40',
          '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing'
        )}
      />
    </div>
  );
}

function PatternGlyph({ type }) {
  return (
    <div className={cx(
      'w-3.5 h-3.5 bg-current',
      type === 'rounded' && 'rounded-sm',
      type === 'dots' && 'rounded-full',
      type === 'classy-rounded' && 'rounded-tl-full rounded-br-full',
      type === 'classy' && 'rounded-tl-md',
    )} />
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   5. FEATURE SECTIONS
   ───────────────────────────────────────────────────────────────────────── */

function HeaderBar({ scriptState, isDark, toggleDark, onShare, onReset, onHistoryToggle, historyCount }) {
  const statusPill = scriptState === 'ready'
    ? { tone: 'valid', icon: null, text: 'Engine Online', pulse: true }
    : scriptState === 'error'
      ? { tone: 'invalid', icon: AlertCircle, text: 'Engine Offline' }
      : { tone: 'idle', icon: Loader2, text: 'Booting', spin: true };

  return (
    <header className={cx(
      'sticky top-0 z-30 border-b backdrop-blur-2xl',
      isDark ? 'border-white/5 bg-[#07081a]/60' : 'border-slate-300 bg-[#e8e4dc]/85'
    )}>
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-pink-500 blur-md opacity-60" />
            <div className="relative bg-gradient-to-br from-indigo-500 to-pink-500 text-white p-2 rounded-xl">
              <Zap size={18} fill="currentColor" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-display italic tracking-tight">QR Architect</h1>
            <span className="text-[10px] font-mono-x uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cx('hidden md:flex', 'text-[10px] font-mono-x uppercase tracking-[0.2em]')}>
            <Pill tone={statusPill.tone} icon={statusPill.icon} className={cx(statusPill.spin && '[&_svg]:animate-spin')}>
              {statusPill.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />}
              {statusPill.text}
            </Pill>
          </div>

          <button onClick={onHistoryToggle} title="History"
            className={cx('relative p-2 rounded-full border-2 transition',
              isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700')}>
            <History size={16} />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white font-bold flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>
          <button onClick={onShare} title="Copy shareable link"
            className={cx('p-2 rounded-full border-2 transition',
              isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700')}>
            <Share2 size={16} />
          </button>
          <button onClick={onReset} title="Reset all"
            className={cx('p-2 rounded-full border-2 transition',
              isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700')}>
            <RotateCcw size={16} />
          </button>
          <button onClick={toggleDark} title="Toggle theme"
            className={cx('p-2 rounded-full border-2 transition',
              isDark ? 'border-white/10 hover:bg-white/5 text-amber-300' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700')}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ activeTab, qrLen }) {
  const { textDim, textMuted } = useTheme();
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <p className={cx('text-[11px] font-mono-x uppercase tracking-[0.25em] mb-2', textDim)}>
          ◆ Generative QR Studio · <span className="opacity-60">v2.0</span>
        </p>
        <h2 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight">
          Design codes that<span className="italic"> feel </span>like brand.
        </h2>
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <p className={cx('max-w-sm text-sm', textMuted)}>
          Eight data types. AI themes. History. Frames. Shareable links. Export anywhere.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-mono-x">
          <span className={cx('uppercase tracking-[0.2em]', textDim)}>Editing</span>
          <span className="px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 uppercase tracking-[0.15em]">{activeTab}</span>
          <span className={cx('uppercase tracking-[0.2em]', textDim)}>· {qrLen} chars</span>
        </div>
      </div>
    </div>
  );
}

function AIEngine({ design, onPromptChange, onApplyPatch, aiState, setAIState, inputRef }) {
  const { isDark, textDim, textMuted, glass } = useTheme();
  const toast = useToast();

  const run = useCallback(() => {
    const prompt = design.aiPrompt.trim();
    if (!prompt) {
      setAIState({ status: 'error', message: 'Type a vibe first — e.g. "neon arcade".', confidence: 0, key: null });
      return;
    }
    setAIState({ status: 'thinking', message: '', confidence: 0, key: null });
    setTimeout(() => {
      const hit = scoreAITheme(prompt);
      if (!hit) {
        setAIState({ status: 'error', message: 'No match. Try: neon, corporate, nature, ocean, sunset, luxury, pastel, mono.', confidence: 0, key: null });
        return;
      }
      onApplyPatch(hit.patch);
      setAIState({ status: 'success', message: `Applied "${hit.key}" theme.`, confidence: hit.confidence, key: hit.key });
      toast.success(`AI theme "${hit.key}" applied`);
    }, 380);
  }, [design.aiPrompt, onApplyPatch, setAIState, toast]);

  const inputCls = cx(
    'flex-1 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all px-4 py-3',
    isDark
      ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white/10'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500'
  );

  return (
    <section className={cx('relative overflow-hidden rounded-3xl border grain p-6', glass)}>
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/30 to-pink-500/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            <h3 className="text-base font-semibold">AI Theme Engine</h3>
          </div>
          <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', textDim)}>
            ⌘K · 8 vibes
          </span>
        </div>

        <p className={cx('text-sm mb-4', textMuted)}>
          Describe a feeling.{' '}
          {Object.keys(AI_THEMES).map((k, i) => (
            <React.Fragment key={k}>
              <button
                onClick={() => onPromptChange(k)}
                className={cx(
                  'font-mono-x text-xs px-2 py-0.5 rounded border transition',
                  isDark ? 'border-white/10 hover:bg-white/10' : 'bg-white border-slate-300 text-slate-700 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700'
                )}
              >{k}</button>
              {i < Object.keys(AI_THEMES).length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="e.g. cyberpunk arcade with electric pink accents"
            value={design.aiPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            className={inputCls}
          />
          <button
            onClick={run}
            disabled={aiState.status === 'thinking'}
            className="group relative px-6 py-3 rounded-xl font-semibold text-sm overflow-hidden bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60 hover:shadow-pink-500/40 transition-all"
          >
            <span className="relative flex items-center gap-2">
              {aiState.status === 'thinking' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiState.status === 'thinking' ? 'Thinking' : 'Generate'}
            </span>
          </button>
        </div>

        {aiState.status === 'success' && (
          <div className="mt-4 flex items-center gap-3 toast-in">
            <Check size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">{aiState.message}</span>
            <div className="flex-1 max-w-[200px]">
              <div className={cx('h-1 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-700"
                  style={{ width: `${Math.round(aiState.confidence * 100)}%` }}
                />
              </div>
            </div>
            <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', textDim)}>
              {Math.round(aiState.confidence * 100)}% match
            </span>
          </div>
        )}
        {aiState.status === 'error' && (
          <div className="mt-3 flex items-center gap-2 toast-in text-amber-400">
            <AlertCircle size={14} />
            <span className="text-xs font-medium">{aiState.message}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function TabBar({ activeTab, onChange }) {
  const { isDark, glass, textMuted } = useTheme();
  return (
    <section className={cx('rounded-2xl border p-1.5 flex overflow-x-auto gap-1 no-scrollbar', glass)}>
      {TABS.map((t) => {
        const TabIcon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              active
                ? (isDark ? 'bg-white/10 text-white shadow-inner' : 'bg-slate-900 text-white shadow-md')
                : cx(textMuted, isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100 hover:text-slate-900')
            )}
          >
            <TabIcon size={16} />
            {t.label}
          </button>
        );
      })}
    </section>
  );
}

const TabFields = {
  url: ({ inputs, onChange }) => (
    <Field label="Landing page URL" name="url" placeholder="https://your-brand.com" icon={Globe} colSpan={2}
      value={inputs.url} onChange={onChange} />
  ),
  text: ({ inputs, onChange }) => (
    <Field label="Message" name="text" placeholder="Any text up to 2,953 characters…" multiline colSpan={2}
      value={inputs.text} onChange={onChange} />
  ),
  email: ({ inputs, onChange }) => (
    <>
      <Field label="Recipient" name="email" placeholder="hello@company.com" icon={Mail} value={inputs.email} onChange={onChange} />
      <Field label="Subject" name="subject" placeholder="Inquiry" icon={Type} value={inputs.subject} onChange={onChange} />
      <Field label="Body" name="body" placeholder="Hi there…" multiline colSpan={2} value={inputs.body} onChange={onChange} />
    </>
  ),
  wifi: ({ inputs, onChange }) => {
    const { textMuted } = useTheme();
    return (
      <>
        <Field label="Network name (SSID)" name="ssid" placeholder="Office_Guest" icon={Wifi} value={inputs.ssid} onChange={onChange} />
        <Field label="Password" name="password" type="password" placeholder="••••••••" value={inputs.password} onChange={onChange} />
        <Field label="Encryption" name="encryption" value={inputs.encryption} onChange={onChange}
          options={[
            { label: 'WPA / WPA2', value: 'WPA' },
            { label: 'WEP', value: 'WEP' },
            { label: 'None (open)', value: 'nopass' },
          ]} />
        <div className="flex items-center gap-2 mt-7">
          <input type="checkbox" id="hidden" name="hidden" checked={inputs.hidden} onChange={onChange}
            className="w-4 h-4 rounded accent-indigo-500" />
          <label htmlFor="hidden" className={cx('text-sm', textMuted)}>Hidden network</label>
        </div>
      </>
    );
  },
  vcard: ({ inputs, onChange }) => (
    <>
      <Field label="First name" name="firstName" placeholder="Alex" value={inputs.firstName} onChange={onChange} />
      <Field label="Last name" name="lastName" placeholder="Vance" value={inputs.lastName} onChange={onChange} />
      <Field label="Company" name="company" placeholder="Acme Studio" icon={Building2} value={inputs.company} onChange={onChange} />
      <Field label="Job title" name="jobTitle" placeholder="Creative Director" icon={Briefcase} value={inputs.jobTitle} onChange={onChange} />
      <Field label="Work phone" name="workPhone" placeholder="+1 555 0100" icon={Phone} value={inputs.workPhone} onChange={onChange} />
      <Field label="Mobile" name="cellPhone" placeholder="+1 555 0199" icon={Smartphone} value={inputs.cellPhone} onChange={onChange} />
      <Field label="Email" name="email" placeholder="alex@acme.co" icon={Mail} value={inputs.email} onChange={onChange} />
      <Field label="Website" name="website" placeholder="https://acme.co" icon={Globe} value={inputs.website} onChange={onChange} />
      <Field label="Street" name="street" placeholder="123 Market St" icon={MapPin} colSpan={2} value={inputs.street} onChange={onChange} />
      <Field label="City" name="city" placeholder="Brooklyn" value={inputs.city} onChange={onChange} />
      <Field label="State / Region" name="state" placeholder="NY" value={inputs.state} onChange={onChange} />
      <Field label="Postal code" name="zip" placeholder="11201" value={inputs.zip} onChange={onChange} />
      <Field label="Country" name="country" placeholder="USA" value={inputs.country} onChange={onChange} />
    </>
  ),
  appstore: ({ inputs, onChange }) => {
    const { isDark, textMuted, borderSoft, glassSoft } = useTheme();
    return (
      <>
        <Field label="iOS / App Store URL" name="iosUrl" placeholder="https://apps.apple.com/..." icon={Smartphone} value={inputs.iosUrl} onChange={onChange} />
        <Field label="Android / Play Store URL" name="androidUrl" placeholder="https://play.google.com/..." icon={Smartphone} value={inputs.androidUrl} onChange={onChange} />
        <div className={cx('md:col-span-2 rounded-xl border px-4 py-3 text-xs flex items-start gap-2', borderSoft, glassSoft, textMuted)}>
          <ShieldCheck size={14} className={cx('mt-0.5 shrink-0', isDark ? 'text-indigo-400' : 'text-indigo-600')} />
          <span>Enter both URLs to auto-enable a smart redirect — iOS users land in the App Store, Android users in Play.</span>
        </div>
      </>
    );
  },
  crypto: ({ inputs, onChange }) => (
    <>
      <Field label="Currency" name="coin" value={inputs.coin} onChange={onChange}
        options={[
          { label: 'Bitcoin (BTC)', value: 'bitcoin' },
          { label: 'Ethereum (ETH)', value: 'ethereum' },
          { label: 'Litecoin (LTC)', value: 'litecoin' },
        ]} />
      <Field label="Amount (optional)" name="amount" placeholder="0.001" value={inputs.amount} onChange={onChange} />
      <Field label="Wallet address" name="address"
        placeholder={inputs.coin === 'ethereum' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2' : 'bc1q...'}
        icon={Bitcoin} colSpan={2} value={inputs.address} onChange={onChange} />
    </>
  ),
  event: ({ inputs, onChange }) => (
    <>
      <Field label="Event title" name="summary" placeholder="Product Launch" icon={Calendar} value={inputs.summary} onChange={onChange} />
      <Field label="Location" name="location" placeholder="Brooklyn Navy Yard" icon={MapPin} value={inputs.location} onChange={onChange} />
      <Field label="Description" name="description" placeholder="Details attendees should know…" multiline colSpan={2} value={inputs.description} onChange={onChange} />
    </>
  ),
};

function ContentEditor({ activeTab, inputs, onInputChange, validation, qrLen }) {
  const { isDark, glass, borderSoft, textMuted } = useTheme();
  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon ?? Link;
  const TabComponent = TabFields[activeTab];
  const ValIcon = validation.state === 'valid' ? Check : validation.state === 'invalid' ? AlertCircle : ShieldCheck;

  return (
    <section className={cx('rounded-3xl border grain overflow-hidden', glass)}>
      <div className={cx('px-8 py-5 flex items-center justify-between border-b', borderSoft)}>
        <div className="flex items-center gap-3">
          <div className={cx('p-2 rounded-xl', isDark ? 'bg-white/5' : 'bg-slate-900 text-white')}>
            <ActiveIcon size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold capitalize">
              {activeTab === 'appstore' ? 'App store link' : activeTab} content
            </h3>
            <p className={cx('text-xs', textMuted)}>Payload compiled to {qrLen} characters</p>
          </div>
        </div>
        <div className="hidden md:block">
          <Pill tone={validation.state} icon={ValIcon}>{validation.message}</Pill>
        </div>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <TabComponent inputs={inputs} onChange={onInputChange} />
        </div>
        <div className="md:hidden mt-2">
          <Pill tone={validation.state} icon={ValIcon}>{validation.message}</Pill>
        </div>
      </div>
    </section>
  );
}

function Designer({ design, onDesignChange, onApplyPreset, onLogoUpload }) {
  const { isDark, glass, glassSoft, borderSoft, textDim, textMuted } = useTheme();

  return (
    <section className={cx('rounded-3xl border grain overflow-hidden', glass)}>
      <div className={cx('px-8 py-5 flex items-center gap-3 border-b', borderSoft)}>
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 text-white">
          <Palette size={18} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Visual Designer</h3>
          <p className={cx('text-xs', textMuted)}>Shapes, colors, frame, brand mark.</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div>
          <label className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-3 block', textDim)}>Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => onApplyPreset(p)}
                className={cx('group p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:border-indigo-500/40', glassSoft)}
              >
                <div className="flex gap-1 mb-2.5">
                  <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: p.dots }} />
                  <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: p.dots2 }} />
                  <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: p.bg }} />
                </div>
                <span className="text-xs font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-3 block', textDim)}>Dot pattern</label>
              <Segmented
                value={design.dotsType}
                onChange={(v) => onDesignChange('dotsType', v)}
                columns={5}
                options={['rounded', 'dots', 'classy', 'classy-rounded', 'square'].map(t => ({
                  value: t, render: () => <PatternGlyph type={t} />
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-3 block', textDim)}>Corner frame</label>
                <Segmented
                  value={design.cornersSquareType}
                  onChange={(v) => onDesignChange('cornersSquareType', v)}
                  columns={3}
                  options={['extra-rounded', 'square', 'dot'].map(t => ({
                    value: t,
                    render: () => (
                      <div className={cx('w-3.5 h-3.5 border-2 border-current',
                        t === 'extra-rounded' && 'rounded-md',
                        t === 'dot' && 'rounded-full')} />
                    )
                  }))}
                />
              </div>
              <div>
                <label className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-3 block', textDim)}>Corner dot</label>
                <Segmented
                  value={design.cornersDotType}
                  onChange={(v) => onDesignChange('cornersDotType', v)}
                  columns={2}
                  options={['dot', 'square'].map(t => ({
                    value: t,
                    render: () => <div className={cx('w-2.5 h-2.5 bg-current', t === 'dot' && 'rounded-full')} />
                  }))}
                />
              </div>
            </div>

            <div>
              <label className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-3 block', textDim)}>Brand logo</label>
              <div className="flex items-center gap-3">
                <label className={cx(
                  'relative flex-1 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition',
                  isDark ? 'border-white/15 hover:border-indigo-400 hover:bg-white/5' : 'bg-[#f1f0ec] border-slate-400 hover:border-indigo-500 hover:bg-indigo-50'
                )}>
                  <input type="file" accept="image/*" onChange={onLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className={cx('flex items-center justify-center gap-2 text-sm', textMuted)}>
                    <ImagePlus size={16} />
                    {design.logoUrl ? 'Change logo' : 'Upload PNG / SVG'}
                  </div>
                </label>
                {design.logoUrl && (
                  <button onClick={() => onDesignChange('logoUrl', '')}
                    className={cx('p-3 rounded-2xl border transition',
                      isDark ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                             : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100')}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5 space-y-5', borderSoft, glassSoft)}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Gradient dots</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={design.isGradient}
                  onChange={(e) => onDesignChange('isGradient', e.target.checked)} />
                <div className={cx(
                  "w-10 h-5 rounded-full transition-all relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow peer-checked:after:translate-x-5 after:transition-all",
                  isDark ? 'bg-white/10' : 'bg-slate-400',
                  'peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-pink-500'
                )} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ColorInput label="Primary" value={design.dotsColor} onChange={(e) => onDesignChange('dotsColor', e.target.value)} />
              {design.isGradient && (
                <div className="toast-in">
                  <ColorInput label="Secondary" value={design.dotsColor2} onChange={(e) => onDesignChange('dotsColor2', e.target.value)} />
                </div>
              )}
            </div>

            {design.isGradient && (
              <div>
                <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-2 block', textDim)}>Gradient direction</span>
                <Segmented
                  value={design.gradientType}
                  onChange={(v) => onDesignChange('gradientType', v)}
                  options={[{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }]}
                />
              </div>
            )}

            <div className={cx('pt-4 border-t space-y-3', borderSoft)}>
              <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] block', textDim)}>Background</span>
              <div className="flex items-center gap-2">
                <ColorInput
                  value={design.backgroundColor === 'transparent' ? '#ffffff' : design.backgroundColor}
                  onChange={(e) => onDesignChange('backgroundColor', e.target.value)}
                />
                <button onClick={() => onDesignChange('backgroundColor', '#ffffff')}
                  className={cx('px-3 py-2 text-xs font-medium rounded-xl border-2 transition', isDark ? cx(borderSoft, textMuted, 'hover:bg-white/5') : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400')}>White</button>
                <button onClick={() => onDesignChange('backgroundColor', 'transparent')}
                  className={cx('px-3 py-2 text-xs font-medium rounded-xl border-2 transition', isDark ? cx(borderSoft, textMuted, 'hover:bg-white/5') : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400')}>None</button>
              </div>
            </div>

            <div className={cx('pt-4 border-t space-y-4', borderSoft)}>
              <Slider label="Margin" value={design.margin} min={0} max={40} onChange={(v) => onDesignChange('margin', v)} unit="px" />
              <Slider label="Size" value={design.size} min={200} max={600} step={10} onChange={(v) => onDesignChange('size', v)} unit="px" />
            </div>

            <div className={cx('pt-4 border-t', borderSoft)}>
              <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em] mb-2 block', textDim)}>Frame label</span>
              <div className="grid grid-cols-3 gap-2">
                {FRAMES.map(f => (
                  <button key={f.id} onClick={() => onDesignChange('frame', f.id)}
                    className={cx(
                      'py-2 rounded-xl border-2 text-[10px] font-mono-x uppercase tracking-[0.15em] transition',
                      design.frame === f.id
                        ? (isDark
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]')
                        : (isDark
                            ? cx(borderSoft, glassSoft, textMuted)
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400')
                    )}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewFrame({ children, design }) {
  const frameLabel = FRAMES.find(f => f.id === design.frame);
  const showLabel = design.frame !== 'none' && frameLabel;

  return (
    <div className="relative mx-auto" style={{ width: design.size, height: showLabel ? design.size + 44 : design.size }}>
      <span className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-indigo-500/60 rounded-tl" />
      <span className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-indigo-500/60 rounded-tr" />
      <span className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-pink-500/60 rounded-bl"
            style={{ bottom: showLabel ? '42px' : '-8px' }} />
      <span className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-pink-500/60 rounded-br"
            style={{ bottom: showLabel ? '42px' : '-8px' }} />
      {children}
      {showLabel && (
        <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center">
          <div className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-2 rounded-full text-[11px] font-bold tracking-[0.25em] shadow-lg shadow-indigo-500/30">
            {frameLabel.label}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewPanel({ design, qrData, validation, scriptState, qrRef, onDownload, onCopy, copyState }) {
  const { isDark, glass, glassSoft, borderSoft, textDim, textMuted } = useTheme();
  const [exportMenu, setExportMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showInvalid = scriptState === 'ready' && validation.state === 'invalid';
  const showScan = scriptState === 'ready' && !showInvalid;

  return (
    <>
      <div className={cx('rounded-3xl border grain overflow-hidden', glass)}>
        <div className={cx('px-6 py-4 flex items-center justify-between border-b', borderSoft)}>
          <div className="flex items-center gap-2">
            <ScanLine size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            <span className="text-[10px] font-mono-x uppercase tracking-[0.2em]">Live Preview</span>
          </div>
          <span className={cx('text-[10px] font-mono-x', textDim)}>
            {qrData.length} chars · ECC H · {design.size}px
          </span>
        </div>

        <div className="p-6">
          <PreviewFrame design={design}>
            <div ref={qrRef} className="rounded-2xl overflow-hidden shadow-2xl relative"
              style={{ width: design.size, height: design.size, backgroundColor: design.backgroundColor }} />
            {showScan && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"
                   style={{ height: design.size }}>
                <div className="qr-scanline" style={{ '--scan-height': `${design.size + 8}px` }} />
              </div>
            )}
            {scriptState !== 'ready' && (
              <div className={cx('absolute inset-0 flex flex-col items-center justify-center rounded-2xl backdrop-blur',
                isDark ? 'bg-[#07081a]/85' : 'bg-white/95')}
                style={{ height: design.size }}>
                {scriptState === 'loading' ? (
                  <>
                    <Loader2 size={28} className={cx('animate-spin mb-3', isDark ? 'text-indigo-400' : 'text-indigo-600')} />
                    <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', isDark ? 'text-slate-300' : 'text-slate-700')}>Loading engine…</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={28} className={cx('mb-3', isDark ? 'text-red-400' : 'text-red-600')} />
                    <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', isDark ? 'text-red-400' : 'text-red-600')}>CDN unreachable</span>
                    <button onClick={() => window.location.reload()} className={cx('mt-3 text-xs underline', isDark ? 'text-indigo-400' : 'text-indigo-600')}>Retry</button>
                  </>
                )}
              </div>
            )}
            {showInvalid && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm"
                   style={{ height: design.size }}>
                <AlertCircle size={24} className="text-red-400 mb-2" />
                <span className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-red-300 text-center px-4">
                  {validation.message}
                </span>
              </div>
            )}
          </PreviewFrame>

          <div className={cx('mt-5 rounded-xl border px-3 py-2 max-h-20 overflow-y-auto no-scrollbar', borderSoft, glassSoft)}>
            <span className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', textDim)}>Payload</span>
            <p className="text-[11px] font-mono-x break-all mt-1 leading-relaxed">
              {qrData.length > 140 ? qrData.slice(0, 140) + '…' : qrData}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div ref={menuRef} className="col-span-2 relative">
              <button
                onClick={() => setExportMenu(v => !v)}
                disabled={scriptState !== 'ready'}
                className="w-full h-12 rounded-xl font-semibold text-sm overflow-hidden bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pink-500/40 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <Download size={16} /> Download
                  <ChevronDown size={14} className={cx('transition-transform', exportMenu && 'rotate-180')} />
                </span>
              </button>
              {exportMenu && (
                <div className={cx('absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-2xl overflow-hidden z-10 toast-in',
                  isDark ? 'bg-[#0d1028] border-white/10' : 'bg-white border-slate-200')}>
                  {[
                    { ext: 'png', label: 'PNG', hint: 'Raster · universal' },
                    { ext: 'svg', label: 'SVG', hint: 'Vector · infinite scale' },
                    { ext: 'jpeg', label: 'JPEG', hint: 'Smaller file size' },
                    { ext: 'webp', label: 'WebP', hint: 'Modern · optimised' },
                  ].map(opt => (
                    <button
                      key={opt.ext}
                      onClick={() => { onDownload(opt.ext); setExportMenu(false); }}
                      className={cx('w-full px-4 py-3 flex items-center justify-between text-left text-sm transition',
                        isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')}
                    >
                      <div className="flex items-center gap-3">
                        <FileImage size={15} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                        <span className="font-medium">{opt.label}</span>
                      </div>
                      <span className={cx('text-[10px] font-mono-x', textDim)}>{opt.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onCopy}
              disabled={scriptState !== 'ready' || copyState === 'copying'}
              className={cx('h-11 rounded-xl font-medium text-sm border-2 flex items-center justify-center gap-2 transition disabled:opacity-50',
                copyState === 'copied' ? (isDark ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-700')
                : copyState === 'error'  ? (isDark ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-500 bg-red-50 text-red-700')
                : (isDark ? cx(borderSoft, 'hover:bg-white/5') : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50')
              )}
            >
              {copyState === 'copying' && <><Loader2 size={15} className="animate-spin" /> Copying</>}
              {copyState === 'copied' && <><Check size={15} /> Copied</>}
              {copyState === 'error' && <><AlertCircle size={15} /> Failed</>}
              {copyState === 'idle' && <><Copy size={15} /> Copy ⌘⇧C</>}
            </button>

            <button
              onClick={() => onDownload('svg')}
              disabled={scriptState !== 'ready'}
              className={cx('h-11 rounded-xl font-medium text-sm border-2 flex items-center justify-center gap-2 disabled:opacity-50 transition',
                isDark ? cx(borderSoft, 'hover:bg-white/5') : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50')}>
              <Layers size={15} /> Quick SVG
            </button>
          </div>
        </div>
      </div>

      <div className={cx('rounded-2xl border p-4 flex items-center gap-3', glass)}>
        <div className={cx('p-2 rounded-xl', isDark ? 'bg-white/5' : 'bg-indigo-50 border border-indigo-100')}>
          <Share2 size={16} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Resolution {design.size}×{design.size} · ECC High</p>
          <p className={cx('text-[10px] font-mono-x uppercase tracking-wider', textDim)}>Canvas 2D · SVG 1.1</p>
        </div>
      </div>
    </>
  );
}

function HistoryDrawer({ open, onClose, history, onRestore, onClear }) {
  const { isDark, glass, borderSoft, textDim, textMuted } = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end toast-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('relative w-full max-w-sm h-full border-l overflow-y-auto shadow-2xl',
        isDark ? 'bg-[#07081a] border-white/10' : 'bg-white border-slate-300')}>
        <div className={cx('sticky top-0 flex items-center justify-between px-6 py-4 border-b backdrop-blur-xl',
          isDark ? 'bg-[#07081a]/90 border-white/10' : 'bg-white border-slate-300')}>
          <div className="flex items-center gap-2">
            <History size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            <h3 className="text-base font-semibold">History</h3>
            <Pill tone="idle">{history.length}</Pill>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button onClick={onClear} className={cx('p-2 rounded-lg transition', textMuted,
                isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')}>
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className={cx('p-2 rounded-lg transition', textMuted,
              isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {history.length === 0 ? (
            <div className={cx('text-center py-12 text-sm', textMuted)}>
              <Clock size={32} className="mx-auto mb-3 opacity-40" />
              <p>No history yet.</p>
              <p className={cx('text-xs mt-1', textDim)}>Generated codes appear here for quick restore.</p>
            </div>
          ) : (
            history.map((item) => {
              const ItemIcon = TABS.find(t => t.id === item.tab)?.icon ?? Link;
              return (
                <button
                  key={item.id}
                  onClick={() => { onRestore(item); onClose(); }}
                  className={cx('w-full p-3 rounded-2xl border text-left transition hover:scale-[1.01] hover:border-indigo-500/40', glass)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center shadow-inner"
                         style={{
                           background: `linear-gradient(135deg, ${item.design.dotsColor}, ${item.design.dotsColor2})`,
                         }}>
                      <ItemIcon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold capitalize">{item.tab}</span>
                        <span className={cx('text-[10px] font-mono-x', textDim)}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={cx('text-xs font-mono-x truncate', textMuted)}>
                        {item.data.length > 50 ? item.data.slice(0, 50) + '…' : item.data}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ShortcutsFooter() {
  const { textDim, borderSoft, isDark } = useTheme();
  const shortcuts = [
    { keys: ['⌘', 'K'], label: 'Focus AI prompt' },
    { keys: ['⌘', '⇧', 'C'], label: 'Copy QR' },
    { keys: ['⌘', '⇧', 'D'], label: 'Download PNG' },
    { keys: ['⌘', '/'], label: 'Toggle theme' },
  ];
  return (
    <footer className={cx('mt-12 pt-6 border-t', borderSoft)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Keyboard size={14} className={textDim} />
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <div className="flex gap-0.5">
                {s.keys.map((k, j) => (
                  <kbd key={j} className={cx('px-1.5 py-0.5 rounded font-mono-x font-semibold border',
                    isDark ? 'border-white/15 bg-white/5 text-slate-300' : 'border-slate-300 bg-white text-slate-700')}>
                    {k}
                  </kbd>
                ))}
              </div>
              <span className={cx('uppercase tracking-[0.15em] font-mono-x', textDim)}>{s.label}</span>
            </div>
          ))}
        </div>
        <p className={cx('text-[10px] font-mono-x uppercase tracking-[0.2em]', textDim)}>
          QR Architect AI · Made to scan, designed to last
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   6. APP
   ───────────────────────────────────────────────────────────────────────── */

function AppInner() {
  const [isDark, setIsDark] = useLocal('qr:dark', true);
  const [activeTab, setActiveTab] = useLocal('qr:tab', 'url');
  const [inputs, setInputs] = useLocal('qr:inputs', DEFAULT_INPUTS);
  const [design, setDesign] = useLocal('qr:design', DEFAULT_DESIGN);
  const [history, setHistory] = useLocal('qr:history', []);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiState, setAIState] = useState({ status: 'idle', message: '', confidence: 0, key: null });
  const [copyState, setCopyState] = useState('idle');
  const aiInputRef = useRef(null);

  const toast = useToast();
  const scriptState = useScriptLoader(CDN_URL, 'QRCodeStyling');
  const qrData = useMemo(() => FORMATTERS[activeTab](inputs), [activeTab, inputs]);
  const validation = useMemo(() => validate[activeTab](inputs), [activeTab, inputs]);
  const { containerRef, instance } = useQR({ scriptReady: scriptState === 'ready', data: qrData, design });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash.length > 1) {
      const decoded = decodeState(window.location.hash.slice(1));
      if (decoded?.inputs && decoded?.design) {
        setInputs(decoded.inputs);
        setDesign(decoded.design);
        if (decoded.tab) setActiveTab(decoded.tab);
        toast.info('Restored from shared link');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [setInputs, setDesign, setActiveTab, toast]);

  const onInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setInputs((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  }, [setInputs]);

  const onDesignChange = useCallback((name, value) => {
    setDesign((p) => ({ ...p, [name]: value }));
  }, [setDesign]);

  const onApplyPreset = useCallback((p) => {
    setDesign((prev) => ({
      ...prev,
      dotsColor: p.dots, dotsColor2: p.dots2,
      cornersSquareColor: p.corners, cornersDotColor: p.corners,
      backgroundColor: p.bg, dotsType: p.type,
      isGradient: p.dots !== p.dots2,
    }));
    toast.info(`Applied "${p.name}" preset`);
  }, [setDesign, toast]);

  const onApplyPatch = useCallback((patch) => {
    setDesign((prev) => ({ ...prev, ...patch }));
  }, [setDesign]);

  const onLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onDesignChange('logoUrl', reader.result);
    reader.readAsDataURL(file);
  }, [onDesignChange, toast]);

  const addToHistory = useCallback(() => {
    const item = {
      id: uid(),
      timestamp: Date.now(),
      tab: activeTab,
      data: qrData,
      inputs,
      design,
    };
    setHistory((h) => [item, ...h.filter(x => x.data !== qrData)].slice(0, 8));
  }, [activeTab, qrData, inputs, design, setHistory]);

  const onDownload = useCallback((ext) => {
    if (!instance.current || scriptState !== 'ready') return;
    try {
      instance.current.download({ extension: ext, name: `qr-architect-${Date.now()}` });
      addToHistory();
      toast.success(`Exported as ${ext.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
  }, [instance, scriptState, toast, addToHistory]);

  const onCopy = useCallback(async () => {
    if (!instance.current || scriptState !== 'ready') return;
    setCopyState('copying');
    try {
      const canvas = instance.current._canvas?.nodeName === 'CANVAS'
        ? instance.current._canvas
        : containerRef.current?.querySelector('canvas');
      if (!canvas) throw new Error('Canvas not found');
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Clipboard API unavailable');
      const blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopyState('copied');
      addToHistory();
      toast.success('QR copied to clipboard');
      setTimeout(() => setCopyState('idle'), 1800);
    } catch (err) {
      console.error(err);
      setCopyState('error');
      toast.error('Clipboard unavailable');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [instance, scriptState, containerRef, toast, addToHistory]);

  const onRestore = useCallback((item) => {
    setInputs(item.inputs);
    setDesign(item.design);
    setActiveTab(item.tab);
    toast.success('Restored from history');
  }, [setInputs, setDesign, setActiveTab, toast]);

  const onShare = useCallback(async () => {
    const snapshot = { inputs, design, tab: activeTab };
    const hash = encodeState(snapshot);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shareable link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }, [inputs, design, activeTab, toast]);

  const onReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setDesign(DEFAULT_DESIGN);
    setActiveTab('url');
    toast.info('All settings reset');
  }, [setInputs, setDesign, setActiveTab, toast]);

  const hotkeys = useMemo(() => ({
    'mod+k': () => aiInputRef.current?.focus(),
    'mod+/': () => setIsDark(v => !v),
  }), [setIsDark]);
  useHotkeys(hotkeys);

  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey) return;
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); onCopy(); }
      if (e.key.toLowerCase() === 'd') { e.preventDefault(); onDownload('png'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCopy, onDownload]);

  const theme = useMemo(() => ({
    isDark,
    glass: isDark
      ? 'bg-white/[0.04] border-white/10 backdrop-blur-xl'
      : 'bg-white border-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_32px_-8px_rgba(15,23,42,0.12)]',
    glassSoft: isDark
      ? 'bg-white/[0.02] border-white/5'
      : 'bg-[#f1f0ec] border-slate-300',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
    textDim: isDark ? 'text-slate-500' : 'text-slate-500',
    borderSoft: isDark ? 'border-white/10' : 'border-slate-300',
  }), [isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      <div className={cx('min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300',
        isDark ? 'text-slate-100' : 'text-slate-900')}>
        <GlobalStyles />

        <div className={cx('fixed inset-0 -z-10', isDark ? 'bg-[#07081a]' : 'bg-[#e8e4dc]')}>
          <div className={cx('absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-3xl mesh-a',
            isDark ? 'bg-indigo-600/30' : 'bg-indigo-400/25')} />
          <div className={cx('absolute bottom-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-3xl mesh-b',
            isDark ? 'bg-pink-600/20' : 'bg-pink-400/20')} />
          <div className={cx('absolute top-[30%] right-[20%] w-[35vw] h-[35vw] rounded-full blur-3xl mesh-a',
            isDark ? 'bg-cyan-500/10' : 'bg-amber-400/20')} />
        </div>

        <HeaderBar
          scriptState={scriptState} isDark={isDark}
          toggleDark={() => setIsDark(v => !v)}
          onShare={onShare} onReset={onReset}
          onHistoryToggle={() => setHistoryOpen(v => !v)}
          historyCount={history.length}
        />

        <main className="max-w-screen-2xl mx-auto px-6 py-8">
          <Hero activeTab={activeTab} qrLen={qrData.length} />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 space-y-6">
              <AIEngine
                design={design}
                onPromptChange={(v) => onDesignChange('aiPrompt', v)}
                onApplyPatch={onApplyPatch}
                aiState={aiState} setAIState={setAIState}
                inputRef={aiInputRef}
              />
              <TabBar activeTab={activeTab} onChange={setActiveTab} />
              <ContentEditor
                activeTab={activeTab} inputs={inputs}
                onInputChange={onInputChange}
                validation={validation} qrLen={qrData.length}
              />
              <Designer
                design={design}
                onDesignChange={onDesignChange}
                onApplyPreset={onApplyPreset}
                onLogoUpload={onLogoUpload}
              />
            </div>

            <aside className="xl:col-span-4 xl:sticky xl:top-24 xl:self-start space-y-4">
              <PreviewPanel
                design={design} qrData={qrData} validation={validation}
                scriptState={scriptState} qrRef={containerRef}
                onDownload={onDownload} onCopy={onCopy} copyState={copyState}
              />
            </aside>
          </div>

          <ShortcutsFooter />
        </main>

        <HistoryDrawer
          open={historyOpen} onClose={() => setHistoryOpen(false)}
          history={history} onRestore={onRestore}
          onClear={() => { setHistory([]); toast.info('History cleared'); }}
        />
      </div>
    </ThemeContext.Provider>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
      :root {
        --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
        --font-display: 'Instrument Serif', Georgia, serif;
        --font-mono: 'JetBrains Mono', ui-monospace, monospace;
      }
      html, body, #root { font-family: var(--font-sans); }
      .font-display { font-family: var(--font-display); }
      .font-mono-x { font-family: var(--font-mono); }

      @keyframes qr-scan {
        0%   { transform: translateY(-8px); opacity: 0; }
        8%   { opacity: 1; }
        92%  { opacity: 1; }
        100% { transform: translateY(var(--scan-height, 312px)); opacity: 0; }
      }
      .qr-scanline {
        position: absolute; left: 6%; right: 6%; top: 0; height: 2px;
        background: linear-gradient(90deg, transparent, rgba(99,102,241,0.95), rgba(236,72,153,0.9), transparent);
        box-shadow: 0 0 14px 2px rgba(99,102,241,0.7), 0 0 28px 8px rgba(99,102,241,0.25);
        border-radius: 2px; pointer-events: none;
        animation: qr-scan 2.4s ease-in-out infinite alternate;
      }
      @keyframes toast-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .toast-in { animation: toast-in 220ms ease-out both; }
      @keyframes mesh-drift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50%      { transform: translate(-30px, 40px) scale(1.08); }
      }
      .mesh-a { animation: mesh-drift 18s ease-in-out infinite; }
      .mesh-b { animation: mesh-drift 22s ease-in-out infinite reverse; }

      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      .grain::before {
        content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.035;
        background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      }

      input[type=range]::-moz-range-thumb {
        width: 16px; height: 16px; border-radius: 9999px; border: 0;
        background: linear-gradient(135deg, #6366f1, #ec4899);
        box-shadow: 0 4px 12px rgba(99,102,241,0.4); cursor: grab;
      }

      kbd { font-size: 10px; letter-spacing: 0; }
    `}</style>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}