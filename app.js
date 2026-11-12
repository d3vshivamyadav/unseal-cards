(function () {
  'use strict';

  /* ==================== CONSTANTS & THEME / STYLE CATALOG ==================== */
  const CONFIG = window.UNSEAL_CONFIG || {
    ga4Id: 'G-XXXXXXXXXX',
    adsenseClient: 'ca-pub-0000000000000000',
    siteOrigin: 'https://unseal-cards.vercel.app'
  };

  const FOIL_KEYS = ['gold', 'rosegold', 'silver', 'holo'];
  const FOIL_META = {
    gold: {
      name: 'Champagne Gold foil',
      stops: ['#ECCE7E', '#C48F30', '#FAE7AD', '#B37B20'],
      ink: '#3B2506',
      border: '#B8832A',
      dust: ['#FDE68A', '#D97706', '#FFFBEB']
    },
    rosegold: {
      name: 'Rose Gold foil',
      stops: ['#F5CAC4', '#C67A71', '#FCE3DF', '#AA5F57'],
      ink: '#401714',
      border: '#B86E65',
      dust: ['#FBCFE8', '#FB7185', '#FFE4E6']
    },
    silver: {
      name: 'Sterling Silver foil',
      stops: ['#EBEEF2', '#9BA3B0', '#FFFFFF', '#7D8694'],
      ink: '#1E232B',
      border: '#8E97A4',
      dust: ['#F3F4F6', '#D1D5DB', '#FFFFFF']
    },
    holo: {
      name: 'Holo Prism foil',
      stops: ['#7DD3FC', '#F0ABFC', '#FDE047', '#6EE7B7'],
      ink: '#1E1B4B',
      border: '#A855F7',
      dust: ['#67E8F9', '#F472B6', '#FDE047', '#A7F3D0']
    }
  };

  const FONT_KEYS = ['script', 'hindi', 'serif', 'clean'];
  const FONT_CANVAS_MAP = {
    script: "'Caveat', 'Kalam', 'Noto Sans Devanagari', cursive",
    hindi: "'Kalam', 'Noto Sans Devanagari', cursive",
    serif: "'Playfair Display', Georgia, serif",
    clean: "'DM Sans', system-ui, sans-serif"
  };

  const THEME_KEYS = [
    'atelier',
    'diwali',
    'holi',
    'eid',
    'valentine',
    'christmas',
    'newyear',
    'rakhi',
    'navratri',
    'ganesh',
    'halloween',
    'midnight'
  ];

  const THEME_META = {
    atelier: { label: 'Classic', desc: 'Classic Crimson & Ivory', emoji: '♥', metaColor: '#C8282B', glyphs: ['✨', '✦', '✨', '✦', '♥'], confetti: ['#C8282B', '#E5B95C', '#F43F5E', '#FFFDF9'] },
    diwali: { label: 'Diwali', desc: 'Diwali Glow', emoji: '🪔', metaColor: '#C2410C', glyphs: ['🪔', '✨', '✦', '🪔', '✨'], confetti: ['#EA580C', '#FACC15', '#DC2626', '#FDE68A'] },
    holi: { label: 'Holi', desc: 'Holi Gulaal Splash', emoji: '🎨', metaColor: '#BE185D', glyphs: ['🎨', '🌸', '✨', '💠', '✦'], confetti: ['#DB2777', '#7C3AED', '#06B6D4', '#FACC15'] },
    eid: { label: 'Eid', desc: 'Eid Emerald Crescent', emoji: '🌙', metaColor: '#047857', glyphs: ['🌙', '✨', '★', '🌙', '✦'], confetti: ['#047857', '#E5B95C', '#10B981', '#FDE68A'] },
    valentine: { label: 'Romance', desc: 'Rose Romance', emoji: '🌹', metaColor: '#BE123C', glyphs: ['🌹', '♥', '💌', '✨', '♥'], confetti: ['#BE123C', '#FB7185', '#FDA4AF', '#E5B95C'] },
    christmas: { label: 'Noel', desc: 'Winter Noel', emoji: '❄️', metaColor: '#B91C1C', glyphs: ['❄️', '✨', '🎄', '✦', '❄️'], confetti: ['#15803D', '#B91C1C', '#E5B95C', '#FFFFFF'] },
    newyear: { label: 'New Year', desc: 'Midnight Gold Celebration', emoji: '🥂', metaColor: '#4338CA', glyphs: ['🥂', '✨', '★', '🎆', '✦'], confetti: ['#4338CA', '#F59E0B', '#A855F7', '#FDE047'] },
    rakhi: { label: 'Saffron', desc: 'Warm Vermilion Spark', emoji: '🧡', metaColor: '#C2410C', glyphs: ['🧡', '✨', '🌸', '✦', '🧡'], confetti: ['#EA580C', '#FBBF24', '#F43F5E', '#FDE68A'] },
    navratri: { label: 'Garba', desc: 'Navratri Magenta', emoji: '✨', metaColor: '#A21CAF', glyphs: ['✨', '🌸', '✦', '🪷', '✨'], confetti: ['#A21CAF', '#EC4899', '#14B8A6', '#FACC15'] },
    ganesh: { label: 'Tilak', desc: 'Festive Modak Gold', emoji: '🪷', metaColor: '#B91C1C', glyphs: ['🪷', '✨', '★', '🪷', '✦'], confetti: ['#DC2626', '#F59E0B', '#EA580C', '#FDE68A'] },
    halloween: { label: 'Mystic', desc: 'Spooky Mystic Plum', emoji: '🎃', metaColor: '#6D28D9', glyphs: ['🎃', '✨', '🦇', '✦', '🌙'], confetti: ['#6D28D9', '#F97316', '#A855F7', '#FDE047'] },
    midnight: { label: 'Noir', desc: 'Noir Luxe Velvet', emoji: '🖤', metaColor: '#111018', glyphs: ['✦', '★', '✨', '🌙', '✦'], confetti: ['#E5B95C', '#A855F7', '#FFFDF9', '#D97706'] }
  };

  /* 20 Bespoke Gift Card Palettes x 5 Motifs = 100 Silent Collector Combinations */
  const GIFT_PALETTES = [
    { bg1: '#231316', bg2: '#4A1921', ink: '#FFFDF8', accent: '#EAB308' },
    { bg1: '#111C2D', bg2: '#1E3A5F', ink: '#F8FAFC', accent: '#38BDF8' },
    { bg1: '#0A291E', bg2: '#134E3A', ink: '#ECFDF5', accent: '#FBBF24' },
    { bg1: '#29142B', bg2: '#581C5E', ink: '#FDF4FF', accent: '#F472B6' },
    { bg1: '#2B190B', bg2: '#633312', ink: '#FFFBEB', accent: '#F59E0B' },
    { bg1: '#16162A', bg2: '#2D2A5E', ink: '#EEF2FF', accent: '#A78BFA' },
    { bg1: '#2A1014', bg2: '#6A1623', ink: '#FFF1F2', accent: '#FB7185' },
    { bg1: '#0E2426', bg2: '#134E4A', ink: '#F0FDFA', accent: '#2DD4BF' },
    { bg1: '#211E17', bg2: '#473D26', ink: '#FEFCE8', accent: '#FACC15' },
    { bg1: '#18181B', bg2: '#27272A', ink: '#FAFAFA', accent: '#D4AF37' },
    { bg1: '#2C0F1E', bg2: '#6D1843', ink: '#FDF2F8', accent: '#F9A8D4' },
    { bg1: '#102116', bg2: '#1D4D2E', ink: '#F0FDF4', accent: '#4ADE80' },
    { bg1: '#291710', bg2: '#6B2C16', ink: '#FFF7ED', accent: '#FB923C' },
    { bg1: '#13192F', bg2: '#233267', ink: '#EFF6FF', accent: '#60A5FA' },
    { bg1: '#241522', bg2: '#4D2246', ink: '#FDF4FF', accent: '#E879F9' },
    { bg1: '#1D2210', bg2: '#3D481B', ink: '#F7FEE7', accent: '#A3E635' },
    { bg1: '#281414', bg2: '#5B1E1E', ink: '#FEF2F2', accent: '#FCA5A5' },
    { bg1: '#0C212B', bg2: '#15475E', ink: '#F0F9FF', accent: '#38BDF8' },
    { bg1: '#221810', bg2: '#52341A', ink: '#FFFBEB', accent: '#FCD34D' },
    { bg1: '#1B1426', bg2: '#3B235A', ink: '#F5F3FF', accent: '#C084FC' }
  ];

  const GIFT_TITLES = [
    'Golden Hour Aura',
    'Velvet Midnight Spark',
    'Unspoken Magnetism',
    'Starlight Confession',
    'Quiet Heartbeat Crest',
    'Warm Saffron Glow',
    'Moonlit Chemistry',
    'Rare Kindred Spirit'
  ];

  const GIFT_FORTUNES = [
    'An unexpected message turns an ordinary week unforgettable.',
    'Someone thinks of your smile more often than they admit.',
    'Your quiet warmth is the exact energy someone needed today.',
    'A bold little reply right now opens a whole new chapter.',
    'Good news and a late-night smile are already heading your way.'
  ];

  /* ==================== APPLICATION STATE ==================== */
  const state = {
    mode: 'write',
    recipient: '',
    senderName: '',
    secret: '',
    clue: '',
    foil: 'gold',
    font: 'script',
    themeChoice: 'auto',
    burn: false,
    cardId: '',
    shortUrl: '',
    isPreviewFromSender: false,
    revealed: false,
    senderGiftUnlocked: false,
    receiverGiftUnlocked: false,
    senderGiftSpec: null,
    receiverGiftSpec: null,
    reaction: '',
    audioOn: false,
    audioCtx: null,
    lastScratchSoundAt: 0,
    deferredPrompt: null,
    bannerDismissed: false,
    burnTimerId: null,
    burnSecondsLeft: 0,
    evaporated: false,
    sparkles: [],
    sparkleRafId: 0
  };

  /* ==================== SAFE DOM HELPERS ==================== */
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => (typeof document.querySelector === 'function' ? document.querySelector(sel) : null);
  const qsa = (sel) => (typeof document.querySelectorAll === 'function' ? Array.from(document.querySelectorAll(sel)) : []);

  let toastTimer = null;
  function showToast(msg) {
    const el = $('toastBanner');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 2600);
  }

  function safeHashSeed(str) {
    let h = 2166136261;
    const input = String(str || 'unseal');
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function generateAlphaId(len = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    const out = [];
    if (typeof crypto !== 'undefined' && crypto && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint8Array(len);
      crypto.getRandomValues(buf);
      for (let i = 0; i < len; i += 1) out.push(chars[buf[i] % chars.length]);
    } else {
      for (let i = 0; i < len; i += 1) out.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    return out.join('');
  }

  function slugifyRecipient(name) {
    const clean = String(name || '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '')
      .replace(/[^A-Za-z0-9]/g, '');
    return (clean || 'You').slice(0, 14);
  }

  function getBaseUrl() {
    if (typeof location === 'undefined' || !location) return CONFIG.siteOrigin + '/';
    if (location.protocol === 'file:') return CONFIG.siteOrigin + '/';
    return location.origin + (location.pathname || '/');
  }

  function trackEvent(name, params = {}) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params);
      }
    } catch (_) {
      // ignore analytics errors safely
    }
  }

  /* ==================== THEME ENGINE (AUTO CALENDAR + 12 LIVE THEMES) ==================== */
  function detectAutoTheme(now = new Date()) {
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const md = m * 100 + d;

    if (md >= 1229 || md <= 107) return 'newyear';
    if (md >= 207 && md <= 215) return 'valentine';
    if (md >= 301 && md <= 328) return 'holi';
    if (md >= 329 && md <= 415) return 'eid';
    if (md >= 801 && md <= 822) return 'rakhi';
    if (md >= 823 && md <= 920) return 'ganesh';
    if (md >= 1001 && md <= 1024) return 'navratri';
    if (md >= 1025 && md <= 1102) return 'halloween';
    if (md >= 1103 && md <= 1116) return 'diwali';
    if (md >= 1215 && md <= 1228) return 'christmas';
    return 'atelier';
  }

  function getEffectiveTheme() {
    if (state.themeChoice && state.themeChoice !== 'auto' && THEME_META[state.themeChoice]) {
      return state.themeChoice;
    }
    return detectAutoTheme();
  }

  function applyTheme(choice) {
    state.themeChoice = choice && (choice === 'auto' || THEME_META[choice]) ? choice : 'auto';
    const autoSeason = detectAutoTheme();
    const effective = getEffectiveTheme();
    const meta = THEME_META[effective] || THEME_META.atelier;

    if (document.documentElement && typeof document.documentElement.setAttribute === 'function') {
      document.documentElement.setAttribute('data-festival', effective);
    }

    const themeColorMeta = qs('meta[name="theme-color"]');
    if (themeColorMeta && typeof themeColorMeta.setAttribute === 'function') {
      themeColorMeta.setAttribute('content', meta.metaColor);
    }

    qsa('#ambientSparkles .spark-dot').forEach((el, idx) => {
      const glyph = meta.glyphs[idx % meta.glyphs.length];
      el.setAttribute('data-glyph', glyph);
    });

    const crest = $('composerCrestChip');
    if (crest) crest.textContent = meta.emoji;
    const stamp = $('waxStampBadge');
    if (stamp) stamp.textContent = meta.emoji;

    const btnIcon = $('themeToggleIcon');
    const btnLabel = $('themeToggleLabel');
    if (btnIcon) btnIcon.textContent = state.themeChoice === 'auto' ? '🎨' : meta.emoji;
    if (btnLabel) btnLabel.textContent = state.themeChoice === 'auto' ? 'Style' : meta.label;

    const autoBtn = $('themeAutoBtn');
    const autoDesc = $('themeAutoDesc');
    if (autoBtn) autoBtn.classList.toggle('is-selected', state.themeChoice === 'auto');
    if (autoDesc) autoDesc.textContent = `Today: ${THEME_META[autoSeason].desc}`;

    qsa('.theme-option-btn').forEach((btn) => {
      const tid = btn.dataset ? btn.dataset.themeId : '';
      btn.classList.toggle('is-selected', state.themeChoice === tid);
    });
  }

  /* ==================== FOIL & TYPOGRAPHY STYLE SELECTION ==================== */
  function setFoil(foilKey) {
    state.foil = FOIL_META[foilKey] ? foilKey : 'gold';
    qsa('#foilSelectorRow .foil-pill').forEach((btn) => {
      const active = btn.dataset && btn.dataset.foil === state.foil;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    updateWaPreviewCopy();
  }

  function applyFontClass(el, fontKey) {
    if (!el || !el.classList) return;
    FONT_KEYS.forEach((k) => el.classList.remove(`font-${k}`));
    el.classList.add(`font-${FONT_CANVAS_MAP[fontKey] ? fontKey : 'script'}`);
  }

  function setFont(fontKey) {
    state.font = FONT_CANVAS_MAP[fontKey] ? fontKey : 'script';
    qsa('#fontSelectorRow .font-pill').forEach((btn) => {
      const active = btn.dataset && btn.dataset.font === state.font;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    applyFontClass($('secretTextarea'), state.font);
    applyFontClass($('revealedSecretText'), state.font);
  }

  function updateWaPreviewCopy() {
    const titleEl = $('waPreviewTitle');
    const subEl = $('waPreviewSub');
    if (titleEl) {
      const rec = state.recipient || 'You';
      titleEl.textContent = `💌 For ${rec} — Scratch to Unseal`;
    }
    if (subEl) {
      const foilName = FOIL_META[state.foil] ? FOIL_META[state.foil].name : 'Gold foil';
      const cap = foilName.charAt(0).toUpperCase() + foilName.slice(1);
      subEl.textContent = `${cap} secret note + Surprise Story Gift`;
    }
  }

  /* ==================== BINARY CODEC v5 + LEGACY DECODERS ==================== */
  function toBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(str) {
    const clean = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = clean.length % 4 === 0 ? '' : '='.repeat(4 - (clean.length % 4));
    const bin = atob(clean + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }

  /* Compact Unicode + Devanagari run-length byte packer (0x00 reserved for delimiter) */
  function packTextBytes(str) {
    const safeStr = String(str || '').replace(/\u0000/g, '');
    const te = new TextEncoder();
    const out = [];
    let inDev = false;

    for (const ch of safeStr) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x0900 && cp <= 0x097F) {
        if (!inDev) {
          out.push(0xFE);
          inDev = true;
        }
        out.push(cp - 0x0900);
      } else if (inDev && cp === 0x20) {
        out.push(0x80);
      } else {
        if (inDev) {
          out.push(0xFF);
          inDev = false;
        }
        const utf8 = te.encode(ch);
        for (let i = 0; i < utf8.length; i += 1) out.push(utf8[i]);
      }
    }
    if (inDev) out.push(0xFF);
    return new Uint8Array(out);
  }

  function unpackTextBytes(bytes) {
    const td = new TextDecoder('utf-8', { fatal: false });
    let result = '';
    let utfBuf = [];
    let inDev = false;

    const flushUtf = () => {
      if (utfBuf.length > 0) {
        result += td.decode(new Uint8Array(utfBuf));
        utfBuf = [];
      }
    };

    for (let i = 0; i < bytes.length; i += 1) {
      const b = bytes[i];
      if (!inDev) {
        if (b === 0xFE) {
          flushUtf();
          inDev = true;
        } else {
          utfBuf.push(b);
        }
      } else {
        if (b === 0xFF) {
          inDev = false;
        } else if (b === 0x80) {
          result += ' ';
        } else if (b <= 0x7F) {
          result += String.fromCodePoint(0x0900 + b);
        }
      }
    }
    flushUtf();
    return result;
  }

  function encodePayloadV5(data) {
    const rBytes = packTextBytes(data.recipient);
    const sBytes = packTextBytes(data.secret);
    const cBytes = packTextBytes(data.clue);

    const hasClue = cBytes.length > 0 ? 1 : 0;
    const burnBit = data.burn ? 1 : 0;
    const foilIdx = Math.max(0, FOIL_KEYS.indexOf(data.foil || 'gold'));
    const fontIdx = Math.max(0, FONT_KEYS.indexOf(data.font || 'script'));
    const themeIdx = data.themeChoice && data.themeChoice !== 'auto'
      ? Math.max(0, THEME_KEYS.indexOf(data.themeChoice) + 1)
      : 0;
    const hasTheme = themeIdx > 0 ? 1 : 0;

    const flags =
      hasClue |
      (burnBit << 2) |
      ((foilIdx & 0x03) << 3) |
      ((fontIdx & 0x03) << 5) |
      (hasTheme << 7);

    const headerLen = 1 + hasTheme;
    const sepClueLen = hasClue ? 1 + cBytes.length : 0;
    const total = headerLen + rBytes.length + 1 + sBytes.length + sepClueLen;

    const packet = new Uint8Array(total);
    let pos = 0;
    packet[pos++] = flags;
    if (hasTheme) packet[pos++] = themeIdx;
    packet.set(rBytes, pos);
    pos += rBytes.length;
    packet[pos++] = 0x00;
    packet.set(sBytes, pos);
    pos += sBytes.length;
    if (hasClue) {
      packet[pos++] = 0x00;
      packet.set(cBytes, pos);
    }

    return '5' + toBase64Url(packet);
  }

  function decodePayloadV5(rawAfterPrefix) {
    const packet = fromBase64Url(rawAfterPrefix);
    if (!packet || packet.length < 3) return null;

    let pos = 0;
    const flags = packet[pos++];
    const hasClue = (flags & 0x01) !== 0;
    const burn = (flags & 0x04) !== 0;
    const foil = FOIL_KEYS[(flags >> 3) & 0x03] || 'gold';
    const font = FONT_KEYS[(flags >> 5) & 0x03] || 'script';
    const hasTheme = (flags & 0x80) !== 0;

    let themeChoice = 'auto';
    if (hasTheme) {
      const tIdx = packet[pos++];
      if (tIdx >= 1 && tIdx <= THEME_KEYS.length) {
        themeChoice = THEME_KEYS[tIdx - 1];
      }
    }

    const nul1 = packet.indexOf(0x00, pos);
    if (nul1 === -1) return null;
    const rBytes = packet.slice(pos, nul1);
    pos = nul1 + 1;

    let sBytes;
    let cBytes = new Uint8Array(0);
    if (hasClue) {
      const nul2 = packet.indexOf(0x00, pos);
      if (nul2 !== -1) {
        sBytes = packet.slice(pos, nul2);
        cBytes = packet.slice(nul2 + 1);
      } else {
        sBytes = packet.slice(pos);
      }
    } else {
      sBytes = packet.slice(pos);
    }

    return {
      recipient: unpackTextBytes(rBytes),
      secret: unpackTextBytes(sBytes),
      clue: unpackTextBytes(cBytes),
      foil,
      font,
      themeChoice,
      burn
    };
  }

  function decodeLegacyHashOrSearch(search, hash) {
    const h = String(hash || '').replace(/^#/, '');
    if (h.startsWith('5')) {
      try {
        return decodePayloadV5(h.slice(1));
      } catch (_) {
        return null;
      }
    }

    /* Legacy #4 / U4 / U3 / U2 / U1 support */
    if (h.startsWith('4') || h.startsWith('U4')) {
      try {
        const raw = h.startsWith('U4') ? h.slice(2) : h.slice(1);
        const bytes = fromBase64Url(raw);
        if (bytes.length >= 3) {
          const flags = bytes[0];
          const hasClue = (flags & 1) !== 0;
          const nul1 = bytes.indexOf(0, 1);
          if (nul1 !== -1) {
            const r = unpackTextBytes(bytes.slice(1, nul1));
            const restStart = nul1 + 1;
            const nul2 = hasClue ? bytes.indexOf(0, restStart) : -1;
            const s = unpackTextBytes(nul2 !== -1 ? bytes.slice(restStart, nul2) : bytes.slice(restStart));
            const c = nul2 !== -1 ? unpackTextBytes(bytes.slice(nul2 + 1)) : '';
            return { recipient: r, secret: s, clue: c, foil: 'gold', font: 'script', themeChoice: 'auto', burn: false };
          }
        }
      } catch (_) {
        // fall through
      }
    }

    const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    const sealParam = params.get('seal') || params.get('s') || '';
    const candidate = sealParam || (h.length > 4 ? h : '');
    if (!candidate) return null;

    const clean = candidate.replace(/^U[1-4]/, '');
    try {
      const jsonStr = new TextDecoder().decode(fromBase64Url(clean));
      const obj = JSON.parse(jsonStr);
      if (obj && (obj.s || obj.secret || obj.m || obj.message)) {
        return {
          recipient: obj.r || obj.recipient || obj.to || 'You',
          secret: obj.s || obj.secret || obj.m || obj.message || '',
          clue: obj.c || obj.clue || '',
          foil: FOIL_META[obj.foil] ? obj.foil : 'gold',
          font: FONT_CANVAS_MAP[obj.font] ? obj.font : 'script',
          themeChoice: THEME_META[obj.theme] ? obj.theme : 'auto',
          burn: Boolean(obj.burn)
        };
      }
    } catch (_) {
      try {
        const text = new TextDecoder().decode(fromBase64Url(clean));
        const parts = text.split('\n');
        if (parts.length >= 2) {
          return {
            recipient: parts[0],
            secret: parts[1],
            clue: parts[2] || '',
            foil: 'gold',
            font: 'script',
            themeChoice: 'auto',
            burn: false
          };
        }
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  /* ==================== GIFT VAULT & 9:16 PNG GENERATOR ==================== */
  function buildGiftSpec(seedBase, role, ownerName) {
    const h = safeHashSeed(`${seedBase}:${role}:${ownerName}`);
    const palette = GIFT_PALETTES[h % GIFT_PALETTES.length];
    const motif = Math.floor(h / 20) % 5;
    const title = GIFT_TITLES[h % GIFT_TITLES.length];
    const fortune = GIFT_FORTUNES[(h >> 4) % GIFT_FORTUNES.length];
    const score = 89 + (h % 11);
    const label = ownerName && ownerName.trim() ? ownerName.trim() : (role === 'sender' ? 'Secret Sender' : 'Chosen Reader');

    return { palette, motif, title, fortune, score, ownerLabel: label };
  }

  function renderSvgPattern(svgEl, spec) {
    if (!svgEl || !spec) return;
    const { palette, motif } = spec;
    let shapes = '';
    if (motif === 0) {
      for (let a = 0; a < 12; a += 1) {
        const ang = (a * Math.PI) / 6;
        const x2 = 180 + Math.cos(ang) * 240;
        const y2 = 110 + Math.sin(ang) * 240;
        shapes += `<line x1="180" y1="110" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${palette.accent}" stroke-opacity="0.16" stroke-width="2" />`;
      }
    } else if (motif === 1) {
      [42, 74, 108, 146].forEach((r) => {
        shapes += `<circle cx="180" cy="110" r="${r}" fill="none" stroke="${palette.accent}" stroke-opacity="0.19" stroke-width="1.4" />`;
      });
    } else if (motif === 2) {
      for (let i = -180; i < 480; i += 36) {
        shapes += `<line x1="${i}" y1="0" x2="${i + 180}" y2="220" stroke="${palette.accent}" stroke-opacity="0.14" stroke-width="1.5" />`;
      }
    } else if (motif === 3) {
      for (let a = 0; a < 8; a += 1) {
        shapes += `<ellipse cx="180" cy="110" rx="115" ry="34" transform="rotate(${a * 22.5} 180 110)" fill="none" stroke="${palette.accent}" stroke-opacity="0.16" stroke-width="1.4" />`;
      }
    } else {
      shapes += `<path d="M0 155 Q 90 95 180 155 T 360 155" fill="none" stroke="${palette.accent}" stroke-opacity="0.22" stroke-width="2" />`;
      shapes += `<path d="M0 80 Q 90 25 180 80 T 360 80" fill="none" stroke="${palette.accent}" stroke-opacity="0.16" stroke-width="1.5" />`;
    }

    svgEl.innerHTML =
      `<defs><linearGradient id="gbg_${motif}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette.bg1}"/><stop offset="100%" stop-color="${palette.bg2}"/></linearGradient></defs>` +
      `<rect width="360" height="220" fill="url(#gbg_${motif})" />` +
      shapes;
  }

  function applyGiftSpecToCard(role, spec) {
    const isSender = role === 'sender';
    const card = $(isSender ? 'senderGiftMiniCard' : 'receiverGiftMiniCard');
    const svg = $(isSender ? 'senderGiftSvgPattern' : 'receiverGiftSvgPattern');
    const crest = $(isSender ? 'senderGiftCrest' : 'receiverGiftCrest');
    const mainTxt = $(isSender ? 'senderGiftMainText' : 'receiverGiftMainText');
    const subTxt = $(isSender ? 'senderGiftSubText' : 'receiverGiftSubText');
    const tierEl = $(isSender ? 'senderGiftTierLabel' : 'receiverGiftTierLabel');

    if (card && card.style && typeof card.style.setProperty === 'function') {
      card.style.setProperty('--gift-bg', spec.palette.bg1);
    }
    renderSvgPattern(svg, spec);
    if (tierEl) tierEl.textContent = `UNSEAL • ${spec.score}% VIBE AURA`;
    if (crest) crest.textContent = isSender ? '✨' : '💫';
    if (mainTxt) mainTxt.textContent = `${spec.title} • ${spec.ownerLabel}`;
    if (subTxt) subTxt.textContent = spec.fortune;
  }

  function unlockGiftVault(role, silent = false) {
    const isSender = role === 'sender';
    const card = $(isSender ? 'senderGiftMiniCard' : 'receiverGiftMiniCard');
    const pill = $(isSender ? 'senderQuestPill' : 'receiverQuestPill');
    const revealBtn = $(isSender ? 'senderRevealGiftBtn' : 'receiverRevealGiftBtn');
    const unlockedBtns = $(isSender ? 'senderGiftUnlockedBtns' : 'receiverGiftUnlockedBtns');

    if (isSender) state.senderGiftUnlocked = true;
    else state.receiverGiftUnlocked = true;

    if (card) card.classList.remove('is-locked-vault');
    if (pill) {
      pill.textContent = '✨ Unsealed';
      pill.classList.add('is-done');
    }
    if (revealBtn) revealBtn.classList.add('hidden');
    if (unlockedBtns) unlockedBtns.classList.remove('hidden');

    const spec = isSender ? state.senderGiftSpec : state.receiverGiftSpec;
    const popupName = $('popupGiftNameLine');
    const popupCopy = $('popupQuestProgressCopy');
    if (spec && popupName) popupName.textContent = `${spec.title} (${spec.score}% Vibe Aura)`;
    if (popupCopy) popupCopy.textContent = 'Unsealed & ready to download as 9:16 PNG!';

    if (!silent) {
      playChime();
      burstConfetti();
      showToast('🎁 Your Story Gift Card is unsealed!');
      trackEvent('gift_unsealed', { role });
    }
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(/\s+/);
    let line = '';
    const lines = [];
    for (let i = 0; i < words.length; i += 1) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.forEach((ln, idx) => ctx.fillText(ln, x, y + idx * lineHeight));
    return lines.length * lineHeight;
  }

  function createStoryGiftBlob(role) {
    return new Promise((resolve) => {
      const spec = role === 'sender' ? state.senderGiftSpec : state.receiverGiftSpec;
      if (!spec || typeof document.createElement !== 'function') {
        resolve(null);
        return;
      }
      const c = document.createElement('canvas');
      c.width = 1080;
      c.height = 1920;
      const ctx = c.getContext && c.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, spec.palette.bg1);
      grad.addColorStop(1, spec.palette.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      /* Geometric motif backdrop */
      ctx.save();
      ctx.strokeStyle = spec.palette.accent;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 3;
      [210, 340, 480, 620].forEach((r) => {
        ctx.beginPath();
        ctx.arc(540, 760, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      /* Card Frame */
      ctx.strokeStyle = spec.palette.accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(72, 72, 936, 1776);

      ctx.textAlign = 'center';
      ctx.fillStyle = spec.palette.accent;
      ctx.font = '700 34px "DM Sans", sans-serif';
      ctx.fillText('UNSEAL • BESPOKE STORY KEEPSAKE', 540, 210);

      ctx.fillStyle = spec.palette.ink;
      ctx.font = 'italic 700 84px "Playfair Display", Georgia, serif';
      wrapCanvasText(ctx, spec.title, 540, 480, 860, 104);

      /* Score badge */
      ctx.fillStyle = spec.palette.accent;
      ctx.font = '700 132px "Playfair Display", Georgia, serif';
      ctx.fillText(`${spec.score}%`, 540, 810);
      ctx.font = '700 30px "DM Sans", sans-serif';
      ctx.fillText('VIBE AURA SCORE', 540, 875);

      ctx.fillStyle = spec.palette.ink;
      ctx.font = '600 44px "DM Sans", sans-serif';
      ctx.fillText(`For ${spec.ownerLabel}`, 540, 1060);

      ctx.font = 'italic 42px "Playfair Display", Georgia, serif';
      wrapCanvasText(ctx, `"${spec.fortune}"`, 540, 1210, 840, 62);

      ctx.fillStyle = spec.palette.accent;
      ctx.font = '700 32px "DM Sans", sans-serif';
      ctx.fillText('unseal-cards.vercel.app', 540, 1740);

      if (typeof c.toBlob === 'function') {
        c.toBlob((blob) => resolve(blob), 'image/png');
      } else {
        resolve(null);
      }
    });
  }

  async function downloadOrShareStoryGift(role, shareMode = false) {
    if (role === 'sender' && !state.senderGiftUnlocked) unlockGiftVault('sender');
    if (role === 'receiver' && !state.receiverGiftUnlocked) unlockGiftVault('receiver');

    const blob = await createStoryGiftBlob(role);
    if (!blob) {
      showToast('🎁 Keepsake prepared!');
      return;
    }

    const fileName = `unseal-story-gift-${role}.png`;
    if (shareMode && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Unseal Story Gift Card',
            text: 'Got my custom 9:16 Keepsake Gift Card on Unseal ✨',
            files: [file]
          });
          return;
        }
      } catch (_) {
        // Fallback to download below
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    if (document.body && typeof document.body.appendChild === 'function') document.body.appendChild(a);
    if (typeof a.click === 'function') a.click();
    if (a.parentNode) a.parentNode.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('📥 9:16 Story Gift Card saved!');
  }

  async function downloadRevealedNotePng() {
    if (typeof document.createElement !== 'function') return;
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1350;
    const ctx = c.getContext && c.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 1350);
    grad.addColorStop(0, '#FFFDF9');
    grad.addColorStop(1, '#F6ECD8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.strokeStyle = '#D1BFA0';
    ctx.lineWidth = 4;
    ctx.strokeRect(56, 56, 968, 1238);

    ctx.fillStyle = '#C8282B';
    ctx.textAlign = 'left';
    ctx.font = '700 28px "DM Sans", sans-serif';
    ctx.fillText(`FOR ${(state.recipient || 'YOU').toUpperCase()}`, 120, 175);

    ctx.fillStyle = '#181210';
    const fontFamily = FONT_CANVAS_MAP[state.font] || FONT_CANVAS_MAP.script;
    const fontSize = state.font === 'clean' || state.font === 'serif' ? 50 : 66;
    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    const bodyText = state.evaporated ? '[Evaporated secret note]' : (state.secret || '');
    wrapCanvasText(ctx, bodyText, 120, 320, 840, Math.round(fontSize * 1.38));

    if (state.clue) {
      ctx.fillStyle = '#5C4E48';
      ctx.font = 'italic 32px "Playfair Display", Georgia, serif';
      wrapCanvasText(ctx, `Clue: "${state.clue}"`, 120, 1060, 840, 44);
    }

    ctx.fillStyle = '#991B1E';
    ctx.font = 'italic 700 42px "Playfair Display", Georgia, serif';
    ctx.fillText('Unseal • unseal-cards.vercel.app', 120, 1205);

    if (typeof c.toBlob === 'function') {
      c.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unseal-note-${slugifyRecipient(state.recipient)}.png`;
        if (document.body && typeof document.body.appendChild === 'function') document.body.appendChild(a);
        if (typeof a.click === 'function') a.click();
        if (a.parentNode) a.parentNode.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('📸 Revealed Note PNG saved!');
      }, 'image/png');
    }
  }

  /* ==================== WEB AUDIO & CELEBRATION EFFECTS ==================== */
  function ensureAudio() {
    if (!state.audioOn) return null;
    if (!state.audioCtx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) state.audioCtx = new AC();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended' && typeof state.audioCtx.resume === 'function') {
      state.audioCtx.resume().catch(() => {});
    }
    return state.audioCtx;
  }

  function playScratchRustle() {
    const now = performance.now ? performance.now() : Date.now();
    if (now - state.lastScratchSoundAt < 90) return;
    state.lastScratchSoundAt = now;
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100 + Math.random() * 600, ctx.currentTime);
      gain.gain.setValueAtTime(0.018, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (_) {
      // ignore audio error
    }
  }

  function playChime() {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + i * 0.075;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.055, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    } catch (_) {
      // ignore audio error
    }
  }

  function burstConfetti() {
    if (typeof document.createElement !== 'function' || !document.body) return;
    const meta = THEME_META[getEffectiveTheme()] || THEME_META.atelier;
    for (let i = 0; i < 24; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'floating-emoji-burst';
      dot.textContent = i % 3 === 0 ? '✨' : (i % 2 === 0 ? '✦' : '●');
      dot.style.left = `${10 + Math.random() * 80}vw`;
      dot.style.top = `${55 + Math.random() * 25}vh`;
      dot.style.color = meta.confetti[i % meta.confetti.length];
      dot.style.fontSize = `${0.8 + Math.random() * 0.9}rem`;
      document.body.appendChild(dot);
      setTimeout(() => {
        if (dot.parentNode) dot.parentNode.removeChild(dot);
      }, 1200);
    }
  }

  function burstFloatingEmoji(emoji) {
    if (typeof document.createElement !== 'function' || !document.body) return;
    for (let i = 0; i < 6; i += 1) {
      const el = document.createElement('span');
      el.className = 'floating-emoji-burst';
      el.textContent = emoji;
      el.style.left = `${22 + Math.random() * 56}vw`;
      el.style.top = `${62 + Math.random() * 14}vh`;
      document.body.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 1250);
    }
  }

  /* ==================== SCRATCH CANVAS + FOIL SPARKLE PARTICLES ==================== */
  function spawnFoilSparkles(x, y, canvasW, canvasH) {
    const overlay = $('sparkleOverlayCanvas');
    if (!overlay || !canvasW || !canvasH) return;
    const dustPalette = (FOIL_META[state.foil] || FOIL_META.gold).dust;
    for (let i = 0; i < 2; i += 1) {
      state.sparkles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.8,
        vy: -1.1 - Math.random() * 1.8,
        life: 1,
        size: 1.4 + Math.random() * 1.8,
        color: dustPalette[i % dustPalette.length]
      });
    }
    if (!state.sparkleRafId && typeof requestAnimationFrame === 'function') {
      const tick = () => {
        const sctx = overlay.getContext && overlay.getContext('2d');
        if (!sctx) {
          state.sparkleRafId = 0;
          return;
        }
        sctx.clearRect(0, 0, overlay.width, overlay.height);
        state.sparkles = state.sparkles.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.life -= 0.08;
          if (p.life <= 0) return false;
          sctx.save();
          sctx.globalAlpha = p.life * 0.72;
          sctx.fillStyle = p.color;
          sctx.beginPath();
          sctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          sctx.fill();
          sctx.restore();
          return true;
        });
        if (state.sparkles.length > 0) {
          state.sparkleRafId = requestAnimationFrame(tick);
        } else {
          state.sparkleRafId = 0;
        }
      };
      state.sparkleRafId = requestAnimationFrame(tick);
    }
  }

  function initScratchCanvas() {
    const canvas = $('scratchCanvas');
    const overlay = $('sparkleOverlayCanvas');
    const box = $('scratchBox');
    if (!canvas || !box) return;

    canvas.classList.remove('is-faded');
    const w = Math.max(260, Math.round(box.clientWidth || 440));
    const h = Math.max(225, Math.round(box.clientHeight || 225));
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (overlay) {
      overlay.width = canvas.width;
      overlay.height = canvas.height;
    }

    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const meta = FOIL_META[state.foil] || FOIL_META.gold;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, meta.stops[0]);
    grad.addColorStop(0.35, meta.stops[1]);
    grad.addColorStop(0.68, meta.stops[2]);
    grad.addColorStop(1, meta.stops[3]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    /* Subtle brushed metallic micro-lines */
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h * 0.45, h);
      ctx.stroke();
    }
    ctx.restore();

    /* Inset border & metallic stamp prompt */
    ctx.strokeStyle = meta.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = meta.ink;
    ctx.textAlign = 'center';
    ctx.font = '700 18px "DM Sans", sans-serif';
    ctx.fillText('RUB FOIL TO UNSEAL', w / 2, h / 2 - 4);
    ctx.font = '600 13px "DM Sans", sans-serif';
    ctx.fillText(meta.name, w / 2, h / 2 + 22);

    ctx.globalCompositeOperation = 'destination-out';
  }

  function startBurnCountdownIfEnabled() {
    const badge = $('burnCountdownBadge');
    const under = $('underneathSecretBox');
    if (state.burnTimerId) {
      clearInterval(state.burnTimerId);
      state.burnTimerId = null;
    }
    state.evaporated = false;
    if (under && under.classList) under.classList.remove('is-evaporated');

    if (!state.burn) {
      if (badge) badge.classList.add('hidden');
      return;
    }

    state.burnSecondsLeft = 60;
    if (badge) {
      badge.classList.remove('hidden');
      badge.textContent = `⏳ Evaporates in ${state.burnSecondsLeft}s`;
    }

    state.burnTimerId = setInterval(() => {
      state.burnSecondsLeft -= 1;
      if (state.burnSecondsLeft <= 0) {
        clearInterval(state.burnTimerId);
        state.burnTimerId = null;
        state.evaporated = true;
        if (under && under.classList) under.classList.add('is-evaporated');
        if (badge) badge.textContent = '🌫️ Evaporated';
        const pill = $('scratchStatusPill');
        if (pill) pill.textContent = '🌫️ Secret note evaporated for privacy';
      } else if (badge) {
        badge.textContent = `⏳ Evaporates in ${state.burnSecondsLeft}s`;
      }
    }, 1000);
  }

  function completeReveal() {
    if (state.revealed) return;
    state.revealed = true;

    const canvas = $('scratchCanvas');
    if (canvas) {
      canvas.classList.add('is-faded');
      setTimeout(() => {
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 480);
    }
    const overlay = $('sparkleOverlayCanvas');
    state.sparkles = [];
    if (overlay) {
      const sctx = overlay.getContext && overlay.getContext('2d');
      if (sctx) sctx.clearRect(0, 0, overlay.width, overlay.height);
    }

    const status = $('scratchStatusPill');
    if (status) status.textContent = '✨ Unsealed!';
    const quickBtn = $('quickRevealBtn');
    if (quickBtn) quickBtn.classList.add('hidden');

    const postActions = $('postRevealActions');
    if (postActions) postActions.classList.remove('hidden');

    playChime();
    burstConfetti();
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate([25, 35, 40]); } catch (_) {}
    }

    startBurnCountdownIfEnabled();
    trackEvent('note_unsealed', { foil: state.foil, font: state.font, burn: state.burn });

    if (!state.isPreviewFromSender) {
      setTimeout(() => {
        const modal = $('revealShareModal');
        if (modal) modal.classList.remove('hidden');
      }, 650);
    }
  }

  function measureClearedFraction(canvas, ctx) {
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      let sampled = 0;
      for (let i = 3; i < data.length; i += 64) {
        sampled += 1;
        if (data[i] < 40) cleared += 1;
      }
      return sampled ? cleared / sampled : 0;
    } catch (_) {
      return 0;
    }
  }

  function bindScratchPointerEvents() {
    const canvas = $('scratchCanvas');
    if (!canvas) return;

    let drawing = false;
    let moveTicks = 0;
    const dpr = () => Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

    const scratchAt = (clientX, clientY) => {
      if (state.revealed) return;
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx || typeof canvas.getBoundingClientRect !== 'function') return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const scale = dpr();

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();

      spawnFoilSparkles(x * scale, y * scale, canvas.width, canvas.height);
      playScratchRustle();

      moveTicks += 1;
      if (moveTicks % 6 === 0) {
        const frac = measureClearedFraction(canvas, ctx);
        const pct = Math.min(100, Math.round((frac / 0.45) * 100));
        const pill = $('scratchStatusPill');
        if (pill && !state.revealed) pill.textContent = `🪙 Scratching… ${pct}%`;
        if (frac >= 0.45) completeReveal();
      }
    };

    canvas.addEventListener('pointerdown', (e) => {
      drawing = true;
      if (typeof canvas.setPointerCapture === 'function' && e.pointerId !== undefined) {
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      }
      scratchAt(e.clientX, e.clientY);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      scratchAt(e.clientX, e.clientY);
    });

    const stopDraw = () => {
      drawing = false;
    };
    canvas.addEventListener('pointerup', stopDraw);
    canvas.addEventListener('pointercancel', stopDraw);

    /* Touch fallback for synthetic TouchEvents & older in-app WebViews */
    canvas.addEventListener('touchstart', (e) => {
      if (drawing) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (typeof e.preventDefault === 'function') e.preventDefault();
      scratchAt(t.clientX, t.clientY);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (drawing) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (typeof e.preventDefault === 'function') e.preventDefault();
      scratchAt(t.clientX, t.clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', stopDraw);
  }

  /* ==================== NAVIGATION & VIEW SWITCHING ==================== */
  function showWriteComposer(keepFields = false) {
    state.mode = 'write';
    state.revealed = false;
    state.isPreviewFromSender = false;
    if (document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.remove('receiver-boot');
    }

    if (state.burnTimerId) {
      clearInterval(state.burnTimerId);
      state.burnTimerId = null;
    }

    if (!keepFields) {
      state.recipient = '';
      state.senderName = '';
      state.secret = '';
      state.clue = '';
      state.cardId = '';
      state.shortUrl = '';
      state.senderGiftUnlocked = false;
      state.receiverGiftUnlocked = false;
      if ($('recipientInput')) $('recipientInput').value = '';
      if ($('senderNameInput')) $('senderNameInput').value = '';
      if ($('secretTextarea')) $('secretTextarea').value = '';
      if ($('clueInput')) $('clueInput').value = '';
      if ($('secretCharCount')) $('secretCharCount').textContent = '0 / 280';
      if ($('burnTimerToggle')) $('burnTimerToggle').checked = false;
      state.burn = false;
    }

    if ($('viewWrite')) $('viewWrite').classList.remove('hidden');
    if ($('composerCard')) $('composerCard').classList.remove('hidden');
    if ($('senderReadyCard')) $('senderReadyCard').classList.add('hidden');
    if ($('viewPreview')) $('viewPreview').classList.add('hidden');
    if ($('revealShareModal')) $('revealShareModal').classList.add('hidden');

    if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
      try { history.replaceState(null, '', getBaseUrl()); } catch (_) {}
    }
  }

  function showSenderReadyView() {
    state.mode = 'ready';
    if ($('viewWrite')) $('viewWrite').classList.remove('hidden');
    if ($('composerCard')) $('composerCard').classList.add('hidden');
    if ($('senderReadyCard')) $('senderReadyCard').classList.remove('hidden');
    if ($('viewPreview')) $('viewPreview').classList.add('hidden');

    if ($('readyHeadline')) {
      $('readyHeadline').textContent = `Sealed for ${state.recipient || 'Someone'} ✨`;
    }
    if ($('previewUrlText')) {
      $('previewUrlText').textContent = state.shortUrl;
    }
    updateWaPreviewCopy();

    state.senderGiftSpec = buildGiftSpec(state.cardId || state.shortUrl, 'sender', state.senderName || 'Secret Sender');
    applyGiftSpecToCard('sender', state.senderGiftSpec);

    const card = $('senderGiftMiniCard');
    const pill = $('senderQuestPill');
    const revealBtn = $('senderRevealGiftBtn');
    const unlockedBtns = $('senderGiftUnlockedBtns');
    if (card) card.classList.toggle('is-locked-vault', !state.senderGiftUnlocked);
    if (pill) {
      pill.textContent = state.senderGiftUnlocked ? '✨ Unsealed' : 'Ready to Crack';
      pill.classList.toggle('is-done', state.senderGiftUnlocked);
    }
    if (revealBtn) revealBtn.classList.toggle('hidden', state.senderGiftUnlocked);
    if (unlockedBtns) unlockedBtns.classList.toggle('hidden', !state.senderGiftUnlocked);
  }

  function openReceiverView(payload, fromSenderPreview = false) {
    state.mode = 'preview';
    state.isPreviewFromSender = fromSenderPreview;
    state.revealed = false;
    state.evaporated = false;

    state.recipient = (payload.recipient || 'You').trim();
    state.secret = payload.secret || '';
    state.clue = (payload.clue || '').trim();
    state.foil = FOIL_META[payload.foil] ? payload.foil : 'gold';
    state.font = FONT_CANVAS_MAP[payload.font] ? payload.font : 'script';
    state.burn = Boolean(payload.burn);

    if (payload.themeChoice && THEME_META[payload.themeChoice]) {
      applyTheme(payload.themeChoice);
    }

    if (document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.add('receiver-boot');
    }

    if ($('viewWrite')) $('viewWrite').classList.add('hidden');
    if ($('viewPreview')) $('viewPreview').classList.remove('hidden');
    if ($('previewTopBar')) $('previewTopBar').classList.toggle('hidden', !fromSenderPreview);

    if ($('postcardHeading')) {
      $('postcardHeading').textContent = `For ${state.recipient}, someone sealed a secret note.`;
    }
    const secretEl = $('revealedSecretText');
    if (secretEl) {
      secretEl.textContent = state.secret;
      applyFontClass(secretEl, state.font);
    }
    if ($('revealedClueText')) {
      $('revealedClueText').textContent = state.clue ? `"${state.clue}"` : '"A quiet admirer"';
    }
    if ($('receiverMoodKicker')) {
      $('receiverMoodKicker').textContent = state.burn ? 'EPHEMERAL SECRET POSTCARD' : 'SECRET POSTCARD';
    }

    const under = $('underneathSecretBox');
    if (under && under.classList) under.classList.remove('is-evaporated');
    if ($('burnCountdownBadge')) {
      $('burnCountdownBadge').classList.toggle('hidden', !state.burn);
      if (state.burn) $('burnCountdownBadge').textContent = '⏳ Burns 60s after unseal';
    }

    if ($('scratchStatusPill')) $('scratchStatusPill').textContent = '🪙 Rub foil gently to unseal';
    if ($('quickRevealBtn')) $('quickRevealBtn').classList.remove('hidden');
    if ($('postRevealActions')) $('postRevealActions').classList.add('hidden');

    state.receiverGiftSpec = buildGiftSpec(
      `${state.recipient}:${state.secret}`,
      'receiver',
      state.recipient
    );
    applyGiftSpecToCard('receiver', state.receiverGiftSpec);

    const rCard = $('receiverGiftMiniCard');
    const rPill = $('receiverQuestPill');
    const rBtn = $('receiverRevealGiftBtn');
    const rUnlocked = $('receiverGiftUnlockedBtns');
    if (rCard) rCard.classList.toggle('is-locked-vault', !state.receiverGiftUnlocked);
    if (rPill) {
      rPill.textContent = state.receiverGiftUnlocked ? '✨ Unsealed' : 'Ready to Crack';
      rPill.classList.toggle('is-done', state.receiverGiftUnlocked);
    }
    if (rBtn) rBtn.classList.toggle('hidden', state.receiverGiftUnlocked);
    if (rUnlocked) rUnlocked.classList.toggle('hidden', !state.receiverGiftUnlocked);

    initScratchCanvas();
  }

  /* ==================== COPY & SHARE ACTIONS ==================== */
  async function copyText(text, successMsg) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
        return true;
      }
    } catch (_) {
      // Fallback below
    }
    try {
      if (typeof document.createElement === 'function' && document.body) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        if (typeof ta.select === 'function') ta.select();
        if (typeof document.execCommand === 'function') document.execCommand('copy');
        if (ta.parentNode) ta.parentNode.removeChild(ta);
        showToast(successMsg);
        return true;
      }
    } catch (_) {
      // ignore
    }
    return false;
  }

  function getShareableLink() {
    if (state.shortUrl) return state.shortUrl;
    if (typeof location !== 'undefined' && location.href) return location.href;
    return CONFIG.siteOrigin + '/';
  }

  function openExternalShare(url) {
    if (typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /* ==================== NATIVE PWA INSTALL HANDLER ==================== */
  function isStandalonePwa() {
    if (typeof window === 'undefined') return false;
    const dm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return Boolean(dm || (typeof navigator !== 'undefined' && navigator.standalone === true));
  }

  function refreshInstallBanner() {
    const banner = $('browserInstallBanner');
    if (!banner) return;
    if (isStandalonePwa() || state.bannerDismissed) {
      banner.classList.add('hidden');
      return;
    }
    banner.classList.remove('hidden');
    const sub = $('bibSub');
    if (sub) {
      sub.textContent = state.deferredPrompt
        ? 'Native browser install ready — tap Install App to add to Home Screen'
        : 'Add Unseal to your Home Screen for offline cards & instant launch';
    }
  }

  function triggerInstallFlow() {
    /* IMPORTANT: Call deferredPrompt.prompt() synchronously on click to preserve browser gesture! */
    const promptEvt = state.deferredPrompt;
    if (promptEvt && typeof promptEvt.prompt === 'function') {
      state.deferredPrompt = null;
      let choicePromise;
      try {
        const res = promptEvt.prompt();
        choicePromise = promptEvt.userChoice || Promise.resolve(res);
      } catch (_) {
        choicePromise = null;
      }

      const overlay = $('pwaInstallOverlay');
      const bar = $('pwaInstallProgressBar');
      const title = $('pwaInstallTitle');
      const desc = $('pwaInstallStatusText');
      const steps = $('iosInstallStepsBox');
      if (steps) steps.classList.add('hidden');

      if (choicePromise && typeof choicePromise.then === 'function') {
        choicePromise.then((choice) => {
          if (choice && choice.outcome === 'accepted') {
            if (overlay) overlay.classList.remove('hidden');
            if (title) title.textContent = 'Sealing Unseal onto your Home Screen…';
            if (desc) desc.textContent = 'Installing offline scratch foil & Story Gift generator.';
            if (bar) bar.style.width = '45%';
            setTimeout(() => { if (bar) bar.style.width = '100%'; }, 420);
            setTimeout(() => {
              if (title) title.textContent = 'Unseal App Installed 🎉';
              if (desc) desc.textContent = 'Launch anytime straight from your Home Screen.';
              if ($('browserInstallBanner')) $('browserInstallBanner').classList.add('hidden');
            }, 950);
          } else {
            refreshInstallBanner();
          }
        }).catch(() => {});
      }
      return;
    }

    /* Fallback guide for iOS Safari / browsers where prompt already fired or awaits heuristic */
    const overlay = $('pwaInstallOverlay');
    const title = $('pwaInstallTitle');
    const desc = $('pwaInstallStatusText');
    const bar = $('pwaInstallProgressBar');
    const steps = $('iosInstallStepsBox');
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    const isIos = /iPad|iPhone|iPod/i.test(ua);

    if (overlay) overlay.classList.remove('hidden');
    if (bar) bar.style.width = '100%';
    if (title) title.textContent = isIos ? 'Install Unseal on iPhone / iPad' : 'Install Unseal from Browser Menu';
    if (desc) {
      desc.textContent = isIos
        ? 'Safari installs PWAs from the Share sheet below:'
        : 'Open your browser menu (⋮ or address bar install icon) and select Install App.';
    }
    if (steps) steps.classList.remove('hidden');
  }

  /* ==================== SEAL HANDLER ==================== */
  function handleSealNote() {
    const recEl = $('recipientInput');
    const senderEl = $('senderNameInput');
    const secEl = $('secretTextarea');
    const clueEl = $('clueInput');
    const burnEl = $('burnTimerToggle');

    const recipient = recEl && recEl.value ? recEl.value.trim() : '';
    const senderName = senderEl && senderEl.value ? senderEl.value.trim() : '';
    const secret = secEl && secEl.value ? secEl.value.trim() : '';
    const clue = clueEl && clueEl.value ? clueEl.value.trim() : '';
    const burn = Boolean(burnEl && burnEl.checked);

    if (!secret) {
      showToast('✍️ Write a secret message first!');
      if (secEl && typeof secEl.focus === 'function') secEl.focus();
      return;
    }

    state.recipient = recipient || 'You';
    state.senderName = senderName;
    state.secret = secret;
    state.clue = clue;
    state.burn = burn;
    if (!state.cardId) state.cardId = generateAlphaId(8);

    const token = encodePayloadV5({
      recipient: state.recipient,
      secret: state.secret,
      clue: state.clue,
      foil: state.foil,
      font: state.font,
      themeChoice: state.themeChoice,
      burn: state.burn
    });

    const slug = slugifyRecipient(state.recipient);
    state.shortUrl = `${getBaseUrl()}?${slug}-${state.cardId}#${token}`;

    playChime();
    trackEvent('note_sealed', { foil: state.foil, font: state.font, theme: state.themeChoice, burn: state.burn });
    showSenderReadyView();
  }

  /* ==================== WIRE ALL UI CONTROLS ==================== */
  function bindEvents() {
    const secTa = $('secretTextarea');
    if (secTa) {
      secTa.addEventListener('input', () => {
        const countEl = $('secretCharCount');
        if (countEl) countEl.textContent = `${secTa.value.length} / 280`;
      });
    }

    const burnToggle = $('burnTimerToggle');
    if (burnToggle) {
      burnToggle.addEventListener('change', () => {
        state.burn = Boolean(burnToggle.checked);
      });
    }

    qsa('#foilSelectorRow .foil-pill').forEach((btn) => {
      btn.addEventListener('click', () => setFoil(btn.dataset.foil));
    });

    qsa('#fontSelectorRow .font-pill').forEach((btn) => {
      btn.addEventListener('click', () => setFont(btn.dataset.font));
    });

    if ($('sealCardBtn')) $('sealCardBtn').addEventListener('click', handleSealNote);
    if ($('editSealedBtn')) $('editSealedBtn').addEventListener('click', () => showWriteComposer(true));
    if ($('writeNewBtn')) $('writeNewBtn').addEventListener('click', () => showWriteComposer(false));
    if ($('brandResetLink')) {
      $('brandResetLink').addEventListener('click', (e) => {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        showWriteComposer(false);
      });
    }

    /* Copy Link buttons */
    if ($('copyUrlBtn')) {
      $('copyUrlBtn').addEventListener('click', () => {
        copyText(getShareableLink(), '🔗 Short link copied! Paste anywhere.');
        trackEvent('copy_link', { place: 'url_bar' });
      });
    }
    if ($('copyMainLinkBtn')) {
      $('copyMainLinkBtn').addEventListener('click', () => {
        copyText(getShareableLink(), '📋 Short link copied! Share on WhatsApp, IG or SMS.');
        trackEvent('copy_link', { place: 'primary_cta' });
      });
    }
    if ($('copyInviteLinkBtn')) {
      $('copyInviteLinkBtn').addEventListener('click', () => {
        copyText(getShareableLink(), '🔗 Link copied! Send it to friends.');
        trackEvent('copy_link', { place: 'receiver_actions' });
      });
    }
    if ($('modalCopyLinkBtn')) {
      $('modalCopyLinkBtn').addEventListener('click', () => {
        copyText(getShareableLink(), '📋 Link copied!');
        trackEvent('copy_link', { place: 'modal' });
      });
    }

    /* Social Sharing */
    if ($('whatsappShareBtn')) {
      $('whatsappShareBtn').addEventListener('click', () => {
        const msg = `💌 Someone sealed a secret note for ${state.recipient} — scratch to unseal:\n${getShareableLink()}`;
        openExternalShare(`https://wa.me/?text=${encodeURIComponent(msg)}`);
      });
    }
    if ($('copyIgBtn')) {
      $('copyIgBtn').addEventListener('click', () => {
        copyText(
          `💌 Sealed a secret note for ${state.recipient} — unseal here:\n${getShareableLink()}`,
          '📸 Link & caption copied for Instagram Story / DM!'
        );
      });
    }
    if ($('shareTelegramBtn')) {
      $('shareTelegramBtn').addEventListener('click', () => {
        const url = encodeURIComponent(getShareableLink());
        const text = encodeURIComponent(`💌 Secret scratch note for ${state.recipient}`);
        openExternalShare(`https://t.me/share/url?url=${url}&text=${text}`);
      });
    }
    if ($('nativeShareBtn')) {
      $('nativeShareBtn').addEventListener('click', async () => {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          try {
            await navigator.share({
              title: `Unseal for ${state.recipient}`,
              text: 'Someone sealed a secret note for you 💌',
              url: getShareableLink()
            });
            return;
          } catch (_) {
            // fallback to copy
          }
        }
        copyText(getShareableLink(), '🔗 Short link copied to share anywhere!');
      });
    }

    /* Sender Preview Scratch Card & Back */
    if ($('testScratchBtn')) {
      $('testScratchBtn').addEventListener('click', () => {
        openReceiverView(
          {
            recipient: state.recipient,
            secret: state.secret,
            clue: state.clue,
            foil: state.foil,
            font: state.font,
            themeChoice: state.themeChoice,
            burn: state.burn
          },
          true
        );
      });
    }
    if ($('backToReadyBtn')) $('backToReadyBtn').addEventListener('click', showSenderReadyView);
    if ($('quickRevealBtn')) $('quickRevealBtn').addEventListener('click', completeReveal);

    /* Instant 1-Tap Surprise Gift Unlock & Downloads */
    if ($('senderRevealGiftBtn')) {
      $('senderRevealGiftBtn').addEventListener('click', () => unlockGiftVault('sender'));
    }
    if ($('downloadGiftCardBtn')) {
      $('downloadGiftCardBtn').addEventListener('click', () => downloadOrShareStoryGift('sender', false));
    }
    if ($('shareGiftImageBtn')) {
      $('shareGiftImageBtn').addEventListener('click', () => downloadOrShareStoryGift('sender', true));
    }

    if ($('receiverRevealGiftBtn')) {
      $('receiverRevealGiftBtn').addEventListener('click', () => unlockGiftVault('receiver'));
    }
    if ($('receiverGiftBtn')) {
      $('receiverGiftBtn').addEventListener('click', () => downloadOrShareStoryGift('receiver', false));
    }
    if ($('receiverShareGiftImageBtn')) {
      $('receiverShareGiftImageBtn').addEventListener('click', () => downloadOrShareStoryGift('receiver', true));
    }

    if ($('downloadRevealedCardBtn')) {
      $('downloadRevealedCardBtn').addEventListener('click', downloadRevealedNotePng);
    }
    if ($('sealBackBtn')) {
      $('sealBackBtn').addEventListener('click', () => showWriteComposer(false));
    }
    if ($('openShareModalBtn')) {
      $('openShareModalBtn').addEventListener('click', () => {
        if ($('revealShareModal')) $('revealShareModal').classList.remove('hidden');
      });
    }

    /* Reactions */
    qsa('#receiverReactionsRow .react-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        qsa('#receiverReactionsRow .react-pill').forEach((p) => p.classList.remove('is-picked'));
        btn.classList.add('is-picked');
        const emoji = btn.dataset ? btn.dataset.react : '❤️';
        state.reaction = emoji;
        burstFloatingEmoji(emoji);
        playChime();
        showToast(`${emoji} Reaction felt! Tap Reply Secret to message back.`);
      });
    });

    /* Reveal Popup Modal */
    if ($('closeRevealModalBtn')) {
      $('closeRevealModalBtn').addEventListener('click', () => {
        if ($('revealShareModal')) $('revealShareModal').classList.add('hidden');
      });
    }
    if ($('modalClaimGiftBtn')) {
      $('modalClaimGiftBtn').addEventListener('click', () => {
        if ($('revealShareModal')) $('revealShareModal').classList.add('hidden');
        downloadOrShareStoryGift('receiver', false);
      });
    }
    if ($('modalShareWhatsAppBtn')) {
      $('modalShareWhatsAppBtn').addEventListener('click', () => {
        const msg = `💌 Check out Unseal — create secret scratch notes & 9:16 Story Gift Cards:\n${CONFIG.siteOrigin}/`;
        openExternalShare(`https://wa.me/?text=${encodeURIComponent(msg)}`);
      });
    }
    if ($('modalShareNativeBtn')) {
      $('modalShareNativeBtn').addEventListener('click', async () => {
        const appUrl = CONFIG.siteOrigin + '/';
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          try {
            await navigator.share({
              title: 'Unseal — Secret Scratch Notes',
              text: 'Seal a secret scratch card note + 9:16 Story Gift Card 💌',
              url: appUrl
            });
            return;
          } catch (_) {}
        }
        copyText(appUrl, '🔗 Unseal link copied!');
      });
    }
    if ($('modalReplyBtn')) {
      $('modalReplyBtn').addEventListener('click', () => showWriteComposer(false));
    }

    /* Theme Studio Modal */
    if ($('themeToggleBtn')) {
      $('themeToggleBtn').addEventListener('click', () => {
        if ($('themeModal')) $('themeModal').classList.remove('hidden');
      });
    }
    if ($('closeThemeModalBtn')) {
      $('closeThemeModalBtn').addEventListener('click', () => {
        if ($('themeModal')) $('themeModal').classList.add('hidden');
      });
    }
    if ($('themeAutoBtn')) {
      $('themeAutoBtn').addEventListener('click', () => {
        applyTheme('auto');
        if ($('themeModal')) $('themeModal').classList.add('hidden');
        showToast('✨ Auto Calendar Theme enabled');
      });
    }
    qsa('#themeGrid .theme-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset ? btn.dataset.themeId : 'atelier';
        applyTheme(id);
        if ($('themeModal')) $('themeModal').classList.add('hidden');
        const label = THEME_META[id] ? THEME_META[id].desc : id;
        showToast(`🎨 Theme switched to ${label}`);
      });
    });

    /* Header Utilities: Fullscreen & Audio */
    if ($('audioToggleBtn')) {
      $('audioToggleBtn').addEventListener('click', () => {
        state.audioOn = !state.audioOn;
        $('audioToggleBtn').setAttribute('aria-pressed', state.audioOn ? 'true' : 'false');
        if ($('audioToggleIcon')) $('audioToggleIcon').textContent = state.audioOn ? '🔊' : '🔇';
        if (state.audioOn) {
          ensureAudio();
          playChime();
          showToast('🔊 Scratch & reveal sound enabled');
        } else {
          showToast('🔇 Sound muted');
        }
      });
    }

    if ($('fullscreenToggleBtn')) {
      $('fullscreenToggleBtn').addEventListener('click', () => {
        const root = document.documentElement;
        if (typeof document.fullscreenElement !== 'undefined' && document.fullscreenElement) {
          if (typeof document.exitFullscreen === 'function') document.exitFullscreen().catch(() => {});
        } else if (root && typeof root.requestFullscreen === 'function') {
          root.requestFullscreen().catch(() => showToast('⛶ Press F11 on desktop for full screen'));
        }
      });
    }

    /* PWA Install Events & Triggers */
    if ($('bibInstallBtn')) $('bibInstallBtn').addEventListener('click', triggerInstallFlow);
    if ($('installAppBtn')) $('installAppBtn').addEventListener('click', triggerInstallFlow);
    if ($('footerInstallAppBtn')) $('footerInstallAppBtn').addEventListener('click', triggerInstallFlow);
    if ($('bibDismissBtn')) {
      $('bibDismissBtn').addEventListener('click', () => {
        state.bannerDismissed = true;
        refreshInstallBanner();
      });
    }
    if ($('closeInstallOverlayBtn')) {
      $('closeInstallOverlayBtn').addEventListener('click', () => {
        if ($('pwaInstallOverlay')) $('pwaInstallOverlay').classList.add('hidden');
      });
    }

    /* 1-Tap Note Chips */
    qsa('#ideasChipsGrid .idea-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if ($('recipientInput') && chip.dataset.rec) $('recipientInput').value = chip.dataset.rec;
        if ($('secretTextarea') && chip.dataset.msg) {
          $('secretTextarea').value = chip.dataset.msg;
          if ($('secretCharCount')) $('secretCharCount').textContent = `${chip.dataset.msg.length} / 280`;
        }
        if ($('clueInput') && chip.dataset.clue) $('clueInput').value = chip.dataset.clue;
        showWriteComposer(true);
        if ($('composerCard') && typeof $('composerCard').scrollIntoView === 'function') {
          $('composerCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showToast('✨ Note template loaded!');
      });
    });

    /* Legal Modal & Tabs */
    qsa('[data-open-legal]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        const target = link.dataset ? link.dataset.openLegal : 'privacy';
        qsa('.legal-tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.legalTab === target));
        qsa('.legal-panel').forEach((p) => p.classList.toggle('hidden', p.dataset.legalPanel !== target));
        if ($('legalModal')) $('legalModal').classList.remove('hidden');
      });
    });
    qsa('.legal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.legalTab;
        qsa('.legal-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        qsa('.legal-panel').forEach((p) => p.classList.toggle('hidden', p.dataset.legalPanel !== target));
      });
    });
    if ($('closeLegalModalBtn')) {
      $('closeLegalModalBtn').addEventListener('click', () => {
        if ($('legalModal')) $('legalModal').classList.add('hidden');
      });
    }
    if ($('abuseReportForm')) {
      $('abuseReportForm').addEventListener('submit', (e) => {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        const reason = $('reportReason') ? $('reportReason').value : 'Report';
        const details = $('reportDetails') ? $('reportDetails').value : '';
        openExternalShare(
          `mailto:support@unseal-cards.vercel.app?subject=${encodeURIComponent(reason)}&body=${encodeURIComponent(details)}`
        );
      });
    }

    bindScratchPointerEvents();
  }

  /* ==================== BOOT SEQUENCE ==================== */
  function registerServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof location !== 'undefined') {
      if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
    }
  }

  function boot() {
    applyTheme('auto');
    setFoil('gold');
    setFont('script');
    bindEvents();
    refreshInstallBanner();
    registerServiceWorker();

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('beforeinstallprompt', (e) => {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        state.deferredPrompt = e;
        state.bannerDismissed = false;
        refreshInstallBanner();
      });
      window.addEventListener('appinstalled', () => {
        state.deferredPrompt = null;
        if ($('browserInstallBanner')) $('browserInstallBanner').classList.add('hidden');
        if ($('installAppBtn')) $('installAppBtn').classList.add('hidden');
        showToast('🎉 Unseal installed! Open anytime from Home Screen.');
      });
      window.addEventListener('resize', () => {
        if (state.mode === 'preview' && !state.revealed) initScratchCanvas();
      });
    }

    const search = typeof location !== 'undefined' ? location.search : '';
    const hash = typeof location !== 'undefined' ? location.hash : '';
    const incoming = decodeLegacyHashOrSearch(search, hash);
    if (incoming && incoming.secret) {
      openReceiverView(incoming, false);
    } else {
      showWriteComposer(false);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})();
