/*
 * Trang Cài đặt Donate (/overlay-settings), kiểu VT Page. Form gắn với tài liệu cài đặt qua data-k="nhóm.trường";
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
    'music.displayText': '{name} đã gửi yêu cầu phát {music} với số tiền {amount}',
    'music.voiceText': '{name} đã gửi yêu cầu phát {music} với số tiền {amount}',
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
  // Giao diện trình phát nhạc (danh sách trong music-render.js).
  for (const [value, label] of window.VTMusic.TEMPLATES) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    $('dsMusicTpl').append(option);
  }
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
    item.querySelector('span').textContent = label;
    item.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      A.playSound('builtin:' + (i + 1), null, form ? Math.max(form.sound.volume, 30) : 60);
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
    renderGoal();
    renderMusic();
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
      if (e.target.dataset.k.startsWith('goal.')) renderGoal();
      if (e.target.dataset.k.startsWith('music.')) renderMusic();
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
      renderGoal();
      renderMusic();
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
  // Lưới ảnh có sẵn: bộ có sẵn của VT Page (z01–z19) và Noto Animated Emoji (CC BY 4.0).
  const IMAGE_PRESETS = [
    'z01', 'z02', 'z03', 'z04', 'z05', 'z06', 'z07', 'z08', 'z09', 'z10',
    'z11', 'z12', 'z13', 'z14', 'z15', 'z16', 'z17', 'z18', 'z19',
    '1f389', '1f38a', '1f386', '2728', '1fa99', '1f4b8', '1f381', '1f3c6', '1f451', '1f48e',
    '1f680', '1f525', '2764_fe0f', '1f496', '1f929', '1f973', '1f60d', '1f970', '1f44f', '1f4af',
  ];
  const presetSrc = (code) =>
    code.startsWith('z') ? '/assets/donate/vtpage/img' + code.slice(1) + '.png?v=2' : '/assets/donate/img/' + code + '.webp';
  const presetBox = $('dsImagePresets');
  IMAGE_PRESETS.forEach((code) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ds-preset';
    b.dataset.preset = code;
    b.setAttribute('aria-label', 'Chọn ảnh có sẵn ' + code);
    const img = document.createElement('img');
    img.src = presetSrc(code);
    img.alt = '';
    img.loading = 'lazy';
    b.append(img);
    b.addEventListener('click', () => {
      form.image.preset = code;
      form.image.mediaKey = null;
      fill();
      previewSoon();
    });
    presetBox.append(b);
  });
  function renderImage() {
    const img = $('dsImagePreview');
    const url = form.image.mediaKey
      ? '/api/v1/media/' + form.image.mediaKey
      : form.image.preset
        ? presetSrc(form.image.preset)
        : null;
    presetBox.querySelectorAll('.ds-preset').forEach((b) =>
      b.setAttribute('aria-pressed', String(!form.image.mediaKey && b.dataset.preset === form.image.preset)),
    );
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
      if (kind === 'image') {
        form.image.mediaKey = res.mediaKey;
        form.image.preset = null;
      }
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
    form.image.preset = null;
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
    obsUrl.value = token && token.token ? location.origin + '/overlay#token=' + token.token : '';
    obsUrl.placeholder = hasToken
      ? 'Link cũ không xem lại được — bấm Đổi link để lấy link mới'
      : 'Chưa có link — bấm Tạo link';
    rotateBtn.textContent = hasToken ? 'Đổi link' : 'Tạo link';
    syncGoalUrl();
  }
  rotateBtn.addEventListener('click', async () => {
    if (hasToken && !window.confirm('Đổi link sẽ làm link cũ mất hiệu lực ngay, OBS đang dùng link cũ sẽ ngừng hiện thông báo. Tiếp tục?')) return;
    obsMsg('', '');
    try {
      const res = await withStepUp($('stepUpPanel'), () => window.VTApi.call('POST', '/me/overlay-token/rotate'));
      obsUrl.value = location.origin + '/overlay#token=' + res.token;
      syncGoalUrl();
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

  // ---- Công cụ: Donate / Mục tiêu ----
  const toolTabs = [...root.querySelectorAll('.ds-tab[data-tool]')];
  toolTabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      toolTabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      root.querySelectorAll('[data-tool-panel]').forEach((p) => {
        p.hidden = p.dataset.toolPanel !== tab.dataset.tool;
      });
      if (tab.dataset.tool === 'goal') {
        fitGoal();
        void loadGoalProgress();
      }
      musicTabOpen = tab.dataset.tool === 'music';
      if (musicTabOpen) void loadQueue();
    }),
  );

  // ---- Mục tiêu ----
  const G = window.VTGoal;
  let progress = { raised: 0, count: 0 };
  const goalView = G.mount($('dsGoalStage'));
  const goalScale = $('dsGoalScale');
  const fitGoal = () => {
    const w = goalScale.parentElement.clientWidth;
    if (w) goalScale.style.transform = 'scale(' + Math.min(1, w / 700) + ')';
  };
  new ResizeObserver(fitGoal).observe(goalScale.parentElement);
  // Thẻ chọn mẫu: mỗi thẻ là một bản thu nhỏ đang chạy của chính mẫu đó.
  const templatesBox = $('dsGoalTemplates');
  const miniViews = [];
  G.TEMPLATES.forEach(([value, label]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ds-goal-card';
    card.setAttribute('role', 'radio');
    card.dataset.value = value;
    const thumb = document.createElement('span');
    thumb.className = 'ds-goal-thumb';
    const inner = document.createElement('span');
    inner.className = 'ds-goal-thumb-inner';
    thumb.append(inner);
    const name = document.createElement('span');
    name.className = 'ds-goal-name';
    name.textContent = label;
    card.append(thumb, name);
    card.addEventListener('click', () => {
      form.goal.template = value;
      refresh();
      renderGoal();
    });
    templatesBox.append(card);
    miniViews.push([value, G.mount(inner)]);
  });
  function renderGoal() {
    if (!form) return;
    templatesBox.querySelectorAll('.ds-goal-card').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.value === form.goal.template)));
    for (const [value, view] of miniViews) {
      view.update({ ...form.goal, template: value, opacity: 100, title: form.goal.title }, Math.round(form.goal.targetAmount * 0.65), 12);
    }
    goalView.update(form.goal, progress.raised, progress.count);
    $('dsGoalProgress').textContent = 'Đã nhận ' + new Intl.NumberFormat('vi-VN').format(progress.raised) + 'đ · ' + progress.count + ' lượt';
    $('dsGoalSince').textContent = form.goal.resetAt
      ? 'Tính từ ' + new Date(form.goal.resetAt).toLocaleString('vi-VN') + (form.goal.resetAt !== saved.goal.resetAt ? ' — bấm Cập nhật để áp dụng' : '')
      : 'Đang tính toàn bộ donate từ trước tới nay.';
  }
  async function loadGoalProgress() {
    try {
      progress = await window.VTApi.call('GET', '/me/goal-progress');
    } catch {
      progress = { raised: 0, count: 0 };
    }
    renderGoal();
  }
  $('dsGoalReset').addEventListener('click', () => {
    if (!window.confirm('Reset dữ liệu mục tiêu? Tiến độ sẽ tính lại từ 0 kể từ bây giờ (sau khi bấm Cập nhật).')) return;
    form.goal.resetAt = new Date().toISOString();
    progress = { raised: 0, count: 0 };
    refresh();
    renderGoal();
  });
  $('dsGoalDemo').addEventListener('click', () => {
    const before = progress;
    goalView.update(form.goal, before.raised + Math.max(10000, Math.round(form.goal.targetAmount * 0.15)), before.count + 1);
    setTimeout(() => goalView.update(form.goal, before.raised, before.count), 3500);
  });
  function syncGoalUrl() {
    $('dsGoalUrl').value = obsUrl.value ? obsUrl.value.replace('/overlay#', '/goal#') : '';
    $('dsMusicUrl').value = obsUrl.value ? obsUrl.value.replace('/overlay#', '/music#') : '';
  }
  $('dsGoalCopy').addEventListener('click', async () => {
    const v = $('dsGoalUrl').value;
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      $('dsStatus').textContent = 'Đã sao chép link mục tiêu.';
    } catch {
      $('dsGoalUrl').select();
    }
  });

  // ---- Phát nhạc ----
  let musicTabOpen = false;
  let queue = [];
  const musicView = window.VTMusic.mount($('dsMusicPreview'));
  const SAMPLE_SONG = { videoId: 'dQw4w9WgXcQ', title: 'Bài hát ví dụ', author: 'Kênh nhạc', donorName: 'VT Page', amount: 50000 };
  function renderMusic() {
    if (!form) return;
    const playing = queue.find((q) => q.status === 'playing');
    const waiting = queue.filter((q) => q.status === 'queued');
    musicView.render({
      template: form.music.template,
      opacity: form.music.opacity,
      item: playing || (waiting.length ? null : SAMPLE_SONG),
      elapsed: 89,
      total: 210,
      queueCount: waiting.length,
      idleTitle: form.music.idleTitle,
      idleText: form.music.idleText,
      displayText: form.music.displayText,
    });
    const list = $('dsQueue');
    list.textContent = '';
    for (const item of queue.filter((q) => q.status === 'playing' || q.status === 'queued')) {
      const li = document.createElement('li');
      if (item.status === 'playing') li.className = 'is-playing';
      const img = document.createElement('img');
      img.src = window.VTMusic.thumb(item.videoId);
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      const text = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('small');
      meta.textContent = (item.status === 'playing' ? 'Đang phát · ' : 'Chờ · ') + item.donorName + ' · ' + new Intl.NumberFormat('vi-VN').format(item.amount) + 'đ';
      text.append(title, meta);
      li.append(img, text);
      list.append(li);
    }
    $('dsQueueEmpty').hidden = list.childElementCount > 0;
    $('dsSkip').disabled = list.childElementCount === 0;
  }
  async function loadQueue() {
    try {
      queue = (await window.VTApi.call('GET', '/me/music-queue')).items;
    } catch {
      queue = [];
    }
    renderMusic();
  }
  setInterval(() => {
    if (musicTabOpen && !document.hidden) void loadQueue();
  }, 5000);
  $('dsSkip').addEventListener('click', async () => {
    try {
      await window.VTApi.call('POST', '/me/music-queue/skip');
      $('dsStatus').textContent = 'Đã qua bài — trình phát trên OBS chuyển bài trong vài giây.';
    } catch (err) {
      showSaveError(err.message);
    }
    void loadQueue();
  });
  $('dsMusicCopy').addEventListener('click', async () => {
    const v = $('dsMusicUrl').value;
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      $('dsStatus').textContent = 'Đã sao chép link phát nhạc.';
    } catch {
      $('dsMusicUrl').select();
    }
  });

  // ---- Tải ban đầu ----
  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
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
