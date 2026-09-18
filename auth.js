const passwordInput = document.getElementById('password');
const toggleButton = document.querySelector('.password-toggle');
const authForm = document.querySelector('.sign-in-form');

toggleButton.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  toggleButton.setAttribute('aria-pressed', String(isHidden));
  toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
});

// Chưa có backend — chặn submit để trang không reload khi test giao diện.
authForm.addEventListener('submit', (event) => {
  event.preventDefault();
});
