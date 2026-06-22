import { memo, useState } from 'react';
import { Link, Type, UserSquare2, Mail, Wifi, Calendar, Bitcoin, Smartphone, Layers, Globe, MessageCircle, Camera, MessageSquare, Briefcase, Video, User, Upload, Building2, MapPin, Phone, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTheme } from '../hooks';
import { Field, Pill, cx } from '../ui-components';
import { TABS } from '../store';

const ICON_MAP = { Link, Type, UserSquare2, Mail, Wifi, Calendar, Bitcoin, Smartphone, Layers };

// Tab field components
const UrlFields = memo(function UrlFields({ inputs, onChange }) {
  return (
    <>
      <Field label="Landing page URL" name="url" placeholder="https://your-brand.com" icon={Globe} colSpan={2}
        value={inputs.url} onChange={onChange} />
      <div className="md:col-span-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Analytics (UTM)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Source" name="utmSource" placeholder="newsletter" value={inputs.utmSource} onChange={onChange} />
          <Field label="Medium" name="utmMedium" placeholder="email" value={inputs.utmMedium} onChange={onChange} />
          <Field label="Campaign" name="utmCampaign" placeholder="spring_sale" value={inputs.utmCampaign} onChange={onChange} />
        </div>
      </div>
    </>
  );
});

const TextFields = memo(function TextFields({ inputs, onChange }) {
  return (
    <Field label="Message" name="text" placeholder="Any text up to 2,953 characters…" multiline colSpan={2}
      value={inputs.text} onChange={onChange} maxLength={2953} />
  );
});

const EmailFields = memo(function EmailFields({ inputs, onChange }) {
  return (
    <>
      <Field label="Recipient" name="email" placeholder="hello@company.com" icon={Mail} value={inputs.email} onChange={onChange} />
      <Field label="Subject" name="subject" placeholder="Inquiry" icon={Type} value={inputs.subject} onChange={onChange} />
      <Field label="Body" name="body" placeholder="Hi there…" multiline colSpan={2} value={inputs.body} onChange={onChange} />
    </>
  );
});

const WifiFields = memo(function WifiFields({ inputs, onChange }) {
  const { textMuted } = useTheme();
  return (
    <>
      <Field label="Network name (SSID)" name="ssid" placeholder="Office_Guest" icon={Wifi} value={inputs.ssid} onChange={onChange} />
      <Field label="Password" name="password" type="password" placeholder="••••••••" value={inputs.password} onChange={onChange} />
      <Field label="Encryption" name="encryption" value={inputs.encryption} onChange={onChange}
        options={[
          { label: 'WPA / WPA2', value: 'WPA' },
          { label: 'WEP', value: 'WEP' },
          { label: 'None (open)', value: 'nopass' },
        ]} />
      <div className="flex items-center gap-2 mt-7">
        <input type="checkbox" id="hidden" name="hidden" checked={inputs.hidden} onChange={onChange}
          className="w-4 h-4 rounded accent-indigo-500" />
        <label htmlFor="hidden" className={cx('text-sm', textMuted)}>Hidden network</label>
      </div>
    </>
  );
});

const VcardFields = memo(function VcardFields({ inputs, onChange }) {
  return (
    <>
      <Field label="First name" name="firstName" placeholder="Alex" value={inputs.firstName} onChange={onChange} />
      <Field label="Last name" name="lastName" placeholder="Vance" value={inputs.lastName} onChange={onChange} />
      <Field label="Company" name="company" placeholder="Acme Studio" icon={Building2} value={inputs.company} onChange={onChange} />
      <Field label="Job title" name="jobTitle" placeholder="Creative Director" icon={Briefcase} value={inputs.jobTitle} onChange={onChange} />
      <Field label="Work phone" name="workPhone" placeholder="+1 555 0100" icon={Phone} value={inputs.workPhone} onChange={onChange} />
      <Field label="Mobile" name="cellPhone" placeholder="+1 555 0199" icon={Smartphone} value={inputs.cellPhone} onChange={onChange} />
      <Field label="Email" name="email" placeholder="alex@acme.co" icon={Mail} value={inputs.email} onChange={onChange} />
      <Field label="Website" name="website" placeholder="https://acme.co" icon={Globe} value={inputs.website} onChange={onChange} />
      <Field label="Street" name="street" placeholder="123 Market St" icon={MapPin} colSpan={2} value={inputs.street} onChange={onChange} />
      <Field label="City" name="city" placeholder="Brooklyn" value={inputs.city} onChange={onChange} />
      <Field label="State / Region" name="state" placeholder="NY" value={inputs.state} onChange={onChange} />
      <Field label="Postal code" name="zip" placeholder="11201" value={inputs.zip} onChange={onChange} />
      <Field label="Country" name="country" placeholder="USA" value={inputs.country} onChange={onChange} />
    </>
  );
});

