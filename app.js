/**
 * Unseal — Scratch-to-Reveal Secret Note & Confession Card Engine
 * Pure client-side URL encoding, tactile HTML5 Canvas scratch foil,
 * paper confetti reveal, viral share triggers, and Story Card PNG export.
 */

(function () {
  'use strict';

  const DEFAULT_MOOD = '💌 Crush Confession';
  const REVEAL_THRESHOLD_PCT = 45;
  const BURN_DURATION_SEC = 60;
  const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  const KEY_STREAM_TAG = [85, 78, 83, 69, 65, 76, 50, 54]; // 'UNSEAL26'

  const SITUATION_PROFILES = {
    crush: {
      key: 'crush',
      label: 'Romantic Melody',
      badgePrompt: 'Tap for Romantic Reveal Music 🎵',
      readyPrompt: 'Romantic Reveal Music ON 🎵',
      toast: '🎵 Crush Romantic reveal music played!'
    },
    midnight: {
      key: 'midnight',
      label: 'Midnight Lo-Fi Chime',
      badgePrompt: 'Tap for Midnight Ambient Music 🌙',
      readyPrompt: 'Midnight Ambient Music ON 🌙',
      toast: '🌙 Midnight lo-fi reveal music played!'
    },
    joke: {
      key: 'joke',
      label: 'Playful Comedy SFX',
      badgePrompt: 'Tap for Playful Comedy SFX 🎭',
      readyPrompt: 'Playful Comedy SFX ON 🎭',
      toast: '🎭 Playful reveal SFX played!'
    },
    dare: {
      key: 'dare',
      label: 'Dare Drumroll & Fanfare',
      badgePrompt: 'Tap for Dare Drumroll Fanfare 🥁',
      readyPrompt: 'Dare Drumroll Fanfare ON 🥁',
      toast: '🥁 Dare drumroll & fanfare played!'
    },
    apology: {
      key: 'apology',
      label: 'Heartfelt Sorry Chime',
      badgePrompt: 'Tap for Heartfelt Sorry Chime 🥺',
      readyPrompt: 'Heartfelt Sorry Chime ON 🥺',
      toast: '🥺 Heartfelt sorry melody played!'
    },
    celebration: {
      key: 'celebration',
      label: 'Celebration Fanfare',
      badgePrompt: 'Tap for Birthday / Congrats Music 🥳',
      readyPrompt: 'Celebration Fanfare ON 🥳',
      toast: '🥳 Festive celebration music played!'
    }
  };

  const FOIL_THEMES = {
    silver: {
      stops: ['#CBD5E1', '#E2E8F0', '#94A3B8', '#F8FAFC', '#CBD5E1', '#94A3B8'],
      textPrimary: '#334155',
      textSub: '#475569',
      tag: '• 100% SILVER FOIL SEAL •',
      shareWord: 'silver-sealed',
      btnLabel: 'Seal with Silver Foil & Get Link',
      fallbackClass: 'foil-silver-fallback'
    },
    gold: {
      stops: ['#D4AF37', '#FDE68A', '#B7892B', '#FEF3C7', '#D4AF37', '#9E711C'],
      textPrimary: '#422006',
      textSub: '#713F12',
      tag: '• 100% GOLD FOIL SEAL •',
      shareWord: 'gold-sealed',
      btnLabel: 'Seal with Gold Foil & Get Link',
      fallbackClass: 'foil-gold-fallback'
    },
    rosegold: {
      stops: ['#F5D6CE', '#E8B4A8', '#D48C7B', '#F7E5E0', '#C27263'],
      textPrimary: '#4A251D',
      textSub: '#6E3A2F',
      tag: '• ROSE GOLD FOIL SEAL •',
      shareWord: 'rose-gold-sealed',
      btnLabel: 'Seal with Rose Gold Foil & Get Link',
      fallbackClass: 'foil-rosegold-fallback'
    },
    holo: {
      stops: ['#E0C3FC', '#8EC5FC', '#FBC2EB', '#A6C1EE', '#C2E9FB'],
      textPrimary: '#2E2447',
      textSub: '#4B3D70',
      tag: '• HOLOGRAPHIC FOIL SEAL •',
      shareWord: 'holographic-sealed',
      btnLabel: 'Seal with Holographic Foil & Get Link',
      fallbackClass: 'foil-holo-fallback'
    }
  };

  const FONT_STYLES = {
    hand: {
      className: 'font-style-hand',
      fontFamily: '"Caveat", "Kalam", cursive',
      fontStyle: 'normal',
      fontWeight: '600',
      canvasFont: '600 52px "Caveat", "Kalam", cursive'
    },
    hindi: {
      className: 'font-style-hindi',
      fontFamily: '"Kalam", "Noto Sans Devanagari", cursive',
      fontStyle: 'normal',
      fontWeight: '700',
      canvasFont: '700 46px "Kalam", "Noto Sans Devanagari", cursive'
    },
    shayari: {
      className: 'font-style-shayari',
      fontFamily: '"Playfair Display", "Yatra One", "Noto Sans Devanagari", Georgia, serif',
      fontStyle: 'italic',
      fontWeight: '600',
      canvasFont: 'italic 600 44px "Playfair Display", "Yatra One", "Noto Sans Devanagari", Georgia, serif'
    },
    bold: {
      className: 'font-style-bold',
      fontFamily: '"Rozha One", "Noto Sans Devanagari", Georgia, serif',
      fontStyle: 'normal',
      fontWeight: '400',
      canvasFont: '400 48px "Rozha One", "Noto Sans Devanagari", Georgia, serif'
    },
    mono: {
      className: 'font-style-mono',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontStyle: 'normal',
      fontWeight: '600',
      canvasFont: '600 36px "JetBrains Mono", ui-monospace, monospace'
    }
  };

  const CARD_FRAMES = {
    classic: { className: 'card-frame-classic', borderColor: '#E6E0D6', borderWidth: 4 },
    airmail: { className: 'card-frame-airmail', borderColor: '#D9383A', borderWidth: 6 },
    goldtrim: { className: 'card-frame-goldtrim', borderColor: '#D4AF37', borderWidth: 6 },
    roseglow: { className: 'card-frame-roseglow', borderColor: '#F4A8B4', borderWidth: 6 }
  };

  const QUICK_RANDOM_PROMPTS = [
    { mood: '💌 Crush Confession', text: 'Coffee ke bahane roz canteen aata hoon, asli reason sirf tumhari smile hai. ☕✨' },
    { mood: '💌 Crush Confession', text: 'तुम्हारे बिना कॉलेज की ये कैंटीन अधूरी लगती है ❤️☕' },
    { mood: '🌙 Midnight Thought', text: 'रात के 2 बजे भी बस तुम्हारा ही ख़याल आता है 🌙✨' },
    { mood: '🤫 Inside Joke', text: 'एक राज़ बताऊँ? जब तुम मुस्कुराते हो, मेरा पूरा दिन बन जाता है 😊✨' },
    { mood: '🎲 Wild Dare', text: 'Dare: Scratch rule—reply with a sealed card confessing one secret nobody in our group knows! 🎲🔥' },
    { mood: '🌙 Midnight Thought', text: 'No excuses, you crossed my mind twice today and I hope tonight feels gentle for you. ✨' }
  ];

  const PAPER_THEMES = {
    cream: { className: 'paper-theme-cream', bg: '#FAF6EE', border: '#E6E0D6', line: '#EBE4D8', dark: false },
    blush: { className: 'paper-theme-blush', bg: '#FFF1F2', border: '#FECDD3', line: '#FFE4E6', dark: false },
    midnight: { className: 'paper-theme-midnight', bg: '#1C1917', border: '#44403C', line: '#332E2A', dark: true },
    sage: { className: 'paper-theme-sage', bg: '#ECFDF5', border: '#A7F3D0', line: '#D1FAE5', dark: false },
    parchment: { className: 'paper-theme-parchment', bg: '#FEF3C7', border: '#FDE68A', line: '#FDE68A', dark: false }
  };

  const INK_COLORS = {
    espresso: { className: 'ink-color-espresso', lightHex: '#1C1917', darkHex: '#FAF6F0' },
    crimson: { className: 'ink-color-crimson', lightHex: '#B91C1C', darkHex: '#FCA5A5' },
    cobalt: { className: 'ink-color-cobalt', lightHex: '#1D4ED8', darkHex: '#93C5FD' },
    emerald: { className: 'ink-color-emerald', lightHex: '#047857', darkHex: '#6EE7B7' },
    plum: { className: 'ink-color-plum', lightHex: '#7E22CE', darkHex: '#D8B4FE' }
  };

  const WAX_EMBLEMS = {
    quill: {
      char: '♥',
      svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13"/></svg>'
    },
    heart: { char: '❤️' },
    butterfly: { char: '🦋' },
    moon: { char: '🌙' },
    fire: { char: '🔥' },
    crown: { char: '👑' }
  };

  const state = {
    view: 'write',
    isReceiverMode: false,
    mood: DEFAULT_MOOD,
    foil: 'silver', // 'silver' | 'gold' | 'rosegold' | 'holo'
    fontStyle: 'hand', // 'hand' | 'hindi' | 'shayari' | 'bold' | 'mono'
    paperTheme: 'cream', // 'cream' | 'blush' | 'midnight' | 'sage' | 'parchment'
    inkColor: 'espresso', // 'espresso' | 'crimson' | 'cobalt' | 'emerald' | 'plum'
    cardFrame: 'classic', // 'classic' | 'airmail' | 'goldtrim' | 'roseglow'
    emblem: 'quill', // 'quill' | 'heart' | 'butterfly' | 'moon' | 'fire' | 'crown'
    randomIdx: 0,
    lastReaction: '',
    burnEnabled: false,
    hasBurned: false,
    burnIntervalId: null,
    guessData: null,
    guessSolved: false,
    currentSituation: 'crush',
    lastRevealSituation: '',
    soundEnabled: false,
    userExplicitlyMuted: false,
    audioCtx: null,
    noiseBuffer: null,
    lastSoundTime: 0,
    lastHapticTime: 0,
    liveCount: 4842,
    cardId: generateCardId(),
    currentShareUrl: '',
    isDrawing: false,
    hasRevealed: false,
    lastPos: null,
    lastProgressCheck: 0,
    scratchPct: 0,
    toastTimer: null,
    html2CanvasPromise: null,
    scratchTool: 'coin',
    passcodeRequired: false,
    passcodeUnlocked: true,
    expectedPasscode: '',
    passcodeHint: '',
    chainDepth: 1,
    lastSparkTime: 0
  };

  let scratchCanvas = null;
  let scratchCtx = null;

  const $ = (id) => document.getElementById(id);

  // =========================================================================
  // 1. Ultra-Short U2 Binary + Devanagari 1-Byte + Sync LZ77 Codec (?seal=)
  // =========================================================================

  const U2_MOODS = ['💌 Crush Confession', '🌙 Midnight Thought', '🤫 Inside Joke', '🎲 Wild Dare'];
  const U2_FOILS = ['silver', 'gold', 'rosegold', 'holo'];
  const U2_FONTS = ['hand', 'hindi', 'shayari', 'bold', 'mono'];
  const U2_PAPERS = ['cream', 'blush', 'midnight', 'sage', 'parchment'];
  const U2_INKS = ['espresso', 'crimson', 'cobalt', 'emerald', 'plum'];
  const U2_FRAMES = ['classic', 'airmail', 'goldtrim', 'roseglow'];
  const U2_EMBLEMS = ['quill', 'heart', 'butterfly', 'moon', 'fire', 'crown'];
  const utf8Encoder = new TextEncoder();
  const utf8Decoder = new TextDecoder();

  function bytesToBase64Url(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(token) {
    let b64 = String(token || '')
      .trim()
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function xorTransform(inputBytes, salt0, salt1) {
    const out = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i++) {
      const k = KEY_STREAM_TAG[i % KEY_STREAM_TAG.length] ^ (i % 2 === 0 ? salt0 : salt1) ^ ((i * 13) & 0xff);
      out[i] = inputBytes[i] ^ k;
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

  // Pack ASCII + Devanagari (U+0900..U+097F) in 1 byte/char; escape other Unicode via 0x7F + UTF-8
  function writeCompactStr(arr, str) {
    const encoded = [];
    for (const ch of String(str || '')) {
      const cp = ch.codePointAt(0);
      if (cp < 0x7f) {
        encoded.push(cp);
      } else if (cp >= 0x0900 && cp <= 0x097f) {
        encoded.push(0x80 | (cp - 0x0900));
      } else {
        encoded.push(0x7f);
        if (cp === 0x7f) {
          encoded.push(0x7f);
        } else {
          const u8 = utf8Encoder.encode(ch);
          for (let j = 0; j < u8.length; j++) encoded.push(u8[j]);
        }
      }
    }
    writeVarint(arr, encoded.length);
    for (let i = 0; i < encoded.length; i++) arr.push(encoded[i]);
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
          for (let j = 1; j < seqLen; j++) {
            seq[j] = bytes[cursor.pos++];
          }
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
            while (len < maxLen && input[j + len] === input[i + len]) {
              len++;
            }
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
          if (dist > out.length) throw new Error('Invalid LZ77 backreference');
          for (let k = 0; k < matchLen; k++) {
            out.push(out[out.length - dist]);
          }
        } else {
          out.push(input[p++]);
        }
      }
    }
    return Uint8Array.from(out);
  }

  function encodeU2Binary(payload) {
    const arr = [];
    const recipient = (payload.r || '').trim();
    const clue = (payload.c || '').trim();
    const hasRecipient = Boolean(recipient && recipient !== 'Someone');
    const hasCustomClue = Boolean(clue && clue !== 'A quiet observer');
    const hasBurn = payload.b === 1;
    const hasGuess = Boolean(payload.g && Array.isArray(payload.g.options) && payload.g.options.length >= 2);
    const hasPw = Boolean(payload.pw && payload.pw.trim());
    const hasPwh = Boolean(hasPw && payload.pwh && payload.pwh.trim());
    const chainVal = typeof payload.ch === 'number' && payload.ch >= 2 ? Math.min(15, payload.ch) : 1;
    const stdIdMatch = /^UNS-(\d{4})$/.exec(String(payload.id || ''));

    const flags =
      (hasBurn ? 1 : 0) |
      (hasGuess ? 2 : 0) |
      (hasCustomClue ? 4 : 0) |
      (hasPw ? 8 : 0) |
      (hasPwh ? 16 : 0) |
      (chainVal > 1 ? 32 : 0) |
      (stdIdMatch ? 64 : 0) |
      (hasRecipient ? 128 : 0);

    const foilIdx = Math.max(0, U2_FOILS.indexOf(payload.f));
    const fontIdx = Math.max(0, U2_FONTS.indexOf(payload.fn || 'hand'));
    const paperIdx = Math.max(0, U2_PAPERS.indexOf(payload.tp || 'cream'));
    const inkIdx = Math.max(0, U2_INKS.indexOf(payload.ik || 'espresso'));
    const frameIdx = Math.max(0, U2_FRAMES.indexOf(payload.fr || 'classic'));
    const emblemIdx = Math.max(0, U2_EMBLEMS.indexOf(payload.em || 'quill'));
    const moodPos = U2_MOODS.indexOf(payload.m);
    const moodIdx = moodPos >= 0 ? moodPos : 15;

    arr.push(flags);
    arr.push((foilIdx & 3) | ((fontIdx & 7) << 2) | ((paperIdx & 7) << 5));
    arr.push((inkIdx & 7) | ((frameIdx & 3) << 3) | ((emblemIdx & 7) << 5));
    arr.push((moodIdx & 15) | ((chainVal & 15) << 4));

    if (stdIdMatch) {
      const cardNum = parseInt(stdIdMatch[1], 10);
      arr.push((cardNum >> 8) & 0xff, cardNum & 0xff);
    } else {
      writeCompactStr(arr, payload.id || generateCardId());
    }

    if (moodIdx === 15) writeCompactStr(arr, payload.m || DEFAULT_MOOD);
    if (hasRecipient) writeCompactStr(arr, recipient);
    writeCompactStr(arr, payload.s);
    if (hasCustomClue) writeCompactStr(arr, clue);

    if (hasGuess) {
      const opts = payload.g.options.slice(0, 4);
      const corr = Math.min(Math.max(0, payload.g.correct | 0), opts.length - 1);
      arr.push(((corr & 15) << 4) | (opts.length & 15));
      for (let i = 0; i < opts.length; i++) writeCompactStr(arr, opts[i]);
    }
    if (hasPw) writeCompactStr(arr, payload.pw.trim().slice(0, 20));
    if (hasPwh) writeCompactStr(arr, payload.pwh.trim().slice(0, 60));

    return Uint8Array.from(arr);
  }

  function decodeU2Binary(bytes) {
    if (bytes.length < 4) throw new Error('Short U2 payload');
    const cursor = { pos: 0 };
    const flags = bytes[cursor.pos++];
    const p1 = bytes[cursor.pos++];
    const p2 = bytes[cursor.pos++];
    const p3 = bytes[cursor.pos++];

    const hasBurn = (flags & 1) !== 0;
    const hasGuess = (flags & 2) !== 0;
    const hasCustomClue = (flags & 4) !== 0;
    const hasPw = (flags & 8) !== 0;
    const hasPwh = (flags & 16) !== 0;
    const hasChain = (flags & 32) !== 0;
    const isStdCardId = (flags & 64) !== 0;
    const hasRecipient = (flags & 128) !== 0;

    const foil = U2_FOILS[p1 & 3] || 'silver';
    const fontStyle = U2_FONTS[(p1 >> 2) & 7] || 'hand';
    const paperTheme = U2_PAPERS[(p1 >> 5) & 7] || 'cream';
    const inkColor = U2_INKS[p2 & 7] || 'espresso';
    const cardFrame = U2_FRAMES[(p2 >> 3) & 3] || 'classic';
    const emblem = U2_EMBLEMS[(p2 >> 5) & 7] || 'quill';
    const moodIdx = p3 & 15;
    const chainNibble = (p3 >> 4) & 15;

    let cardId = '';
    if (isStdCardId) {
      const hi = bytes[cursor.pos++];
      const lo = bytes[cursor.pos++];
      cardId = `UNS-${String((hi << 8) | lo).padStart(4, '0')}`;
    } else {
      cardId = readCompactStr(bytes, cursor);
    }

    const mood = moodIdx === 15 ? readCompactStr(bytes, cursor) : (U2_MOODS[moodIdx] || DEFAULT_MOOD);
    const recipient = hasRecipient ? readCompactStr(bytes, cursor) : 'Someone';
    const secret = readCompactStr(bytes, cursor);
    const clue = hasCustomClue ? readCompactStr(bytes, cursor) : 'A quiet observer';

    let guess = null;
    if (hasGuess) {
      const gHead = bytes[cursor.pos++];
      const corr = (gHead >> 4) & 15;
      const cnt = gHead & 15;
      const opts = [];
      for (let i = 0; i < cnt; i++) {
        const opt = readCompactStr(bytes, cursor).trim().slice(0, 40);
        if (opt) opts.push(opt);
      }
      if (opts.length >= 2) {
        guess = { correct: Math.min(corr, opts.length - 1), options: opts };
      }
    }

    const pw = hasPw ? readCompactStr(bytes, cursor) : '';
    const pwh = hasPwh ? readCompactStr(bytes, cursor) : '';

    return {
      r: recipient,
      m: mood,
      s: secret,
      c: clue,
      f: foil,
      fn: fontStyle,
      tp: paperTheme,
      ik: inkColor,
      fr: cardFrame,
      em: emblem,
      b: hasBurn ? 1 : 0,
      g: guess,
      pw,
      pwh,
      ch: hasChain ? Math.max(2, chainNibble) : 1,
      id: cardId
    };
  }

  function encodeSeal(payload) {
    const rawBin = encodeU2Binary(payload);
    const lzBin = rawBin.length >= 10 ? lz77Compress(rawBin) : rawBin;
    const useLz = lzBin.length < rawBin.length;
    const body = useLz ? lzBin : rawBin;

    const saltArr = new Uint8Array(1);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(saltArr);
    } else {
      saltArr[0] = Math.floor(Math.random() * 256);
    }
    const salt7 = saltArr[0] & 0x7f;
    const salt1 = (salt7 * 37 + 19) & 0xff;
    const cipher = xorTransform(body, salt7, salt1);

    const packet = new Uint8Array(3 + cipher.length);
    packet[0] = 0x55; // 'U'
    packet[1] = 0x32; // '2'
    packet[2] = (salt7 << 1) | (useLz ? 1 : 0);
    packet.set(cipher, 3);
    return bytesToBase64Url(packet);
  }

  function decodeSeal(token) {
    const raw = base64UrlToBytes(token);
    let data = null;

    if (raw.length > 4 && raw[0] === 0x55 && raw[1] === 0x32) {
      const meta = raw[2];
      const salt7 = (meta >> 1) & 0x7f;
      const useLz = (meta & 1) === 1;
      const salt1 = (salt7 * 37 + 19) & 0xff;
      let plain = xorTransform(raw.subarray(3), salt7, salt1);
      if (useLz) {
        plain = lz77Decompress(plain);
      }
      data = decodeU2Binary(plain);
    } else {
      // Legacy U1 XOR-JSON or plain UTF-8 base64url JSON fallback
      let jsonBytes = raw;
      if (raw.length > 4 && raw[0] === 0x55 && raw[1] === 0x31) {
        const cipher = raw.subarray(4);
        jsonBytes = xorTransform(cipher, raw[2], raw[3]);
      }
      const jsonStr = utf8Decoder.decode(jsonBytes);
      data = JSON.parse(jsonStr);
    }

    if (!data || typeof data.s !== 'string' || !data.s.trim()) {
      throw new Error('Missing secret note payload');
    }

    const validFoil = FOIL_THEMES[data.f] ? data.f : 'silver';
    let guess = null;
    if (
      data.g &&
      Array.isArray(data.g.options) &&
      data.g.options.length >= 2 &&
      typeof data.g.correct === 'number' &&
      data.g.correct >= 0 &&
      data.g.correct < data.g.options.length
    ) {
      const cleanOpts = data.g.options
        .map((opt) => (typeof opt === 'string' ? opt.trim().slice(0, 40) : ''))
        .filter(Boolean);
      if (cleanOpts.length >= 2) {
        guess = {
          correct: Math.min(data.g.correct, cleanOpts.length - 1),
          options: cleanOpts.slice(0, 4)
        };
      }
    }

    return {
      r: typeof data.r === 'string' && data.r.trim() ? data.r.trim().slice(0, 60) : 'You',
      m: typeof data.m === 'string' && data.m.trim() ? data.m.trim().slice(0, 48) : DEFAULT_MOOD,
      s: data.s.trim().slice(0, 500),
      c: typeof data.c === 'string' && data.c.trim() ? data.c.trim().slice(0, 140) : 'A quiet observer',
      f: validFoil,
      fn: FONT_STYLES[data.fn] ? data.fn : 'hand',
      tp: PAPER_THEMES[data.tp] ? data.tp : 'cream',
      ik: INK_COLORS[data.ik] ? data.ik : 'espresso',
      fr: CARD_FRAMES[data.fr] ? data.fr : 'classic',
      em: WAX_EMBLEMS[data.em] ? data.em : 'quill',
      b: data.b === 1 ? 1 : 0,
      g: guess,
      pw: typeof data.pw === 'string' ? data.pw.trim().slice(0, 20) : '',
      pwh: typeof data.pwh === 'string' ? data.pwh.trim().slice(0, 60) : '',
      ch: typeof data.ch === 'number' && data.ch >= 2 ? Math.min(15, Math.floor(data.ch)) : 1,
      id: typeof data.id === 'string' && data.id.trim() ? data.id.trim().slice(0, 16) : generateCardId()
    };
  }

  function generateCardId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `UNS-${num}`;
  }

  function getShareBaseUrl() {
    if (window.location.protocol === 'file:') {
      return 'https://unseal.cards/';
    }
    return `${window.location.origin}${window.location.pathname}`;
  }

  function getFormPayload() {
    const recipient = ($('recipientInput')?.value || '').trim() || 'Someone';
    const secret = ($('secretTextarea')?.value || '').trim();
    const clue = ($('clueInput')?.value || '').trim() || 'A quiet observer';
    const burnChecked = Boolean($('burnTimerToggle')?.checked);
    const pw = ($('passcodeInput')?.value || '').trim().slice(0, 20);
    const pwh = ($('passcodeHintInput')?.value || '').trim().slice(0, 60);

    const correctOpt = ($('guessCorrectInput')?.value || '').trim().slice(0, 40);
    const decoy1 = ($('guessDecoy1Input')?.value || '').trim().slice(0, 40);
    const decoy2 = ($('guessDecoy2Input')?.value || '').trim().slice(0, 40);

    const payload = {
      r: recipient.slice(0, 60),
      m: state.mood,
      s: secret.slice(0, 500),
      c: clue.slice(0, 140),
      f: FOIL_THEMES[state.foil] ? state.foil : 'silver',
      id: state.cardId
    };

    if (burnChecked) {
      payload.b = 1;
    }
    if (pw) {
      payload.pw = pw;
      if (pwh) payload.pwh = pwh;
    }
    if (state.chainDepth && state.chainDepth >= 2) {
      payload.ch = Math.min(15, state.chainDepth);
    }

    if (state.fontStyle !== 'hand') payload.fn = state.fontStyle;
    if (state.paperTheme !== 'cream') payload.tp = state.paperTheme;
    if (state.inkColor !== 'espresso') payload.ik = state.inkColor;
    if (state.cardFrame !== 'classic') payload.fr = state.cardFrame;
    if (state.emblem !== 'quill') payload.em = state.emblem;

    if (correctOpt) {
      const decoys = [decoy1, decoy2].filter((d) => d && d.toLowerCase() !== correctOpt.toLowerCase());
      if (decoys.length === 0) {
        decoys.push(correctOpt.toLowerCase() === 'a secret admirer' ? 'Mystery Friend' : 'A Secret Admirer');
      }
      payload.g = {
        correct: 0,
        options: [correctOpt, ...decoys]
      };
    }

    return payload;
  }

  function buildShareUrl(payload) {
    const sealToken = encodeSeal(payload);
    return `${getShareBaseUrl()}?seal=${sealToken}`;
  }

  // =========================================================================
  // 2. Live Preview & View Routing (Single-Focus Studio + Receiver Mode)
  // =========================================================================

  function applyVisualThemeToDom() {
    const fontCfg = FONT_STYLES[state.fontStyle] || FONT_STYLES.hand;
    const paperCfg = PAPER_THEMES[state.paperTheme] || PAPER_THEMES.cream;
    const inkCfg = INK_COLORS[state.inkColor] || INK_COLORS.espresso;
    const frameCfg = CARD_FRAMES[state.cardFrame] || CARD_FRAMES.classic;
    const emblemCfg = WAX_EMBLEMS[state.emblem] || WAX_EMBLEMS.quill;

    const textTargets = [$('secretTextarea'), $('revealedSecretText')].filter((el) => el && el.classList);
    const paperTargets = [document.querySelector('.notebook-box'), $('underneathSecretBox')].filter(
      (el) => el && el.classList
    );

    textTargets.forEach((el) => {
      Object.values(FONT_STYLES).forEach((f) => el.classList.remove(f.className));
      el.classList.add(fontCfg.className);
      Object.values(INK_COLORS).forEach((ik) => el.classList.remove(ik.className));
      el.classList.add(inkCfg.className);
    });

    paperTargets.forEach((box) => {
      Object.values(PAPER_THEMES).forEach((tp) => box.classList.remove(tp.className));
      box.classList.add(paperCfg.className);
    });

    const previewCard = $('viewPreview');
    if (previewCard && previewCard.classList) {
      Object.values(CARD_FRAMES).forEach((fr) => previewCard.classList.remove(fr.className));
      previewCard.classList.add(frameCfg.className);
    }

    const emblemEl = $('waxStampEmblem');
    if (emblemEl) {
      if (emblemCfg.svg) {
        emblemEl.innerHTML = emblemCfg.svg;
      } else {
        emblemEl.textContent = emblemCfg.char;
      }
    }
  }

  function syncAddonButtonsActiveState() {
    document.querySelectorAll('[data-font]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-font') === state.fontStyle);
    });
    document.querySelectorAll('[data-paper]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-paper') === state.paperTheme);
    });
    document.querySelectorAll('[data-ink]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-ink') === state.inkColor);
    });
    document.querySelectorAll('[data-frame]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-frame') === state.cardFrame);
    });
    document.querySelectorAll('[data-emblem]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-emblem') === state.emblem);
    });
  }

  function applyPasscodeGateUi() {
    const overlay = $('passcodeGateOverlay');
    const hintEl = $('passcodeGateHint');
    const errEl = $('passcodeGateError');
    const inputEl = $('unlockCodeInput');
    if (!overlay) return;

    const shouldLock = Boolean(state.isReceiverMode && state.passcodeRequired && !state.passcodeUnlocked);
    overlay.classList.toggle('hidden', !shouldLock);
    if (shouldLock) {
      if (hintEl) {
        hintEl.textContent = state.passcodeHint
          ? `Hint: ${state.passcodeHint}`
          : 'Enter the secret code from the sender';
      }
      if (errEl) errEl.classList.add('hidden');
      if (inputEl) inputEl.value = '';
    }
  }

  function attemptUnlockPasscode() {
    const inputEl = $('unlockCodeInput');
    const errEl = $('passcodeGateError');
    const inner = $('passcodeGateOverlay')?.querySelector('.passcode-gate-inner');
    const typed = (inputEl?.value || '').trim().toLowerCase();
    const expected = (state.expectedPasscode || '').trim().toLowerCase();

    if (typed && expected && typed === expected) {
      state.passcodeUnlocked = true;
      errEl?.classList.add('hidden');
      applyPasscodeGateUi();
      unlockSoundOnInteraction();
      if (state.soundEnabled) playGuessSfx(true);
      showToast('🔓 Passcode unlocked! Rub the foil to reveal the secret.');
      return true;
    }

    if (errEl) {
      errEl.textContent = 'Wrong code — check the hint & try again';
      errEl.classList.remove('hidden');
    }
    if (inner) {
      inner.style.transform = 'translateX(-5px)';
      setTimeout(() => {
        inner.style.transform = 'translateX(5px)';
      }, 75);
      setTimeout(() => {
        inner.style.transform = '';
      }, 160);
    }
    if (state.soundEnabled) playGuessSfx(false);
    inputEl?.focus();
    return false;
  }

  function syncChainBadgesUi() {
    const streak = state.chainDepth || 1;
    const composerBanner = $('chainComposerBanner');
    const composerBadge = $('chainComposerBadge');
    const receiverBadge = $('chainStreakBadge');

    if (composerBanner && composerBadge) {
      const showComposerChain = !state.isReceiverMode && streak >= 2;
      composerBanner.classList.toggle('hidden', !showComposerChain);
      if (showComposerChain) {
        composerBadge.textContent = `🔗 Reply Chain #${streak}`;
      }
    }

    if (receiverBadge) {
      const showCardChain = streak >= 2;
      receiverBadge.classList.toggle('hidden', !showCardChain);
      if (showCardChain) {
        receiverBadge.textContent = `🔗 Chain #${streak}`;
      }
    }
  }

  function syncPreviewFromInputs(regenerateUrl) {
    const recipientRaw = ($('recipientInput')?.value || '').trim();
    const secretRaw = ($('secretTextarea')?.value || '').trim();
    const clueRaw = ($('clueInput')?.value || '').trim();

    const headingEl = $('postcardHeading');
    const secretEl = $('revealedSecretText');
    const clueEl = $('revealedClueText');
    const moodEl = $('revealedMoodTag');
    const charCountEl = $('secretCharCount');
    const rawSecretLen = ($('secretTextarea')?.value || '').length;

    if (headingEl) {
      headingEl.textContent = recipientRaw
        ? `For ${recipientRaw}, someone left you a sealed note.`
        : 'For Someone Special, someone left you a sealed note.';
    }
    if (secretEl) {
      secretEl.textContent = secretRaw || 'Your handwritten secret note will appear here once you write it in Step 1...';
    }
    if (clueEl) {
      clueEl.textContent = clueRaw ? `"${clueRaw}"` : '"A quiet observer"';
    }
    if (moodEl) moodEl.textContent = state.mood;
    if (charCountEl) charCountEl.textContent = `${rawSecretLen}/320`;

    const payload = getFormPayload();
    state.burnEnabled = payload.b === 1;
    state.guessData = payload.g || null;
    if (!state.isReceiverMode) {
      state.passcodeRequired = false;
      state.passcodeUnlocked = true;
      applyPasscodeGateUi();
    }

    applyVisualThemeToDom();
    syncMoodAudioUi();
    syncChainBadgesUi();

    const urlPreview = $('previewUrlText');
    if (!secretRaw) {
      state.currentShareUrl = '';
      if (urlPreview) urlPreview.textContent = 'Write your secret note above to generate link...';
    } else if (regenerateUrl !== false) {
      state.currentShareUrl = buildShareUrl(payload);
      if (urlPreview) urlPreview.textContent = state.currentShareUrl;
    }

    const cardIdEl = $('shareCardId');
    if (cardIdEl) {
      const tokenPart = state.currentShareUrl ? state.currentShareUrl.split('?seal=')[1] || '' : '';
      cardIdEl.textContent = tokenPart
        ? `Card #${state.cardId} • Short Link (${tokenPart.length} ch)`
        : `Card #${state.cardId}`;
    }
  }

  function applyReceiverPayload(data) {
    state.isReceiverMode = true;
    state.mood = data.m;
    state.foil = FOIL_THEMES[data.f] ? data.f : 'silver';
    state.fontStyle = FONT_STYLES[data.fn] ? data.fn : 'hand';
    state.paperTheme = PAPER_THEMES[data.tp] ? data.tp : 'cream';
    state.inkColor = INK_COLORS[data.ik] ? data.ik : 'espresso';
    state.cardFrame = CARD_FRAMES[data.fr] ? data.fr : 'classic';
    state.emblem = WAX_EMBLEMS[data.em] ? data.em : 'quill';
    state.burnEnabled = data.b === 1;
    state.guessData = data.g || null;
    state.passcodeRequired = Boolean(data.pw);
    state.passcodeUnlocked = !data.pw;
    state.expectedPasscode = data.pw || '';
    state.passcodeHint = data.pwh || '';
    state.chainDepth = typeof data.ch === 'number' && data.ch >= 2 ? data.ch : 1;
    state.cardId = data.id;
    state.currentShareUrl = window.location.href;
    document.body?.classList?.add('is-receiver-mode');

    const headingEl = $('postcardHeading');
    const secretEl = $('revealedSecretText');
    const clueEl = $('revealedClueText');
    const moodEl = $('revealedMoodTag');

    if (headingEl) headingEl.textContent = `For ${data.r}, someone left you a sealed note.`;
    if (secretEl) secretEl.textContent = data.s;
    if (clueEl) clueEl.textContent = `"${data.c}"`;
    if (moodEl) moodEl.textContent = data.m;

    // Update page SEO/Social title dynamically without exposing secret message
    const dynamicTitle = `For ${data.r} — Scratch to Unseal Your Secret Note | Unseal`;
    const dynamicDesc = `Someone sealed a secret note for ${data.r}. Rub the metallic foil on your phone to reveal it.`;
    document.title = dynamicTitle;
    updateMetaTag('meta[name="description"]', dynamicDesc);
    updateMetaTag('meta[property="og:title"]', dynamicTitle);
    updateMetaTag('meta[property="og:description"]', dynamicDesc);
    updateMetaTag('meta[name="twitter:title"]', dynamicTitle);
    updateMetaTag('meta[name="robots"]', 'noindex, nofollow');

    // Hide creator form & switcher tabs when opened via ?seal=
    $('viewSwitcher')?.classList.add('hidden');
    $('viewWrite')?.classList.add('hidden');
    $('viewPreview')?.classList.remove('hidden');
    $('previewShareBackRow')?.classList.remove('hidden');
    $('waxStampBadge')?.classList.remove('is-stamped');
    $('reactionBar')?.classList.add('hidden');
    state.view = 'preview';

    applyVisualThemeToDom();
    syncMoodAudioUi();
    syncChainBadgesUi();
    resetBurnUi();
    renderGuessGame(state.guessData);
    applyPasscodeGateUi();

    // Paint foil synchronously before making underneath note visible (zero spoiler flash)
    initScratchCanvas(true);
    preloadHtml2CanvasIdle();
  }

  function updateMetaTag(selector, value) {
    let el = document.querySelector(selector);
    if (!el && selector === 'meta[name="robots"]') {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    if (el) el.setAttribute('content', value);
  }

  function switchView(viewName) {
    const tabWriteBtn = $('tabWriteBtn');
    const tabPreviewBtn = $('tabPreviewBtn');
    const viewWrite = $('viewWrite');
    const viewPreview = $('viewPreview');

    state.view = viewName;

    if (viewName === 'write') {
      clearBurnTimer();
      tabWriteBtn?.classList.add('active');
      tabWriteBtn?.setAttribute('aria-selected', 'true');
      tabPreviewBtn?.classList.remove('active');
      tabPreviewBtn?.setAttribute('aria-selected', 'false');
      viewWrite?.classList.remove('hidden');
      viewPreview?.classList.add('hidden');
    } else {
      syncPreviewFromInputs(true);
      tabWriteBtn?.classList.remove('active');
      tabWriteBtn?.setAttribute('aria-selected', 'false');
      tabPreviewBtn?.classList.add('active');
      tabPreviewBtn?.setAttribute('aria-selected', 'true');
      viewWrite?.classList.add('hidden');
      viewPreview?.classList.remove('hidden');
      $('previewShareBackRow')?.classList.remove('hidden');
      $('waxStampBadge')?.classList.remove('is-stamped');
      $('reactionBar')?.classList.add('hidden');
      applyPasscodeGateUi();
      resetBurnUi();
      renderGuessGame(state.guessData);
      initScratchCanvas(true);
      preloadHtml2CanvasIdle();
    }
  }

  function enterCreatorFromReceiver() {
    clearBurnTimer();
    resetBurnUi();
    const prevChain = state.chainDepth || 1;
    state.chainDepth = Math.min(15, prevChain + 1);
    state.isReceiverMode = false;
    state.passcodeRequired = false;
    state.passcodeUnlocked = true;
    state.expectedPasscode = '';
    state.passcodeHint = '';
    state.fontStyle = 'hand';
    state.paperTheme = 'cream';
    state.inkColor = 'espresso';
    state.cardFrame = 'classic';
    state.emblem = 'quill';
    state.lastReaction = '';
    state.cardId = generateCardId();
    document.documentElement.classList.remove('receiver-boot');
    document.body?.classList?.remove('is-receiver-mode');

    // Clean ?seal= or ?s= from URL without reloading
    if (
      window.history &&
      window.history.replaceState &&
      (window.location.search.includes('seal=') || window.location.search.includes('s='))
    ) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Restore indexable title & clear recipient's incoming text for a fresh reply
    document.title = 'Unseal — Free Scratch-to-Reveal Secret Note & Confession Card Maker';
    updateMetaTag('meta[name="robots"]', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    const recipientInput = $('recipientInput');
    const secretTextarea = $('secretTextarea');
    const clueInput = $('clueInput');
    if (recipientInput) recipientInput.value = '';
    if (secretTextarea) secretTextarea.value = '';
    if (clueInput) clueInput.value = '';
    if ($('guessCorrectInput')) $('guessCorrectInput').value = '';
    if ($('guessDecoy1Input')) $('guessDecoy1Input').value = '';
    if ($('guessDecoy2Input')) $('guessDecoy2Input').value = '';
    if ($('passcodeInput')) $('passcodeInput').value = '';
    if ($('passcodeHintInput')) $('passcodeHintInput').value = '';
    if ($('unlockCodeInput')) $('unlockCodeInput').value = '';
    if ($('burnTimerToggle')) $('burnTimerToggle').checked = false;
    $('reactionWhatsAppBtn')?.classList.add('hidden');
    document.querySelectorAll('.reaction-btn.reacted').forEach((b) => b.classList.remove('reacted'));

    applyPasscodeGateUi();
    $('viewSwitcher')?.classList.remove('hidden');
    $('waxStampBadge')?.classList.remove('is-stamped');
    syncAddonButtonsActiveState();
    syncChainBadgesUi();
    syncPreviewFromInputs(true);
    switchView('write');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => recipientInput?.focus(), 350);
  }

  // =========================================================================
  // 3. HTML5 Canvas Brushed Metallic Scratch Foil (Silver, Gold, Rose Gold, Holo)
  // =========================================================================

  function initScratchCanvas(resetReveal) {
    scratchCanvas = $('scratchCanvas');
    if (!scratchCanvas) return;

    const underneath = $('underneathSecretBox');
    if (underneath) {
      underneath.style.visibility = 'hidden';
    }

    // Match fixed 300x190 mobile or 380x228 desktop container at 2x HiDPI => sharp text & 0 CLS
    const isDesk = (window.innerWidth || 0) >= 960;
    const cssW = isDesk ? 380 : 300;
    const cssH = isDesk ? 228 : 190;
    const dpr = 2;
    scratchCanvas.width = cssW * dpr;
    scratchCanvas.height = cssH * dpr;

    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
    if (!scratchCtx) return;

    if (resetReveal) {
      state.hasRevealed = false;
      state.scratchPct = 0;
      state.isDrawing = false;
      state.lastPos = null;
      scratchCanvas.classList.remove('foil-faded');
      scratchCanvas.style.opacity = '1';
      scratchCanvas.style.pointerEvents = 'auto';
      $('revealedSecretText')?.classList.remove('note-pop');
      $('reactionBar')?.classList.add('hidden');
      $('reactionWhatsAppBtn')?.classList.add('hidden');
      document.querySelectorAll('.reaction-btn.reacted').forEach((b) => b.classList.remove('reacted'));
      updateScratchProgressUi(0, false);
    }

    const theme = FOIL_THEMES[state.foil] || FOIL_THEMES.silver;
    Object.values(FOIL_THEMES).forEach((t) => scratchCanvas.classList.remove(t.fallbackClass));
    scratchCanvas.classList.add(theme.fallbackClass);

    const w = scratchCanvas.width;
    const h = scratchCanvas.height;

    scratchCtx.save();
    scratchCtx.globalCompositeOperation = 'source-over';

    // Base diagonal metallic / holographic sheen
    const grad = state.foil === 'holo'
      ? scratchCtx.createLinearGradient(0, h * 0.15, w, h * 0.85)
      : scratchCtx.createLinearGradient(0, 0, w, h);

    theme.stops.forEach((hex, idx) => {
      grad.addColorStop(idx / (theme.stops.length - 1), hex);
    });
    scratchCtx.fillStyle = grad;
    scratchCtx.fillRect(0, 0, w, h);

    // Extra iridescent prismatic shimmer bands for Holographic foil
    if (state.foil === 'holo') {
      const prism = scratchCtx.createLinearGradient(w, 0, 0, h);
      prism.addColorStop(0.0, 'rgba(255, 255, 255, 0.28)');
      prism.addColorStop(0.35, 'rgba(251, 194, 235, 0.22)');
      prism.addColorStop(0.65, 'rgba(142, 197, 252, 0.26)');
      prism.addColorStop(1.0, 'rgba(255, 255, 255, 0.22)');
      scratchCtx.fillStyle = prism;
      scratchCtx.fillRect(0, 0, w, h);
    }

    // Horizontal brushed metal grain striations
    for (let y = 0; y < h; y += 3) {
      const alpha = (Math.random() * 0.14).toFixed(3);
      scratchCtx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(30,41,59,${Number(alpha) * 0.45})`;
      scratchCtx.fillRect(0, y, w, 1.5);
    }

    // Micro metallic sparkle flecks
    scratchCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    for (let i = 0; i < 1800; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      scratchCtx.fillRect(rx, ry, Math.random() * 3 + 1, 1.5);
    }

    // Crisp foil border
    scratchCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    scratchCtx.lineWidth = 6;
    scratchCtx.strokeRect(12, 12, w - 24, h - 24);

    // Foil seal typography
    scratchCtx.textAlign = 'center';
    scratchCtx.textBaseline = 'middle';
    scratchCtx.fillStyle = theme.textPrimary;
    scratchCtx.font = 'italic 600 26px "Playfair Display", Georgia, serif';
    scratchCtx.fillText('Rub gently with your finger to unseal', w / 2, h / 2 - 16);

    scratchCtx.font = '600 20px "DM Sans", sans-serif';
    scratchCtx.fillStyle = theme.textSub;
    scratchCtx.fillText(theme.tag, w / 2, h / 2 + 24);

    scratchCtx.restore();

    // Now that opaque foil covers the canvas, reveal underlying DOM text safely
    if (underneath) {
      underneath.style.visibility = 'visible';
    }
  }

  function bindScratchEvents() {
    const canvas = $('scratchCanvas');
    if (!canvas) return;

    const getPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height
      };
    };

    const SCRATCH_TOOL_BRUSH = {
      coin: { width: 50, grit: 3, sparks: 2 },
      key: { width: 36, grit: 2, sparks: 1 },
      wand: { width: 66, grit: 5, sparks: 5 }
    };

    const SPARK_PALETTES = {
      silver: ['#FFFFFF', '#E2E8F0', '#CBD5E1', '#FDE68A'],
      gold: ['#FEF08A', '#FBBF24', '#F59E0B', '#FFFFFF'],
      rosegold: ['#FECDD3', '#F4A8B4', '#E8B4A8', '#FFF1F2'],
      holo: ['#C084FC', '#38BDF8', '#F472B6', '#FDE047']
    };

    const spawnScratchSparks = (pos) => {
      const sparksLayer = $('scratchSparksLayer');
      if (!sparksLayer) return;
      const tNow = performance.now();
      if (tNow - state.lastSparkTime < 34) return;
      state.lastSparkTime = tNow;

      const toolCfg = SCRATCH_TOOL_BRUSH[state.scratchTool] || SCRATCH_TOOL_BRUSH.coin;
      const colors = SPARK_PALETTES[state.foil] || SPARK_PALETTES.silver;
      const boxW = parseFloat(canvas.dataset.logicalW || '340') || 340;
      const boxH = parseFloat(canvas.dataset.logicalH || '204') || 204;
      const leftPct = Math.max(2, Math.min(98, (pos.x / boxW) * 100));
      const topPct = Math.max(4, Math.min(96, (pos.y / boxH) * 100));

      while (sparksLayer.childElementCount > 24) {
        sparksLayer.firstElementChild?.remove();
      }

      for (let i = 0; i < toolCfg.sparks; i++) {
        const dot = document.createElement('span');
        dot.className = 'scratch-spark';
        const sx = Math.round((Math.random() - 0.5) * (state.scratchTool === 'wand' ? 56 : 36));
        const sy = Math.round((Math.random() - 0.65) * (state.scratchTool === 'wand' ? 52 : 34));
        dot.style.left = `${leftPct.toFixed(1)}%`;
        dot.style.top = `${topPct.toFixed(1)}%`;
        dot.style.background = colors[i % colors.length];
        dot.style.setProperty('--sx', `${sx}px`);
        dot.style.setProperty('--sy', `${sy}px`);
        sparksLayer.appendChild(dot);
        setTimeout(() => dot.remove(), 560);
      }
    };

    const drawStroke = (pos) => {
      if (!scratchCtx || state.hasRevealed || (state.passcodeRequired && !state.passcodeUnlocked)) return;
      const toolCfg = SCRATCH_TOOL_BRUSH[state.scratchTool] || SCRATCH_TOOL_BRUSH.coin;
      const brushW = toolCfg.width;
      const radius = brushW * 0.5;

      scratchCtx.save();
      scratchCtx.globalCompositeOperation = 'destination-out';
      scratchCtx.lineCap = 'round';
      scratchCtx.lineJoin = 'round';
      scratchCtx.lineWidth = brushW;
      scratchCtx.strokeStyle = 'rgba(0,0,0,1)';
      scratchCtx.fillStyle = 'rgba(0,0,0,1)';

      if (state.lastPos) {
        scratchCtx.beginPath();
        scratchCtx.moveTo(state.lastPos.x, state.lastPos.y);
        scratchCtx.lineTo(pos.x, pos.y);
        scratchCtx.stroke();
      } else {
        scratchCtx.beginPath();
        scratchCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        scratchCtx.fill();
      }

      // Subtle ragged edge grit along scratch rim
      for (let i = 0; i < toolCfg.grit; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = radius * 0.72 + Math.random() * 14;
        scratchCtx.beginPath();
        scratchCtx.arc(pos.x + Math.cos(angle) * dist, pos.y + Math.sin(angle) * dist, 3 + Math.random() * 4, 0, Math.PI * 2);
        scratchCtx.fill();
      }
      scratchCtx.restore();

      const dx = state.lastPos ? pos.x - state.lastPos.x : 0;
      const dy = state.lastPos ? pos.y - state.lastPos.y : 0;
      const moveDist = Math.hypot(dx, dy);

      state.lastPos = pos;
      spawnScratchSparks(pos);

      const now = performance.now();

      // 1. Micro-haptic friction pulse (throttled per ~50ms)
      if (now - state.lastHapticTime >= 50) {
        state.lastHapticTime = now;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(8);
          } catch (_) {
            // Ignore restricted environments
          }
        }
      }

      // 2. Web Audio API ASMR scratch modulation
      if (moveDist > 1.5 || now - state.lastSoundTime > 90) {
        playScratchAudio(Math.min(1, moveDist / 28));
      }

      if (now - state.lastProgressCheck > 85) {
        state.lastProgressCheck = now;
        evaluateScratchProgress();
      }
    };

    canvas.addEventListener('mousedown', (e) => {
      if (state.hasRevealed || (state.passcodeRequired && !state.passcodeUnlocked)) return;
      unlockSoundOnInteraction();
      state.isDrawing = true;
      state.lastPos = null;
      drawStroke(getPos(e.clientX, e.clientY));
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isDrawing || state.hasRevealed) return;
      drawStroke(getPos(e.clientX, e.clientY));
    });

    window.addEventListener('mouseup', () => {
      if (!state.isDrawing) return;
      state.isDrawing = false;
      state.lastPos = null;
      evaluateScratchProgress();
    });

    // Touch events with passive: false so mobile screens never scroll while scratching
    canvas.addEventListener(
      'touchstart',
      (e) => {
        if (state.hasRevealed || (state.passcodeRequired && !state.passcodeUnlocked)) return;
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        unlockSoundOnInteraction();
        state.isDrawing = true;
        state.lastPos = null;
        drawStroke(getPos(touch.clientX, touch.clientY));
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        if (!state.isDrawing || state.hasRevealed) return;
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        drawStroke(getPos(touch.clientX, touch.clientY));
      },
      { passive: false }
    );

    const endTouch = () => {
      if (!state.isDrawing) return;
      state.isDrawing = false;
      state.lastPos = null;
      evaluateScratchProgress();
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  function evaluateScratchProgress() {
    if (!scratchCanvas || !scratchCtx || state.hasRevealed) return;

    const w = scratchCanvas.width;
    const h = scratchCanvas.height;
    const imgData = scratchCtx.getImageData(0, 0, w, h).data;

    let sampled = 0;
    let cleared = 0;
    const stride = 8; // Sample every 8th pixel for <0.3ms check at 60fps

    for (let y = 0; y < h; y += stride) {
      const rowOffset = y * w;
      for (let x = 0; x < w; x += stride) {
        const alphaIdx = (rowOffset + x) * 4 + 3;
        sampled++;
        if (imgData[alphaIdx] < 128) {
          cleared++;
        }
      }
    }

    const pct = sampled > 0 ? Math.min(100, Math.round((cleared / sampled) * 100)) : 0;
    state.scratchPct = pct;
    updateScratchProgressUi(pct, pct >= REVEAL_THRESHOLD_PCT);

    if (pct >= REVEAL_THRESHOLD_PCT) {
      completeReveal();
    }
  }

  function updateScratchProgressUi(pct, isDone) {
    const pill = $('scratchProgressPill');
    const quickBtn = $('quickRevealBtn');
    if (pill) {
      if (isDone) {
        pill.textContent = '✨ 100% Unsealed';
        pill.classList.add('done');
      } else if (pct > 0) {
        pill.textContent = `Scratched ${pct}% • Keep rubbing`;
        pill.classList.remove('done');
      } else {
        pill.textContent = `Scratch ${REVEAL_THRESHOLD_PCT}% to unseal`;
        pill.classList.remove('done');
      }
    }
    if (quickBtn) {
      quickBtn.classList.toggle('hidden', isDone);
    }
  }

  function completeReveal(manualQuickReveal) {
    if (state.hasRevealed) return;
    state.hasRevealed = true;
    state.isDrawing = false;
    state.scratchPct = 100;

    if (scratchCanvas) {
      scratchCanvas.classList.add('foil-faded');
      scratchCanvas.style.opacity = '0';
      scratchCanvas.style.pointerEvents = 'none';
    }

    $('revealedSecretText')?.classList.add('note-pop');
    $('reactionBar')?.classList.remove('hidden');
    const stampBadge = $('waxStampBadge');
    if (stampBadge) {
      stampBadge.classList.remove('is-stamped');
      void stampBadge.offsetWidth;
      stampBadge.classList.add('is-stamped');
    }
    updateScratchProgressUi(100, true);
    launchPaperConfetti();
    playUnsealChime();
    bumpLiveCounter(1);

    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 120]);
      } catch (_) {
        // Ignore restricted environments
      }
    }

    if (state.burnEnabled) {
      startBurnCountdown(BURN_DURATION_SEC);
    }

    showToast(
      manualQuickReveal
        ? '✨ Unsealed! Save your Story Card or seal one back.'
        : '🎉 Unsealed! Your secret note is revealed.'
    );
  }

  // =========================================================================
  // 3B. Web Audio API ASMR Scratch & Chime Synthesizer (Zero MP3 Dependency)
  // =========================================================================

  function ensureAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!state.audioCtx) {
      state.audioCtx = new AudioCtx();
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => { });
    }
    if (!state.noiseBuffer && state.audioCtx) {
      const sr = state.audioCtx.sampleRate;
      const length = Math.floor(sr * 1.2);
      const buffer = state.audioCtx.createBuffer(1, length, sr);
      const out = buffer.getChannelData(0);
      // Warm pink noise approximation for authentic tactile paper/foil friction
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
      }
      state.noiseBuffer = buffer;
    }
    return state.audioCtx;
  }

  function detectRevealSituation() {
    const m = (state.mood || '').toLowerCase();
    const bodyTxt = ($('revealedSecretText')?.textContent || $('secretTextarea')?.value || '').toLowerCase();
    const clueTxt = ($('revealedClueText')?.textContent || $('clueInput')?.value || '').toLowerCase();
    const combined = `${bodyTxt} ${clueTxt}`;

    let key = 'crush';
    if (/(sorry|maaf|galti|forgive|apolog|माफ़|गलती|🥺)/.test(combined)) {
      key = 'apology';
    } else if (/(birthday|bday|congrats|anniversary|janamdin|badhai|जन्मदिन|बधाई|🎂|🥳)/.test(combined)) {
      key = 'celebration';
    } else if (m.includes('midnight')) {
      key = 'midnight';
    } else if (m.includes('joke')) {
      key = 'joke';
    } else if (m.includes('dare')) {
      key = 'dare';
    } else if (m.includes('crush')) {
      key = 'crush';
    } else if (/(dare|challenge|हिम्मत|शर्त)/.test(combined)) {
      key = 'dare';
    } else if (/(haha|joke|meme|funny|🤣|😂)/.test(combined)) {
      key = 'joke';
    } else if (/(2 am|2am|midnight|night|रात|ख़याल|🌙)/.test(combined)) {
      key = 'midnight';
    }
    state.currentSituation = key;
    return key;
  }

  function syncMoodAudioUi() {
    const key = detectRevealSituation();
    const profile = SITUATION_PROFILES[key] || SITUATION_PROFILES.crush;
    const burnSuffix = state.burnEnabled ? ' + Burn 🔥' : '';

    const headerBtn = $('audioToggleBtn');
    if (headerBtn) {
      headerBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
      headerBtn.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
      headerBtn.classList.toggle('is-unmuted', state.soundEnabled);
    }

    const moodPill = $('moodAudioPillBtn');
    const moodText = $('moodAudioPillText');
    if (moodPill) {
      moodPill.setAttribute('data-situation', key);
      moodPill.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
      moodPill.classList.toggle('is-unmuted', state.soundEnabled);
    }
    if (moodText) {
      moodText.textContent = state.soundEnabled
        ? `🔊 ${profile.readyPrompt}${burnSuffix}`
        : `🔇 Sound Off — ${profile.badgePrompt}${burnSuffix}`;
    }
  }

  function setSoundEnabled(enabled, announce, fromToggle) {
    state.soundEnabled = Boolean(enabled);
    if (fromToggle) {
      state.userExplicitlyMuted = !state.soundEnabled;
    } else if (state.soundEnabled) {
      state.userExplicitlyMuted = false;
    }
    syncMoodAudioUi();
    if (state.soundEnabled) {
      ensureAudioContext();
      if (announce) {
        playScratchAudio(0.45);
        const profile = SITUATION_PROFILES[detectRevealSituation()] || SITUATION_PROFILES.crush;
        showToast(`🔊 Sound ON — ${profile.label} ready for reveal!`);
      }
    } else if (announce) {
      showToast('🔇 Sound effects muted');
    }
  }

  function unlockSoundOnInteraction() {
    if (!state.soundEnabled && !state.userExplicitlyMuted) {
      setSoundEnabled(true, false, false);
    } else if (state.soundEnabled) {
      ensureAudioContext();
    }
  }

  function playTone(ctx, { freq, endFreq, type = 'sine', start = ctx.currentTime, dur = 0.5, gainPeak = 0.06, filterFreq = 0 }) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq && endFreq > 0) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, start + Math.min(dur * 0.75, 0.22));
    }

    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gainPeak, start + Math.min(0.025, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    if (filterFreq > 0) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(filterFreq, start);
      osc.connect(lp);
      lp.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.04);
  }

  function playNoiseBurst(ctx, { start = ctx.currentTime, dur = 0.16, filterType = 'bandpass', freq = 1400, endFreq = 0, q = 1.2, gainPeak = 0.07, offset = 0 }) {
    if (!state.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = state.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, start);
    if (endFreq > 0) {
      filter.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
    }
    filter.Q.setValueAtTime(q, start);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gainPeak, start + Math.min(0.02, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start(start, offset, dur + 0.03);
  }

  function playScratchAudio(speedFactor) {
    if (!state.soundEnabled) return;
    const now = performance.now();
    if (now - state.lastSoundTime < 46) return;
    state.lastSoundTime = now;

    const ctx = ensureAudioContext();
    if (!ctx || !state.noiseBuffer) return;
    const offset = Math.random() * Math.max(0.1, state.noiseBuffer.duration - 0.12);
    playNoiseBurst(ctx, {
      start: ctx.currentTime,
      dur: 0.068,
      filterType: 'bandpass',
      freq: 1350 + speedFactor * 1150,
      q: 1.4,
      gainPeak: 0.06 + speedFactor * 0.08,
      offset
    });
  }

  function playUnsealChime() {
    const situation = detectRevealSituation();
    state.lastRevealSituation = situation;
    if (!state.soundEnabled) return;

    const ctx = ensureAudioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    // Soft paper & foil peel rustle shared across reveals
    playNoiseBurst(ctx, { start: t0, dur: 0.22, filterType: 'highpass', freq: 1850, q: 0.8, gainPeak: 0.075 });

    if (situation === 'crush') {
      // Romantic Fmaj9 warm harp & music-box arpeggio + gentle heart-flutter chord
      playTone(ctx, { freq: 174.61, type: 'sine', start: t0, dur: 1.9, gainPeak: 0.045 });
      const notes = [349.23, 440.0, 523.25, 659.25, 783.99, 880.0, 1046.5];
      notes.forEach((freq, idx) => {
        const s = t0 + idx * 0.082;
        playTone(ctx, { freq, type: idx % 2 === 0 ? 'sine' : 'triangle', start: s, dur: 1.15, gainPeak: 0.058 });
        playTone(ctx, { freq: freq * 2, type: 'sine', start: s + 0.015, dur: 0.45, gainPeak: 0.015 });
      });
    } else if (situation === 'midnight') {
      // Nocturnal Dmin9 dreamy lo-fi drone + crystalline raindrop chimes
      playTone(ctx, { freq: 146.83, type: 'triangle', start: t0, dur: 2.1, gainPeak: 0.042, filterFreq: 380 });
      playTone(ctx, { freq: 220.0, type: 'sine', start: t0 + 0.05, dur: 1.9, gainPeak: 0.032 });
      const notes = [293.66, 440.0, 523.25, 659.25, 880.0, 1046.5];
      notes.forEach((freq, idx) => {
        playTone(ctx, { freq, type: 'sine', start: t0 + idx * 0.115, dur: 1.45, gainPeak: 0.048 });
      });
    } else if (situation === 'joke') {
      // Playful cheeky bounce marimba riff + cartoon boing glide
      const riff = [
        { f: 392.0, d: 0.18, o: 0.02 },
        { f: 493.88, d: 0.18, o: 0.1 },
        { f: 587.33, d: 0.18, o: 0.18 },
        { f: 659.25, d: 0.22, o: 0.26 },
        { f: 783.99, d: 0.48, o: 0.36 }
      ];
      riff.forEach((n) => playTone(ctx, { freq: n.f, type: 'triangle', start: t0 + n.o, dur: n.d, gainPeak: 0.07 }));
      playTone(ctx, { freq: 270, endFreq: 640, type: 'sine', start: t0 + 0.4, dur: 0.22, gainPeak: 0.065 });
      playTone(ctx, { freq: 1046.5, type: 'sine', start: t0 + 0.46, dur: 0.42, gainPeak: 0.045 });
    } else if (situation === 'dare') {
      // Rapid accelerating snare brush drumroll -> triumphant brassy victory fanfare
      const drumOffsets = [0.0, 0.08, 0.15, 0.21, 0.26, 0.305, 0.345];
      drumOffsets.forEach((off, idx) => {
        playNoiseBurst(ctx, {
          start: t0 + off,
          dur: 0.05,
          filterType: 'bandpass',
          freq: 950 + idx * 240,
          q: 1.6,
          gainPeak: 0.04 + idx * 0.008
        });
      });
      const fanfare = [
        { f: 523.25, o: 0.40, d: 0.16 },
        { f: 523.25, o: 0.52, d: 0.16 },
        { f: 783.99, o: 0.64, d: 0.24 },
        { f: 1046.5, o: 0.80, d: 0.85 }
      ];
      fanfare.forEach((n) => {
        playTone(ctx, { freq: n.f, type: 'sawtooth', start: t0 + n.o, dur: n.d, gainPeak: 0.036, filterFreq: 1900 });
        playTone(ctx, { freq: n.f * 0.5, type: 'triangle', start: t0 + n.o, dur: n.d, gainPeak: 0.042 });
      });
    } else if (situation === 'apology') {
      // Soft bittersweet F#m -> D -> A -> E warm heartfelt piano/bell melody
      playTone(ctx, { freq: 185.0, type: 'sine', start: t0, dur: 2.0, gainPeak: 0.036 });
      const notes = [369.99, 440.0, 554.37, 493.88, 587.33, 659.25];
      notes.forEach((freq, idx) => {
        playTone(ctx, { freq, type: 'sine', start: t0 + idx * 0.125, dur: 1.35, gainPeak: 0.05 });
      });
    } else if (situation === 'celebration') {
      // Festive sparkling C-major upbeat celebration arpeggio + joyful shimmer chord
      const partyNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      partyNotes.forEach((freq, idx) => {
        const s = t0 + idx * 0.068;
        playTone(ctx, { freq, type: idx % 2 === 0 ? 'triangle' : 'sine', start: s, dur: 0.85, gainPeak: 0.062 });
      });
      playTone(ctx, { freq: 523.25, type: 'sine', start: t0 + 0.42, dur: 1.1, gainPeak: 0.045 });
      playTone(ctx, { freq: 1046.5, type: 'sine', start: t0 + 0.44, dur: 1.15, gainPeak: 0.04 });
    }

    // Extra situational spark if 60s Burn Self-Destruct mode is active
    if (state.burnEnabled) {
      playNoiseBurst(ctx, {
        start: t0 + 0.38,
        dur: 0.24,
        filterType: 'bandpass',
        freq: 3200,
        endFreq: 900,
        q: 2.2,
        gainPeak: 0.055
      });
    }
  }

  function playBurnTickSfx(isUrgent) {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(ctx, {
      freq: isUrgent ? 1180 : 880,
      type: 'triangle',
      start: t,
      dur: 0.035,
      gainPeak: isUrgent ? 0.032 : 0.016
    });
  }

  function playEvaporateSfx() {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    playNoiseBurst(ctx, {
      start: t,
      dur: 0.72,
      filterType: 'bandpass',
      freq: 1900,
      endFreq: 210,
      q: 1.5,
      gainPeak: 0.09
    });
    playTone(ctx, { freq: 392, endFreq: 146.83, type: 'sine', start: t + 0.05, dur: 0.55, gainPeak: 0.045 });
  }

  function playGuessSfx(isCorrect) {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    if (!isCorrect) {
      playTone(ctx, { freq: 246.94, endFreq: 164.81, type: 'sawtooth', start: t, dur: 0.24, gainPeak: 0.04, filterFreq: 750 });
      return;
    }
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, idx) => {
      playTone(ctx, { freq: f, type: 'triangle', start: t + idx * 0.065, dur: 0.45, gainPeak: 0.055 });
    });
  }

  // =========================================================================
  // 3C. Ephemeral 60s Burn Timer & Guess-the-Sender Mini-Game
  // =========================================================================

  function clearBurnTimer() {
    if (state.burnIntervalId) {
      clearInterval(state.burnIntervalId);
      state.burnIntervalId = null;
    }
  }

  function resetBurnUi() {
    clearBurnTimer();
    state.hasBurned = false;
    const badge = $('burnCountdownBadge');
    const secretEl = $('revealedSecretText');
    if (badge) {
      badge.classList.add('hidden');
      badge.classList.remove('evaporated');
      badge.textContent = '⏳ This note will self-destruct in 00:59...';
    }
    if (secretEl) {
      secretEl.classList.remove('secret-burning', 'secret-evaporated');
    }
  }

  function startBurnCountdown(seconds) {
    clearBurnTimer();
    state.hasBurned = false;
    let remaining = seconds;
    const badge = $('burnCountdownBadge');
    if (!badge) return;

    const renderTick = (sec) => {
      const mm = String(Math.floor(sec / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      badge.textContent = `⏳ This note will self-destruct in ${mm}:${ss}...`;
    };

    badge.classList.remove('hidden', 'evaporated');
    renderTick(remaining);

    state.burnIntervalId = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        renderTick(remaining);
        playBurnTickSfx(remaining <= 10);
        return;
      }

      clearBurnTimer();
      renderTick(0);
      evaporateSecretNote();
    }, 1000);
  }

  function evaporateSecretNote() {
    state.hasBurned = true;
    playEvaporateSfx();
    const badge = $('burnCountdownBadge');
    const secretEl = $('revealedSecretText');

    if (badge) {
      badge.classList.add('evaporated');
      badge.textContent = '💨 Ephemeral note burned';
    }

    if (secretEl) {
      secretEl.classList.add('secret-burning');
      setTimeout(() => {
        secretEl.textContent = '💨 This secret note has evaporated forever.';
        secretEl.classList.remove('secret-burning');
        secretEl.classList.add('secret-evaporated');
      }, 550);
    }

    showToast('💨 Time is up — this secret note has evaporated forever.');
  }

  function renderGuessGame(guessData) {
    const box = $('guessGameBox');
    const grid = $('guessOptionsGrid');
    const feedback = $('guessFeedback');
    state.guessSolved = false;

    if (!box || !grid || !feedback) return;
    grid.innerHTML = '';
    feedback.textContent = '';
    feedback.className = 'guess-feedback';

    if (!guessData || !Array.isArray(guessData.options) || guessData.options.length < 2) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');

    // Shuffle options cleanly on display so correct answer position varies
    const choices = guessData.options.map((text, idx) => ({
      text,
      isCorrect: idx === guessData.correct
    }));
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = choices[i];
      choices[i] = choices[j];
      choices[j] = tmp;
    }

    choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'guess-option-btn';
      btn.textContent = choice.text;
      btn.dataset.correct = choice.isCorrect ? '1' : '0';

      btn.addEventListener('click', () => {
        if (state.guessSolved) return;

        if (!choice.isCorrect) {
          btn.classList.add('guess-wrong');
          btn.classList.remove('guess-shake');
          void btn.offsetWidth;
          btn.classList.add('guess-shake');
          if (navigator.vibrate) {
            try {
              navigator.vibrate(25);
            } catch (_) { }
          }
          playGuessSfx(false);
          feedback.className = 'guess-feedback is-wrong';
          feedback.textContent = 'Wrong guess! 😜 Try another';
          return;
        }

        state.guessSolved = true;
        btn.classList.add('guess-correct');
        grid.querySelectorAll('.guess-option-btn').forEach((other) => {
          if (other !== btn) other.disabled = true;
        });
        feedback.className = 'guess-feedback is-correct';
        feedback.textContent = "Bingo! It's them! Tell them on WhatsApp ❤️";
        launchPaperConfetti();
        playGuessSfx(true);
      });

      grid.appendChild(btn);
    });
  }

  // =========================================================================
  // 3D. Dynamic Live Unsealed Counter
  // =========================================================================

  function updateLiveCounterUi() {
    const el = $('liveCounterCount');
    if (el) {
      el.textContent = state.liveCount.toLocaleString('en-US');
    }
  }

  function bumpLiveCounter(delta) {
    state.liveCount += delta;
    updateLiveCounterUi();
  }

  function initLiveCounter() {
    const hour = new Date().getHours();
    state.liveCount = 4800 + hour * 18 + Math.floor(Math.random() * 45);
    updateLiveCounterUi();

    const scheduleTick = () => {
      const delayMs = 45000 + Math.floor(Math.random() * 45000);
      setTimeout(() => {
        bumpLiveCounter(1 + Math.floor(Math.random() * 3));
        scheduleTick();
      }, delayMs);
    };
    scheduleTick();
  }

  // =========================================================================
  // 3E. Full-Screen Ambient Particles, 3D Card Tilt, Emoji Reactions & Fullscreen
  // =========================================================================

  function initAmbientParticles() {
    const canvas = $('ambientCanvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth || 1280;
      canvas.height = window.innerHeight || 720;
    };
    resize();
    window.addEventListener('resize', resize);

    const moodPalettes = {
      '💌 Crush Confession': ['rgba(217, 56, 58, 0.22)', 'rgba(244, 114, 182, 0.22)', 'rgba(212, 175, 55, 0.18)'],
      '🌙 Midnight Thought': ['rgba(167, 139, 250, 0.22)', 'rgba(142, 197, 252, 0.22)', 'rgba(212, 175, 55, 0.22)'],
      '🤫 Inside Joke': ['rgba(16, 185, 129, 0.20)', 'rgba(245, 158, 11, 0.20)', 'rgba(217, 56, 58, 0.16)'],
      '🎲 Wild Dare': ['rgba(239, 68, 68, 0.24)', 'rgba(245, 158, 11, 0.24)', 'rgba(139, 92, 246, 0.20)']
    };

    const count = (window.innerWidth || 0) >= 960 ? 28 : 14;
    const motes = Array.from({ length: count }, (_, idx) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2.2 + Math.random() * 4.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.18 - Math.random() * 0.32,
      idx,
      phase: Math.random() * Math.PI * 2
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colors = moodPalettes[state.mood] || moodPalettes['💌 Crush Confession'];
      for (const m of motes) {
        m.phase += 0.015;
        m.x += m.vx + Math.sin(m.phase) * 0.22;
        m.y += m.vy;
        if (m.y < -16) {
          m.y = canvas.height + 16;
          m.x = Math.random() * canvas.width;
        }
        if (m.x < -16) m.x = canvas.width + 16;
        if (m.x > canvas.width + 16) m.x = -16;

        ctx.fillStyle = colors[m.idx % colors.length];
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  function bind3DCardTilt() {
    const box = document.querySelector('.scratch-box');
    if (!box || typeof box.addEventListener !== 'function') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    box.addEventListener('mousemove', (e) => {
      if (state.isDrawing) {
        box.style.setProperty('--tilt-x', '0deg');
        box.style.setProperty('--tilt-y', '0deg');
        return;
      }
      const rect = box.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      box.style.setProperty('--tilt-x', `${(nx * 4.5).toFixed(2)}deg`);
      box.style.setProperty('--tilt-y', `${(-ny * 4.5).toFixed(2)}deg`);
    });

    const resetTilt = () => {
      box.style.setProperty('--tilt-x', '0deg');
      box.style.setProperty('--tilt-y', '0deg');
    };
    box.addEventListener('mouseleave', resetTilt);
    box.addEventListener('touchstart', resetTilt, { passive: true });
  }

  function playBubblePop() {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(760, t + 0.085);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  function spawnReactionShower(emoji) {
    const layer = $('reactionFloatLayer');
    if (!layer) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showToast(`${emoji} Reaction sent!`);
      return;
    }

    const total = 16;
    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.className = 'floating-reaction-emoji';
      span.textContent = emoji;
      const leftPct = 8 + Math.random() * 84;
      span.style.left = `${leftPct}vw`;
      span.style.animationDelay = `${Math.random() * 0.45}s`;
      span.style.setProperty('--float-dur', `${(2.0 + Math.random() * 1.1).toFixed(2)}s`);
      span.style.setProperty('--drift-mid', `${Math.round((Math.random() - 0.5) * 44)}px`);
      span.style.setProperty('--drift-end', `${Math.round((Math.random() - 0.5) * 90)}px`);
      layer.appendChild(span);
      setTimeout(() => span.remove(), 3400);
    }
  }

  function bindReactionBar() {
    const buttons = document.querySelectorAll('.reaction-btn');
    const waReplyBtn = $('reactionWhatsAppBtn');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-reaction') || '❤️‍🔥';
        buttons.forEach((b) => b.classList.remove('reacted'));
        btn.classList.add('reacted');
        state.lastReaction = emoji;

        spawnReactionShower(emoji);
        playBubblePop();
        if (navigator.vibrate) {
          try {
            navigator.vibrate(14);
          } catch (_) { }
        }

        if (waReplyBtn) {
          waReplyBtn.textContent = `💬 Send "${emoji}" reply on WhatsApp`;
          waReplyBtn.classList.remove('hidden');
        }
      });
    });

    waReplyBtn?.addEventListener('click', () => {
      const reaction = state.lastReaction || '❤️';
      const msg = `Just unsealed your secret note on Unseal! My reaction: ${reaction} 💌 Send another? ${getShareBaseUrl()}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    });
  }

  function bindFullscreenToggle() {
    const btn = $('fullscreenBtn');
    if (!btn) return;

    const updateUi = () => {
      const active = Boolean(document.fullscreenElement);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-fullscreen', active);
      btn.textContent = active ? '🗗' : '⛶';
    };

    btn.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          showToast('ℹ️ Press F11 in your browser for full-screen mode.');
        }
      } catch (_) {
        showToast('ℹ️ Browser blocked fullscreen request (try pressing F11).');
      }
      updateUi();
    });

    document.addEventListener('fullscreenchange', updateUi);
  }

  function launchPaperConfetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const existing = $('confettiCanvas');
    if (existing) existing.remove();

    const c = document.createElement('canvas');
    c.id = 'confettiCanvas';
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    document.body.appendChild(c);

    const ctx = c.getContext('2d');
    if (!ctx) {
      c.remove();
      return;
    }

    const palette = ['#D9383A', '#D4AF37', '#1C1917', '#E8998D', '#6B8F71', '#F3D5B5'];
    const cx = c.width / 2;
    const cy = Math.min(c.height * 0.42, 340);

    const particles = Array.from({ length: 58 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
      const speed = 4 + Math.random() * 8.5;
      return {
        x: cx + (Math.random() - 0.5) * 90,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        color: palette[Math.floor(Math.random() * palette.length)],
        opacity: 1
      };
    });

    let frame = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, c.width, c.height);

      let alive = 0;
      for (const p of particles) {
        p.vx *= 0.985;
        p.vy += 0.22; // gentle gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        if (frame > 55) p.opacity = Math.max(0, p.opacity - 0.025);

        if (p.opacity > 0.02 && p.y < c.height + 30) {
          alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (alive > 0 && frame < 140) {
        requestAnimationFrame(tick);
      } else {
        c.remove();
      }
    };

    requestAnimationFrame(tick);
  }

  // =========================================================================
  // 4. Viral Share Triggers (WhatsApp, Web Share API, Clipboard Copy)
  // =========================================================================

  function getActiveCardSummary() {
    if (state.isReceiverMode) {
      const heading = $('postcardHeading')?.textContent || '';
      const match = heading.match(/^For (.+?), someone/);
      return {
        recipient: match ? match[1] : 'Friend',
        foil: state.foil,
        url: state.currentShareUrl || window.location.href
      };
    }
    const payload = getFormPayload();
    const url = buildShareUrl(payload);
    state.currentShareUrl = url;
    const previewEl = $('previewUrlText');
    if (previewEl) previewEl.textContent = url;
    return {
      recipient: payload.r,
      foil: payload.f,
      url
    };
  }

  function requireCreatorSecret() {
    if (state.isReceiverMode) return true;
    const textarea = $('secretTextarea');
    const secretVal = (textarea?.value || '').trim();
    if (secretVal) return true;
    if ($('viewWrite')?.classList.contains('hidden')) {
      switchView('write');
    }
    showToast('✍️ Write your secret message first (or tap Random Idea / Hindi Quick Note)!');
    textarea?.focus();
    return false;
  }

  function generateConfessionLink() {
    if (!requireCreatorSecret()) return;

    state.cardId = generateCardId();
    syncPreviewFromInputs(true);

    const shareBox = $('shareBox');
    if (shareBox) {
      shareBox.classList.remove('highlight-flash');
      void shareBox.offsetWidth;
      shareBox.classList.add('highlight-flash');
      shareBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showToast('🎉 Secret foil link ready! Send it on WhatsApp or copy below.');
  }

  function buildShareTextAndUrl() {
    const { recipient, foil, url } = getActiveCardSummary();
    const foilWord = (FOIL_THEMES[foil] || FOIL_THEMES.silver).shareWord;
    return {
      recipient,
      url,
      text: `Hey ${recipient}! 💌 Someone sent you a ${foilWord} secret note. Rub the foil with your finger to unseal it: ${url}`,
      shortText: `Hey ${recipient}! 💌 Someone sealed a scratch-off secret note for you on Unseal. Rub to reveal it!`
    };
  }

  function shareWhatsApp() {
    if (!requireCreatorSecret()) return;
    const { text } = buildShareTextAndUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareTelegram() {
    if (!requireCreatorSecret()) return;
    const { shortText, url } = buildShareTextAndUrl();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shortText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function shareTwitter() {
    if (!requireCreatorSecret()) return;
    const { shortText, url } = buildShareTextAndUrl();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function shareFacebook() {
    if (!requireCreatorSecret()) return;
    const { url } = buildShareTextAndUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function shareNative() {
    if (!requireCreatorSecret()) return;
    const { recipient, shortText, url } = buildShareTextAndUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `For ${recipient} — Secret Note on Unseal`,
          text: shortText,
          url
        });
        showToast('💌 Shared your sealed note!');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    await copyTextToClipboard(url);
    showToast('📋 Link copied! Paste it in any chat or DM.');
  }

  async function copyLinkWithFeedback(buttonLabelEl, customToast) {
    if (!requireCreatorSecret()) return;
    const { url } = getActiveCardSummary();
    await copyTextToClipboard(url);

    if (buttonLabelEl) {
      const original = buttonLabelEl.textContent;
      buttonLabelEl.textContent = 'Copied! Paste into Story Sticker';
      setTimeout(() => {
        buttonLabelEl.textContent = original;
      }, 2400);
    }

    showToast(customToast || '📋 Secret link copied to clipboard!');
  }

  async function copyViralCaption() {
    if (!requireCreatorSecret()) return;
    const { recipient, url } = buildShareTextAndUrl();
    const foilWord = (FOIL_THEMES[state.foil] || FOIL_THEMES.silver).shareWord;
    const who = recipient && recipient !== 'Someone' ? recipient : 'you';
    const caption = `Someone sent ${who} a ${foilWord}-sealed secret note 💌✨ Scratch the foil before it disappears: ${url} #Unseal #SecretNote`;
    await copyTextToClipboard(caption);
    const labelEl = $('copyCaptionBtn')?.querySelector('span');
    if (labelEl) {
      const original = labelEl.textContent;
      labelEl.textContent = '✅ Viral Caption + Link Copied!';
      setTimeout(() => {
        labelEl.textContent = original;
      }, 2400);
    }
    showToast('💬 Viral Story / Status caption copied! Ready to paste on WhatsApp or IG.');
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {
        // Fall through to execCommand fallback
      }
    }

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (_) {
      // Ignore
    }
    ta.remove();
    return true;
  }

  // =========================================================================
  // 5. Story Card PNG Export (Lazy html2canvas + Offline Canvas Fallback)
  // =========================================================================

  function preloadHtml2CanvasIdle() {
    if (window.html2canvas || state.html2CanvasPromise) return;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => ensureHtml2Canvas().catch(() => { }), { timeout: 2500 });
    }
  }

  function ensureHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (state.html2CanvasPromise) return state.html2CanvasPromise;

    state.html2CanvasPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HTML2CANVAS_CDN;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.html2canvas) resolve(window.html2canvas);
        else reject(new Error('html2canvas missing after load'));
      };
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });

    return state.html2CanvasPromise;
  }

  async function downloadStoryCardPng() {
    if (!state.hasRevealed) {
      showToast('🪙 Scratch the foil (or tap Quick Reveal) first to unseal your Story Card!');
      return;
    }
    if (state.hasBurned) {
      showToast('💨 This ephemeral secret note has evaporated and cannot be exported.');
      return;
    }

    const btn = $('downloadStoryBtn');
    const btnLabel = $('downloadStoryBtnText');
    const originalText = btnLabel ? btnLabel.textContent : '';
    if (btn) btn.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Crafting Story PNG...';

    const recipientHeading = $('postcardHeading')?.textContent || 'For you, someone left a sealed note.';
    const secretText = $('revealedSecretText')?.textContent || '';
    const moodTag = $('revealedMoodTag')?.textContent || DEFAULT_MOOD;
    const clueText = $('revealedClueText')?.textContent || '"A quiet observer"';

    const fontCfg = FONT_STYLES[state.fontStyle] || FONT_STYLES.hand;
    const paperCfg = PAPER_THEMES[state.paperTheme] || PAPER_THEMES.cream;
    const inkCfg = INK_COLORS[state.inkColor] || INK_COLORS.espresso;
    const frameCfg = CARD_FRAMES[state.cardFrame] || CARD_FRAMES.classic;
    const emblemCfg = WAX_EMBLEMS[state.emblem] || WAX_EMBLEMS.quill;
    const resolvedInk = paperCfg.dark ? inkCfg.darkHex : inkCfg.lightHex;
    const noteBox = $('storyExportNoteBox');
    const storyCard = $('storyExportCard');

    if (storyCard && storyCard.classList) {
      Object.values(CARD_FRAMES).forEach((fr) => storyCard.classList.remove(fr.className));
      storyCard.classList.add(frameCfg.className);
    }

    // Populate off-screen 9:16 template
    if ($('storyExportHeading')) $('storyExportHeading').textContent = recipientHeading;
    if ($('storyExportEmblemBadge')) {
      const badgeEl = $('storyExportEmblemBadge');
      if (emblemCfg.svg) badgeEl.innerHTML = emblemCfg.svg;
      else badgeEl.textContent = emblemCfg.char;
    }
    if (noteBox) {
      noteBox.style.backgroundColor = paperCfg.bg;
      noteBox.style.borderColor = paperCfg.border;
      noteBox.style.backgroundImage = `repeating-linear-gradient(transparent, transparent 35px, ${paperCfg.line} 35px, ${paperCfg.line} 36px)`;
    }
    if ($('storyExportSecret')) {
      const secretEl = $('storyExportSecret');
      secretEl.textContent = secretText;
      secretEl.style.fontFamily = fontCfg.fontFamily;
      secretEl.style.fontStyle = fontCfg.fontStyle;
      secretEl.style.fontWeight = fontCfg.fontWeight;
      secretEl.style.color = resolvedInk;
    }
    if ($('storyExportMood')) $('storyExportMood').textContent = moodTag;
    if ($('storyExportClue')) {
      const clueEl = $('storyExportClue');
      clueEl.textContent = clueText;
      clueEl.style.color = paperCfg.dark && noteBox?.contains(clueEl) ? '#CBD5E1' : '#78716C';
    }
    if ($('storyExportCardId')) $('storyExportCardId').textContent = `Card #${state.cardId}`;

    const slug = recipientHeading
      .replace(/^For\s+/i, '')
      .split(',')[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'secret';

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const h2c = await ensureHtml2Canvas();
      const target = $('storyCardExportRoot');
      if (!target) throw new Error('Story export template missing');

      const renderedCanvas = await h2c(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF6F0',
        logging: false
      });

      triggerCanvasDownload(renderedCanvas, `unseal-story-${slug}.png`);
      showToast('📸 Story Card PNG saved! Ready for Instagram or WhatsApp Status.');
    } catch (_) {
      // Offline / CDN fallback using pure HTML5 Canvas so download always succeeds
      const fallback = renderFallbackStoryCanvas({
        heading: recipientHeading,
        secret: secretText,
        mood: moodTag,
        clue: clueText,
        cardId: state.cardId
      });
      triggerCanvasDownload(fallback, `unseal-story-${slug}.png`);
      showToast('📸 Story Card PNG saved!');
    } finally {
      if (btn) btn.disabled = false;
      if (btnLabel) btnLabel.textContent = originalText || 'Download Story Card (PNG)';
    }
  }

  function triggerCanvasDownload(canvasEl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvasEl.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function renderFallbackStoryCanvas({ heading, secret, mood, clue, cardId }) {
    const W = 1080;
    const H = 1920;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#FAF6F0';
    ctx.fillRect(0, 0, W, H);

    // Subtle linen dot grid
    ctx.fillStyle = '#E4DDD1';
    for (let x = 24; x < W; x += 36) {
      for (let y = 24; y < H; y += 36) {
        ctx.fillRect(x, y, 3, 3);
      }
    }

    // Main ivory card
    const fbFrame = CARD_FRAMES[state.cardFrame] || CARD_FRAMES.classic;
    roundRect(ctx, 84, 240, W - 168, 1320, 48, '#FFFFFF', fbFrame.borderColor, fbFrame.borderWidth);

    ctx.fillStyle = '#6B655E';
    ctx.font = '700 24px "DM Sans", sans-serif';
    ctx.fillText('UNSEALED CONFIDENTIAL POSTCARD', 148, 330);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'italic 700 50px "Playfair Display", Georgia, serif';
    wrapCanvasText(ctx, heading, 148, 415, W - 296, 62);

    const fbFont = FONT_STYLES[state.fontStyle] || FONT_STYLES.hand;
    const fbPaper = PAPER_THEMES[state.paperTheme] || PAPER_THEMES.cream;
    const fbInk = INK_COLORS[state.inkColor] || INK_COLORS.espresso;
    const fbInkHex = fbPaper.dark ? fbInk.darkHex : fbInk.lightHex;

    // Lined notebook area
    roundRect(ctx, 148, 560, W - 296, 640, 32, fbPaper.bg, fbPaper.border, 3);
    ctx.strokeStyle = fbPaper.line;
    ctx.lineWidth = 2;
    for (let ly = 640; ly < 1160; ly += 64) {
      ctx.beginPath();
      ctx.moveTo(188, ly);
      ctx.lineTo(W - 188, ly);
      ctx.stroke();
    }

    ctx.fillStyle = fbInkHex;
    ctx.font = fbFont.canvasFont;
    wrapCanvasText(ctx, secret, 192, 635, W - 384, 64);

    ctx.fillStyle = '#57534E';
    ctx.font = '600 28px "DM Sans", sans-serif';
    ctx.fillText(`${mood}   •   Card #${cardId}`, 192, 1148);

    // Clue box
    roundRect(ctx, 148, 1245, W - 296, 210, 28, '#F7F2E9', '#E6E0D6', 3);
    ctx.fillStyle = '#6B655E';
    ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.fillText('ANONYMOUS SENDER CLUE', 188, 1300);

    ctx.fillStyle = '#1C1917';
    ctx.font = '600 40px "Caveat", cursive';
    wrapCanvasText(ctx, clue, 188, 1360, W - 376, 46);

    // Site Watermark footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1C1917';
    ctx.font = 'italic 700 54px "Playfair Display", Georgia, serif';
    ctx.fillText('Unseal', W / 2, 1715);

    ctx.fillStyle = '#D9383A';
    ctx.beginPath();
    ctx.arc(W / 2 + 104, 1682, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#57534E';
    ctx.font = '500 28px "DM Sans", sans-serif';
    ctx.fillText('Send your own scratch-off secret note at unseal.cards', W / 2, 1776);

    return c;
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw || 2;
      ctx.stroke();
    }
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(/\s+/);
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, curY);
        line = words[i];
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, curY);
  }

  // =========================================================================
  // 6. Idea Bank Filtering + 1-Tap Copy/Use & Legal Trust Modals
  // =========================================================================

  function bindIdeaBank() {
    const filterButtons = document.querySelectorAll('.idea-filter-btn');
    const ideaCards = document.querySelectorAll('.idea-card');

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-filter');
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        ideaCards.forEach((card) => {
          const cardCat = card.getAttribute('data-category');
          const visible = category === 'all' || cardCat === category;
          card.classList.toggle('hidden', !visible);
        });
      });
    });

    document.querySelectorAll('[data-use-idea]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.idea-card');
        if (!card) return;
        const text = card.querySelector('.idea-quote')?.textContent?.trim() || '';
        const mood = card.getAttribute('data-mood') || DEFAULT_MOOD;

        if (state.isReceiverMode) {
          enterCreatorFromReceiver();
        } else {
          switchView('write');
        }

        const textarea = $('secretTextarea');
        if (textarea) {
          textarea.value = text;
        }
        selectMoodChipByLabel(mood);
        syncPreviewFromInputs(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => textarea?.focus(), 350);
        showToast('✨ Note loaded! Add their name and seal it.');
      });
    });

    document.querySelectorAll('[data-copy-idea]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.idea-card');
        const text = card?.querySelector('.idea-quote')?.textContent?.trim() || '';
        if (!text) return;
        await copyTextToClipboard(text);
        showToast('📋 Idea copied! Paste it anywhere.');
      });
    });
  }

  function selectMoodChipByLabel(moodLabel) {
    const chips = document.querySelectorAll('.mood-chip');
    let matched = false;
    chips.forEach((chip) => {
      const chipMood = chip.getAttribute('data-mood') || chip.textContent.trim();
      const isMatch = chipMood.toLowerCase().includes(moodLabel.toLowerCase().replace(/[^\w\s]/g, '').trim());
      chip.classList.toggle('active', isMatch);
      if (isMatch) {
        state.mood = chipMood;
        matched = true;
      }
    });
    if (!matched && chips[0]) {
      chips[0].classList.add('active');
      state.mood = chips[0].getAttribute('data-mood') || DEFAULT_MOOD;
    }
  }

  function bindLegalModals() {
    const modal = $('legalModal');
    if (!modal) return;

    const openModal = (tabKey) => {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      activateLegalTab(tabKey || 'privacy');
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      if (['#privacy', '#terms', '#disclaimer', '#contact'].includes(window.location.hash)) {
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
    };

    const activateLegalTab = (tabKey) => {
      document.querySelectorAll('.legal-tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-legal-tab') === tabKey);
      });
      document.querySelectorAll('.legal-panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.getAttribute('data-legal-panel') !== tabKey);
      });
    };

    document.querySelectorAll('[data-open-legal]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const key = trigger.getAttribute('data-open-legal');
        openModal(key);
      });
    });

    document.querySelectorAll('.legal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activateLegalTab(btn.getAttribute('data-legal-tab'));
      });
    });

    $('closeLegalModalBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Contact / Report Abuse interactive handler
    $('abuseReportForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = ($('reportReason')?.value || 'General Feedback').trim();
      const details = ($('reportDetails')?.value || '').trim();
      if (!details) {
        showToast('Please add brief details before submitting.');
        return;
      }
      const mailto = `mailto:support@unseal.cards?subject=${encodeURIComponent(
        `[Unseal] ${subject}`
      )}&body=${encodeURIComponent(details)}`;
      window.location.href = mailto;
      showToast('📨 Opening your email app to send report to support@unseal.cards');
      e.target.reset();
    });

    // Deep-link hash routing (#privacy, #terms, #disclaimer, #contact)
    const initialHash = window.location.hash.replace('#', '');
    if (['privacy', 'terms', 'disclaimer', 'contact'].includes(initialHash)) {
      openModal(initialHash);
    }
  }

  // =========================================================================
  // 7. Toast & App Initialization
  // =========================================================================

  function showToast(msg) {
    const existing = $('app-toast');
    if (existing) existing.remove();
    if (state.toastTimer) clearTimeout(state.toastTimer);

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = msg;
    document.body.appendChild(toast);

    state.toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function bindComposerEvents() {
    $('brandResetLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.isReceiverMode) {
        enterCreatorFromReceiver();
      } else {
        switchView('write');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    $('audioToggleBtn')?.addEventListener('click', () => setSoundEnabled(!state.soundEnabled, true, true));
    $('moodAudioPillBtn')?.addEventListener('click', () => setSoundEnabled(!state.soundEnabled, true, true));
    $('testMoodAudioBtn')?.addEventListener('click', () => {
      setSoundEnabled(true, false, true);
      playUnsealChime();
      const profile = SITUATION_PROFILES[state.lastRevealSituation || detectRevealSituation()] || SITUATION_PROFILES.crush;
      showToast(profile.toast);
    });

    $('tabWriteBtn')?.addEventListener('click', () => switchView('write'));
    $('tabPreviewBtn')?.addEventListener('click', () => switchView('preview'));

    document.querySelectorAll('.mood-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.mood-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.mood = chip.getAttribute('data-mood') || chip.textContent.trim();
        syncPreviewFromInputs(true);
      });
    });

    document.querySelectorAll('.foil-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.foil-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const chosen = pill.getAttribute('data-foil') || 'silver';
        state.foil = FOIL_THEMES[chosen] ? chosen : 'silver';
        const sealBtnSpan = $('sealCardBtn')?.querySelector('span');
        if (sealBtnSpan) {
          sealBtnSpan.textContent = FOIL_THEMES[state.foil].btnLabel;
        }
        syncPreviewFromInputs(true);
        if (state.view === 'preview') {
          initScratchCanvas(true);
        }
      });
    });

    // Hindi Devanagari 1-tap quick notes & random prompt inspirer
    document.querySelectorAll('.quick-hindi-chip[data-quick-note]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const noteText = chip.getAttribute('data-quick-note') || '';
        const textarea = $('secretTextarea');
        if (textarea && noteText) {
          textarea.value = noteText;
          textarea.focus();
        }
        document.querySelectorAll('.quick-hindi-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        syncPreviewFromInputs(true);
        showToast('✨ Hindi secret starter note loaded!');
      });
    });

    $('randomPromptBtn')?.addEventListener('click', () => {
      const pick = QUICK_RANDOM_PROMPTS[state.randomIdx % QUICK_RANDOM_PROMPTS.length];
      state.randomIdx += 1;
      const textarea = $('secretTextarea');
      if (textarea) {
        textarea.value = pick.text;
        textarea.focus();
      }
      selectMoodChipByLabel(pick.mood);
      syncPreviewFromInputs(true);
      showToast('🎲 Fresh confession idea loaded!');
    });

    // Studio Addons: Typography, Paper, Ink, Card Frame & Wax Seal Emblem
    const bindStyleGroup = (selector, attr, stateKey, table, defaultVal) => {
      document.querySelectorAll(selector).forEach((btn) => {
        btn.addEventListener('click', () => {
          const chosen = btn.getAttribute(attr) || defaultVal;
          state[stateKey] = table[chosen] ? chosen : defaultVal;
          applyVisualThemeToDom();
          syncAddonButtonsActiveState();
          syncPreviewFromInputs(true);
        });
      });
    };

    bindStyleGroup('#fontPickerGroup [data-font]', 'data-font', 'fontStyle', FONT_STYLES, 'hand');
    bindStyleGroup('#paperPickerGroup [data-paper]', 'data-paper', 'paperTheme', PAPER_THEMES, 'cream');
    bindStyleGroup('#inkPickerGroup [data-ink]', 'data-ink', 'inkColor', INK_COLORS, 'espresso');
    bindStyleGroup('#framePickerGroup [data-frame]', 'data-frame', 'cardFrame', CARD_FRAMES, 'classic');
    bindStyleGroup('#emblemPickerGroup [data-emblem]', 'data-emblem', 'emblem', WAX_EMBLEMS, 'quill');

    $('recipientInput')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('secretTextarea')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('clueInput')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('guessCorrectInput')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('guessDecoy1Input')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('guessDecoy2Input')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('passcodeInput')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('passcodeHintInput')?.addEventListener('input', () => syncPreviewFromInputs(true));
    $('burnTimerToggle')?.addEventListener('change', () => syncPreviewFromInputs(true));

    $('unlockSealBtn')?.addEventListener('click', attemptUnlockPasscode);
    $('unlockCodeInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptUnlockPasscode();
      }
    });

    const scratchToolButtons = Array.from(document.querySelectorAll('#scratchToolGroup [data-tool]'));
    scratchToolButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosenTool = btn.getAttribute('data-tool') || 'coin';
        state.scratchTool = ['coin', 'key', 'wand'].includes(chosenTool) ? chosenTool : 'coin';
        scratchToolButtons.forEach((b) => b.classList.toggle('active', b === btn));
        if (scratchCanvas) {
          scratchCanvas.classList.toggle('tool-wand', state.scratchTool === 'wand');
        }
      });
    });

    $('clearComposerBtn')?.addEventListener('click', () => {
      if ($('recipientInput')) $('recipientInput').value = '';
      if ($('secretTextarea')) $('secretTextarea').value = '';
      if ($('clueInput')) $('clueInput').value = '';
      if ($('guessCorrectInput')) $('guessCorrectInput').value = '';
      if ($('guessDecoy1Input')) $('guessDecoy1Input').value = '';
      if ($('guessDecoy2Input')) $('guessDecoy2Input').value = '';
      if ($('passcodeInput')) $('passcodeInput').value = '';
      if ($('passcodeHintInput')) $('passcodeHintInput').value = '';
      if ($('unlockCodeInput')) $('unlockCodeInput').value = '';
      if ($('burnTimerToggle')) $('burnTimerToggle').checked = false;
      state.chainDepth = 1;
      state.passcodeRequired = false;
      state.passcodeUnlocked = true;
      state.expectedPasscode = '';
      state.passcodeHint = '';
      state.fontStyle = 'hand';
      state.paperTheme = 'cream';
      state.inkColor = 'espresso';
      state.cardFrame = 'classic';
      state.emblem = 'quill';
      document.querySelectorAll('.quick-hindi-chip').forEach((c) => c.classList.remove('active'));
      state.cardId = generateCardId();
      applyPasscodeGateUi();
      syncChainBadgesUi();
      applyVisualThemeToDom();
      syncAddonButtonsActiveState();
      syncPreviewFromInputs(true);
      $('recipientInput')?.focus();
      showToast('📝 Cleared! Ready for your own secret.');
    });

    $('sealCardBtn')?.addEventListener('click', generateConfessionLink);
    $('previewScratchShortcutBtn')?.addEventListener('click', () => {
      switchView('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('backToEditBtn')?.addEventListener('click', () => {
      switchView('write');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('railTopCtaBtn')?.addEventListener('click', () => {
      if (state.isReceiverMode) {
        enterCreatorFromReceiver();
      } else {
        switchView('write');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => $('recipientInput')?.focus(), 300);
      }
    });

    $('copyUrlBtn')?.addEventListener('click', () => copyLinkWithFeedback(null, '📋 Secret link copied!'));
    $('whatsappShareBtn')?.addEventListener('click', shareWhatsApp);
    $('shareTelegramBtn')?.addEventListener('click', shareTelegram);
    $('shareTwitterBtn')?.addEventListener('click', shareTwitter);
    $('shareFacebookBtn')?.addEventListener('click', shareFacebook);
    $('nativeShareBtn')?.addEventListener('click', shareNative);
    $('copyIgBtn')?.addEventListener('click', () =>
      copyLinkWithFeedback(
        $('copyIgBtnText'),
        '✨ Link copied! Paste it into your Instagram Story link sticker or DM.'
      )
    );

    $('quickRevealBtn')?.addEventListener('click', () => {
      if (state.passcodeRequired && !state.passcodeUnlocked) {
        attemptUnlockPasscode();
        showToast('🔐 Enter the secret unlock code first!');
        return;
      }
      unlockSoundOnInteraction();
      completeReveal(true);
    });
    $('downloadStoryBtn')?.addEventListener('click', downloadStoryCardPng);
    $('sealBackBtn')?.addEventListener('click', enterCreatorFromReceiver);
    $('copyCaptionBtn')?.addEventListener('click', copyViralCaption);
    $('previewShareWhatsAppBtn')?.addEventListener('click', shareWhatsApp);
    $('previewShareTelegramBtn')?.addEventListener('click', shareTelegram);
    $('previewShareTwitterBtn')?.addEventListener('click', shareTwitter);
    $('previewCopyLinkBtn')?.addEventListener('click', () => copyLinkWithFeedback(null, '📋 Secret link copied!'));
  }

  function init() {
    initLiveCounter();
    initAmbientParticles();
    bind3DCardTilt();
    bindReactionBar();
    bindFullscreenToggle();
    bindComposerEvents();
    bindScratchEvents();
    bindIdeaBank();
    bindLegalModals();

    let wasDesktop = (window.innerWidth || 0) >= 960;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nowDesktop = (window.innerWidth || 0) >= 960;
        if (nowDesktop !== wasDesktop) {
          wasDesktop = nowDesktop;
          if (!state.hasRevealed && (state.isReceiverMode || state.view === 'preview')) {
            initScratchCanvas(false);
          }
        }
      }, 150);
    });

    const params = new URLSearchParams(window.location.search);
    const sealParam = params.get('seal') || params.get('s');

    if (sealParam) {
      try {
        const decoded = decodeSeal(sealParam);
        applyReceiverPayload(decoded);
        return;
      } catch (_) {
        document.documentElement.classList.remove('receiver-boot');
        showToast('⚠️ That secret seal link could not be opened. Write a fresh card below!');
      }
    }

    document.documentElement.classList.remove('receiver-boot');
    // Default View 1: Write & Style Studio
    applyVisualThemeToDom();
    syncAddonButtonsActiveState();
    syncPreviewFromInputs(true);
    switchView('write');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
