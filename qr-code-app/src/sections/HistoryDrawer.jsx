import { memo } from 'react';
import { History, Clock, X, Trash2, Link } from 'lucide-react';
import { useTheme } from '../hooks.jsx';
import { Pill, cx } from '../ui-components.jsx';
import { TABS } from '../store';

const ICON_MAP = { Link, Type: Link, UserSquare2: Link, Mail: Link, Wifi: Link, Calendar: Link, Bitcoin: Link, Smartphone: Link, Layers: Link };

export const HistoryDrawer = memo(function HistoryDrawer({ open, onClose, history, onRestore, onClear }) {
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
                isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')} aria-label="Clear history">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className={cx('p-2 rounded-lg transition', textMuted,
              isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')} aria-label="Close history">
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
              const ItemIcon = ICON_MAP[TABS.find(t => t.id === item.tab)?.icon] || Link;
              return (
                <button
                  key={item.id}
                  onClick={() => { onRestore(item); onClose(); }}
                  className={cx('w-full p-3 rounded-2xl border text-left transition hover:scale-[1.01] hover:border-indigo-500/40', glass)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center shadow-inner"
                      style={{ background: `linear-gradient(135deg, ${item.design.dotsColor}, ${item.design.dotsColor2})` }}>
                      <ItemIcon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold capitalize">{item.tab}</span>
                        <span className={cx('text-[10px] font-mono', textDim)}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={cx('text-xs font-mono truncate', textMuted)}>
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
});
