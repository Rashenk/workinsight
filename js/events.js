    function setupEventListeners() {
        // Login
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide password field based on role
                const role = btn.dataset.role;
                const passwordGroup = document.getElementById('passwordGroup');
                if (role === 'admin') {
                    passwordGroup.style.display = 'block';
                } else {
                    passwordGroup.style.display = 'none';
                }
            });
        });

        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        document.getElementById('registerBtn').addEventListener('click', handleRegister);

        document.getElementById('logoutBtn').addEventListener('click', () => {
            state.currentUser = null;
            state.userRole = null;
            state.userEmail = null;
            document.getElementById('loginScreen').classList.add('active');
            document.getElementById('appContainer').classList.add('login-active');
            document.getElementById('userName').value = '';
            document.getElementById('userPassword').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regName').value = '';
            document.getElementById('regPhone').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regPasswordConfirm').value = '';
            showLoginForm(new Event('click'));
            document.querySelector('.role-btn').click();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const section = item.dataset.section;
                renderSection(section);
            });
        });

        // Reports tabs
        document.getElementById('newReportTab').addEventListener('click', () => {
            document.getElementById('newReportForm').style.display = 'block';
            document.getElementById('allReportsTable').style.display = 'none';
            document.getElementById('newReportTab').style.background = 'var(--primary)';
            document.getElementById('allReportsTab').style.background = 'var(--light-gray)';
        });

        document.getElementById('allReportsTab').addEventListener('click', () => {
            document.getElementById('newReportForm').style.display = 'none';
            document.getElementById('allReportsTable').style.display = 'block';
            document.getElementById('newReportTab').style.background = 'var(--light-gray)';
            document.getElementById('allReportsTab').style.background = 'var(--primary)';
            renderReportsTable();
        });

        // Forms
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveProject();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveTask();
        });

        document.getElementById('employeeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveEmployee();
        });

        document.getElementById('analyticsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveAnalytics();
        });

        document.getElementById('accessForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveAccess();
        });

        document.getElementById('submitReportBtn').addEventListener('click', () => {
            saveReport();
        });

        // Buttons
        document.getElementById('addProjectBtn').addEventListener('click', openProjectModal);
        document.getElementById('addTaskBtn').addEventListener('click', openTaskModal);
        document.getElementById('addEmployeeBtn').addEventListener('click', openEmployeeModal);
        document.getElementById('addAnalyticsBtn').addEventListener('click', openAnalyticsModal);
        document.getElementById('addAccessBtn').addEventListener('click', openAccessModal);

        // Modal closers
        document.getElementById('closeProjectModal').addEventListener('click', () => {
            document.getElementById('projectModal').classList.remove('active');
            delete document.getElementById('projectForm').dataset.id;
        });
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            document.getElementById('taskModal').classList.remove('active');
            delete document.getElementById('taskForm').dataset.id;
        });
        document.getElementById('closeEmployeeModal').addEventListener('click', () => {
            document.getElementById('employeeModal').classList.remove('active');
            delete document.getElementById('employeeForm').dataset.idx;
        });
        document.getElementById('closeAnalyticsModal').addEventListener('click', () => {
            document.getElementById('analyticsModal').classList.remove('active');
            delete document.getElementById('analyticsForm').dataset.idx;
        });
        document.getElementById('closeAccessModal').addEventListener('click', () => {
            document.getElementById('accessModal').classList.remove('active');
            delete document.getElementById('accessForm').dataset.idx;
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Submit forms with Enter key
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    form.dispatchEvent(new Event('submit'));
                }
            });
        });
    }

