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
  const mode = authForm.dataset.mode; // 'signup' | 'signin'

  const showError = (message) => {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
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
const AVATAR_COLORS = ['#c6ff3d', '#8b5cf6', '#22d3ee', '#f472b6', '#fb923c', '#34d399'];

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
    authButtons.innerHTML = `
      <div class="user-bar">
        <div class="icon-btn-group">
          <button type="button" class="icon-btn" id="chatBtn" aria-label="Tin nhắn" aria-expanded="false">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </button>
          <div class="dropdown-panel" id="chatPanel" hidden>
            <div class="dropdown-title">Tin nhắn</div>
            <p class="dropdown-empty">Chưa có cuộc trò chuyện nào.<br>Bản xem giao diện — nhắn tin thật giữa các thành viên sẽ có sau.</p>
          </div>

          <button type="button" class="icon-btn" id="notifBtn" aria-label="Thông báo" aria-expanded="false">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <div class="dropdown-panel" id="notifPanel" hidden>
            <div class="dropdown-title">Thông báo</div>
            <p class="dropdown-empty">Chưa có thông báo nào từ hệ thống.</p>
          </div>
        </div>

        <div class="header-divider"></div>

        <div class="user-menu">
          <button type="button" class="avatar-btn" id="avatarBtn" aria-label="Tài khoản" aria-expanded="false" style="background-color:${avatarColorFor(session)}">${escapeHtml(avatarInitial(session))}</button>
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

    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.reload();
    });
  }
}
