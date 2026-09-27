/*
 * Trang Bảng xếp hạng (/leaderboard): cài đặt widget (mẫu, thời gian, số lượng, số tiền) ghi vào link OBS, top người ủng hộ theo
 * Hôm nay / Tháng này / Tất cả, khung Xem trước (dữ liệu thật hoặc dữ liệu mẫu). Tên người donate vào trang bằng textContent.
 */
(function () {
  'use strict';
  const root = document.getElementById('lbContent');
  if (!root || !window.VTApi || !window.VTTop) return;
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const PREF = 'vtp-top-widget';
  let token = null;
  let sample = false;
  const cache = {};

  // Nhớ lựa chọn trên máy này (chỉ để tiện; link mới là nơi lưu thật).
  try {
    const saved = JSON.parse(localStorage.getItem(PREF) || '{}');
    for (const [id, key] of [['lbType', 'type'], ['lbTime', 'time'], ['lbLimit', 'limit'], ['lbAmount', 'amount']]) {
      if (saved[key] !== undefined) $(id).value = String(saved[key]);
    }
  } catch {
    // bỏ qua
  }
  function opts() {
    const limit = Math.min(50, Math.max(1, parseInt($('lbLimit').value, 10) || 10));
    return { type: $('lbType').value, time: $('lbTime').value, limit, amount: $('lbAmount').value };
  }

  async function board(period) {
    if (!cache[period]) {
      cache[period] = window.VTApi.call('GET', '/me/leaderboard?period=' + period + '&limit=50').then((r) => r.leaderboard);
      cache[period].catch(() => delete cache[period]);
    }
    return cache[period];
  }

  async function renderPreview() {
    const o = opts();
    try {
      localStorage.setItem(PREF, JSON.stringify(o));
    } catch {
      // bỏ qua
    }
    const rows = sample ? window.VTTop.sample(o.limit) : (await board(o.time)).slice(0, o.limit);
    window.VTTop.render($('lbPreview'), rows, { type: o.type, amount: o.amount === 'yes' });
    const q = 'type=' + o.type + '&time=' + o.time + '&limit=' + o.limit + '&amount=' + o.amount;
    $('lbUrl').value = token ? location.origin + '/top?' + q + '#token=' + token : '';
    $('lbCopy').disabled = !token;
  }
  ['lbType', 'lbTime', 'lbLimit', 'lbAmount'].forEach((id) => $(id).addEventListener('input', () => void renderPreview()));
  $('lbLimit').addEventListener('change', () => ($('lbLimit').value = String(opts().limit)));

  $('lbSample').addEventListener('click', (e) => {
    sample = !sample;
    e.currentTarget.setAttribute('aria-pressed', String(sample));
    e.currentTarget.textContent = sample ? 'Dùng dữ liệu thật' : 'Tạo dữ liệu mẫu';
    void renderPreview();
  });

  $('lbCopy').addEventListener('click', async () => {
    const btn = $('lbCopy');
    try {
      await navigator.clipboard.writeText($('lbUrl').value);
      btn.textContent = 'Đã chép';
    } catch {
      $('lbUrl').select();
      btn.textContent = 'Nhấn Ctrl+C';
    }
    setTimeout(() => (btn.textContent = 'Sao chép'), 2000);
  });

  // ---- Top người ủng hộ ----
  async function renderList(period) {
    root.querySelectorAll('.lb-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === period)));
    const list = $('lbList');
    let rows = [];
    try {
      rows = await board(period);
    } catch (err) {
      $('lbEmpty').textContent = err.message;
    }
    list.textContent = '';
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      if (i < 3) li.className = 'is-top is-top-' + (i + 1);
      const no = document.createElement('span');
      no.className = 'lb-no';
      no.textContent = i < 3 ? '♛' : String(i + 1);
      no.setAttribute('aria-label', 'Hạng ' + (i + 1));
      const name = document.createElement('strong');
      name.textContent = r.name;
      const total = document.createElement('span');
      total.className = 'lb-total';
      total.textContent = money(r.total);
      li.append(no, name, total);
      list.append(li);
    });
    $('lbEmpty').hidden = rows.length > 0;
  }
  root.querySelectorAll('.lb-seg button').forEach((b) => b.addEventListener('click', () => void renderList(b.dataset.period)));

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      const res = await window.VTApi.call('GET', '/me/overlay-token');
      token = res.token && res.token.token ? res.token.token : null;
      $('lbUrlNote').hidden = token !== null;
      await Promise.all([renderList('all'), renderPreview()]);
      $('lbLoading').hidden = true;
      root.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
