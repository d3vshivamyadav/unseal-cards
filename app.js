(() => {
  'use strict';

  const cfg = window.UNSEAL_CONFIG || {};
  const KEY_STREAM_TAG = [85, 78, 83, 69, 65, 76, 51, 48];
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const REVEAL_THRESHOLD = 0.45;
  const MAX_SECRET_CHARS = 280;
  const TARGET_SHARES = 5;

  const U4_SINGLE_CHARS = "abcdefghijklmnopqrstuvwxyz .,!?'-:\n/0123456789"; // 0..45
  const U4_PHRASES = [
    'you', 'the ', 'and ', 'love', 'miss', 'crush', 'secret',
    'sorry', 'night', 'smile', 'always', 'hai', 'dil', '❤️'
  ]; // 47..60
  const U4_EMOJIS = ['✨', '💌', '👀', '🥹', '😂', '🔥', '💕', '🌙']; // 61 + 3-bit index
  const U2_MOODS = ['💌 Crush Confession', '🌙 Midnight Thought', '🤫 Inside Joke', '🎲 Wild Dare'];

  const MYSTERY_EDITIONS = {
    gold: {
      tier: 'tier-gold',
      badge: '★ ROYAL GOLD RESERVE',
      crest: '👑',
      rarity: 'Top 4% Collector Pass',
      accent: '#C9A96E',
      light: '#F6E5BE',
      bgStops: ['#403126', '#1F1A17', '#110E0D'],
      fortunes: [
        'Someone replays your last text longer than they admit ✨',
        'A quiet admirer checks when you are online every night 👀',
        'Your name brings an instant smile to someone’s screen 💌'
      ]
    },
    diamond: {
      tier: 'tier-diamond',
      badge: '💎 CELESTIAL DIAMOND AURA',
      crest: '💎',
      rarity: 'Top 2% Rare Edition',
      accent: '#93C5FD',
      light: '#DBEAFE',
      bgStops: ['#1E3A54', '#13202E', '#0B1119'],
      fortunes: [
        'Unexpected late-night confession energy is heading your way 🌙',
        'Someone remembers a tiny detail about you from months ago ✨',
        'Your vibe makes close friends trust you with their deepest secrets 💎'
      ]
    },
    midnight: {
      tier: 'tier-midnight',
      badge: '🌙 MIDNIGHT CROWN EDITION',
      crest: '🌙',
      rarity: 'Top 5% Mystic Pass',
      accent: '#D8B4FE',
      light: '#F3E8FF',
      bgStops: ['#382352', '#1C142B', '#0F0A17'],
      fortunes: [
        'Three words left unsaid around you are waiting for the right moment 🌙',
        '2 AM honesty brings a plot twist into your week ✨',
        'Someone secretly compares their favorite songs to your vibe 🎧'
      ]
    },
    crimson: {
      tier: 'tier-crimson',
      badge: '🔥 CRIMSON VELVET CHARM',
      crest: '♥',
      rarity: 'Top 3% Signature Seal',
      accent: '#FDA4AF',
      light: '#FFE4E6',
      bgStops: ['#522026', '#261114', '#14080A'],
      fortunes: [
        'Magnetic main-character energy — your next reply changes everything 🔥',
        'Somebody secretly hopes you notice their hints this week 💌',
        'Your presence turns ordinary chats into core memories ❤️'
      ]
    }
  };

  const utf8Encoder = new TextEncoder();
  const utf8Decoder = new TextDecoder();

  const state = {
    isReceiverMode: false,
    cardId: generateAlphaId(8),
    recipient: '',
    senderName: '',
    secret: '',
    clue: '',
    shareUrl: '',
    soundEnabled: false,
    userExplicitlyMuted: false,
    audioCtx: null,
    noiseBuffer: null,
    lastSoundTime: 0,
    lastHapticTime: 0,
    isDrawing: false,
    hasRevealed: false,
    lastPos: null,
    lastProgressCheck: 0,
    popupTimer: null,
    toastTimer: null,
    deferredInstallPrompt: null,
    installAnimTimer: null,
    liveCountBase: 0,
    liveCountTimer: null,
    questSharePending: false,
    questShareTimer: null
  };

  let scratchCanvas = null;
  let scratchCtx = null;
  let resizeObserver = null;

  const $ = (id) => document.getElementById(id);

  // =========================================================================
  // 0. Guarded GA4 Analytics & Safe Service Worker Boot
  // =========================================================================

  function initAnalyticsIfConfigured() {
    const gaId = String(cfg.ga4Id || '').trim();
    if (!gaId || gaId === 'G-XXXXXXXXXX' || !/^G-[A-Z0-9]+$/i.test(gaId)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true, page_title: document.title });

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s);
  }

  function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, params);
      } catch (_) { }
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
      return;
    }
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { });
  }

  // =========================================================================
  // 1. 8-Char Alpha ID & Ultra-Short U4 Codec (+ Full U3/U2/U1 Backcompat)
  // =========================================================================

  function generateAlphaId(len = 8) {
    const out = [];
    const rand = new Uint8Array(len);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(rand);
    } else {
      for (let i = 0; i < len; i++) rand[i] = Math.floor(Math.random() * 256);
    }
    for (let i = 0; i < len; i++) {
      out.push(ALPHABET[rand[i] % ALPHABET.length]);
    }
    return out.join('');
  }

  function makeNameSlug(name) {
    const clean = String(name || '')
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '')
      .slice(0, 14);
    return clean || 'Note';
  }

  function extractQueryMeta(searchStr) {
    const cleaned = String(searchStr || '').replace(/^\?/, '').split('&')[0] || '';
    const match = /^([A-Za-z0-9]+)-([A-Za-z]{8})$/.exec(cleaned);
    if (match) {
      return { slug: match[1], id: match[2] };
    }
    const idOnly = /-([A-Za-z]{8})$/.exec(cleaned);
    return { slug: '', id: idOnly ? idOnly[1] : '' };
  }

  function bytesToBase64Url(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(token) {
    let b64 = String(token || '').trim().replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function xorTransform(inputBytes, salt0, salt1, tag = KEY_STREAM_TAG) {
    const out = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i++) {
      const k = tag[i % tag.length] ^ (i % 2 === 0 ? salt0 : salt1) ^ ((i * 13) & 0xff);
      out[i] = inputBytes[i] ^ k;
    }
    return out;
  }

  class BitWriter {
    constructor() {
      this.bytes = [];
      this.cur = 0;
      this.bits = 0;
    }
    write(val, width) {
      for (let i = width - 1; i >= 0; i--) {
        this.cur = (this.cur << 1) | ((val >>> i) & 1);
        this.bits++;
        if (this.bits === 8) {
          this.bytes.push(this.cur);
          this.cur = 0;
          this.bits = 0;
        }
      }
    }
    finish() {
      if (this.bits > 0) {
        this.bytes.push(this.cur << (8 - this.bits));
        this.cur = 0;
        this.bits = 0;
      }
      return Uint8Array.from(this.bytes);
    }
  }

  class BitReader {
    constructor(bytes) {
      this.bytes = bytes;
      this.bytePos = 0;
      this.bitPos = 0;
    }
    read(width) {
      let val = 0;
      for (let i = 0; i < width; i++) {
        if (this.bytePos >= this.bytes.length) throw new Error('BitReader EOF');
        const bit = (this.bytes[this.bytePos] >>> (7 - this.bitPos)) & 1;
        val = (val << 1) | bit;
        this.bitPos++;
        if (this.bitPos === 8) {
          this.bitPos = 0;
          this.bytePos++;
        }
      }
      return val;
    }
  }

  function writeU4String(bw, rawStr) {
    const s = String(rawStr || '').replace(/\0/g, '');
    let i = 0;
    while (i < s.length) {
      let matchedPhrase = -1;
      for (let p = 0; p < U4_PHRASES.length; p++) {
        const phrase = U4_PHRASES[p];
        if (s.startsWith(phrase, i)) {
          matchedPhrase = p;
          i += phrase.length;
          break;
        }
      }
      if (matchedPhrase !== -1) {
        bw.write(47 + matchedPhrase, 6);
        continue;
      }

      let matchedEmoji = -1;
      for (let e = 0; e < U4_EMOJIS.length; e++) {
        const emo = U4_EMOJIS[e];
        if (s.startsWith(emo, i)) {
          matchedEmoji = e;
          i += emo.length;
          break;
        }
      }
      if (matchedEmoji !== -1) {
        bw.write(61, 6);
        bw.write(matchedEmoji, 3);
        continue;
      }

      const cp = s.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      i += ch.length;

      const singleIdx = U4_SINGLE_CHARS.indexOf(ch);
      if (singleIdx !== -1) {
        bw.write(singleIdx, 6);
      } else if (cp >= 65 && cp <= 90) {
        bw.write(46, 6);
        bw.write(cp - 65, 5);
      } else if (cp >= 0x0900 && cp <= 0x097f) {
        bw.write(62, 6);
        bw.write(cp - 0x0900, 7);
      } else {
        const u8 = utf8Encoder.encode(ch);
        for (let k = 0; k < u8.length; k++) {
          if (k === 0) {
            bw.write(63, 6);
            bw.write(u8[0], 8);
          } else {
            bw.write(u8[k], 8);
          }
        }
      }
    }
    bw.write(63, 6);
    bw.write(0, 8);
  }

  function readU4String(br) {
    let out = '';
    while (true) {
      const sym = br.read(6);
      if (sym < 46) {
        out += U4_SINGLE_CHARS[sym];
      } else if (sym === 46) {
        out += String.fromCharCode(65 + br.read(5));
      } else if (sym <= 60) {
        out += U4_PHRASES[sym - 47];
      } else if (sym === 61) {
        out += U4_EMOJIS[br.read(3)];
      } else if (sym === 62) {
        out += String.fromCodePoint(0x0900 + br.read(7));
      } else {
        const b0 = br.read(8);
        if (b0 === 0) break;
        if (b0 < 0x80) {
          out += String.fromCharCode(b0);
        } else {
          let seqLen = 2;
          if ((b0 & 0xf0) === 0xe0) seqLen = 3;
          else if ((b0 & 0xf8) === 0xf0) seqLen = 4;
          const seq = new Uint8Array(seqLen);
          seq[0] = b0;
          for (let k = 1; k < seqLen; k++) seq[k] = br.read(8);
          out += utf8Decoder.decode(seq);
        }
      }
    }
    return out;
  }

  function writeVarint(arr, num) {
    let v = Math.max(0, num | 0);
    while (v >= 0x80) {
      arr.push((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    arr.push(v);
  }

  function readVarint(bytes, cursor) {
    let shift = 0;
    let res = 0;
    while (cursor.pos < bytes.length) {
      const b = bytes[cursor.pos++];
      res |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) return res;
      shift += 7;
    }
    throw new Error('Malformed varint');
  }

  function readCompactStr(bytes, cursor) {
    const len = readVarint(bytes, cursor);
    const end = cursor.pos + len;
    if (end > bytes.length) throw new Error('Malformed compact string');
    let out = '';
    while (cursor.pos < end) {
      const b = bytes[cursor.pos++];
      if (b < 0x7f) {
        out += String.fromCharCode(b);
      } else if (b >= 0x80) {
        out += String.fromCodePoint(0x0900 + (b & 0x7f));
      } else {
        const b1 = bytes[cursor.pos++];
        if (b1 === undefined) break;
        if (b1 < 0x80) {
          out += String.fromCharCode(b1);
        } else {
          let seqLen = 2;
          if ((b1 & 0xf0) === 0xe0) seqLen = 3;
          else if ((b1 & 0xf8) === 0xf0) seqLen = 4;
          const seq = new Uint8Array(seqLen);
          seq[0] = b1;
          for (let j = 1; j < seqLen; j++) seq[j] = bytes[cursor.pos++];
          out += utf8Decoder.decode(seq);
        }
      }
    }
    return out;
  }

  function lz77Compress(input) {
    const n = input.length;
    const out = [];
    let i = 0;
    while (i < n) {
      const ctrlPos = out.length;
      out.push(0);
      let ctrl = 0;
      for (let bit = 0; bit < 8 && i < n; bit++) {
        let bestLen = 0;
        let bestDist = 0;
        const winStart = Math.max(0, i - 2048);
        const maxLen = Math.min(34, n - i);
        if (maxLen >= 3) {
          for (let j = i - 1; j >= winStart; j--) {
            if (input[j] !== input[i]) continue;
            let len = 1;
            while (len < maxLen && input[j + len] === input[i + len]) len++;
            if (len >= 3 && len > bestLen) {
              bestLen = len;
              bestDist = i - j;
              if (bestLen === maxLen) break;
            }
          }
        }
        if (bestLen >= 3) {
          ctrl |= 1 << bit;
          const distMinus1 = bestDist - 1;
          out.push((distMinus1 >> 3) & 0xff);
          out.push(((distMinus1 & 7) << 5) | ((bestLen - 3) & 0x1f));
          i += bestLen;
        } else {
          out.push(input[i++]);
        }
      }
      out[ctrlPos] = ctrl;
    }
    return Uint8Array.from(out);
  }

  function lz77Decompress(input) {
    const out = [];
    let p = 0;
    while (p < input.length) {
      const ctrl = input[p++];
      for (let bit = 0; bit < 8 && p < input.length; bit++) {
        if ((ctrl & (1 << bit)) !== 0) {
          const b0 = input[p++];
          const b1 = input[p++];
          if (b1 === undefined) throw new Error('Corrupted LZ77 stream');
          const dist = ((b0 << 3) | (b1 >> 5)) + 1;
          const matchLen = (b1 & 0x1f) + 3;
          if (dist > out.length) throw new Error('Invalid LZ77 offset');
          for (let k = 0; k < matchLen; k++) out.push(out[out.length - dist]);
        } else {
          out.push(input[p++]);
        }
      }
    }
    return Uint8Array.from(out);
  }

  // Ultra-short U4 Encoder: [0x55, 0x34, meta(salt5<<3 | useLz<<2 | hasClue<<1 | recMatchesSlug)]
  function encodeU4Token(r, s, c) {
    const rec = (r || '').trim() || 'You';
    const slug = makeNameSlug(rec);
    const recMatchesSlug = rec === slug || (rec === 'You' && slug === 'You');
    const sec = (s || '').trim();
    const clue = (c || '').trim();
    const hasClue = Boolean(clue);

    const bw = new BitWriter();
    if (!recMatchesSlug) writeU4String(bw, rec);
    writeU4String(bw, sec);
    if (hasClue) writeU4String(bw, clue);

    const rawBin = bw.finish();
    const lzBin = rawBin.length >= 14 ? lz77Compress(rawBin) : rawBin;
    const useLz = lzBin.length < rawBin.length;
    const body = useLz ? lzBin : rawBin;

    const saltBuf = new Uint8Array(1);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(saltBuf);
    } else {
      saltBuf[0] = Math.floor(Math.random() * 256);
    }
    const salt5 = saltBuf[0] & 0x1f;
    const salt1 = (salt5 * 41 + 23) & 0xff;
    const cipher = xorTransform(body, salt5, salt1, KEY_STREAM_TAG);

    const packet = new Uint8Array(3 + cipher.length);
    packet[0] = 0x55; // 'U'
    packet[1] = 0x34; // '4'
    packet[2] = (salt5 << 3) | (useLz ? 4 : 0) | (hasClue ? 2 : 0) | (recMatchesSlug ? 1 : 0);
    packet.set(cipher, 3);
    return { slug, token: bytesToBase64Url(packet) };
  }

  function decodeU4Packet(raw, recHint) {
    const meta = raw[2];
    const salt5 = (meta >> 3) & 0x1f;
    const useLz = (meta & 4) !== 0;
    const hasClue = (meta & 2) !== 0;
    const recMatchesSlug = (meta & 1) !== 0;
    const salt1 = (salt5 * 41 + 23) & 0xff;
    let plain = xorTransform(raw.subarray(3), salt5, salt1, KEY_STREAM_TAG);
    if (useLz) plain = lz77Decompress(plain);

    const br = new BitReader(plain);
    const r = recMatchesSlug ? (recHint || 'You') : readU4String(br);
    const s = readU4String(br);
    const c = hasClue ? readU4String(br) : '';
    return { r, s, c };
  }

  function decodeU3Packet(raw) {
    const meta = raw[2];
    const salt6 = (meta >> 2) & 0x3f;
    const useLz = (meta & 2) !== 0;
    const hasClue = (meta & 1) !== 0;
    const salt1 = (salt6 * 41 + 23) & 0xff;
    let plain = xorTransform(raw.subarray(3), salt6, salt1, KEY_STREAM_TAG);
    if (useLz) plain = lz77Decompress(plain);

    const cursor = { pos: 0 };
    const r = readCompactStr(plain, cursor);
    const s = readCompactStr(plain, cursor);
    const c = hasClue ? readCompactStr(plain, cursor) : '';
    return { r, s, c };
  }

  // Full compatibility decoder for U4 + U3 + U2/U1/JSON ?seal= and ?s= links
  function decodeToken(token, queryMeta = { slug: '', id: '' }) {
    const raw = base64UrlToBytes(token);
    const fallbackId = queryMeta.id;
    const recHint = queryMeta.slug && queryMeta.slug !== 'Note' ? queryMeta.slug : 'You';

    if (raw.length > 3 && raw[0] === 0x55 && raw[1] === 0x34) {
      const u4 = decodeU4Packet(raw, recHint);
      if (!u4.s || !u4.s.trim()) throw new Error('Missing note text');
      return {
        r: (u4.r || 'You').trim().slice(0, 40),
        s: u4.s.trim().slice(0, 320),
        c: (u4.c || '').trim().slice(0, 120) || 'A quiet admirer',
        id: fallbackId || generateAlphaId(8)
      };
    }

    if (raw.length > 3 && raw[0] === 0x55 && raw[1] === 0x33) {
      const u3 = decodeU3Packet(raw);
      if (!u3.s || !u3.s.trim()) throw new Error('Missing note text');
      return {
        r: (u3.r || 'You').trim().slice(0, 40),
        s: u3.s.trim().slice(0, 320),
        c: (u3.c || '').trim().slice(0, 120) || 'A quiet admirer',
        id: fallbackId || generateAlphaId(8)
      };
    }

    const legacyTag = [85, 78, 83, 69, 65, 76, 50, 54];
    if (raw.length > 4 && raw[0] === 0x55 && raw[1] === 0x32) {
      const meta = raw[2];
      const salt7 = (meta >> 1) & 0x7f;
      const useLz = (meta & 1) === 1;
      const salt1 = (salt7 * 37 + 19) & 0xff;
      let plain = xorTransform(raw.subarray(3), salt7, salt1, legacyTag);
      if (useLz) plain = lz77Decompress(plain);

      const cursor = { pos: 0 };
      const flags = plain[cursor.pos++];
      cursor.pos += 2;
      const p3 = plain[cursor.pos++];
      let cardId = fallbackId || '';
      if (flags & 64) {
        const hi = plain[cursor.pos++];
        const lo = plain[cursor.pos++];
        cardId = `UNS-${String((hi << 8) | lo).padStart(4, '0')}`;
      } else {
        cardId = readCompactStr(plain, cursor);
      }
      const moodIdx = p3 & 15;
      if (moodIdx === 15) readCompactStr(plain, cursor);
      else void U2_MOODS[moodIdx];
      const rec = flags & 128 ? readCompactStr(plain, cursor) : 'You';
      const sec = readCompactStr(plain, cursor);
      const clue = flags & 4 ? readCompactStr(plain, cursor) : 'A quiet admirer';
      if (!sec || !sec.trim()) throw new Error('Missing note text');
      return {
        r: rec.trim().slice(0, 40) || 'You',
        s: sec.trim().slice(0, 500),
        c: clue.trim().slice(0, 140) || 'A quiet admirer',
        id: cardId || generateAlphaId(8)
      };
    }

    let jsonBytes = raw;
    if (raw.length > 4 && raw[0] === 0x55 && raw[1] === 0x31) {
      jsonBytes = xorTransform(raw.subarray(4), raw[2], raw[3], legacyTag);
    }
    const data = JSON.parse(utf8Decoder.decode(jsonBytes));
    if (!data || typeof data.s !== 'string' || !data.s.trim()) {
      throw new Error('Missing secret text');
    }
    return {
      r: typeof data.r === 'string' && data.r.trim() ? data.r.trim().slice(0, 40) : 'You',
      s: data.s.trim().slice(0, 500),
      c: typeof data.c === 'string' && data.c.trim() ? data.c.trim().slice(0, 140) : 'A quiet admirer',
      id: typeof data.id === 'string' && data.id.trim() ? data.id.trim().slice(0, 16) : fallbackId || generateAlphaId(8)
    };
  }

  function getBasePageUrl() {
    if (window.location.protocol === 'file:') {
      return cfg.siteOrigin ? `${cfg.siteOrigin}/` : 'https://unseal.cards/';
    }
    return `${window.location.origin}${window.location.pathname}`;
  }

  function buildShortCardUrl(recipient, secret, clue, id) {
    const { slug, token } = encodeU4Token(recipient, secret, clue);
    return `${getBasePageUrl()}?${slug}-${id}#${token}`;
  }

  // =========================================================================
  // 2. Web Audio Synthesizer (Scratch Friction + Adaptive Music & Vault Fanfare)
  // =========================================================================

  function ensureAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!state.audioCtx) {
      try {
        state.audioCtx = new Ctx();
      } catch (_) {
        return null;
      }
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => { });
    }
    if (!state.noiseBuffer && state.audioCtx) {
      const sr = state.audioCtx.sampleRate;
      const len = Math.floor(sr * 0.25);
      const buffer = state.audioCtx.createBuffer(1, len, sr);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.92 * b0 + w * 0.08;
        data[i] = w * 0.4 + b0 * 0.6;
      }
      state.noiseBuffer = buffer;
    }
    return state.audioCtx;
  }

  function updateSoundUi() {
    const btn = $('audioToggleBtn');
    const icon = $('audioToggleIcon');
    if (!btn) return;
    btn.classList.toggle('is-unmuted', state.soundEnabled);
    btn.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
    if (icon) icon.textContent = state.soundEnabled ? '🔊' : '🔇';
  }

  function setSoundEnabled(enabled, explicit = false) {
    state.soundEnabled = Boolean(enabled);
    if (explicit) state.userExplicitlyMuted = !state.soundEnabled;
    if (state.soundEnabled) ensureAudioContext();
    updateSoundUi();
  }

  function unlockAudioOnGesture() {
    if (!state.userExplicitlyMuted && !state.soundEnabled) {
      setSoundEnabled(true, false);
    } else if (state.soundEnabled) {
      ensureAudioContext();
    }
  }

  function playScratchSound(speedFactor) {
    if (!state.soundEnabled) return;
    const now = performance.now();
    if (now - state.lastSoundTime < 46) return;
    state.lastSoundTime = now;

    const ctx = ensureAudioContext();
    if (!ctx || !state.noiseBuffer) return;
    try {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = state.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + speedFactor * 950, t);
      filter.Q.setValueAtTime(1.4, t);

      const gain = ctx.createGain();
      const peak = Math.min(0.08, 0.025 + speedFactor * 0.045);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.075);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t, Math.random() * 0.14, 0.08);
    } catch (_) { }
  }

  function playTone(ctx, freq, start, dur, type = 'sine', peak = 0.05) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  function detectVibe(secretText, clueText) {
    const txt = `${secretText || ''} ${clueText || ''}`.toLowerCase();
    if (/(sorry|maaf|galti|forgive|माफ़|गलती|🥺)/.test(txt)) return 'apology';
    if (/(birthday|bday|congrats|anniversary|janamdin|जन्मदिन|बधाई|🎂|🥳)/.test(txt)) return 'celebration';
    if (/(dare|challenge|truth|himmat|हिम्मत|शर्त)/.test(txt)) return 'dare';
    if (/(haha|joke|meme|funny|😂|🤣)/.test(txt)) return 'joke';
    if (/(night|midnight|2am|2 am|neend|रात|🌙)/.test(txt)) return 'midnight';
    return 'crush';
  }

  function playRevealChime() {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const vibe = detectVibe(state.secret, state.clue);
      const t0 = ctx.currentTime;
      const maps = {
        crush: [349.23, 440.0, 523.25, 659.25, 783.99, 1046.5],
        apology: [369.99, 440.0, 493.88, 554.37, 659.25],
        celebration: [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98],
        dare: [440.0, 523.25, 659.25, 880.0, 1046.5],
        joke: [392.0, 493.88, 587.33, 783.99, 1046.5],
        midnight: [293.66, 440.0, 523.25, 659.25, 880.0]
      };
      const notes = maps[vibe] || maps.crush;
      notes.forEach((f, idx) => {
        playTone(ctx, f, t0 + idx * 0.085, 1.05, idx % 2 === 0 ? 'sine' : 'triangle', 0.052);
      });
    } catch (_) { }
  }

  function playVaultUnlockFanfare() {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        playTone(ctx, f, t0 + i * 0.075, 0.9, 'triangle', 0.055);
      });
    } catch (_) { }
  }

  // =========================================================================
  // 3. Mystery Collector Vault Engine (Sender + Receiver 5-Share Unlock)
  // =========================================================================

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function getMysteryEditionFor(role) {
    const seed = hashString(`${state.cardId || 'Unseal'}:${role}`);
    const keys = Object.keys(MYSTERY_EDITIONS);
    const key = keys[seed % keys.length];
    const ed = MYSTERY_EDITIONS[key];
    const auraScore = 91 + (seed % 9); // 91% - 99%
    const fortune = ed.fortunes[(seed >>> 3) % ed.fortunes.length];
    return { key, ...ed, auraScore, fortune };
  }

  function getQuestStorageKey(role) {
    return `unseal_v7_vault_${role}_${state.cardId}`;
  }

  function getShareCount(role) {
    try {
      const v = parseInt(localStorage.getItem(getQuestStorageKey(role)) || '0', 10);
      return Number.isFinite(v) ? Math.min(TARGET_SHARES, Math.max(0, v)) : 0;
    } catch (_) {
      return 0;
    }
  }

  function setShareCount(role, count) {
    const clamped = Math.min(TARGET_SHARES, Math.max(0, count | 0));
    try {
      localStorage.setItem(getQuestStorageKey(role), String(clamped));
    } catch (_) { }
    return clamped;
  }

  function syncWaxSlots(containerEl, count) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.wax-slot').forEach((slot) => {
      const idx = parseInt(slot.getAttribute('data-slot') || '0', 10);
      const cracked = idx <= count;
      slot.classList.toggle('is-cracked', cracked);
      slot.textContent = cracked ? '♥' : String(idx);
    });
  }

  function renderVaultUi(role, justUnlocked = false) {
    const count = getShareCount(role);
    const unlocked = count >= TARGET_SHARES;
    const pct = Math.round((count / TARGET_SHARES) * 100);
    const ed = getMysteryEditionFor(role);

    const rec = (state.recipient || '').trim();
    const snd = (state.senderName || '').trim();
    const recValid = rec && rec !== 'You' ? rec : '';

    if (role === 'sender') {
      const pill = $('senderQuestPill');
      const fill = $('senderProgressFill');
      const card = $('senderGiftMiniCard');
      const tierEl = $('senderGiftTierLabel');
      const passEl = $('senderGiftPassId');
      const crestEl = $('senderGiftCrest');
      const mainEl = $('senderGiftMainText');
      const subEl = $('senderGiftSubText');
      const rarityEl = $('senderGiftRarityChip');
      const veilTitle = $('senderVaultVeilTitle');
      const questBtn = $('senderQuestWhatsAppBtn');
      const questBtnText = $('senderQuestBtnText');
      const unlockedBtns = $('senderGiftUnlockedBtns');

      syncWaxSlots($('senderWaxTrack'), count);
      if (fill) fill.style.width = `${pct}%`;
      if (passEl) passEl.textContent = `#${state.cardId}`;

      if (pill) {
        pill.textContent = unlocked ? 'Unlocked ✨ (5/5)' : `${count} / 5 Shared`;
        pill.classList.toggle('unlocked', unlocked);
      }

      if (card) {
        card.className = `gift-mini-card ${ed.tier}${unlocked ? '' : ' is-locked-vault'}${justUnlocked ? ' is-just-unlocked' : ''}`;
      }

      if (unlocked) {
        if (tierEl) tierEl.textContent = ed.badge;
        if (crestEl) crestEl.textContent = ed.crest;
        if (mainEl) {
          if (snd && recValid) mainEl.textContent = `${snd} × ${recValid} • ${ed.auraScore}% Aura ✨`;
          else if (snd) mainEl.textContent = `${snd}’s 2026 Mystery Pass • ${ed.auraScore}%`;
          else if (recValid) mainEl.textContent = `Secret Pass for ${recValid} • ${ed.auraScore}%`;
          else mainEl.textContent = `2026 Secret Keeper Pass • ${ed.auraScore}%`;
        }
        if (subEl) subEl.textContent = ed.fortune;
        if (rarityEl) rarityEl.textContent = ed.rarity;
        questBtn?.classList.add('hidden');
        unlockedBtns?.classList.remove('hidden');
      } else {
        const left = TARGET_SHARES - count;
        if (tierEl) tierEl.textContent = 'UNSEAL • MYSTERY VAULT';
        if (crestEl) crestEl.textContent = '🎁';
        if (mainEl) mainEl.textContent = '2026 Collector Gift Card Inside';
        if (subEl) subEl.textContent = 'Aura Score, Rare Edition & Fortune Prophecy';
        if (rarityEl) rarityEl.textContent = `${left} WhatsApp share${left === 1 ? '' : 's'} left`;
        if (veilTitle) veilTitle.textContent = `${left} WhatsApp Share${left === 1 ? '' : 's'} Left to Unlock`;
        if (questBtnText) {
          questBtnText.textContent =
            count === 0
              ? '💚 Share on WhatsApp to Crack Seal 1/5 →'
              : `💚 Share with Next Friend on WhatsApp (${count}/5) →`;
        }
        questBtn?.classList.remove('hidden');
        unlockedBtns?.classList.add('hidden');
      }
      return;
    }

    // Receiver inline vault + popup modal
    const rPill = $('receiverQuestPill');
    const rFill = $('receiverProgressFill');
    const rCard = $('receiverGiftMiniCard');
    const rTier = $('receiverGiftTierLabel');
    const rPass = $('receiverGiftPassId');
    const rCrest = $('receiverGiftCrest');
    const rMain = $('receiverGiftMainText');
    const rSub = $('receiverGiftSubText');
    const rRarity = $('receiverGiftRarityChip');
    const rVeilTitle = $('receiverVaultVeilTitle');
    const rQuestBtn = $('receiverQuestWhatsAppBtn');
    const rQuestBtnText = $('receiverQuestBtnText');
    const rUnlockedBtns = $('receiverGiftUnlockedBtns');

    syncWaxSlots($('receiverWaxTrack'), count);
    syncWaxSlots($('modalWaxTrack'), count);
    if (rFill) rFill.style.width = `${pct}%`;
    if (rPass) rPass.textContent = `#${state.cardId}`;

    if (rPill) {
      rPill.textContent = unlocked ? 'Unlocked ✨ (5/5)' : `${count} / 5 Shared`;
      rPill.classList.toggle('unlocked', unlocked);
    }

    if (rCard) {
      rCard.className = `gift-mini-card ${ed.tier}${unlocked ? '' : ' is-locked-vault'}${justUnlocked ? ' is-just-unlocked' : ''}`;
    }

    if (unlocked) {
      if (rTier) rTier.textContent = ed.badge;
      if (rCrest) rCrest.textContent = ed.crest;
      if (rMain) {
        rMain.textContent = recValid
          ? `${recValid}’s ${ed.auraScore}% Mystery Pass ✨`
          : `Unsealed ${ed.auraScore}% Mystery Pass ✨`;
      }
      if (rSub) rSub.textContent = ed.fortune;
      if (rRarity) rRarity.textContent = ed.rarity;
      rQuestBtn?.classList.add('hidden');
      rUnlockedBtns?.classList.remove('hidden');
    } else {
      const left = TARGET_SHARES - count;
      if (rTier) rTier.textContent = 'UNSEAL • MYSTERY VAULT';
      if (rCrest) rCrest.textContent = '🎁';
      if (rMain) rMain.textContent = recValid ? `${recValid}’s Mystery Gift Box` : 'Your 2026 Mystery Gift Box';
      if (rSub) rSub.textContent = 'Surprise Aura Score & Fortune locked inside';
      if (rRarity) rRarity.textContent = `${left} WhatsApp share${left === 1 ? '' : 's'} left`;
      if (rVeilTitle) rVeilTitle.textContent = `${left} WhatsApp Share${left === 1 ? '' : 's'} Left to Crack Open`;
      if (rQuestBtnText) {
        rQuestBtnText.textContent = `💚 Share on WhatsApp to Unlock (${count}/5) →`;
      }
      rQuestBtn?.classList.remove('hidden');
      rUnlockedBtns?.classList.add('hidden');
    }

    // Sync Celebration Modal elements
    const mName = $('popupGiftNameLine');
    const mProg = $('popupQuestProgressCopy');
    const mWaText = $('modalWhatsAppBtnText');
    const mClaimText = $('modalClaimBtnText');
    const mIcon = $('popupGiftIcon');

    if (unlocked) {
      if (mIcon) mIcon.textContent = ed.crest;
      if (mName) mName.textContent = `${ed.badge} Unlocked (${ed.auraScore}% Aura)!`;
      if (mProg) mProg.textContent = ed.fortune;
      if (mWaText) mWaText.textContent = '💚 Invite More Friends on WhatsApp';
      if (mClaimText) mClaimText.textContent = '🎁 Download 9:16 Gift Card';
    } else {
      const left = TARGET_SHARES - count;
      if (mIcon) mIcon.textContent = '🎁';
      if (mName) {
        mName.textContent = recValid
          ? `${recValid}’s 2026 Mystery Gift Box (${count}/5)`
          : `Mystery Collector Gift Card (${count}/5)`;
      }
      if (mProg) {
        mProg.textContent = `Share with ${left} more friend${left === 1 ? '' : 's'} on WhatsApp to reveal your surprise card!`;
      }
      if (mWaText) mWaText.textContent = `💚 Share on WhatsApp (${count}/5 Done)`;
      if (mClaimText) mClaimText.textContent = `🔒 Locked (${count}/5 Shares)`;
    }
  }

  function advanceQuestShare(role, sourceAction = 'whatsapp') {
    const prev = getShareCount(role);
    if (prev >= TARGET_SHARES) {
      renderVaultUi(role, false);
      return;
    }

    const next = setShareCount(role, prev + 1);
    const unlockedNow = prev < TARGET_SHARES && next >= TARGET_SHARES;
    renderVaultUi(role, unlockedNow);

    trackEvent('gift_vault_progress', { role, step: next, source: sourceAction });

    if (unlockedNow) {
      trackEvent('gift_card_unlocked', { role, card_id: state.cardId });
      playVaultUnlockFanfare();
      burstPaperConfetti();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([70, 40, 120]);
        } catch (_) { }
      }
      showToast('🎉 5/5 Wax Seals Cracked! Your 2026 Mystery Gift Card is UNLOCKED!');
    } else {
      showToast(`✅ Wax Seal ${next}/5 cracked! Invite ${TARGET_SHARES - next} more friend(s) on WhatsApp.`);
    }
  }

  function scheduleQuestShareConfirm(role, delayMs = 850) {
    if (getShareCount(role) >= TARGET_SHARES) return;
    clearTimeout(state.questShareTimer);
    state.questSharePending = role;
    showToast('⏳ Confirming WhatsApp share to crack next seal...');
    state.questShareTimer = setTimeout(() => {
      if (state.questSharePending === role) {
        state.questSharePending = false;
        advanceQuestShare(role, 'whatsapp_quest');
      }
    }, delayMs);
  }

  // =========================================================================
  // 4. Writer Flow, Live WhatsApp Preview Card & View Switching
  // =========================================================================

  function updateCharCounter() {
    const len = ($('secretTextarea')?.value || '').length;
    const el = $('secretCharCount');
    if (el) el.textContent = `${len} / ${MAX_SECRET_CHARS}`;
  }

  function syncWhatsAppPreviewBubble() {
    const rec = state.recipient && state.recipient !== 'You' ? state.recipient : 'You';
    const waTitle = $('waPreviewTitle');
    const waSendText = $('whatsappSendBtnText');
    if (waTitle) {
      waTitle.textContent = `💌 For ${rec} — Tap & Scratch to Unseal Your Secret Note`;
    }
    if (waSendText) {
      waSendText.textContent =
        rec !== 'You' ? `💚 Send Secret to ${rec} on WhatsApp` : '💚 Send Secret on WhatsApp';
    }
  }

  function handleSealAndCreateLink() {
    const secretVal = ($('secretTextarea')?.value || '').trim();
    if (!secretVal) {
      showToast('✍️ Write a secret message first!');
      $('secretTextarea')?.focus();
      return;
    }

    const recipientVal = ($('recipientInput')?.value || '').trim().slice(0, 32) || 'You';
    const senderVal = ($('senderNameInput')?.value || '').trim().slice(0, 24);
    const clueVal = ($('clueInput')?.value || '').trim().slice(0, 80);

    state.recipient = recipientVal;
    state.senderName = senderVal;
    state.secret = secretVal.slice(0, MAX_SECRET_CHARS);
    state.clue = clueVal || 'A quiet admirer';
    state.cardId = generateAlphaId(8);
    state.shareUrl = buildShortCardUrl(state.recipient, state.secret, clueVal, state.cardId);

    const readyHeadline = $('readyHeadline');
    if (readyHeadline) readyHeadline.textContent = `Sealed for ${state.recipient} ✨`;
    if ($('readyCardIdBadge')) $('readyCardIdBadge').textContent = `#${state.cardId}`;
    if ($('previewUrlText')) $('previewUrlText').textContent = state.shareUrl;

    syncWhatsAppPreviewBubble();
    renderVaultUi('sender', false);

    $('composerCard')?.classList.add('hidden');
    $('senderReadyCard')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('seal_created', { len: state.secret.length });
    showToast('✨ Sealed! Short trusted link & Mystery Vault ready.');
  }

  function showComposerEdit() {
    $('senderReadyCard')?.classList.add('hidden');
    $('composerCard')?.classList.remove('hidden');
  }

  function resetToFreshComposer() {
    clearTimeout(state.popupTimer);
    state.isReceiverMode = false;
    state.hasRevealed = false;
    state.cardId = generateAlphaId(8);
    state.recipient = '';
    state.senderName = '';
    state.secret = '';
    state.clue = '';
    state.shareUrl = '';

    document.documentElement.classList.remove('receiver-boot');
    if (window.history && window.history.replaceState && (window.location.search || window.location.hash)) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    document.title = 'Unseal — Secret Scratch Note Maker & Mystery Status Gift Card App';
    if ($('recipientInput')) $('recipientInput').value = '';
    if ($('senderNameInput')) $('senderNameInput').value = '';
    if ($('secretTextarea')) $('secretTextarea').value = '';
    if ($('clueInput')) $('clueInput').value = '';
    updateCharCounter();

    $('revealShareModal')?.classList.add('hidden');
    $('viewPreview')?.classList.add('hidden');
    $('viewWrite')?.classList.remove('hidden');
    $('senderReadyCard')?.classList.add('hidden');
    $('composerCard')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => $('recipientInput')?.focus(), 250);
  }

  function openScratchView({ fromSenderPreview }) {
    $('viewWrite')?.classList.add('hidden');
    $('viewPreview')?.classList.remove('hidden');
    $('previewTopBar')?.classList.toggle('hidden', !fromSenderPreview);

    if ($('receiverCardId')) $('receiverCardId').textContent = `#${state.cardId}`;
    if ($('postcardHeading')) $('postcardHeading').textContent = `For ${state.recipient}, someone left you a sealed note.`;
    if ($('revealedSecretText')) $('revealedSecretText').textContent = state.secret;
    if ($('revealedClueText')) $('revealedClueText').textContent = `"${state.clue || 'A quiet admirer'}"`;

    const statusPill = $('scratchStatusPill');
    if (statusPill) {
      statusPill.textContent = '🪙 Rub foil gently to unseal';
      statusPill.classList.remove('is-done');
    }

    $('waxStampBadge')?.classList.remove('is-stamped');
    $('quickRevealBtn')?.classList.remove('hidden');
    $('postRevealActions')?.classList.add('hidden');
    $('revealShareModal')?.classList.add('hidden');
    state.hasRevealed = false;
    state.isDrawing = false;
    state.lastPos = null;

    initScratchCanvas();
  }

  // =========================================================================
  // 5. HTML5 Metallic Champagne Gold Scratch Foil + Confetti + Reveal
  // =========================================================================

  function paintChampagneFoil(ctx, width, height) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#E8DFCF');
    grad.addColorStop(0.28, '#D2B57E');
    grad.addColorStop(0.5, '#F9F3E6');
    grad.addColorStop(0.75, '#C4A265');
    grad.addColorStop(1, '#E6DEC9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    for (let i = 0; i < 42; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(120, 92, 48, 0.08)';
      ctx.lineWidth = 1;
      const y = (height / 42) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + (i % 3 === 0 ? 4 : -4));
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(56, 42, 24, 0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px "DM Sans", sans-serif';
    ctx.fillText('✨ SCRATCH TO UNSEAL ✨', width / 2, height / 2 - 11);
    ctx.font = '500 11px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(56, 42, 24, 0.48)';
    ctx.fillText('Rub gently with your finger or mouse', width / 2, height / 2 + 12);
    ctx.restore();
  }

  function initScratchCanvas() {
    scratchCanvas = $('scratchCanvas');
    const box = $('scratchBox');
    if (!scratchCanvas || !box) return;

    scratchCanvas.classList.remove('foil-faded');
    const logicalW = Math.max(250, Math.round(box.clientWidth || 340));
    const logicalH = Math.max(195, Math.round(box.clientHeight || 220));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    scratchCanvas.width = Math.round(logicalW * dpr);
    scratchCanvas.height = Math.round(logicalH * dpr);
    scratchCanvas.dataset.logicalW = String(logicalW);
    scratchCanvas.dataset.logicalH = String(logicalH);

    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
    if (!scratchCtx) return;

    scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scratchCtx.globalCompositeOperation = 'source-over';
    paintChampagneFoil(scratchCtx, logicalW, logicalH);

    if (resizeObserver) resizeObserver.disconnect();
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        if (state.hasRevealed || !scratchCanvas || !box) return;
        const newW = Math.round(box.clientWidth || 0);
        const curW = parseInt(scratchCanvas.dataset.logicalW || '0', 10);
        if (newW > 200 && Math.abs(newW - curW) > 12) {
          initScratchCanvas();
        }
      });
      resizeObserver.observe(box);
    }
  }

  function evaluateScratchProgress() {
    if (!scratchCanvas || !scratchCtx || state.hasRevealed) return;
    const w = scratchCanvas.width;
    const h = scratchCanvas.height;
    if (!w || !h) return;

    const pixels = scratchCtx.getImageData(0, 0, w, h).data;
    let cleared = 0;
    let sampled = 0;
    const stride = 24;
    for (let i = 3; i < pixels.length; i += stride * 4) {
      sampled++;
      if (pixels[i] < 128) cleared++;
    }

    const ratio = sampled ? cleared / sampled : 0;
    const pct = Math.min(100, Math.round(ratio * 100));
    const pill = $('scratchStatusPill');
    if (pill && !state.hasRevealed && pct > 0) {
      pill.textContent = `🪙 Scratched ${pct}% • Keep rubbing`;
    }

    if (ratio >= REVEAL_THRESHOLD) {
      completeReveal(false);
    }
  }

  function burstPaperConfetti() {
    const colors = ['#D9383A', '#C9A96E', '#F59E0B', '#1C1917', '#FDE68A'];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:85;overflow:hidden;';
    document.body.appendChild(wrap);

    for (let i = 0; i < 36; i++) {
      const piece = document.createElement('span');
      const startX = 15 + Math.random() * 70;
      const drift = (Math.random() - 0.5) * 180;
      const delay = Math.random() * 0.18;
      const dur = 1.25 + Math.random() * 0.7;
      piece.style.cssText = `
        position:absolute;
        left:${startX}%;
        top:34%;
        width:${6 + Math.random() * 5}px;
        height:${9 + Math.random() * 6}px;
        border-radius:2px;
        background:${colors[i % colors.length]};
        opacity:0.95;
        transform:translate(-50%,-50%) rotate(0deg);
        transition:transform ${dur}s cubic-bezier(0.22,0.8,0.2,1) ${delay}s, opacity ${dur}s ease ${delay}s;
      `;
      wrap.appendChild(piece);
      requestAnimationFrame(() => {
        piece.style.transform = `translate(${drift}px, ${180 + Math.random() * 260}px) rotate(${360 + Math.random() * 360}deg)`;
        piece.style.opacity = '0';
      });
    }
    setTimeout(() => wrap.remove(), 2300);
  }

  function completeReveal(instant) {
    if (state.hasRevealed) return;
    state.hasRevealed = true;
    state.isDrawing = false;

    if (scratchCanvas) {
      scratchCanvas.classList.add('foil-faded');
      if (instant && scratchCtx) {
        scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
      }
    }

    const pill = $('scratchStatusPill');
    if (pill) {
      pill.textContent = '✨ Unsealed!';
      pill.classList.add('is-done');
    }

    $('waxStampBadge')?.classList.add('is-stamped');
    $('quickRevealBtn')?.classList.add('hidden');
    $('postRevealActions')?.classList.remove('hidden');

    renderVaultUi('receiver', false);

    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 120]);
      } catch (_) { }
    }

    playRevealChime();
    burstPaperConfetti();
    trackEvent('card_unsealed', { card_id: state.cardId });

    clearTimeout(state.popupTimer);
    state.popupTimer = setTimeout(() => {
      renderVaultUi('receiver', false);
      $('revealShareModal')?.classList.remove('hidden');
    }, 1350);
  }

  function bindScratchPointerHandlers() {
    const canvas = $('scratchCanvas');
    if (!canvas) return;

    const getLocalPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const logicalW = parseFloat(canvas.dataset.logicalW || String(rect.width)) || rect.width;
      const logicalH = parseFloat(canvas.dataset.logicalH || String(rect.height)) || rect.height;
      return {
        x: ((clientX - rect.left) / (rect.width || 1)) * logicalW,
        y: ((clientY - rect.top) / (rect.height || 1)) * logicalH
      };
    };

    const drawStroke = (pos) => {
      if (!scratchCtx || state.hasRevealed) return;
      scratchCtx.save();
      scratchCtx.globalCompositeOperation = 'destination-out';
      scratchCtx.lineCap = 'round';
      scratchCtx.lineJoin = 'round';
      scratchCtx.lineWidth = 48;
      scratchCtx.strokeStyle = 'rgba(0,0,0,1)';
      scratchCtx.fillStyle = 'rgba(0,0,0,1)';

      if (state.lastPos) {
        scratchCtx.beginPath();
        scratchCtx.moveTo(state.lastPos.x, state.lastPos.y);
        scratchCtx.lineTo(pos.x, pos.y);
        scratchCtx.stroke();
      } else {
        scratchCtx.beginPath();
        scratchCtx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
        scratchCtx.fill();
      }
      scratchCtx.restore();

      const moveDist = state.lastPos ? Math.hypot(pos.x - state.lastPos.x, pos.y - state.lastPos.y) : 0;
      state.lastPos = pos;

      const now = performance.now();
      if (now - state.lastHapticTime >= 50) {
        state.lastHapticTime = now;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(8);
          } catch (_) { }
        }
      }

      if (moveDist > 1.5 || now - state.lastSoundTime > 90) {
        playScratchSound(Math.min(1, moveDist / 28));
      }

      if (now - state.lastProgressCheck > 85) {
        state.lastProgressCheck = now;
        evaluateScratchProgress();
      }
    };

    canvas.addEventListener('mousedown', (e) => {
      if (state.hasRevealed) return;
      unlockAudioOnGesture();
      state.isDrawing = true;
      state.lastPos = null;
      drawStroke(getLocalPos(e.clientX, e.clientY));
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isDrawing || state.hasRevealed) return;
      drawStroke(getLocalPos(e.clientX, e.clientY));
    });

    window.addEventListener('mouseup', () => {
      if (!state.isDrawing) return;
      state.isDrawing = false;
      state.lastPos = null;
      evaluateScratchProgress();
    });

    canvas.addEventListener(
      'touchstart',
      (e) => {
        if (state.hasRevealed) return;
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        if (!t) return;
        unlockAudioOnGesture();
        state.isDrawing = true;
        state.lastPos = null;
        drawStroke(getLocalPos(t.clientX, t.clientY));
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        if (!state.isDrawing || state.hasRevealed) return;
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        if (!t) return;
        drawStroke(getLocalPos(t.clientX, t.clientY));
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchend',
      () => {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        state.lastPos = null;
        evaluateScratchProgress();
      },
      { passive: true }
    );
  }

  // =========================================================================
  // 6. Native 1080x1920 9:16 PNG Generator (Collector Mystery Gift + Note)
  // =========================================================================

  function wrapLines(ctx, text, maxWidth, maxLines = 12) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
        if (lines.length >= maxLines) break;
      } else {
        line = test;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    return lines;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function renderCardPngBlob(mode = 'gift', role = 'sender') {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (mode === 'gift') {
      const ed = getMysteryEditionFor(role);
      const bg = ctx.createRadialGradient(840, 260, 80, 540, 960, 1280);
      bg.addColorStop(0, ed.bgStops[0]);
      bg.addColorStop(0.55, ed.bgStops[1]);
      bg.addColorStop(1, ed.bgStops[2]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);

      // Subtle star dust
      ctx.fillStyle = 'rgba(246, 229, 190, 0.2)';
      for (let i = 0; i < 45; i++) {
        ctx.beginPath();
        ctx.arc(((i * 211) % 980) + 50, ((i * 389) % 1800) + 60, (i % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Collector Gift Frame
      drawRoundedRect(ctx, 84, 210, 912, 1410, 48);
      ctx.fillStyle = 'rgba(20, 17, 16, 0.88)';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = ed.accent;
      ctx.stroke();

      drawRoundedRect(ctx, 112, 238, 856, 1354, 36);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();

      ctx.fillStyle = ed.light;
      ctx.font = '700 26px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ed.badge, 156, 325);
      ctx.textAlign = 'right';
      ctx.fillText(`#${state.cardId}`, 924, 325);

      // Crest Circle
      ctx.beginPath();
      ctx.arc(540, 515, 84, 0, Math.PI * 2);
      ctx.fillStyle = '#D9383A';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = ed.light;
      ctx.stroke();

      ctx.fillStyle = '#FFFDF9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 66px Georgia, serif';
      ctx.fillText(ed.crest, 540, 520);

      const rec = state.recipient && state.recipient !== 'You' ? state.recipient : '';
      const snd = state.senderName || '';
      let mainTitle = '2026 Secret Collector Pass';
      if (role === 'receiver') {
        mainTitle = rec ? `${rec}’s 2026 Mystery Pass` : 'My 2026 Mystery Pass';
      } else if (snd && rec) {
        mainTitle = `${snd} × ${rec} Secret Pass`;
      } else if (snd) {
        mainTitle = `${snd}’s VIP Secret Pass`;
      } else if (rec) {
        mainTitle = `Secret Pass for ${rec}`;
      }

      ctx.fillStyle = '#FFFDF9';
      ctx.font = 'italic 700 66px "Playfair Display", Georgia, serif';
      const titleLines = wrapLines(ctx, mainTitle, 760, 3);
      let curY = 710;
      titleLines.forEach((ln) => {
        ctx.fillText(ln, 540, curY);
        curY += 84;
      });

      // Aura Match Score Pill
      drawRoundedRect(ctx, 210, curY + 26, 660, 78, 39);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = ed.accent;
      ctx.stroke();
      ctx.fillStyle = ed.light;
      ctx.font = '700 28px "DM Sans", sans-serif';
      ctx.fillText(`SECRET VIBE AURA: ${ed.auraScore}% • ${ed.rarity.toUpperCase()}`, 540, curY + 66);

      // Fortune Box
      const fy = curY + 148;
      drawRoundedRect(ctx, 148, fy, 784, 240, 28);
      ctx.fillStyle = 'rgba(255, 253, 249, 0.06)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.stroke();

      ctx.fillStyle = '#D6CFC5';
      ctx.font = '700 20px "DM Sans", sans-serif';
      ctx.fillText('2026 MYSTERY FORTUNE', 540, fy + 48);

      ctx.fillStyle = '#FFFDF9';
      ctx.font = '600 42px "Caveat", "Kalam", "Noto Sans Devanagari", cursive';
      const fLines = wrapLines(ctx, `“${ed.fortune}”`, 700, 3);
      let fLineY = fy + 112;
      fLines.forEach((l) => {
        ctx.fillText(l, 540, fLineY);
        fLineY += 54;
      });

      ctx.fillStyle = ed.light;
      ctx.font = '600 38px "Caveat", cursive';
      const callout =
        role === 'receiver'
          ? 'Your turn — drop a secret note in my chat 👀💌'
          : 'Someone just received a secret scratch note 👀💌';
      ctx.fillText(callout, 540, 1395);

      ctx.fillStyle = ed.accent;
      ctx.font = 'italic 700 58px "Playfair Display", Georgia, serif';
      ctx.fillText('Unseal', 540, 1485);
      ctx.fillStyle = '#C7BFB5';
      ctx.font = '500 27px "DM Sans", sans-serif';
      ctx.fillText('Scratch & unlock yours free at unseal.cards', 540, 1545);
    } else {
      // Revealed Note 9:16 Warm Linen Postcard
      ctx.fillStyle = '#FAF6F0';
      ctx.fillRect(0, 0, 1080, 1920);

      ctx.fillStyle = '#E6DDD0';
      for (let x = 24; x < 1080; x += 36) {
        for (let y = 24; y < 1920; y += 36) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      drawRoundedRect(ctx, 76, 210, 928, 1400, 44);
      ctx.fillStyle = '#FFFCF7';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#C9A96E';
      ctx.stroke();

      ctx.fillStyle = '#D9383A';
      ctx.font = '700 24px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('UNSEALED SECRET POSTCARD', 136, 300);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#78716C';
      ctx.fillText(`#${state.cardId}`, 944, 300);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#1C1917';
      ctx.font = 'italic 700 54px "Playfair Display", Georgia, serif';
      const headLines = wrapLines(ctx, `For ${state.recipient || 'You'}, someone left you a sealed note.`, 808, 3);
      let hy = 385;
      headLines.forEach((l) => {
        ctx.fillText(l, 136, hy);
        hy += 68;
      });

      drawRoundedRect(ctx, 136, hy + 25, 808, 690, 28);
      ctx.fillStyle = '#FFFDF8';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#E5DDD0';
      ctx.stroke();

      ctx.fillStyle = '#2A1618';
      ctx.font = '600 58px "Caveat", "Kalam", "Noto Sans Devanagari", cursive';
      const noteLines = wrapLines(ctx, state.secret, 720, 8);
      let ny = hy + 115;
      noteLines.forEach((l) => {
        ctx.fillText(l, 180, ny);
        ny += 74;
      });

      drawRoundedRect(ctx, 136, hy + 750, 808, 170, 24);
      ctx.fillStyle = '#F6EFE3';
      ctx.fill();

      ctx.fillStyle = '#78716C';
      ctx.font = '700 22px "DM Sans", sans-serif';
      ctx.fillText('CLUE FROM SENDER', 174, hy + 802);
      ctx.fillStyle = '#1C1917';
      ctx.font = '600 44px "Caveat", "Kalam", "Noto Sans Devanagari", cursive';
      ctx.fillText(`"${state.clue || 'A quiet admirer'}"`, 174, hy + 868);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#1C1917';
      ctx.font = 'italic 700 56px "Playfair Display", Georgia, serif';
      ctx.fillText('Unseal', 540, 1740);
      ctx.fillStyle = '#57534E';
      ctx.font = '500 28px "DM Sans", sans-serif';
      ctx.fillText('Scratch & create yours free at unseal.cards', 540, 1805);
    }

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async function downloadPngCard(mode = 'gift', role = 'sender') {
    if (mode === 'gift' && getShareCount(role) < TARGET_SHARES) {
      showToast(`🔒 Share with ${TARGET_SHARES - getShareCount(role)} more friend(s) on WhatsApp to unlock!`);
      return;
    }
    showToast('🎨 Rendering 9:16 Status card...');
    const blob = await renderCardPngBlob(mode, role);
    if (!blob) {
      showToast('⚠️ Could not generate image on this browser.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'gift' ? `unseal-gift-${role}-${state.cardId}.png` : `unseal-note-${state.cardId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    trackEvent('gift_card_downloaded', { mode, role });
    showToast('🎁 9:16 Story PNG saved! Post on WhatsApp Status or IG Story.');
  }

  async function shareGiftImage(role = 'sender') {
    if (getShareCount(role) < TARGET_SHARES) {
      shareQuestInviteWhatsApp(role);
      return;
    }
    showToast('🎨 Preparing your Collector Gift Card...');
    const blob = await renderCardPngBlob('gift', role);
    if (!blob) return;

    const file = new File([blob], `unseal-gift-${role}-${state.cardId}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My 2026 Unseal Mystery Gift Card 🎁',
          text: `Just cracked my 2026 Mystery Pass! Scratch & unlock yours free: ${getBasePageUrl()}`
        });
        showToast('🎁 Shared your Mystery Gift Card!');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    await downloadPngCard('gift', role);
  }

  // =========================================================================
  // 7. WhatsApp & Social Sharing (Secret Delivery + 5-Friend Vault Invites)
  // =========================================================================

  function showToast(msg) {
    let el = $('app-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast';
      el.className = 'app-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => el.classList.remove('show'), 3300);
  }

  async function copyText(str) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(str);
        return true;
      } catch (_) { }
    }
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (_) { }
    ta.remove();
    return true;
  }

  function shareSealedWhatsApp() {
    if (!state.shareUrl) return;
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'friend';
    const text = `Hey ${who}! 💌 Someone sealed a secret scratch note for you. Rub the gold foil & check your 2026 Mystery Gift Card:\n${state.shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    trackEvent('whatsapp_share', { kind: 'sealed_note' });
    scheduleQuestShareConfirm('sender', 800);
  }

  function shareQuestInviteWhatsApp(role) {
    const homeUrl = getBasePageUrl();
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'yaar';
    const msg =
      role === 'sender'
        ? `Yaar ek crazy gold-foil secret note & 2026 Mystery Gift Card challenge try kar 😳💌 Apna card unseal kar: ${homeUrl}`
        : `Hey ${who}! Someone just sent me a secret scratch-off note on Unseal ✨ Try rubbing the foil & claim your 2026 Mystery Gift Card: ${homeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    trackEvent('whatsapp_share', { kind: 'quest_invite', role });
    scheduleQuestShareConfirm(role, 850);
  }

  function shareSealedTelegram() {
    if (!state.shareUrl) return;
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'you';
    const msg = `💌 Someone sealed a secret scratch note for ${who}. Rub the gold foil to unseal!`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(state.shareUrl)}&text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
    scheduleQuestShareConfirm('sender', 900);
  }

  async function shareSealedNative() {
    if (!state.shareUrl) return;
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'you';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Secret Note for ${who} — Unseal`,
          text: `Hey ${who}! 💌 Rub the gold foil to unseal your secret note:`,
          url: state.shareUrl
        });
        advanceQuestShare('sender', 'native_share');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    await copyText(state.shareUrl);
    showToast('📋 Short link copied! Paste anywhere on WhatsApp or IG.');
  }

  async function inviteFriendNative(role) {
    const homeUrl = getBasePageUrl();
    const text = 'Send an anonymous gold-foil secret note & crack open your 2026 Mystery Gift Card 💌🎁';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Unseal — Secret Scratch Notes', text, url: homeUrl });
        advanceQuestShare(role, 'native_invite');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    await copyText(`${text} ${homeUrl}`);
    showToast('📋 Invite copied! Share with friends on WhatsApp to advance.');
  }

  // =========================================================================
  // 8. Unique PWA Install Animation, Service Worker & Fullscreen Control
  // =========================================================================

  function setInstallOverlayProgress(pct, badge, title, status, showIosSteps = false) {
    const bar = $('pwaInstallProgressBar');
    if (bar) bar.style.width = `${pct}%`;
    if ($('pwaInstallBadge') && badge) $('pwaInstallBadge').textContent = badge;
    if ($('pwaInstallTitle') && title) $('pwaInstallTitle').textContent = title;
    if ($('pwaInstallStatusText') && status) $('pwaInstallStatusText').textContent = status;
    $('iosInstallStepsBox')?.classList.toggle('hidden', !showIosSteps);
  }

  async function triggerPwaInstallWithAnimation() {
    const overlay = $('pwaInstallOverlay');
    if (!overlay) return;
    clearTimeout(state.installAnimTimer);

    trackEvent('pwa_install_clicked', { has_native_prompt: Boolean(state.deferredInstallPrompt) });
    overlay.classList.remove('hidden');
    setInstallOverlayProgress(
      24,
      '📲 INSTALLING UNSEAL PWA',
      'Sealing Unseal onto your Home Screen…',
      'Preparing offline scratch foil, Hindi calligraphy fonts & 9:16 Mystery Gift studio.',
      false
    );

    if (state.soundEnabled) playRevealChime();

    state.installAnimTimer = setTimeout(async () => {
      setInstallOverlayProgress(
        68,
        '✨ CONFIGURING APP ICON',
        'Locking Offline Secret Vault…',
        'Adding full-screen adaptive launch & 1-tap access from your phone screen.',
        false
      );

      if (state.deferredInstallPrompt) {
        try {
          const promptEvt = state.deferredInstallPrompt;
          state.deferredInstallPrompt = null;
          await promptEvt.prompt();
          const choice = await promptEvt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            setInstallOverlayProgress(
              100,
              '🎉 INSTALLED!',
              'Unseal App Sealed on Home Screen!',
              'Launch Unseal anytime directly like a native phone app.',
              false
            );
            burstPaperConfetti();
            trackEvent('pwa_installed', { method: 'prompt_accepted' });
            setTimeout(() => overlay.classList.add('hidden'), 1800);
          } else {
            overlay.classList.add('hidden');
            showToast('📲 You can install Unseal anytime from the header!');
          }
          return;
        } catch (_) { }
      }

      // iOS Safari or browser without native beforeinstallprompt
      setInstallOverlayProgress(
        100,
        '📲 ALMOST THERE — 2 QUICK TAPS',
        'Pin Unseal App to Home Screen',
        'Your browser blocks automatic 1-click install dialogs—follow these 2 taps below:',
        true
      );
    }, 850);
  }

  function bindPwaAndFullscreen() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      $('installAppBtn')?.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
      state.deferredInstallPrompt = null;
      document.documentElement.classList.add('is-pwa');
      $('pwaInstallOverlay')?.classList.add('hidden');
      burstPaperConfetti();
      trackEvent('pwa_installed', { method: 'browser_event' });
      showToast('🎉 Unseal installed! Open it anytime from your Home Screen.');
    });

    $('installAppBtn')?.addEventListener('click', triggerPwaInstallWithAnimation);
    $('footerInstallAppBtn')?.addEventListener('click', triggerPwaInstallWithAnimation);
    $('closeInstallOverlayBtn')?.addEventListener('click', () => {
      clearTimeout(state.installAnimTimer);
      $('pwaInstallOverlay')?.classList.add('hidden');
    });
    $('pwaInstallOverlay')?.addEventListener('click', (e) => {
      if (e.target === $('pwaInstallOverlay')) {
        clearTimeout(state.installAnimTimer);
        $('pwaInstallOverlay').classList.add('hidden');
      }
    });

    const fsBtn = $('fullscreenToggleBtn');
    if (fsBtn) {
      const canFs = Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
      if (!canFs) {
        fsBtn.classList.add('hidden');
      } else {
        fsBtn.addEventListener('click', async () => {
          try {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen();
              fsBtn.setAttribute('aria-pressed', 'true');
            } else if (document.exitFullscreen) {
              await document.exitFullscreen();
              fsBtn.setAttribute('aria-pressed', 'false');
            }
          } catch (_) { }
        });
      }
    }
  }

  // =========================================================================
  // 9. Live Activity Counter, Idea Chips, Legal Modals & Boot
  // =========================================================================

  function initLiveCounter() {
    const el = $('liveCounterCount');
    if (!el) return;
    const hr = new Date().getHours();
    state.liveCountBase = 4820 + hr * 21 + Math.floor(Math.random() * 25);
    el.textContent = state.liveCountBase.toLocaleString('en-US');

    state.liveCountTimer = setInterval(() => {
      state.liveCountBase += 1 + Math.floor(Math.random() * 3);
      el.textContent = state.liveCountBase.toLocaleString('en-US');
    }, 48000);
  }

  function bindIdeaChips() {
    document.querySelectorAll('.idea-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (state.isReceiverMode) resetToFreshComposer();
        const rec = chip.getAttribute('data-rec') || '';
        const msg = chip.getAttribute('data-msg') || '';
        const clue = chip.getAttribute('data-clue') || '';
        if ($('recipientInput')) $('recipientInput').value = rec;
        if ($('secretTextarea')) $('secretTextarea').value = msg;
        if ($('clueInput')) $('clueInput').value = clue;
        updateCharCounter();
        $('senderReadyCard')?.classList.add('hidden');
        $('composerCard')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('✨ Template loaded! Personalize & hit Seal Note.');
      });
    });
  }

  function bindLegalModals() {
    const modal = $('legalModal');
    const closeBtn = $('closeLegalModalBtn');
    const tabs = document.querySelectorAll('[data-legal-tab]');
    const panels = document.querySelectorAll('[data-legal-panel]');

    const openLegal = (tab) => {
      tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-legal-tab') === tab));
      panels.forEach((p) => p.classList.toggle('hidden', p.getAttribute('data-legal-panel') !== tab));
      modal?.classList.remove('hidden');
    };

    document.querySelectorAll('[data-open-legal]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openLegal(el.getAttribute('data-open-legal') || 'privacy');
      });
    });

    tabs.forEach((t) => t.addEventListener('click', () => openLegal(t.getAttribute('data-legal-tab'))));
    closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    $('abuseReportForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const reason = $('reportReason')?.value || 'Report';
      const details = ($('reportDetails')?.value || '').trim();
      window.location.href = `mailto:support@unseal.cards?subject=${encodeURIComponent(`[Unseal] ${reason}`)}&body=${encodeURIComponent(details)}`;
      showToast('✉️ Email draft prepared for support@unseal.cards');
    });
  }

  function bindAllEvents() {
    $('brandResetLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      resetToFreshComposer();
    });

    $('audioToggleBtn')?.addEventListener('click', () => {
      setSoundEnabled(!state.soundEnabled, true);
      showToast(state.soundEnabled ? '🔊 Sound ON' : '🔇 Sound muted');
    });

    $('secretTextarea')?.addEventListener('input', updateCharCounter);
    $('clearComposerBtn')?.addEventListener('click', () => {
      if ($('secretTextarea')) $('secretTextarea').value = '';
      if ($('clueInput')) $('clueInput').value = '';
      updateCharCounter();
      $('secretTextarea')?.focus();
    });

    $('sealCardBtn')?.addEventListener('click', handleSealAndCreateLink);
    $('editSealedBtn')?.addEventListener('click', showComposerEdit);
    $('writeNewBtn')?.addEventListener('click', resetToFreshComposer);

    $('copyUrlBtn')?.addEventListener('click', async () => {
      if (!state.shareUrl) return;
      await copyText(state.shareUrl);
      showToast('🔒 Short link copied! Send it & unlock your Mystery Gift Vault.');
    });

    $('whatsappShareBtn')?.addEventListener('click', shareSealedWhatsApp);
    $('senderQuestWhatsAppBtn')?.addEventListener('click', () => shareQuestInviteWhatsApp('sender'));
    $('shareTelegramBtn')?.addEventListener('click', shareSealedTelegram);
    $('nativeShareBtn')?.addEventListener('click', shareSealedNative);
    $('copyIgBtn')?.addEventListener('click', async () => {
      if (!state.shareUrl) return;
      await copyText(state.shareUrl);
      const label = $('copyIgBtnText');
      if (label) {
        const orig = label.textContent;
        label.textContent = '✅ Link Copied for IG!';
        setTimeout(() => { label.textContent = orig; }, 2200);
      }
      showToast('📸 Link copied! Paste into Instagram Story sticker or DM.');
    });

    $('downloadGiftCardBtn')?.addEventListener('click', () => downloadPngCard('gift', 'sender'));
    $('shareGiftImageBtn')?.addEventListener('click', () => shareGiftImage('sender'));

    $('testScratchBtn')?.addEventListener('click', () => {
      openScratchView({ fromSenderPreview: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('backToReadyBtn')?.addEventListener('click', () => {
      clearTimeout(state.popupTimer);
      $('viewPreview')?.classList.add('hidden');
      $('viewWrite')?.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('quickRevealBtn')?.addEventListener('click', () => {
      unlockAudioOnGesture();
      completeReveal(true);
    });

    // Receiver Gift Vault + Actions
    $('receiverQuestWhatsAppBtn')?.addEventListener('click', () => shareQuestInviteWhatsApp('receiver'));
    $('receiverGiftBtn')?.addEventListener('click', () => downloadPngCard('gift', 'receiver'));
    $('receiverShareGiftImageBtn')?.addEventListener('click', () => shareGiftImage('receiver'));
    $('downloadRevealedCardBtn')?.addEventListener('click', () => downloadPngCard('revealed', 'receiver'));
    $('sealBackBtn')?.addEventListener('click', resetToFreshComposer);
    $('openShareModalBtn')?.addEventListener('click', () => {
      renderVaultUi('receiver', false);
      $('revealShareModal')?.classList.remove('hidden');
    });

    // Celebration Popup Modal
    const revealModal = $('revealShareModal');
    $('closeRevealModalBtn')?.addEventListener('click', () => revealModal?.classList.add('hidden'));
    revealModal?.addEventListener('click', (e) => {
      if (e.target === revealModal) revealModal.classList.add('hidden');
    });
    $('modalShareWhatsAppBtn')?.addEventListener('click', () => shareQuestInviteWhatsApp('receiver'));
    $('modalShareNativeBtn')?.addEventListener('click', () => inviteFriendNative('receiver'));
    $('modalClaimGiftBtn')?.addEventListener('click', () => {
      if (getShareCount('receiver') >= TARGET_SHARES) {
        downloadPngCard('gift', 'receiver');
      } else {
        shareQuestInviteWhatsApp('receiver');
      }
    });
    $('modalReplyBtn')?.addEventListener('click', resetToFreshComposer);

    // Faster confirmation when user switches back from WhatsApp on phone
    window.addEventListener('focus', () => {
      if (state.questSharePending) {
        const pendingRole = state.questSharePending;
        clearTimeout(state.questShareTimer);
        state.questSharePending = false;
        advanceQuestShare(pendingRole, 'whatsapp_focus_return');
      }
    });

    bindScratchPointerHandlers();
    bindPwaAndFullscreen();
    bindIdeaChips();
    bindLegalModals();
  }

  function init() {
    initAnalyticsIfConfigured();
    registerServiceWorker();
    updateSoundUi();
    updateCharCounter();
    initLiveCounter();
    bindAllEvents();

    const params = new URLSearchParams(window.location.search);
    const legacySeal = params.get('seal') || params.get('s');
    const hashToken = (window.location.hash || '').replace(/^#/, '');
    const qMeta = extractQueryMeta(window.location.search);
    const activeToken = legacySeal || (hashToken.length > 6 ? hashToken : '');

    if (activeToken) {
      try {
        const decoded = decodeToken(activeToken, qMeta);
        state.isReceiverMode = true;
        state.recipient = decoded.r;
        state.secret = decoded.s;
        state.clue = decoded.c;
        state.cardId = decoded.id;
        state.senderName = '';
        document.title = `For ${decoded.r} — Scratch to Unseal Your Secret Note | Unseal`;
        openScratchView({ fromSenderPreview: false });
        return;
      } catch (_) {
        document.documentElement.classList.remove('receiver-boot');
        showToast('⚠️ This secret note link seems incomplete. Write a fresh card below!');
      }
    }

    document.documentElement.classList.remove('receiver-boot');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
