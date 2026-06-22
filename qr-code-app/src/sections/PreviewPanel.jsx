import { memo, useState, useRef, useEffect } from 'react';
import { ScanLine, Download, Copy, Check, AlertCircle, Loader2, ChevronDown, FileImage, Layers, Share2 } from 'lucide-react';
import { useTheme } from '../hooks';
import { cx } from '../ui-components';

const PreviewFrame = memo(function PreviewFrame({ children, design }) {
  const showLabel = design.frameText && design.frameText.trim().length > 0;

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
          <div className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-2 rounded-full text-[11px] font-mono font-bold tracking-[0.2em] uppercase shadow-lg shadow-indigo-500/30">
            {design.frameText}
          </div>
        </div>
      )}
    </div>
  );
});

export const PreviewPanel = memo(function PreviewPanel({ design, qrData, validation, scriptState, qrRef, onDownload, onCopy, copyState }) {
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
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Live Preview</span>
          </div>
          <span className={cx('text-[10px] font-mono', textDim)}>
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
                style={{ height: design.size }}>
                <AlertCircle size={24} className="text-red-400 mb-2" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-300 text-center px-4">
                  {validation.message}
                </span>
              </div>
            )}
            {qrData.length > 2500 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-amber-500/20 backdrop-blur-sm"
                style={{ height: design.size }}>
                <AlertCircle size={24} className="text-amber-400 mb-2" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 text-center px-4">
                  QR data too large ({Math.round(qrData.length / 1024)}KB)<br/>
                  Remove avatar or reduce text
                </span>
              </div>
            )}
          </PreviewFrame>

          <div className={cx('mt-5 rounded-xl border px-3 py-2 max-h-20 overflow-y-auto no-scrollbar', borderSoft, glassSoft)}>
            <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', textDim)}>Payload</span>
            <p className="text-[11px] font-mono break-all mt-1 leading-relaxed">
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
                      <span className={cx('text-[10px] font-mono', textDim)}>{opt.hint}</span>
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
                  : copyState === 'error' ? (isDark ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-500 bg-red-50 text-red-700')
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
          <p className={cx('text-[10px] font-mono uppercase tracking-wider', textDim)}>Canvas 2D · SVG 1.1</p>
        </div>
      </div>
    </>
  );
});
