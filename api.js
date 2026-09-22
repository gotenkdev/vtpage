/*
 * Lớp gọi API dùng chung cho mọi trang. Chạy CÙNG ORIGIN với backend (khi phát bằng
 * `npm run dev:frontend` ở backend/, hoặc khi triển khai thật, một máy chủ phục vụ cả trang lẫn /api):
 * cookie phiên __Host- và kiểm tra Origin của backend chỉ hoạt động khi cùng origin, nên KHÔNG được đổi
 * API_PREFIX thành một địa chỉ khác domain.
 */
(function () {
  const API_PREFIX = '/api/v1';

  // Thông điệp lỗi thường gặp (mã máy do backend trả cho lỗi dữ liệu đầu vào) dịch sang tiếng Việt.
  // Backend đã tự lọc lỗi 5xx và 404 thành thông điệp chung không tiết lộ gì; lỗi nghiệp vụ (sai mật
  // khẩu, liên kết hỏng...) backend đã trả sẵn câu tiếng Việt, không cần dịch thêm.
  const MESSAGES = {
    'email:invalid_email': 'Email không hợp lệ.',
    'email:too_big': 'Email quá dài.',
    'email:invalid_type': 'Vui lòng nhập email.',
    'password:too_short': 'Mật khẩu cần ít nhất 10 ký tự.',
    'password:too_long': 'Mật khẩu quá dài.',
    'password:too_simple': 'Mật khẩu quá đơn giản, hãy dùng nhiều ký tự khác nhau hơn.',
    'password:same_as_email': 'Mật khẩu không được trùng với email.',
    'password:breached': 'Mật khẩu này đã từng bị lộ trong các vụ rò rỉ dữ liệu khác. Hãy chọn mật khẩu khác.',
    'password:invalid_type': 'Vui lòng nhập mật khẩu.',
    'code:invalid': 'Mã xác thực không đúng.',
    'token:too_big': 'Liên kết không hợp lệ.',
  };
  const FALLBACK_MESSAGE = 'Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.';

  function describe(message) {
    if (typeof message === 'string' && !message.includes(':')) return message; // đã là câu tiếng Việt sẵn
    const list = Array.isArray(message) ? message : [message];
    const known = list.map((code) => MESSAGES[code]).filter(Boolean);
    return known.length > 0 ? known.join(' ') : FALLBACK_MESSAGE;
  }

  class ApiError extends Error {
    constructor(status, body) {
      super(describe(body && body.message));
      this.status = status;
      this.body = body;
    }
  }

  // Token CSRF của phiên hiện tại: nạp lại mỗi lần tải trang qua VTApi.me(), không lưu vào localStorage
  // hay sessionStorage (không phải bí mật cần giữ lâu, chỉ cần đúng trong phiên trình duyệt đang mở).
  let csrfToken = null;

  async function call(method, path, body) {
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (method !== 'GET' && csrfToken) headers['x-csrf-token'] = csrfToken;

    let response;
    try {
      response = await fetch(API_PREFIX + path, {
        method,
        headers,
        credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, { message: 'Không kết nối được tới máy chủ. Kiểm tra lại mạng và thử lại.' });
    }

    const text = await response.text();
    let data = null;
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!response.ok) throw new ApiError(response.status, data ?? {});
    return data;
  }

  // Gọi khi tải mỗi trang để biết ai đang đăng nhập và lấy token CSRF mới. null nếu chưa đăng nhập.
  async function me() {
    try {
      const data = await call('GET', '/me');
      csrfToken = data.csrfToken;
      return data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  }

  function setCsrf(token) {
    csrfToken = token;
  }

  window.VTApi = { call, me, setCsrf, ApiError, describe };
})();
