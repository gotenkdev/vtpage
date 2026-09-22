/*
 * Đăng ký / đăng nhập / phiên thật, gọi API backend qua window.VTApi (api.js).
 * Đăng ký là HAI BƯỚC: (1) gửi email, nhận liên kết xác nhận qua thư; (2) mở liên kết
 * (complete-signup.html), đặt mật khẩu, tài khoản được tạo và đăng nhập luôn. Đăng nhập có thể yêu cầu
 * bước hai (2FA) nếu tài khoản đã bật.
 */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Password show/hide (mọi trang có ô mật khẩu) ---
document.querySelectorAll('.password-field').forEach((field) => {
  const input = field.querySelector('input');
  const toggle = field.querySelector('.password-toggle');
  if (!input || !toggle) return;
  toggle.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(isHidden));
    toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

function showError(errorBox, errorText, message) {
  if (!errorBox) return;
  errorBox.hidden = true;
  errorText.textContent = message;
  void errorBox.offsetWidth; // gỡ rồi gắn lại để hiệu ứng rung chạy lại ở mỗi lần lỗi
  errorBox.hidden = false;
  if (window.VTFX) window.VTFX.buzz();
}

function hideError(errorBox) {
  if (errorBox) errorBox.hidden = true;
}

// Vô hiệu hóa nút trong lúc chờ mạng, tránh gửi trùng khi người dùng bấm nhiều lần.
async function submitWithLock(button, work) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Đang xử lý...';
  try {
    await work();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

// --- Trang sign-up.html: bước 1, chỉ email ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  const emailInput = document.getElementById('email');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');
  const doneBox = document.getElementById('signupDone');
  const retryBtn = document.getElementById('signupRetry');
  const federated = document.getElementById('federatedButtons');
  const divider = document.querySelector('.divider');

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(errorBox);
    const email = emailInput.value.trim();
    if (!email) return;
    const button = signupForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await window.VTApi.call('POST', '/auth/register', { email });
        signupForm.hidden = true;
        if (federated) federated.hidden = true;
        if (divider) divider.hidden = true;
        doneBox.hidden = false;
      } catch (err) {
        showError(errorBox, errorText, err.message);
      }
    });
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      doneBox.hidden = true;
      signupForm.hidden = false;
      if (federated) federated.hidden = false;
      if (divider) divider.hidden = false;
      emailInput.value = '';
      emailInput.focus();
    });
  }

  // Đã đăng nhập sẵn (phiên còn hiệu lực) thì không cần đăng ký lại.
  window.VTApi.me()
    .then((me) => {
      if (me && !(me.mfa.enabled && !me.mfa.verified)) window.location.href = 'index.html';
    })
    .catch((err) => console.error(err));
}

// --- Trang sign-in.html: đăng nhập, có thể cần bước hai (2FA) ---
const signinForm = document.getElementById('signinForm');
if (signinForm) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');
  const federated = document.getElementById('federatedButtons');
  const divider = document.getElementById('authDivider');
  const authSwitch = document.getElementById('authSwitch');
  const authSubtitle = document.getElementById('authSubtitle');
  const mfaForm = document.getElementById('mfaForm');
  const mfaCodeInput = document.getElementById('mfaCode');
  const mfaErrorBox = document.getElementById('mfaError');
  const mfaErrorText = document.getElementById('mfaErrorText');

  const showMfaStep = () => {
    signinForm.hidden = true;
    if (federated) federated.hidden = true;
    if (divider) divider.hidden = true;
    if (authSwitch) authSwitch.hidden = true;
    if (authSubtitle) authSubtitle.textContent = 'Nhập mã từ ứng dụng xác thực (hoặc một mã khôi phục).';
    mfaForm.hidden = false;
    mfaCodeInput.focus();
  };

  signinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(errorBox);
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) return;
    const button = signinForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        const result = await window.VTApi.call('POST', '/auth/login', { email, password });
        window.VTApi.setCsrf(result.csrfToken);
        if (result.mfaRequired) {
          showMfaStep();
        } else {
          window.location.href = 'index.html';
        }
      } catch (err) {
        showError(errorBox, errorText, err.message);
      }
    });
  });

  mfaForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(mfaErrorBox);
    const code = mfaCodeInput.value.trim();
    if (!code) return;
    const button = mfaForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await window.VTApi.call('POST', '/auth/mfa/verify', { code });
        window.location.href = 'index.html';
      } catch (err) {
        showError(mfaErrorBox, mfaErrorText, err.message);
        mfaCodeInput.select();
      }
    });
  });

  // Đã đăng nhập đầy đủ thì vào thẳng trang chủ; đang ở phiên "chờ bước hai" (vd tải lại trang giữa
  // chừng) thì hiện luôn bước nhập mã, không bắt gõ lại mật khẩu.
  window.VTApi.me()
    .then((me) => {
      if (!me) return;
      if (me.mfa.enabled && !me.mfa.verified) {
        showMfaStep();
      } else {
        window.location.href = 'index.html';
      }
    })
    .catch((err) => console.error(err));
}

