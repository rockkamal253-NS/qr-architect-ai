/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS, VALIDATORS & FORMATTERS
   ═══════════════════════════════════════════════════════════════════════════ */

import DOMPurify from 'dompurify';

/* ─── URL Helpers ─── */
export const appendUTM = (baseStr, d) => {
  if (!baseStr || (!d.utmSource && !d.utmMedium && !d.utmCampaign)) return baseStr;
  try {
    const u = new URL(baseStr);
    if (d.utmSource) u.searchParams.set('utm_source', d.utmSource);
    if (d.utmMedium) u.searchParams.set('utm_medium', d.utmMedium);
    if (d.utmCampaign) u.searchParams.set('utm_campaign', d.utmCampaign);
    return u.toString();
  } catch { return baseStr; }
};

/* ─── Sanitization ─── */
export const sanitize = (input) => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

export const sanitizeUrl = (url) => {
  if (!url) return '';
  const clean = sanitize(url);
  // Block javascript: and data: URLs for security
  if (/^(javascript|data|vbscript):/i.test(clean)) return '';
  return clean;
};

/* ─── Formatters ─── */
export const FORMATTERS = {
  url: (d) => {
    let urlStr = sanitizeUrl(d.url) || 'https://example.com';
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      urlStr = 'https://' + urlStr;
    }
    return appendUTM(urlStr, d);
  },

  text: (d) => sanitize(d.text) || 'Enter text to generate a QR code.',

  email: (d) => {
    const email = sanitize(d.email);
    const subject = encodeURIComponent(sanitize(d.subject));
    const body = encodeURIComponent(sanitize(d.body));
    return `mailto:${email}?subject=${subject}&body=${body}`;
  },

  wifi: (d) => {
    const ssid = sanitize(d.ssid);
    const password = sanitize(d.password);
    const encryption = sanitize(d.encryption) || 'WPA';
    const hidden = d.hidden ? 'true' : 'false';
    return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
  },

  vcard: (d) => {
    const lines = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `N:${sanitize(d.lastName)};${sanitize(d.firstName)};;;`,
      `FN:${((sanitize(d.firstName) + ' ' + sanitize(d.lastName))).trim()}`,
    ];
    if (d.company) lines.push(`ORG:${sanitize(d.company)}`);
    if (d.jobTitle) lines.push(`TITLE:${sanitize(d.jobTitle)}`);
    if (d.workPhone) lines.push(`TEL;TYPE=work,voice:${sanitize(d.workPhone)}`);
    if (d.cellPhone) lines.push(`TEL;TYPE=cell,voice:${sanitize(d.cellPhone)}`);
    if (d.email) lines.push(`EMAIL;TYPE=work,internet:${sanitize(d.email)}`);
    if (d.website) lines.push(`URL:${sanitizeUrl(d.website)}`);
    if (d.street || d.city || d.state || d.zip || d.country) {
      lines.push(`ADR;TYPE=work:;;${sanitize(d.street)};${sanitize(d.city)};${sanitize(d.state)};${sanitize(d.zip)};${sanitize(d.country)}`);
    }
    lines.push('END:VCARD');
    return lines.filter(Boolean).join('\n');
  },

  appstore: (d) => {
    const ios = sanitizeUrl(d.iosUrl);
    const android = sanitizeUrl(d.androidUrl);
    if (ios && android) {
      const html = `<!doctype html><meta name=viewport content="width=device-width"><script>
var u=navigator.userAgent;
if(/android/i.test(u))location.replace(${JSON.stringify(android)});
else if(/iphone|ipad|ipod/i.test(u))location.replace(${JSON.stringify(ios)});
else document.write('<h3>Open on mobile</h3><p><a href=${JSON.stringify(ios)}>iOS</a> · <a href=${JSON.stringify(android)}>Android</a></p>');
</script>`;
      return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    }
    return ios || android || 'https://apps.apple.com';
  },

  crypto: (d) => {
    const addr = sanitize(d.address).trim();
    const amt = sanitize(d.amount).trim();
    if (!addr) return '';
    if (d.coin === 'ethereum') return `ethereum:${addr}${amt ? `?value=${amt}` : ''}`;
    return `${d.coin}:${addr}${amt ? `?amount=${amt}` : ''}`;
  },

  event: (d) => {
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `SUMMARY:${sanitize(d.summary) || 'New Event'}`,
    ];
    if (d.location) lines.push(`LOCATION:${sanitize(d.location)}`);
    if (d.description) lines.push(`DESCRIPTION:${sanitize(d.description)}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.filter(Boolean).join('\n');
  },

  // FIXED: Social profile formatter - uses modern encoding, no deprecated APIs
  social: (d) => {
    // FIXED: Don't embed avatar base64 in QR - store separately, reference by key
    const avatarKey = d.socialAvatar ? storeAvatar(d.socialAvatar) : '';

    const payload = {
      n: sanitize(d.socialName),
      b: sanitize(d.socialBio),
      fb: sanitizeUrl(d.socialFacebook),
      wa: sanitize(d.socialWhatsapp),
      ig: sanitize(d.socialInstagram),
      x: sanitize(d.socialTwitter),
      in: sanitizeUrl(d.socialLinkedin),
      yt: sanitizeUrl(d.socialYoutube),
      av: avatarKey, // Store key, not image data
    };

    try {
      const jsonStr = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(jsonStr);
      const base64 = btoa(String.fromCharCode(...bytes));
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}/#bio:${base64}`;
    } catch (e) {
      console.error('Social encoding failed:', e);
      return '';
    }
  },
};

