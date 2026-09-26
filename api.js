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
  // QUAN TRỌNG: khoá là "field:<mã lỗi zod>", KHÔNG PHẢI "field:<lý do đọc được>". zod gộp MỌI lỗi .refine()
  // tuỳ chỉnh (kể cả khi có truyền câu lý do riêng) thành đúng một mã chung 'custom' — lý do cụ thể KHÔNG
  // tới được frontend. Đã xác minh từng mã bằng cách gọi API thật (không đoán): 'invalid_format' cho
  // .regex()/định dạng chuỗi (email, username, số tài khoản), 'invalid_type' cho thiếu trường hoặc sai kiểu,
  // 'too_small'/'too_big' cho .min()/.max() thô, 'invalid_value' cho enum (bankCode), 'custom' cho MỌI
  // .refine() dù thông điệp gốc là gì. Vì vậy nhiều trường (displayName, bio, holderName, username 3 chữ/số)
  // chỉ có được MỘT thông điệp chung cho tất cả lý do .refine() của trường đó — không giả vờ có nhiều hơn.
  const MESSAGES = {
    'email:invalid_type': 'Vui lòng nhập email.',
    'email:invalid_format': 'Email không hợp lệ.',
    'email:too_big': 'Email quá dài.',
    'email:custom': 'Email không hợp lệ.',
    // password:too_short/too_long/too_simple/same_as_email/breached: backend tự kiểm tra chính sách mật
    // khẩu SAU zod (không qua parseBody), trả thẳng đúng các mã này — không phải mã zod.
    'password:invalid_type': 'Vui lòng nhập mật khẩu.',
    'password:too_small': 'Vui lòng nhập mật khẩu.',
    'password:too_big': 'Mật khẩu quá dài.',
    'password:too_short': 'Mật khẩu cần ít nhất 10 ký tự.',
    'password:too_long': 'Mật khẩu quá dài.',
    'password:too_simple': 'Mật khẩu quá đơn giản, hãy dùng nhiều ký tự khác nhau hơn.',
    'password:same_as_email': 'Mật khẩu không được trùng với email.',
    'password:breached': 'Mật khẩu này đã từng bị lộ trong các vụ rò rỉ dữ liệu khác. Hãy chọn mật khẩu khác.',
    'token:invalid_type': 'Liên kết không hợp lệ.',
    'token:too_big': 'Liên kết không hợp lệ.',
    'code:invalid_type': 'Vui lòng nhập mã xác thực.',
    'code:too_small': 'Vui lòng nhập mã xác thực.',
    'code:too_big': 'Mã xác thực không hợp lệ.',
    'code:invalid': 'Mã xác thực không đúng.', // mã riêng của backend (checkCode), không phải mã zod
    'username:invalid_type': 'Vui lòng nhập username.',
    'username:invalid_format': 'Username không hợp lệ: chỉ chữ, số, gạch dưới, 3-20 ký tự.',
    'username:custom': 'Username cần ít nhất 3 chữ hoặc số.',
    'displayName:invalid_type': 'Vui lòng nhập tên hiển thị.',
    'displayName:custom': 'Tên hiển thị không hợp lệ (1-50 ký tự, không chứa ký tự lạ).',
    'bio:custom': 'Giới thiệu không hợp lệ (tối đa 300 ký tự, 6 dòng, không chứa ký tự lạ).',
    'bankCode:invalid_value': 'Vui lòng chọn ngân hàng hợp lệ.',
    'bankCode:invalid_type': 'Vui lòng chọn ngân hàng.',
    'accountNumber:invalid_type': 'Vui lòng nhập số tài khoản.',
    'accountNumber:invalid_format': 'Số tài khoản chỉ được gồm chữ số.',
    'accountNumber:custom': 'Số tài khoản phải có 6-19 chữ số.',
    'holderName:invalid_type': 'Vui lòng nhập tên chủ tài khoản.',
    'holderName:custom': 'Tên chủ tài khoản không hợp lệ (chỉ chữ cái, khoảng trắng, dấu chấm, gạch ngang, không ký tự lạ).',
    // Các mã dưới đây do backend tự ném thẳng (Conflict/Forbidden/BadRequest với chuỗi cố định), không
    // qua zod nên không có dạng "field:mã".
    'avatar:empty': 'Chưa chọn ảnh.',
    'avatar:unsupported_type': 'Định dạng ảnh không được hỗ trợ (chỉ PNG, JPEG, WebP).',
    'avatar:type_mismatch': 'Đuôi tệp không khớp nội dung ảnh thật.',
    'avatar:animated': 'Không nhận ảnh động (GIF/WebP động).',
    'avatar:corrupt': 'Tệp ảnh bị hỏng, không đọc được.',
    'mfa:not_started': 'Chưa bắt đầu thiết lập 2FA, hãy thử lại.',
    'mfa:not_enabled': '2FA chưa được bật.',
    username_reserved: 'Username này đã được dành riêng, không dùng được.',
    username_taken: 'Username này đã có người dùng.',
    profile_exists: 'Bạn đã có hồ sơ rồi.',
    email_not_verified: 'Email của bạn chưa được xác minh.',
    mfa_required: 'Cần hoàn tất đăng nhập hai lớp trước.',
    mfa_setup_required: 'Bạn cần bật xác thực hai lớp (2FA) trước khi làm việc này.',
    step_up_required: 'Cần xác minh lại để tiếp tục.',
    mfa_already_enabled: 'Bạn đã bật 2FA rồi.',
    bank_unsupported: 'Ngân hàng này chưa được hỗ trợ.',
    profile_required: 'Bạn cần tạo hồ sơ trước khi liên kết tài khoản ngân hàng.',
    bank_account_unavailable: 'Không thể lưu tài khoản này lúc này, hãy thử lại.',
    not_changeable: 'Tài khoản này không còn thay đổi được nữa.',
    'amount:invalid_type': 'Vui lòng nhập số tiền.',
    'amount:too_small': 'Số tiền tối thiểu là 2.000đ.',
    'amount:too_big': 'Số tiền tối đa là 50.000.000đ.',
    'donorName:invalid_type': 'Vui lòng nhập tên.',
    'donorName:custom': 'Tên không hợp lệ (tối đa 50 ký tự, không chứa ký tự lạ).',
    'message:invalid_type': 'Lời nhắn không hợp lệ.',
    'message:custom': 'Lời nhắn không hợp lệ (một dòng, tối đa 200 ký tự, không chứa ký tự lạ).',
    streamer_not_ready: 'Streamer chưa sẵn sàng nhận donate lúc này. Hãy quay lại sau.',
    not_reviewable: 'Khoản donate này không cần xem.',
    already_reviewed: 'Khoản donate này đã được xử lý rồi.',
    'currentPassword:invalid_type': 'Vui lòng nhập mật khẩu hiện tại.',
    'currentPassword:too_small': 'Vui lòng nhập mật khẩu hiện tại.',
    'currentPassword:too_big': 'Mật khẩu quá dài.',
    current_password_invalid: 'Mật khẩu hiện tại không đúng.',
    // newPassword:*: cùng bộ mã checkPasswordPolicy trả cho password:* lúc đăng ký, chỉ khác tên trường.
    'newPassword:invalid_type': 'Vui lòng nhập mật khẩu mới.',
    'newPassword:too_small': 'Vui lòng nhập mật khẩu mới.',
    'newPassword:too_big': 'Mật khẩu quá dài.',
    'newPassword:too_short': 'Mật khẩu cần ít nhất 10 ký tự.',
    'newPassword:too_long': 'Mật khẩu quá dài.',
    'newPassword:too_simple': 'Mật khẩu quá đơn giản, hãy dùng nhiều ký tự khác nhau hơn.',
    'newPassword:same_as_email': 'Mật khẩu không được trùng với email.',
    'newPassword:same_as_current': 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
    'newPassword:breached': 'Mật khẩu này đã từng bị lộ trong các vụ rò rỉ dữ liệu khác. Hãy chọn mật khẩu khác.',
    'newEmail:invalid_type': 'Vui lòng nhập email mới.',
    'newEmail:invalid_format': 'Email không hợp lệ.',
    'newEmail:too_big': 'Email quá dài.',
    'newEmail:custom': 'Email không hợp lệ.',
    email_taken: 'Email này đã có người dùng.',
    email_unchanged: 'Đây đã là email hiện tại của bạn rồi.',
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