const AppstoreFields = memo(function AppstoreFields({ inputs, onChange }) {
  const { isDark, textMuted, borderSoft, glassSoft } = useTheme();
  return (
    <>
      <Field label="iOS / App Store URL" name="iosUrl" placeholder="https://apps.apple.com/..." icon={Smartphone} value={inputs.iosUrl} onChange={onChange} />
      <Field label="Android / Play Store URL" name="androidUrl" placeholder="https://play.google.com/..." icon={Smartphone} value={inputs.androidUrl} onChange={onChange} />
      <div className={cx('md:col-span-2 rounded-xl border px-4 py-3 text-xs flex items-start gap-2', borderSoft, glassSoft, textMuted)}>
        <ShieldCheck size={14} className={cx('mt-0.5 shrink-0', isDark ? 'text-indigo-400' : 'text-indigo-600')} />
        <span>Enter both URLs to auto-enable a smart redirect — iOS users land in the App Store, Android users in Play.</span>
      </div>
      <div className="md:col-span-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Analytics (UTM)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Source" name="utmSource" placeholder="newsletter" value={inputs.utmSource} onChange={onChange} />
          <Field label="Medium" name="utmMedium" placeholder="email" value={inputs.utmMedium} onChange={onChange} />
          <Field label="Campaign" name="utmCampaign" placeholder="spring_sale" value={inputs.utmCampaign} onChange={onChange} />
        </div>
      </div>
    </>
  );
});