/* ─── Regex Patterns ─── */
export const RE = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  btc: /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  ltc: /^(ltc1[a-z0-9]{25,62}|[LM3][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  url: /^https?:\/\/.+/i,
  phone: /^[+]?[\d\s\-()]{7,20}$/,
};

/* ─── Validators ─── */
export const validate = {
  url: (d) => {
    if (!d.url) return { state: 'idle', message: 'Enter a URL' };
    try {
      let urlStr = d.url;
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = 'https://' + urlStr;
      }
      const u = new URL(urlStr);
      if (!['http:', 'https:'].includes(u.protocol))
        return { state: 'invalid', message: 'URL must use http:// or https://' };
      return { state: 'valid', message: 'Valid URL' };
    } catch { return { state: 'invalid', message: 'Invalid URL format' }; }
  },

  email: (d) => !d.email
    ? { state: 'idle', message: 'Enter an email' }
    : RE.email.test(d.email)
      ? { state: 'valid', message: 'Valid email address' }
      : { state: 'invalid', message: 'Malformed email address' },

  wifi: (d) => !d.ssid
    ? { state: 'idle', message: 'Enter a network name' }
    : { state: 'valid', message: 'Network ready' },

  vcard: (d) => {
    if (!d.firstName && !d.lastName) return { state: 'idle', message: 'Add a name' };
    if (d.email && !RE.email.test(d.email))
      return { state: 'invalid', message: 'Email address is malformed' };
    return { state: 'valid', message: 'Contact card ready' };
  },

  crypto: (d) => {
    if (!d.address) return { state: 'idle', message: 'Enter a wallet address' };
    const re = d.coin === 'ethereum' ? RE.eth : d.coin === 'litecoin' ? RE.ltc : RE.btc;
    return re.test(d.address)
      ? { state: 'valid', message: `Valid ${d.coin} address` }
      : { state: 'invalid', message: `Not a recognised ${d.coin} address` };
  },

  appstore: (d) => {
    const ios = d.iosUrl?.trim(), android = d.androidUrl?.trim();
    if (!ios && !android) return { state: 'idle', message: 'Add at least one store link' };
    for (const link of [ios, android].filter(Boolean)) {
      try { new URL(link); } catch { return { state: 'invalid', message: 'Invalid store URL' }; }
    }
    return {
      state: 'valid',
      message: ios && android ? 'Smart redirect enabled (iOS + Android)' : 'Single-platform link'
    };
  },

  event: (d) => d.summary
    ? { state: 'valid', message: 'Event ready' }
    : { state: 'idle', message: 'Add an event title' },

  text: (d) => d.text
    ? { state: 'valid', message: `${d.text.length} characters` }
    : { state: 'idle', message: 'Enter a message' },

  social: (d) => {
    if (!d.socialName) return { state: 'idle', message: 'Enter a name' };
    const hasLinks = d.socialFacebook || d.socialWhatsapp || d.socialInstagram || 
                     d.socialTwitter || d.socialLinkedin || d.socialYoutube;
    if (!hasLinks) return { state: 'idle', message: 'Add at least one link' };
    return { state: 'valid', message: 'Social page ready' };
  },
};

