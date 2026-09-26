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

// --- Đăng nhập bằng Google (sign-in.html, sign-up.html) ---
// Chỉ hiện nút khi máy chủ đã cấu hình Google; chưa cấu hình thì gỡ hẳn khối nút khỏi trang (các đoạn code bên dưới có bật lại
// khối này cũng không hiện ra). Bấm nút là chuyển thẳng sang Google (máy chủ lo state, PKCE, cookie chống giả mạo).
(function initGoogleSignIn() {
  const federated = document.getElementById('federatedButtons');
  const googleBtn = document.getElementById('googleBtn');
  if (!federated || !googleBtn) return;
  const divider = document.getElementById('authDivider');
  googleBtn.addEventListener('click', () => {
    googleBtn.disabled = true;
    window.location.href = '/api/v1/auth/google/start';
  });
  window.VTApi.call('GET', '/auth/providers')
    .then((p) => {
      if (p && p.google) {
        federated.hidden = false;
        if (divider) divider.hidden = false;
      } else {
        federated.remove();
        if (divider) divider.remove();
      }
    })
    .catch(() => {
      federated.remove();
      if (divider) divider.remove();
    });

  // Google trả về lỗi: hiện lý do dễ hiểu (mã ngắn trong #oauth_error, không chứa gì nhạy cảm).
  const match = /(?:^|&)oauth_error=([a-z_]+)/.exec(window.location.hash.slice(1));
  if (match) {
    const OAUTH_ERRORS = {
      cancelled: 'Bạn đã hủy đăng nhập bằng Google.',
      expired: 'Phiên đăng nhập Google đã hết hạn, hãy thử lại.',
      invalid: 'Không xác minh được đăng nhập Google, hãy thử lại.',
      email_unverified: 'Email Google của bạn chưa được xác minh.',
      inactive: 'Tài khoản này đang bị khóa.',
      busy: 'Thao tác quá nhiều lần, hãy chờ một lát rồi thử lại.',
    };
    const box = document.getElementById('formError');
    const text = document.getElementById('formErrorText');
    if (box && text) showError(box, text, OAUTH_ERRORS[match[1]] || 'Đăng nhập bằng Google không thành công.');
    history.replaceState(null, '', window.location.pathname);
  }
})();

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

// Nút .copy-btn với data-copy="<id>": sao chép textContent của phần tử đó. Gắn một lần lên vùng chứa
// (ủy quyền sự kiện), dùng chung cho mọi trang có nút sao chép (donate công khai, cài đặt overlay...).
function bindCopyButtons(container) {
  if (!container) return;
  container.addEventListener('click', (event) => {
    const btn = event.target.closest('.copy-btn');
    if (!btn) return;
    const target = document.getElementById(btn.dataset.copy);
    const text = target ? target.textContent : '';
    const done = () => {
      const original = btn.textContent;
      btn.textContent = 'Đã sao chép';
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  });
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

// --- Trang forgot-password.html: gửi liên kết đặt lại mật khẩu ---
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  const emailInput = document.getElementById('email');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');
  const doneBox = document.getElementById('forgotDone');
  const retryBtn = document.getElementById('forgotRetry');

  forgotForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(errorBox);
    const email = emailInput.value.trim();
    if (!email) return;
    const button = forgotForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await window.VTApi.call('POST', '/auth/password/forgot', { email });
        forgotForm.hidden = true;
        doneBox.hidden = false;
      } catch (err) {
        showError(errorBox, errorText, err.message);
      }
    });
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      doneBox.hidden = true;
      forgotForm.hidden = false;
      emailInput.value = '';
      emailInput.focus();
    });
  }
}

// --- Trang reset-password.html: đặt mật khẩu mới bằng token trong liên kết đã gửi qua email ---
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('passwordConfirm');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');
  const authSwitch = document.getElementById('authSwitch');
  const authSubtitle = document.getElementById('authSubtitle');
  const doneBox = document.getElementById('resetDone');

  if (!token) {
    authSubtitle.textContent = 'Liên kết không hợp lệ hoặc thiếu mã xác nhận.';
    authSwitch.innerHTML = 'Hãy thử <a href="forgot-password.html">gửi lại liên kết</a>.';
  } else {
    resetForm.hidden = false;
    resetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      hideError(errorBox);
      const password = passwordInput.value;
      if (password !== confirmInput.value) {
        showError(errorBox, errorText, 'Hai mật khẩu chưa khớp nhau.');
        return;
      }
      const button = resetForm.querySelector('button[type="submit"]');
      void submitWithLock(button, async () => {
        try {
          await window.VTApi.call('POST', '/auth/password/reset', { token, password });
          resetForm.hidden = true;
          authSwitch.hidden = true;
          doneBox.hidden = false;
        } catch (err) {
          showError(errorBox, errorText, err.message);
          if (err.status === 400 && err.body && err.body.message === 'Liên kết không hợp lệ hoặc đã hết hạn') {
            authSwitch.innerHTML = 'Liên kết đã dùng hoặc hết hạn. Hãy <a href="forgot-password.html">gửi lại liên kết</a>.';
          }
        }
      });
    });
  }
}

