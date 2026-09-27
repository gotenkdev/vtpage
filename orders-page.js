/*
 * Trang Đơn hàng của trang (/orders): mọi lệnh donate đã tạo (chưa trả, đã trả, hết hạn, hủy) và khoản chuyển không có mã (cần đối soát).
 * Thống kê, tìm theo tên/mã, lọc trạng thái, xuất CSV, xem chi tiết. Dữ liệu người donate vào trang bằng textContent.
 */
(function () {
  'use strict';
  const root = document.getElementById('ordersContent');
  if (!root || !window.VTApi) return;
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const p2 = (n) => String(n).padStart(2, '0');
  const stamp = (iso) => {
    const d = new Date(iso);
    return [p2(d.getHours()) + ':' + p2(d.getMinutes()), p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear()];
  };
  const fullTime = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  };
  const STATUS = {
    pending: ['Chưa thanh toán', 'is-wait'],
    paid: ['Đã thanh toán', 'is-good'],
    review: ['Cần đối soát', 'is-warn'],
    expired: ['Hết hạn', 'is-off'],
    cancelled: ['Đã hủy', 'is-off'],
  };
  const orderNo = (o) => (o.code ? '#' + o.code : '#' + o.id.slice(0, 8).toUpperCase());
  const kindLabel = (o) => (o.kind === 'music' ? 'Yêu cầu nhạc' : 'Donate');
  const method = (o) => 'Ngân hàng (QR Code) - SePay' + (o.bankCode ? ' · ' + o.bankCode + ' ••' + o.accountLast4 : '');
  const isPaid = (o) => o.status === 'paid' || o.status === 'review';

  let orders = [];
  let loadedAt = 0;

  async function load() {
    orders = (await window.VTApi.call('GET', '/me/payment-orders?limit=500')).orders;
    loadedAt = Date.now();
    render();
  }
  setInterval(() => {
    if (!loadedAt) return;
    const s = Math.round((Date.now() - loadedAt) / 1000);
    $('odLoaded').textContent = 'Đã tải ' + (s < 60 ? s + ' giây' : Math.floor(s / 60) + ' phút') + ' trước';
  }, 1000);

  const search = $('odSearch');
  const status = $('odStatus');
  [search, status].forEach((el) => el.addEventListener('input', render));
  $('odRefresh').addEventListener('click', () => void load().catch((err) => window.alert(err.message)));

  function filtered() {
    const q = search.value.trim().toLowerCase().replace(/^#/, '');
    return orders.filter(
      (o) =>
        (status.value === 'all' || o.status === status.value) &&
        (!q || o.donorName.toLowerCase().includes(q) || orderNo(o).toLowerCase().includes(q)),
    );
  }

  function render() {
    const rows = filtered();
    const paid = rows.filter(isPaid);
    $('odPaid').textContent = String(paid.length);
    $('odPending').textContent = String(rows.filter((o) => o.status === 'pending').length);
    $('odValue').textContent = money(paid.reduce((sum, o) => sum + (o.paidAmount ?? o.amount), 0));
    const list = $('orderList');
    list.textContent = '';
    for (const o of rows) {
      const tr = document.createElement('div');
      tr.className = 'od-tr';
      tr.setAttribute('role', 'row');
      const [clock, day] = stamp(o.createdAt);
      tr.append(
        pair('od-id', orderNo(o), clock + ' ' + day),
        pair('od-who', o.donorName, kindLabel(o)),
        pair('od-money', money(o.paidAmount ?? o.amount), method(o)),
      );
      const st = cell('od-status');
      st.append(badge(o.status));
      const act = cell('dh-act');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline btn-sm';
      btn.textContent = 'Chi tiết';
      btn.addEventListener('click', () => openDetail(o));
      act.append(btn);
      tr.append(st, act);
      list.append(tr);
    }
    $('orderEmpty').hidden = rows.length > 0;
  }
  function cell(cls) {
    const c = document.createElement('span');
    c.className = cls;
    c.setAttribute('role', 'cell');
    return c;
  }
  function pair(cls, main, sub) {
    const c = cell(cls);
    const b = document.createElement('strong');
    b.textContent = main;
    const s = document.createElement('span');
    s.textContent = sub;
    c.append(b, s);
    return c;
  }
  function badge(st) {
    const t = document.createElement('span');
    t.className = 'dh-tag ' + STATUS[st][1];
    t.textContent = STATUS[st][0];
    return t;
  }

  // ---- Chi tiết ----
  const dialog = $('odDialog');
  $('odClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  function openDetail(o) {
    const box = $('odDetail');
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
      ['Mã đơn hàng', orderNo(o)],
      ['Ngày tạo', fullTime(o.createdAt)],
      ['Tình trạng', badge(o.status)],
      ['Loại đơn', kindLabel(o)],
    ]);
    section('Thông tin khách hàng', [
      ['Tên hiển thị', o.donorName],
      ['Lời nhắn', o.message],
      ...(o.kind === 'music' ? [['Bài nhạc', o.musicTitle]] : []),
    ]);
    section('Thanh toán', [
      ['Phương thức', method(o)],
      ['Số tiền đơn', o.code ? money(o.amount) : null],
      ['Đã nhận', o.paidAmount === null ? null : money(o.paidAmount)],
      ['Phí', '0đ'],
    ]);
    if (o.status === 'review') {
      const note = document.createElement('p');
      note.className = 'pe-sub';
      note.textContent = o.code
        ? 'Số tiền nhận được lệch so với đơn. Vào Lịch sử donate để chọn hiện lên live hoặc ẩn.'
        : 'Khoản chuyển không có mã đối soát. Vào Lịch sử donate để chọn hiện lên live hoặc ẩn.';
      box.append(note);
    }
    dialog.showModal();
  }

  // ---- Xuất CSV (mở được bằng Excel: có BOM UTF-8; chặn công thức ở ô bắt đầu bằng = + - @) ----
  $('odExport').addEventListener('click', () => {
    const esc = (v) => {
      let s = v === null || v === undefined ? '' : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const lines = [['Mã đơn hàng', 'Thời gian', 'Khách hàng', 'Loại đơn', 'Số tiền đơn', 'Đã nhận', 'Thanh toán', 'Trạng thái', 'Lời nhắn']];
    for (const o of filtered()) {
      lines.push([orderNo(o), fullTime(o.createdAt), o.donorName, kindLabel(o), o.amount, o.paidAmount, method(o), STATUS[o.status][0], o.message]);
    }
    const csv = '﻿' + lines.map((l) => l.map(esc).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'vtpay-don-hang-' + fullTime(new Date().toISOString()).slice(0, 10) + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = '/sign-in';
        return;
      }
      await load();
      $('odLoading').hidden = true;
      root.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      $('settingsSubtitle').textContent = 'Không tải được. Hãy tải lại trang.';
    });
})();
