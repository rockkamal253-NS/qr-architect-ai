/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOM HOOKS
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { debounce } from './constants';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js';

/* ─── Script Loader with retry ─── */
export function useScriptLoader(src, globalName, maxRetries = 2) {
  const [state, setState] = useState(() =>
    (typeof window !== 'undefined' && window[globalName]) ? 'ready' : 'loading'
  );
  const retryCount = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window[globalName]) { setState('ready'); return; }

    const loadScript = () => {
      const selector = `script[data-src="${src}"]`;
      let script = document.querySelector(selector);

      if (!script) {
        script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.src = src;
        if (src === CDN_URL) {
          script.integrity = 'sha384-CHvehSuS0IW8Qj9IlAETJXbHf/SEi62VXMgODXi9p3CC3NUIuThj1Y0uAFnl30VB';
          script.crossOrigin = 'anonymous';
        }
        document.body.appendChild(script);
      }

      const onLoad = () => { setState('ready'); retryCount.current = 0; };
      const onError = () => {
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(loadScript, 1000 * retryCount.current);
        } else {
          setState('error');
        }
      };

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      return () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      };
    };

    return loadScript();
  }, [src, globalName, maxRetries]);

  return state;
}

/* ─── QR Code with debounced updates ─── */
export function useQR({ scriptReady, data, design }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [ready, setReady] = useState(false);
  const designRef = useRef(design);

  // Keep design ref current for comparison
  useEffect(() => { designRef.current = design; }, [design]);

  const options = useMemo(() => ({
    width: design.size,
    height: design.size,
    data: data || ' ',
    margin: design.margin,
    image: design.logoUrl || undefined,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.38, margin: 8 },
    dotsOptions: {
      type: design.dotsType,
      ...(design.isGradient
        ? {
          gradient: {
            type: design.gradientType,
            colorStops: [
              { offset: 0, color: design.dotsColor },
              { offset: 1, color: design.dotsColor2 }
            ]
          }
        }
        : { color: design.dotsColor }),
    },
    backgroundOptions: { color: design.backgroundColor },
    cornersSquareOptions: { type: design.cornersSquareType, color: design.cornersSquareColor },
    cornersDotOptions: { type: design.cornersDotType, color: design.cornersDotColor },
  }), [data, design]);

  // Debounced QR update to prevent excessive re-renders
  const debouncedUpdate = useMemo(
    () => debounce((opts) => {
      if (!window.QRCodeStyling || !containerRef.current) return;

      // Check if data is too large for QR code
      const dataSize = opts.data?.length || 0;
      if (dataSize > 3000) {
        console.warn(`QR data too large: ${dataSize} chars (max ~3000)`);
        // Show error state but don't crash
        containerRef.current.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:#f87171;font-family:monospace;font-size:11px;text-align:center;padding:20px;">
            <div style="margin-bottom:8px;">⚠️</div>
            <div>Data too large</div>
            <div style="opacity:0.7;margin-top:4px;">${Math.round(dataSize/1024)}KB / 3KB max</div>
            <div style="opacity:0.7;margin-top:4px;">Remove avatar or shorten text</div>
          </div>
        `;
        setReady(false);
        return;
      }

      try {
        containerRef.current.innerHTML = '';
        const instance = new window.QRCodeStyling(opts);
        instance.append(containerRef.current);
        instanceRef.current = instance;
        setReady(true);
      } catch (e) {
        console.error('QR render failed:', e);
        setReady(false);
      }
    }, 150),
    []
  );

  useEffect(() => {
    if (!scriptReady) return;
    debouncedUpdate(options);
    return () => debouncedUpdate.cancel?.();
  }, [options, scriptReady, debouncedUpdate]);

  return { containerRef, instance: instanceRef, ready };
}

/* ─── Toast System ─── */
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const maxToasts = 5;

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2, 10);
    setToasts((t) => {
      const next = [...t, { id, ...toast }];
      return next.length > maxToasts ? next.slice(-maxToasts) : next;
    });
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast.duration || 3000);
  }, []);

  const value = useMemo(() => ({
    success: (message) => push({ tone: 'success', message }),
    error: (message) => push({ tone: 'error', message }),
    info: (message) => push({ tone: 'info', message }),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium ${
              t.tone === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white' :
              t.tone === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' :
              'bg-slate-900/90 border-white/10 text-slate-100'
            }`}
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Hotkeys ─── */
export function useHotkeys(map) {
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

/* ─── Intersection Observer for lazy loading ─── */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

/* ─── Theme Context ─── */
export const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);
