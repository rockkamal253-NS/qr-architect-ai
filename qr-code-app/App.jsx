import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { QrCode } from 'lucide-react';
import { useStore, DEFAULT_INPUTS, DEFAULT_DESIGN } from './store';
import { useScriptLoader, useQR, useToast, ToastProvider, useHotkeys, ThemeContext } from './hooks';
import { FORMATTERS, validate, encodeState, decodeState, uid, getInitialsSvg } from './constants';
import { cx } from './ui-components';
import { HeaderBar } from './sections/HeaderBar';
import { AIEngine } from './sections/AIEngine';
import { TabBar } from './sections/TabBar';
import { ContentEditor } from './sections/ContentEditor';
import { Designer } from './sections/Designer';
import { PreviewPanel } from './sections/PreviewPanel';
import { HistoryDrawer } from './sections/HistoryDrawer';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js';

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
          <img src={data.av} alt="Avatar" className="w-24 h-24 rounded-full mb-4 border-4 border-white shadow-md object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold mb-4 uppercase">
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
  const [copyState, setCopyState] = useState('idle');
  const [historyOpen, setHistoryOpen] = useState(false);

  const scriptState = useScriptLoader(CDN_URL, 'QRCodeStyling');

  const qrData = useMemo(() => FORMATTERS[store.activeTab](store.inputs), [store.activeTab, store.inputs]);
  const validation = useMemo(() => validate[store.activeTab](store.inputs), [store.activeTab, store.inputs]);

  const effectiveDesign = useMemo(() => {
    if (store.activeTab === 'vcard' && !store.design.logoUrl) {
      return { ...store.design, logoUrl: getInitialsSvg(store.inputs.firstName, store.inputs.lastName) };
    }
    return store.design;
  }, [store.design, store.activeTab, store.inputs.firstName, store.inputs.lastName]);

  const { containerRef: desktopContainerRef, instance: desktopInstance } = useQR({ 
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

  const onLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      store.pushUndo();
      store.setDesign('logoUrl', reader.result);
    };
    reader.readAsDataURL(file);
  }, [store, toast]);

  const addToHistory = useCallback(() => {
    const item = {
      id: uid(),
      timestamp: Date.now(),
      tab: store.activeTab,
      data: qrData,
      inputs: store.inputs,
      design: store.design,
    };
    store.addHistory(item);
  }, [store, qrData]);

  const onDownload = useCallback((ext) => {
    const activeInstance = desktopInstance.current || mobileInstance.current;
    if (!activeInstance || scriptState !== 'ready') return;
    try {
      activeInstance.download({ extension: ext, name: `qr-architect-${Date.now()}` });
      addToHistory();
      store.incrementStats();
      toast.success(`Exported as ${ext.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
  }, [desktopInstance, mobileInstance, scriptState, toast, addToHistory, store]);

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
        store.isDark ? 'text-slate-100' : 'text-slate-900')}>

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
              <AIEngine
                design={store.design}
                onPromptChange={(v) => store.setDesign('aiPrompt', v)}
                onApplyPatch={store.applyAIPatch}
                aiState={store.aiState}
                setAIState={store.setAIState}
                inputRef={aiInputRef}
              />
              <TabBar activeTab={store.activeTab} onChange={store.setTab} />
              <ContentEditor
                activeTab={store.activeTab}
                inputs={store.inputs}
                onInputChange={onInputChange}
                validation={validation}
                qrLen={qrData.length}
              />
              <Designer
                design={store.design}
                onDesignChange={onDesignChange}
                onApplyPreset={onApplyPreset}
                onLogoUpload={onLogoUpload}
              />
            </div>

            <aside className="hidden xl:block xl:col-span-4 xl:sticky xl:top-24 xl:self-start space-y-4">
              <PreviewPanel
                design={store.design}
                qrData={qrData}
                validation={validation}
                scriptState={scriptState}
                qrRef={desktopContainerRef}
                onDownload={onDownload}
                onCopy={onCopy}
                copyState={copyState}
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
          onRestore={store.restoreFromHistory}
          onClear={() => { store.clearHistory(); toast.info('History cleared'); }}
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
          onDownload={onDownload}
          onCopy={onCopy}
          copyState={copyState}
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
