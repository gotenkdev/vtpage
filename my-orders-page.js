/*
 * Đơn hàng cá nhân (/my-orders): các lệnh donate CHÍNH người đang đăng nhập đã tạo. Tìm theo tên trang/mã đơn, lọc trạng thái, sắp xếp,
 * phân trang 8 đơn/trang, xem chi tiết. Dữ liệu (tên, lời nhắn) vào trang bằng textContent.
 */
(function () {
  'use strict';
  const root = document.getElementById('myOrdersContent');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
  const p2 = (n) => String(n).padStart(2, '0');
  const day = (iso) => { const d = new Date(iso); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear(); };
  const clock = (iso) => { const d = new Date(iso); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  const STATUS = {
    pending: ['Chưa thanh toán', 'is-wait', 1],
    paid: ['Đã thanh toán', 'is-good', 0],
    review: ['Đã thanh toán, cần đối soát', 'is-warn', 2],
    expired: ['Hết hạn', 'is-off', 3],
    cancelled: ['Đã hủy', 'is-off', 4],
  };
  const METHOD = 'Ngân hàng (QR Code) - SePay';
  const PAGE = 8;
  const pageName = (o) => o.streamer.name || (o.streamer.username ? '@' + o.streamer.username : 'Trang đã xóa');
  const kindLabel = (o) => (o.kind === 'music' ? 'Yêu cầu nhạc' : 'Donate');
  let orders = [];
  let page = 0;

  async function load() {
    orders = (await window.VTApi.call('GET', '/me/donor-orders?limit=500')).orders;
    page = 0;
    render();
  }
  const search = $('moSearch');
  const status = $('moStatus');
  const sort = $('moSort');
  [search, status, sort].forEach((e) => e.addEventListener('input', () => { page = 0; render(); }));
  $('moRefresh').addEventListener('click', () => void load().catch((err) => window.alert(err.message)));
  $('moPrev').addEventListener('click', () => { page -= 1; render(); });
  $('moNext').addEventListener('click', () => { page += 1; render(); });

  function filtered() {
    const q = search.value.trim().toLowerCase().replace(/^#/, '');
    const rows = orders.filter(
      (o) =>
        (status.value === 'all' || o.status === status.value) &&
        (!q || pageName(o).toLowerCase().includes(q) || (o.streamer.username || '').toLowerCase().includes(q) || o.code.toLowerCase().includes(q)),
    );
    const by = {
      'time-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
      'time-asc': (a, b) => a.createdAt.localeCompare(b.createdAt),
      'amount-desc': (a, b) => b.amount - a.amount,
      'amount-asc': (a, b) => a.amount - b.amount,
      status: (a, b) => STATUS[a.status][2] - STATUS[b.status][2],
    }[sort.value];
    return rows.sort(by);
  }

  function cell(cls) {
    const c = document.createElement('span');
    c.className = cls;
    c.setAttribute('role', 'cell');
    return c;
  }
  function badge(st) {
    const t = document.createElement('span');
    t.className = 'dh-tag ' + STATUS[st][1];
    t.textContent = STATUS[st][0];
    return t;
  }
  function avatar(o) {
    if (o.streamer.avatarUrl) {
      const img = document.createElement('img');
      img.className = 'mo-ava';
      img.src = o.streamer.avatarUrl;
      img.alt = '';
      return img;
    }
    const a = document.createElement('span');
    a.className = 'mo-ava';
    a.textContent = pageName(o).replace('@', '').slice(0, 1).toUpperCase();
    return a;
  }

  function render() {
    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE));
    page = Math.min(Math.max(page, 0), pages - 1);
    const list = $('moList');
    list.textContent = '';
    for (const o of rows.slice(page * PAGE, page * PAGE + PAGE)) {
      const tr = document.createElement('div');
      tr.className = 'mo-tr';
      tr.setAttribute('role', 'row');
      const id = cell('mo-id');
      const txt = document.createElement('span');
      const name = document.createElement(o.streamer.username ? 'a' : 'strong');
      if (o.streamer.username) { name.href = '/' + encodeURIComponent(o.streamer.username); name.target = '_blank'; name.rel = 'noopener'; }
      name.textContent = pageName(o);
      const code = document.createElement('small');
      code.textContent = '#' + o.code;
      txt.append(name, code);
      id.append(avatar(o), txt);
      const when = cell('mo-time');
      when.append(day(o.createdAt), document.createElement('br'), clock(o.createdAt));
      const kind = cell('mo-kind');
      const k = document.createElement('strong');
      k.textContent = kindLabel(o);
      const m = document.createElement('small');
      m.textContent = METHOD;
      kind.append(k, m);
      const amount = cell('mo-num');
      amount.textContent = money(o.paidAmount ?? o.amount);
      const st = cell('mo-status');
      st.append(badge(o.status));
      const act = cell('dh-act');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline btn-sm mo-go';
      btn.setAttribute('aria-label', 'Chi tiết đơn ' + o.code);
      btn.textContent = '→';
      btn.addEventListener('click', () => openDetail(o));
      act.append(btn);
      tr.append(id, when, kind, amount, st, act);
      list.append(tr);
    }
    $('moEmpty').hidden = rows.length > 0;
    $('moCount').textContent = orders.length + ' đơn';
    $('moPager').hidden = rows.length <= PAGE;
    $('moPageInfo').textContent = rows.length + ' kết quả · Trang ' + (page + 1) + ' / ' + pages;
    $('moPrev').disabled = page === 0;
    $('moNext').disabled = page >= pages - 1;
  }

  // ---- Chi tiết ----
  const dialog = $('moDialog');
  $('moClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  function openDetail(o) {
    const box = $('moDetail');
    box.textContent = '';
    const section = (title, items) => {
      const h = document.createElement('h3');
      h.className = 'od-sub';
      h.textContent = title;
      const dl = document.createElement('dl');
      for (const [k, v] of items) {
        const dt = document.createElement('dt');
        dt.textContent = k;
        const dd = document.createElement('dd');
        if (v instanceof Node) dd.append(v);
        else dd.textContent = v === null || v === undefined || v === '' ? '—' : String(v);
        dl.append(dt, dd);
      }
      box.append(h, dl);
    };
    section('Đơn hàng', [
      ['Mã đơn hàng', '#' + o.code],
      ['Ngày tạo', day(o.createdAt) + ' ' + clock(o.createdAt)],
      ['Tình trạng', badge(o.status)],
      ['Loại đơn', kindLabel(o)],
    ]);
    section('Trang nhận', [
      ['Tên trang', pageName(o)],
      ['Địa chỉ', o.streamer.username ? 'vtpay.vn/' + o.streamer.username : null],
    ]);
    section('Nội dung gửi kèm', [
      ['Tên hiển thị', o.donorName],
      ['Lời nhắn', o.message],
      ...(o.kind === 'music' ? [['Bài nhạc', o.musicTitle]] : []),
    ]);
    section('Thanh toán', [
      ['Phương thức', METHOD],
      ['Số tiền đơn', money(o.amount)],
      ['Đã chuyển', o.paidAmount === null ? null : money(o.paidAmount)],
    ]);
    if (o.status === 'review') {
      const note = document.createElement('p');
      note.className = 'pe-sub';
      note.textContent = 'Tiền đã về tài khoản streamer nhưng số tiền lệch so với đơn, nên chờ streamer xem trước khi hiện lên live.';
      box.append(note);
    }
    dialog.showModal();
  }

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      await load();
      $('moLoading').hidden = true;
      root.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
