/* ═══════════════════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Link, Type, UserSquare2, Mail, Wifi, Palette, Download, Globe,
  Briefcase, MapPin, Phone, ImagePlus, Zap, Calendar, Bitcoin, Share2,
  Layers, Sparkles, Trash2, Sun, Moon, Copy, Check, AlertCircle, Loader2,
  ScanLine, Smartphone, Building2, ShieldCheck, History, Clock, X,
  FileImage, Command, RotateCcw, Keyboard, ChevronDown, Frame,
  MessageCircle, Camera, MessageSquare, Video, QrCode, User, Upload,
  Undo2, Redo2, Eye, EyeOff, Info
} from 'lucide-react';
import { useTheme } from './hooks';

export const cx = (...cls) => cls.filter(Boolean).join(' ');

/* ─── Pill ─── */
export const Pill = memo(function Pill({ tone = 'idle', icon: Icon, children, className }) {
  const { isDark } = useTheme();
  const tones = {
    idle: isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-300',
    valid: isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300',
    invalid: isDark ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-300',
    info: isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-300',
  };
  return (
    <div className={cx('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', tones[tone], className)}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </div>
  );
});

/* ─── Field ─── */
export const Field = memo(function Field({ label, name, type = 'text', placeholder, icon: Icon, multiline, options, colSpan, value, onChange, helpText, maxLength }) {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const base = cx(
    'w-full rounded-xl border-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all',
    isDark
      ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white/10'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500'
  );

  return (
    <div className={cx('flex flex-col gap-1.5 mb-4', colSpan === 2 && 'md:col-span-2')}>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className={cx('text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {label}
        </label>
        {maxLength && (
          <span className={cx('text-[10px]', isDark ? 'text-slate-600' : 'text-slate-400')}>
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
      <div className="relative">
        {Icon && (
          <div className={cx('absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none', isDark ? 'text-slate-500' : 'text-slate-400')}>
            <Icon size={15} aria-hidden="true" />
          </div>
        )}
        {options ? (
          <select id={name} name={name} value={value} onChange={onChange} className={cx(base, 'pl-3 pr-8 py-2.5')}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : multiline ? (
          <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3} maxLength={maxLength}
            className={cx(base, Icon ? 'pl-10' : 'pl-3', 'pr-3 py-2.5 resize-none')} />
        ) : (
          <input id={name} type={inputType} name={name} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
            className={cx(base, Icon ? 'pl-10' : 'pl-3', isPassword ? 'pr-10' : 'pr-3', 'py-2.5')} />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className={cx('absolute inset-y-0 right-0 pr-3 flex items-center', isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {helpText && (
        <p className={cx('text-[11px] flex items-center gap-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
          <Info size={11} aria-hidden="true" />
          {helpText}
        </p>
      )}
    </div>
  );
});

/* ─── Segmented ─── */
export const Segmented = memo(function Segmented({ value, onChange, options, columns, ariaLabel }) {
  const { isDark, borderSoft, glassSoft, textMuted } = useTheme();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cx('grid gap-2')}
      style={{ gridTemplateColumns: `repeat(${columns || options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
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
});

/* ─── ColorInput ─── */
export const ColorInput = memo(function ColorInput({ value, onChange, label }) {
  const { isDark, textDim } = useTheme();
  const inputRef = useRef(null);

  return (
    <div className="space-y-2">
      {label && <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', textDim)}>{label}</span>}
      <div className={cx('flex items-center gap-2 rounded-xl border-2 px-2 py-1.5', isDark ? 'border-white/10 bg-white/5' : 'bg-white border-slate-300')}>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={onChange}
          aria-label={`Choose ${label || 'color'}`}
          className="w-8 h-8 p-0 border-0 bg-transparent rounded cursor-pointer"
        />
        <span className="text-xs font-mono">{value.toUpperCase()}</span>
      </div>
    </div>
  );
});

/* ─── Slider ─── */
export const Slider = memo(function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  const { isDark, textDim, textMuted } = useTheme();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', textDim)}>{label}</span>
        <span className={cx('text-xs font-mono', textMuted)}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={cx('w-full h-1.5 rounded-full appearance-none cursor-pointer', isDark ? 'bg-white/10' : 'bg-slate-300')}
      />
    </div>
  );
});

/* ─── PatternGlyph ─── */
export const PatternGlyph = memo(function PatternGlyph({ type }) {
  return (
    <div className={cx(
      'w-3.5 h-3.5 bg-current',
      type === 'rounded' && 'rounded-sm',
      type === 'dots' && 'rounded-full',
      type === 'classy-rounded' && 'rounded-tl-full rounded-br-full',
      type === 'classy' && 'rounded-tl-md',
    )} aria-hidden="true" />
  );
});

/* ─── Skeleton Loader ─── */
export const Skeleton = memo(function Skeleton({ width, height, className }) {
  return (
    <div 
      className={cx('skeleton', className)} 
      style={{ width, height }}
      aria-hidden="true"
    />
  );
});

/* ─── Tooltip ─── */
export const Tooltip = memo(function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-slate-900 text-white text-xs whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
});

/* ─── IconButton ─── */
export const IconButton = memo(function IconButton({ icon: Icon, onClick, title, ariaLabel, active, disabled, className }) {
  const { isDark } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={cx(
        'p-2 rounded-full border-2 transition-all active:scale-95',
        active
          ? (isDark ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-indigo-500 bg-indigo-50 text-indigo-700')
          : (isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Icon size={16} />
    </button>
  );
});