// --- Trang complete-signup.html: bước 2, đặt mật khẩu bằng token trong liên kết đã gửi qua email ---
const completeForm = document.getElementById('completeForm');
if (completeForm) {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('passwordConfirm');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');
  const authSwitch = document.getElementById('authSwitch');
  const authSubtitle = document.getElementById('authSubtitle');

  if (!token) {
    authSubtitle.textContent = 'Liên kết không hợp lệ hoặc thiếu mã xác nhận.';
    authSwitch.innerHTML = 'Hãy thử <a href="sign-up.html">đăng ký lại</a>.';
  } else {
    completeForm.hidden = false;
    completeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      hideError(errorBox);
      const password = passwordInput.value;
      if (password !== confirmInput.value) {
        showError(errorBox, errorText, 'Hai mật khẩu chưa khớp nhau.');
        return;
      }
      const button = completeForm.querySelector('button[type="submit"]');
      void submitWithLock(button, async () => {
        try {
          const result = await window.VTApi.call('POST', '/auth/register/complete', { token, password });
          window.VTApi.setCsrf(result.csrfToken);
          window.location.href = 'index.html';
        } catch (err) {
          showError(errorBox, errorText, err.message);
          if (err.status === 400 && err.body && err.body.message === 'Liên kết không hợp lệ hoặc đã hết hạn') {
            authSwitch.innerHTML = 'Liên kết đã dùng hoặc hết hạn. Hãy <a href="sign-up.html">đăng ký lại</a>.';
          }
        }
      });
    });
  }
}

// --- Trạng thái đăng nhập ở header (trang chủ) ---
const AVATAR_COLORS = [
  { bg: '#FF5A1F', fg: '#14161A' },
  { bg: '#2450F5', fg: '#F6F7F9' },
  { bg: '#14161A', fg: '#FF5A1F' },
  { bg: '#F6F7F9', fg: '#2450F5' },
  { bg: '#7C2504', fg: '#F6F7F9' },
  { bg: '#DCDEE5', fg: '#14161A' },
];

function avatarColorFor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash + email.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function avatarInitial(email) {
  const name = email.split('@')[0] || email;
  return name.charAt(0).toUpperCase();
}

const authButtons = document.getElementById('authButtons');
if (authButtons) {
  window.VTApi.me()
    .then((me) => {
      if (!me) return; // chưa đăng nhập: giữ nguyên nút Đăng nhập/Đăng ký mặc định trong HTML

      if (me.mfa.enabled && !me.mfa.verified) {
        authButtons.innerHTML = `<a href="sign-in.html" class="btn btn-outline">Hoàn tất đăng nhập (2FA)</a>`;
        return;
      }

      const email = me.user.email;
      const color = avatarColorFor(email);
      authButtons.innerHTML = `
        <div class="user-bar">
          <div class="icon-btn-group">
            <button type="button" class="icon-btn" id="chatBtn" aria-label="Tin nhắn" aria-expanded="false">
              <svg class="ic" aria-hidden="true"><use href="#i-chat"/></svg>
            </button>
            <div class="dropdown-panel" id="chatPanel" hidden>
              <div class="dropdown-title">Tin nhắn</div>
              <p class="dropdown-empty">Chưa có cuộc trò chuyện nào.<br>Bản xem giao diện — nhắn tin thật giữa các thành viên sẽ có sau.</p>
            </div>

            <button type="button" class="icon-btn" id="notifBtn" aria-label="Thông báo" aria-expanded="false">
              <svg class="ic" aria-hidden="true"><use href="#i-bell"/></svg>
            </button>
            <div class="dropdown-panel" id="notifPanel" hidden>
              <div class="dropdown-title">Thông báo</div>
              <p class="dropdown-empty">Chưa có thông báo nào từ hệ thống.</p>
            </div>
          </div>

          <div class="header-divider"></div>

          <div class="user-menu">
            <button type="button" class="avatar-btn" id="avatarBtn" aria-label="Tài khoản" aria-expanded="false" style="background-color:${color.bg};color:${color.fg}">${escapeHtml(avatarInitial(email))}</button>
            <div class="dropdown-panel" id="userPanel" hidden>
              <div class="dropdown-email">${escapeHtml(email)}</div>
              <button type="button" class="dropdown-item" id="logoutBtn">Đăng xuất</button>
            </div>
          </div>
        </div>
      `;

      const panels = [
        { button: document.getElementById('chatBtn'), panel: document.getElementById('chatPanel') },
        { button: document.getElementById('notifBtn'), panel: document.getElementById('notifPanel') },
        { button: document.getElementById('avatarBtn'), panel: document.getElementById('userPanel') },
      ];

      const closeAllPanels = () => {
        panels.forEach(({ button, panel }) => {
          panel.hidden = true;
          button.setAttribute('aria-expanded', 'false');
        });
      };

      panels.forEach(({ button, panel }) => {
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const willOpen = panel.hidden;
          closeAllPanels();
          panel.hidden = !willOpen;
          button.setAttribute('aria-expanded', String(willOpen));
        });
      });

      document.addEventListener('click', closeAllPanels);
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeAllPanels();
      });

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
          await window.VTApi.call('POST', '/auth/logout');
        } catch {
          // Phiên có thể đã hết hạn ở máy chủ; vẫn xóa trạng thái ở trình duyệt.
        }
        window.location.reload();
      });
    })
    .catch((err) => console.error(err));
}
