/*
 * Trang Cài đặt Donate (overlay-settings.html), kiểu Zypage. Form gắn với tài liệu cài đặt qua data-k="nhóm.trường";
 * bản xem trước dùng CHÍNH bộ vẽ của overlay (alert-render.js) nên thấy đúng như trên OBS.
 */
(function () {
  'use strict';
  const root = document.getElementById('donateSettings');
  if (!root || !window.VTAlerts) return;
  const A = window.VTAlerts;
  const $ = (id) => document.getElementById(id);

  let saved = null;
  let form = null;
  let media = { imageUrl: null, soundUrl: null };
  const DEFAULTS = {
    'display.template': 'Cảm ơn {name} đã ủng hộ {amount}!',
    'tts.template': '{name} đã ủng hộ {amount}. {text}',
  };

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const set = (obj, path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], obj);
    target[last] = value;
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // ---- Dựng các lựa chọn cố định ----
  root.querySelectorAll('select[data-options]').forEach((select) => {
    for (const item of A[select.dataset.options]) {
      const [value, label] = Array.isArray(item) ? item : [item, item];
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
  });
  const vipSelect = $('dsVip');
  for (let i = 0; i <= 10; i += 1) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = i === 0 ? 'Không hiện' : 'VIP ' + i + ' trở lên';
    vipSelect.append(option);
  }
  const soundsBox = $('dsSounds');
  A.SOUNDS.forEach(([label], i) => {
    const item = document.createElement('label');
    item.className = 'ds-sound';
    item.innerHTML = '<input type="radio" name="dsSound"><span></span><button type="button" class="ds-play" aria-label="Nghe thử">▶</button>';
    item.querySelector('input').value = 'builtin:' + (i + 1);
    item.querySelector('span').textContent = i + 1 + '. ' + label;
    item.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      A.playSound('builtin:' + (i + 1), null, form ? form.sound.volume : 60);
    });
    soundsBox.append(item);
  });
  const customItem = document.createElement('label');
  customItem.className = 'ds-sound';
  customItem.innerHTML = '<input type="radio" name="dsSound" value="custom"><span>Âm thanh đã tải lên</span><button type="button" class="ds-play" aria-label="Nghe thử">▶</button>';
  customItem.querySelector('button').addEventListener('click', (e) => {
    e.preventDefault();
    if (media.soundUrl) A.playSound('custom', media.soundUrl, form.sound.volume);
  });
  soundsBox.append(customItem);

  // ---- Đồng bộ form <-> tài liệu ----
  function fill() {
    root.querySelectorAll('[data-k]').forEach((el) => {
      const value = get(form, el.dataset.k);
      if (el.classList.contains('switch')) el.setAttribute('aria-checked', String(Boolean(value)));
      else if (el.type === 'checkbox') el.checked = Boolean(value);
      else el.value = String(value);
    });
    soundsBox.querySelectorAll('input').forEach((r) => {
      r.checked = r.value === form.sound.source;
    });
    customItem.hidden = !media.soundUrl;
    renderKeywords();
    renderImage();
    refresh();
  }

  function readInto(el) {
    const path = el.dataset.k;
    let value;
    if (el.classList.contains('switch')) value = el.getAttribute('aria-checked') === 'true';
    else if (el.type === 'checkbox') value = el.checked;
    else if (el.type === 'number' || el.type === 'range' || 'number' in el.dataset) value = Number(el.value) || 0;
    else value = el.value;
    set(form, path, value);
  }

  root.addEventListener('input', (e) => {
    if (e.target.dataset && e.target.dataset.k) {
      readInto(e.target);
      refresh();
    }
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset && e.target.dataset.k) {
      readInto(e.target);
      refresh();
      if (e.target.dataset.k.startsWith('display.')) previewSoon();
    }
    if (e.target.name === 'dsSound') {
      form.sound.source = e.target.value;
      if (e.target.value === 'custom') form.sound.mediaKey = form.sound.mediaKey || null;
      refresh();
    }
  });
  root.querySelectorAll('.switch[data-k]').forEach((sw) =>
    sw.addEventListener('click', () => {
      sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));
      readInto(sw);
      refresh();
    }),
  );
  root.querySelectorAll('[data-reset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      set(form, btn.dataset.reset, DEFAULTS[btn.dataset.reset]);
      fill();
    }),
  );

  function refresh() {
    root.querySelectorAll('output[data-for]').forEach((out) => {
      const input = $(out.dataset.for);
      out.textContent = input.value + (input.dataset.unit || '');
    });
    $('dsClassic').hidden = !A.isClassic(form.display.theme);
    const theme = A.THEMES.find(([v]) => v === form.display.theme);
    $('dsThemeName').textContent = 'Giao diện: ' + (theme ? theme[1] : '');
    const dirty = JSON.stringify(form) !== JSON.stringify(saved);
    $('dsSave').disabled = !dirty;
    $('dsUndo').disabled = !dirty;
    $('dsStatus').textContent = dirty ? 'Có thay đổi chưa lưu.' : 'Chưa có thay đổi.';
  }

  // ---- Thẻ con ----
  const subtabs = [...root.querySelectorAll('.ds-subtab')];
  subtabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      subtabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      root.querySelectorAll('.ds-panel').forEach((p) => {
        p.hidden = p.dataset.panel !== tab.dataset.panel;
      });
    }),
  );

  // ---- Lọc từ khóa (thẻ) ----
  const keywordInput = $('dsKeyword');
  function renderKeywords() {
    const box = $('dsKeywords');
    box.querySelectorAll('.ds-tag').forEach((t) => t.remove());
    form.other.blockedKeywords.forEach((word, i) => {
      const tag = document.createElement('span');
      tag.className = 'ds-tag';
      tag.textContent = word;
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '×';
      x.setAttribute('aria-label', 'Bỏ từ khóa ' + word);
      x.addEventListener('click', () => {
        form.other.blockedKeywords.splice(i, 1);
        renderKeywords();
        refresh();
      });
      tag.append(x);
      box.insertBefore(tag, keywordInput);
    });
  }
  keywordInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const word = keywordInput.value.replace(/\s+/g, ' ').trim();
    if (word && !form.other.blockedKeywords.includes(word) && form.other.blockedKeywords.length < 100) {
      form.other.blockedKeywords.push(word);
      renderKeywords();
      refresh();
    }
    keywordInput.value = '';
  });

  // ---- Tệp media ----
  function renderImage() {
    const img = $('dsImagePreview');
    const url = form.image.mediaKey ? '/api/v1/media/' + form.image.mediaKey : null;
    media.imageUrl = url;
    img.hidden = !url;
    if (url) img.src = url;
    $('dsImageEmpty').hidden = Boolean(url);
    media.soundUrl = form.sound.mediaKey ? '/api/v1/media/' + form.sound.mediaKey : null;
    customItem.hidden = !media.soundUrl;
    $('dsSoundCustomHint').textContent = media.soundUrl ? 'Đã có âm thanh riêng.' : '';
  }
  async function upload(kind, file) {
    $('dsStatus').textContent = 'Đang tải lên…';
    try {
      const res = await window.VTApi.uploadImage('/me/donate-media/' + kind, file);
      if (kind === 'image') form.image.mediaKey = res.mediaKey;
      else {
        form.sound.mediaKey = res.mediaKey;
        form.sound.source = 'custom';
      }
      fill();
      $('dsStatus').textContent = 'Đã tải lên — bấm Cập nhật để dùng.';
    } catch (err) {
      showSaveError(err.message);
      refresh();
    }
  }
  $('dsImageInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) void upload('image', f);
  });
  $('dsSoundInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) void upload('sound', f);
  });
  $('dsImageRemove').addEventListener('click', () => {
    form.image.mediaKey = null;
    fill();
  });

  // ---- Xem trước (khung 1280×720 thu nhỏ vừa cột) ----
  const scaleBox = $('dsPreviewScale');
  const fit = () => {
    const w = scaleBox.parentElement.clientWidth;
    scaleBox.style.transform = 'scale(' + w / 1280 + ')';
  };
  new ResizeObserver(fit).observe(scaleBox.parentElement);
  let quiet = false;
  const player = A.createPlayer($('dsPreviewStage'), () => {
    const s = clone(form);
    if (quiet) {
      s.sound.enabled = false;
      s.tts.enabled = false;
      s.display.minSeconds = 60;
    }
    return { settings: s, media };
  });
  const sample = (vip) => ({
    donorName: 'VT Page',
    amount: form.other.wowEnabled ? Math.max(100000, form.other.wowMinAmount) : 100000,
    message: 'Hello streamer! Chúc buổi live vui vẻ nhé.',
    vipLevel: vip,
    test: true,
  });
  let previewTimer = null;
  function previewSoon() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      quiet = true;
      player.clear();
      player.push(sample(3));
    }, 250);
  }
  $('dsPreviewBtn').addEventListener('click', () => {
    quiet = false;
    player.clear();
    player.push(sample(3));
  });
  $('dsTtsTest').addEventListener('click', () => {
    const text = form.tts.template
      .replace(/\{name\}/g, 'VT Page')
      .replace(/\{amount\}/g, '100.000 đồng')
      .replace(/\{text\}/g, 'Chúc buổi live vui vẻ nhé');
    void A.speak(text, form.tts.voice, form.tts.volume);
  });

  // ---- Lưu / hoàn tác ----
  function showSaveError(message) {
    $('dsSaveError').hidden = !message;
    $('dsSaveErrorText').textContent = message || '';
  }
  $('dsUndo').addEventListener('click', () => {
    form = clone(saved);
    showSaveError('');
    fill();
    previewSoon();
  });
  $('dsSave').addEventListener('click', async () => {
    showSaveError('');
    $('dsSave').disabled = true;
    $('dsStatus').textContent = 'Đang lưu…';
    try {
      const res = await window.VTApi.call('PUT', '/me/donate-settings', form);
      saved = res.settings;
      form = clone(saved);
      fill();
      $('dsStatus').textContent = 'Đã lưu — overlay trên OBS tự cập nhật trong vòng 15 giây.';
    } catch (err) {
      showSaveError(err.message);
      refresh();
    }
  });
  window.addEventListener('beforeunload', (e) => {
    if (saved && JSON.stringify(form) !== JSON.stringify(saved)) e.preventDefault();
  });

  // ---- Kết nối OBS ----
  const obsUrl = $('dsObsUrl');
  const rotateBtn = $('dsRotate');
  let hasToken = false;
  function obsMsg(ok, err) {
    $('dsObsOk').hidden = !ok;
    $('dsObsOk').textContent = ok || '';
    $('dsObsError').hidden = !err;
    $('dsObsErrorText').textContent = err || '';
  }
  async function loadToken() {
    const { token } = await window.VTApi.call('GET', '/me/overlay-token');
    hasToken = token !== null;
    obsUrl.value = token && token.token ? location.origin + '/overlay.html#token=' + token.token : '';
    obsUrl.placeholder = hasToken
      ? 'Link cũ không xem lại được — bấm Đổi link để lấy link mới'
      : 'Chưa có link — bấm Tạo link';
    rotateBtn.textContent = hasToken ? 'Đổi link' : 'Tạo link';
  }
  rotateBtn.addEventListener('click', async () => {
    if (hasToken && !window.confirm('Đổi link sẽ làm link cũ mất hiệu lực ngay, OBS đang dùng link cũ sẽ ngừng hiện thông báo. Tiếp tục?')) return;
    obsMsg('', '');
    try {
      const res = await withStepUp($('stepUpPanel'), () => window.VTApi.call('POST', '/me/overlay-token/rotate'));
      obsUrl.value = location.origin + '/overlay.html#token=' + res.token;
      hasToken = true;
      rotateBtn.textContent = 'Đổi link';
      obsMsg('Đã tạo link mới. Dán vào OBS → Browser Source (1920×1080).', '');
    } catch (err) {
      obsMsg('', err.message);
    }
  });
  $('dsObsCopy').addEventListener('click', async () => {
    if (!obsUrl.value) return;
    try {
      await navigator.clipboard.writeText(obsUrl.value);
      obsMsg('Đã sao chép link.', '');
    } catch {
      obsUrl.select();
    }
  });
  $('dsTestLive').addEventListener('click', async () => {
    obsMsg('', '');
    try {
      await window.VTApi.call('POST', '/me/overlay-token/test-event');
      obsMsg('Đã gửi donate thử lên overlay (OBS). Lưu cài đặt trước để thấy giao diện mới.', '');
    } catch (err) {
      obsMsg('', err.message);
    }
  });

  // ---- Tải ban đầu ----
  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = 'sign-in.html';
        return;
      }
      const data = await window.VTApi.call('GET', '/me/donate-settings');
      saved = data.settings;
      form = clone(saved);
      $('dsLoading').hidden = true;
      root.hidden = false;
      fill();
      fit();
      previewSoon();
      await loadToken();
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
