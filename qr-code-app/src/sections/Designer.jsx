import { memo } from 'react';
import { Palette, ImagePlus, Trash2 } from 'lucide-react';
import { useTheme } from '../hooks';
import { Segmented, ColorInput, Slider, PatternGlyph, cx } from '../ui-components';
import { PRESETS } from '../constants';

export const Designer = memo(function Designer({ design, onDesignChange, onApplyPreset, onLogoUpload }) {
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
          <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-3 block', textDim)}>Presets</label>
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
              <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-3 block', textDim)}>Dot pattern</label>
              <Segmented
                value={design.dotsType}
                onChange={(v) => onDesignChange('dotsType', v)}
                columns={5}
                ariaLabel="Dot pattern style"
                options={['rounded', 'dots', 'classy', 'classy-rounded', 'square'].map(t => ({
                  value: t, render: () => <PatternGlyph type={t} />
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-3 block', textDim)}>Corner frame</label>
                <div className="flex flex-col gap-2">
                  <Segmented
                    value={design.cornersSquareType}
                    onChange={(v) => onDesignChange('cornersSquareType', v)}
                    columns={3}
                    ariaLabel="Corner frame style"
                    options={['extra-rounded', 'square', 'dot'].map(t => ({
                      value: t,
                      render: () => (
                        <div className={cx('w-3.5 h-3.5 border-2 border-current',
                          t === 'extra-rounded' && 'rounded-md',
                          t === 'dot' && 'rounded-full')} />
                      )
                    }))}
                  />
                  <ColorInput value={design.cornersSquareColor} onChange={(e) => onDesignChange('cornersSquareColor', e.target.value)} label="Color" />
                </div>
              </div>
              <div>
                <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-3 block', textDim)}>Corner dot</label>
                <div className="flex flex-col gap-2">
                  <Segmented
                    value={design.cornersDotType}
                    onChange={(v) => onDesignChange('cornersDotType', v)}
                    columns={2}
                    ariaLabel="Corner dot style"
                    options={['dot', 'square'].map(t => ({
                      value: t,
                      render: () => <div className={cx('w-2.5 h-2.5 bg-current', t === 'dot' && 'rounded-full')} />
                    }))}
                  />
                  <ColorInput value={design.cornersDotColor} onChange={(e) => onDesignChange('cornersDotColor', e.target.value)} label="Color" />
                </div>
              </div>
            </div>

            <div>
              <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-3 block', textDim)}>Brand logo</label>
              <div className="flex items-center gap-3">
                <label className={cx(
                  'relative flex-1 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition',
                  isDark ? 'border-white/15 hover:border-indigo-400 hover:bg-white/5' : 'bg-[#f1f0ec] border-slate-400 hover:border-indigo-500 hover:bg-indigo-50'
                )}>
                  <input type="file" accept="image/*" onChange={onLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Upload logo" />
                  <div className={cx('flex items-center justify-center gap-2 text-sm', textMuted)}>
                    <ImagePlus size={16} />
                    {design.logoUrl ? 'Change logo' : 'Upload PNG / SVG'}
                  </div>
                </label>
                {design.logoUrl && (
                  <button onClick={() => onDesignChange('logoUrl', '')}
                    className={cx('p-3 rounded-2xl border transition',
                      isDark ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100')}
                    aria-label="Remove logo">
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
                <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-2 block', textDim)}>Gradient direction</span>
                <Segmented
                  value={design.gradientType}
                  onChange={(v) => onDesignChange('gradientType', v)}
                  ariaLabel="Gradient direction"
                  options={[{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }]}
                />
              </div>
            )}

            <div className={cx('pt-4 border-t space-y-3', borderSoft)}>
              <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em] block', textDim)}>Background</span>
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
              <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em] mb-2 block', textDim)}>Custom Frame Text</span>
              <input type="text" placeholder="e.g. SCAN ME" value={design.frameText} onChange={(e) => onDesignChange('frameText', e.target.value)}
                className={cx('w-full rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition',
                  isDark ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white/10'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 hover:border-slate-400')} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
