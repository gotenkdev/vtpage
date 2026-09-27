/*
 * Bộ vẽ thông báo donate DÙNG CHUNG cho overlay OBS (overlay.html) và bản xem trước ở trang Cài đặt Donate.
 * - Nội dung người dùng (tên, lời nhắn) luôn vào trang bằng textContent: không có HTML nào từ người donate được diễn giải.
 * - Giao diện/vị trí/hiệu ứng chỉ là tên lớp CSS lấy từ DANH SÁCH CỐ ĐỊNH (khớp backend donate-settings.schema.ts).
 * - Âm thanh có sẵn được TỔNG HỢP bằng Web Audio (không có tệp nào, không vướng bản quyền).
 * API: window.VTAlerts = { THEMES, POSITIONS, TEXT_EFFECTS, IN_ANIMATIONS, OUT_ANIMATIONS, SOUNDS, createPlayer, playSound, speak }
 */
(function () {
  'use strict';

  const THEMES = [
    ['aurora_glass', 'Aurora Glass'], ['mono_slate', 'Mono Slate'], ['frost_light', 'Frost Light'],
    ['gradient_wave', 'Gradient Wave'], ['spotlight', 'Spotlight'], ['ticker_bar', 'Ticker Bar'], ['candy_pop', 'Candy Pop'],
    ['comic_boom', 'Comic Boom'], ['bubble_chat', 'Bubble Chat'], ['sticker_note', 'Sticker Note'], ['rainbow_fun', 'Rainbow Fun'],
    ['neon_hud', 'Neon HUD'], ['cyber_glitch', 'Cyber Glitch'], ['matrix_terminal', 'Matrix Terminal'], ['rgb_gamer', 'RGB Gamer'],
    ['holo_blue', 'Holo Blue'], ['pixel_quest', 'Pixel Quest'], ['pubg_airdrop', 'PUBG Airdrop'], ['arena_gold', 'Arena Gold'],
    ['hextech', 'Hextech'], ['valorant_strike', 'Valorant Strike'], ['ff_booyah', 'FF Booyah'], ['football_pitch', 'Football Pitch'],
    ['golden_lux', 'Golden Lux'], ['royal_purple', 'Royal Purple'], ['marble_white', 'Marble White'], ['diamond_ice', 'Diamond Ice'],
    ['crt_tv', 'CRT TV'], ['vhs_tape', 'VHS Tape'], ['neon_sign', 'Neon Sign'], ['synthwave', 'Synthwave'],
    ['confetti_gold', 'Confetti Gold'], ['heart_love', 'Heart Love'], ['fire_blaze', 'Fire Blaze'], ['frost_snow', 'Frost Snow'],
    ['level_up', 'Level Up'], ['classic_1', 'Cổ điển 1'], ['classic_2', 'Cổ điển 2'], ['classic_3', 'Cổ điển 3'],
  ];
  const POSITIONS = [
    ['center', 'Giữa khung hình'], ['middle_left', 'Ở giữa - Bên trái'], ['middle_right', 'Ở giữa - Bên phải'],
    ['bottom_left', 'Bên dưới - Góc trái'], ['bottom_center', 'Bên dưới - Ở giữa'], ['bottom_right', 'Bên dưới - Góc phải'],
    ['top_left', 'Bên trên - Góc trái'], ['top_center', 'Bên trên - Ở giữa'], ['top_right', 'Bên trên - Góc phải'],
  ];
  const TEXT_EFFECTS = ['bounce', 'flash', 'pulse', 'rubberBand', 'shake', 'swing', 'tada', 'wobble'];
  const IN_ANIMATIONS = [
    'bounceIn', 'bounceInDown', 'bounceInLeft', 'fadeIn', 'fadeInDown', 'fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig', 'fadeInUp',
    'flipInX', 'flipInY', 'rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'slideInUp', 'slideInDown',
    'slideInLeft', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp', 'rollIn',
  ];
  const OUT_ANIMATIONS = [
    'bounceOut', 'bounceOutLeft', 'bounceOutUp', 'fadeOut', 'fadeOutDown', 'fadeOutLeft', 'fadeOutLeftBig', 'fadeOutUp',
    'fadeOutUpBig', 'flipOutX', 'flipOutY', 'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft',
    'rotateOutUpRight', 'slideOutUp', 'slideOutDown', 'slideOutLeft', 'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutUp',
  ];
  // Giao diện "Cổ điển" dùng hiệu ứng/màu tùy chỉnh; các giao diện khác tự có hiệu ứng riêng.
  const isClassic = (theme) => theme.startsWith('classic_');

  // ---- 19 âm thanh tổng hợp: mỗi nốt [tần số Hz, bắt đầu (s), độ dài (s), dạng sóng] ----
  const n = (f, t, d, w) => [f, t, d, w || 'sine'];
  const SOUNDS = [
    ['Chuông ngân', [n(1047, 0, 0.5), n(1319, 0.08, 0.5), n(1568, 0.16, 0.8)]],
    ['Đồng xu', [n(988, 0, 0.08, 'square'), n(1319, 0.08, 0.45, 'square')]],
    ['Kèn chiến thắng', [n(523, 0, 0.14, 'sawtooth'), n(523, 0.15, 0.14, 'sawtooth'), n(523, 0.3, 0.14, 'sawtooth'), n(784, 0.45, 0.6, 'sawtooth')]],
    ['Lên cấp', [n(523, 0, 0.1, 'square'), n(659, 0.1, 0.1, 'square'), n(784, 0.2, 0.1, 'square'), n(1047, 0.3, 0.35, 'square')]],
    ['Pha lê', [n(2093, 0, 0.6), n(2637, 0.05, 0.6), n(3136, 0.1, 0.9)]],
    ['Hộp nhạc', [n(1319, 0, 0.3, 'triangle'), n(1175, 0.2, 0.3, 'triangle'), n(1047, 0.4, 0.3, 'triangle'), n(1568, 0.6, 0.7, 'triangle')]],
    ['Bong bóng', [n(600, 0, 0.08), n(900, 0.07, 0.08), n(1300, 0.14, 0.12)]],
    ['Tia laser', [n(1800, 0, 0.12, 'sawtooth'), n(1200, 0.1, 0.12, 'sawtooth'), n(700, 0.2, 0.2, 'sawtooth')]],
    ['Chuông cửa', [n(659, 0, 0.6, 'triangle'), n(523, 0.35, 0.9, 'triangle')]],
    ['Tin nhắn', [n(880, 0, 0.1), n(1320, 0.12, 0.25)]],
    ['Phép thuật', [n(784, 0, 0.2), n(988, 0.1, 0.2), n(1175, 0.2, 0.2), n(1568, 0.3, 0.2), n(1976, 0.4, 0.6)]],
    ['Trống nhỏ', [n(180, 0, 0.12, 'square'), n(180, 0.16, 0.12, 'square'), n(260, 0.32, 0.3, 'square')]],
    ['Retro 8-bit', [n(392, 0, 0.08, 'square'), n(523, 0.08, 0.08, 'square'), n(659, 0.16, 0.08, 'square'), n(784, 0.24, 0.08, 'square'), n(1047, 0.32, 0.3, 'square')]],
    ['Êm dịu', [n(440, 0, 1.2), n(554, 0.15, 1.2), n(659, 0.3, 1.4)]],
    ['Tiếng vỗ', [n(1500, 0, 0.04, 'square'), n(1400, 0.1, 0.04, 'square'), n(1600, 0.2, 0.04, 'square'), n(1450, 0.3, 0.04, 'square')]],
    ['Thăng hoa', [n(262, 0, 0.9, 'triangle'), n(330, 0, 0.9, 'triangle'), n(392, 0, 0.9, 'triangle'), n(523, 0.4, 1.2, 'triangle')]],
    ['Radar', [n(1200, 0, 0.15), n(1200, 0.4, 0.15), n(1600, 0.8, 0.3)]],
    ['Sao băng', [n(2400, 0, 0.4, 'triangle'), n(1800, 0.1, 0.4, 'triangle'), n(1200, 0.2, 0.6, 'triangle')]],
    ['Đại tiệc', [n(523, 0, 0.12, 'square'), n(659, 0.12, 0.12, 'square'), n(784, 0.24, 0.12, 'square'), n(1047, 0.36, 0.12, 'square'), n(784, 0.48, 0.12, 'square'), n(1047, 0.6, 0.5, 'square')]],
  ];

  let audioCtx = null;
  function context() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => undefined);
    return audioCtx;
  }

  // Phát âm thanh: 'builtin:N' tổng hợp, hoặc URL tệp đã tải lên. Trả thời lượng ước tính (giây).
  function playSound(source, customUrl, volume) {
    const vol = Math.max(0, Math.min(100, volume)) / 100;
    if (vol === 0) return 0;
    if (source === 'custom') {
      if (!customUrl) return 0;
      const audio = new Audio(customUrl);
      audio.volume = vol;
      audio.play().catch(() => undefined);
      return 3;
    }
    const index = Number(String(source).split(':')[1]) - 1;
    const preset = SOUNDS[index] || SOUNDS[0];
    const ctx = context();
    if (!ctx) return 0;
    const master = ctx.createGain();
    master.gain.value = vol * 0.35;
    master.connect(ctx.destination);
    let end = 0;
    for (const [freq, start, dur, wave] of preset[1]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(1, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
      end = Math.max(end, start + dur);
    }
    return end;
  }

  // ---- Giọng đọc của trình duyệt (miễn phí). Chọn giọng tiếng Việt nếu máy có. ----
  function pickVoice(kind) {
    const voices = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
    const vi = voices.filter((v) => /^vi(-|_|$)/i.test(v.lang));
    if (kind === 'default' || vi.length === 0) return vi[0] || null;
    const male = vi.find((v) => /male|nam|minh|an\b/i.test(v.name) && !/female/i.test(v.name));
    const female = vi.find((v) => /female|nữ|linh|hoaimy|mai/i.test(v.name));
    return (kind === 'vi_male' ? male : female) || vi[0];
  }
  function speak(text, voiceKind, volume) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(voiceKind);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'vi-VN';
      u.volume = Math.max(0, Math.min(100, volume)) / 100;
      u.rate = 1;
      const done = () => resolve();
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
      setTimeout(done, 30000);
    });
  }
  if (window.speechSynthesis) window.speechSynthesis.getVoices();

  // ---- Nội dung ----
  const vnd = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|vn|org|io|gg|me|tv|xyz|link|site)\b)/i;
  const isSpam = (text) => /(.)\1{6,}/u.test(text) || /(\b\S+\b)(\s+\1){3,}/iu.test(text) || text.length > 180;
  function maskKeywords(text, keywords) {
    let out = text || '';
    for (const word of keywords || []) {
      if (!word) continue;
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'giu'), (m) => '*'.repeat(Array.from(m).length));
    }
    return out;
  }
  // Dựng câu từ mẫu "{name} ... {amount}": chữ thường là text node, tên/số tiền là span riêng (để tô màu/hiệu ứng).
  function renderTemplate(target, template, name, amount) {
    const parts = String(template).split(/(\{name\}|\{amount\})/);
    for (const part of parts) {
      if (part === '{name}') {
        const s = document.createElement('span');
        s.className = 'va-name';
        s.textContent = name;
        target.append(s);
      } else if (part === '{amount}') {
        const s = document.createElement('span');
        s.className = 'va-amount';
        s.textContent = vnd(amount);
        target.append(s);
      } else if (part) {
        target.append(document.createTextNode(part));
      }
    }
  }

  // ---- Một thông báo ----
  function buildAlert(stage, settings, media, event) {
    const d = settings.display;
    const c = d.classic;
    const wow = settings.other.wowEnabled && event.amount >= settings.other.wowMinAmount;
    const root = document.createElement('div');
    root.className = `va-alert va-pos-${d.position} va-theme-${d.theme}` + (wow ? ' is-wow' : '');
    root.style.setProperty('--va-msg-size', d.messageSize + 'px');
    root.style.setProperty('--va-name-size', (isClassic(d.theme) ? c.nameSize : Math.round(d.messageSize * 1.1)) + 'px');
    root.style.opacity = String(d.opacity / 100);
    if (isClassic(d.theme)) {
      root.style.setProperty('--va-name-color', c.nameColor);
      root.style.setProperty('--va-amount-color', c.amountColor);
      root.style.setProperty('--va-msg-color', c.messageColor);
      root.style.setProperty('--va-bg', c.backgroundColor);
      root.dataset.textEffect = c.textEffect;
    }
    const inner = document.createElement('div');
    inner.className = 'va-inner';
    const inAnim = isClassic(d.theme) ? c.inAnimation : 'themeIn';
    inner.style.animation = `va-${inAnim} 0.9s both`;
    root.append(inner);

    if (settings.image.enabled && media.imageUrl) {
      const img = document.createElement('img');
      img.className = 'va-media';
      img.src = media.imageUrl;
      img.alt = '';
      inner.append(img);
    }
    const card = document.createElement('div');
    card.className = 'va-card';
    const deco = document.createElement('div');
    deco.className = 'va-deco';
    deco.setAttribute('aria-hidden', 'true');
    card.append(deco);
    const line = document.createElement('div');
    line.className = 'va-line';
    const name = event.donorName || 'Ẩn danh';
    renderTemplate(line, d.template, name, event.amount);
    card.append(line);
    if (event.vipLevel && event.vipLevel >= Math.max(1, settings.other.vipBadgeLevel)) {
      const vip = document.createElement('span');
      vip.className = 'va-vip';
      vip.textContent = 'VIP ' + event.vipLevel;
      card.prepend(vip);
    }
    const message = maskKeywords(event.message || '', settings.other.blockedKeywords);
    if (message) {
      const msg = document.createElement('div');
      msg.className = 'va-msg';
      msg.textContent = message;
      card.append(msg);
    }
    if (wow) {
      const burst = document.createElement('div');
      burst.className = 'va-wow';
      burst.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 24; i += 1) {
        const bit = document.createElement('i');
        bit.style.setProperty('--a', i * 15 + 'deg');
        bit.style.setProperty('--d', (i % 6) * 0.05 + 's');
        burst.append(bit);
      }
      inner.append(burst);
    }
    inner.append(card);
    stage.append(root);
    return { root, inner, message, wow };
  }

  // Hàng đợi: mỗi thông báo hiện ít nhất minSeconds (lâu hơn nếu giọng đọc/ghi âm còn đang phát), rồi hiệu ứng biến mất.
  function createPlayer(stage, getSettings) {
    const queue = [];
    let busy = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function show(event) {
      const { settings, media } = getSettings();
      const d = settings.display;
      const { root, inner, message, wow } = buildAlert(stage, settings, media, event);
      const started = Date.now();
      const waits = [];
      if (settings.sound.enabled) playSound(settings.sound.source, media.soundUrl, settings.sound.volume);
      await sleep(900);
      if (event.recordingUrl && settings.recording.enabled && settings.recording.showOnLive) {
        waits.push(
          new Promise((resolve) => {
            const a = new Audio(event.recordingUrl);
            a.volume = settings.tts.volume / 100;
            const stop = () => resolve();
            a.onended = stop;
            a.onerror = stop;
            a.play().catch(stop);
            setTimeout(() => {
              a.pause();
              stop();
            }, settings.recording.maxSeconds * 1000 + 500);
          }),
        );
        await waits[waits.length - 1];
      }
      if (settings.tts.enabled && event.amount >= settings.tts.minAmount) {
        let text = message;
        if ((settings.tts.skipLinks && LINK.test(text)) || (settings.tts.skipSpam && isSpam(text))) text = '';
        const spoken = settings.tts.template
          .replace(/\{name\}/g, event.donorName || 'Ẩn danh')
          .replace(/\{amount\}/g, new Intl.NumberFormat('vi-VN').format(event.amount) + ' đồng')
          .replace(/\{text\}/g, text);
        await speak(spoken, settings.tts.voice, settings.tts.volume);
      }
      const minMs = (d.minSeconds + (wow ? 3 : 0)) * 1000;
      const left = minMs - (Date.now() - started);
      if (left > 0) await sleep(left);
      const out = d.theme.startsWith('classic_') ? d.classic.outAnimation : 'themeOut';
      inner.style.animation = `va-${out} 0.8s both`;
      await sleep(820);
      root.remove();
    }

    async function pump() {
      if (busy) return;
      busy = true;
      while (queue.length) {
        try {
          await show(queue.shift());
        } catch (err) {
          console.error(err);
        }
      }
      busy = false;
    }

    return {
      push(event) {
        const { settings } = getSettings();
        if (event.amount < (settings.other.minAmount || 0) && !event.test) return;
        queue.push(event);
        void pump();
      },
      clear() {
        queue.length = 0;
        stage.textContent = '';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      },
    };
  }

  window.VTAlerts = { THEMES, POSITIONS, TEXT_EFFECTS, IN_ANIMATIONS, OUT_ANIMATIONS, SOUNDS, createPlayer, playSound, speak, isClassic };
})();
