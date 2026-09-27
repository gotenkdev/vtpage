/*
 * Bộ vẽ thông báo donate DÙNG CHUNG cho overlay OBS (overlay.html) và bản xem trước ở trang Cài đặt Donate.
 * - Nội dung người dùng (tên, lời nhắn) luôn vào trang bằng textContent: không có HTML nào từ người donate được diễn giải.
 * - Giao diện/vị trí/hiệu ứng chỉ là tên lớp CSS lấy từ DANH SÁCH CỐ ĐỊNH (khớp backend donate-settings.schema.ts).
 * - Âm thanh có sẵn là tệp của Kenney.nl (CC0); ảnh có sẵn là Noto Animated Emoji của Google (CC BY 4.0).
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

  // ---- 19 âm thanh có sẵn: tệp OGG của Kenney.nl (giấy phép CC0), phục vụ tĩnh ở /assets/donate/sound/NN.ogg ----
  const SOUNDS = [
    '8-bit 1', '8-bit 2', '8-bit 3', '8-bit 4', 'Pizzicato 1', 'Pizzicato 2', 'Pizzicato 3', 'Pizzicato 4',
    'Saxophone 1', 'Saxophone 2', 'Saxophone 3', 'Saxophone 4', 'Steel drum 1', 'Steel drum 2', 'Steel drum 3',
    'Steel drum 4', 'Xác nhận 1', 'Xác nhận 2', 'Xác nhận 3',
  ].map((label, i) => [label, '/assets/donate/sound/' + String(i + 1).padStart(2, '0') + '.ogg']);

  // Phát âm thanh: 'builtin:N' (tệp có sẵn) hoặc 'custom' (tệp streamer tải lên). Trả thời lượng ước tính (giây).
  function playSound(source, customUrl, volume) {
    const vol = Math.max(0, Math.min(100, volume)) / 100;
    if (vol === 0) return 0;
    let url = customUrl;
    if (source !== 'custom') {
      const preset = SOUNDS[Number(String(source).split(':')[1]) - 1] || SOUNDS[0];
      url = preset[1];
    }
    if (!url) return 0;
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play().catch(() => undefined);
    return 3;
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
    // Thông báo luôn ở giữa khung hình (chủ dự án bỏ lựa chọn vị trí 2026-09-27).
    root.className = `va-alert va-pos-center va-theme-${d.theme}` + (wow ? ' is-wow' : '');
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
    // Mỗi lần clear() tăng thế hệ: vòng phát cũ (đang chờ hết thời gian hiển thị) tự dừng thay vì chặn thông báo mới.
    let gen = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function show(event, myGen) {
      const stale = () => myGen !== gen;
      const { settings, media } = getSettings();
      const d = settings.display;
      const { root, inner, message, wow } = buildAlert(stage, settings, media, event);
      const started = Date.now();
      const waits = [];
      if (settings.sound.enabled) playSound(settings.sound.source, media.soundUrl, settings.sound.volume);
      await sleep(900);
      if (stale()) return root.remove();
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
      if (left > 0 && !stale()) await sleep(left);
      if (stale()) return root.remove();
      const out = d.theme.startsWith('classic_') ? d.classic.outAnimation : 'themeOut';
      inner.style.animation = `va-${out} 0.8s both`;
      await sleep(820);
      root.remove();
    }

    async function pump() {
      if (busy) return;
      busy = true;
      const myGen = gen;
      while (queue.length && myGen === gen) {
        try {
          await show(queue.shift(), myGen);
        } catch (err) {
          console.error(err);
        }
      }
      if (myGen === gen) busy = false;
    }

    return {
      push(event) {
        const { settings } = getSettings();
        if (event.amount < (settings.other.minAmount || 0) && !event.test) return;
        queue.push(event);
        void pump();
      },
      clear() {
        gen += 1;
        busy = false;
        queue.length = 0;
        stage.textContent = '';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      },
    };
  }

  window.VTAlerts = { THEMES, POSITIONS, TEXT_EFFECTS, IN_ANIMATIONS, OUT_ANIMATIONS, SOUNDS, createPlayer, playSound, speak, isClassic };
})();
