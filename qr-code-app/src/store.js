import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/* ─────────────────────────────────────────────────────────────────────────
   DEFAULTS
   ───────────────────────────────────────────────────────────────────────── */

export const DEFAULT_INPUTS = {
  url: 'https://qr-architect.ai',
  text: '',
  socialName: '', socialBio: '', socialFacebook: '', socialWhatsapp: '',
  socialInstagram: '', socialTwitter: '', socialLinkedin: '', socialYoutube: '', socialAvatar: '',
  email: '', subject: '', body: '',
  ssid: '', password: '', encryption: 'WPA', hidden: false,
  firstName: '', lastName: '', company: '', jobTitle: '',
  workPhone: '', cellPhone: '', website: '',
  street: '', city: '', state: '', zip: '', country: '',
  iosUrl: '', androidUrl: '',
  coin: 'bitcoin', address: '', amount: '',
  summary: '', location: '', description: '',
  utmSource: '', utmMedium: '', utmCampaign: '',
};

export const DEFAULT_DESIGN = {
  dotsColor: '#6366f1', dotsColor2: '#ec4899',
  isGradient: true, gradientType: 'linear', dotsType: 'rounded',
  cornersSquareColor: '#6366f1', cornersSquareType: 'extra-rounded',
  cornersDotColor: '#ec4899', cornersDotType: 'dot',
  backgroundColor: '#ffffff',
  margin: 12, size: 300,
  logoUrl: '', aiPrompt: '', frameText: '',
};

export const TABS = [
  { id: 'url', label: 'Link', icon: 'Link' },
  { id: 'social', label: 'Social', icon: 'Layers' },
  { id: 'vcard', label: 'Contact', icon: 'UserSquare2' },
  { id: 'appstore', label: 'App', icon: 'Smartphone' },
  { id: 'email', label: 'Email', icon: 'Mail' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'Wifi' },
  { id: 'crypto', label: 'Crypto', icon: 'Bitcoin' },
  { id: 'event', label: 'Event', icon: 'Calendar' },
  { id: 'text', label: 'Text', icon: 'Type' },
];

/* ─────────────────────────────────────────────────────────────────────────
   STORE
   ───────────────────────────────────────────────────────────────────────── */

export const useStore = create(
  immer(
    persist(
      (set, get) => ({
        // State
        isDark: true,
        activeTab: 'url',
        inputs: { ...DEFAULT_INPUTS },
        design: { ...DEFAULT_DESIGN },
        history: [],
        stats: { totalGenerations: 0 },
        aiState: { status: 'idle', message: '', confidence: 0, key: null },

        // Actions
        setDark: (v) => set({ isDark: v }),
        toggleDark: () => set((state) => { state.isDark = !state.isDark; }),

        setTab: (tab) => set({ activeTab: tab }),

        setInput: (name, value) => set((state) => {
          state.inputs[name] = value;
        }),

        setInputs: (inputs) => set({ inputs }),

        setDesign: (name, value) => set((state) => {
          state.design[name] = value;
        }),

        setDesignObj: (design) => set({ design }),

        applyPreset: (preset) => set((state) => {
          state.design.dotsColor = preset.dots;
          state.design.dotsColor2 = preset.dots2;
          state.design.cornersSquareColor = preset.corners;
          state.design.cornersDotColor = preset.corners;
          state.design.backgroundColor = preset.bg;
          state.design.dotsType = preset.type;
          state.design.isGradient = preset.dots !== preset.dots2;
        }),

        applyAIPatch: (patch) => set((state) => {
          Object.assign(state.design, patch);
        }),

        setAIState: (aiState) => set({ aiState }),

        addHistory: (item) => set((state) => {
          state.history = [item, ...state.history.filter((h) => h.data !== item.data)].slice(0, 20);
        }),

        clearHistory: () => set({ history: [] }),

        restoreFromHistory: (item) => set((state) => {
          state.inputs = item.inputs;
          state.design = item.design;
          state.activeTab = item.tab;
        }),

        incrementStats: () => set((state) => {
          state.stats.totalGenerations += 1;
        }),

        resetAll: () => {
          // Clear avatar storage on full reset
          try {
            Object.keys(localStorage)
              .filter(k => k.startsWith('qr:avatar:'))
              .forEach(k => localStorage.removeItem(k));
          } catch { /* ignore */ }
          set({
            inputs: { ...DEFAULT_INPUTS },
            design: { ...DEFAULT_DESIGN },
            activeTab: 'url',
          });
        },

        // Undo/Redo
        undoStack: [],
        redoStack: [],

        pushUndo: () => set((state) => {
          state.undoStack.push({
            inputs: { ...state.inputs },
            design: { ...state.design },
            activeTab: state.activeTab,
          });
          if (state.undoStack.length > 50) state.undoStack.shift();
          state.redoStack = [];
        }),

        undo: () => set((state) => {
          if (state.undoStack.length === 0) return;
          const current = {
            inputs: { ...state.inputs },
            design: { ...state.design },
            activeTab: state.activeTab,
          };
          const previous = state.undoStack.pop();
          state.redoStack.push(current);
          state.inputs = previous.inputs;
          state.design = previous.design;
          state.activeTab = previous.activeTab;
        }),

        redo: () => set((state) => {
          if (state.redoStack.length === 0) return;
          const current = {
            inputs: { ...state.inputs },
            design: { ...state.design },
            activeTab: state.activeTab,
          };
          const next = state.redoStack.pop();
          state.undoStack.push(current);
          state.inputs = next.inputs;
          state.design = next.design;
          state.activeTab = next.activeTab;
        }),
      }),
      {
        name: 'qr-architect-v2',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          isDark: state.isDark,
          activeTab: state.activeTab,
          inputs: state.inputs,
          design: state.design,
          history: state.history.slice(0, 8),
          stats: state.stats,
        }),
      }
    )
  )
);
