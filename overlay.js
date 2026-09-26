// Trang này chạy trong OBS Browser Source (nền phải trong suốt) hoặc để streamer tự xem trước.
// Token nằm ở #hash, không phải ?query, để KHÔNG BAO GIỜ lọt vào log máy chủ hay lịch sử trình duyệt
// gửi qua Referer — cùng quy ước với complete-signup.html/reset-password.html.
(function () {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const notice = document.getElementById('overlayNotice');
  const toast = document.getElementById('toast');
  const toastName = document.getElementById('toastName');
  const toastAmount = document.getElementById('toastAmount');
  const toastMessage = document.getElementById('toastMessage');

  function showNotice(text) {
    notice.textContent = text;
    notice.hidden = false;
  }

  if (!token || !/^vtol_[0-9a-f]{64}$/.test(token)) {
    showNotice('Thiếu hoặc sai token overlay. Lấy địa chỉ đúng ở trang Overlay trong hồ sơ của bạn.');
    return;
  }

  const amountFormatter = new Intl.NumberFormat('vi-VN');
  let hideTimer = null;

  function showToast(donorName, amount, message) {
    clearTimeout(hideTimer);
    toastName.textContent = donorName || 'Người ủng hộ ẩn danh';
    toastAmount.textContent = amountFormatter.format(amount) + 'đ';
    toastMessage.textContent = message || '';
    toastMessage.hidden = !message;
    toast.classList.remove('is-shown');
    // Buộc reflow để lần donate liên tiếp cũng chạy lại animation từ đầu, không bị gộp.
    void toast.offsetWidth;
    toast.classList.add('is-shown');
    hideTimer = setTimeout(() => toast.classList.remove('is-shown'), 8000);
  }

  function connect() {
    const source = new EventSource('/api/v1/overlay/' + encodeURIComponent(token) + '/stream');

    source.addEventListener('donation.confirmed', (event) => {
      try {
        const data = JSON.parse(event.data);
        showToast(data.donorName, data.amount, data.message);
      } catch (err) {
        console.error('Không đọc được sự kiện donate', err);
      }
    });

    source.addEventListener('overlay.test', (event) => {
      try {
        const data = JSON.parse(event.data);
        showToast(data.donorName || 'Sự kiện thử', data.amount || 0, data.message || 'Đây là sự kiện thử.');
      } catch {
        showToast('Sự kiện thử', 0, 'Đây là sự kiện thử.');
      }
    });

    // Token sai/đã bị xoay (server đóng bằng 404) hoặc mất mạng tạm thời: EventSource tự nối lại theo
    // chuẩn SSE (không cần code tay), Last-Event-ID gửi kèm tự động nên không bỏ sót donate nào.
    source.onerror = () => {
      console.warn('Kết nối overlay bị ngắt, trình duyệt sẽ tự thử lại.');
    };
  }

  connect();
})();
