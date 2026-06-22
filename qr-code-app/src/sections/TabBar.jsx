import { memo } from 'react';
import { Link, Type, UserSquare2, Mail, Wifi, Calendar, Bitcoin, Smartphone, Layers } from 'lucide-react';
import { useTheme } from '../hooks';
import { cx } from '../ui-components';

const ICON_MAP = { Link, Type, UserSquare2, Mail, Wifi, Calendar, Bitcoin, Smartphone, Layers };

export const TabBar = memo(function TabBar({ activeTab, onChange }) {
  const { isDark, glass, textMuted } = useTheme();
  
  const tabs = [
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

  return (
    <section className={cx('rounded-2xl border p-1.5 flex overflow-x-auto gap-1 no-scrollbar', glass)} role="tablist" aria-label="QR code type">
      {tabs.map((t) => {
        const TabIcon = ICON_MAP[t.icon];
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            onClick={() => onChange(t.id)}
            className={cx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              active
                ? (isDark ? 'bg-white/10 text-white shadow-inner' : 'bg-slate-900 text-white shadow-md')
                : cx(textMuted, isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100 hover:text-slate-900')
            )}
          >
            <TabIcon size={16} aria-hidden="true" />
            {t.label}
          </button>
        );
      })}
    </section>
  );
});