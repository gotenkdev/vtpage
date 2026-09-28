/*
 * Khung "Thiết lập trang" kiểu VT Pay cho các trang cài đặt (body[data-dash]). Chỉ dựng thanh bên + đầu trang và bọc <main class="settings">
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
    bank: { group: 'Trang donate', title: 'Thanh toán', desc: 'Quản lý các kênh nhận donate. Tài khoản ngân hàng đầu tiên dùng được ngay; đổi tài khoản khác thì cần được duyệt.' },
    donations: { group: 'Trang donate', title: 'Lịch sử donate', desc: 'Các khoản donate đã nhận. Duyệt hoặc ẩn khoản cần xem trước khi hiện lên stream.' },
    top: { group: 'Trang donate', title: 'Bảng xếp hạng Donate', desc: 'Top người ủng hộ theo ngày, tháng, tất cả và widget hiển thị trên live.' },
    orders: { group: 'Trang donate', title: 'Đơn hàng của trang', desc: 'Mọi lệnh donate đã tạo và khoản đã nhận: tìm kiếm, xem chi tiết, xuất dữ liệu.' },
    overlay: { group: 'Trang donate', title: 'Cài đặt Donate', desc: 'Toàn bộ công cụ tương tác trên live: thông báo donate, âm thanh, giọng đọc, ghi âm, phát nhạc, mục tiêu.' },
    account: { group: 'Cá nhân', title: 'Hồ sơ cá nhân', desc: 'Một hồ sơ nhất quán cho mọi hoạt động của bạn trên VT Pay.' },
    myorders: { group: 'Cá nhân', title: 'Đơn hàng cá nhân', desc: 'Các lệnh donate bạn đã tạo: tìm kiếm, xem trạng thái và chi tiết.' },
    messages: { group: 'Cá nhân', title: 'Tin nhắn', desc: 'Trò chuyện giữa bạn và các trang, hoặc người xem nhắn cho trang của bạn.' },
    following: { group: 'Cá nhân', title: 'Đang theo dõi', desc: 'Các trang bạn đang theo dõi.' },
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
    receipt: '<path d="M6 3.5h12v17l-2.5-1.6-2 1.6-1.5-1.2-1.5 1.2-2-1.6L6 20.5z"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>',
    trophy: '<path d="M7.5 4.5h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6.5H4.5a3 3 0 0 0 3 4M16.5 6.5h3a3 3 0 0 1-3 4"/><path d="M12 14v3.5M8.5 20h7M9.5 17.5h5"/>',
    bag: '<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5z"/>',
    store: '<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5v8h13v-8"/><path d="M10 19.5v-4h4v4"/>',
  };
  const svg = (name, cls = 'dash-ic') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const DONATE_ITEMS = [
    { id: 'profile', label: 'Hồ sơ trang', href: '/profile', icon: 'profile' },
    { id: 'bank', label: 'Thanh toán', href: '/bank-account', icon: 'bank' },
    { id: 'top', label: 'Bảng xếp hạng', href: '/leaderboard', icon: 'trophy' },
    { id: 'donations', label: 'Lịch sử donate', href: '/donations', icon: 'list' },
    { id: 'orders', label: 'Đơn hàng', href: '/orders', icon: 'receipt' },
    { id: 'overlay', label: 'Cài đặt Donate', href: '/overlay-settings', icon: 'screen' },
  ];
  const ACTIVITY_ITEMS = [
    { id: 'myorders', label: 'Đơn hàng', href: '/my-orders', icon: 'bag' },
    { id: 'messages', label: 'Tin nhắn', href: '/messages', icon: 'chat', unread: true },
    { id: 'following', label: 'Đang theo dõi', href: '/my-following', icon: 'heart', count: true },
  ];
  const PERSONAL_ITEMS = [
    { id: 'account', label: 'Hồ sơ cá nhân', href: '/my-profile', icon: 'user' },
    { id: 'security', label: 'Tài khoản & bảo mật', href: '/security', icon: 'shield' },
  ];

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

  // ---- Thanh bên: hai thẻ Cá nhân / Trang (giống menu tài khoản ở đầu trang, kiểu VT Pay) ----
  const side = el('aside', { class: 'dash-side', 'aria-label': 'Thiết lập' });
  const tabBar = el('div', { class: 'acct-tabs', role: 'tablist', 'aria-label': 'Nhóm thiết lập' });
  const tabMe = el('button', { class: 'acct-tab', type: 'button', role: 'tab', 'aria-controls': 'dashPaneMe', id: 'dashTabMe' }, svg('user', 'acct-ic') + 'Cá nhân');
  const tabPage = el('button', { class: 'acct-tab', type: 'button', role: 'tab', 'aria-controls': 'dashPanePage', id: 'dashTabPage' }, svg('store', 'acct-ic') + 'Trang');
  tabBar.append(tabMe, tabPage);
  side.append(tabBar);

  // Thẻ Cá nhân dựng giống thẻ Trang: thẻ tài khoản ở đầu, rồi các nhóm mục.
  const paneMe = el('div', { class: 'dash-pane', id: 'dashPaneMe', role: 'tabpanel', 'aria-labelledby': 'dashTabMe' });
  const meCard = el('div', { class: 'dash-page-card' });
  const meLink = el('a', { class: 'dash-page-main', href: '/my-profile' });
  const meAvatar = el('span', { class: 'dash-avatar', 'aria-hidden': 'true' });
  const meMeta = el('span', { class: 'dash-page-meta' });
  const meName = el('strong');
  const meMail = el('span');
  meName.textContent = 'Đang tải…';
  meMeta.append(meName, meMail);
  meLink.append(meAvatar, meMeta);
  meCard.append(meLink);
  paneMe.append(meCard);
  paneMe.append(Object.assign(el('div', { class: 'dash-group-title' }), { textContent: 'Hoạt động cá nhân' }));
  let followCount = null;
  let unreadCount = null;
  ACTIVITY_ITEMS.forEach((i) => {
    const a = link(i);
    if (i.count) {
      followCount = el('span', { class: 'dash-count' });
      a.append(followCount);
    }
    if (i.unread) {
      unreadCount = el('span', { class: 'dash-count dash-unread' });
      a.append(unreadCount);
    }
    paneMe.append(a);
  });
  paneMe.append(Object.assign(el('div', { class: 'dash-group-title' }), { textContent: 'Tài khoản' }));
  PERSONAL_ITEMS.forEach((i) => paneMe.append(link(i)));
  const logout = el('button', { class: 'dash-link', type: 'button' }, svg('logout') + '<span class="grow">Đăng xuất</span>');
  logout.addEventListener('click', async () => {
    try {
      await window.VTApi.call('POST', '/auth/logout');
    } finally {
      window.location.href = '/';
    }
  });
  paneMe.append(logout);
  window.VTApi.call('GET', '/me/account-profile')
    .then(({ account }) => {
      meName.textContent = account.displayName || account.email.split('@')[0];
      meMail.textContent = account.email;
      if (account.avatarUrl) meAvatar.replaceWith(el('img', { class: 'dash-avatar', src: account.avatarUrl, alt: '' }));
      else meAvatar.textContent = (account.displayName || account.email).slice(0, 1).toUpperCase();
    })
    .catch(() => (meName.textContent = 'Tài khoản của bạn'));
  window.VTApi.call('GET', '/conversations')
    .then(({ unread }) => {
      if (unreadCount) unreadCount.textContent = unread > 0 ? String(unread) : '';
    })
    .catch(() => undefined);
  window.VTApi.call('GET', '/me/following')
    .then(({ following }) => {
      if (followCount) followCount.textContent = String(following.length);
    })
    .catch(() => undefined);

  const panePage = el('div', { class: 'dash-pane', id: 'dashPanePage', role: 'tabpanel', 'aria-labelledby': 'dashTabPage' });
  const card = el('div', { class: 'dash-page-card' });
  const cardLink = el('a', { class: 'dash-page-main', href: '/profile' });
  const avatar = el('span', { class: 'dash-avatar', 'aria-hidden': 'true' });
  const meta = el('span', { class: 'dash-page-meta' });
  const name = el('strong');
  const handle = el('span');
  name.textContent = 'Đang tải…';
  meta.append(name, handle);
  cardLink.append(avatar, meta);
  card.append(cardLink);
  panePage.append(card);
  panePage.append(Object.assign(el('div', { class: 'dash-group-title' }), { textContent: 'Thiết lập trang donate' }));
  DONATE_ITEMS.forEach((i) => panePage.append(link(i)));
  side.append(paneMe, panePage);

  const selectTab = (key) => {
    const me = key === 'me';
    tabMe.setAttribute('aria-selected', String(me));
    tabPage.setAttribute('aria-selected', String(!me));
    paneMe.hidden = !me;
    panePage.hidden = me;
  };
  tabMe.addEventListener('click', () => selectTab('me'));
  tabPage.addEventListener('click', () => selectTab('page'));
  selectTab(PAGES[current] && PAGES[current].group === 'Cá nhân' ? 'me' : 'page');

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
  // Điều hướng giữa các trang thiết lập chỉ nằm ở menu bên trái (không lặp lại thanh tab ở đầu trang).

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
