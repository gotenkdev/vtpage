// Trang này chạy trong OBS Browser Source (nền trong suốt) hoặc để streamer tự xem trước.
// Token nằm ở #hash, không phải ?query, để KHÔNG BAO GIỜ lọt vào log máy chủ hay Referer.
(function () {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const notice = document.getElementById('overlayNotice');
  const stage = document.getElementById('stage');

  function showNotice(text) {
    notice.textContent = text;
    notice.hidden = false;
  }
  if (!token || !/^vtol_[0-9a-f]{64}$/.test(token)) {
    showNotice('Thiếu hoặc sai link overlay. Lấy link đúng ở trang Cài đặt Donate.');
    return;
  }

  let current = null;
  const base = '/api/v1/overlay/' + encodeURIComponent(token);

  // Cài đặt được tải lại định kỳ: streamer bấm "Cập nhật" ở trang cài đặt thì overlay đổi theo trong vòng 15 giây, không cần sửa OBS.
  async function loadSettings() {
    try {
      const res = await fetch(base + '/settings', { credentials: 'omit', cache: 'no-store' });
      if (res.status === 404) {
        showNotice('Link overlay đã bị đổi hoặc không còn hiệu lực. Lấy link mới ở trang Cài đặt Donate.');
        return;
      }
      if (res.ok) current = await res.json();
    } catch {
      // mất mạng tạm thời: giữ cài đặt cũ
    }
  }

  const player = window.VTAlerts.createPlayer(stage, () => current);

  function toEvent(data, test) {
    return {
      donorName: data.donorName,
      amount: Number(data.amount) || 0,
      message: data.message || '',
      vipLevel: Number(data.vipLevel) || 0,
      recordingUrl:
        typeof data.recordingKey === 'string' && /^[a-f0-9]{32}\.[a-z0-9]{3,4}$/.test(data.recordingKey)
          ? '/api/v1/media/' + data.recordingKey
          : null,
      test,
    };
  }

  function connect() {
    const source = new EventSource(base + '/stream');
    const handle = (test) => (event) => {
      if (!current) return;
      try {
        player.push(toEvent(JSON.parse(event.data), test));
      } catch (err) {
        console.error('Không đọc được sự kiện donate', err);
      }
    };
    source.addEventListener('donation.confirmed', handle(false));
    source.addEventListener('overlay.test', handle(true));
    // Rớt mạng: EventSource tự nối lại theo chuẩn SSE, Last-Event-ID gửi kèm nên không bỏ sót donate nào.
    source.onerror = () => console.warn('Kết nối overlay bị ngắt, trình duyệt sẽ tự thử lại.');
  }

  loadSettings().then(connect);
  setInterval(loadSettings, 15000);
})();