// --- Trang confirm-email.html: xác nhận đổi email bằng token trong liên kết gửi tới email MỚI.
// Không cần đăng nhập (liên kết có thể mở ở máy/trình duyệt khác) — token tự nó là bằng chứng đủ. ---
const confirmDone = document.getElementById('confirmDone');
if (confirmDone) {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  const authSwitch = document.getElementById('authSwitch');
  const authSubtitle = document.getElementById('authSubtitle');
  const errorBox = document.getElementById('formError');
  const errorText = document.getElementById('formErrorText');

  if (!token) {
    authSubtitle.textContent = 'Liên kết không hợp lệ hoặc thiếu mã xác nhận.';
  } else {
    window.VTApi.call('POST', '/auth/email/confirm', { token })
      .then(() => {
        authSubtitle.hidden = true;
        confirmDone.hidden = false;
      })
      .catch((err) => {
        authSubtitle.textContent = 'Không xác nhận được.';
        showError(errorBox, errorText, err.message);
        authSwitch.innerHTML = 'Hãy thử đổi email lại từ <a href="security.html">trang bảo mật</a>.';
      });
  }
}

// --- Trang profile.html: xem/tạo/sửa hồ sơ, đổi/xoá ảnh đại diện (cần đăng nhập) ---
const createForm = document.getElementById('createForm');
const editSection = document.getElementById('editSection');
if (createForm && editSection) {
  const skeleton = document.getElementById('settingsSkeleton');
  const subtitle = document.getElementById('settingsSubtitle');

  const usernameInput = document.getElementById('username');
  const usernameHint = document.getElementById('usernameHint');
  const displayNameInput = document.getElementById('displayName');
  const bioInput = document.getElementById('bio');
  const createErrorBox = document.getElementById('createError');
  const createErrorText = document.getElementById('createErrorText');

  const avatarPreview = document.getElementById('avatarPreview');
  const avatarFallback = document.getElementById('avatarFallback');
  const avatarInput = document.getElementById('avatarInput');
  const avatarRemoveBtn = document.getElementById('avatarRemoveBtn');
  const avatarErrorBox = document.getElementById('avatarError');
  const avatarErrorText = document.getElementById('avatarErrorText');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const editForm = document.getElementById('editForm');
  const editDisplayNameInput = document.getElementById('editDisplayName');
  const editBioInput = document.getElementById('editBio');
  const editErrorBox = document.getElementById('editError');
  const editErrorText = document.getElementById('editErrorText');
  const editSaved = document.getElementById('editSaved');

  const DEFAULT_USERNAME_HINT =
    'vtpage.com/username — chữ, số, gạch dưới, 3-20 ký tự. Không đổi được sau khi tạo.';

  function renderAvatar(url, nameForFallback) {
    if (url) {
      avatarPreview.src = url;
      avatarPreview.hidden = false;
      avatarFallback.hidden = true;
    } else {
      avatarPreview.hidden = true;
      avatarPreview.removeAttribute('src');
      const color = avatarColorFor(nameForFallback);
      avatarFallback.style.backgroundColor = color.bg;
      avatarFallback.style.color = color.fg;
      avatarFallback.textContent = avatarInitial(nameForFallback);
      avatarFallback.hidden = false;
    }
  }

  function showEdit(profile) {
    skeleton.hidden = true;
    subtitle.textContent = 'Trang công khai của bạn: vtpage.com/' + profile.username;
    createForm.hidden = true;
    editSection.hidden = false;
    usernameDisplay.textContent = profile.username;
    editDisplayNameInput.value = profile.displayName;
    editBioInput.value = profile.bio || '';
    renderAvatar(profile.avatarUrl, profile.displayName || profile.username);
  }

  function showCreate() {
    skeleton.hidden = true;
    subtitle.textContent = 'Bạn chưa có hồ sơ. Tạo ngay để nhận donate.';
    createForm.hidden = false;
  }

  // Kiểm tra username còn dùng được không ngay khi gõ, có chống dồn request (chờ 400ms sau lần gõ cuối).
  let usernameTimer;
  usernameInput.addEventListener('input', () => {
    clearTimeout(usernameTimer);
    const value = usernameInput.value.trim();
    if (!value) {
      usernameHint.textContent = DEFAULT_USERNAME_HINT;
      usernameHint.className = 'form-hint';
      return;
    }
    usernameTimer = setTimeout(async () => {
      try {
        const result = await window.VTApi.call(
          'GET',
          '/username-availability?username=' + encodeURIComponent(value),
        );
        if (result.available) {
          usernameHint.textContent = 'vtpage.com/' + value + ' — dùng được.';
          usernameHint.className = 'form-hint is-good';
        } else {
          const reason =
            result.reason === 'invalid'
              ? 'không hợp lệ'
              : result.reason === 'reserved'
                ? 'đã được dành riêng'
                : 'đã có người dùng';
          usernameHint.textContent = 'vtpage.com/' + value + ' — ' + reason + '.';
          usernameHint.className = 'form-hint is-bad';
        }
      } catch {
        // Lỗi mạng lúc gõ: bỏ qua, lúc bấm Tạo hồ sơ sẽ tự báo lỗi.
      }
    }, 400);
  });

  createForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(createErrorBox);
    const username = usernameInput.value.trim();
    const displayName = displayNameInput.value.trim();
    const bio = bioInput.value.trim();
    const button = createForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        const body = { username, displayName };
        if (bio) body.bio = bio;
        const result = await window.VTApi.call('POST', '/me/profile', body);
        showEdit(result.profile);
      } catch (err) {
        showError(createErrorBox, createErrorText, err.message);
      }
    });
  });

  editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(editErrorBox);
    editSaved.hidden = true;
    const displayName = editDisplayNameInput.value.trim();
    const bio = editBioInput.value.trim();
    const button = editForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        const result = await window.VTApi.call('PATCH', '/me/profile', { displayName, bio });
        editDisplayNameInput.value = result.profile.displayName;
        editBioInput.value = result.profile.bio || '';
        editSaved.hidden = false;
      } catch (err) {
        showError(editErrorBox, editErrorText, err.message);
      }
    });
  });

  const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
  const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files && avatarInput.files[0];
    avatarInput.value = '';
    if (!file) return;
    hideError(avatarErrorBox);
    if (!AVATAR_TYPES.includes(file.type)) {
      showError(avatarErrorBox, avatarErrorText, 'Chỉ nhận ảnh PNG, JPEG hoặc WebP.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showError(avatarErrorBox, avatarErrorText, 'Ảnh quá lớn (tối đa 2MB).');
      return;
    }
    void (async () => {
      try {
        const result = await window.VTApi.uploadAvatar(file);
        renderAvatar(result.avatarUrl, editDisplayNameInput.value || usernameDisplay.textContent);
      } catch (err) {
        showError(avatarErrorBox, avatarErrorText, err.message);
      }
    })();
  });

  avatarRemoveBtn.addEventListener('click', () => {
    if (!window.confirm('Xoá ảnh đại diện hiện tại?')) return;
    hideError(avatarErrorBox);
    void (async () => {
      try {
        await window.VTApi.call('DELETE', '/me/avatar');
        renderAvatar(null, editDisplayNameInput.value || usernameDisplay.textContent);
      } catch (err) {
        showError(avatarErrorBox, avatarErrorText, err.message);
      }
    })();
  });

  // Trang này bắt buộc đăng nhập: chưa đăng nhập hoặc đang chờ 2FA thì đưa về sign-in.html.
  window.VTApi.me()
    .then(async (me) => {
      if (!me) {
        window.location.href = 'sign-in.html';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = 'sign-in.html';
        return;
      }
      const data = await window.VTApi.call('GET', '/me/profile');
      if (data.profile) showEdit(data.profile);
      else showCreate();
    })
    .catch((err) => {
      console.error(err);
      skeleton.hidden = true;
      subtitle.textContent = 'Không tải được hồ sơ. Hãy tải lại trang.';
    });
}

