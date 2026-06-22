import { memo, useCallback } from 'react';
import { Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../hooks';
import { useToast } from '../hooks';
import { cx } from '../ui-components';
import { scoreAITheme, AI_THEMES } from '../constants';

export const AIEngine = memo(function AIEngine({ design, onPromptChange, onApplyPatch, aiState, setAIState, inputRef }) {
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
          <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', textDim)}>⌘K · 8 vibes</span>
        </div>

        <p className={cx('text-sm mb-4', textMuted)}>
          Describe a feeling.{' '}
          {Object.keys(AI_THEMES).map((k, i) => (
            <button
              key={k}
              onClick={() => onPromptChange(k)}
              className={cx(
                'font-mono text-xs px-2 py-0.5 rounded border transition',
                isDark ? 'border-white/10 hover:bg-white/10' : 'bg-white border-slate-300 text-slate-700 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700'
              )}
            >{k}</button>
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
            aria-label="AI theme prompt"
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
                <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-700" style={{ width: `${Math.round(aiState.confidence * 100)}%` }} />
              </div>
            </div>
            <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', textDim)}>{Math.round(aiState.confidence * 100)}% match</span>
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
});