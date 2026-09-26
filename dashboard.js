/*
 * Khung "Thiết lập trang" kiểu Zypage cho các trang cài đặt (body[data-dash]). Chỉ dựng thanh bên + đầu trang và bọc <main class="settings">
 * sẵn có; mọi chức năng của từng trang vẫn do auth.js xử lý như cũ.
 * THÊM MỤC: thêm vào PAGES (tiêu đề/mô tả) và vào DONATE_ITEMS hoặc PERSONAL_ITEMS.
 */
(function () {
  'use strict';
  const current = document.body.dataset.dash;
  const main = document.querySelector('main.settings');
  if (!current || !main) return;

  const PAGES = {
    profile: { group: 'Trang donate', title: 'Hồ sơ trang', desc: 'Tên hiển thị, ảnh đại diện và lời giới thiệu hiện trên trang donate của bạn.' },
    bank: { group: 'Trang donate', title: 'Ngân hàng nhận tiền', desc: 'Tiền donate vào thẳng tài khoản này. Tài khoản mới cần được duyệt trước khi nhận tiền.' },
    donations: { group: 'Trang donate', title: 'Lịch sử donate', desc: 'Các khoản donate đã nhận. Duyệt hoặc ẩn khoản cần xem trước khi hiện lên stream.' },
    overlay: { group: 'Trang donate', title: 'Overlay OBS', desc: 'Địa chỉ dán vào OBS để hiện thông báo donate trên livestream.' },
    security: { group: 'Cá nhân', title: 'Tài khoản & bảo mật', desc: 'Xác thực 2 lớp, đổi mật khẩu và email đăng nhập.' },
  };

  const ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1-4 4.2-6 8-6s7 2 8 6"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    logout: '<path d="M14 4.5h4.5v15H14"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-9.9A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.9C19.5 15.6 12 20 12 20z"/>',
    profile: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="11" r="2.4"/><path d="M5.8 17c.6-1.8 1.8-2.8 3.2-2.8s2.6 1 3.2 2.8M14 10h4M14 13.5h3"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M4.5 9.5h15"/><path d="M6.5 10v7M10.5 10v7M13.5 10v7M17.5 10v7"/><path d="M3.5 19.5h17"/>',
    list: '<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4" cy="6.5" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="17.5" r="1"/>',
    screen: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20h7M12 16.5V20"/>',
    plug: '<path d="M9 3.5v5M15 3.5v5"/><path d="M6.5 8.5h11V12a5.5 5.5 0 0 1-11 0z"/><path d="M12 17.5v3"/>',
    eye: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>',
    chev: '<path d="m7 10 5 5 5-5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  };
  const svg = (name, cls = 'dash-ic') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const DONATE_ITEMS = [
    { id: 'profile', label: 'Hồ sơ trang', href: 'profile.html', icon: 'profile' },
    { id: 'bank', label: 'Ngân hàng', href: 'bank-account.html', icon: 'bank' },
    { id: 'donations', label: 'Lịch sử donate', href: 'donations.html', icon: 'list' },
    { id: 'overlay', label: 'Overlay OBS', href: 'overlay-settings.html', icon: 'screen' },
    { id: 'sepay', label: 'Kết nối SePay', icon: 'plug', soon: true },
  ];
  const PERSONAL_ITEMS = [{ id: 'security', label: 'Tài khoản & bảo mật', href: 'security.html', icon: 'shield' }];

  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (html !== undefined) node.innerHTML = html;
    return node;
  }
  function link(item) {
    const a = el(item.soon ? 'span' : 'a', { class: 'dash-link' + (item.soon ? ' is-soon' : '') });
    if (!item.soon) a.setAttribute('href', item.href);
    if (item.id === current) a.setAttribute('aria-current', 'page');
    a.innerHTML = svg(item.icon);
    const label = el('span', { class: 'grow' });
    label.textContent = item.label;
    a.append(label);
    if (item.soon) a.append(Object.assign(el('span', { class: 'dash-pill' }), { textContent: 'sắp có' }));
    return a;
  }

  // ---- Thanh bên ----
  const side = el('aside', { class: 'dash-side', 'aria-label': 'Thiết lập' });
  side.append(Object.assign(el('div', { class: 'dash-group-title' }), { textContent: 'Cá nhân' }));
  PERSONAL_ITEMS.forEach((i) => side.append(link(i)));
  const logout = el('button', { class: 'dash-link', type: 'button' }, svg('logout') + '<span class="grow">Đăng xuất</span>');
  logout.addEventListener('click', async () => {
    try {
      await window.VTApi.call('POST', '/auth/logout');
    } finally {
      window.location.href = 'index.html';
    }
  });
  side.append(logout);

  side.append(Object.assign(el('div', { class: 'dash-group-title' }), { textContent: 'Quản lý trang' }));
  const card = el('div', { class: 'dash-page-card' });
  const cardLink = el('a', { class: 'dash-page-main', href: 'profile.html' });
  const avatar = el('span', { class: 'dash-avatar', 'aria-hidden': 'true' });
  const meta = el('span', { class: 'dash-page-meta' });
  const name = el('strong');
  const handle = el('span');
  name.textContent = 'Đang tải…';
  meta.append(name, handle);
  cardLink.append(avatar, meta);
  card.append(cardLink);
  side.append(card);

  const toggle = el('button', { class: 'dash-link dash-toggle', type: 'button', 'aria-expanded': 'true' });
  toggle.innerHTML = svg('heart') + '<span class="grow">Trang donate</span>' + svg('chev', 'dash-ic dash-chev');
  const sub = el('div', { class: 'dash-sub' });
  DONATE_ITEMS.forEach((i) => sub.append(link(i)));
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    sub.hidden = !open;
  });
  side.append(toggle, sub);

  // ---- Đầu trang ----
  const info = PAGES[current] || { group: '', title: document.title, desc: '' };
  const head = el('header', { class: 'dash-head' });
  const left = el('div');
  const menuBtn = el('button', { class: 'dash-menu-btn', type: 'button' }, svg('menu') + 'Menu thiết lập');
  const crumbs = el('div', { class: 'dash-crumbs' });
  crumbs.textContent = info.group ? `Thiết lập · ${info.group}` : 'Thiết lập';
  const h1 = el('h1');
  h1.textContent = info.title;
  const p = el('p');
  p.textContent = info.desc;
  left.append(menuBtn, crumbs, h1, p);
  head.append(left);
  if (info.group === 'Trang donate') {
    const tabs = el('nav', { class: 'dash-tabs', 'aria-label': 'Trang donate' });
    DONATE_ITEMS.filter((i) => !i.soon).forEach((i) => {
      const a = el('a', { href: i.href });
      a.textContent = i.label;
      if (i.id === current) a.setAttribute('aria-current', 'page');
      tabs.append(a);
    });
    head.append(tabs);
  }

  // ---- Lắp khung quanh <main> sẵn có ----
  const dash = el('div', { class: 'dash' });
  const content = el('div', { class: 'dash-main' });
  const scrim = el('div', { class: 'dash-scrim' });
  main.replaceWith(dash);
  content.append(head, main);
  dash.append(side, scrim, content);
  menuBtn.addEventListener('click', () => dash.classList.add('is-open'));
  scrim.addEventListener('click', () => dash.classList.remove('is-open'));

  // ---- Thẻ trang: tên, @username, ảnh, nút xem trang ----
  window.VTApi.call('GET', '/me/profile')
    .then(({ profile }) => {
      if (!profile) {
        name.textContent = 'Chưa có trang';
        handle.textContent = 'Tạo hồ sơ để nhận donate';
        avatar.textContent = '+';
        return;
      }
      name.textContent = profile.displayName || profile.username;
      handle.textContent = '@' + profile.username;
      if (profile.avatarUrl) {
        const img = el('img', { class: 'dash-avatar', src: profile.avatarUrl, alt: '' });
        avatar.replaceWith(img);
      } else {
        avatar.textContent = (profile.displayName || profile.username).slice(0, 1).toUpperCase();
      }
      const view = el('a', { class: 'dash-view', href: '/' + encodeURIComponent(profile.username), title: 'Xem trang donate', 'aria-label': 'Xem trang donate', target: '_blank', rel: 'noopener' }, svg('eye', 'dash-ic'));
      card.append(view);
    })
    .catch(() => {
      name.textContent = 'Trang của bạn';
    });
})();
