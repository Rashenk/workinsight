    function showLoginForm(e) {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    }

    function showRegisterForm(e) {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    }

    function handleRegister() {
        const email = document.getElementById('regEmail').value.trim();
        const name = document.getElementById('regName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;

        // Clear errors
        document.getElementById('emailError').style.display = 'none';
        document.getElementById('phoneError').style.display = 'none';
        document.getElementById('passwordError').style.display = 'none';

        let hasError = false;

        // Validate email
        if (!email || !validateEmail(email)) {
            document.getElementById('emailError').textContent = 'Введите корректный email';
            document.getElementById('emailError').style.display = 'block';
            hasError = true;
        }

        // Check email exists
        if (state.users.find(u => u.email === email)) {
            document.getElementById('emailError').textContent = 'Email уже зарегистрирован';
            document.getElementById('emailError').style.display = 'block';
            hasError = true;
        }

        // Validate name
        if (!name) {
            alert('Введите имя и фамилию');
            hasError = true;
        }

        // Validate phone
        if (!phone || !validatePhone(phone)) {
            document.getElementById('phoneError').textContent = 'Введите корректный номер телефона';
            document.getElementById('phoneError').style.display = 'block';
            hasError = true;
        }

        // Validate password
        if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'Пароль должен быть минимум 6 символов';
            document.getElementById('passwordError').style.display = 'block';
            hasError = true;
        }

        // Check passwords match
        if (password !== passwordConfirm) {
            document.getElementById('passwordError').textContent = 'Пароли не совпадают';
            document.getElementById('passwordError').style.display = 'block';
            hasError = true;
        }

        if (hasError) return;

        // Register user
        state.users.push({
            email: email,
            name: name,
            phone: phone,
            password: password,
            role: 'employee',
            createdAt: new Date().toISOString()
        });

        saveDataToLocalStorage();
        showToast('✓ Аккаунт создан! Войдите с вашей почтой');

        // Clear form
        document.getElementById('regEmail').value = '';
        document.getElementById('regName').value = '';
        document.getElementById('regPhone').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';

        // Show login form
        setTimeout(() => showLoginForm(new Event('click')), 1500);
    }

    function handleLogin() {
        const input = document.getElementById('userName').value.trim();
        const role = document.querySelector('.role-btn.active').dataset.role;

        if (!input) {
            alert('Введите email или имя');
            return;
        }

        // Find user by email or name
        let user = state.users.find(u => u.email === input || u.name === input);

        if (user) {
            // User registered - check password
            const password = document.getElementById('userPassword').value;
            if (password !== user.password) {
                alert('Неверный пароль');
                return;
            }
            state.currentUser = user.name;
            state.userEmail = user.email;
            state.userRole = 'employee';
        } else {
            // Guest or admin login
            if (role === 'admin') {
                const password = document.getElementById('userPassword').value;
                if (password !== 'admin2026') {
                    alert('Неверный пароль администратора');
                    return;
                }
                state.currentUser = input;
                state.userRole = 'admin';
            } else {
                // Allow guest login
                state.currentUser = input;
                state.userRole = 'employee';
            }
        }

        // Login success
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appContainer').classList.remove('login-active');
        document.getElementById('userName2').textContent = state.currentUser;
        document.getElementById('userRole2').textContent = state.userRole === 'admin' ? 'Администратор' : 'Сотрудник';

        // Show/hide sections based on role
        const adminSection = document.getElementById('adminSection');
        const analyticsItems = document.querySelectorAll('[data-section="analytics"]');

        if (state.userRole === 'admin') {
            adminSection.style.display = 'block';
            analyticsItems.forEach(item => item.style.display = 'block');
            document.querySelectorAll('.nav-item').forEach(item => item.style.display = 'flex');
        } else {
            adminSection.style.display = 'none';
            analyticsItems.forEach(item => item.style.display = 'none');
            document.querySelectorAll('[data-section="access"]').forEach(item => item.style.display = 'none');
        }

        renderDashboard();
    }

