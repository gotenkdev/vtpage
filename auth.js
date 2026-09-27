/*
 * Đăng ký / đăng nhập / phiên thật, gọi API backend qua window.VTApi (api.js).
 * Đăng ký là HAI BƯỚC: (1) gửi email, nhận liên kết xác nhận qua thư; (2) mở liên kết
 * (/complete-signup), đặt mật khẩu, tài khoản được tạo và đăng nhập luôn. Đăng nhập có thể yêu cầu
 * bước hai (2FA) nếu tài khoản đã bật.
 */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Đăng nhập bằng Google (/sign-in, sign-up.html) ---
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
      if (me && !(me.mfa.enabled && !me.mfa.verified)) window.location.href = '/';
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

  const mfaEmailBtn = document.getElementById('mfaEmailBtn');
  const mfaEmailHint = document.getElementById('mfaEmailHint');
  // 'app': mã từ ứng dụng xác thực hoặc mã khôi phục; 'email': mã vừa gửi về email (dự phòng).
  let mfaMode = 'app';

  // Chỉ hiện nút gửi mã về email khi máy chủ cho phép (đã bật app, đăng nhập bằng mật khẩu).
  const refreshEmailFallback = () =>
    window.VTApi.me()
      .then((me) => {
        if (me && me.mfa && me.mfa.emailFallback && mfaEmailBtn) mfaEmailBtn.hidden = false;
      })
      .catch(() => {});

  if (mfaEmailBtn) {
    mfaEmailBtn.addEventListener('click', () => {
      hideError(mfaErrorBox);
      void submitWithLock(mfaEmailBtn, async () => {
        try {
          const res = await window.VTApi.call('POST', '/auth/mfa/email/send');
          mfaMode = 'email';
          mfaEmailHint.textContent = `Đã gửi mã 6 số tới ${res.sentTo}. Mã hết hạn sau 10 phút.`;
          mfaEmailHint.hidden = false;
          if (authSubtitle) authSubtitle.textContent = 'Nhập mã 6 số vừa gửi về email của bạn.';
          mfaCodeInput.value = '';
          mfaCodeInput.placeholder = 'Mã 6 số trong email';
          mfaCodeInput.focus();
        } catch (err) {
          showError(mfaErrorBox, mfaErrorText, err.message);
        }
      });
    });
  }

  const showMfaStep = () => {
    void refreshEmailFallback();
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
          window.location.href = '/';
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
        await window.VTApi.call(
          'POST',
          mfaMode === 'email' ? '/auth/mfa/email/verify' : '/auth/mfa/verify',
          { code },
        );
        window.location.href = '/';
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
        window.location.href = '/';
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
    authSwitch.innerHTML = 'Hãy thử <a href="/sign-up">đăng ký lại</a>.';
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
          window.location.href = '/';
        } catch (err) {
          showError(errorBox, errorText, err.message);
          if (err.status === 400 && err.body && err.body.message === 'Liên kết không hợp lệ hoặc đã hết hạn') {
            authSwitch.innerHTML = 'Liên kết đã dùng hoặc hết hạn. Hãy <a href="/sign-up">đăng ký lại</a>.';
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
    authSwitch.innerHTML = 'Hãy thử <a href="/forgot-password">gửi lại liên kết</a>.';
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
            authSwitch.innerHTML = 'Liên kết đã dùng hoặc hết hạn. Hãy <a href="/forgot-password">gửi lại liên kết</a>.';
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
        authSwitch.innerHTML = 'Hãy thử đổi email lại từ <a href="/security">trang bảo mật</a>.';
      });
  }
}

