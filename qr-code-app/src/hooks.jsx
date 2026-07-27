/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOM HOOKS
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { debounce, computeSha256 } from './constants';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js';

/* ─── Content Hashing Hook (Debounced at ~280ms) ─── */
export function useContentHash(qrData, delay = 280) {
  const [hashData, setHashData] = useState({ fullHash: '', hashPrefix: '00000000', loading: false });

  useEffect(() => {
    let isCurrent = true;
    setHashData(prev => ({ ...prev, loading: true }));

    const timer = setTimeout(async () => {
      const { fullHash, prefix } = await computeSha256(qrData);
      if (isCurrent) {
        setHashData({ fullHash, hashPrefix: prefix, loading: false });
      }
    }, delay);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [qrData, delay]);

  return hashData;
}

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

/* ─── Auto-Scaling Preview Hook (ResizeObserver + transform: scale) ─── */
export function useAutoScale(containerRef, bufferWidth, bufferHeight) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bufferWidth || bufferWidth === 0) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const containerW = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      if (containerW > 0) {
        const newScale = Math.min(1, containerW / bufferWidth);
        setScale(newScale);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, bufferWidth]);

  const wrapperHeight = (bufferHeight || 800) * scale;
  return { scale, wrapperHeight };
}

/* ─── QR Code with debounced updates ─── */
export function useQR({ scriptReady, data, design }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [ready, setReady] = useState(false);
  const designRef = useRef(design);

  useEffect(() => { designRef.current = design; }, [design]);

  // Requirement: Explicit 2x Ultra HD buffer size (800px to 2400px)
  const bufferSize = useMemo(() => Math.max(800, (design.size || 300) * 2), [design.size]);
  const proportionalMargin = useMemo(() => Math.round((design.margin || 12) * (bufferSize / Math.max(1, design.size || 300))), [design.margin, design.size, bufferSize]);
  const logoMargin = useMemo(() => Math.round(16 * (bufferSize / 800)), [bufferSize]);

  const options = useMemo(() => ({
    width: bufferSize,
    height: bufferSize,
    data: data || ' ',
    margin: proportionalMargin,
    image: design.logoUrl || undefined,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.38, margin: logoMargin },
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
  }), [data, design, bufferSize, proportionalMargin, logoMargin]);

  // Debounced QR update
  const debouncedUpdate = useMemo(
    () => debounce((opts) => {
      if (!window.QRCodeStyling || !containerRef.current) return;

      const dataSize = opts.data?.length || 0;
      if (dataSize > 3000) {
        console.warn(`QR data too large: ${dataSize} chars`);
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

        // Apply crisp-edges class and imageSmoothing settings
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
          canvas.classList.add('qr-canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Disable smoothing for sharp QR matrix blocks
            ctx.imageSmoothingEnabled = false;
            if (opts.image) {
              // Enable smoothing only when drawing logo overlays
              ctx.imageSmoothingEnabled = true;
            }
          }
        }

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

  return { containerRef, instance: instanceRef, ready, bufferSize };
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