/* ─── Presets ─── */
export const PRESETS = [
  { name: 'Midnight', dots: '#818cf8', dots2: '#f472b6', corners: '#818cf8', bg: '#0b0f1e', type: 'dots' },
  { name: 'Corporate', dots: '#1e3a8a', dots2: '#1e3a8a', corners: '#1e3a8a', bg: '#ffffff', type: 'square' },
  { name: 'Botanical', dots: '#065f46', dots2: '#84cc16', corners: '#065f46', bg: '#f0fdf4', type: 'classy-rounded' },
  { name: 'Solaris', dots: '#c2410c', dots2: '#f59e0b', corners: '#c2410c', bg: '#fff7ed', type: 'extra-rounded' },
  { name: 'Obsidian', dots: '#0a0a0a', dots2: '#0a0a0a', corners: '#0a0a0a', bg: '#ffffff', type: 'square' },
  { name: 'Bubblegum', dots: '#f472b6', dots2: '#a78bfa', corners: '#f472b6', bg: '#fdf4ff', type: 'rounded' },
];

/* ─── AI Themes ─── */
export const AI_THEMES = {
  neon: {
    keywords: ['neon', 'cyberpunk', 'cyber', 'synthwave', 'retrowave', 'electric', 'vaporwave', 'miami', 'arcade', 'matrix'],
    patch: {
      dotsColor: '#22d3ee', dotsColor2: '#ec4899', isGradient: true, gradientType: 'linear', dotsType: 'dots',
      cornersSquareColor: '#a855f7', cornersSquareType: 'extra-rounded', cornersDotColor: '#22d3ee', cornersDotType: 'dot',
      backgroundColor: '#0b0f1e'
    }
  },
  corporate: {
    keywords: ['corporate', 'business', 'professional', 'enterprise', 'finance', 'banking', 'executive', 'law', 'office'],
    patch: {
      dotsColor: '#1e3a8a', dotsColor2: '#1e3a8a', isGradient: false, gradientType: 'linear', dotsType: 'square',
      cornersSquareColor: '#1e3a8a', cornersSquareType: 'square', cornersDotColor: '#1e3a8a', cornersDotType: 'square',
      backgroundColor: '#ffffff'
    }
  },
  nature: {
    keywords: ['nature', 'forest', 'organic', 'botanical', 'eco', 'leaf', 'green', 'plant', 'earth', 'woodland', 'moss'],
    patch: {
      dotsColor: '#065f46', dotsColor2: '#84cc16', isGradient: true, gradientType: 'linear', dotsType: 'rounded',
      cornersSquareColor: '#065f46', cornersSquareType: 'extra-rounded', cornersDotColor: '#065f46', cornersDotType: 'dot',
      backgroundColor: '#f7fee7'
    }
  },
  ocean: {
    keywords: ['ocean', 'sea', 'water', 'aqua', 'marine', 'wave', 'nautical', 'coast', 'deep', 'blue'],
    patch: {
      dotsColor: '#0369a1', dotsColor2: '#06b6d4', isGradient: true, gradientType: 'radial', dotsType: 'classy-rounded',
      cornersSquareColor: '#0369a1', cornersSquareType: 'extra-rounded', cornersDotColor: '#0ea5e9', cornersDotType: 'dot',
      backgroundColor: '#ecfeff'
    }
  },
  sunset: {
    keywords: ['sunset', 'sunrise', 'warm', 'golden', 'dawn', 'dusk', 'fire', 'amber', 'coral', 'orange'],
    patch: {
      dotsColor: '#c2410c', dotsColor2: '#db2777', isGradient: true, gradientType: 'linear', dotsType: 'classy',
      cornersSquareColor: '#c2410c', cornersSquareType: 'extra-rounded', cornersDotColor: '#be185d', cornersDotType: 'dot',
      backgroundColor: '#fff7ed'
    }
  },
  luxury: {
    keywords: ['luxury', 'gold', 'premium', 'royal', 'refined', 'elegant', 'boutique', 'couture', 'marble'],
    patch: {
      dotsColor: '#713f12', dotsColor2: '#eab308', isGradient: true, gradientType: 'linear', dotsType: 'classy-rounded',
      cornersSquareColor: '#713f12', cornersSquareType: 'extra-rounded', cornersDotColor: '#713f12', cornersDotType: 'dot',
      backgroundColor: '#fefce8'
    }
  },
  mono: {
    keywords: ['mono', 'monochrome', 'minimal', 'minimalism', 'brutal', 'brutalist', 'print', 'newspaper', 'swiss'],
    patch: {
      dotsColor: '#0a0a0a', dotsColor2: '#0a0a0a', isGradient: false, gradientType: 'linear', dotsType: 'square',
      cornersSquareColor: '#0a0a0a', cornersSquareType: 'square', cornersDotColor: '#0a0a0a', cornersDotType: 'square',
      backgroundColor: '#ffffff'
    }
  },
  pastel: {
    keywords: ['pastel', 'soft', 'candy', 'cute', 'dreamy', 'kawaii', 'bubblegum', 'cotton', 'baby'],
    patch: {
      dotsColor: '#f472b6', dotsColor2: '#a78bfa', isGradient: true, gradientType: 'linear', dotsType: 'rounded',
      cornersSquareColor: '#f472b6', cornersSquareType: 'extra-rounded', cornersDotColor: '#a78bfa', cornersDotType: 'dot',
      backgroundColor: '#fdf4ff'
    }
  },
};

