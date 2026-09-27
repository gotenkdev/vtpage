/*
 * Trang Lịch sử donate (/donations): tìm kiếm, lọc loại + số tiền tối thiểu, làm mới / tự tải lại mỗi 10 giây, điều khiển live
 * (tắt donate đang phát, tắt nhạc, dừng/phát nhạc), chặn / bỏ chặn tên người donate, và duyệt donate cần xem.
 * Dữ liệu người donate (tên, lời nhắn) vào trang bằng textContent.
 */
(function () {
  'use strict';
  const root = document.getElementById('donationsContent');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const time = (iso) => {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return [d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())];
  };

  let donations = [];
  let settings = null;
  let loadedAt = 0;
  const blockedSet = () => new Set((settings ? settings.other.blockedDonors : []).map((n) => n.toLowerCase()));

  // ---- Tải dữ liệu ----
  async function load() {
    const [list, conf] = await Promise.all([
      window.VTApi.call('GET', '/me/donations?limit=100'),
      window.VTApi.call('GET', '/me/donate-settings'),
    ]);
    donations = list.donations;
    settings = conf.settings;
    loadedAt = Date.now();
    render();
  }
  setInterval(() => {
    if (!loadedAt) return;
    const s = Math.round((Date.now() - loadedAt) / 1000);
    $('dhLoaded').textContent = 'Đã tải ' + (s < 60 ? s + ' giây' : Math.floor(s / 60) + ' phút') + ' trước';
  }, 1000);

  // ---- Bộ lọc ----
  const search = $('dhSearch');
  const type = $('dhType');
  const min = $('dhMin');
  [search, type, min].forEach((el) => el.addEventListener('input', render));
  $('dhRefresh').addEventListener('click', () => void load().catch(() => undefined));
  let autoTimer = null;
  $('dhAuto').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-checked') !== 'true';
    e.currentTarget.setAttribute('aria-checked', String(on));
    clearInterval(autoTimer);
    if (on) autoTimer = setInterval(() => !document.hidden && void load().catch(() => undefined), 10000);
  });

  // ---- Bảng ----
  const REVIEW = { pending: 'Chờ bạn xem', approved: 'Đã duyệt', hidden: 'Đã ẩn' };
  function render() {
    $('dhMinOut').textContent = money(Number(min.value));
    const q = search.value.trim().toLowerCase();
    const blocked = blockedSet();
    const rows = donations.filter(
      (d) =>
        d.amount >= Number(min.value) &&
        (type.value === 'all' || d.kind === type.value) &&
        (!q || d.donorName.toLowerCase().includes(q) || (d.message || '').toLowerCase().includes(q)),
    );
    const list = $('donationList');
    list.textContent = '';
    for (const d of rows) {
      const tr = document.createElement('div');
      tr.className = 'dh-tr';
      tr.setAttribute('role', 'row');
      const isBlocked = blocked.has(d.donorName.toLowerCase());
      const user = cell('dh-user');
      const name = document.createElement('strong');
      name.textContent = d.donorName;
      user.append(name);
      if (d.needsReview) user.append(tag(REVIEW[d.reviewStatus] || '', 'is-wait'));
      if (isBlocked) user.append(tag('Đã chặn', 'is-off'));
      const amount = cell('dh-amount');
      const b = document.createElement('strong');
      b.textContent = money(d.amount);
      const kind = document.createElement('span');
      kind.textContent = d.kind === 'music' ? 'Yêu cầu nhạc' : 'Donate';
      amount.append(b, kind);
      const msg = cell('dh-msg');
      msg.textContent = d.message || '';
      const when = cell('dh-time');
      const [day, clock] = time(d.createdAt);
      when.append(day, document.createElement('br'), clock);
      const act = cell('dh-act');
      if (d.donorName !== 'Ẩn danh') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost btn-sm';
        btn.textContent = isBlocked ? 'Bỏ chặn' : 'Chặn';
        btn.addEventListener('click', () => void toggleBlock(d.donorName, !isBlocked, btn));
        act.append(btn);
      }
      tr.append(user, amount, msg, when, act);
      list.append(tr);
    }
    $('donationEmpty').hidden = rows.length > 0;
    renderReview();
    renderBlocked();
  }
  function cell(cls) {
    const c = document.createElement('span');
    c.className = cls;
    c.setAttribute('role', 'cell');
    return c;
  }
  function tag(text, cls) {
    const t = document.createElement('span');
    t.className = 'dh-tag ' + cls;
    t.textContent = text;
    return t;
  }

  // ---- Chặn / bỏ chặn (lưu trong Cài đặt Donate → other.blockedDonors) ----
  async function toggleBlock(name, block, btn) {
    if (block && !window.confirm('Chặn "' + name + '"? Donate của tên này vẫn được ghi nhận nhưng không hiện lên live, không vào Gần đây và Bảng xếp hạng.')) return;
    if (btn) btn.disabled = true;
    try {
      const fresh = (await window.VTApi.call('GET', '/me/donate-settings')).settings;
      const list = fresh.other.blockedDonors.filter((n) => n.toLowerCase() !== name.toLowerCase());
      if (block) list.push(name);
      fresh.other.blockedDonors = list;
      settings = (await window.VTApi.call('PUT', '/me/donate-settings', fresh)).settings;
      render();
    } catch (err) {
      window.alert(err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  function renderBlocked() {
    const names = settings ? settings.other.blockedDonors : [];
    $('dhBlocked').hidden = names.length === 0;
    const box = $('dhBlockedList');
    box.textContent = '';
    for (const n of names) {
      const t = document.createElement('span');
      t.className = 'ds-tag';
      t.textContent = n;
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '×';
      x.setAttribute('aria-label', 'Bỏ chặn ' + n);
      x.addEventListener('click', () => void toggleBlock(n, false, x));
      t.append(x);
      box.append(t);
    }
  }

  // ---- Duyệt donate cần xem ----
  function renderReview() {
    const pending = donations.filter((d) => d.needsReview && d.reviewStatus === 'pending');
    $('reviewSection').hidden = pending.length === 0;
    const list = $('reviewList');
    list.textContent = '';
    for (const d of pending) {
      const row = document.createElement('div');
      row.className = 'bank-item';
      const info = document.createElement('div');
      info.className = 'bank-item-info';
      const title = document.createElement('div');
      title.className = 'bank-item-bank';
      title.textContent = d.donorName + ' · ' + money(d.amount);
      const meta = document.createElement('div');
      meta.className = 'bank-item-meta';
      meta.textContent = time(d.createdAt).join(' ') + (d.matchType === 'amount_mismatch' ? ' · lệch số tiền so với đơn' : ' · không có mã đối soát');
      info.append(title, meta);
      if (d.message) {
        const m = document.createElement('div');
        m.className = 'bank-item-meta';
        m.textContent = '“' + d.message + '”';
        info.append(m);
      }
      const actions = document.createElement('div');
      actions.className = 'settings-actions';
      for (const [decision, label, cls] of [['approve', 'Hiện lên live', 'btn btn-primary btn-sm'], ['hide', 'Ẩn', 'btn btn-ghost btn-sm']]) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = cls;
        btn.textContent = label;
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          $('reviewError').hidden = true;
          try {
            await window.VTApi.call('POST', '/me/donations/' + d.id + '/review', { decision });
          } catch (err) {
            $('reviewErrorText').textContent = err.message;
            $('reviewError').hidden = false;
          }
          await load();
        });
        actions.append(btn);
      }
      row.append(info, actions);
      list.append(row);
    }
  }

  // ---- Điều khiển live ----
  root.querySelectorAll('[data-control]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const ok = $('dhControlOk');
      try {
        if (btn.dataset.control === 'skip_music') {
          const r = await window.VTApi.call('POST', '/me/music-queue/skip');
          ok.textContent = r.skipped ? 'Đã tắt bài nhạc đang phát.' : 'Không có bài nhạc nào đang phát.';
        } else {
          await window.VTApi.call('POST', '/me/overlay-token/control', { action: btn.dataset.control });
          ok.textContent = btn.dataset.control === 'skip_alert' ? 'Đã tắt thông báo donate đang phát.' : 'Đã gửi lệnh dừng/phát nhạc.';
        }
      } catch (err) {
        ok.textContent = err.message;
      } finally {
        ok.hidden = false;
        btn.disabled = false;
        setTimeout(() => (ok.hidden = true), 4000);
      }
    }),
  );

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      await load();
      $('dhLoading').hidden = true;
      root.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