// --- Trang profile.html: tạo hồ sơ (cần đăng nhập); sửa hồ sơ nằm ở profile-editor.js ---
const createForm = document.getElementById('createForm');
if (createForm && document.getElementById('profileEditor')) {
  const skeleton = document.getElementById('settingsSkeleton');
  const subtitle = document.getElementById('settingsSubtitle');

  const usernameInput = document.getElementById('username');
  const usernameHint = document.getElementById('usernameHint');
  const displayNameInput = document.getElementById('displayName');
  const bioInput = document.getElementById('bio');
  const createErrorBox = document.getElementById('createError');
  const createErrorText = document.getElementById('createErrorText');

  const DEFAULT_USERNAME_HINT =
    'vtpage.com/username — chữ, số, gạch dưới, 3-20 ký tự. Không đổi được sau khi tạo.';

  // Đã có hồ sơ: ẩn thẻ tạo hồ sơ, giao cho trình sửa kiểu VT Page (profile-editor.js).
  function showEdit(profile) {
    skeleton.hidden = true;
    createForm.closest('.settings-card').hidden = true;
    window.dispatchEvent(new CustomEvent('vtp:profile', { detail: profile }));
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

  // Trang này bắt buộc đăng nhập: chưa đăng nhập hoặc đang chờ 2FA thì đưa về sign-in.html.
  window.VTApi.me()
    .then(async (me) => {
      if (!me) {
        window.location.href = '/sign-in';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = '/sign-in';
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
        window.location.href = '/sign-in';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = '/sign-in';
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
    renderMethods(bankAccounts);
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

  // ---- Trang Thanh toán kiểu VT Page: công tắc Nhận donate, bảng phương thức, cửa sổ Thêm phương thức ----
  const acceptSwitch = document.getElementById('acceptSwitch');
  const bankPanel = document.getElementById('bankPanel');
  const methodRows = document.getElementById('methodRows');
  const methodDialog = document.getElementById('methodDialog');
  const PAY_ICONS = {
    bank: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    momo: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7 10.5v-2l2.2 2 2.3-2v2M12.5 10.5v-2l2.2 2 2.3-2v2M7 15.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0M13 15.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M16 13.5h.01"/>',
  };
  const METHODS = [
    { id: 'bank', name: 'Ngân hàng (QR Code) · SePay', currency: 'VND', icon: 'bank', ready: true },
    { id: 'momo', name: 'Ví điện tử Momo · SePay', currency: 'VND', icon: 'momo', ready: false, note: 'Chưa kết nối · sắp có' },
    { id: 'wallet', name: 'Ví VTPage', currency: 'VND', icon: 'wallet', ready: false, note: 'Người xem nạp tiền vào ví để donate · sắp có' },
  ];
  const payIcon = (name) =>
    `<span class="pay-ic" aria-hidden="true"><svg viewBox="0 0 24 24">${PAY_ICONS[name]}</svg></span>`;
  let bankInstalled = false;

  function setAccept(on) {
    acceptSwitch.setAttribute('aria-checked', String(on));
    document.getElementById('acceptText').textContent = on ? 'Đang bật' : 'Đang tắt — trang không nhận donate mới';
    document.getElementById('acceptDot').classList.toggle('is-off', !on);
  }
  acceptSwitch.addEventListener('click', async () => {
    const next = acceptSwitch.getAttribute('aria-checked') !== 'true';
    if (!next && !window.confirm('Tắt nhận donate? Người xem sẽ không tạo được đơn donate mới cho tới khi bạn bật lại.')) return;
    const errBox = document.getElementById('acceptError');
    hideError(errBox);
    acceptSwitch.disabled = true;
    try {
      const { profile } = await window.VTApi.call('PATCH', '/me/profile', { acceptingDonations: next });
      setAccept(profile.acceptingDonations);
    } catch (err) {
      showError(errBox, document.getElementById('acceptErrorText'), err.message);
    } finally {
      acceptSwitch.disabled = false;
    }
  });

  function openBankPanel() {
    if (methodDialog.open) methodDialog.close();
    // Điền sẵn thông tin tài khoản đang chờ duyệt (nếu có) hoặc đang dùng.
    const current =
      lastAccounts.find((a) => a.status === 'pending_review') ||
      lastAccounts.find((a) => a.status === 'active');
    if (current) {
      bankCodeSelect.value = current.bankCode;
      accountNumberInput.value = current.accountNumber || '';
      holderNameInput.value = current.holderName;
      prefill = { bankCode: current.bankCode, accountNumber: current.accountNumber || '', holderName: current.holderName };
    } else {
      prefill = null;
    }
    bankPanel.hidden = false;
    bankPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.getElementById('bankPanelClose').addEventListener('click', () => {
    bankPanel.hidden = true;
  });

  let lastAccounts = [];
  let prefill = null; // tài khoản đã điền sẵn khi bấm Chỉnh sửa (để không gửi lại y nguyên)
  function renderMethods(accounts) {
    lastAccounts = accounts;
    const active = accounts.find((a) => a.status === 'active');
    const pending = accounts.find((a) => a.status === 'pending_review');
    bankInstalled = Boolean(active || pending);
    methodRows.textContent = '';
    document.getElementById('methodCount').textContent = bankInstalled ? '1' : '0';
    document.getElementById('methodEmpty').hidden = bankInstalled;
    if (bankInstalled) {
      const row = document.createElement('div');
      row.className = 'pay-row';
      row.setAttribute('role', 'row');
      const main = active || pending;
      const lines = [];
      lines.push(`<strong>${escapeHtml(main.bankName)} · •••• ${escapeHtml(main.accountLast4)}</strong>`);
      lines.push(
        active
          ? '<span class="pay-state"><span class="dot"></span>Đang nhận tiền</span>'
          : '<span class="pay-state is-wait"><span class="dot"></span>Đang chờ duyệt</span>',
      );
      if (active && pending) {
        lines.push(`<span class="pay-state is-wait"><span class="dot"></span>Đổi sang ${escapeHtml(pending.bankName)} •••• ${escapeHtml(pending.accountLast4)}: chờ duyệt</span>`);
      }
      row.innerHTML = `
        <span role="cell" class="pay-method">${payIcon('bank')}<span><strong>Ngân hàng (QR Code) · SePay</strong><small>VND</small></span></span>
        <span role="cell" class="pay-account">${lines.join('')}</span>
        <span role="cell" class="pay-fee"><strong>Không phụ phí</strong></span>
        <span role="cell" class="pay-actions-col"></span>`;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-outline btn-sm';
      edit.textContent = 'Chỉnh sửa';
      edit.addEventListener('click', openBankPanel);
      row.lastElementChild.append(edit);
      methodRows.append(row);
    }
  }

  function renderOptions() {
    const box = document.getElementById('methodOptions');
    box.textContent = '';
    for (const m of METHODS) {
      const installed = m.id === 'bank' && bankInstalled;
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'pay-option';
      option.disabled = !m.ready;
      const sub = installed ? m.currency + ' · Đã cài đặt' : m.ready ? m.currency : m.note;
      option.innerHTML = `${payIcon(m.icon)}<span class="pay-option-text"><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(sub)}</small></span><span class="pay-option-mark" aria-hidden="true">${installed ? '✓' : m.ready ? '+' : ''}</span>`;
      if (m.ready) option.addEventListener('click', openBankPanel);
      box.append(option);
    }
  }
  document.getElementById('addMethodBtn').addEventListener('click', () => {
    renderOptions();
    methodDialog.showModal();
  });
  document.getElementById('methodDialogClose').addEventListener('click', () => methodDialog.close());
  methodDialog.addEventListener('click', (event) => {
    if (event.target === methodDialog) methodDialog.close();
  });

  // ---- Kết nối SePay: API Key tự nhập + tài khoản ngân hàng + danh sách kiểm tra (kiểu VT Page) ----
  const sepayUrl = document.getElementById('sepayUrl');
  const sepayKey = document.getElementById('sepayKey');
  const sepayState = document.getElementById('sepayState');
  const bankSave = document.getElementById('bankSave');
  const bankSaved = document.getElementById('bankSaved');
  const checks = [...bankForm.querySelectorAll('.pay-check-box')];
  let endpoint = null;

  function renderEndpoint() {
    sepayUrl.value = location.origin + '/api/v1/webhooks/sepay';
    if (!endpoint) {
      sepayState.className = 'pay-state is-wait';
      sepayState.innerHTML = '<span class="dot"></span>Chưa kết nối SePay — nhập API Key để kết nối';
      return;
    }
    if (endpoint.sharedUrl) sepayUrl.value = endpoint.sharedUrl;
    const ok = endpoint.verified;
    sepayState.className = 'pay-state' + (ok ? '' : ' is-wait');
    sepayState.innerHTML =
      '<span class="dot"></span>' +
      escapeHtml(
        `Đã kết nối · API Key ••••${endpoint.secretHint} · ` +
          (ok ? 'đã nhận thông báo thử từ SePay' : 'chưa nhận thông báo thử từ SePay (bấm "Gửi thử" trong SePay)'),
      );
  }
  async function loadEndpoint() {
    try {
      endpoint = (await window.VTApi.call('GET', '/me/payment-endpoint')).endpoint;
    } catch {
      endpoint = null;
    }
    renderEndpoint();
  }

  const updateSave = () => {
    bankSave.disabled = !checks.every((c) => c.checked);
  };
  checks.forEach((c) => c.addEventListener('change', updateSave));

  document.getElementById('sepayKeyGen').addEventListener('click', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(30));
    const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    sepayKey.value = 'vtpk_' + b64;
    sepayKey.type = 'text';
  });
  document.getElementById('sepayKeyEye').addEventListener('click', () => {
    sepayKey.type = sepayKey.type === 'password' ? 'text' : 'password';
  });
  bankForm.querySelectorAll('[data-copy]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const input = document.getElementById(btn.dataset.copy);
      if (!input.value) return;
      try {
        await navigator.clipboard.writeText(input.value);
        btn.classList.add('is-copied');
        setTimeout(() => btn.classList.remove('is-copied'), 1200);
      } catch {
        input.select();
      }
    }),
  );

  bankForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(bankErrorBox);
    bankSaved.hidden = true;
    const apiKey = sepayKey.value.trim();
    const bankCode = bankCodeSelect.value;
    const accountNumber = accountNumberInput.value.trim();
    const holderName = holderNameInput.value.trim();
    // Thông tin ngân hàng giữ nguyên như lúc điền sẵn: không gửi lại (gửi lại sẽ bị coi là tài khoản mới).
    const bankUnchanged =
      prefill !== null &&
      prefill.bankCode === bankCode &&
      prefill.accountNumber === accountNumber &&
      prefill.holderName.toUpperCase() === holderName.toUpperCase();
    const sendBank = Boolean(accountNumber) && !bankUnchanged;
    if (!apiKey && !sendBank) {
      if (bankUnchanged) {
        bankSaved.textContent = 'Không có thay đổi nào để lưu.';
        bankSaved.hidden = false;
        return;
      }
      showError(bankErrorBox, bankErrorText, 'Nhập API Key hoặc tài khoản ngân hàng cần lưu.');
      return;
    }
    if (accountNumber && !holderName) {
      showError(bankErrorBox, bankErrorText, 'Vui lòng nhập tên chủ tài khoản.');
      return;
    }
    void submitWithLock(bankSave, async () => {
      const done = [];
      try {
        if (apiKey) {
          await withStepUp(stepUpPanel, () =>
            endpoint
              ? window.VTApi.call('POST', '/me/payment-endpoint/rotate-secret', { apiKey, revokeOldNow: true })
              : window.VTApi.call('POST', '/me/payment-endpoint', { apiKey }),
          );
          sepayKey.value = '';
          sepayKey.type = 'password';
          done.push('API Key');
          await loadEndpoint();
        }
        if (sendBank) {
          await withStepUp(stepUpPanel, () =>
            window.VTApi.call('POST', '/me/bank-accounts', { bankCode, accountNumber, holderName }),
          );
          done.push('tài khoản ngân hàng');
        }
        await loadBankList();
        if (sendBank) openBankPanel();
        bankSaved.textContent = 'Đã lưu ' + done.join(' và ') + '.';
        bankSaved.hidden = false;
      } catch (err) {
        if (done.length) {
          bankSaved.textContent = 'Đã lưu ' + done.join(' và ') + '.';
          bankSaved.hidden = false;
        }
        showError(bankErrorBox, bankErrorText, err.message);
      }
    });
  });

  window.VTApi.me()
    .then(async (me) => {
      if (!me) {
        window.location.href = '/sign-in';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = '/sign-in';
        return;
      }

      const [profileData, banksData] = await Promise.all([
        window.VTApi.call('GET', '/me/profile'),
        window.VTApi.call('GET', '/me/bank-accounts/banks'),
      ]);

      const missing = [];
      if (profileData.profile === null) missing.push('<a href="/profile">tạo hồ sơ</a>');
      skeleton.hidden = true;
      if (missing.length > 0) {
        subtitle.textContent = 'Cần thêm bước sau trước khi liên kết tài khoản ngân hàng:';
        gateText.innerHTML = missing.join(' và ') + '.';
        bankGate.hidden = false;
        return;
      }

      subtitle.hidden = true; // đầu trang của khung thiết lập đã có mô tả
      setAccept(profileData.profile.acceptingDonations !== false);
      const pageLink = document.getElementById('payPageLink');
      pageLink.href = '/' + encodeURIComponent(profileData.profile.username);
      pageLink.textContent = location.host + '/' + profileData.profile.username;
      bankCodeSelect.innerHTML = banksData.banks
        .map((bank) => `<option value="${escapeHtml(bank.code)}">${escapeHtml(bank.name)}</option>`)
        .join('');
      bankContent.hidden = false;
      await Promise.all([loadBankList(), loadEndpoint()]);
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
        overlayUrlBox.textContent = window.location.origin + '/overlay#token=' + result.token;
        overlayPreviewFrame.src = '/overlay#token=' + result.token;
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
        window.location.href = '/sign-in';
        return;
      }
      if (me.mfa.enabled && !me.mfa.verified) {
        window.location.href = '/sign-in';
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

// --- Menu tài khoản (bấm ảnh đại diện): hai thẻ Cá nhân / Trang, kiểu VT Page ---
const ACCT_ICONS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1-4 4.2-6 8-6s7 2 8 6"/>',
  store: '<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5v8h13v-8"/><path d="M10 19.5v-4h4v4"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  logout: '<path d="M14 4.5h4.5v15H14"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
  profile: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="11" r="2.4"/><path d="M5.8 17c.6-1.8 1.8-2.8 3.2-2.8s2.6 1 3.2 2.8M14 10h4M14 13.5h3"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M4.5 9.5h15"/><path d="M6.5 10v7M10.5 10v7M13.5 10v7M17.5 10v7"/><path d="M3.5 19.5h17"/>',
  list: '<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4" cy="6.5" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="17.5" r="1"/>',
  screen: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20h7M12 16.5V20"/>',
  eye: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>',
};
function acctIcon(name) {
  return `<svg class="acct-ic" viewBox="0 0 24 24" aria-hidden="true">${ACCT_ICONS[name] || ''}</svg>`;
}

function setupAccountMenu() {
  const panel = document.getElementById('userPanel');
  if (!panel) return;
  const tabs = { me: document.getElementById('acctTabMe'), page: document.getElementById('acctTabPage') };
  const panes = { me: document.getElementById('acctMe'), page: document.getElementById('acctPage') };
  let profileLoaded = false;

  // Bấm bên trong menu (đổi thẻ) không được đóng menu.
  panel.addEventListener('click', (event) => event.stopPropagation());

  const loadProfile = () => {
    if (profileLoaded) return;
    profileLoaded = true;
    window.VTApi.call('GET', '/me/profile')
      .then(({ profile }) => {
        const name = document.getElementById('acctName');
        const handle = document.getElementById('acctHandle');
        const avatar = document.getElementById('acctAvatar');
        if (!profile) {
          name.textContent = 'Chưa có trang';
          handle.textContent = 'Tạo hồ sơ để nhận donate';
          avatar.textContent = '+';
          return;
        }
        name.textContent = profile.displayName || profile.username;
        handle.textContent = '@' + profile.username;
        if (profile.avatarUrl) {
          const img = document.createElement('img');
          img.className = 'acct-avatar';
          img.src = profile.avatarUrl;
          img.alt = '';
          avatar.replaceWith(img);
        } else {
          avatar.textContent = (profile.displayName || profile.username).slice(0, 1).toUpperCase();
        }
        const view = document.getElementById('acctView');
        view.href = '/' + encodeURIComponent(profile.username);
        view.target = '_blank';
        view.rel = 'noopener';
        view.hidden = false;
      })
      .catch(() => {
        document.getElementById('acctHandle').textContent = '';
      });
  };

  const select = (key) => {
    for (const k of Object.keys(tabs)) {
      const on = k === key;
      tabs[k].setAttribute('aria-selected', String(on));
      tabs[k].tabIndex = on ? 0 : -1;
      panes[k].hidden = !on;
    }
    if (key === 'page') loadProfile();
    try {
      localStorage.setItem('vtp-acct-tab', key);
    } catch {
      // Trình duyệt chặn lưu trữ: chỉ không nhớ thẻ.
    }
  };
  tabs.me.addEventListener('click', () => select('me'));
  tabs.page.addEventListener('click', () => select('page'));

  // Mặc định: đang ở trang thiết lập donate thì mở thẻ Trang; còn lại theo lần chọn trước.
  const donatePages = ['profile', 'bank', 'donations', 'orders', 'overlay'];
  let initial = donatePages.includes(document.body.dataset.dash) ? 'page' : 'me';
  if (!document.body.dataset.dash) {
    try {
      if (localStorage.getItem('vtp-acct-tab') === 'page') initial = 'page';
    } catch {
      // bỏ qua
    }
  }
  select(initial);

  // Đánh dấu mục ứng với trang đang mở.
  const here = window.location.pathname.replace(/\.html$/, '') || '/';
  panel.querySelectorAll('a.acct-item').forEach((a) => {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
}

// (Trang Lịch sử donate /donations: xem donations-page.js.)

// --- Trang u.html: trang donate công khai của một streamer (vtpage.com/<username>), không cần đăng nhập ---
const donateProfile = document.getElementById('donateProfile');
const notFoundBox = document.getElementById('notFound');
// Ảnh bìa, phân loại, tags và mạng xã hội trên trang donate công khai. Chữ đưa vào bằng textContent; liên kết mạng xã hội
// luôn ghép với tên miền cố định (VTProfileMeta), giá trị đã được máy chủ kiểm chỉ gồm ký tự an toàn.
function renderCreatorExtras(profile) {
  const meta = window.VTProfileMeta;
  const cover = document.getElementById('creatorCover');
  if (profile.coverUrl) {
    cover.style.backgroundImage = 'url("' + profile.coverUrl + '")';
    cover.hidden = false;
    cover.classList.add('has-image');
  }
  if (!meta) return;
  const chip = document.getElementById('creatorCategory');
  const category = meta.CATEGORIES.find(([v]) => v && v === profile.category);
  if (category) {
    chip.textContent = category[1];
    chip.hidden = false;
  }
  const tagsBox = document.getElementById('creatorTags');
  for (const tag of profile.tags || []) {
    const label = meta.TAGS.find(([v]) => v === tag);
    if (!label) continue;
    const span = document.createElement('span');
    span.textContent = '#' + label[1];
    tagsBox.append(span);
  }
  tagsBox.hidden = !tagsBox.childElementCount;
  const socialsBox = document.getElementById('creatorSocials');
  for (const s of meta.SOCIALS) {
    const value = (profile.socials || {})[s.key];
    if (!value) continue;
    const a = document.createElement('a');
    a.href = s.url(encodeURI(value));
    if (s.key !== 'phone') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer nofollow';
    }
    a.textContent = s.key === 'phone' ? '+84 ' + value : s.label;
    socialsBox.append(a);
  }
  socialsBox.hidden = !socialsBox.childElementCount;
}

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

  // ---- Ghi âm lời nhắn (khi streamer bật) ----
  const recording = { info: null, blob: null, recorder: null, timer: null };
  const recBox = document.getElementById('recBox');
  const recStart = document.getElementById('recStart');
  const recStop = document.getElementById('recStop');
  const recPlayer = document.getElementById('recPlayer');
  const recDelete = document.getElementById('recDelete');
  function setupRecording(info) {
    recording.info = info;
    if (!info.enabled || !window.MediaRecorder || !navigator.mediaDevices) return;
    recBox.hidden = false;
    document.getElementById('recHint').textContent =
      `Tối đa ${info.maxSeconds} giây, donate từ ${vnd(info.minAmount)}.`;
  }
  function resetRecording() {
    recording.blob = null;
    recPlayer.hidden = true;
    recPlayer.removeAttribute('src');
    recDelete.hidden = true;
    recStart.hidden = false;
  }
  recStart.addEventListener('click', async () => {
    hideError(donateErrorBox);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showError(donateErrorBox, donateErrorText, 'Không mở được micro. Hãy cho phép trình duyệt dùng micro.');
      return;
    }
    const chunks = [];
    const type = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined);
    recording.recorder = rec;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(recording.timer);
      recording.blob = new Blob(chunks, { type: (rec.mimeType || 'audio/webm').split(';')[0] });
      recPlayer.src = URL.createObjectURL(recording.blob);
      recPlayer.hidden = false;
      recDelete.hidden = false;
      recStop.hidden = true;
    };
    rec.start();
    let seconds = 0;
    document.getElementById('recTime').textContent = '0';
    recStart.hidden = true;
    recStop.hidden = false;
    recording.timer = setInterval(() => {
      seconds += 1;
      document.getElementById('recTime').textContent = String(seconds);
      if (seconds >= recording.info.maxSeconds) rec.stop();
    }, 1000);
  });
  recStop.addEventListener('click', () => recording.recorder && recording.recorder.state === 'recording' && recording.recorder.stop());
  recDelete.addEventListener('click', resetRecording);
  async function uploadRecording() {
    const res = await fetch(`/api/v1/profiles/${encodeURIComponent(username)}/recordings`, {
      method: 'POST',
      headers: { 'content-type': recording.blob.type || 'audio/webm' },
      credentials: 'same-origin',
      body: recording.blob,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(window.VTApi.describe(data.message) || 'Không gửi được bản ghi âm.');
    return data.recordingKey;
  }

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
        const musicUrl = document.getElementById('donateMusic').value.trim();
        if (musicUrl) body.musicUrl = musicUrl;
        // Bản ghi âm (nếu có và đủ số tiền tối thiểu): tải lên trước, gắn khóa vào đơn.
        if (recording.blob && recording.info && amount >= recording.info.minAmount) {
          body.recordingKey = await uploadRecording();
        }
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
      renderCreatorExtras(profile);
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
      if (profile.donate) {
        setupRecording(profile.donate.recording);
        // Ô link YouTube (tab Phát nhạc) do public-page.js điều khiển.
        if (profile.donate.minAmount > 2000) amountInput.min = String(profile.donate.minAmount);
      }
      if (profile.acceptingDonations === false) {
        donateNotReady.querySelector('p').textContent = 'Streamer đang tạm ngưng nhận donate. Hãy quay lại sau.';
        donateNotReady.hidden = false;
      } else if (profile.bank) donateFormCard.hidden = false;
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
        authButtons.innerHTML = `<a href="/sign-in" class="btn btn-outline">Hoàn tất đăng nhập (2FA)</a>`;
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
            <div class="dropdown-panel acct-panel" id="userPanel" hidden>
              <div class="acct-tabs" role="tablist" aria-label="Menu tài khoản">
                <button type="button" class="acct-tab" role="tab" id="acctTabMe" aria-controls="acctMe" aria-selected="true">${acctIcon('user')}Cá nhân</button>
                <button type="button" class="acct-tab" role="tab" id="acctTabPage" aria-controls="acctPage" aria-selected="false">${acctIcon('store')}Trang</button>
              </div>
              <div class="acct-pane" id="acctMe" role="tabpanel" aria-labelledby="acctTabMe">
                <div class="acct-email">${escapeHtml(email)}</div>
                <div class="acct-group">Tài khoản cá nhân</div>
                <a class="acct-item" href="/security">${acctIcon('shield')}<span>Tài khoản &amp; bảo mật</span></a>
                <button type="button" class="acct-item" id="logoutBtn">${acctIcon('logout')}<span>Đăng xuất</span></button>
              </div>
              <div class="acct-pane" id="acctPage" role="tabpanel" aria-labelledby="acctTabPage" hidden>
                <a class="acct-card" id="acctCard" href="/profile">
                  <span class="acct-avatar" id="acctAvatar" aria-hidden="true">·</span>
                  <span class="acct-card-meta"><strong id="acctName">Trang của bạn</strong><span id="acctHandle">Đang tải…</span></span>
                </a>
                <div class="acct-group">Thiết lập trang donate</div>
                <a class="acct-item" href="/profile">${acctIcon('profile')}<span>Hồ sơ trang</span></a>
                <a class="acct-item" href="/bank-account">${acctIcon('bank')}<span>Thanh toán</span></a>
                <a class="acct-item" href="/donations">${acctIcon('list')}<span>Lịch sử donate</span></a>
                <a class="acct-item" href="/orders">${acctIcon('list')}<span>Đơn hàng</span></a>
                <a class="acct-item" href="/overlay-settings">${acctIcon('screen')}<span>Cài đặt Donate</span></a>
                <a class="acct-item" id="acctView" href="/profile" hidden>${acctIcon('eye')}<span>Xem trang donate</span></a>
              </div>
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

      setupAccountMenu();

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