/* ─── AI Scoring ─── */
export const scoreAITheme = (prompt) => {
  const p = prompt.toLowerCase();
  const ranked = Object.entries(AI_THEMES)
    .map(([key, theme]) => ({
      key,
      score: theme.keywords.reduce((a, kw) => a + (p.includes(kw) ? 1 : 0), 0),
      patch: theme.patch,
    }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (top.score === 0) return null;
  const total = ranked.reduce((a, r) => a + r.score, 0);
  return { key: top.key, patch: top.patch, confidence: Math.min(1, top.score / Math.max(total, 1) + 0.2) };
};

/* ─── URL State Encoding ─── */
export const encodeState = (state) => {
  try { return btoa(encodeURIComponent(JSON.stringify(state))); } catch { return ''; }
};

export const decodeState = (hash) => {
  try { return JSON.parse(decodeURIComponent(atob(hash))); } catch { return null; }
};

/* ─── Utility ─── */
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export const getInitialsSvg = (firstName, lastName) => {
  const f = (firstName || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  const initials = f + l || '✨';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#1e293b"/><text x="100" y="100" font-family="sans-serif" font-size="80" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch { return ''; }
};

export const compressImage = (file, maxWidth = 96, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = maxWidth;
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, maxWidth, maxWidth);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/* ─── Avatar Storage (separate from QR payload) ─── */
const AVATAR_PREFIX = 'qr:avatar:';
const MAX_AVATAR_SIZE = 50000; // 50KB limit for stored avatars

export const storeAvatar = (base64Image) => {
  if (!base64Image || base64Image.length > MAX_AVATAR_SIZE * 2) {
    console.warn('Avatar too large, skipping storage');
    return '';
  }
  const key = uid();
  try {
    localStorage.setItem(AVATAR_PREFIX + key, base64Image);
    return key;
  } catch (e) {
    console.error('Failed to store avatar:', e);
    return '';
  }
};

export const getAvatar = (key) => {
  if (!key) return '';
  try {
    return localStorage.getItem(AVATAR_PREFIX + key) || '';
  } catch {
    return '';
  }
};

export const clearOldAvatars = () => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(AVATAR_PREFIX));
    // Keep only last 10 avatars
    if (keys.length > 10) {
      keys.slice(0, keys.length - 10).forEach(k => localStorage.removeItem(k));
    }
  } catch { /* ignore */ }
};
