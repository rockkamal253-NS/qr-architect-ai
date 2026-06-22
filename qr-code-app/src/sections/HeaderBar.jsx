import { memo } from 'react';
import { Zap, History, Share2, RotateCcw, Sun, Moon, Undo2, Redo2, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../hooks';
import { cx, Pill, IconButton } from '../ui-components';

export const HeaderBar = memo(function HeaderBar({ 
  scriptState, isDark, toggleDark, onShare, onReset, 
  onHistoryToggle, historyCount, onUndo, onRedo, canUndo, canRedo 
}) {
  const statusPill = scriptState === 'ready'
    ? { tone: 'valid', text: 'Engine Online', pulse: true }
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
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex text-[10px] font-mono uppercase tracking-[0.2em]">
            <Pill tone={statusPill.tone} icon={statusPill.icon} className={cx(statusPill.spin && '[&_svg]:animate-spin')}>
              {statusPill.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />}
              {statusPill.text}
            </Pill>
          </div>

          <IconButton icon={Undo2} onClick={onUndo} title="Undo" ariaLabel="Undo last change" disabled={!canUndo} />
          <IconButton icon={Redo2} onClick={onRedo} title="Redo" ariaLabel="Redo last change" disabled={!canRedo} />
          
          <IconButton icon={History} onClick={onHistoryToggle} title="History" active={historyCount > 0} />
          <IconButton icon={Share2} onClick={onShare} title="Copy shareable link" />
          <IconButton icon={RotateCcw} onClick={onReset} title="Reset all" />
          <IconButton icon={isDark ? Sun : Moon} onClick={toggleDark} title="Toggle theme" />
        </div>
      </div>
    </header>
  );
});