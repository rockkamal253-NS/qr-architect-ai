import { memo, useState, useRef, useEffect } from 'react';
import { ScanLine, Download, Copy, Check, AlertCircle, Loader2, ChevronDown, FileImage, Layers, Share2 } from 'lucide-react';
import { useTheme, useAutoScale, useScanTest } from '../hooks';
import { getContrastRatio } from '../constants';
import { PrintSimulator } from './PrintSimulator';
import { cx } from '../ui-components';

const PREVIEW_SIZE = 280;

const PreviewFrame = memo(function PreviewFrame({ children, design }) {
  const showLabel = design.frameText && design.frameText.trim().length > 0;

  return (
    <div className="relative mx-auto" style={{ width: PREVIEW_SIZE, height: showLabel ? PREVIEW_SIZE + 44 : PREVIEW_SIZE }}>
      <span className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-indigo-500/60 rounded-tl" />
      <span className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-indigo-500/60 rounded-tr" />
      <span className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-pink-500/60 rounded-bl"
        style={{ bottom: showLabel ? '42px' : '-8px' }} />
      <span className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-pink-500/60 rounded-br"
        style={{ bottom: showLabel ? '42px' : '-8px' }} />
      {children}
      {showLabel && (
        <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center">
          <div className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-2 rounded-full text-[11px] font-mono font-bold tracking-[0.2em] uppercase shadow-lg shadow-indigo-500/30">
            {design.frameText}
          </div>
        </div>
      )}
    </div>
  );
});

