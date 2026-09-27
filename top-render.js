/*
 * Vẽ bảng xếp hạng người ủng hộ, dùng chung cho widget OBS (top.html) và khung Xem trước ở trang /leaderboard.
 * Hai mẫu: 'list' (danh sách) và 'marquee' (chữ chạy ngang). Tên người donate vào trang bằng textContent.
 */
(function () {
  'use strict';
  const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  function list(rows, showAmount) {
    const ol = document.createElement('ol');
    ol.className = 'vt-top-list';
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      if (i < 3) li.className = 'is-top is-top-' + (i + 1);
      li.style.setProperty('--i', String(i));
      const no = document.createElement('span');
      no.className = 'vt-top-no';
      no.textContent = String(i + 1);
      const name = document.createElement('span');
      name.className = 'vt-top-name';
      name.textContent = r.name;
      li.append(no, name);
      if (showAmount) {
        const amount = document.createElement('span');
        amount.className = 'vt-top-amount';
        amount.textContent = money(r.total);
        li.append(amount);
      }
      ol.append(li);
    });
    return ol;
  }

  function marquee(rows, showAmount) {
    const box = document.createElement('div');
    box.className = 'vt-top-marquee';
    const track = document.createElement('div');
    track.className = 'vt-top-track';
    const fill = (span) =>
      rows.forEach((r, i) => {
        const item = document.createElement('span');
        item.className = 'vt-top-item' + (i < 3 ? ' is-top is-top-' + (i + 1) : '');
        const no = document.createElement('b');
        no.textContent = '#' + (i + 1);
        item.append(no, ' ' + r.name + (showAmount ? ' · ' + money(r.total) : ''));
        span.append(item);
      });
    const line = () => {
      const span = document.createElement('span');
      span.className = 'vt-top-line';
      fill(span);
      return span;
    };
    // Hai bản giống nhau nối tiếp để chạy vòng liền mạch (bản thứ hai ẩn với trình đọc màn hình).
    const copy = line();
    copy.setAttribute('aria-hidden', 'true');
    track.append(line(), copy);
    box.append(track);
    // Ít người thì một dòng ngắn hơn khung: lặp danh sách tới khi đủ rộng để chạy vòng không hở (gọi sau khi đã gắn vào trang).
    box.fit = () => {
      const [a, b] = track.children;
      for (let n = 0; n < 30 && a.offsetWidth > 0 && a.offsetWidth < box.clientWidth; n++) {
        fill(a);
        fill(b);
      }
      track.style.setProperty('--dur', Math.max(12, a.offsetWidth / 60) + 's');
    };
    return box;
  }

  window.VTTop = {
    render(target, rows, opts) {
      target.textContent = '';
      if (!rows.length) {
        const p = document.createElement('p');
        p.className = 'vt-top-empty';
        p.textContent = 'Chưa có người ủng hộ';
        target.append(p);
        return;
      }
      const view = opts.type === 'marquee' ? marquee(rows, opts.amount) : list(rows, opts.amount);
      target.append(view);
      if (view.fit) view.fit();
    },
    sample(n) {
      const names = ['Minh Anh', 'Tuấn Kiệt', 'Hoàng Nam', 'Thu Trang', 'Bảo Ngọc', 'Quốc Huy', 'Lan Chi', 'Đức Anh', 'Mai Phương', 'Gia Bảo'];
      return Array.from({ length: n }, (_, i) => ({ name: names[i % names.length] + (i >= names.length ? ' ' + (i + 1) : ''), total: Math.round((500 - i * 38) / 5) * 5000 + 10000 }));
    },
  };
})();
