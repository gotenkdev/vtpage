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
    username_reserved: 'Username này đã được dành riêng, không dùng được.',
    username_taken: 'Username này đã có người dùng.',
    profile_exists: 'Bạn đã có hồ sơ rồi.',
    email_not_verified: 'Email của bạn chưa được xác minh.',
    'username:invalid_format': 'Username không hợp lệ: chỉ chữ, số, gạch dưới, 3-20 ký tự.',
    'displayName:empty': 'Tên hiển thị không được để trống.',
    'displayName:too_long': 'Tên hiển thị quá dài (tối đa 50 ký tự).',
    'displayName:forbidden_characters': 'Tên hiển thị chứa ký tự không hợp lệ.',
    'bio:too_long': 'Giới thiệu quá dài (tối đa 300 ký tự).',
    'bio:too_many_lines': 'Giới thiệu chỉ được tối đa 6 dòng.',
    'bio:forbidden_characters': 'Giới thiệu chứa ký tự không hợp lệ.',
    'avatar:empty': 'Chưa chọn ảnh.',
    'avatar:unsupported_type': 'Định dạng ảnh không được hỗ trợ (chỉ PNG, JPEG, WebP).',
    'avatar:type_mismatch': 'Đuôi tệp không khớp nội dung ảnh thật.',
    'avatar:animated': 'Không nhận ảnh động (GIF/WebP động).',
    'avatar:corrupt': 'Tệp ảnh bị hỏng, không đọc được.',
  };
  const FALLBACK_MESSAGE = 'Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.';

  function describe(message) {
    const list = Array.isArray(message) ? message : [message];
    const parts = list
      .map((item) => {
        if (typeof item !== 'string') return null;
        if (MESSAGES[item]) return MESSAGES[item];
        // Không có trong từ điển: nếu có khoảng trắng thì coi là câu tiếng Việt backend đã soạn sẵn
        // (vd "Email hoặc mật khẩu không đúng"); mã máy (vd "username_taken") không có khoảng trắng,
        // không bao giờ hiện thẳng ra cho người dùng.
        return item.includes(' ') ? item : null;
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : FALLBACK_MESSAGE;
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

  // Thân là chính byte của ảnh (không multipart, không JSON) nên đi đường riêng, không qua call().
  async function uploadAvatar(file) {
    const headers = { 'content-type': file.type };
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
    let response;
    try {
      response = await fetch(API_PREFIX + '/me/avatar', {
        method: 'PUT',
        headers,
        credentials: 'same-origin',
        body: file,
      });
    } catch {
      throw new ApiError(0, { message: 'Không kết nối được tới máy chủ. Kiểm tra lại mạng và thử lại.' });
    }
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) throw new ApiError(response.status, data ?? {});
    return data;
  }

  window.VTApi = { call, me, setCsrf, uploadAvatar, ApiError, describe };
})();
