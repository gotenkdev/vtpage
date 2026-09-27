// Widget Bảng xếp hạng cho OBS Browser Source. Token ở #hash (không lọt log máy chủ); tùy chọn hiển thị ở ?type=&time=&limit=&amount=
// (tạo ở trang /leaderboard). Cập nhật ngay khi có donate (SSE) và tải lại định kỳ.
(function () {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const q = new URLSearchParams(window.location.search);
  const opts = {
    type: q.get('type') === 'marquee' ? 'marquee' : 'list',
    period: ['day', 'month', 'all'].includes(q.get('time')) ? q.get('time') : 'all',
    limit: Math.min(50, Math.max(1, parseInt(q.get('limit'), 10) || 10)),
    amount: q.get('amount') !== 'no',
  };
  const notice = document.getElementById('topNotice');
  const box = document.getElementById('top');
  const show = (text) => {
    notice.textContent = text;
    notice.hidden = false;
  };
  if (!token || !/^vtol_[0-9a-f]{64}$/.test(token)) {
    show('Thiếu hoặc sai link bảng xếp hạng. Lấy link đúng ở trang Bảng xếp hạng.');
    return;
  }
  const base = '/api/v1/overlay/' + encodeURIComponent(token);
  let last = '';

  async function refresh() {
    try {
      const res = await fetch(base + '/top?period=' + opts.period + '&limit=' + opts.limit, { credentials: 'omit', cache: 'no-store' });
      if (res.status === 404) return show('Link đã bị đổi hoặc không còn hiệu lực. Lấy link mới ở trang Bảng xếp hạng.');
      if (!res.ok) return;
      const { leaderboard } = await res.json();
      const key = JSON.stringify(leaderboard);
      if (key === last) return; // không vẽ lại khi không đổi (tránh chữ chạy bị giật về đầu)
      last = key;
      window.VTTop.render(box, leaderboard, opts);
    } catch {
      // mất mạng tạm thời: giữ nguyên
    }
  }

  refresh();
  setInterval(refresh, 30000);
  const source = new EventSource(base + '/stream');
  source.addEventListener('donation.confirmed', () => setTimeout(refresh, 600));
})();
