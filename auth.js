/*
 * DEMO ONLY — không có backend thật.
 * Tài khoản được lưu trong localStorage của trình duyệt (mật khẩu ở dạng
 * plain text). Chỉ dùng để test giao diện/luồng đăng ký-đăng nhập, KHÔNG
 * an toàn và KHÔNG dùng cho sản phẩm thật. Khi làm thật cần thay bằng
 * backend + hash mật khẩu (vd Firebase Auth, Supabase Auth, ...).
 */
const USERS_KEY = 'vtpage_demo_users';
const SESSION_KEY = 'vtpage_demo_session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function setSession(email) {
  localStorage.setItem(SESSION_KEY, email);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Password show/hide (trang sign-in / sign-up) ---
const passwordInput = document.getElementById('password');
const toggleButton = document.querySelector('.password-toggle');

if (passwordInput && toggleButton) {
  toggleButton.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleButton.setAttribute('aria-pressed', String(isHidden));
    toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
}

// --- Form đăng nhập / đăng ký ---
const authForm = document.querySelector('.sign-in-form');

if (authForm) {
  const emailInput = document.getElementById('email');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');
  const mode = authForm.dataset.mode; // 'signup' | 'signin'

  const showError = (message) => {
    if (!errorBox) return;
    // gỡ rồi gắn lại để hiệu ứng rung chạy lại ở mỗi lần lỗi
    errorBox.hidden = true;
    errorText.textContent = message;
    void errorBox.offsetWidth;
    errorBox.hidden = false;
    if (window.VTFX) window.VTFX.buzz();
  };

  const hideError = () => {
    if (!errorBox) return;
    errorBox.hidden = true;
  };

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || !password) return;

    const users = getUsers();

    if (mode === 'signup') {
      if (users[email]) {
        showError('Email này đã có tài khoản. Hãy đăng nhập.');
        return;
      }
      users[email] = password;
      saveUsers(users);
      setSession(email);
      window.location.href = 'index.html';
      return;
    }

    // mode === 'signin'
    if (!users[email] || users[email] !== password) {
      showError('Sai email hoặc mật khẩu.');
      return;
    }
    setSession(email);
    window.location.href = 'index.html';
  });
}

// --- Trạng thái đăng nhập ở header (trang chủ) ---
// Mỗi màu avatar đi kèm màu chữ đủ tương phản.
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
  const session = getSession();
  if (session) {
    const color = avatarColorFor(session);
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
          <button type="button" class="avatar-btn" id="avatarBtn" aria-label="Tài khoản" aria-expanded="false" style="background-color:${color.bg};color:${color.fg}">${escapeHtml(avatarInitial(session))}</button>
          <div class="dropdown-panel" id="userPanel" hidden>
            <div class="dropdown-email">${escapeHtml(session)}</div>
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

    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.reload();
    });
  }
}