// Bọc một hành động nhạy cảm (@RequireStepUp ở backend): thử gọi ngay; nếu bị chặn vì "cần xác minh
// lại" (đã bật 2FA nhưng lần xác minh gần nhất đã quá 10 phút), hiện ô nhập mã ngay tại chỗ (panel
// dùng chung của trang), xác minh xong thì tự làm lại hành động ban đầu — người dùng không cần bấm
// lại nút gốc. Dùng cho gửi/huỷ tài khoản ngân hàng, tạo lại mã khôi phục...
function withStepUp(panel, action) {
  if (!panel) return action();
  const form = panel.querySelector('form');
  const codeInput = panel.querySelector('input');
  const errorBox = panel.querySelector('.form-error');
  const errorText = errorBox ? errorBox.querySelector('span') : null;

  async function attempt() {
    try {
      return await action();
    } catch (err) {
      const needsStepUp =
        err instanceof window.VTApi.ApiError && err.body && err.body.message === 'step_up_required';
      if (!needsStepUp) throw err;
      return new Promise((resolve, reject) => {
        panel.hidden = false;
        codeInput.value = '';
        codeInput.focus();
        const onSubmit = async (event) => {
          event.preventDefault();
          hideError(errorBox);
          const code = codeInput.value.trim();
          if (!code) return;
          const button = form.querySelector('button[type="submit"]');
          await submitWithLock(button, async () => {
            try {
              await window.VTApi.call('POST', '/auth/mfa/verify', { code });
              panel.hidden = true;
              form.removeEventListener('submit', onSubmit);
              try {
                resolve(await attempt());
              } catch (retryErr) {
                reject(retryErr);
              }
            } catch (verifyErr) {
              showError(errorBox, errorText, verifyErr.message);
            }
          });
        };
        form.addEventListener('submit', onSubmit);
      });
    }
  }
  return attempt();
}

