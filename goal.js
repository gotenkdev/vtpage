// Mục tiêu ủng hộ cho OBS Browser Source. Token ở #hash (không lọt log máy chủ). Cập nhật ngay khi có donate (SSE), và tải lại
// cấu hình định kỳ để streamer đổi mẫu/tiêu đề ở trang cài đặt là overlay đổi theo, không phải sửa OBS.
(function () {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const notice = document.getElementById('goalNotice');
  const box = document.getElementById('goal');
  const show = (text) => {
    notice.textContent = text;
    notice.hidden = false;
  };
  if (!token || !/^vtol_[0-9a-f]{64}$/.test(token)) {
    show('Thiếu hoặc sai link mục tiêu. Lấy link đúng ở trang Cài đặt Donate → Mục tiêu.');
    return;
  }
  const base = '/api/v1/overlay/' + encodeURIComponent(token);
  const view = window.VTGoal.mount(box);

  async function refresh() {
    try {
      const res = await fetch(base + '/goal', { credentials: 'omit', cache: 'no-store' });
      if (res.status === 404) return show('Link đã bị đổi hoặc không còn hiệu lực. Lấy link mới ở trang Cài đặt Donate.');
      if (!res.ok) return;
      const data = await res.json();
      box.hidden = !data.goal.enabled;
      if (data.goal.enabled) view.update(data.goal, data.raised, data.count);
    } catch {
      // mất mạng tạm thời: giữ nguyên
    }
  }

  refresh();
  setInterval(refresh, 15000);
  const source = new EventSource(base + '/stream');
  const soon = () => setTimeout(refresh, 400);
  source.addEventListener('donation.confirmed', soon);
})();
