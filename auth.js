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
const authButtons = document.getElementById('authButtons');

if (authButtons) {
  const session = getSession();
  if (session) {
    authButtons.innerHTML = `
      <span class="session-email">${escapeHtml(session)}</span>
      <button type="button" class="btn btn-outline" id="logoutBtn">Đăng xuất</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.reload();
    });
  }
}