// --- Trang security.html: bật/tắt 2FA, tạo lại mã khôi phục (cần đăng nhập) ---
const mfaOff = document.getElementById('mfaOff');
const mfaOn = document.getElementById('mfaOn');
if (mfaOff && mfaOn) {
  const skeleton = document.getElementById('settingsSkeleton');
  const subtitle = document.getElementById('settingsSubtitle');
  const startSetupBtn = document.getElementById('startSetupBtn');
  const mfaSetup = document.getElementById('mfaSetup');
  const secretBox = document.getElementById('secretBox');
  const otpauthLink = document.getElementById('otpauthLink');
  const enableForm = document.getElementById('enableForm');
  const enableCodeInput = document.getElementById('enableCode');
  const enableErrorBox = document.getElementById('enableError');
  const enableErrorText = document.getElementById('enableErrorText');
  const recoveryShow = document.getElementById('recoveryShow');
  const recoveryCodesBox = document.getElementById('recoveryCodes');
  const recoverySavedBtn = document.getElementById('recoverySavedBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const showDisableBtn = document.getElementById('showDisableBtn');
  const disableForm = document.getElementById('disableForm');
  const disableCodeInput = document.getElementById('disableCode');
  const disableErrorBox = document.getElementById('disableError');
  const disableErrorText = document.getElementById('disableErrorText');
  const stepUpPanel = document.getElementById('stepUpPanel');

  const hideAllPanels = () => {
    mfaOff.hidden = true;
    mfaSetup.hidden = true;
    recoveryShow.hidden = true;
    mfaOn.hidden = true;
  };

  const showRecoveryCodes = (codes) => {
    hideAllPanels();
    recoveryCodesBox.textContent = codes.join('\n');
    recoveryShow.hidden = false;
  };

  const showOn = () => {
    hideAllPanels();
    disableForm.hidden = true;
    mfaOn.hidden = false;
    subtitle.textContent = 'Tài khoản của bạn được bảo vệ bằng xác thực hai lớp.';
  };

  const showOff = () => {
    hideAllPanels();
    mfaOff.hidden = false;
    subtitle.textContent = 'Xác thực hai lớp (2FA) đang tắt.';
  };

  startSetupBtn.addEventListener('click', () => {
    void submitWithLock(startSetupBtn, async () => {
      try {
        const result = await window.VTApi.call('POST', '/auth/mfa/totp/setup');
        hideAllPanels();
        const grouped = result.secret.match(/.{1,4}/g).join(' ');
        secretBox.textContent = grouped;
        otpauthLink.innerHTML = `<a href="${result.otpauthUri}">Mở trong ứng dụng xác thực trên điện thoại</a>`;
        mfaSetup.hidden = false;
        enableCodeInput.value = '';
        enableCodeInput.focus();
      } catch (err) {
        subtitle.textContent = err.message;
      }
    });
  });

  enableForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(enableErrorBox);
    const code = enableCodeInput.value.trim();
    if (!code) return;
    const button = enableForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        const result = await window.VTApi.call('POST', '/auth/mfa/totp/enable', { code });
        showRecoveryCodes(result.recoveryCodes);
      } catch (err) {
        showError(enableErrorBox, enableErrorText, err.message);
      }
    });
  });

  recoverySavedBtn.addEventListener('click', () => {
    showOn();
  });

  regenerateBtn.addEventListener('click', () => {
    void submitWithLock(regenerateBtn, async () => {
      try {
        const result = await withStepUp(stepUpPanel, () =>
          window.VTApi.call('POST', '/auth/mfa/recovery-codes'),
        );
        showRecoveryCodes(result.recoveryCodes);
      } catch (err) {
        subtitle.textContent = err.message;
        showOn();
      }
    });
  });

  showDisableBtn.addEventListener('click', () => {
    disableForm.hidden = !disableForm.hidden;
    if (!disableForm.hidden) {
      disableCodeInput.value = '';
      disableCodeInput.focus();
    }
  });

  disableForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(disableErrorBox);
    const code = disableCodeInput.value.trim();
    if (!code) return;
    const button = disableForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await withStepUp(stepUpPanel, () =>
          window.VTApi.call('POST', '/auth/mfa/totp/disable', { code }),
        );
        showOff();
      } catch (err) {
        showError(disableErrorBox, disableErrorText, err.message);
      }
    });
  });

  window.VTApi.me()
    .then((me) => {
      if (!me) {
        window.location.href = 'sign-in.html';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = 'sign-in.html';
        return;
      }
      skeleton.hidden = true;
      if (me.mfa.enabled) showOn();
      else showOff();
      const currentEmailText = document.getElementById('currentEmailText');
      if (currentEmailText) currentEmailText.textContent = me.user.email;
    })
    .catch((err) => {
      console.error(err);
      skeleton.hidden = true;
      subtitle.textContent = 'Không tải được. Hãy tải lại trang.';
    });
}

// --- Trang security.html: đổi mật khẩu khi đang đăng nhập (xác minh bằng mật khẩu hiện tại, không cần
// 2FA — không phải ai cũng đã bật, và đây không phải đổi kênh nhận tiền) ---
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const errorBox = document.getElementById('passwordFormError');
  const errorText = document.getElementById('passwordFormErrorText');
  const savedBox = document.getElementById('passwordFormSaved');

  changePasswordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(errorBox);
    savedBox.hidden = true;
    const button = changePasswordForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await window.VTApi.call('POST', '/me/password', {
          currentPassword: currentPasswordInput.value,
          newPassword: newPasswordInput.value,
        });
        changePasswordForm.reset();
        savedBox.hidden = false;
      } catch (err) {
        showError(errorBox, errorText, err.message);
      }
    });
  });
}

