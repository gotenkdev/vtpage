/*
 * Giao diện trình phát nhạc (dùng chung cho music.html trên OBS và bản xem trước ở trang Cài đặt Donate).
 * Tên bài/kênh/người donate vào trang bằng textContent; ảnh bìa dựng từ MÃ VIDEO đã được máy chủ kiểm (11 ký tự an toàn).
 * API: window.VTMusic = { TEMPLATES, thumb(videoId), mount(el) -> { render(state) } }
 */
(function () {
  'use strict';
  const TEMPLATES = [
    ['slim_pill', 'Slim Pill'],
    ['onyx_glass', 'Onyx Glass'],
    ['vinyl_spin', 'Vinyl Spin'],
    ['spectrum', 'Spectrum'],
    ['cassette', 'Cassette'],
    ['stream_bar', 'Stream Bar'],
  ];
  const ID = /^[A-Za-z0-9_-]{11}$/;
  const thumb = (id) => (ID.test(id || '') ? 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' : '');
  const clock = (s) => {
    const t = Math.max(0, Math.floor(s));
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  };
  const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const SKELETON = `
    <div class="vm-art"><img alt="" referrerpolicy="no-referrer"><span class="vm-reel vm-reel-l"></span><span class="vm-reel vm-reel-r"></span></div>
    <div class="vm-info">
      <div class="vm-top"><span class="vm-badge"></span><span class="vm-queue"></span></div>
      <strong class="vm-title"><span></span></strong>
      <span class="vm-author"></span>
      <span class="vm-by"></span>
      <div class="vm-bar"><i></i></div>
      <span class="vm-time"></span>
    </div>
    <div class="vm-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;

  function mount(container) {
    let el = null;
    let template = null;
    const q = (sel) => el.querySelector(sel);

    return {
      render(state) {
        if (!el || template !== state.template) {
          container.textContent = '';
          el = document.createElement('div');
          el.innerHTML = SKELETON;
          container.append(el);
          template = state.template;
        }
        const item = state.item;
        el.className = 'vm vm-' + state.template + (item ? ' is-playing' : ' is-idle');
        el.style.opacity = String(state.opacity / 100);
        const img = q('.vm-art img');
        const src = item ? thumb(item.videoId) : '';
        if (img.getAttribute('src') !== src) {
          if (src) img.src = src;
          else img.removeAttribute('src');
        }
        el.style.setProperty('--cover', src ? 'url("' + src + '")' : 'none');
        q('.vm-badge').textContent = item ? 'ĐANG PHÁT' : 'CHỜ';
        q('.vm-queue').textContent = state.queueCount > 0 ? state.queueCount + ' bài chờ' : '';
        q('.vm-title span').textContent = item ? item.title : state.idleTitle;
        q('.vm-author').textContent = item ? item.author || '' : state.idleText;
        const by = state.displayText || '♥ {name} · {amount}';
        q('.vm-by').textContent = item
          ? by.replace(/\{name\}/g, item.donorName).replace(/\{music\}/g, item.title).replace(/\{amount\}/g, vnd(item.amount))
          : '';
        const total = state.total || 210;
        const pct = item ? Math.min(100, (state.elapsed / total) * 100) : 0;
        el.style.setProperty('--p', pct.toFixed(2));
        q('.vm-time').textContent = item ? clock(state.elapsed) + ' / ' + clock(total) : '';
        // Tên bài dài thì chạy chữ (marquee) thay vì cắt.
        const title = q('.vm-title');
        title.classList.toggle('is-long', title.scrollWidth > title.clientWidth + 4);
      },
    };
  }

  window.VTMusic = { TEMPLATES, thumb, mount };
})();
