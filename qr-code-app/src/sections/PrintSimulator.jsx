import { memo, useState, useCallback } from 'react';
import { Printer, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTheme, scanQRFromCanvas } from '../hooks';
import { cx } from '../ui-components';

export const PrintSimulator = memo(function PrintSimulator({ mainCanvasRef }) {
  const { isDark, glassSoft, borderSoft, textDim, textMuted } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [sizeMm, setSizeMm] = useState(20); // default 20mm (2cm)
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null); // null | { scannable: boolean, targetPx: number, mm: number }

  const runPrintSimulation = useCallback(async (targetMm = sizeMm) => {
    const container = mainCanvasRef.current;
    if (!container) return;
    const sourceCanvas = container.querySelector('canvas');
    if (!sourceCanvas || sourceCanvas.width === 0) return;

    setTesting(true);
    setResult(null);

    const DPI = 300;
    const mmToInch = 25.4;
    const targetPx = Math.max(20, Math.round((targetMm / mmToInch) * DPI));

    // Downsample main canvas to target print resolution at 300 DPI
    const simCanvas = document.createElement('canvas');
    simCanvas.width = targetPx;
    simCanvas.height = targetPx;
    const ctx = simCanvas.getContext('2d');

    ctx.imageSmoothingEnabled = false; // Sharp downsampling for modules
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetPx, targetPx);
    ctx.drawImage(sourceCanvas, 0, 0, targetPx, targetPx);

    const isScannable = await scanQRFromCanvas(simCanvas);

    setResult({
      scannable: isScannable,
      targetPx,
      mm: targetMm,
    });
    setTesting(false);
  }, [mainCanvasRef, sizeMm]);

  return (
    <div className={cx('mt-4 rounded-2xl border grain overflow-hidden transition-all', glassSoft)}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cx('w-full px-4 py-3 flex items-center justify-between text-left font-medium text-xs transition-colors', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')}
      >
        <div className="flex items-center gap-2">
          <Printer size={15} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          <span className="font-semibold">Print-Size Simulator (300 DPI)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cx('text-[10px] font-mono', textDim)}>
            {sizeMm} mm ({Math.round((sizeMm / 25.4) * 300)} px)
          </span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className={cx('p-4 border-t space-y-3', borderSoft)}>
          <p className={cx('text-[11px]', textMuted)}>
            Downsamples the high-res QR code to simulate physical sticker/label sizes at 300 DPI print density.
          </p>

          <div className="flex items-center gap-2">
            <span className={cx('text-[10px] font-mono uppercase tracking-[0.15em]', textDim)}>Presets:</span>
            <div className="flex items-center gap-1.5 flex-1">
              {[
                { label: '1 cm', mm: 10 },
                { label: '2 cm', mm: 20 },
                { label: '5 cm', mm: 50 },
              ].map((preset) => (
                <button
                  key={preset.mm}
                  onClick={() => {
                    setSizeMm(preset.mm);
                    runPrintSimulation(preset.mm);
                  }}
                  className={cx(
                    'px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all',
                    sizeMm === preset.mm
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                      : isDark
                        ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cx('text-[10px] font-mono uppercase tracking-[0.15em]', textDim)}>Custom:</span>
              <input
                type="number"
                min={5}
                max={200}
                value={sizeMm}
                onChange={(e) => setSizeMm(Math.max(5, Math.min(200, parseInt(e.target.value) || 10)))}
                className={cx(
                  'w-16 px-2 py-1 text-xs font-mono rounded-lg border text-center font-medium transition',
                  isDark ? 'bg-white/5 border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
              <span className={cx('text-xs font-mono', textDim)}>mm</span>
            </div>

            <button
              onClick={() => runPrintSimulation(sizeMm)}
              disabled={testing}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 shadow hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              {testing ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Testing…
                </>
              ) : (
                'Test Scannability'
              )}
            </button>
          </div>

          {result && (
            <div className="pt-2">
              {result.scannable ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>
                    ✅ Scannable at <strong>{result.mm} mm</strong> ({result.targetPx}×{result.targetPx} px @ 300 DPI)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>
                    ⚠️ Could not verify at <strong>{result.mm} mm</strong> ({result.targetPx} px) – increase physical size or error correction level.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