// --- Trang security.html: đổi email khi đang đăng nhập (2 bước: yêu cầu ở đây, xác nhận ở
// confirm-email.html qua liên kết gửi tới email MỚI) ---
const changeEmailForm = document.getElementById('changeEmailForm');
if (changeEmailForm) {
  const newEmailInput = document.getElementById('newEmail');
  const currentPasswordInput = document.getElementById('emailCurrentPassword');
  const errorBox = document.getElementById('emailFormError');
  const errorText = document.getElementById('emailFormErrorText');
  const savedBox = document.getElementById('emailFormSaved');

  changeEmailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(errorBox);
    savedBox.hidden = true;
    const button = changeEmailForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await window.VTApi.call('POST', '/me/email', {
          newEmail: newEmailInput.value.trim(),
          currentPassword: currentPasswordInput.value,
        });
        changeEmailForm.reset();
        savedBox.hidden = false;
      } catch (err) {
        showError(errorBox, errorText, err.message);
      }
    });
  });
}

// --- Trang bank-account.html: liên kết/huỷ/tắt tài khoản ngân hàng nhận donate (cần đăng nhập) ---
const bankForm = document.getElementById('bankForm');
const bankGate = document.getElementById('bankGate');
if (bankForm && bankGate) {
  const skeleton = document.getElementById('settingsSkeleton');
  const subtitle = document.getElementById('settingsSubtitle');
  const gateText = document.getElementById('gateText');
  const bankContent = document.getElementById('bankContent');
  const bankListEl = document.getElementById('bankList');
  const bankEmpty = document.getElementById('bankEmpty');
  const bankCodeSelect = document.getElementById('bankCode');
  const accountNumberInput = document.getElementById('accountNumber');
  const holderNameInput = document.getElementById('holderName');
  const bankErrorBox = document.getElementById('bankError');
  const bankErrorText = document.getElementById('bankErrorText');
  const stepUpPanel = document.getElementById('stepUpPanel');

  const STATUS_LABELS = {
    pending_review: ['Đang chờ duyệt', 'st-pending'],
    active: ['Đang hoạt động', 'st-active'],
    rejected: ['Bị từ chối', 'st-rejected'],
    cancelled: ['Đã huỷ', 'st-off'],
    superseded: ['Đã thay thế', 'st-off'],
    disabled: ['Đã tắt', 'st-off'],
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('vi-VN');

  async function loadBankList() {
    const { bankAccounts } = await window.VTApi.call('GET', '/me/bank-accounts');
    bankListEl.innerHTML = '';
    bankEmpty.hidden = bankAccounts.length > 0;
    for (const account of bankAccounts) {
      const [label, cls] = STATUS_LABELS[account.status] || [account.status, 'st-off'];
      const canChange = account.status === 'pending_review' || account.status === 'active';
      const actionLabel = account.status === 'active' ? 'Tắt' : 'Huỷ';

      const row = document.createElement('div');
      row.className = 'bank-item';
      const noteHtml =
        account.status === 'rejected' && account.reviewNote
          ? `<div class="bank-item-note">Lý do: ${escapeHtml(account.reviewNote)}</div>`
          : '';
      row.innerHTML = `
        <div class="bank-item-info">
          <div class="bank-item-bank">${escapeHtml(account.bankName)} · **** ${escapeHtml(account.accountLast4)}</div>
          <div class="bank-item-meta">${escapeHtml(account.holderName)} · gửi lúc ${formatDate(account.createdAt)}</div>
          ${noteHtml}
        </div>
        <span class="status-badge ${cls}">${label}</span>
      `;
      if (canChange) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost btn-sm';
        btn.textContent = actionLabel;
        btn.addEventListener('click', () => {
          const ok = window.confirm(
            `${actionLabel} tài khoản ${account.bankName} **** ${account.accountLast4}?`,
          );
          if (!ok) return;
          void submitWithLock(btn, async () => {
            try {
              await withStepUp(stepUpPanel, () =>
                window.VTApi.call('DELETE', '/me/bank-accounts/' + account.id),
              );
              await loadBankList();
            } catch (err) {
              subtitle.textContent = err.message;
            }
          });
        });
        row.appendChild(btn);
      }
      bankListEl.appendChild(row);
    }
  }

  bankForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(bankErrorBox);
    const bankCode = bankCodeSelect.value;
    const accountNumber = accountNumberInput.value.trim();
    const holderName = holderNameInput.value.trim();
    const button = bankForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        await withStepUp(stepUpPanel, () =>
          window.VTApi.call('POST', '/me/bank-accounts', { bankCode, accountNumber, holderName }),
        );
        bankForm.reset();
        await loadBankList();
      } catch (err) {
        showError(bankErrorBox, bankErrorText, err.message);
      }
    });
  });

  window.VTApi.me()
    .then(async (me) => {
      if (!me) {
        window.location.href = 'sign-in.html';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = 'sign-in.html';
        return;
      }

      const [profileData, banksData] = await Promise.all([
        window.VTApi.call('GET', '/me/profile'),
        window.VTApi.call('GET', '/me/bank-accounts/banks'),
      ]);

      const missing = [];
      if (profileData.profile === null) missing.push('<a href="profile.html">tạo hồ sơ</a>');
      skeleton.hidden = true;
      if (missing.length > 0) {
        subtitle.textContent = 'Cần thêm bước sau trước khi liên kết tài khoản ngân hàng:';
        gateText.innerHTML = missing.join(' và ') + '.';
        bankGate.hidden = false;
        return;
      }

      subtitle.textContent = 'Tài khoản nhận donate của bạn.';
      bankCodeSelect.innerHTML = banksData.banks
        .map((bank) => `<option value="${escapeHtml(bank.code)}">${escapeHtml(bank.name)}</option>`)
        .join('');
      bankContent.hidden = false;
      await loadBankList();
    })
    .catch((err) => {
      console.error(err);
      skeleton.hidden = true;
      subtitle.textContent = 'Không tải được. Hãy tải lại trang.';
    });
}

