/*
 * Thiết lập hồ sơ trang (/profile) theo kiểu VT Page: ba thẻ (Diện mạo & giới thiệu / Phân loại & tags / Mạng xã hội),
 * bản xem trước cập nhật ngay khi gõ, thanh Hoàn tác / Cập nhật. auth.js tải hồ sơ rồi phát sự kiện 'vtp:profile'.
 * Mọi nội dung người dùng được đưa vào trang bằng textContent (không innerHTML) — xem đúng như chữ đã nhập.
 * Trên u.html file này chỉ cung cấp window.VTProfileMeta. DANH SÁCH phân loại/tags/mạng xã hội phải khớp backend (src/profiles/profile.schemas.ts).
 */
(function () {
  'use strict';
  const CATEGORIES = [
    ['', '— Chưa chọn —'],
    ['streamer', 'Streamer'],
    ['pro_gamer', 'Pro Gamer'],
    ['caster', 'Bình luận viên'],
    ['coser', 'Coser'],
    ['vlogger', 'Vlogger'],
    ['other', 'Khác'],
  ];
  const TAGS = [
    ['valorant', 'Valorant'], ['lol', 'Liên Minh Huyền Thoại'], ['minecraft', 'Minecraft'], ['tft', 'Đấu Trường Chân Lý'],
    ['free_fire', 'Free Fire'], ['talk', 'Tâm sự'], ['lien_quan', 'Liên Quân Mobile'], ['roblox', 'Roblox'],
    ['pubg_pc', 'PUBG PC'], ['gta_v', 'GTA V'], ['csgo', 'CS2 / CSGO'], ['singing', 'Hát'], ['pubg_mobile', 'PUBG Mobile'],
    ['play_together', 'Play Together'], ['naraka', 'Naraka: Bladepoint'], ['wild_rift', 'Tốc Chiến'], ['coaching', 'Huấn luyện'],
    ['dota_2', 'Dota 2'], ['call_of_duty', 'Call of Duty'], ['fortnite', 'Fortnite'], ['other', 'Khác'],
  ];
  const MAX_TAGS = 10;
  // prefix: phần hiển thị trước ô nhập; url(v): liên kết thật trên trang công khai (tên miền cố định).
  const SOCIALS = [
    { key: 'phone', label: 'Số điện thoại', prefix: '+84', max: 20, url: (v) => 'tel:+84' + v },
    { key: 'facebook', label: 'Facebook', prefix: 'facebook.com/', max: 120, url: (v) => 'https://facebook.com/' + v },
    { key: 'youtube', label: 'YouTube', prefix: 'youtube.com/', max: 120, url: (v) => 'https://youtube.com/' + v },
    { key: 'tiktok', label: 'TikTok', prefix: 'tiktok.com/', max: 120, url: (v) => 'https://tiktok.com/' + v },
    { key: 'telegram', label: 'Telegram', prefix: 't.me/', max: 120, url: (v) => 'https://t.me/' + v },
    { key: 'zalo', label: 'Zalo', prefix: 'zalo.me/', max: 120, url: (v) => 'https://zalo.me/' + v },
    { key: 'x', label: 'X', prefix: 'x.com/', max: 120, url: (v) => 'https://x.com/' + v },
  ];
  // Trang donate công khai (u.html) cũng dùng các danh sách này để hiện nhãn và liên kết.
  window.VTProfileMeta = { CATEGORIES, TAGS, SOCIALS };

  const root = document.getElementById('profileEditor');
  if (!root) return;

  const $ = (id) => document.getElementById(id);
  const nameInput = $('peName');
  const bioInput = $('peBio');
  const categorySelect = $('peCategory');
  const tagsBox = $('peTags');
  const socialsBox = $('peSocials');
  const saveBtn = $('peSave');
  const undoBtn = $('peUndo');
  const statusText = $('peStatus');

  let saved = null; // hồ sơ đã lưu trên máy chủ
  let images = { avatarUrl: null, coverUrl: null };

  // ---- Dựng các ô ----
  for (const [value, label] of CATEGORIES) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    categorySelect.append(option);
  }
  for (const [value, label] of TAGS) {
    const chip = document.createElement('label');
    chip.className = 'pe-tag';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = value;
    const text = document.createElement('span');
    text.textContent = label;
    chip.append(box, text);
    tagsBox.append(chip);
  }
  for (const s of SOCIALS) {
    const field = document.createElement('div');
    field.className = 'form-field';
    const label = document.createElement('label');
    label.htmlFor = 'peSocial-' + s.key;
    label.textContent = s.label;
    const row = document.createElement('div');
    row.className = 'pe-prefixed';
    const prefix = document.createElement('span');
    prefix.className = 'pe-prefix';
    prefix.textContent = s.prefix;
    const input = document.createElement('input');
    input.id = 'peSocial-' + s.key;
    input.dataset.social = s.key;
    input.maxLength = s.max;
    input.autocomplete = 'off';
    input.spellcheck = false;
    if (s.key === 'phone') input.inputMode = 'tel';
    row.append(prefix, input);
    field.append(label, row);
    socialsBox.append(field);
  }

  // ---- Thẻ ----
  const tabs = [1, 2, 3, 4].map((n) => ({ tab: $('peTab' + n), panel: $('pePanel' + n) }));
  const selectTab = (index) =>
    tabs.forEach(({ tab, panel }, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
    });
  tabs.forEach(({ tab }, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const next = (i + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      selectTab(next);
      tabs[next].tab.focus();
    });
  });

  // ---- Đọc / ghi form ----
  function readForm() {
    const socials = {};
    socialsBox.querySelectorAll('input[data-social]').forEach((input) => {
      const v = input.value.trim();
      if (v) socials[input.dataset.social] = v;
    });
    return {
      displayName: nameInput.value.replace(/\s+/g, ' ').trim(),
      bio: bioInput.value.trim(),
      category: categorySelect.value || null,
      tags: [...tagsBox.querySelectorAll('input:checked')].map((b) => b.value),
      socials,
    };
  }

  function fillForm(p) {
    nameInput.value = p.displayName || '';
    bioInput.value = p.bio || '';
    categorySelect.value = p.category || '';
    const tags = new Set(p.tags || []);
    tagsBox.querySelectorAll('input').forEach((b) => {
      b.checked = tags.has(b.value);
    });
    socialsBox.querySelectorAll('input[data-social]').forEach((input) => {
      input.value = (p.socials || {})[input.dataset.social] || '';
    });
    onChange();
  }

  const savedForm = () => ({
    displayName: saved.displayName,
    bio: saved.bio || '',
    category: saved.category || null,
    tags: saved.tags || [],
    socials: saved.socials || {},
  });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function onChange() {
    if (!saved) return;
    const form = readForm();
    $('peNameCount').textContent = [...nameInput.value].length + '/50';
    $('peBioCount').textContent = [...bioInput.value].length + '/1000';
    const tagCount = form.tags.length;
    $('peTagCount').textContent = tagCount + ' đã chọn';
    tagsBox.querySelectorAll('input:not(:checked)').forEach((b) => {
      b.disabled = tagCount >= MAX_TAGS;
    });
    const dirty = !same(normalizeForCompare(form), normalizeForCompare(savedForm()));
    saveBtn.disabled = !dirty || !form.displayName;
    undoBtn.disabled = !dirty;
    statusText.textContent = dirty ? 'Có thay đổi chưa lưu.' : 'Chưa có thay đổi.';
    renderPreview(form);
  }
  // Mạng xã hội: máy chủ chuẩn hóa (cắt https://, @...), nên so sánh theo tập khóa + giá trị thô là đủ cho nút lưu.
  const normalizeForCompare = (f) => ({ ...f, tags: [...f.tags].sort(), socials: Object.keys(f.socials).sort().map((k) => [k, f.socials[k]]) });

  root.addEventListener('input', onChange);
  root.addEventListener('change', onChange);

  // ---- Xem trước ----
  function initialOf(text) {
    return ([...(text || '?').trim()][0] || '?').toUpperCase();
  }
  function renderPreview(form) {
    const cover = $('pvCover');
    cover.style.backgroundImage = images.coverUrl ? 'url("' + images.coverUrl + '")' : '';
    cover.classList.toggle('is-empty', !images.coverUrl);
    const avatar = $('pvAvatar');
    avatar.textContent = '';
    if (images.avatarUrl) {
      const img = document.createElement('img');
      img.src = images.avatarUrl;
      img.alt = '';
      avatar.append(img);
    } else {
      avatar.textContent = initialOf(form.displayName || saved.username);
    }
    $('pvName').textContent = form.displayName || saved.username;
    $('pvHandle').textContent = '@' + saved.username;
    const chip = $('pvCategory');
    const cat = CATEGORIES.find(([v]) => v && v === form.category);
    chip.hidden = !cat;
    chip.textContent = cat ? cat[1] : '';
    $('pvBio').textContent = form.bio;
    const tagBox = $('pvTags');
    tagBox.textContent = '';
    for (const t of form.tags) {
      const span = document.createElement('span');
      span.textContent = '#' + (TAGS.find(([v]) => v === t) || [t, t])[1];
      tagBox.append(span);
    }
    const socialBox = $('pvSocials');
    socialBox.textContent = '';
    for (const s of SOCIALS) {
      if (!form.socials[s.key]) continue;
      const pill = document.createElement('span');
      pill.textContent = s.label;
      socialBox.append(pill);
    }
  }

  // ---- Lưu / hoàn tác ----
  function showSaveError(message) {
    const box = $('peSaveError');
    if (!message) {
      box.hidden = true;
      return;
    }
    $('peSaveErrorText').textContent = message;
    box.hidden = false;
  }

  undoBtn.addEventListener('click', () => {
    showSaveError('');
    fillForm(saved);
  });

  saveBtn.addEventListener('click', async () => {
    showSaveError('');
    const form = readForm();
    saveBtn.disabled = true;
    statusText.textContent = 'Đang lưu…';
    try {
      const result = await window.VTApi.call('PATCH', '/me/profile', form);
      saved = result.profile;
      fillForm(saved); // hiện giá trị đã chuẩn hóa (vd liên kết dán vào thành tên trang)
      statusText.textContent = 'Đã lưu lên trang.';
    } catch (err) {
      showSaveError(err.message);
      onChange();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!undoBtn.disabled) event.preventDefault();
  });

  // ---- Đường dẫn trang ----
  $('peCopy').addEventListener('click', async () => {
    const link = location.origin + '/' + saved.username;
    try {
      await navigator.clipboard.writeText(link);
      statusText.textContent = 'Đã sao chép ' + link;
    } catch {
      $('peUrl').select();
    }
  });

  // ---- Ảnh: lưu ngay khi chọn. Ảnh lớn được thu nhỏ trong trình duyệt để vừa giới hạn 2 MB của máy chủ. ----
  const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const MAX_BYTES = 2 * 1024 * 1024;

  async function shrink(file, maxWidth, maxHeight) {
    if (file.size <= MAX_BYTES) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob || blob.size > MAX_BYTES) throw new Error('Ảnh quá lớn, hãy chọn ảnh nhỏ hơn.');
    return blob;
  }

  function imageError(message) {
    const box = $('peImageError');
    box.hidden = !message;
    $('peImageErrorText').textContent = message || '';
  }

  function renderImages() {
    const coverImg = $('peCoverImg');
    coverImg.hidden = !images.coverUrl;
    if (images.coverUrl) coverImg.src = images.coverUrl;
    else coverImg.removeAttribute('src');
    $('peCoverRemove').hidden = !images.coverUrl;
    const avatarImg = $('peAvatarImg');
    const fallback = $('peAvatarFallback');
    avatarImg.hidden = !images.avatarUrl;
    fallback.hidden = !!images.avatarUrl;
    if (images.avatarUrl) avatarImg.src = images.avatarUrl;
    else fallback.textContent = initialOf(nameInput.value || saved.username);
    $('peAvatarRemove').hidden = !images.avatarUrl;
    renderPreview(readForm());
  }

  function wireImage(kind, inputId, removeId, box) {
    const input = $(inputId);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      imageError('');
      if (!IMAGE_TYPES.includes(file.type)) {
        imageError('Chỉ nhận ảnh PNG, JPEG hoặc WebP.');
        return;
      }
      statusText.textContent = 'Đang tải ảnh…';
      try {
        const body = await shrink(file, box[0], box[1]);
        const result = await window.VTApi.uploadImage('/me/' + kind, body);
        images[kind + 'Url'] = result[kind + 'Url'];
        renderImages();
        statusText.textContent = 'Đã lưu ảnh.';
      } catch (err) {
        imageError(err.message);
        statusText.textContent = '';
      }
    });
    $(removeId).addEventListener('click', async () => {
      if (!window.confirm(kind === 'cover' ? 'Xoá ảnh bìa?' : 'Xoá ảnh đại diện?')) return;
      imageError('');
      try {
        await window.VTApi.call('DELETE', '/me/' + kind);
        images[kind + 'Url'] = null;
        renderImages();
      } catch (err) {
        imageError(err.message);
      }
    });
  }
  wireImage('cover', 'peCoverInput', 'peCoverRemove', [3000, 1000]);
  wireImage('avatar', 'peAvatarInput', 'peAvatarRemove', [1024, 1024]);

  // ---- QR trang: ảnh do máy chủ tạo, lưu về máy bằng blob (tên tệp có username) ----
  async function saveQr() {
    const btn = $('peQrSave');
    btn.disabled = true;
    try {
      const res = await fetch($('peQrImg').src, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('qr');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vtpage-' + saved.username + '-qr.png';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      statusText.textContent = 'Đã lưu ảnh QR.';
    } catch {
      statusText.textContent = 'Không lưu được ảnh QR, hãy thử lại.';
    } finally {
      btn.disabled = false;
    }
  }
  $('peQrSave').addEventListener('click', () => void saveQr());
  $('peQrCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('peQrLink').value);
      statusText.textContent = 'Đã sao chép link trang.';
    } catch {
      $('peQrLink').select();
    }
  });

  // ---- Nhận hồ sơ từ auth.js ----
  window.addEventListener('vtp:profile', (event) => {
    saved = event.detail;
    images = { avatarUrl: saved.avatarUrl, coverUrl: saved.coverUrl };
    $('peUrlPrefix').textContent = location.host + '/';
    $('peUrl').value = saved.username;
    $('peOpenPage').href = '/' + encodeURIComponent(saved.username);
    $('peQrImg').src = '/api/v1/profiles/' + encodeURIComponent(saved.username) + '/qr.png';
    $('peQrLink').value = location.origin + '/' + saved.username;
    root.hidden = false;
    fillForm(saved);
    renderImages();
  });
})();
