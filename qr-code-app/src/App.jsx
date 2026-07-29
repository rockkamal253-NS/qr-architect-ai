import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { QrCode } from 'lucide-react';
import { useStore, DEFAULT_INPUTS, DEFAULT_DESIGN } from './store';
import { useScriptLoader, useQR, useToast, ToastProvider, useHotkeys, ThemeContext, useContentHash, useTheme } from './hooks.jsx';
import { FORMATTERS, validate, encodeState, decodeState, uid, getInitialsSvg, getAvatar, computeSha256, injectSvgHashComment, compressLogo } from './constants.js';
import { cx } from './ui-components.jsx';
import { HeaderBar } from './sections/HeaderBar';
import { AIEngine } from './sections/AIEngine';
import { TabBar } from './sections/TabBar';
import { ContentEditor } from './sections/ContentEditor';
import { Designer } from './sections/Designer';
import { PreviewPanel } from './sections/PreviewPanel';
import { HistoryDrawer } from './sections/HistoryDrawer';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js';

/* ─── Verification Modal (Full 64-character SHA-256 Hash Comparison) ─── */
function VerificationModal({ open, onClose, currentHash, currentPrefix }) {
  const { isDark, textDim } = useTheme();
  const [scannedInput, setScannedInput] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onVerify = useCallback(async () => {
    if (!scannedInput.trim()) return;
    setLoading(true);
    const { fullHash, prefix } = await computeSha256(scannedInput.trim());
    const isMatch = fullHash.length > 0 && fullHash === currentHash;
    setScannedResult({ fullHash, prefix, isMatch });
    setLoading(false);
  }, [scannedInput, currentHash]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm toast-in">
      <div className={cx('w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative space-y-5',
        isDark ? 'bg-[#0b0f1e] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900')}>
        
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">Integrity Verification</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">✕</button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] block mb-1', textDim)}>Target Hash Prefix</label>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              #{currentPrefix}
            </span>
          </div>

          <div>
            <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] block mb-1', textDim)}>Full SHA-256 Fingerprint (64 chars)</label>
            <div className="p-2.5 rounded-xl border bg-black/30 font-mono text-[11px] break-all border-white/10 text-slate-300">
              {currentHash || 'Computing hash…'}
            </div>
          </div>

          <div>
            <label className={cx('text-[10px] font-mono uppercase tracking-[0.2em] block mb-1', textDim)}>Paste Scanned Content / Payload</label>
            <textarea
              rows={3}
              value={scannedInput}
              onChange={(e) => setScannedInput(e.target.value)}
              placeholder="Paste exact scanned QR code text or URL to verify integrity..."
              className={cx('w-full rounded-xl border p-3 font-mono text-xs outline-none transition',
                isDark ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500')}
            />
          </div>

          <button
            onClick={onVerify}
            disabled={loading || !scannedInput.trim()}
            className="w-full py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition shadow-md"
          >
            {loading ? 'Computing Hash…' : 'Verify SHA-256 Hash Integrity'}
          </button>

          {scannedResult && (
            <div className={cx('p-4 rounded-2xl border toast-in space-y-2',
              scannedResult.isMatch
                ? (isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800')
                : (isDark ? 'bg-red-950/40 border-red-500/30 text-red-300' : 'bg-red-50 border-red-300 text-red-800'))}>
              <div className="flex items-center gap-2 font-semibold">
                {scannedResult.isMatch ? '✅ INTEGRITY VERIFIED (100% Match)' : '❌ HASH MISMATCH (Content differs)'}
              </div>
              <div className="font-mono text-[10px] break-all opacity-90">
                Scanned: {scannedResult.fullHash}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Bio Viewer (for social profile QR scans) ─── */
function BioViewer({ hash }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const b64 = hash.slice(5);
      // FIXED: Use TextDecoder instead of deprecated escape
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      setData(JSON.parse(json));
    } catch (e) {
      console.error('Failed to parse bio hash', e);
    }
  }, [hash]);

  if (!data) return <div className="flex items-center justify-center min-h-screen text-slate-500 font-sans">Invalid or missing bio link</div>;

  const links = [
    data.fb && { name: 'Facebook', url: data.fb, c: '#1877F2' },
    data.wa && { name: 'WhatsApp', url: `https://wa.me/${data.wa.replace(/\D/g, '')}`, c: '#25D366' },
    data.ig && { name: 'Instagram', url: `https://instagram.com/${data.ig.replace('@', '')}`, c: '#E4405F' },
    data.x && { name: 'X', url: `https://x.com/${data.x.replace('@', '')}`, c: '#000000' },
    data.in && { name: 'LinkedIn', url: data.in, c: '#0077b5' },
    data.yt && { name: 'YouTube', url: data.yt, c: '#FF0000' },
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-slate-50 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl flex flex-col items-center">
        {data.av ? (
          <img
            src={getAvatar(data.av) || ''}
            alt="Avatar"
            className="w-28 h-28 md:w-32 md:h-32 rounded-full mb-4 border-4 border-white shadow-xl object-cover ring-4 ring-indigo-500/20 shadow-indigo-500/10 transition-transform hover:scale-105"
            style={{ imageRendering: 'auto' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold mb-4 uppercase shadow-xl ring-4 ring-indigo-500/20">
            {(data.n || '✨').charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2 text-center">{data.n || 'My Links'}</h1>
        {data.b && <p className="text-slate-500 text-center mb-8 whitespace-pre-wrap">{data.b}</p>}

        <div className="w-full flex flex-col gap-3">
          {links.map((l, idx) => (
            <a key={idx} href={l.url} style={{ background: l.c }} 
              className="flex items-center p-4 rounded-xl text-white font-semibold transition-transform hover:-translate-y-1 hover:brightness-110 shadow-md">
              <div className="flex-grow text-center">{l.name}</div>
            </a>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-8 text-xs font-medium text-slate-400">Powered by QR Architect AI</div>
    </div>
  );
}

/* ─── Main App ─── */
function AppInner() {
  const store = useStore();
  const toast = useToast();
  const aiInputRef = useRef(null);
  const [workspaceMode, setWorkspaceMode] = useState('content'); // 'content' | 'design' | 'ai'
  const [copyState, setCopyState] = useState('idle');
  const [historyOpen, setHistoryOpen] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const scriptState = useScriptLoader(CDN_URL, 'QRCodeStyling');

  const qrData = useMemo(() => FORMATTERS[store.activeTab](store.inputs), [store.activeTab, store.inputs]);
  const validation = useMemo(() => validate[store.activeTab](store.inputs), [store.activeTab, store.inputs]);

  // Requirement: Debounced SHA-256 Content Hash over NFC-normalized string payload
  const { fullHash, hashPrefix } = useContentHash(qrData, 280);

  const effectiveDesign = useMemo(() => {
    if (store.activeTab === 'vcard' && !store.design.logoUrl) {
      return { ...store.design, logoUrl: getInitialsSvg(store.inputs.firstName, store.inputs.lastName) };
    }
    return store.design;
  }, [store.design, store.activeTab, store.inputs.firstName, store.inputs.lastName]);

  const { containerRef: desktopContainerRef, instance: desktopInstance, bufferSize: desktopBufferSize } = useQR({ 
    scriptReady: scriptState === 'ready', 
    data: qrData, 
    design: effectiveDesign 
  });

  const { containerRef: mobileContainerRef, instance: mobileInstance } = useQR({ 
    scriptReady: scriptState === 'ready', 
    data: qrData, 
    design: effectiveDesign 
  });

  // Load from URL hash on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash.length > 1 && !window.location.hash.startsWith('#bio:')) {
      const decoded = decodeState(window.location.hash.slice(1));
      if (decoded?.inputs && decoded?.design) {
        store.setInputs(decoded.inputs);
        store.setDesignObj(decoded.design);
        if (decoded.tab) store.setTab(decoded.tab);
        toast.info('Restored from shared link');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const onInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    store.pushUndo();
    store.setInput(name, type === 'checkbox' ? checked : value);
  }, [store]);

  const onDesignChange = useCallback((name, value) => {
    store.pushUndo();
    store.setDesign(name, value);
  }, [store]);

  const onApplyPreset = useCallback((p) => {
    store.pushUndo();
    store.applyPreset(p);
    toast.info(`Applied "${p.name}" preset`);
  }, [store, toast]);

  const onLogoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info('Optimizing logo...');
      const { dataUrl } = await compressLogo(file);
      store.pushUndo();
      store.setDesign('logoUrl', dataUrl);
      toast.success('Logo uploaded & optimized');
    } catch (err) {
      console.error('Logo processing failed:', err);
      toast.error('Failed to process logo image');
    }
  }, [store, toast]);

  // Requirement: Redact Wi-Fi passwords in history for privacy & shoulder-surfing prevention
  const addToHistory = useCallback(() => {
    const isWifi = store.activeTab === 'wifi';
    const redactedInputs = isWifi ? { ...store.inputs, password: '' } : store.inputs;
    const redactedData = isWifi ? qrData.replace(/P:[^;]*;/g, 'P:********;') : qrData;

    const item = {
      id: uid(),
      timestamp: Date.now(),
      tab: store.activeTab,
      data: redactedData,
      inputs: redactedInputs,
      design: store.design,
    };
    store.addHistory(item);
  }, [store, qrData]);

  const onRestoreHistory = useCallback((item) => {
    store.restoreFromHistory(item);
    if (item.tab === 'wifi') {
      toast.info('Restored Wi-Fi settings (password excluded for privacy)');
    } else {
      toast.success('Restored from history');
    }
  }, [store, toast]);

  // Requirement: Dedicated SVG QRCodeStyling instance to guarantee all 3 corner patterns are unclipped & fully visible
  const onDownload = useCallback(async (ext) => {
    const activeInstance = desktopInstance.current || mobileInstance.current;
    if (!activeInstance || scriptState !== 'ready') return;
    try {
      const fileName = `qr-${hashPrefix || '00000000'}`;
      if (ext === 'svg') {
        const targetSize = store.design.size || 300;
        const targetMargin = store.design.margin || 12;

        // Instantiate dedicated SVG generator with matched targetSize and targetMargin
        const svgOptions = {
          width: targetSize,
          height: targetSize,
          data: qrData || ' ',
          margin: targetMargin,
          image: store.design.logoUrl || undefined,
          qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
          imageOptions: { hideBackgroundDots: true, imageSize: 0.38, margin: 12 },
          dotsOptions: {
            type: store.design.dotsType,
            ...(store.design.isGradient
              ? {
                gradient: {
                  type: store.design.gradientType,
                  colorStops: [
                    { offset: 0, color: store.design.dotsColor },
                    { offset: 1, color: store.design.dotsColor2 }
                  ]
                }
              }
              : { color: store.design.dotsColor }),
          },
          backgroundOptions: { color: store.design.backgroundColor },
          cornersSquareOptions: { type: store.design.cornersSquareType, color: store.design.cornersSquareColor },
          cornersDotOptions: { type: store.design.cornersDotType, color: store.design.cornersDotColor },
        };

        const svgInstance = new window.QRCodeStyling(svgOptions);
        const rawBlob = await svgInstance.getRawData('svg');
        const svgText = await rawBlob.text();

        const commentInjected = injectSvgHashComment(svgText, fullHash);
        const blob = new Blob([commentInjected], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.svg`;
        link.click();
      } else {
        activeInstance.download({ extension: ext, name: fileName });
      }
      addToHistory();
      store.incrementStats();
      toast.success(`Exported as ${ext.toUpperCase()} (${fileName})`);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
  }, [desktopInstance, mobileInstance, scriptState, hashPrefix, fullHash, toast, addToHistory, store, qrData]);

  const onCopy = useCallback(async () => {
    const activeInstance = desktopInstance.current || mobileInstance.current;
    if (!activeInstance || scriptState !== 'ready') return;
    setCopyState('copying');
    try {
      const canvas = activeInstance._canvas?.nodeName === 'CANVAS'
        ? activeInstance._canvas
        : (desktopContainerRef.current?.querySelector('canvas') || mobileContainerRef.current?.querySelector('canvas'));
      if (!canvas) throw new Error('Canvas not found');
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Clipboard API unavailable');
      const blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopyState('copied');
      addToHistory();
      toast.success('QR copied to clipboard');
      setTimeout(() => setCopyState('idle'), 1800);
    } catch (err) {
      console.error(err);
      setCopyState('error');
      toast.error('Clipboard unavailable');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [desktopInstance, mobileInstance, scriptState, toast, addToHistory]);

  const onShare = useCallback(async () => {
    let safeInputs = { ...store.inputs };
    if (store.activeTab === 'wifi') safeInputs.password = '';
    let safeDesign = { ...store.design };
    if (safeDesign.logoUrl && safeDesign.logoUrl.length > 2000) safeDesign.logoUrl = '';
    const snapshot = { inputs: safeInputs, design: safeDesign, tab: store.activeTab };
    const hash = encodeState(snapshot);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shareable link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }, [store, toast]);

  const hotkeys = useMemo(() => ({
    'mod+k': () => aiInputRef.current?.focus(),
    'mod+/': () => store.toggleDark(),
  }), [store]);
  useHotkeys(hotkeys);

  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey) return;
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); onCopy(); }
      if (e.key.toLowerCase() === 'd') { e.preventDefault(); onDownload('png'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCopy, onDownload]);

  const theme = useMemo(() => ({
    isDark: store.isDark,
    glass: store.isDark
      ? 'bg-white/[0.04] border-white/10 backdrop-blur-xl'
      : 'bg-white border-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_32px_-8px_rgba(15,23,42,0.12)]',
    glassSoft: store.isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#f1f0ec] border-slate-300',
    textMuted: store.isDark ? 'text-slate-400' : 'text-slate-600',
    textDim: store.isDark ? 'text-slate-500' : 'text-slate-500',
    borderSoft: store.isDark ? 'border-white/10' : 'border-slate-300',
  }), [store.isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      <div className={cx('min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300',
        store.isDark ? 'dark text-slate-100' : 'text-slate-900')}>

        <div className={cx('fixed inset-0 -z-10', store.isDark ? 'bg-[#07081a]' : 'bg-[#e8e4dc]')}>
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-3xl mesh-a bg-indigo-600/30" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-3xl mesh-b bg-pink-600/20" />
        </div>

        <HeaderBar
          scriptState={scriptState}
          isDark={store.isDark}
          toggleDark={store.toggleDark}
          onShare={onShare}
          onReset={store.resetAll}
          onHistoryToggle={() => setHistoryOpen(v => !v)}
          historyCount={store.history.length}
          onUndo={store.undo}
          onRedo={store.redo}
          canUndo={store.undoStack.length > 0}
          canRedo={store.redoStack.length > 0}
        />

        <main className="max-w-screen-2xl mx-auto px-6 py-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className={cx('text-[11px] font-mono uppercase tracking-[0.25em] mb-2', theme.textDim)}>
                ◆ Generative QR Studio · <span className="opacity-60">v2.1</span>
              </p>
              <h2 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight">
                Design codes that<span className="italic"> feel </span>like brand.
              </h2>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <p className={cx('max-w-sm text-sm', theme.textMuted)}>
                Eight data types. AI themes. History. Frames. Shareable links. Export anywhere.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className={cx('uppercase tracking-[0.2em]', theme.textDim)}>Editing</span>
                <span className="px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 uppercase tracking-[0.15em]">{store.activeTab}</span>
                <span className={cx('uppercase tracking-[0.2em]', theme.textDim)}>· {qrData.length} chars</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 space-y-6">
              {/* Workspace Mode Switcher */}
              <div className={cx(
                "p-1.5 rounded-2xl border backdrop-blur-xl flex items-center gap-1.5 transition-all shadow-md",
                store.isDark ? "bg-white/[0.04] border-white/10" : "bg-white/90 border-slate-300"
              )}>
                <button
                  onClick={() => setWorkspaceMode('content')}
                  className={cx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all',
                    workspaceMode === 'content'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : store.isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <span>📝 Content & Data</span>
                </button>
                <button
                  onClick={() => setWorkspaceMode('design')}
                  className={cx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all',
                    workspaceMode === 'design'
                      ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md shadow-pink-500/20'
                      : store.isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <span>🎨 Visual Designer</span>
                </button>
                <button
                  onClick={() => setWorkspaceMode('ai')}
                  className={cx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all',
                    workspaceMode === 'ai'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-purple-500/20'
                      : store.isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <span>🪄 AI Assistant</span>
                </button>
              </div>

              {workspaceMode === 'content' && (
                <>
                  <TabBar activeTab={store.activeTab} onChange={store.setTab} />
                  <ContentEditor
                    activeTab={store.activeTab}
                    inputs={store.inputs}
                    onInputChange={onInputChange}
                    validation={validation}
                    qrLen={qrData.length}
                  />
                </>
              )}

              {workspaceMode === 'design' && (
                <Designer
                  design={store.design}
                  onDesignChange={onDesignChange}
                  onApplyPreset={onApplyPreset}
                  onLogoUpload={onLogoUpload}
                />
              )}

              {workspaceMode === 'ai' && (
                <AIEngine
                  design={store.design}
                  onPromptChange={(v) => store.setDesign('aiPrompt', v)}
                  onApplyPatch={store.applyAIPatch}
                  aiState={store.aiState}
                  setAIState={store.setAIState}
                  inputRef={aiInputRef}
                />
              )}
            </div>

            <aside className="hidden xl:block xl:col-span-4 xl:sticky xl:top-24 xl:self-start space-y-4">
              <PreviewPanel
                design={store.design}
                qrData={qrData}
                validation={validation}
                scriptState={scriptState}
                qrRef={desktopContainerRef}
                bufferSize={desktopBufferSize}
                hashPrefix={hashPrefix}
                onDownload={onDownload}
                onCopy={onCopy}
                copyState={copyState}
                onVerifyOpen={() => setVerifyOpen(true)}
              />
            </aside>
          </div>

          <footer className={cx('mt-12 pt-6 border-t', theme.borderSoft)}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className={cx('text-[10px] font-mono uppercase tracking-[0.2em]', theme.textDim)}>
                QR Architect AI · Made to scan, designed to last
              </p>
            </div>
          </footer>
        </main>

        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={store.history}
          onRestore={onRestoreHistory}
          onClear={() => { store.clearHistory(); toast.info('History cleared'); }}
        />

        <VerificationModal
          open={verifyOpen}
          onClose={() => setVerifyOpen(false)}
          currentHash={fullHash}
          currentPrefix={hashPrefix}
        />
      </div>

      <div className="xl:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            const el = document.getElementById('preview-panel-mobile');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 active:scale-95 transition-transform"
          aria-label="Scroll to preview"
        >
          <QrCode size={24} />
        </button>
      </div>
      <div id="preview-panel-mobile" className="xl:hidden px-6 pb-24">
        <PreviewPanel
          design={store.design}
          qrData={qrData}
          validation={validation}
          scriptState={scriptState}
          qrRef={mobileContainerRef}
          bufferSize={desktopBufferSize}
          hashPrefix={hashPrefix}
          onDownload={onDownload}
          onCopy={onCopy}
          copyState={copyState}
          onVerifyOpen={() => setVerifyOpen(true)}
        />
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (hash.startsWith('#bio:')) {
    return <BioViewer hash={hash} />;
  }

  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