// --- Trang overlay-settings.html: token overlay OBS (cần đăng nhập; xoay token cần đã bật 2FA + step-up) ---
const rotateBtn = document.getElementById('rotateBtn');
const overlayGate = document.getElementById('overlayGate');
if (rotateBtn && overlayGate) {
  const skeleton = document.getElementById('settingsSkeleton');
  const subtitle = document.getElementById('settingsSubtitle');
  const gateText = document.getElementById('gateText');
  const overlayContent = document.getElementById('overlayContent');
  const tokenStatusText = document.getElementById('tokenStatusText');
  const testEventBtn = document.getElementById('testEventBtn');
  const overlayErrorBox = document.getElementById('overlayError');
  const overlayErrorText = document.getElementById('overlayErrorText');
  const testEventOk = document.getElementById('testEventOk');
  const tokenReveal = document.getElementById('tokenReveal');
  const overlayUrlBox = document.getElementById('overlayUrlBox');
  const overlayPreviewFrame = document.getElementById('overlayPreviewFrame');
  const stepUpPanel = document.getElementById('stepUpPanel');

  const formatDate = (iso) => new Date(iso).toLocaleString('vi-VN');
  let hasToken = false;

  async function refreshStatus() {
    const { token } = await window.VTApi.call('GET', '/me/overlay-token');
    hasToken = token !== null;
    tokenStatusText.textContent = hasToken
      ? `Token overlay đã tạo lúc ${formatDate(token.createdAt)}.`
      : 'Chưa tạo token overlay nào — bấm "Xoay token" để tạo.';
  }

  bindCopyButtons(tokenReveal);

  rotateBtn.addEventListener('click', () => {
    if (hasToken) {
      const ok = window.confirm(
        'Xoay token sẽ tạo địa chỉ overlay mới và làm địa chỉ cũ mất hiệu lực ngay — overlay đang mở (nếu có) sẽ ngắt kết nối trong vài giây. Tiếp tục?',
      );
      if (!ok) return;
    }
    hideError(overlayErrorBox);
    testEventOk.hidden = true;
    void submitWithLock(rotateBtn, async () => {
      try {
        const result = await withStepUp(stepUpPanel, () =>
          window.VTApi.call('POST', '/me/overlay-token/rotate'),
        );
        overlayUrlBox.textContent = window.location.origin + '/overlay.html#token=' + result.token;
        overlayPreviewFrame.src = 'overlay.html#token=' + result.token;
        tokenReveal.hidden = false;
        await refreshStatus();
      } catch (err) {
        showError(overlayErrorBox, overlayErrorText, err.message);
      }
    });
  });

  testEventBtn.addEventListener('click', () => {
    hideError(overlayErrorBox);
    testEventOk.hidden = true;
    void submitWithLock(testEventBtn, async () => {
      try {
        await window.VTApi.call('POST', '/me/overlay-token/test-event');
        testEventOk.hidden = false;
      } catch (err) {
        showError(overlayErrorBox, overlayErrorText, err.message);
      }
    });
  });

  window.VTApi.me()
    .then(async (me) => {
      if (!me) {
        window.location.href = 'sign-in.html';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = 'sign-in.html';
        return;
      }

      skeleton.hidden = true;
      subtitle.textContent = 'Overlay hiện thông báo donate theo thời gian thực cho OBS.';
      overlayContent.hidden = false;
      await refreshStatus();
    })
    .catch((err) => {
      console.error(err);
      skeleton.hidden = true;
      subtitle.textContent = 'Không tải được. Hãy tải lại trang.';
    });
}

