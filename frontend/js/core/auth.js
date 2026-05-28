// Authentication functions

async function handleLogin() {
  const emailInput = document.getElementById('userName');
  const passwordInput = document.getElementById('userPassword');

  if (!emailInput?.value || !passwordInput?.value) {
    showToast('Введите email и пароль', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast('❌ ' + (data.error || 'Неправильный email или пароль'), 'error');
      return;
    }

    state.setUser(data.user, data.token);
    hideLoginScreen();
    await loadAppData();
    showToast('✅ Добро пожаловать, ' + data.user.name + '!', 'success');
  } catch (error) {
    console.error('❌ Login error:', error);
    showToast('❌ Ошибка входа: ' + error.message, 'error');
  }
}

async function handleRegister() {
  const emailInput = document.getElementById('regEmail');
  const nameInput = document.getElementById('regName');
  const phoneInput = document.getElementById('regPhone');
  const passwordInput = document.getElementById('regPassword');
  const passwordConfirmInput = document.getElementById('regPasswordConfirm');

  const email = emailInput.value.trim();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirm = passwordConfirmInput.value;

  if (!email || !name || !password) {
    showToast('❌ Заполните обязательные поля', 'error');
    return;
  }

  // Basic name validation: require at least first name and last name (two words)
  const nameParts = name.split(/\s+/).filter(Boolean);
  if (nameParts.length < 2 || name.length < 3) {
    showToast('❌ Укажите полное имя (имя и фамилия)', 'error');
    return;
  }

  // Basic phone validation (Russian-friendly): +7XXXXXXXXXX or 8XXXXXXXXXX or 9XXXXXXXXX
  if (phone) {
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    const phoneRegex = /^(7|8)?\d{10}$/; // allows 10 digits with optional leading 7 or 8
    if (!phoneRegex.test(phoneDigits)) {
      showToast('❌ Неверный формат телефона. Пример: +7 910 123-45-67', 'error');
      return;
    }
  }

  if (password !== passwordConfirm) {
    showToast('❌ Пароли не совпадают', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('❌ Пароль должен быть минимум 6 символов', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone, password, passwordConfirm })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast('❌ ' + (data.error || 'Ошибка при регистрации'), 'error');
      return;
    }

    state.setUser(data.user, data.token);
    hideLoginScreen();
    await loadAppData();
    showToast('✅ Добро пожаловать, ' + data.user.name + '!', 'success');
  } catch (error) {
    console.error('Register error:', error);
    showToast('❌ Ошибка регистрации: ' + error.message, 'error');
  }
}

function logout() {
  state.logout();
  showLoginScreen();
  document.getElementById('userName').value = '';
  document.getElementById('userPassword').value = '';
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appContainer = document.getElementById('appContainer');
  loginScreen.classList.add('active');
  appContainer.style.display = 'none';
  showLoginForm();
}

function hideLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appContainer = document.getElementById('appContainer');
  loginScreen.classList.remove('active');
  appContainer.style.display = 'flex';
}

function showLoginForm(event) {
  if (event) event.preventDefault();
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('passwordGroup').style.display = 'block';
}

function showRegisterForm(event) {
  if (event) event.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'flex';
}

// Role selector — visual only. Roles are determined by the user record on the backend,
// the password field stays visible for both options.
document.addEventListener('DOMContentLoaded', () => {
  const roleBtns = document.querySelectorAll('.role-btn');
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});
