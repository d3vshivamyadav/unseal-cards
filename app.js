(() => {
  'use strict';

  const KEY_STREAM_TAG = [85, 78, 83, 69, 65, 76, 51, 48];
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const REVEAL_THRESHOLD = 0.45;
  const MAX_SECRET_CHARS = 280;

  const U2_MOODS = ['💌 Crush Confession', '🌙 Midnight Thought', '🤫 Inside Joke', '🎲 Wild Dare'];
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
    toastTimer: null
  };

  let scratchCanvas = null;
  let scratchCtx = null;
  let resizeObserver = null;

  const $ = (id) => document.getElementById(id);

  // =========================================================================
  // 1. 8-Char Alphabet Unique ID & Short Zero-Backend U3 Codec
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

  // Pack ASCII + Devanagari (U+0900..U+097F) in 1 byte/char; escape other Unicode with 0x7F
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

  // Ultra-compact U3 codec: [0x55, 0x33, meta(salt6<<2 | lz<<1 | hasClue)] + body
  function encodeU3Token(r, s, c) {
    const arr = [];
    const recipient = (r || '').trim();
    const secret = (s || '').trim();
    const clue = (c || '').trim();
    const hasClue = Boolean(clue);

    writeCompactStr(arr, recipient || 'You');
    writeCompactStr(arr, secret);
    if (hasClue) writeCompactStr(arr, clue);

    const rawBin = Uint8Array.from(arr);
    const lzBin = rawBin.length >= 10 ? lz77Compress(rawBin) : rawBin;
    const useLz = lzBin.length < rawBin.length;
    const body = useLz ? lzBin : rawBin;

    const saltBuf = new Uint8Array(1);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(saltBuf);
    } else {
      saltBuf[0] = Math.floor(Math.random() * 256);
    }
    const salt6 = saltBuf[0] & 0x3f;
    const salt1 = (salt6 * 41 + 23) & 0xff;
    const cipher = xorTransform(body, salt6, salt1, KEY_STREAM_TAG);

    const packet = new Uint8Array(3 + cipher.length);
    packet[0] = 0x55; // 'U'
    packet[1] = 0x33; // '3'
    packet[2] = (salt6 << 2) | (useLz ? 2 : 0) | (hasClue ? 1 : 0);
    packet.set(cipher, 3);
    return bytesToBase64Url(packet);
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

  // Full compatibility decoder for U3 + legacy U2/U1/JSON ?seal= and ?s= links
  function decodeToken(token, fallbackId) {
    const raw = base64UrlToBytes(token);
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

  function extractIdFromSearch(searchStr) {
    const cleaned = String(searchStr || '').replace(/^\?/, '').split('&')[0] || '';
    const match = /-([A-Za-z]{8})$/.exec(cleaned);
    return match ? match[1] : '';
  }

  function getBasePageUrl() {
    if (window.location.protocol === 'file:') {
      return 'https://unseal.cards/';
    }
    return `${window.location.origin}${window.location.pathname}`;
  }

  function buildShortCardUrl(recipient, secret, clue, id) {
    const slug = makeNameSlug(recipient);
    const token = encodeU3Token(recipient, secret, clue);
    return `${getBasePageUrl()}?${slug}-${id}#${token}`;
  }

  // =========================================================================
  // 2. Web Audio Synthesizer (Scratch Friction + Auto Situation Reveal Chime)
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
      state.audioCtx.resume().catch(() => {});
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
    } catch (_) {
      // Ignore restricted Web Audio states
    }
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
    } catch (_) {
      // Ignore audio errors
    }
  }

  // =========================================================================
  // 3. Minimal Writer Flow, Sender Gift Card & View Switching
  // =========================================================================

  function updateCharCounter() {
    const len = ($('secretTextarea')?.value || '').length;
    const el = $('secretCharCount');
    if (el) el.textContent = `${len} / ${MAX_SECRET_CHARS}`;
  }

  function syncGiftCardPreview() {
    const rec = (state.recipient || '').trim();
    const snd = (state.senderName || '').trim();
    const idEl = $('giftMiniPassId');
    const mainEl = $('giftMiniMainText');
    const subEl = $('giftMiniSubText');

    if (idEl) idEl.textContent = `#${state.cardId}`;
    if (mainEl) {
      if (snd && rec) mainEl.textContent = `${snd} sealed a secret for ${rec} ✨`;
      else if (snd) mainEl.textContent = `${snd} sealed a secret note 💌`;
      else if (rec) mainEl.textContent = `Secret sealed for ${rec} ✨`;
      else mainEl.textContent = `A secret scratch card was sealed ✨`;
    }
    if (subEl) {
      subEl.textContent = 'Think this card is for you? Check your chats 👀';
    }
  }

  function unlockGiftBadgeOnShare() {
    const tag = $('giftUnlockedState');
    if (tag) {
      tag.textContent = 'Gift Unlocked ✨';
      tag.classList.add('unlocked');
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

    const giftTag = $('giftUnlockedState');
    if (giftTag) {
      giftTag.textContent = 'Ready to Post';
      giftTag.classList.remove('unlocked');
    }

    syncGiftCardPreview();
    $('composerCard')?.classList.add('hidden');
    $('senderReadyCard')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('✨ Sealed! Your short link & Gift Card are ready.');
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

    document.title = 'Unseal — Secret Scratch-Off Note & Confession Card Maker';
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
  // 4. Responsive HTML5 Metallic Foil Scratch Stage + Confetti + Popup
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

    // Subtle brushed foil grain lines
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

    // Engraved prompt inside metallic foil
    ctx.save();
    ctx.fillStyle = 'rgba(56, 42, 24, 0.62)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px "DM Sans", sans-serif';
    ctx.fillText('✨ SCRATCH TO UNSEAL ✨', width / 2, height / 2 - 11);
    ctx.font = '500 11px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(56, 42, 24, 0.45)';
    ctx.fillText('Rub gently with your finger or mouse', width / 2, height / 2 + 12);
    ctx.restore();
  }

  function initScratchCanvas() {
    scratchCanvas = $('scratchCanvas');
    const box = $('scratchBox');
    if (!scratchCanvas || !box) return;

    scratchCanvas.classList.remove('foil-faded');
    const logicalW = Math.max(260, Math.round(box.clientWidth || 340));
    const logicalH = Math.max(200, Math.round(box.clientHeight || 220));
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
        const newH = Math.round(box.clientHeight || 0);
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
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:75;overflow:hidden;';
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

    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 120]);
      } catch (_) {}
    }

    playRevealChime();
    burstPaperConfetti();

    // Update popup gift card teaser line with receiver's name cleanly
    const giftLine = $('popupGiftNameLine');
    if (giftLine) {
      const displayRec = state.recipient && state.recipient !== 'You' ? `${state.recipient}'s` : 'Your';
      giftLine.textContent = `${displayRec} Personalized Gift Card Unlocked`;
    }

    // Open Celebration Share Popup smoothly after receiver reads the message
    clearTimeout(state.popupTimer);
    state.popupTimer = setTimeout(() => {
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
          } catch (_) {}
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
  // 5. Native 9:16 PNG Generator (Personalized Name Gift Card + Revealed Note)
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

  async function renderCardPngBlob(mode = 'gift') {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (mode === 'gift') {
      // Dark Espresso Luxury Gift Card for Instagram Story & WhatsApp Status
      const bg = ctx.createRadialGradient(840, 260, 80, 540, 960, 1280);
      bg.addColorStop(0, '#3D2E27');
      bg.addColorStop(0.55, '#1E1A18');
      bg.addColorStop(1, '#12100E');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);

      // Subtle gold dust stars
      ctx.fillStyle = 'rgba(246, 229, 190, 0.16)';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(((i * 211) % 980) + 50, ((i * 389) % 1800) + 60, (i % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main luxury pass card
      drawRoundedRect(ctx, 84, 240, 912, 1340, 48);
      ctx.fillStyle = 'rgba(34, 28, 25, 0.94)';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#C9A96E';
      ctx.stroke();

      drawRoundedRect(ctx, 112, 268, 856, 1284, 36);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(201, 169, 110, 0.45)';
      ctx.stroke();

      // Header row
      ctx.fillStyle = '#D8BE88';
      ctx.font = '700 26px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('UNSEAL • SECRET GIFT PASS', 160, 355);
      ctx.textAlign = 'right';
      ctx.fillText(`#${state.cardId}`, 920, 355);

      // Center Crimson Wax Seal Crest
      ctx.beginPath();
      ctx.arc(540, 560, 82, 0, Math.PI * 2);
      ctx.fillStyle = '#D9383A';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#F6E5BE';
      ctx.stroke();

      ctx.fillStyle = '#FFF8F2';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 66px Georgia, serif';
      ctx.fillText('♥', 540, 566);

      // Personalized Main Name Line
      const rec = state.recipient && state.recipient !== 'You' ? state.recipient : '';
      const snd = state.senderName || '';
      let mainTitle = 'A secret scratch card was sealed ✨';
      if (state.isReceiverMode) {
        mainTitle = rec ? `${rec} unsealed a secret card 💌` : 'I just unsealed a secret card 💌';
      } else if (snd && rec) {
        mainTitle = `${snd} sent a secret to ${rec} 💌`;
      } else if (snd) {
        mainTitle = `${snd} sealed a secret note 💌`;
      } else if (rec) {
        mainTitle = `Secret note sealed for ${rec} ✨`;
      }

      ctx.fillStyle = '#FFFDF9';
      ctx.font = 'italic 700 68px "Playfair Display", Georgia, serif';
      const titleLines = wrapLines(ctx, mainTitle, 760, 4);
      let curY = 780;
      titleLines.forEach((ln) => {
        ctx.fillText(ln, 540, curY);
        curY += 86;
      });

      // Signature gold pill badge
      drawRoundedRect(ctx, 220, curY + 55, 640, 74, 37);
      ctx.fillStyle = 'rgba(201, 169, 110, 0.14)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#C9A96E';
      ctx.stroke();

      ctx.fillStyle = '#F6E5BE';
      ctx.font = '700 24px "DM Sans", sans-serif';
      ctx.fillText('PRIVATE SCRATCH FOIL • ZERO SPOILERS', 540, curY + 93);

      // Callout
      ctx.fillStyle = '#E5DDD0';
      ctx.font = '600 44px "Caveat", "Kalam", "Noto Sans Devanagari", cursive';
      const subCallout = state.isReceiverMode
        ? 'Your turn — send me a secret note too 👀'
        : 'Think this note is for you? Check your inbox 👀';
      ctx.fillText(subCallout, 540, 1290);

      // Footer
      ctx.fillStyle = '#D8BE88';
      ctx.font = 'italic 700 58px "Playfair Display", Georgia, serif';
      ctx.fillText('Unseal', 540, 1435);
      ctx.fillStyle = '#BFB5A8';
      ctx.font = '500 28px "DM Sans", sans-serif';
      ctx.fillText('Send & scratch yours free at unseal.cards', 540, 1495);
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

  async function downloadPngCard(mode = 'gift') {
    showToast('🎨 Creating high-res Status card...');
    const blob = await renderCardPngBlob(mode);
    if (!blob) {
      showToast('⚠️ Could not generate image on this browser.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'gift' ? `unseal-gift-${state.cardId}.png` : `unseal-note-${state.cardId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    unlockGiftBadgeOnShare();
    showToast('🎁 9:16 Card PNG saved! Ready for WhatsApp Status or IG Story.');
  }

  async function shareGiftImage() {
    showToast('🎨 Preparing Gift Card for Status/Story...');
    const blob = await renderCardPngBlob('gift');
    if (!blob) return;

    const file = new File([blob], `unseal-gift-${state.cardId}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Unseal Gift Pass 💌',
          text: `Try scratching a secret note at ${getBasePageUrl()}`
        });
        unlockGiftBadgeOnShare();
        showToast('🎁 Shared your Status Gift Card!');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Fallback to clean PNG download
    await downloadPngCard('gift');
  }

  // =========================================================================
  // 6. Viral Sharing & Toast Utilities
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
    state.toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function copyText(str) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(str);
        return true;
      } catch (_) {}
    }
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (_) {}
    ta.remove();
    return true;
  }

  function shareSealedWhatsApp() {
    if (!state.shareUrl) return;
    unlockGiftBadgeOnShare();
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'friend';
    const text = `Hey ${who}! 💌 Someone sealed a secret scratch card for you. Rub the gold foil on your phone to unseal it: ${state.shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareSealedTelegram() {
    if (!state.shareUrl) return;
    unlockGiftBadgeOnShare();
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'you';
    const msg = `💌 Someone sealed a secret scratch card for ${who}. Open & rub the foil!`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(state.shareUrl)}&text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function shareSealedNative() {
    if (!state.shareUrl) return;
    unlockGiftBadgeOnShare();
    const who = state.recipient && state.recipient !== 'You' ? state.recipient : 'you';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Secret Note for ${who} — Unseal`,
          text: `Hey ${who}! 💌 Rub the metallic foil to unseal your secret note:`,
          url: state.shareUrl
        });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    await copyText(state.shareUrl);
    showToast('📋 Short link copied to share anywhere!');
  }

  function inviteFriendWhatsApp() {
    const homeUrl = getBasePageUrl();
    const text = `Someone just sent me a secret scratch-off note on Unseal 💌✨ Rub the foil & send me one back: ${homeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function inviteFriendNative() {
    const homeUrl = getBasePageUrl();
    const text = `Send an anonymous gold-foil scratch note & get your Status Gift Card on Unseal 💌`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Unseal — Secret Scratch Notes', text, url: homeUrl });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    await copyText(`${text} ${homeUrl}`);
    showToast('📋 Invite link copied! Paste in any group or Instagram Story.');
  }

  // =========================================================================
  // 7. Legal Compliance Modal & Boot Initialization
  // =========================================================================

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
      unlockGiftBadgeOnShare();
      showToast('📋 Short link copied! Now claim or share your Gift Card below.');
    });

    $('whatsappShareBtn')?.addEventListener('click', shareSealedWhatsApp);
    $('shareTelegramBtn')?.addEventListener('click', shareSealedTelegram);
    $('nativeShareBtn')?.addEventListener('click', shareSealedNative);
    $('copyIgBtn')?.addEventListener('click', async () => {
      if (!state.shareUrl) return;
      await copyText(state.shareUrl);
      unlockGiftBadgeOnShare();
      const label = $('copyIgBtnText');
      if (label) {
        const orig = label.textContent;
        label.textContent = '✅ Link Copied for IG!';
        setTimeout(() => { label.textContent = orig; }, 2200);
      }
      showToast('📸 Link copied! Paste into Instagram Story sticker or DM.');
    });

    $('downloadGiftCardBtn')?.addEventListener('click', () => downloadPngCard('gift'));
    $('shareGiftImageBtn')?.addEventListener('click', shareGiftImage);

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

    $('openShareModalBtn')?.addEventListener('click', () => {
      $('revealShareModal')?.classList.remove('hidden');
    });
    $('receiverGiftBtn')?.addEventListener('click', () => downloadPngCard('gift'));
    $('downloadRevealedCardBtn')?.addEventListener('click', () => downloadPngCard('revealed'));
    $('sealBackBtn')?.addEventListener('click', resetToFreshComposer);

    // Post-reveal celebration popup
    const revealModal = $('revealShareModal');
    $('closeRevealModalBtn')?.addEventListener('click', () => revealModal?.classList.add('hidden'));
    revealModal?.addEventListener('click', (e) => {
      if (e.target === revealModal) revealModal.classList.add('hidden');
    });
    $('modalShareWhatsAppBtn')?.addEventListener('click', inviteFriendWhatsApp);
    $('modalShareNativeBtn')?.addEventListener('click', inviteFriendNative);
    $('modalClaimGiftBtn')?.addEventListener('click', () => shareGiftImage());
    $('modalReplyBtn')?.addEventListener('click', resetToFreshComposer);

    bindScratchPointerHandlers();
    bindLegalModals();
  }

  function init() {
    updateSoundUi();
    updateCharCounter();
    bindAllEvents();

    const params = new URLSearchParams(window.location.search);
    const legacySeal = params.get('seal') || params.get('s');
    const hashToken = (window.location.hash || '').replace(/^#/, '');
    const idFromQuery = extractIdFromSearch(window.location.search);
    const activeToken = legacySeal || (hashToken.length > 8 ? hashToken : '');

    if (activeToken) {
      try {
        const decoded = decodeToken(activeToken, idFromQuery);
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