export const PreviewPanel = memo(function PreviewPanel({ design, qrData, validation, scriptState, qrRef, onDownload, onCopy, copyState, bufferSize = 800, hashPrefix = '00000000', onVerifyOpen }) {
  const { isDark, glass, glassSoft, borderSoft, textDim, textMuted } = useTheme();
  const [exportMenu, setExportMenu] = useState(false);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showInvalid = scriptState === 'ready' && validation.state === 'invalid';
  const showScan = scriptState === 'ready' && !showInvalid;

  const currentBuffer = bufferSize || Math.max(800, (design.size || 300) * 2);
  const { scale: autoScale } = useAutoScale(containerRef, currentBuffer, currentBuffer);
  const scale = autoScale || (PREVIEW_SIZE / currentBuffer);

  // Requirement: Live Scan-Test Badge with BarcodeDetector & jsQR fallback
  const scanStatus = useScanTest(qrRef, [design.size, design.logoUrl, design.dotsColor, design.backgroundColor, qrData]);

  // Requirement: WCAG Contrast Ratio Calculation
  const bg = design.backgroundColor === 'transparent' ? '#FFFFFF' : design.backgroundColor;
  const contrastRatio = getContrastRatio(design.dotsColor, bg);
  const contrastBadgeColor = contrastRatio >= 7
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : contrastRatio >= 4.5
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
  const contrastIcon = contrastRatio >= 7 ? '✅' : contrastRatio >= 4.5 ? '⚠️' : '❌';

  const rasterResText = `PNG/JPEG/WebP: Export at ${design.size * 2} × ${design.size * 2} px (2× Ultra HD)`;
  const svgResText = `SVG: infinite vector scaling (at ${design.size} pt)`;

  return (
    <>
      <div className={cx('rounded-3xl border grain overflow-hidden', glass)}>
        <div className={cx('px-6 py-4 flex items-center justify-between border-b', borderSoft)}>
          <div className="flex items-center gap-2">
            <ScanLine size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Live Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              #{hashPrefix}
            </span>
            <span className={cx('text-[10px] font-mono', textDim)}>
              ECC H
            </span>
          </div>
        </div>

        <div className="p-6">
          <PreviewFrame design={design}>
            <div ref={containerRef} className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto w-full" style={{ height: PREVIEW_SIZE }}>
              <div
                ref={qrRef}
                id="preview-qr-container"
                className="absolute top-0 left-0"
                style={{
                  width: currentBuffer,
                  height: currentBuffer,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  backgroundColor: design.backgroundColor,
                }}
              />
            </div>
            {showScan && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"
                style={{ height: PREVIEW_SIZE }}>
                <div className="qr-scanline" style={{ '--scan-height': `${PREVIEW_SIZE + 8}px` }} />
              </div>
            )}
            {scriptState !== 'ready' && (
              <div className={cx('absolute inset-0 flex flex-col items-center justify-center rounded-2xl backdrop-blur',
                isDark ? 'bg-[#07081a]/85' : 'bg-white/95')}
                style={{ height: PREVIEW_SIZE }}>
                {scriptState === 'loading' ? (
                  <>
                    <Loader2 size={28} className={cx('animate-spin mb-3', isDark ? 'text-indigo-400' : 'text-indigo-600')} />
                    <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', isDark ? 'text-slate-300' : 'text-slate-700')}>Loading engine…</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={28} className={cx('mb-3', isDark ? 'text-red-400' : 'text-red-600')} />
                    <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', isDark ? 'text-red-400' : 'text-red-600')}>CDN unreachable</span>
                    <button onClick={() => window.location.reload()} className={cx('mt-3 text-xs underline', isDark ? 'text-indigo-400' : 'text-indigo-600')}>Retry</button>
                  </>
                )}
              </div>
            )}
            {showInvalid && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm"
                style={{ height: PREVIEW_SIZE }}>
                <AlertCircle size={24} className="text-red-400 mb-2" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-300 text-center px-4">
                  {validation.message}
                </span>
              </div>
            )}
          </PreviewFrame>

          <div className="mt-5 space-y-1 text-center">
            <div className={cx('text-[11px] font-mono font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
              {rasterResText}
            </div>
            <div className={cx('text-[10px] font-mono opacity-60', textDim)}>
              {svgResText}
            </div>

            {/* Live Scan-Test & Contrast Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {scanStatus === 'success' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm toast-in">
                  <span>✅</span> Scannable – ready to print
                </span>
              )}
              {scanStatus === 'warning' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm toast-in">
                  <span>⚠️</span> Could not verify – test with phone camera
                </span>
              )}
              {scanStatus === null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-slate-400 bg-white/5 border border-white/10">
                  <Loader2 size={12} className="animate-spin text-indigo-400" /> Checking scannability…
                </span>
              )}

              <span className={cx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shadow-sm toast-in", contrastBadgeColor)}>
                <span>{contrastIcon}</span> Contrast: {contrastRatio.toFixed(1)}:1
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setExportMenu(v => !v)}
                disabled={scriptState !== 'ready'}
                className="w-full h-12 rounded-xl font-semibold text-sm overflow-hidden bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pink-500/40 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <Download size={16} /> Download ({`qr-${hashPrefix}`})
                  <ChevronDown size={14} className={cx('transition-transform', exportMenu && 'rotate-180')} />
                </span>
              </button>
              {exportMenu && (
                <div className={cx('absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-2xl overflow-hidden z-10 toast-in',
                  isDark ? 'bg-[#0d1028] border-white/10' : 'bg-white border-slate-200')}>
                  {[
                    { ext: 'png', label: 'PNG', hint: `${design.size * 2}px · 2× Ultra HD` },
                    { ext: 'svg', label: 'SVG', hint: `Infinite vector (${design.size}pt)` },
                    { ext: 'jpeg', label: 'JPEG', hint: `${design.size * 2}px · Compact` },
                    { ext: 'webp', label: 'WebP', hint: `${design.size * 2}px · Web` },
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
                      <span className={cx('text-[10px] font-mono', textDim)}>{opt.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onCopy}
                disabled={scriptState !== 'ready' || copyState === 'copying'}
                className={cx('h-11 rounded-xl font-medium text-xs border flex items-center justify-center gap-1.5 transition disabled:opacity-50',
                  copyState === 'copied' ? (isDark ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-700')
                    : copyState === 'error' ? (isDark ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-500 bg-red-50 text-red-700')
                      : (isDark ? cx(borderSoft, 'hover:bg-white/5') : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50')
                )}
              >
                {copyState === 'copying' && <><Loader2 size={14} className="animate-spin" /> Copying</>}
                {copyState === 'copied' && <><Check size={14} /> Copied</>}
                {copyState === 'error' && <><AlertCircle size={14} /> Failed</>}
                {copyState === 'idle' && <><Copy size={14} /> Copy</>}
              </button>

              <button
                onClick={onVerifyOpen}
                className={cx('h-11 rounded-xl font-medium text-xs border flex items-center justify-center gap-1.5 transition',
                  isDark ? cx(borderSoft, 'hover:bg-white/5 text-indigo-300') : 'bg-white border-slate-300 text-indigo-600 hover:border-slate-400 hover:bg-slate-50')}>
                <Check size={14} /> Verify Hash
              </button>
            </div>

            <PrintSimulator mainCanvasRef={qrRef} />
          </div>
        </div>
      </div>

      <div className={cx('rounded-2xl border p-4 flex items-center gap-3', glass)}>
        <div className={cx('p-2 rounded-xl', isDark ? 'bg-white/5' : 'bg-indigo-50 border border-indigo-100')}>
          <Share2 size={16} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Resolution {design.size}×{design.size} · ECC High</p>
          <p className={cx('text-[10px] font-mono uppercase tracking-wider', textDim)}>Canvas 2D · SVG 1.1</p>
        </div>
      </div>
    </>
  );
});