const CryptoFields = memo(function CryptoFields({ inputs, onChange }) {
  return (
    <>
      <Field label="Currency" name="coin" value={inputs.coin} onChange={onChange}
        options={[
          { label: 'Bitcoin (BTC)', value: 'bitcoin' },
          { label: 'Ethereum (ETH)', value: 'ethereum' },
          { label: 'Litecoin (LTC)', value: 'litecoin' },
        ]} />
      <Field label="Amount (optional)" name="amount" placeholder="0.001" value={inputs.amount} onChange={onChange} />
      <Field label="Wallet address" name="address"
        placeholder={inputs.coin === 'ethereum' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2' : 'bc1q...'}
        icon={Bitcoin} colSpan={2} value={inputs.address} onChange={onChange} />
    </>
  );
});

const EventFields = memo(function EventFields({ inputs, onChange }) {
  return (
    <>
      <Field label="Event title" name="summary" placeholder="Product Launch" icon={Calendar} value={inputs.summary} onChange={onChange} />
      <Field label="Location" name="location" placeholder="Brooklyn Navy Yard" icon={MapPin} value={inputs.location} onChange={onChange} />
      <Field label="Description" name="description" placeholder="Details attendees should know…" multiline colSpan={2} value={inputs.description} onChange={onChange} />
    </>
  );
});

const SocialFields = memo(function SocialFields({ inputs, onChange }) {
  const { isDark, textMuted } = useTheme();

  const [avatarSize, setAvatarSize] = useState(0);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Max 5MB before compression.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Compress to 64x64 with lower quality for QR compatibility
        const canvas = document.createElement('canvas');
        const targetSize = 64; // Smaller = less data
        canvas.width = targetSize; 
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        // Center crop
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, targetSize, targetSize);

        // Compress aggressively: JPEG quality 0.4
        const b64 = canvas.toDataURL('image/jpeg', 0.4);

        // Check size - if still too big, compress more
        const sizeKB = Math.round(b64.length / 1024);
        setAvatarSize(sizeKB);

        if (sizeKB > 8) {
          // Re-compress with even lower quality
          const b64Small = canvas.toDataURL('image/jpeg', 0.2);
          setAvatarSize(Math.round(b64Small.length / 1024));
          onChange({ target: { name: 'socialAvatar', value: b64Small } });
        } else {
          onChange({ target: { name: 'socialAvatar', value: b64 } });
        }
      };
      img.onerror = () => alert('Failed to load image');
      img.src = event.target.result;
    };
    reader.onerror = () => alert('Failed to read file');
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="md:col-span-2 flex items-center gap-4 mb-2">
        <div className={cx('w-16 h-16 rounded-full shrink-0 flex items-center justify-center border-2 overflow-hidden',
          isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
          inputs.socialAvatar ? '' : textMuted)}>
          {inputs.socialAvatar ? <img src={inputs.socialAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={24} />}
        </div>
        <div>
          <label className={cx(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition cursor-pointer',
            isDark ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
          )}>
            <Upload size={16} />
            Upload Profile Photo
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          {inputs.socialAvatar && (
            <button onClick={() => onChange({ target: { name: 'socialAvatar', value: '' } })}
              className={cx('ml-2 text-xs font-medium px-3 py-2 rounded-xl transition',
                isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')}>
              Remove
            </button>
          )}
        </div>
      </div>
      <Field label="Page Title / Name" name="socialName" placeholder="John Doe" colSpan={2} value={inputs.socialName} onChange={onChange} />
      <Field label="Bio / Description" name="socialBio" placeholder="Short description about you..." multiline colSpan={2} value={inputs.socialBio} onChange={onChange} />
      <Field label="Facebook Profile" name="socialFacebook" icon={Globe} placeholder="https://facebook.com/..." value={inputs.socialFacebook} onChange={onChange} />
      <Field label="WhatsApp Number" name="socialWhatsapp" icon={MessageCircle} placeholder="1234567890" value={inputs.socialWhatsapp} onChange={onChange} />
      <Field label="Instagram Username" name="socialInstagram" icon={Camera} placeholder="@username" value={inputs.socialInstagram} onChange={onChange} />
      <Field label="X (Twitter) Username" name="socialTwitter" icon={MessageSquare} placeholder="@username" value={inputs.socialTwitter} onChange={onChange} />
      <Field label="LinkedIn URL" name="socialLinkedin" icon={Briefcase} placeholder="https://linkedin.com/in/..." value={inputs.socialLinkedin} onChange={onChange} />
      <Field label="YouTube URL" name="socialYoutube" icon={Video} placeholder="https://youtube.com/..." value={inputs.socialYoutube} onChange={onChange} />
    </>
  );
});

const TAB_FIELDS = {
  url: UrlFields,
  text: TextFields,
  email: EmailFields,
  wifi: WifiFields,
  vcard: VcardFields,
  appstore: AppstoreFields,
  crypto: CryptoFields,
  event: EventFields,
  social: SocialFields,
};

export const ContentEditor = memo(function ContentEditor({ activeTab, inputs, onInputChange, validation, qrLen }) {
  const { isDark, glass, borderSoft, textMuted } = useTheme();
  const ActiveIcon = ICON_MAP[TABS.find(t => t.id === activeTab)?.icon] || Link;
  const TabComponent = TAB_FIELDS[activeTab];
  const ValIcon = validation.state === 'valid' ? Check : validation.state === 'invalid' ? AlertCircle : ShieldCheck;

  return (
    <section className={cx('rounded-3xl border grain overflow-hidden', glass)}>
      <div className={cx('px-8 py-5 flex items-center justify-between border-b', borderSoft)}>
        <div className="flex items-center gap-3">
          <div className={cx('p-2 rounded-xl', isDark ? 'bg-white/5' : 'bg-slate-900 text-white')}>
            <ActiveIcon size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold capitalize">
              {activeTab === 'appstore' ? 'App store link' : activeTab} content
            </h3>
            <p className={cx('text-xs', textMuted)}>Payload compiled to {qrLen} characters</p>
          </div>
        </div>
        <div className="hidden md:block">
          <Pill tone={validation.state} icon={ValIcon}>{validation.message}</Pill>
        </div>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <TabComponent inputs={inputs} onChange={onInputChange} />
        </div>
        <div className="md:hidden mt-2">
          <Pill tone={validation.state} icon={ValIcon}>{validation.message}</Pill>
        </div>
      </div>
    </section>
  );
});