// --- Trang donations.html: donate của streamer + duyệt/ẩn khoản cần xem (cần đăng nhập, không cần 2FA) ---
const donationList = document.getElementById('donationList');
const reviewList = document.getElementById('reviewList');
if (donationList && reviewList) {
  const skeleton = document.getElementById('settingsSkeleton');
  const subtitle = document.getElementById('settingsSubtitle');
  const content = document.getElementById('donationsContent');
  const reviewSection = document.getElementById('reviewSection');
  const donationEmpty = document.getElementById('donationEmpty');
  const reviewErrorBox = document.getElementById('reviewError');
  const reviewErrorText = document.getElementById('reviewErrorText');

  const formatDate = (iso) => new Date(iso).toLocaleString('vi-VN');
  const formatMoney = (n) => `${new Intl.NumberFormat('vi-VN').format(n)}đ`;
  const MATCH_LABELS = {
    exact: 'khớp mã đơn',
    amount_mismatch: 'lệch số tiền so với đơn',
    no_code: 'không có mã đối soát',
  };
  const REVIEW_BADGES = {
    pending: ['Chờ bạn xem', 'st-pending'],
    approved: ['Đã hiện lên overlay', 'st-active'],
    hidden: ['Đã ẩn', 'st-off'],
  };

  function renderRow(donation, withActions) {
    const row = document.createElement('div');
    row.className = 'bank-item';
    const message = donation.message
      ? `<div class="bank-item-meta">“${escapeHtml(donation.message)}”</div>`
      : '';
    const badge = donation.needsReview
      ? REVIEW_BADGES[donation.reviewStatus]
      : ['Đã nhận', 'st-active'];
    row.innerHTML = `
      <div class="bank-item-info">
        <div class="bank-item-bank">${escapeHtml(donation.donorName)} · ${formatMoney(donation.amount)}</div>
        <div class="bank-item-meta">${formatDate(donation.createdAt)} · ${MATCH_LABELS[donation.matchType] || ''}</div>
        ${message}
      </div>
      <span class="status-badge ${badge[1]}">${badge[0]}</span>
    `;
    if (withActions) {
      const actions = document.createElement('div');
      actions.className = 'settings-actions';
      for (const [decision, label, cls] of [
        ['approve', 'Hiện lên overlay', 'btn btn-primary btn-sm'],
        ['hide', 'Ẩn', 'btn btn-ghost btn-sm'],
      ]) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = cls;
        btn.textContent = label;
        btn.addEventListener('click', () => {
          void submitWithLock(btn, async () => {
            hideError(reviewErrorBox);
            try {
              await window.VTApi.call('POST', `/me/donations/${donation.id}/review`, { decision });
            } catch (err) {
              showError(reviewErrorBox, reviewErrorText, err.message);
            }
            await load();
          });
        });
        actions.appendChild(btn);
      }
      row.appendChild(actions);
    }
    return row;
  }

  async function load() {
    const { donations } = await window.VTApi.call('GET', '/me/donations?limit=100');
    reviewList.innerHTML = '';
    donationList.innerHTML = '';
    const pending = donations.filter((d) => d.needsReview && d.reviewStatus === 'pending');
    reviewSection.hidden = pending.length === 0;
    for (const donation of pending) reviewList.appendChild(renderRow(donation, true));
    donationEmpty.hidden = donations.length > 0;
    for (const donation of donations) donationList.appendChild(renderRow(donation, false));
  }

  window.VTApi.me()
    .then(async (me) => {
      if (!me || (me.mfa.enabled && !me.mfa.verified)) {
        window.location.href = 'sign-in.html';
        return;
      }
      skeleton.hidden = true;
      subtitle.textContent = 'Các khoản donate đã về tài khoản của bạn.';
      content.hidden = false;
      await load();
    })
    .catch((err) => {
      console.error(err);
      skeleton.hidden = true;
      subtitle.textContent = 'Không tải được. Hãy tải lại trang.';
    });
}

