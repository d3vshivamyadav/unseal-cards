(function () {
  'use strict';

  /* ==================== CONSTANTS & RANDOM VIRAL IDEAS ==================== */
  const CONFIG = window.UNSEAL_CONFIG || {
    ga4Id: 'G-XXXXXXXXXX',
    adsenseClient: 'ca-pub-0000000000000000',
    siteOrigin: 'https://unseal-cards.vercel.app'
  };

  const RANDOM_IDEAS = [
    { msg: 'Sach bolu? Jab tum online aate ho, meri smile alag hi level ki hoti hai 🙈✨', clue: 'Someone checking your last seen' },
    { msg: 'Ek baat maano — black outfit mein tum alag hi level ke lagte ho 🔥👀', clue: 'Noticed you recently' },
    { msg: 'Every time your name pops up on my screen, my whole mood shifts ❤️✨', clue: 'Someone who smiles at your texts' },
    { msg: 'तुम्हारी एक मुस्कान पूरा दिन सुकून दे जाती है ✨❤️', clue: 'एक चुपचाप चाहने वाला' },
    { msg: 'Tumhari voice note sunke pura din ka stress gayab ho jaata hai 🥹💌', clue: 'Replay button victim' },
    { msg: 'Midnight truth: you are still my favorite 2 AM overthinking partner 🌙✨', clue: 'Same late-night club' },
    { msg: 'Tu sabse bada dramebaaz hai par mere bina tera din bhi nahi nikalta 😂❤️', clue: 'Your unpaid therapist' },
    { msg: 'I still remember the exact moment we locked eyes and looked away 😳✨', clue: 'Hallway corner crew' },
    { msg: 'कुछ बातें बोल नहीं पाता, बस इस गोल्ड फ़ॉइल में छुपा दी हैं 💌', clue: 'करीबी दोस्त' },
    { msg: 'Dare: reply with the 3rd photo in your camera roll, zero cheating 👀📸', clue: 'No backing out' },
    { msg: 'Kal jab tumne haste hue dekha tha na... still not over it ❤️🔥', clue: 'Sitting two rows away' },
    { msg: 'Confession: I secretly save your coolest memes just to use them later 😂✨', clue: 'Your group chat lurker' },
    { msg: 'If we got stuck in late-night traffic, what song would you play first? 🎶🌙', clue: 'Playlist co-pilot' },
    { msg: 'शाम की चाय और तुम्हारी बातें — दोनों का कोई जवाब नहीं ☕❤️', clue: 'चाय पार्टनर' },
    { msg: 'You act super tough, par andar se sabse soft aur genuine insaan ho 🥹✨', clue: 'Someone who knows the real you' },
    { msg: 'Unpopular opinion: our inside jokes deserve their own Netflix comedy special 😂🔥', clue: 'Back bench partner' },
    { msg: 'Whenever someone brings up travel plans, my brain silently counts you in ✈️💫', clue: 'Future trip planner' },
    { msg: 'Honest dare: text me a voice note humming your favorite song right now 🎤👀', clue: 'Bet you will blush' },
    { msg: 'Bina filter bhi tumhare jaisa aura kisi aur mein nahi dekha ✨💌', clue: 'Secret admirer' },
    { msg: 'भीड़ में भी नज़रें सबसे पहले तुम्हें ही ढूंढती हैं 👀✨', clue: 'तुम्हारे आस-पास ही कोई' },
    { msg: 'Bro seriously, iss weekend coffee & gossip bill tu pay kar raha hai 😤☕', clue: 'Your broke bestie' },
    { msg: 'Sometimes I replay our old chats just because they always feel effortless ❤️🌙', clue: 'Nostalgia mode on' },
    { msg: 'Lowkey wish we talked every single day like before… text first sometime? 🥹✨', clue: 'Missing the vibe' },
    { msg: 'Teri vibe itni addictive hai ki 5 min ki baat 2 ghante chalti hai 😂❤️', clue: 'Call log top #1' },
    { msg: 'Confession: you are the person I silently look for first at every party 👀✨', clue: 'Someone by the entrance' },
    { msg: 'One weird superpower of yours: turning my worst days around in 2 texts 🔥💌', clue: 'Grateful everyday' }
  ];

  const GOLD_FOIL = {
    stops: ['#ECCE7E', '#C48F30', '#FAE7AD', '#B37B20'],
    ink: '#3B2506',
    border: '#B8832A',
    dust: ['#FDE68A', '#D97706', '#FFFBEB']
  };

  /* ==================== APPLICATION STATE ==================== */
  const state = {
    mode: 'write',
    recipient: '',
    secret: '',
    clue: '',
    burn: false,
    cardId: '',
    shortUrl: '',
    isPreviewFromSender: false,
    revealed: false,
    vanished: false,
    ideaCursor: -1,
    lastHapticAt: 0,
    burnTimerId: null,
    burnSecondsLeft: 0,
    sparkles: [],
    sparkleRafId: 0,
    paintedCanvasW: 0,
    paintedCanvasH: 0,
    paintedDpr: 0,
    scratchPaintSeq: 0,
    scratchResizeObserver: null
  };

  /* ==================== SAFE DOM HELPERS ==================== */
  const $ = (id) => document.getElementById(id);
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

  function hasDevanagari(text) {
    return /[\u0900-\u097F]/.test(String(text || ''));
  }

  function applyAutoTypography(el, text) {
    if (!el || !el.classList) return;
    const isHindi = hasDevanagari(text);
    el.classList.toggle('font-hindi', isHindi);
    el.classList.toggle('font-script', !isHindi);
  }

  function pad2(n) {
    return String(Math.max(0, Math.floor(n))).padStart(2, '0');
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

  function triggerHaptic(pattern) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (_) {
        // ignore unsupported browser vibration errors
      }
    }
  }

  /* ==================== BINARY CODEC #5 + LEGACY DECODERS ==================== */
  function toBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(str) {
    const clean = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = clean.length % 4 === 0 ? '' : '='.repeat(4 - (clean.length % 4));
    const bin = atob(clean + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  /* Compact Unicode + Devanagari run-length byte packer */
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
    const flags = hasClue | (burnBit << 2);

    const sepClueLen = hasClue ? 1 + cBytes.length : 0;
    const total = 1 + rBytes.length + 1 + sBytes.length + sepClueLen;

    const packet = new Uint8Array(total);
    let pos = 0;
    packet[pos++] = flags;
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
    const hasTheme = (flags & 0x80) !== 0;
    if (hasTheme) pos += 1;

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
      b: burn ? 1 : 0
    };
  }

  function decodeIncomingUrl(search, hash) {
    const h = String(hash || '').replace(/^#/, '');
    if (h.startsWith('5')) {
      try {
        return decodePayloadV5(h.slice(1));
      } catch (_) {
        return null;
      }
    }

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
            return { recipient: r, secret: s, clue: c, b: 0 };
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
          b: obj.b || obj.burn ? 1 : 0
        };
      }
    } catch (_) {
      try {
        const text = new TextDecoder().decode(fromBase64Url(clean));
        const parts = text.split('\n');
        if (parts.length >= 2) {
          return { recipient: parts[0], secret: parts[1], clue: parts[2] || '', b: 0 };
        }
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  /* ==================== 9:16 WARM-LINEN STORY PNG EXPORT ==================== */
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

  function downloadStoryCardPng() {
    if (typeof document.createElement !== 'function') return;
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1920;
    const ctx = c.getContext && c.getContext('2d');
    if (!ctx) return;

    /* Crisp Warm-Linen Stationery Gradient */
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, '#FFFDF9');
    grad.addColorStop(1, '#F3E7D2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    /* Double Atelier Border */
    ctx.strokeStyle = '#D1BFA0';
    ctx.lineWidth = 4;
    ctx.strokeRect(58, 58, 964, 1804);
    ctx.strokeStyle = 'rgba(200, 40, 43, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, 920, 1760);

    /* Top Brand & Recipient Tag */
    ctx.textAlign = 'center';
    ctx.fillStyle = '#C8282B';
    ctx.font = '700 32px "DM Sans", sans-serif';
    ctx.fillText(`UNSEAL • SECRET FOR ${(state.recipient || 'YOU').toUpperCase()}`, 540, 235);

    /* Inner Soft Card Frame */
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(110, 340, 860, 960);
    ctx.strokeStyle = '#DFD0B5';
    ctx.lineWidth = 3;
    ctx.strokeRect(110, 340, 860, 960);

    /* Handwritten Quote (Auto-detected Kalam Hindi or Caveat Script) */
    const quote = state.vanished ? '💨 This secret has vanished forever.' : (state.secret || '');
    const isHindi = hasDevanagari(quote);
    ctx.fillStyle = '#181210';
    ctx.textAlign = 'center';
    ctx.font = isHindi
      ? '600 66px "Kalam", "Noto Sans Devanagari", cursive'
      : '700 74px "Caveat", cursive';
    wrapCanvasText(ctx, quote, 540, 620, 740, 96);

    /* Sender Clue Line */
    const clueLine = state.clue ? `"${state.clue}"` : '"A quiet admirer"';
    ctx.fillStyle = '#5C4E48';
    ctx.font = 'italic 36px "Playfair Display", Georgia, serif';
    wrapCanvasText(ctx, `Clue: ${clueLine}`, 540, 1185, 760, 48);

    /* Viral Bottom Callout Sticker */
    ctx.fillStyle = '#C8282B';
    ctx.fillRect(130, 1525, 820, 136);
    ctx.fillStyle = '#FFFDF9';
    ctx.font = '700 34px "DM Sans", sans-serif';
    ctx.fillText('Send me a secret scratch card at', 540, 1585);
    ctx.font = 'italic 700 42px "Playfair Display", Georgia, serif';
    ctx.fillText('unseal-cards.vercel.app', 540, 1636);

    if (typeof c.toBlob === 'function') {
      c.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unseal-story-${slugifyRecipient(state.recipient)}.png`;
        if (document.body && typeof document.body.appendChild === 'function') document.body.appendChild(a);
        if (typeof a.click === 'function') a.click();
        if (a.parentNode) a.parentNode.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast('📸 Story Card downloaded (1080×1920)!');
        trackEvent('story_png_downloaded');
      }, 'image/png');
    }
  }

  /* ==================== WARM PAPER CONFETTI & FOIL SPARKLES ==================== */
  function burstConfetti() {
    if (typeof document.createElement !== 'function' || !document.body) return;
    const palette = ['#C8282B', '#E5B95C', '#F43F5E', '#D97706', '#FFFDF9'];
    for (let i = 0; i < 24; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = i % 3 === 0 ? '✨' : (i % 2 === 0 ? '✦' : '●');
      piece.style.left = `${10 + Math.random() * 80}vw`;
      piece.style.top = `${52 + Math.random() * 24}vh`;
      piece.style.color = palette[i % palette.length];
      document.body.appendChild(piece);
      setTimeout(() => {
        if (piece.parentNode) piece.parentNode.removeChild(piece);
      }, 1150);
    }
  }

  function spawnFoilSparkles(x, y, canvasW, canvasH) {
    const overlay = $('sparkleOverlayCanvas');
    if (!overlay || !canvasW || !canvasH) return;
    for (let i = 0; i < 2; i += 1) {
      state.sparkles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.6,
        vy: -1.0 - Math.random() * 1.6,
        life: 1,
        size: 1.4 + Math.random() * 1.6,
        color: GOLD_FOIL.dust[i % GOLD_FOIL.dust.length]
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

  /* ==================== CHAMPAGNE GOLD SCRATCH CANVAS & HAPTICS ==================== */
  function paintScratchCanvas(allowFallback = true) {
    const canvas = $('scratchCanvas');
    const overlay = $('sparkleOverlayCanvas');
    const box = $('scratchBox');
    if (!canvas || !box || state.mode !== 'preview' || state.revealed) return;

    const rect = typeof canvas.getBoundingClientRect === 'function' ? canvas.getBoundingClientRect() : null;
    const measuredW = Math.round(canvas.clientWidth || box.clientWidth || (rect && rect.width) || 0);
    const measuredH = Math.round(canvas.clientHeight || box.clientHeight || (rect && rect.height) || 0);

    if ((measuredW <= 0 || measuredH <= 0) && !allowFallback) return;

    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const w = Math.max(260, measuredW || 440);
    const h = Math.max(190, measuredH || Math.round(w * (190 / 300)));
    if (
      measuredW > 0 &&
      measuredH > 0 &&
      w === state.paintedCanvasW &&
      h === state.paintedCanvasH &&
      dpr === state.paintedDpr &&
      canvas.width > 0
    ) {
      return;
    }

    canvas.classList.remove('is-faded');

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (overlay) {
      overlay.width = canvas.width;
      overlay.height = canvas.height;
    }

    state.paintedCanvasW = measuredW > 0 ? w : 0;
    state.paintedCanvasH = measuredH > 0 ? h : 0;
    state.paintedDpr = measuredW > 0 ? dpr : 0;

    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, GOLD_FOIL.stops[0]);
    grad.addColorStop(0.35, GOLD_FOIL.stops[1]);
    grad.addColorStop(0.68, GOLD_FOIL.stops[2]);
    grad.addColorStop(1, GOLD_FOIL.stops[3]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    /* Brushed Champagne Gold Metallic Sheen */
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

    ctx.strokeStyle = GOLD_FOIL.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = GOLD_FOIL.ink;
    ctx.textAlign = 'center';
    ctx.font = '700 18px "DM Sans", sans-serif';
    ctx.fillText('RUB GOLD FOIL TO UNSEAL', w / 2, h / 2 - 4);
    ctx.font = '600 13px "DM Sans", sans-serif';
    ctx.fillText('Champagne Gold Foil', w / 2, h / 2 + 22);

    ctx.globalCompositeOperation = 'destination-out';
  }

  function ensureScratchResizeObserver() {
    const box = $('scratchBox');
    if (!box || state.scratchResizeObserver || typeof ResizeObserver !== 'function') return;
    state.scratchResizeObserver = new ResizeObserver((entries) => {
      if (state.mode !== 'preview' || state.revealed) return;
      const entry = entries && entries[0];
      const nextW = Math.round((entry && entry.contentRect && entry.contentRect.width) || box.clientWidth || 0);
      const nextH = Math.round((entry && entry.contentRect && entry.contentRect.height) || box.clientHeight || 0);
      if (nextW > 0 && nextH > 0 && (Math.abs(nextW - state.paintedCanvasW) > 2 || Math.abs(nextH - state.paintedCanvasH) > 2)) {
        paintScratchCanvas(false);
      }
    });
    state.scratchResizeObserver.observe(box);
  }

  function initScratchCanvas() {
    const canvas = $('scratchCanvas');
    const box = $('scratchBox');
    if (!canvas || !box) return;

    canvas.classList.remove('is-faded');
    state.paintedCanvasW = 0;
    state.paintedCanvasH = 0;
    state.paintedDpr = 0;
    ensureScratchResizeObserver();

    const seq = ++state.scratchPaintSeq;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (seq === state.scratchPaintSeq) paintScratchCanvas(true);
        });
      });
    } else {
      paintScratchCanvas(true);
    }
  }

  function startBurnCountdownIfEnabled() {
    const badge = $('burnCountdownBadge');
    const under = $('underneathSecretBox');
    const secretEl = $('revealedSecretText');

    if (state.burnTimerId) {
      clearInterval(state.burnTimerId);
      state.burnTimerId = null;
    }
    state.vanished = false;
    if (under && under.classList) under.classList.remove('is-evaporated');

    if (!state.burn) {
      if (badge) badge.classList.add('hidden');
      return;
    }

    state.burnSecondsLeft = 59;
    if (badge) {
      badge.classList.remove('hidden');
      badge.textContent = `🔥 Self-destructs in 00:${pad2(state.burnSecondsLeft)}s`;
    }

    state.burnTimerId = setInterval(() => {
      state.burnSecondsLeft -= 1;
      if (state.burnSecondsLeft <= 0) {
        clearInterval(state.burnTimerId);
        state.burnTimerId = null;
        state.vanished = true;
        if (under && under.classList) under.classList.add('is-evaporated');
        if (secretEl) secretEl.textContent = '💨 This secret has vanished forever.';
        if (badge) badge.textContent = '💨 Vanished';
        const pill = $('scratchStatusPill');
        if (pill) pill.textContent = '💨 This secret has vanished forever.';
      } else if (badge) {
        badge.textContent = `🔥 Self-destructs in 00:${pad2(state.burnSecondsLeft)}s`;
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
      }, 450);
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

    triggerHaptic([80, 40, 120]);
    burstConfetti();
    startBurnCountdownIfEnabled();
    trackEvent('note_unsealed', { burn: state.burn });
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
      const scaleX = rect.width ? canvas.width / rect.width : dpr();
      const scaleY = rect.height ? canvas.height / rect.height : dpr();

      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();

      spawnFoilSparkles(x * scaleX, y * scaleY, canvas.width, canvas.height);

      const now = performance.now ? performance.now() : Date.now();
      if (now - state.lastHapticAt >= 48) {
        state.lastHapticAt = now;
        triggerHaptic(8);
      }

      moveTicks += 1;
      if (moveTicks % 5 === 0) {
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
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
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

    /* Touch fallback for synthetic TouchEvents & mobile WebViews */
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

  /* ==================== SHUFFLE RANDOM IDEA ==================== */
  function shuffleRandomIdea() {
    if (!RANDOM_IDEAS.length) return;
    let nextIdx = Math.floor(Math.random() * RANDOM_IDEAS.length);
    if (RANDOM_IDEAS.length > 1 && nextIdx === state.ideaCursor) {
      nextIdx = (state.ideaCursor + 1) % RANDOM_IDEAS.length;
    }
    state.ideaCursor = nextIdx;
    const item = RANDOM_IDEAS[nextIdx];

    const secTa = $('secretTextarea');
    const clueIn = $('clueInput');
    const countEl = $('secretCharCount');
    const box = $('letterBoxShell');

    if (secTa) {
      secTa.value = item.msg;
      applyAutoTypography(secTa, item.msg);
      if (countEl) countEl.textContent = `${item.msg.length} / 280`;
    }
    if (clueIn) clueIn.value = item.clue;

    [box, clueIn].forEach((el) => {
      if (!el || !el.classList) return;
      el.classList.remove('is-popping');
      void el.offsetWidth;
      el.classList.add('is-popping');
    });

    trackEvent('shuffle_random_idea', { index: nextIdx });
  }

  /* ==================== NAVIGATION & VIEW SWITCHING ==================== */
  function showWriteComposer(keepFields = false, focusRecipient = false, preserveUrl = false) {
    state.mode = 'write';
    state.revealed = false;
    state.vanished = false;
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
      state.secret = '';
      state.clue = '';
      state.cardId = '';
      state.shortUrl = '';
      state.burn = false;
      if ($('recipientInput')) $('recipientInput').value = '';
      if ($('secretTextarea')) {
        $('secretTextarea').value = '';
        applyAutoTypography($('secretTextarea'), '');
      }
      if ($('clueInput')) $('clueInput').value = '';
      if ($('secretCharCount')) $('secretCharCount').textContent = '0 / 280';
      if ($('burnTimerToggle')) $('burnTimerToggle').checked = false;
    }

    if ($('viewWrite')) $('viewWrite').classList.remove('hidden');
    if ($('composerCard')) $('composerCard').classList.remove('hidden');
    if ($('senderReadyCard')) $('senderReadyCard').classList.add('hidden');
    if ($('viewPreview')) $('viewPreview').classList.add('hidden');

    if (!preserveUrl && typeof history !== 'undefined' && typeof history.replaceState === 'function') {
      try { history.replaceState(null, '', getBaseUrl()); } catch (_) { }
    }

    if (focusRecipient && $('recipientInput') && typeof $('recipientInput').focus === 'function') {
      setTimeout(() => $('recipientInput').focus(), 40);
    }
  }

  function showSenderReadyView() {
    state.mode = 'ready';
    if ($('viewWrite')) $('viewWrite').classList.remove('hidden');
    if ($('composerCard')) $('composerCard').classList.add('hidden');
    if ($('senderReadyCard')) $('senderReadyCard').classList.remove('hidden');
    if ($('viewPreview')) $('viewPreview').classList.add('hidden');

    const rec = state.recipient || 'Someone';
    if ($('readyHeadline')) $('readyHeadline').textContent = `Sealed for ${rec} ✨`;
    if ($('previewUrlText')) $('previewUrlText').textContent = state.shortUrl;
    if ($('waPreviewTitle')) $('waPreviewTitle').textContent = `💌 For ${rec} — Scratch Gold Foil`;
    if ($('waPreviewSub')) {
      $('waPreviewSub').textContent = state.burn
        ? 'Burns 60s after unseal — rub the foil quick!'
        : 'Rub the screen with your finger before it disappears!';
    }
  }

  function openReceiverView(payload, fromSenderPreview = false) {
    state.mode = 'preview';
    state.isPreviewFromSender = fromSenderPreview;
    state.revealed = false;
    state.vanished = false;

    state.recipient = (payload.recipient || 'You').trim();
    state.secret = payload.secret || '';
    state.clue = (payload.clue || '').trim();
    state.burn = Boolean(payload.b || payload.burn);

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
      applyAutoTypography(secretEl, state.secret);
    }

    if ($('revealedClueText')) {
      $('revealedClueText').textContent = state.clue ? `"${state.clue}"` : '"A quiet admirer"';
    }
    if ($('receiverMoodKicker')) {
      $('receiverMoodKicker').textContent = state.burn ? 'EPHEMERAL POSTCARD' : 'SECRET POSTCARD';
    }

    const under = $('underneathSecretBox');
    if (under && under.classList) under.classList.remove('is-evaporated');
    if ($('burnCountdownBadge')) {
      $('burnCountdownBadge').classList.toggle('hidden', !state.burn);
      if (state.burn) $('burnCountdownBadge').textContent = '⏳ Burns 60s after unseal';
    }

    if ($('scratchStatusPill')) $('scratchStatusPill').textContent = '🪙 Rub gold foil gently to unseal';
    if ($('quickRevealBtn')) $('quickRevealBtn').classList.remove('hidden');
    if ($('postRevealActions')) $('postRevealActions').classList.add('hidden');

    initScratchCanvas();
  }

  /* ==================== CLIPBOARD & SHARE HELPERS ==================== */
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

  function openExternalUrl(url) {
    if (typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /* ==================== SEAL HANDLER ==================== */
  function handleSealNote() {
    const recEl = $('recipientInput');
    const secEl = $('secretTextarea');
    const clueEl = $('clueInput');
    const burnEl = $('burnTimerToggle');

    const recipient = recEl && recEl.value ? recEl.value.trim() : '';
    const secret = secEl && secEl.value ? secEl.value.trim() : '';
    const clue = clueEl && clueEl.value ? clueEl.value.trim() : '';
    const burn = Boolean(burnEl && burnEl.checked);

    if (!secret) {
      showToast('✍️ Write a secret message or tap 🎲 Random Idea!');
      if (secEl && typeof secEl.focus === 'function') secEl.focus();
      return;
    }

    state.recipient = recipient || 'You';
    state.secret = secret;
    state.clue = clue;
    state.burn = burn;
    if (!state.cardId) state.cardId = generateAlphaId(8);

    const token = encodePayloadV5({
      recipient: state.recipient,
      secret: state.secret,
      clue: state.clue,
      burn: state.burn
    });

    const slug = slugifyRecipient(state.recipient);
    state.shortUrl = `${getBaseUrl()}?${slug}-${state.cardId}#${token}`;

    trackEvent('note_sealed', { burn: state.burn, hindi: hasDevanagari(state.secret) });
    showSenderReadyView();
  }

  /* ==================== WIRE EVENTS ==================== */
  function bindEvents() {
    const secTa = $('secretTextarea');
    if (secTa) {
      secTa.addEventListener('input', () => {
        const val = secTa.value || '';
        applyAutoTypography(secTa, val);
        const countEl = $('secretCharCount');
        if (countEl) countEl.textContent = `${val.length} / 280`;
      });
    }

    const burnToggle = $('burnTimerToggle');
    if (burnToggle) {
      burnToggle.addEventListener('change', () => {
        state.burn = Boolean(burnToggle.checked);
      });
    }

    if ($('shuffleIdeaBtn')) $('shuffleIdeaBtn').addEventListener('click', shuffleRandomIdea);
    if ($('sealCardBtn')) $('sealCardBtn').addEventListener('click', handleSealNote);
    if ($('editSealedBtn')) $('editSealedBtn').addEventListener('click', () => showWriteComposer(true, false));
    if ($('writeNewBtn')) $('writeNewBtn').addEventListener('click', () => showWriteComposer(false, true));
    if ($('brandResetLink')) {
      $('brandResetLink').addEventListener('click', (e) => {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        showWriteComposer(false, true);
      });
    }

    /* Frictionless 2-Button Sender Share Screen */
    if ($('copyUrlBtn')) {
      $('copyUrlBtn').addEventListener('click', () => {
        copyText(getShareableLink(), '🔗 Short link copied!');
        trackEvent('copy_link', { place: 'url_bar' });
      });
    }
    if ($('whatsappShareBtn')) {
      $('whatsappShareBtn').addEventListener('click', () => {
        const recName = state.recipient || 'You';
        const url = getShareableLink();
        const msg = `💌 Someone sealed a secret note for *${recName}* under gold foil! Rub the screen with your finger to unseal it: ${url}`;
        openExternalUrl(`https://wa.me/?text=${encodeURIComponent(msg)}`);
        trackEvent('share_whatsapp');
      });
    }
    if ($('copyIgBtn')) {
      $('copyIgBtn').addEventListener('click', () => {
        copyText(getShareableLink(), 'Copied! Paste in IG Story Link Sticker or DM ✨');
        trackEvent('copy_instagram_link');
      });
    }

    /* Scratch & Preview Actions */
    if ($('testScratchBtn')) {
      $('testScratchBtn').addEventListener('click', () => {
        openReceiverView(
          { recipient: state.recipient, secret: state.secret, clue: state.clue, b: state.burn ? 1 : 0 },
          true
        );
      });
    }
    if ($('backToReadyBtn')) $('backToReadyBtn').addEventListener('click', showSenderReadyView);
    if ($('quickRevealBtn')) $('quickRevealBtn').addEventListener('click', completeReveal);

    /* Receiver 1-Tap WhatsApp Reaction Pills */
    qsa('#receiverReactionsRow .react-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        qsa('#receiverReactionsRow .react-pill').forEach((p) => p.classList.remove('is-picked'));
        btn.classList.add('is-picked');
        const reaction = btn.dataset ? btn.dataset.react : btn.textContent;
        const replyMsg = `Just scratched & unsealed the secret note! My reaction: ${reaction} 👀 Send me another or confess here: https://unseal-cards.vercel.app`;
        openExternalUrl(`https://wa.me/?text=${encodeURIComponent(replyMsg)}`);
        trackEvent('receiver_reaction', { reaction });
      });
    });

    /* Ping-Pong Reply CTA & Instant Free 9:16 Story PNG */
    if ($('sealBackBtn')) {
      $('sealBackBtn').addEventListener('click', () => showWriteComposer(false, true));
    }
    if ($('downloadStoryCardBtn')) {
      $('downloadStoryCardBtn').addEventListener('click', downloadStoryCardPng);
    }

    /* Below-the-Fold 1-Tap Note Template Chips */
    qsa('#ideasChipsGrid .idea-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const msg = chip.dataset ? chip.dataset.msg : '';
        if ($('recipientInput') && chip.dataset.rec) $('recipientInput').value = chip.dataset.rec;
        if ($('secretTextarea') && msg) {
          $('secretTextarea').value = msg;
          applyAutoTypography($('secretTextarea'), msg);
          if ($('secretCharCount')) $('secretCharCount').textContent = `${msg.length} / 280`;
        }
        if ($('clueInput') && chip.dataset.clue) $('clueInput').value = chip.dataset.clue;
        showWriteComposer(true, false);
        if ($('composerCard') && typeof $('composerCard').scrollIntoView === 'function') {
          $('composerCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showToast('✨ Prompt loaded — tap Seal!');
      });
    });

    /* Legal Compliance Modal & Tabs */
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
        openExternalUrl(
          `mailto:support@unseal-cards.vercel.app?subject=${encodeURIComponent(reason)}&body=${encodeURIComponent(details)}`
        );
      });
    }

    bindScratchPointerEvents();
  }

  /* ==================== BOOT SEQUENCE ==================== */
  function clearStaleCaches() {
    if (typeof caches === 'undefined' || !caches || typeof caches.keys !== 'function') return;
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== 'unseal-v5') caches.delete(key).catch(() => { });
      });
    }).catch(() => { });
  }

  function boot() {
    bindEvents();
    clearStaleCaches();

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof location !== 'undefined') {
      if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          if (reg && typeof reg.update === 'function') reg.update().catch(() => { });
        }).catch(() => { });
      }
    }

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => {
        if (state.mode === 'preview' && !state.revealed) paintScratchCanvas(false);
      });
    }

    const search = typeof location !== 'undefined' ? location.search : '';
    const hash = typeof location !== 'undefined' ? location.hash : '';
    const isSectionHash = /^#(privacy|terms|disclaimer|contact|editorialGuide|faqSection|ideaVault)$/i.test(hash);
    const incoming = isSectionHash ? null : decodeIncomingUrl(search, hash);
    if (incoming && incoming.secret) {
      openReceiverView(incoming, false);
    } else {
      if (document.documentElement && document.documentElement.classList) {
        document.documentElement.classList.remove('receiver-boot');
      }
      showWriteComposer(false, false, isSectionHash);
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
