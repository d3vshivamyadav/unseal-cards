/* ==========================================================================
   UNSEAL v8 — Flagship Full-Screen App Engine
   - Zero-Server Client Encryption (U4 Compact + U3/U2/U1/?seal=/?s= Legacy)
   - 12 Indian & Worldwide Auto/Manual Festival Themes
   - 100 Unique Random Collector Mystery Gift Cards (20 Palettes × 5 Motifs)
   - 5-Share WhatsApp Unlock + 1080×1920 High-Res PNG Export
   - Auto Browser PWA Install Prompt + Orbital Install Animation
   - Web Audio API ASMR Scratch & Chime + Haptic Feedback
   ========================================================================== */

(function () {
  'use strict';

  // ==================== CONFIG & ANALYTICS / ADSENSE ====================
  const CFG = window.UNSEAL_CONFIG || {};
  const PRODUCTION_ORIGIN = (CFG.siteOrigin || 'https://unseal-cards.vercel.app').replace(/\/+$/, '');
  const REQUIRED_SHARES = 5;
  const SCRATCH_REVEAL_RATIO = 0.42;
  const ALPHA_ID_LEN = 8;
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  function initAnalyticsAndAds() {
    if (typeof document === 'undefined' || !document.head) return;

    const gaId = CFG.ga4Id || '';
    if (gaId && gaId !== 'G-XXXXXXXXXX' && /^G-[A-Z0-9]+$/i.test(gaId)) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', gaId, { anonymize_ip: true, page_path: location.pathname });

      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(s);
    }

    const adsClient = CFG.adsenseClient || '';
    if (adsClient && adsClient !== 'ca-pub-0000000000000000' && /^ca-pub-\d+$/.test(adsClient)) {
      const adScript = document.createElement('script');
      adScript.async = true;
      adScript.crossOrigin = 'anonymous';
      adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsClient)}`;
      document.head.appendChild(adScript);
    }
  }

  function trackEvent(eventName, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params || {});
      }
    } catch (_) { /* no-op */ }
  }

  // ==================== 12 INDIAN & WORLDWIDE FESTIVAL THEMES ====================
  const FESTIVAL_THEMES = [
    {
      id: 'diwali',
      name: 'Diwali',
      region: 'India · Festival of Lights',
      emoji: '🪔',
      ribbon: '🪔 Happy Diwali Edition · Festival of Lights · Tap to switch',
      glyphs: ['🪔', '✨', '🎆', '✦', '💛'],
      swatch: '#D18E1F',
      confetti: ['#E88A1C', '#D9383A', '#F5D06B', '#B8294B'],
      greeting: 'Shubh Deepavali 🪔'
    },
    {
      id: 'holi',
      name: 'Holi',
      region: 'India · Festival of Colors',
      emoji: '🎨',
      ribbon: '🎨 Happy Holi Edition · Colors of Joy · Tap to switch',
      glyphs: ['🎨', '🌸', '💜', '✨', '🌈'],
      swatch: '#D6247A',
      confetti: ['#D6247A', '#22B8CF', '#F59F00', '#7950F2'],
      greeting: 'Happy Holi 🎨'
    },
    {
      id: 'eid',
      name: 'Eid Mubarak',
      region: 'India & Global · Crescent Moon',
      emoji: '🌙',
      ribbon: '🌙 Eid Mubarak Edition · Crescent Glow · Tap to switch',
      glyphs: ['🌙', '✨', '🕌', '✦', '💚'],
      swatch: '#0E7A56',
      confetti: ['#0E7A56', '#D4A853', '#FFFDF8', '#22C55E'],
      greeting: 'Eid Mubarak 🌙'
    },
    {
      id: 'navratri',
      name: 'Navratri & Puja',
      region: 'India · Garba & Festive Nights',
      emoji: '💃',
      ribbon: '🪔 Shubh Navratri & Durga Puja Edition · Tap to switch',
      glyphs: ['🪔', '🌺', '✨', '🪘', '❤️'],
      swatch: '#D9480F',
      confetti: ['#D9480F', '#E6B800', '#C2185B', '#FFFDF8'],
      greeting: 'Happy Navratri 🌺'
    },
    {
      id: 'rakhi',
      name: 'Raksha Bandhan',
      region: 'India · Thread of Love',
      emoji: '🧵',
      ribbon: '🧵 Raksha Bandhan Edition · Bond Forever · Tap to switch',
      glyphs: ['🧵', '✨', '💛', '🌺', '🎁'],
      swatch: '#C2255C',
      confetti: ['#C2255C', '#D4A853', '#F472B6', '#FFFDF8'],
      greeting: 'Happy Rakhi 🧵'
    },
    {
      id: 'pongal',
      name: 'Pongal / Sankranti',
      region: 'India · Harvest & Kites',
      emoji: '🪁',
      ribbon: '🪁 Happy Pongal & Makar Sankranti · Tap to switch',
      glyphs: ['🪁', '☀️', '🌾', '✨', '💛'],
      swatch: '#C2590B',
      confetti: ['#C2590B', '#16A34A', '#EAB308', '#FFFDF8'],
      greeting: 'Happy Sankranti 🪁'
    },
    {
      id: 'newyear',
      name: 'New Year',
      region: 'Worldwide · Midnight Spark',
      emoji: '🥂',
      ribbon: '🥂 Happy New Year Edition · Fresh Wishes · Tap to switch',
      glyphs: ['🥂', '🎆', '✨', '⭐', '🎊'],
      swatch: '#5234C8',
      confetti: ['#5234C8', '#D4A853', '#38BDF8', '#FFFDF8'],
      greeting: 'Happy New Year 🥂'
    },
    {
      id: 'valentine',
      name: 'Valentine’s Week',
      region: 'Worldwide · Love & Crushes',
      emoji: '💘',
      ribbon: '💘 Valentine Week Edition · Secret Confessions · Tap to switch',
      glyphs: ['💘', '🌹', '♥', '✨', '💌'],
      swatch: '#D01B46',
      confetti: ['#D01B46', '#FB7185', '#D4A853', '#FFFDF8'],
      greeting: 'With Love 💘'
    },
    {
      id: 'cherry',
      name: 'Spring Blossom',
      region: 'Worldwide · Sakura Glow',
      emoji: '🌸',
      ribbon: '🌸 Spring Sakura Edition · Soft Petals · Tap to switch',
      glyphs: ['🌸', '🌷', '✨', '🦋', '💗'],
      swatch: '#C0386B',
      confetti: ['#F472B6', '#FBCFE8', '#D4A853', '#FFFDF8'],
      greeting: 'Spring Glow 🌸'
    },
    {
      id: 'halloween',
      name: 'Halloween',
      region: 'Worldwide · Midnight Mystery',
      emoji: '🎃',
      ribbon: '🎃 Spooky Secret Edition · Trick or Unseal · Tap to switch',
      glyphs: ['🎃', '🦇', '✨', '🕯️', '🌙'],
      swatch: '#C2410C',
      confetti: ['#EA580C', '#7E22CE', '#1F2937', '#FACC15'],
      greeting: 'Spooky Secret 🎃'
    },
    {
      id: 'christmas',
      name: 'Christmas',
      region: 'Worldwide · Winter Velvet',
      emoji: '🎄',
      ribbon: '🎄 Merry Christmas Edition · Winter Velvet · Tap to switch',
      glyphs: ['🎄', '❄️', '✨', '🔔', '❤️'],
      swatch: '#B81F28',
      confetti: ['#B81F28', '#168048', '#D4A853', '#FFFDF8'],
      greeting: 'Merry Christmas 🎄'
    },
    {
      id: 'classic',
      name: 'Classic Linen',
      region: 'Timeless Signature Stationery',
      emoji: '✉️',
      ribbon: '✉️ Classic Signature Stationery · Tap to explore 12 Themes',
      glyphs: ['✨', '✦', '♥', '✧', '💌'],
      swatch: '#C8282B',
      confetti: ['#C8282B', '#D4A853', '#1E1B18', '#F4E5B8'],
      greeting: 'Sealed with Ink ✉️'
    }
  ];

  function detectFestivalByDate(now) {
    const d = now instanceof Date ? now : new Date();
    const yr = d.getFullYear();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const md = mm * 100 + dd;

    if (md >= 101 && md <= 107) return 'newyear';
    if (md >= 112 && md <= 117) return 'pongal';
    if (md >= 207 && md <= 216) return 'valentine';

    // Exact 2026-2028 lunar approximations for Holi & Eid + spring cherry
    if ((yr === 2026 && md >= 301 && md <= 306) || (yr === 2027 && md >= 320 && md <= 325) || (mm === 3 && dd <= 6)) return 'holi';
    if ((yr === 2026 && ((md >= 318 && md <= 322) || (md >= 525 && md <= 529))) || (yr === 2027 && md >= 308 && md <= 312)) return 'eid';
    if (md >= 325 && md <= 420) return 'cherry';
    if (md >= 824 && md <= 831) return 'rakhi';
    if (md >= 1010 && md <= 1022) return 'navratri';
    if (md >= 1026 && md <= 1102) return 'halloween';
    if (md >= 1103 && md <= 1116) return 'diwali';
    if (md >= 1218 && md <= 1229) return 'christmas';
    if (md >= 1230 && md <= 1231) return 'newyear';
    return 'classic';
  }

  function getThemeById(id) {
    return FESTIVAL_THEMES.find((t) => t.id === id) || FESTIVAL_THEMES[FESTIVAL_THEMES.length - 1];
  }

  // ==================== 100 UNIQUE PRE-DESIGNED COLLECTOR GIFT CARDS ====================
  // 20 Luxury Palettes × 5 Procedural Geometric Artwork Engines = 100 Unique Cards (#001..#100)
  const GIFT_PALETTES = [
    { name: 'Royal Crimson Foil',     bg1: '#2C0B13', bg2: '#5B1628', gold: '#F4CE74', soft: 'rgba(244,206,116,0.22)', ink: '#FFF9ED' },
    { name: 'Emerald Crescent Silk',  bg1: '#072419', bg2: '#0E4E37', gold: '#E8C568', soft: 'rgba(232,197,104,0.22)', ink: '#F3FFF9' },
    { name: 'Midnight Sapphire',      bg1: '#0A1633', bg2: '#1C3670', gold: '#93C5FD', soft: 'rgba(147,197,253,0.22)', ink: '#F0F6FF' },
    { name: 'Saffron Diya Velvet',    bg1: '#331405', bg2: '#7A300B', gold: '#FBBF24', soft: 'rgba(251,191,36,0.22)',  ink: '#FFF9EC' },
    { name: 'Rose Quartz Satin',      bg1: '#3B1124', bg2: '#7D234A', gold: '#FBCFE8', soft: 'rgba(251,207,232,0.22)', ink: '#FFF4F9' },
    { name: 'Obsidian Champagne',     bg1: '#141210', bg2: '#2D2721', gold: '#EED39B', soft: 'rgba(238,211,155,0.22)', ink: '#FFFDF7' },
    { name: 'Amethyst Twilight',      bg1: '#1E0C38', bg2: '#4A1F82', gold: '#DDD6FE', soft: 'rgba(221,214,254,0.22)', ink: '#FAF5FF' },
    { name: 'Peacock Teal Silk',      bg1: '#062329', bg2: '#0F5261', gold: '#5EEAD4', soft: 'rgba(94,234,212,0.22)',  ink: '#F0FDFA' },
    { name: 'Garnet Imperial',        bg1: '#2E0909', bg2: '#6F1414', gold: '#FDE08D', soft: 'rgba(253,224,141,0.22)', ink: '#FFF5F5' },
    { name: 'Antique Bronze Folio',   bg1: '#291B0E', bg2: '#5E3E1F', gold: '#FDE68A', soft: 'rgba(253,230,138,0.22)', ink: '#FFFDF5' },
    { name: 'Gulal Magenta Glow',     bg1: '#3B072D', bg2: '#831862', gold: '#F9A8D4', soft: 'rgba(249,168,212,0.22)', ink: '#FFF5FC' },
    { name: 'Cobalt Gold Leaf',       bg1: '#0D1B44', bg2: '#1E3A8A', gold: '#FACC15', soft: 'rgba(250,204,21,0.22)',  ink: '#F8FAFF' },
    { name: 'Imperial Jade Brocade',  bg1: '#09261E', bg2: '#14543E', gold: '#A7F3D0', soft: 'rgba(167,243,208,0.22)', ink: '#F0FFF8' },
    { name: 'Plum Nocturne Foil',     bg1: '#260E29', bg2: '#58215E', gold: '#F0ABFC', soft: 'rgba(240,171,252,0.22)', ink: '#FEF5FF' },
    { name: 'Copper Sunset Ink',      bg1: '#36140A', bg2: '#7C2D12', gold: '#FDBA74', soft: 'rgba(253,186,116,0.22)', ink: '#FFF7ED' },
    { name: 'Indigo Constellation',   bg1: '#0F172A', bg2: '#312E81', gold: '#C7D2FE', soft: 'rgba(199,210,254,0.22)', ink: '#F5F7FF' },
    { name: 'Burgundy Wax Reserve',   bg1: '#290A18', bg2: '#641738', gold: '#F7D08A', soft: 'rgba(247,208,138,0.22)', ink: '#FFF6FA' },
    { name: 'Marigold Toran Gold',    bg1: '#361E04', bg2: '#784208', gold: '#FDE047', soft: 'rgba(253,224,71,0.22)',  ink: '#FFFBEB' },
    { name: 'Arctic Platinum Mist',   bg1: '#111827', bg2: '#334155', gold: '#E2E8F0', soft: 'rgba(226,232,240,0.22)', ink: '#F8FAFC' },
    { name: 'Lotus Coral Reserve',    bg1: '#38121B', bg2: '#88273B', gold: '#FED7AA', soft: 'rgba(254,215,170,0.22)', ink: '#FFF5F6' }
  ];

  const GIFT_MOTIFS = [
    { key: 'mandala',       title: 'Mandala Crown',       crest: '🪷' },
    { key: 'sunburst',      title: 'Art Deco Sunburst',   crest: '☀️' },
    { key: 'aurora',        title: 'Aurora Silk Wave',    crest: '🌊' },
    { key: 'constellation', title: 'Celestial Star Map',  crest: '✨' },
    { key: 'heritage',      title: 'Royal Heritage Arch', crest: '👑' }
  ];

  const GIFT_FORTUNES = [
    'An unexpected message this week changes your whole mood ✨',
    'Someone secretly replays your old conversations & smiles 💌',
    'Main-character luck finds you before the weekend ends 🌟',
    'A tiny daring step brings the exact answer you hoped for 🔥',
    'Your warmth leaves quiet impressions nobody forgets 🫶',
    'A late-night notification brings good news very soon 🌙',
    'Pure magnet energy: people notice the room shift when you arrive 👑',
    'Good vibes & honest friendships gather closely around you 🪷',
    'A bold coincidence turns into your favorite memory soon 🎆',
    'Someone is rooting for you silently—keep shining bright ☀️'
  ];

  function getCollectorDesign(index) {
    const safeIdx = ((Math.floor(index) % 100) + 100) % 100;
    const palette = GIFT_PALETTES[Math.floor(safeIdx / 5)];
    const motif = GIFT_MOTIFS[safeIdx % 5];
    const editionNum = safeIdx + 1;
    const editionStr = String(editionNum).padStart(3, '0');
    const aura = 89 + ((safeIdx * 7) % 11); // 89..99%
    const rarity = safeIdx % 17 === 0 ? 'MYTHIC 1/1'
      : safeIdx % 7 === 0 ? 'ULTRA RARE'
      : safeIdx % 3 === 0 ? 'ROYAL FOIL'
      : 'LIMITED EDITION';
    const fortune = GIFT_FORTUNES[(safeIdx * 3) % GIFT_FORTUNES.length];

    return {
      index: safeIdx,
      editionNum,
      editionStr,
      badge: `#${editionStr}/100`,
      palette,
      motif,
      rarity,
      aura,
      title: `${motif.title} · ${palette.name}`,
      fortune
    };
  }

  function renderCollectorSvgMarkup(design) {
    const col = design.palette.gold;
    const m = design.motif.key;
    const w = 360;
    const h = 220;
    const cx = w / 2;
    const cy = h / 2;

    if (m === 'mandala') {
      let spokes = '';
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        const x2 = (cx + Math.cos(ang) * 145).toFixed(1);
        const y2 = (cy + Math.sin(ang) * 145).toFixed(1);
        spokes += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-opacity="0.18" stroke-width="1"/>`;
      }
      return `
        <circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="${col}" stroke-opacity="0.22" stroke-width="1.2" stroke-dasharray="5 4"/>
        <circle cx="${cx}" cy="${cy}" r="66" fill="none" stroke="${col}" stroke-opacity="0.28" stroke-width="1.2"/>
        <circle cx="${cx}" cy="${cy}" r="36" fill="none" stroke="${col}" stroke-opacity="0.25" stroke-width="1"/>
        ${spokes}
        <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="12" fill="none" stroke="${col}" stroke-opacity="0.25" stroke-width="1"/>
      `;
    }

    if (m === 'sunburst') {
      let rays = '';
      for (let i = 0; i < 18; i++) {
        const ang = (i * Math.PI) / 9;
        const x2 = (cx + Math.cos(ang) * 210).toFixed(1);
        const y2 = (cy + Math.sin(ang) * 210).toFixed(1);
        rays += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-opacity="0.16" stroke-width="2"/>`;
      }
      return `
        ${rays}
        <polygon points="${cx},18 334,${cy} ${cx},${h - 18} 26,${cy}" fill="none" stroke="${col}" stroke-opacity="0.26" stroke-width="1.2"/>
        <rect x="12" y="12" width="${w - 24}" height="${h - 24}" rx="10" fill="none" stroke="${col}" stroke-opacity="0.22" stroke-width="1"/>
      `;
    }

    if (m === 'aurora') {
      return `
        <path d="M-10,165 C80,95 160,195 250,115 C300,72 340,120 380,85" fill="none" stroke="${col}" stroke-opacity="0.32" stroke-width="3"/>
        <path d="M-10,120 C90,55 180,155 280,75 C325,40 350,80 380,52" fill="none" stroke="${col}" stroke-opacity="0.22" stroke-width="2"/>
        <path d="M-10,190 C100,130 190,210 300,145 L380,115 L380,230 L-10,230 Z" fill="${col}" fill-opacity="0.08"/>
        <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="12" fill="none" stroke="${col}" stroke-opacity="0.22" stroke-width="1"/>
      `;
    }

    if (m === 'constellation') {
      const pts = [[46, 48], [108, 32], [176, 62], [244, 34], [312, 68], [286, 152], [202, 178], [88, 162]];
      let lines = '';
      let dots = '';
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        dots += `<circle cx="${x}" cy="${y}" r="2.6" fill="${col}" fill-opacity="0.55"/>`;
        if (i + 1 < pts.length) {
          const [nx, ny] = pts[i + 1];
          lines += `<line x1="${x}" y1="${y}" x2="${nx}" y2="${ny}" stroke="${col}" stroke-opacity="0.24" stroke-width="1" stroke-dasharray="3 3"/>`;
        }
      }
      return `
        ${lines}
        ${dots}
        <circle cx="${cx}" cy="${cy}" r="80" fill="none" stroke="${col}" stroke-opacity="0.14" stroke-width="1"/>
        <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="12" fill="none" stroke="${col}" stroke-opacity="0.22" stroke-width="1"/>
      `;
    }

    // heritage arch
    return `
      <path d="M36,${h - 14} L36,88 Q36,24 ${cx},22 Q${w - 36},24 ${w - 36},88 L${w - 36},${h - 14}" fill="none" stroke="${col}" stroke-opacity="0.34" stroke-width="1.6"/>
      <path d="M52,${h - 14} L52,92 Q52,40 ${cx},38 Q${w - 52},40 ${w - 52},92 L${w - 52},${h - 14}" fill="none" stroke="${col}" stroke-opacity="0.2" stroke-width="1"/>
      <circle cx="30" cy="30" r="10" fill="none" stroke="${col}" stroke-opacity="0.3"/>
      <circle cx="${w - 30}" cy="30" r="10" fill="none" stroke="${col}" stroke-opacity="0.3"/>
      <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="12" fill="none" stroke="${col}" stroke-opacity="0.25" stroke-width="1"/>
    `;
  }

  function drawCanvasCollectorMotif(ctx, W, H, design) {
    const col = design.palette.gold;
    const m = design.motif.key;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;

    if (m === 'mandala') {
      const cx = W / 2;
      const cy = 620;
      ctx.globalAlpha = 0.16;
      [180, 290, 410].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 440, cy + Math.sin(a) * 440);
        ctx.stroke();
      }
    } else if (m === 'sunburst') {
      const cx = W / 2;
      const cy = 580;
      ctx.globalAlpha = 0.13;
      ctx.lineWidth = 3;
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
        ctx.stroke();
      }
    } else if (m === 'aurora') {
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 6;
      [420, 560, 1280].forEach((yBase, idx) => {
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        ctx.bezierCurveTo(W * 0.3, yBase - 140 + idx * 30, W * 0.7, yBase + 140, W, yBase - 60);
        ctx.stroke();
      });
    } else if (m === 'constellation') {
      ctx.globalAlpha = 0.28;
      const pts = [[160, 290], [380, 240], [640, 340], [880, 260], [920, 1520], [560, 1620], [180, 1540]];
      ctx.lineWidth = 2;
      pts.forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        if (i + 1 < pts.length) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
          ctx.stroke();
        }
      });
    } else {
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(96, H - 140);
      ctx.lineTo(96, 360);
      ctx.quadraticCurveTo(W / 2, 95, W - 96, 360);
      ctx.lineTo(W - 96, H - 140);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==================== ULTRA-SHORT URL & TEXT CODEC ====================
  // Preserves exact character fidelity (English, Hindi/Devanagari, Emojis, Newlines)
  const MOOD_LIST = ['Auto', '💌 Crush', '🪔 Festive', '🌙 2 AM', '🎲 Dare', '🫶 Praise'];

  function bytesToB64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64UrlToBytes(str) {
    let pad = str.replace(/-/g, '+').replace(/_/g, '/');
    while (pad.length % 4) pad += '=';
    const bin = atob(pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // 1-Byte Devanagari + UTF-8 Hybrid Byte Stream
  // 0x00..0x7F -> ASCII; 0x80 -> next byte + 0x0900 (Devanagari); 0x81 + len + raw UTF-8 chunk
  function packCompactText(str) {
    const out = [];
    const utf8 = new TextEncoder();
    for (const ch of String(str || '')) {
      const cp = ch.codePointAt(0);
      if (cp <= 0x7F) {
        out.push(cp);
      } else if (cp >= 0x0900 && cp <= 0x097F) {
        out.push(0x80, cp - 0x0900);
      } else {
        const raw = utf8.encode(ch);
        out.push(0x80 + raw.length);
        for (let i = 0; i < raw.length; i++) out.push(raw[i]);
      }
    }
    return new Uint8Array(out);
  }

  function unpackCompactText(bytes) {
    const utf8 = new TextDecoder();
    let res = '';
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i++];
      if (b <= 0x7F) {
        res += String.fromCharCode(b);
      } else if (b === 0x80) {
        const off = bytes[i++] || 0;
        res += String.fromCodePoint(0x0900 + off);
      } else {
        const len = Math.min(4, b - 0x80);
        const slice = bytes.slice(i, i + len);
        i += len;
        res += utf8.decode(slice);
      }
    }
    return res;
  }

  // 6-Bit Dictionary for Common English + Hinglish Characters (Fallback raw on 63)
  const DICT6 = ' etaoinsrhldcumfpgwybvkxjqz.,!?\'-\n0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const DICT6_IDX = new Map();
  for (let i = 0; i < 63; i++) DICT6_IDX.set(DICT6.charCodeAt(i), i);

  function packSixBitStream(compactBytes) {
    const bits = [];
    const push6 = (v) => {
      for (let b = 5; b >= 0; b--) bits.push((v >> b) & 1);
    };
    const push8 = (v) => {
      for (let b = 7; b >= 0; b--) bits.push((v >> b) & 1);
    };

    for (let i = 0; i < compactBytes.length; i++) {
      const byte = compactBytes[i];
      const idx = DICT6_IDX.get(byte);
      if (idx !== undefined) {
        push6(idx);
      } else {
        push6(63);
        push8(byte);
      }
    }
    // End marker: code 63 followed by 0xFF (not emitted naturally for compact text unless explicit; handle via byte length!)
    const padded = new Uint8Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
      if (bits[i]) padded[i >> 3] |= (1 << (7 - (i & 7)));
    }
    return { bytes: padded, origLen: compactBytes.length };
  }

  function unpackSixBitStream(packedBytes, origCompactLen) {
    let bitPos = 0;
    const totalBits = packedBytes.length * 8;
    const readBits = (n) => {
      let val = 0;
      for (let k = 0; k < n; k++) {
        val <<= 1;
        if (bitPos < totalBits) {
          const byte = packedBytes[bitPos >> 3];
          if ((byte >> (7 - (bitPos & 7))) & 1) val |= 1;
        }
        bitPos++;
      }
      return val;
    };

    const out = [];
    while (out.length < origCompactLen && bitPos + 6 <= totalBits) {
      const sym = readBits(6);
      if (sym < 63) {
        out.push(DICT6.charCodeAt(sym));
      } else {
        if (bitPos + 8 > totalBits) break;
        out.push(readBits(8));
      }
    }
    return new Uint8Array(out);
  }

  function safeRandAlphaId(len) {
    const chars = [];
    const arr = new Uint8Array(len);
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    for (let i = 0; i < len; i++) {
      chars.push(ALPHABET[arr[i] % ALPHABET.length]);
    }
    return chars.join('');
  }

  function sanitizeRecSlug(name) {
    const ascii = String(name || 'You')
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^A-Za-z0-9]/g, '');
    return (ascii || 'You').slice(0, 14);
  }

  function isValidCardId(id) {
    return /^[A-Za-z]{8}$/.test(String(id || ''));
  }

  // Encode v8 ultra-short fragment: "4" + b64url([flags, rLen, lenHi, lenLo, recBytes..., body...])
  function encodePayloadV4(payload) {
    const cleanRec = Array.from(String(payload.r || 'You')).slice(0, 32).join('');
    const rCompact = packCompactText(cleanRec);
    const sCompact = packCompactText(payload.s || '');
    const cCompact = packCompactText(payload.c || '');
    const joined = new Uint8Array(sCompact.length + 1 + cCompact.length);
    joined.set(sCompact, 0);
    joined[sCompact.length] = 0xFF; // UTF-8 & packCompactText never emit 0xFF
    joined.set(cCompact, sCompact.length + 1);

    const six = packSixBitStream(joined);
    const useSix = six.bytes.length < joined.length;
    const body = useSix ? six.bytes : joined;

    const moodIdx = Math.max(0, Math.min(5, MOOD_LIST.indexOf(payload.m || 'Auto')));
    const rLen = Math.min(255, rCompact.length);
    const lenHi = (joined.length >> 8) & 0xFF;
    const lenLo = joined.length & 0xFF;
    const flags = (useSix ? 0x01 : 0x00) | ((moodIdx & 0x07) << 1);

    const frame = new Uint8Array(4 + rLen + body.length);
    frame[0] = flags;
    frame[1] = rLen;
    frame[2] = lenHi;
    frame[3] = lenLo;
    frame.set(rCompact.slice(0, rLen), 4);
    frame.set(body, 4 + rLen);
    return '4' + bytesToB64Url(frame);
  }

  function decodePayloadV4(hashToken, slugRec, slugId) {
    const b64 = hashToken.slice(1);
    const frame = b64UrlToBytes(b64);
    if (frame.length < 4) return null;

    const flags = frame[0];
    const useSix = (flags & 0x01) === 1;
    const moodIdx = (flags >> 1) & 0x07;
    const rLen = frame[1];
    const joinedLen = (frame[2] << 8) | frame[3];

    const rBytes = frame.slice(4, 4 + rLen);
    const body = frame.slice(4 + rLen);
    const decodedJoined = useSix ? unpackSixBitStream(body, joinedLen) : body;

    const sepIdx = decodedJoined.indexOf(0xFF);
    const sBytes = sepIdx >= 0 ? decodedJoined.slice(0, sepIdx) : decodedJoined;
    const cBytes = sepIdx >= 0 ? decodedJoined.slice(sepIdx + 1) : new Uint8Array(0);

    const rec = unpackCompactText(rBytes) || slugRec || 'You';
    const sec = unpackCompactText(sBytes);
    const clue = unpackCompactText(cBytes);
    if (!sec) return null;

    return {
      r: rec,
      s: sec,
      c: clue,
      m: MOOD_LIST[moodIdx] || 'Auto',
      id: isValidCardId(slugId) ? slugId : safeRandAlphaId(ALPHA_ID_LEN)
    };
  }

  function decodeLegacyJson(token, fallbackId) {
    try {
      let pad = token.replace(/-/g, '+').replace(/_/g, '/');
      while (pad.length % 4) pad += '=';
      const bytes = b64UrlToBytes(pad);
      const raw = new TextDecoder().decode(bytes);
      const obj = JSON.parse(raw);
      if (!obj || !obj.s) return null;
      return {
        r: obj.r || 'You',
        s: String(obj.s),
        c: obj.c || '',
        m: obj.m || 'Auto',
        id: isValidCardId(obj.id) ? obj.id : (fallbackId || safeRandAlphaId(ALPHA_ID_LEN))
      };
    } catch (_) {
      return null;
    }
  }

  function getBasePageUrl() {
    const loc = window.location || {};
    if (loc.protocol === 'file:') return `${PRODUCTION_ORIGIN}/`;
    if (loc.origin && loc.origin !== 'null') {
      const cleanPath = (loc.pathname || '/').replace(/index\.html$/i, '');
      return `${loc.origin}${cleanPath.endsWith('/') ? cleanPath : cleanPath + '/'}`;
    }
    return `${PRODUCTION_ORIGIN}/`;
  }

  function buildShareUrl(payload) {
    const recSlug = sanitizeRecSlug(payload.r);
    const id = isValidCardId(payload.id) ? payload.id : safeRandAlphaId(ALPHA_ID_LEN);
    payload.id = id;
    const frag = encodePayloadV4(payload);
    return `${getBasePageUrl()}?${recSlug}-${id}#${frag}`;
  }

  function parseIncomingLink() {
    const search = (window.location && window.location.search) || '';
    const hash = ((window.location && window.location.hash) || '').replace(/^#/, '');

    // Check legacy ?seal= or ?s=
    if (search) {
      const sp = new URLSearchParams(search);
      const seal = sp.get('seal') || sp.get('s');
      if (seal) {
        const leg = decodeLegacyJson(seal);
        if (leg) return leg;
      }
    }

    // Parse ?Name-8LetterId
    let slugRec = 'You';
    let slugId = '';
    const qMatch = search.match(/^\?([A-Za-z0-9]+)-([A-Za-z]{8})(?:&|$)/);
    if (qMatch) {
      slugRec = qMatch[1];
      slugId = qMatch[2];
    }

    if (hash) {
      if (hash.startsWith('4')) {
        try {
          const decoded = decodePayloadV4(hash, slugRec, slugId);
          if (decoded) return decoded;
        } catch (_) { /* try fallback */ }
      }
      if (hash.startsWith('U3') || hash.startsWith('U2') || hash.startsWith('U1') || hash.startsWith('U4')) {
        const legHash = decodeLegacyJson(hash.slice(2), slugId);
        if (legHash) return legHash;
      }
    }
    return null;
  }

  // ==================== WEB AUDIO ASMR & SOUND EFFECTS ====================
  const AudioFX = {
    enabled: false,
    ctx: null,
    lastScratchMs: 0,
    ensureCtx() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },
    playScratchGrain() {
      if (!this.enabled) return;
      const now = performance.now();
      if (now - this.lastScratchMs < 55) return;
      this.lastScratchMs = now;
      const ctx = this.ensureCtx();
      if (!ctx) return;

      const dur = 0.045;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.25;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 900;
      filter.Q.value = 1.6;
      const gain = ctx.createGain();
      gain.gain.value = 0.22;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    },
    playChime() {
      if (!this.enabled) return;
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + idx * 0.085;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.58);
      });
    },
    playPop() {
      if (!this.enabled) return;
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.08);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  };

  function safeVibrate(pattern) {
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (_) { /* ignored */ }
  }

  // ==================== APP STATE & DOM CACHE ====================
  function $(id) { return document.getElementById(id); }

  const state = {
    mode: 'write', // 'write' | 'ready' | 'preview' | 'receiver'
    mood: 'Auto',
    festival: getThemeById(detectFestivalByDate()),
    activePayload: null,
    currentUrl: '',
    revealed: false,
    deferredPrompt: null,
    lastHapticMs: 0,
    moveTick: 0
  };

  // Safe localStorage helpers
  function lsGet(k) {
    try { return window.localStorage ? window.localStorage.getItem(k) : null; } catch (_) { return null; }
  }

  function lsSet(k, v) {
    try { if (window.localStorage) window.localStorage.setItem(k, String(v)); } catch (_) { /* no-op */ }
  }

  function lsRemove(k) {
    try { if (window.localStorage && typeof window.localStorage.removeItem === 'function') window.localStorage.removeItem(k); } catch (_) { /* no-op */ }
  }

  function getRolledDesignIndex(cardId, role) {
    const key = `unseal_v8_design_${role}_${cardId}`;
    const saved = lsGet(key);
    if (saved !== null && /^\d+$/.test(saved)) {
      return Number(saved) % 100;
    }

    let picked = Math.floor(Math.random() * 100);
    // Avoid giving receiver identical edition number if previewed on same device as sender
    if (role === 'receiver') {
      const senderSaved = lsGet(`unseal_v8_design_sender_${cardId}`);
      if (senderSaved !== null && Number(senderSaved) === picked) {
        picked = (picked + 13) % 100;
      }
    }
    lsSet(key, String(picked));
    return picked;
  }

  function getShareCount(cardId, role) {
    const key = `unseal_v8_shares_${role}_${cardId}`;
    const raw = lsGet(key);
    return Math.max(0, Math.min(REQUIRED_SHARES, parseInt(raw || '0', 10) || 0));
  }

  function incrementShareCount(cardId, role) {
    const cur = getShareCount(cardId, role);
    const next = Math.min(REQUIRED_SHARES, cur + 1);
    lsSet(`unseal_v8_shares_${role}_${cardId}`, String(next));
    return next;
  }

  // ==================== FESTIVAL THEME MANAGEMENT ====================
  function applyFestivalTheme(themeId, isManual) {
    const theme = getThemeById(themeId);
    state.festival = theme;

    if (document.documentElement && typeof document.documentElement.setAttribute === 'function') {
      document.documentElement.setAttribute('data-festival', theme.id);
    }

    if (isManual) lsSet('unseal_v8_festival_override', theme.id);

    const festEmoji = $('festivalEmoji');
    const festShort = $('festivalShortLabel');
    const ribbonText = $('festivalRibbonText');
    if (festEmoji) festEmoji.textContent = theme.emoji;
    if (festShort) festShort.textContent = theme.name.split(' ')[0];
    if (ribbonText) ribbonText.textContent = theme.ribbon;

    const sparkNodes = document.querySelectorAll ? document.querySelectorAll('#ambientSparkles .spark-dot') : [];
    for (let i = 0; i < sparkNodes.length; i++) {
      const g = theme.glyphs[i % theme.glyphs.length];
      if (typeof sparkNodes[i].setAttribute === 'function') {
        sparkNodes[i].setAttribute('data-glyph', g);
      }
    }

    renderFestivalModalGrid();
  }

  function renderFestivalModalGrid() {
    const grid = $('festivalThemeGrid');
    const autoNameEl = $('autoFestivalDetectedName');
    const autoTheme = getThemeById(detectFestivalByDate());
    if (autoNameEl) autoNameEl.textContent = `${autoTheme.emoji} ${autoTheme.name}`;
    if (!grid) return;

    const parts = FESTIVAL_THEMES.map((t) => {
      const activeCls = state.festival && state.festival.id === t.id ? ' active' : '';
      return `<button type="button" class="festival-option-btn${activeCls}" data-fest-id="${t.id}">
        <div class="fest-opt-top">
          <span>${t.emoji}</span>
          <span class="fest-opt-swatch" style="background:${t.swatch};"></span>
        </div>
        <span class="fest-opt-name">${t.name}</span>
        <span class="fest-opt-region">${t.region}</span>
      </button>`;
    });
    grid.innerHTML = parts.join('');
  }

  // ==================== CONFETTI ENGINE (FESTIVAL-AWARE) ====================
  function burstConfetti(count) {
    if (typeof document === 'undefined' || !document.body) return;
    const colors = (state.festival && state.festival.confetti) || ['#C8282B', '#D4A853', '#1E1B18', '#FFFFFF'];
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) { canvas.remove(); return; }

    canvas.width = window.innerWidth || 400;
    canvas.height = window.innerHeight || 700;

    const pieces = [];
    const total = count || 58;
    for (let i = 0; i < total; i++) {
      pieces.push({
        x: canvas.width * (0.2 + Math.random() * 0.6),
        y: canvas.height * 0.42,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 14 - 3,
        size: 6 + Math.random() * 6,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.25
      });
    }

    let frame = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.42;
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55);
        ctx.restore();
      });
      if (frame < 88) {
        window.requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    };
    window.requestAnimationFrame(tick);
  }

  // ==================== 100-DESIGN COLLECTOR VAULT RENDERING ====================
  function renderVaultForRole(role) {
    const p = state.activePayload;
    if (!p) return;

    const cardId = p.id || 'Unseal01';
    const shares = getShareCount(cardId, role);
    const unlocked = shares >= REQUIRED_SHARES;
    const designIdx = getRolledDesignIndex(cardId, role);
    const design = getCollectorDesign(designIdx);

    const isSender = role === 'sender';
    const prefix = isSender ? 'sender' : 'receiver';

    const titleEl = $(`${prefix}GiftTitle`);
    const pillEl = $(`${prefix}QuestPill`);
    const progressEl = $(`${prefix}ProgressFill`);
    const trackEl = $(`${prefix}WaxTrack`);
    const miniCardEl = $(`${prefix}GiftMiniCard`);
    const svgEl = $(`${prefix}GiftSvgPattern`);
    const tierEl = $(`${prefix}GiftTierLabel`);
    const passIdEl = $(`${prefix}GiftPassId`);
    const crestEl = $(`${prefix}GiftCrest`);
    const mainTextEl = $(`${prefix}GiftMainText`);
    const subTextEl = $(`${prefix}GiftSubText`);
    const rarityEl = $(`${prefix}GiftRarityChip`);
    const veilEl = $(`${prefix}VaultVeil`);
    const veilTitleEl = $(`${prefix}VaultVeilTitle`);
    const veilSubEl = $(`${prefix}VaultVeilSub`);
    const waBtnEl = $(`${prefix}QuestWhatsAppBtn`);
    const waBtnTextEl = $(`${prefix}QuestBtnText`);
    const unlockedRowEl = $(`${prefix}GiftUnlockedBtns`);

    const pct = Math.round((shares / REQUIRED_SHARES) * 100);
    if (pillEl) pillEl.textContent = unlocked ? `Unlocked 5/5 ✨` : `${shares} / ${REQUIRED_SHARES} Shared`;
    if (progressEl && progressEl.style) progressEl.style.width = `${pct}%`;

    if (trackEl && typeof trackEl.querySelectorAll === 'function') {
      const slots = trackEl.querySelectorAll('.wax-slot');
      for (let i = 0; i < slots.length; i++) {
        slots[i].classList.toggle('is-cracked', i < shares);
        slots[i].textContent = i < shares ? '✓' : String(i + 1);
      }
    }

    if (miniCardEl && miniCardEl.style) {
      miniCardEl.style.setProperty('--gift-bg', `linear-gradient(135deg, ${design.palette.bg1} 0%, ${design.palette.bg2} 100%)`);
      miniCardEl.style.setProperty('--gift-ink', design.palette.ink);
      miniCardEl.classList.toggle('is-locked-vault', !unlocked);
    }

    if (svgEl) {
      svgEl.innerHTML = renderCollectorSvgMarkup(design);
    }

    if (titleEl) {
      titleEl.textContent = unlocked
        ? `🎁 UNLOCKED: EDITION ${design.badge}`
        : `🎁 YOUR RANDOM MYSTERY GIFT (${design.badge})`;
    }
    if (tierEl) tierEl.textContent = `${design.rarity} · ${state.festival.name.toUpperCase()}`;
    if (passIdEl) passIdEl.textContent = `#${cardId}`;
    if (crestEl) crestEl.textContent = design.motif.crest;

    const ownerName = isSender ? (p.from || 'Sender') : (p.r || 'Special One');
    if (mainTextEl) {
      mainTextEl.textContent = unlocked
        ? `${ownerName} · ${design.motif.title}`
        : `Edition ${design.badge} Sealed`;
    }
    if (subTextEl) {
      subTextEl.textContent = unlocked
        ? `Aura ${design.aura}% · ${design.fortune}`
        : `${design.palette.name} + Fortune inside`;
    }
    if (rarityEl) rarityEl.textContent = `${design.badge} Collector`;

    if (veilEl) veilEl.classList.toggle('hidden', unlocked);
    if (!unlocked && veilTitleEl) {
      const left = REQUIRED_SHARES - shares;
      veilTitleEl.textContent = `${left} More WhatsApp Share${left === 1 ? '' : 's'} to Crack Open`;
    }
    if (!unlocked && veilSubEl) {
      veilSubEl.textContent = `You rolled Edition ${design.badge} (${design.palette.name}) — unlock for 9:16 Story PNG!`;
    }

    if (waBtnEl) waBtnEl.classList.toggle('hidden', unlocked);
    if (waBtnTextEl && !unlocked) {
      waBtnTextEl.textContent = `💚 Share on WhatsApp to Crack Seal ${shares + 1}/5 →`;
    }
    if (unlockedRowEl) unlockedRowEl.classList.toggle('hidden', !unlocked);

    syncRevealPopupVault();
  }

  function syncRevealPopupVault() {
    const p = state.activePayload;
    if (!p) return;
    const cardId = p.id || 'Unseal01';
    const role = state.mode === 'ready' ? 'sender' : 'receiver';
    const shares = getShareCount(cardId, role);
    const unlocked = shares >= REQUIRED_SHARES;
    const design = getCollectorDesign(getRolledDesignIndex(cardId, role));

    const iconEl = $('popupGiftIcon');
    const nameLineEl = $('popupGiftNameLine');
    const copyEl = $('popupQuestProgressCopy');
    const modalTrack = $('modalWaxTrack');
    const waTextEl = $('modalWhatsAppBtnText');
    const claimTextEl = $('modalClaimBtnText');

    if (iconEl) iconEl.textContent = unlocked ? design.motif.crest : '🎁';
    if (nameLineEl) {
      nameLineEl.textContent = unlocked
        ? `Unlocked: ${design.badge} ${design.title}`
        : `Edition ${design.badge} Ready Inside Vault`;
    }
    if (copyEl) {
      copyEl.textContent = unlocked
        ? `5 / 5 shares completed! Aura ${design.aura}% Story Card ready.`
        : `Progress: ${shares} / ${REQUIRED_SHARES} WhatsApp shares completed`;
    }
    if (modalTrack && typeof modalTrack.querySelectorAll === 'function') {
      const slots = modalTrack.querySelectorAll('.wax-slot');
      for (let i = 0; i < slots.length; i++) {
        slots[i].classList.toggle('is-cracked', i < shares);
        slots[i].textContent = i < shares ? '✓' : String(i + 1);
      }
    }
    if (waTextEl) {
      waTextEl.textContent = unlocked
        ? `💚 Share Again on WhatsApp (Unlocked!)`
        : `💚 Share on WhatsApp to Unlock (${shares}/5)`;
    }
    if (claimTextEl) {
      claimTextEl.textContent = unlocked ? '🎁 Download 9:16 Gift Card' : `🔒 9:16 Gift Card (${shares}/5)`;
    }
  }

  // ==================== 1080×1920 STORY PNG EXPORTS ====================
  function wrapCanvasText(ctx, text, x, y, maxW, lineHeight) {
    const words = String(text || '').split(/\s+/);
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, curY);
        line = words[i];
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, curY);
    return curY + lineHeight;
  }

  async function generateGiftCardPng(role, shareNative) {
    const p = state.activePayload;
    if (!p) return;
    const cardId = p.id || 'Unseal01';
    const shares = getShareCount(cardId, role);
    if (shares < REQUIRED_SHARES) {
      triggerWhatsAppQuestShare(role);
      return;
    }

    const design = getCollectorDesign(getRolledDesignIndex(cardId, role));
    const owner = role === 'sender' ? (p.from || 'Mystery Sender') : (p.r || 'Special One');
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rich Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, design.palette.bg1);
    grad.addColorStop(1, design.palette.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Draw Collector Procedural Geometric Motif
    drawCanvasCollectorMotif(ctx, 1080, 1920, design);

    // Double Metallic Border
    ctx.strokeStyle = design.palette.gold;
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 1080 - 96, 1920 - 96);
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.strokeRect(66, 66, 1080 - 132, 1920 - 132);
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.fillStyle = design.palette.gold;
    ctx.font = '700 34px "DM Sans", sans-serif';
    ctx.fillText(`UNSEAL COLLECTOR EDITION · ${design.badge}`, 540, 190);

    ctx.font = '700 28px "DM Sans", sans-serif';
    ctx.fillStyle = design.palette.ink;
    ctx.fillText(`${state.festival.emoji} ${state.festival.name.toUpperCase()} EDITION · ${design.rarity}`, 540, 250);

    // Crest Emblem Circle
    ctx.beginPath();
    ctx.arc(540, 520, 150, 0, Math.PI * 2);
    ctx.fillStyle = design.palette.soft;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = design.palette.gold;
    ctx.stroke();

    ctx.font = '130px sans-serif';
    ctx.fillStyle = design.palette.ink;
    ctx.fillText(design.motif.crest, 540, 568);

    // Owner Name
    ctx.font = 'italic 700 84px "Playfair Display", Georgia, serif';
    ctx.fillStyle = design.palette.ink;
    wrapCanvasText(ctx, owner, 540, 820, 860, 98);

    // Palette & Motif Title
    ctx.font = '700 38px "DM Sans", sans-serif';
    ctx.fillStyle = design.palette.gold;
    ctx.fillText(design.title, 540, 990);

    // Aura Score Pill
    ctx.fillStyle = design.palette.soft;
    ctx.beginPath();
    ctx.roundRect(290, 1055, 500, 88, 44);
    ctx.fill();
    ctx.strokeStyle = design.palette.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = design.palette.ink;
    ctx.font = '700 36px "DM Sans", sans-serif';
    ctx.fillText(`✨ Vibe Aura Score: ${design.aura}%`, 540, 1112);

    // Fortune Prophecy
    ctx.font = 'italic 54px "Caveat", cursive, sans-serif';
    ctx.fillStyle = design.palette.ink;
    wrapCanvasText(ctx, `"${design.fortune}"`, 540, 1280, 840, 74);

    // Footer Watermark (no spoilers!)
    ctx.font = '700 32px "DM Sans", sans-serif';
    ctx.fillStyle = design.palette.gold;
    ctx.fillText(`Card Pass #${cardId} · Scratch yours free at`, 540, 1690);
    ctx.font = '700 40px "Playfair Display", Georgia, serif';
    ctx.fillStyle = design.palette.ink;
    ctx.fillText('unseal-cards.vercel.app', 540, 1755);

    exportCanvasImage(canvas, `unseal-gift-${design.editionStr}-${cardId}.png`, shareNative,
      `Unlocked Edition ${design.badge} (${design.title}) on unseal-cards.vercel.app!`);
  }

  function generateRevealedNotePng() {
    const p = state.activePayload;
    if (!p) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FAF6F0';
    ctx.fillRect(0, 0, 1080, 1920);

    // Inner Smooth Velvet Parchment Card (Zero book lines)
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.roundRect(88, 280, 904, 1340, 44);
    ctx.fill();
    ctx.strokeStyle = '#DFC99B';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#C8282B';
    ctx.font = '700 32px "DM Sans", sans-serif';
    ctx.fillText(`FOR ${(p.r || 'YOU').toUpperCase()} · UNSEALED SECRET`, 540, 410);

    ctx.fillStyle = '#1E1B18';
    ctx.font = '72px "Caveat", "Kalam", cursive, sans-serif';
    wrapCanvasText(ctx, p.s || '', 540, 620, 760, 96);

    ctx.fillStyle = '#665E55';
    ctx.font = '600 34px "DM Sans", sans-serif';
    wrapCanvasText(ctx, `Clue: "${p.c || 'A quiet admirer'}"`, 540, 1370, 780, 48);

    ctx.fillStyle = '#C8282B';
    ctx.font = 'italic 700 44px "Playfair Display", Georgia, serif';
    ctx.fillText('unseal-cards.vercel.app', 540, 1520);

    exportCanvasImage(canvas, `unseal-note-${p.id || 'card'}.png`, false, '');
  }

  function exportCanvasImage(canvas, filename, tryShare, shareText) {
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (tryShare && navigator.share && navigator.canShare) {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: 'Unseal Collector Card', text: shareText });
              return;
            } catch (_) { /* fall through to download */ }
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, 'image/png');
    } catch (_) { /* no-op */ }
  }

  // ==================== WHATSAPP / SOCIAL SHARING ====================
  function triggerWhatsAppQuestShare(role) {
    const p = state.activePayload || {};
    const cardId = p.id || safeRandAlphaId(ALPHA_ID_LEN);
    const shareUrl = `${PRODUCTION_ORIGIN}/?Ref-${safeRandAlphaId(ALPHA_ID_LEN)}`;
    const message = role === 'sender' && state.currentUrl
      ? `🤫 Psst ${p.r || ''}! Scratch off this gold foil to read my secret note (${state.festival.greeting}):\n${state.currentUrl}`
      : `🎁 I just scratched a secret postcard on Unseal! Send your friends a scratch note & crack open 1 of 100 random Collector Cards free:\n${shareUrl}`;

    const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (typeof window.open === 'function') {
      window.open(waHref, '_blank', 'noopener,noreferrer');
    }

    const updated = incrementShareCount(cardId, role);
    AudioFX.playPop();
    safeVibrate(22);
    renderVaultForRole(role);

    if (updated >= REQUIRED_SHARES) {
      AudioFX.playChime();
      burstConfetti(72);
      safeVibrate([60, 40, 120]);
    }
    trackEvent('whatsapp_quest_share', { role, step: updated });
  }

  // ==================== SCRATCH CANVAS ENGINE ====================
  const ScratchEngine = {
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    drawing: false,
    strokeCount: 0,

    init(forceReset) {
      const canvas = $('scratchCanvas');
      const box = $('scratchBox');
      if (!canvas || !box) return;
      this.canvas = canvas;

      const ctx = canvas.getContext ? canvas.getContext('2d', { willReadFrequently: true }) : null;
      if (!ctx) return;
      this.ctx = ctx;

      const rect = box.getBoundingClientRect ? box.getBoundingClientRect() : { width: 420, height: 220 };
      const w = Math.max(260, Math.round(rect.width || 420));
      const h = Math.max(210, Math.round(rect.height || 220));
      this.w = w;
      this.h = h;
      canvas.width = w;
      canvas.height = h;
      canvas.style.opacity = '1';
      canvas.style.pointerEvents = 'auto';

      if (forceReset) {
        state.revealed = false;
        const actions = $('postRevealActions');
        if (actions) actions.classList.add('hidden');
        const pill = $('scratchStatusPill');
        if (pill) pill.textContent = '🪙 Rub foil gently to unseal';
        const qBtn = $('quickRevealBtn');
        if (qBtn) qBtn.classList.remove('hidden');
      }

      // Draw champagne brushed gold foil
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#E8CA82');
      g.addColorStop(0.32, '#F7E5B4');
      g.addColorStop(0.65, '#CE9F43');
      g.addColorStop(1, '#F1D48E');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Brushed metal hairline textures
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.lineWidth = 1;
      for (let y = 4; y < h; y += 7) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + 6);
        ctx.stroke();
      }

      // Foil Stamp Prompt
      ctx.fillStyle = 'rgba(84, 54, 12, 0.85)';
      ctx.textAlign = 'center';
      ctx.font = '700 18px "DM Sans", sans-serif';
      ctx.fillText('✨ SCRATCH METALLIC FOIL ✨', w / 2, h / 2 - 6);
      ctx.font = '500 13px "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(84, 54, 12, 0.72)';
      ctx.fillText('Rub here with your finger or cursor', w / 2, h / 2 + 18);
    },

    scratchAt(clientX, clientY) {
      if (!this.ctx || !this.canvas || state.revealed) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / (rect.width || 1)) * this.w;
      const y = ((clientY - rect.top) / (rect.height || 1)) * this.h;

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 25, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      const now = performance.now();
      if (now - state.lastHapticMs >= 50) {
        state.lastHapticMs = now;
        safeVibrate(8);
      }
      AudioFX.playScratchGrain();

      this.strokeCount++;
      if (this.strokeCount % 6 === 0) {
        this.checkProgress();
      }
    },

    checkProgress() {
      if (!this.ctx || state.revealed) return;
      try {
        const data = this.ctx.getImageData(0, 0, this.w, this.h).data;
        let cleared = 0;
        let sampled = 0;
        for (let i = 3; i < data.length; i += 64) {
          sampled++;
          if (data[i] < 128) cleared++;
        }
        const ratio = sampled ? cleared / sampled : 0;
        const pct = Math.min(100, Math.round((ratio / SCRATCH_REVEAL_RATIO) * 100));
        const pill = $('scratchStatusPill');
        if (pill && !state.revealed) {
          pill.textContent = ratio > 0.04 ? `🪙 Scratching… ${pct}% unsealed` : '🪙 Rub foil gently to unseal';
        }
        if (ratio >= SCRATCH_REVEAL_RATIO) {
          this.completeReveal();
        }
      } catch (_) { /* ignore */ }
    },

    completeReveal() {
      if (state.revealed) return;
      state.revealed = true;
      if (this.canvas && this.canvas.style) {
        this.canvas.style.opacity = '0';
        this.canvas.style.pointerEvents = 'none';
      }

      const pill = $('scratchStatusPill');
      if (pill) pill.textContent = '✨ Secret Unsealed!';
      const qBtn = $('quickRevealBtn');
      if (qBtn) qBtn.classList.add('hidden');

      const actions = $('postRevealActions');
      if (actions) actions.classList.remove('hidden');

      renderVaultForRole('receiver');
      AudioFX.playChime();
      safeVibrate([70, 35, 110]);
      burstConfetti(64);
      trackEvent('note_unsealed', { mood: state.activePayload ? state.activePayload.m : 'Auto' });

      // Gentle Viral Mystery Gift Modal Popup shortly after unseal (only in real receiver view)
      if (state.mode === 'receiver') {
        setTimeout(() => {
          const modal = $('revealShareModal');
          if (modal && state.mode === 'receiver') {
            syncRevealPopupVault();
            modal.classList.remove('hidden');
          }
        }, 1050);
      }
    }
  };

  // ==================== VIEW ROUTER & HYDRATION ====================
  function showView(viewName) {
    state.mode = viewName;
    const vw = $('viewWrite');
    const vp = $('viewPreview');
    const cc = $('composerCard');
    const rc = $('senderReadyCard');
    const pt = $('previewTopBar');

    if (viewName === 'write') {
      if (vw) vw.classList.remove('hidden');
      if (vp) vp.classList.add('hidden');
      if (cc) cc.classList.remove('hidden');
      if (rc) rc.classList.add('hidden');
    } else if (viewName === 'ready') {
      if (vw) vw.classList.remove('hidden');
      if (vp) vp.classList.add('hidden');
      if (cc) cc.classList.add('hidden');
      if (rc) rc.classList.remove('hidden');
      renderVaultForRole('sender');
    } else if (viewName === 'preview' || viewName === 'receiver') {
      if (vw) vw.classList.add('hidden');
      if (vp) vp.classList.remove('hidden');
      if (pt) pt.classList.toggle('hidden', viewName !== 'preview');
      hydrateReceiverCard();
      ScratchEngine.init(true);
    }
  }

  function hydrateReceiverCard() {
    const p = state.activePayload;
    if (!p) return;

    const kicker = $('receiverMoodKicker');
    const idEl = $('receiverCardId');
    const heading = $('postcardHeading');
    const secretEl = $('revealedSecretText');
    const clueEl = $('revealedClueText');
    const waxBadge = $('waxStampBadge');

    if (kicker) {
      kicker.textContent = p.m && p.m !== 'Auto'
        ? `${p.m.toUpperCase()} · SECRET POSTCARD`
        : `${state.festival.emoji} ${state.festival.name.toUpperCase()} · SECRET POSTCARD`;
    }
    if (idEl) idEl.textContent = `#${p.id || 'Unseal01'}`;
    if (heading) heading.textContent = `For ${p.r || 'You'}, someone sealed a secret note.`;
    if (secretEl) secretEl.textContent = p.s || '';
    if (clueEl) clueEl.textContent = p.c ? `"${p.c}"` : '"A quiet admirer"';
    if (waxBadge) waxBadge.textContent = p.m && p.m !== 'Auto' ? Array.from(p.m)[0] : '♥';

    renderVaultForRole('receiver');
  }

  function hydrateReadyCard() {
    const p = state.activePayload;
    if (!p) return;

    const hl = $('readyHeadline');
    const idBadge = $('readyCardIdBadge');
    const urlText = $('previewUrlText');
    const waTitle = $('waPreviewTitle');

    if (hl) hl.textContent = `Sealed for ${p.r || 'Someone'} ✨`;
    if (idBadge) idBadge.textContent = `#${p.id}`;
    if (urlText) urlText.textContent = state.currentUrl;
    if (waTitle) waTitle.textContent = `💌 For ${p.r || 'You'} — Tap & Scratch to Unseal Your Secret Note`;
  }

  // ==================== PWA INSTALL PROMPT + UNIQUE ORBITAL OVERLAY ====================
  function isStandalonePwa() {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  }

  function refreshInstallBannerVisibility() {
    const banner = $('browserInstallBanner');
    if (!banner) return;
    const standalone = isStandalonePwa();
    if (standalone && document.documentElement) {
      document.documentElement.classList.add('is-pwa');
    }
    const dismissed = lsGet('unseal_v8_bib_dismissed') === '1';
    if (standalone || dismissed) {
      banner.classList.add('hidden');
    } else {
      banner.classList.remove('hidden');
    }
  }

  function openInstallAnimationModal() {
    const overlay = $('pwaInstallOverlay');
    const bar = $('pwaInstallProgressBar');
    const title = $('pwaInstallTitle');
    const status = $('pwaInstallStatusText');
    const iosBox = $('iosInstallStepsBox');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    if (bar && bar.style) bar.style.width = '18%';
    if (iosBox) iosBox.classList.add('hidden');
    if (title) title.textContent = 'Sealing Unseal onto your Home Screen…';

    setTimeout(() => { if (bar && bar.style) bar.style.width = '68%'; }, 220);

    if (state.deferredPrompt && typeof state.deferredPrompt.prompt === 'function') {
      if (status) status.textContent = 'Tap "Install" in your browser dialog to add Unseal to your Home Screen.';
      state.deferredPrompt.prompt();
      state.deferredPrompt.userChoice.then((choice) => {
        if (choice && choice.outcome === 'accepted') {
          if (bar && bar.style) bar.style.width = '100%';
          if (title) title.textContent = '🎉 Unseal App Installed!';
          if (status) status.textContent = 'Welcome to offline fullscreen secret notes + 100 Gift Cards.';
          burstConfetti(50);
          AudioFX.playChime();
          const b = $('browserInstallBanner');
          if (b) b.classList.add('hidden');
        } else {
          overlay.classList.add('hidden');
        }
        state.deferredPrompt = null;
      }).catch(() => {
        if (iosBox) iosBox.classList.remove('hidden');
      });
    } else {
      setTimeout(() => {
        if (bar && bar.style) bar.style.width = '100%';
        if (title) title.textContent = '📲 Add Unseal to Your Home Screen';
        if (status) status.textContent = 'Install Unseal as a fullscreen phone app in two quick taps:';
        if (iosBox) iosBox.classList.remove('hidden');
      }, 450);
    }
  }

  // ==================== LIVE UNSEALED COUNTER ====================
  function initLiveCounter() {
    const el = $('liveCounterCount');
    if (!el) return;
    const h = new Date().getHours();
    let count = 4810 + h * 19 + Math.floor(Math.random() * 24);
    el.textContent = count.toLocaleString('en-US');
    setInterval(() => {
      count += 1 + Math.floor(Math.random() * 3);
      el.textContent = count.toLocaleString('en-US');
    }, 38000);
  }

  // ==================== EVENT BINDING ====================
  function bindEvents() {
    // 1. Composer Actions
    const sealBtn = $('sealCardBtn');
    const recInput = $('recipientInput');
    const senderInput = $('senderNameInput');
    const secretBox = $('secretTextarea');
    const clueInput = $('clueInput');
    const charCount = $('secretCharCount');
    const clearBtn = $('clearComposerBtn');

    if (secretBox && charCount) {
      secretBox.addEventListener('input', () => {
        charCount.textContent = `${secretBox.value.length} / 280`;
      });
    }

    if (clearBtn && secretBox) {
      clearBtn.addEventListener('click', () => {
        secretBox.value = '';
        if (clueInput) clueInput.value = '';
        if (charCount) charCount.textContent = '0 / 280';
        secretBox.focus();
      });
    }

    // Mood chips
    const moodBtns = document.querySelectorAll ? document.querySelectorAll('#moodSelectorRow .mood-chip') : [];
    for (let i = 0; i < moodBtns.length; i++) {
      moodBtns[i].addEventListener('click', (e) => {
        const target = e.currentTarget;
        state.mood = target.dataset.mood || 'Auto';
        for (let j = 0; j < moodBtns.length; j++) moodBtns[j].classList.remove('active');
        target.classList.add('active');
        AudioFX.playPop();
      });
    }

    // Idea chips prefill cleanly
    const ideaChips = document.querySelectorAll ? document.querySelectorAll('#ideasChipsGrid .idea-chip') : [];
    for (let i = 0; i < ideaChips.length; i++) {
      ideaChips[i].addEventListener('click', (e) => {
        const chip = e.currentTarget;
        if (recInput) recInput.value = chip.dataset.rec || 'Crush';
        if (secretBox) {
          secretBox.value = chip.dataset.msg || '';
          if (charCount) charCount.textContent = `${secretBox.value.length} / 280`;
        }
        if (clueInput) clueInput.value = chip.dataset.clue || '';
        showView('write');
        if (secretBox && typeof secretBox.scrollIntoView === 'function') {
          secretBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        AudioFX.playPop();
      });
    }

    // Seal Card
    if (sealBtn) {
      sealBtn.addEventListener('click', () => {
        const sVal = secretBox ? secretBox.value.trim() : '';
        if (!sVal) {
          if (secretBox) secretBox.focus();
          return;
        }
        const rVal = (recInput && recInput.value.trim()) || 'You';
        const fromVal = (senderInput && senderInput.value.trim()) || '';
        const cVal = (clueInput && clueInput.value.trim()) || '';

        const payload = {
          r: rVal,
          s: sVal,
          c: cVal,
          m: state.mood || 'Auto',
          from: fromVal,
          id: safeRandAlphaId(ALPHA_ID_LEN)
        };

        state.activePayload = payload;
        state.currentUrl = buildShareUrl(payload);
        hydrateReadyCard();
        showView('ready');
        AudioFX.playChime();
        safeVibrate(30);
        trackEvent('card_sealed', { has_clue: Boolean(cVal), festival: state.festival.id });
      });
    }

    // 2. Ready View Actions
    const editBtn = $('editSealedBtn');
    const copyBtn = $('copyUrlBtn');
    const waShareBtn = $('whatsappShareBtn');
    const igBtn = $('copyIgBtn');
    const tgBtn = $('shareTelegramBtn');
    const nativeBtn = $('nativeShareBtn');
    const testScratchBtn = $('testScratchBtn');
    const writeNewBtn = $('writeNewBtn');
    const senderQuestBtn = $('senderQuestWhatsAppBtn');
    const dlGiftBtn = $('downloadGiftCardBtn');
    const shareGiftImgBtn = $('shareGiftImageBtn');

    if (editBtn) editBtn.addEventListener('click', () => showView('write'));
    if (writeNewBtn) {
      writeNewBtn.addEventListener('click', () => {
        if (secretBox) secretBox.value = '';
        if (clueInput) clueInput.value = '';
        if (recInput) recInput.value = '';
        if (charCount) charCount.textContent = '0 / 280';
        showView('write');
      });
    }
    if (testScratchBtn) testScratchBtn.addEventListener('click', () => showView('preview'));

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard) await navigator.clipboard.writeText(state.currentUrl);
          copyBtn.textContent = 'Copied ✓';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
          AudioFX.playPop();
        } catch (_) { /* ignore */ }
      });
    }

    if (waShareBtn) waShareBtn.addEventListener('click', () => triggerWhatsAppQuestShare('sender'));
    if (senderQuestBtn) senderQuestBtn.addEventListener('click', () => triggerWhatsAppQuestShare('sender'));

    if (igBtn) {
      igBtn.addEventListener('click', async () => {
        const msg = `🤫 I sealed a secret scratch note for you — rub the gold foil here:\n${state.currentUrl}`;
        try {
          if (navigator.clipboard) await navigator.clipboard.writeText(msg);
          const span = $('copyIgBtnText');
          if (span) span.textContent = '📸 Copied Link + Caption ✓';
          setTimeout(() => { if (span) span.textContent = '📸 Copy for IG Story / DM'; }, 2000);
          AudioFX.playPop();
        } catch (_) { /* ignore */ }
      });
    }

    if (tgBtn) {
      tgBtn.addEventListener('click', () => {
        const msg = `🤫 Scratch off my secret note on Unseal!`;
        const href = `https://t.me/share/url?url=${encodeURIComponent(state.currentUrl)}&text=${encodeURIComponent(msg)}`;
        window.open(href, '_blank', 'noopener,noreferrer');
      });
    }

    if (nativeBtn) {
      nativeBtn.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Unseal Secret Note', text: 'Rub the gold foil to read my secret!', url: state.currentUrl });
          } catch (_) { /* user cancelled */ }
        } else if (copyBtn) {
          copyBtn.click();
        }
      });
    }

    if (dlGiftBtn) dlGiftBtn.addEventListener('click', () => generateGiftCardPng('sender', false));
    if (shareGiftImgBtn) shareGiftImgBtn.addEventListener('click', () => generateGiftCardPng('sender', true));

    // 3. Receiver Scratch Card + Interactions
    const backReadyBtn = $('backToReadyBtn');
    const quickRevealBtn = $('quickRevealBtn');
    const scratchCanvas = $('scratchCanvas');
    const receiverQuestBtn = $('receiverQuestWhatsAppBtn');
    const receiverGiftBtn = $('receiverGiftBtn');
    const receiverShareGiftBtn = $('receiverShareGiftImageBtn');
    const dlRevealedBtn = $('downloadRevealedCardBtn');
    const sealBackBtn = $('sealBackBtn');
    const openShareModalBtn = $('openShareModalBtn');

    if (backReadyBtn) backReadyBtn.addEventListener('click', () => showView('ready'));
    if (quickRevealBtn) quickRevealBtn.addEventListener('click', () => ScratchEngine.completeReveal());
    if (receiverQuestBtn) receiverQuestBtn.addEventListener('click', () => triggerWhatsAppQuestShare('receiver'));
    if (receiverGiftBtn) receiverGiftBtn.addEventListener('click', () => generateGiftCardPng('receiver', false));
    if (receiverShareGiftBtn) receiverShareGiftBtn.addEventListener('click', () => generateGiftCardPng('receiver', true));
    if (dlRevealedBtn) dlRevealedBtn.addEventListener('click', () => generateRevealedNotePng());
    if (sealBackBtn) {
      sealBackBtn.addEventListener('click', () => {
        if (secretBox) secretBox.value = '';
        showView('write');
      });
    }
    if (openShareModalBtn) {
      openShareModalBtn.addEventListener('click', () => {
        syncRevealPopupVault();
        const modal = $('revealShareModal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    // One-tap Receiver Reactions
    const reactPills = document.querySelectorAll ? document.querySelectorAll('#receiverReactionsRow .react-pill') : [];
    for (let i = 0; i < reactPills.length; i++) {
      reactPills[i].addEventListener('click', (e) => {
        for (let j = 0; j < reactPills.length; j++) reactPills[j].classList.remove('is-reacted');
        e.currentTarget.classList.add('is-reacted');
        AudioFX.playPop();
        safeVibrate(20);
      });
    }

    if (scratchCanvas) {
      scratchCanvas.addEventListener('pointerdown', (e) => {
        ScratchEngine.drawing = true;
        ScratchEngine.scratchAt(e.clientX, e.clientY);
      });
      scratchCanvas.addEventListener('pointermove', (e) => {
        if (ScratchEngine.drawing) ScratchEngine.scratchAt(e.clientX, e.clientY);
      });
      window.addEventListener('pointerup', () => {
        if (ScratchEngine.drawing) {
          ScratchEngine.drawing = false;
          ScratchEngine.checkProgress();
        }
      });
      scratchCanvas.addEventListener('touchstart', (e) => {
        ScratchEngine.drawing = true;
        if (e.touches && e.touches[0]) ScratchEngine.scratchAt(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      scratchCanvas.addEventListener('touchmove', (e) => {
        if (ScratchEngine.drawing && e.touches && e.touches[0]) {
          ScratchEngine.scratchAt(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      scratchCanvas.addEventListener('touchend', () => {
        ScratchEngine.drawing = false;
        ScratchEngine.checkProgress();
      }, { passive: true });

      let resizeTimer = 0;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if ((state.mode === 'preview' || state.mode === 'receiver') && !state.revealed) {
            ScratchEngine.init(false);
          }
        }, 180);
      });
    }

    // 4. Reveal Modal Popup Actions
    const closeModalBtn = $('closeRevealModalBtn');
    const modalShareWaBtn = $('modalShareWhatsAppBtn');
    const modalClaimBtn = $('modalClaimGiftBtn');
    const modalShareNativeBtn = $('modalShareNativeBtn');
    const modalReplyBtn = $('modalReplyBtn');

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => $('revealShareModal')?.classList.add('hidden'));
    if (modalShareWaBtn) {
      modalShareWaBtn.addEventListener('click', () => {
        const role = state.mode === 'ready' ? 'sender' : 'receiver';
        triggerWhatsAppQuestShare(role);
      });
    }
    if (modalClaimBtn) {
      modalClaimBtn.addEventListener('click', () => {
        const role = state.mode === 'ready' ? 'sender' : 'receiver';
        generateGiftCardPng(role, false);
      });
    }
    if (modalShareNativeBtn && nativeBtn) {
      modalShareNativeBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'Unseal Mystery Gift Vault',
            text: 'Crack 1 of 100 random Collector Cards on Unseal!',
            url: `${PRODUCTION_ORIGIN}/`
          }).catch(() => {});
        }
      });
    }
    if (modalReplyBtn) {
      modalReplyBtn.addEventListener('click', () => {
        $('revealShareModal')?.classList.add('hidden');
        showView('write');
      });
    }

    // 5. Festival Theme Switcher Modal
    const festBtn = $('festivalThemeBtn');
    const festRibbonBtn = $('festivalRibbonBtn');
    const festModal = $('festivalModal');
    const closeFestBtn = $('closeFestivalModalBtn');
    const festAutoBtn = $('festivalAutoBtn');
    const festGrid = $('festivalThemeGrid');

    const openFest = () => {
      renderFestivalModalGrid();
      if (festModal) festModal.classList.remove('hidden');
    };
    if (festBtn) festBtn.addEventListener('click', openFest);
    if (festRibbonBtn) festRibbonBtn.addEventListener('click', openFest);
    if (closeFestBtn) closeFestBtn.addEventListener('click', () => festModal?.classList.add('hidden'));
    if (festAutoBtn) {
      festAutoBtn.addEventListener('click', () => {
        lsRemove('unseal_v8_festival_override');
        applyFestivalTheme(detectFestivalByDate(), false);
        festModal?.classList.add('hidden');
        AudioFX.playPop();
      });
    }
    if (festGrid) {
      festGrid.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('.festival-option-btn') : null;
        if (!btn) return;
        applyFestivalTheme(btn.dataset.festId, true);
        AudioFX.playPop();
        burstConfetti(32);
        festModal?.classList.add('hidden');
      });
    }

    // 6. Header Audio, Fullscreen & Auto PWA Install Triggers
    const audioBtn = $('audioToggleBtn');
    const audioIcon = $('audioToggleIcon');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        AudioFX.enabled = !AudioFX.enabled;
        audioBtn.setAttribute('aria-pressed', String(AudioFX.enabled));
        if (audioIcon) audioIcon.textContent = AudioFX.enabled ? '🔊' : '🔇';
        if (AudioFX.enabled) AudioFX.playChime();
      });
    }

    const fsBtn = $('fullscreenToggleBtn');
    const fsIcon = $('fullscreenIcon');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement && document.documentElement && typeof document.documentElement.requestFullscreen === 'function') {
          document.documentElement.requestFullscreen().then(() => {
            fsBtn.setAttribute('aria-pressed', 'true');
            if (fsIcon) fsIcon.textContent = '🗗';
          }).catch(() => {});
        } else if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
          document.exitFullscreen().catch(() => {});
          fsBtn.setAttribute('aria-pressed', 'false');
          if (fsIcon) fsIcon.textContent = '⛶';
        }
      });
    }

    const bibInstall = $('bibInstallBtn');
    const bibDismiss = $('bibDismissBtn');
    const hdrInstall = $('installAppBtn');
    const ftrInstall = $('footerInstallAppBtn');
    const closeInstall = $('closeInstallOverlayBtn');

    if (bibInstall) bibInstall.addEventListener('click', openInstallAnimationModal);
    if (hdrInstall) hdrInstall.addEventListener('click', openInstallAnimationModal);
    if (ftrInstall) ftrInstall.addEventListener('click', openInstallAnimationModal);
    if (bibDismiss) {
      bibDismiss.addEventListener('click', () => {
        lsSet('unseal_v8_bib_dismissed', '1');
        $('browserInstallBanner')?.classList.add('hidden');
      });
    }
    if (closeInstall) closeInstall.addEventListener('click', () => $('pwaInstallOverlay')?.classList.add('hidden'));

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredPrompt = e;
      refreshInstallBannerVisibility();
    });

    // 7. Legal Compliance Modal & Mailto Form
    const legalModal = $('legalModal');
    const closeLegal = $('closeLegalModalBtn');
    const legalLinks = document.querySelectorAll ? document.querySelectorAll('[data-open-legal]') : [];
    const legalTabs = document.querySelectorAll ? document.querySelectorAll('.legal-tab-btn') : [];
    const legalPanels = document.querySelectorAll ? document.querySelectorAll('.legal-panel') : [];

    const switchLegalTab = (tabName) => {
      for (let i = 0; i < legalTabs.length; i++) {
        legalTabs[i].classList.toggle('active', legalTabs[i].dataset.legalTab === tabName);
      }
      for (let i = 0; i < legalPanels.length; i++) {
        legalPanels[i].classList.toggle('hidden', legalPanels[i].dataset.legalPanel !== tabName);
      }
    };

    for (let i = 0; i < legalLinks.length; i++) {
      legalLinks[i].addEventListener('click', (e) => {
        e.preventDefault();
        switchLegalTab(e.currentTarget.dataset.openLegal || 'privacy');
        legalModal?.classList.remove('hidden');
      });
    }
    for (let i = 0; i < legalTabs.length; i++) {
      legalTabs[i].addEventListener('click', (e) => switchLegalTab(e.currentTarget.dataset.legalTab));
    }
    if (closeLegal) closeLegal.addEventListener('click', () => legalModal?.classList.add('hidden'));

    const abuseForm = $('abuseReportForm');
    if (abuseForm) {
      abuseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reason = ($('reportReason') && $('reportReason').value) || 'Report';
        const details = ($('reportDetails') && $('reportDetails').value) || '';
        window.location.href = `mailto:support@unseal-cards.vercel.app?subject=${encodeURIComponent(reason)}&body=${encodeURIComponent(details)}`;
      });
    }

    const brandReset = $('brandResetLink');
    if (brandReset) {
      brandReset.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.history && typeof window.history.replaceState === 'function') {
          window.history.replaceState(null, '', window.location.pathname || './');
        }
        showView('write');
      });
    }
  }

  // ==================== SERVICE WORKER + BOOTSTRAP ====================
  function registerServiceWorker() {
    try {
      if (navigator && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
    } catch (_) { /* ignore */ }
  }

  function bootstrap() {
    initAnalyticsAndAds();

    // Load saved override or automatic Indian & Worldwide festival calendar theme
    const savedFest = lsGet('unseal_v8_festival_override');
    const festId = savedFest && FESTIVAL_THEMES.some((t) => t.id === savedFest)
      ? savedFest
      : detectFestivalByDate();
    applyFestivalTheme(festId, false);

    refreshInstallBannerVisibility();
    initLiveCounter();
    bindEvents();
    registerServiceWorker();

    const incoming = parseIncomingLink();
    if (incoming) {
      state.activePayload = incoming;
      showView('receiver');
    } else {
      showView('write');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