// --- Trang u.html: trang donate công khai của một streamer (vtpage.com/<username>), không cần đăng nhập ---
const donateProfile = document.getElementById('donateProfile');
const notFoundBox = document.getElementById('notFound');
if (donateProfile && notFoundBox) {
  const skeleton = document.getElementById('donateSkeleton');
  const username = window.location.pathname.replace(/^\/+/, '').split('/')[0];

  const avatarImg = document.getElementById('creatorAvatarImg');
  const avatarFallback = document.getElementById('creatorAvatarFallback');
  const nameEl = document.getElementById('creatorName');
  const usernameEl = document.getElementById('creatorUsername');
  const bioEl = document.getElementById('creatorBio');
  const verifiedBadge = document.getElementById('verifiedBadge');
  const donateNotReady = document.getElementById('donateNotReady');
  const donateFormCard = document.getElementById('donateFormCard');
  const donateForm = document.getElementById('donateForm');
  const amountPresets = document.getElementById('amountPresets');
  const amountInput = document.getElementById('donateAmount');
  const donorNameInput = document.getElementById('donorName');
  const messageInput = document.getElementById('donateMessage');
  const donateErrorBox = document.getElementById('donateError');
  const donateErrorText = document.getElementById('donateErrorText');
  const donateInstructions = document.getElementById('donateInstructions');
  const countdownEl = document.getElementById('countdown');
  const instBank = document.getElementById('instBank');
  const instAccount = document.getElementById('instAccount');
  const instHolder = document.getElementById('instHolder');
  const instAmount = document.getElementById('instAmount');
  const instContent = document.getElementById('instContent');
  const qrWrap = document.getElementById('qrWrap');
  const instQr = document.getElementById('instQr');
  const donateWaiting = document.getElementById('donateWaiting');
  const donatePaid = document.getElementById('donatePaid');
  const donateExpired = document.getElementById('donateExpired');
  const retryBtn = document.getElementById('retryBtn');

  const vnd = (n) => `${n.toLocaleString('vi-VN')} đ`;

  amountPresets.addEventListener('click', (event) => {
    const btn = event.target.closest('.amount-preset');
    if (!btn) return;
    amountInput.value = btn.dataset.amount;
    for (const b of amountPresets.querySelectorAll('.amount-preset')) {
      b.classList.toggle('is-active', b === btn);
    }
  });
  amountInput.addEventListener('input', () => {
    for (const b of amountPresets.querySelectorAll('.amount-preset')) {
      b.classList.toggle('is-active', b.dataset.amount === amountInput.value);
    }
  });

  let pollTimer = null;
  let countdownTimer = null;

  function stopTimers() {
    if (pollTimer) clearTimeout(pollTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    pollTimer = null;
    countdownTimer = null;
  }

  function startCountdown(expiresAt) {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        countdownEl.textContent = '00:00';
        return false;
      }
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return true;
    };
    if (!tick()) return;
    countdownTimer = setInterval(() => {
      if (!tick()) clearInterval(countdownTimer);
    }, 1000);
  }

  // Hỏi máy chủ đều đặn cho tới khi đơn "paid" hoặc "expired". Máy khách có thể lệch giờ nên vẫn hỏi
  // thêm một chút sau khi đồng hồ hiển thị 00:00, lấy trạng thái THẬT từ máy chủ làm chuẩn.
  function pollStatus(id, expiresAt) {
    const check = async () => {
      let status;
      try {
        status = await window.VTApi.call('GET', `/donations/${id}`);
      } catch {
        pollTimer = setTimeout(check, 4000);
        return;
      }
      if (status.status === 'paid') {
        stopTimers();
        donateWaiting.hidden = true;
        donatePaid.hidden = false;
        return;
      }
      if (status.status === 'expired') {
        stopTimers();
        donateWaiting.hidden = true;
        donateExpired.hidden = false;
        return;
      }
      if (Date.now() > new Date(expiresAt).getTime() + 5000) {
        stopTimers();
        donateWaiting.hidden = true;
        donateExpired.hidden = false;
        return;
      }
      pollTimer = setTimeout(check, 3000);
    };
    void check();
  }

  retryBtn.addEventListener('click', () => {
    stopTimers();
    donateInstructions.hidden = true;
    donateWaiting.hidden = false;
    donatePaid.hidden = true;
    donateExpired.hidden = true;
    qrWrap.hidden = true;
    instQr.hidden = true;
    instQr.removeAttribute('src');
    donateForm.reset();
    for (const b of amountPresets.querySelectorAll('.amount-preset')) b.classList.remove('is-active');
    donateFormCard.hidden = false;
  });

  donateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(donateErrorBox);
    const amount = Number(amountInput.value);
    const donorName = donorNameInput.value.trim();
    const message = messageInput.value.trim();
    const body = { amount };
    if (donorName) body.donorName = donorName;
    if (message) body.message = message;
    const button = donateForm.querySelector('button[type="submit"]');
    void submitWithLock(button, async () => {
      try {
        const { donation } = await window.VTApi.call(
          'POST',
          `/profiles/${encodeURIComponent(username)}/donations`,
          body,
        );
        donateFormCard.hidden = true;
        instBank.textContent = donation.bank.bankName;
        instAccount.textContent = donation.bank.accountNumber;
        instHolder.textContent = donation.bank.holderName;
        instAmount.textContent = vnd(donation.amount);
        instContent.textContent = donation.content;
        donateInstructions.hidden = false;
        // Mã QR VietQR do CHÍNH SERVER dựng (backend/src/donations/vietqr.ts), nhúng sẵn dạng data URI
        // trong phản hồi — không còn gọi ảnh dựng sẵn của qr.sepay.vn (bên thứ ba) như trước. qrDataUri
        // null nếu dựng lỗi; người donate vẫn chuyển khoản thủ công được bằng các trường chữ bên dưới.
        instQr.onerror = () => {
          qrWrap.hidden = true;
          instQr.hidden = true;
        };
        if (donation.qrDataUri) {
          instQr.onload = () => {
            qrWrap.hidden = false;
            instQr.hidden = false;
          };
          instQr.src = donation.qrDataUri;
        } else {
          qrWrap.hidden = true;
          instQr.hidden = true;
        }
        startCountdown(donation.expiresAt);
        pollStatus(donation.id, donation.expiresAt);
      } catch (err) {
        showError(donateErrorBox, donateErrorText, err.message);
      }
    });
  });

  bindCopyButtons(donateInstructions);

  void (async () => {
    try {
      const profile = await window.VTApi.call('GET', `/profiles/${encodeURIComponent(username)}`);
      skeleton.hidden = true;
      document.title = `${profile.displayName} - VT Page`;
      nameEl.textContent = profile.displayName;
      usernameEl.textContent = `@${profile.username}`;
      if (profile.bio) {
        bioEl.textContent = profile.bio;
        bioEl.hidden = false;
      }
      if (profile.verified) verifiedBadge.hidden = false;
      if (profile.avatarUrl) {
        avatarImg.src = profile.avatarUrl;
        avatarImg.hidden = false;
        avatarFallback.hidden = true;
      } else {
        const color = avatarColorFor(profile.username);
        avatarFallback.style.backgroundColor = color.bg;
        avatarFallback.style.color = color.fg;
        avatarFallback.textContent = avatarInitial(profile.username);
      }
      donateProfile.hidden = false;
      if (profile.bank) donateFormCard.hidden = false;
      else donateNotReady.hidden = false;
    } catch (err) {
      console.error(err);
      skeleton.hidden = true;
      notFoundBox.hidden = false;
    }
  })();
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
              <a class="dropdown-item" href="profile.html">Thiết lập trang donate</a>
              <a class="dropdown-item" href="security.html">Tài khoản &amp; bảo mật</a>
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
