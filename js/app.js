// ======================== STATE ========================
const state = {
    currentUser: null,
    userRole: null,
    userEmail: null,
    projects: [],
    tasks: [],
    employees: [],
    analytics: [],
    access: [],
    reports: [],
    users: [],
    currentScreenshot: null
};

// ======================== INITIALIZATION ========================
function initializeApp() {
    loadDataFromLocalStorage();
    if (!localStorage.getItem('workinsight_initialized')) {
        loadInitialData();
        localStorage.setItem('workinsight_initialized', 'true');
    }
    setupEventListeners();
    renderDashboard();
}

function loadInitialData() {
    state.projects = [
        {"id":1, "name":"Мужской бренд одежды", "stage":"Проблемный", "responsible":"Дима Кичигин", "platform":"Instagram+ВК", "priority":10, "planReels":60, "doneReels":26, "startDate":"", "comment":""},
        {"id":2, "name":"Диски", "stage":"В работе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":5, "planReels":80, "doneReels":58, "startDate":"", "comment":""},
        {"id":3, "name":"Товары оптом из Китая", "stage":"В работе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":5, "planReels":80, "doneReels":61, "startDate":"", "comment":""},
        {"id":4, "name":"Картины по металлу", "stage":"В работе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":5, "planReels":80, "doneReels":39, "startDate":"", "comment":""},
        {"id":5, "name":"Идилия капельницы", "stage":"В работе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":7, "planReels":80, "doneReels":0, "startDate":"2026-03-31", "comment":""},
        {"id":6, "name":"Покер Москва", "stage":"В работе", "responsible":"Валера", "platform":"Instagram", "priority":8, "planReels":80, "doneReels":52, "startDate":"", "comment":""},
        {"id":7, "name":"Покер Питер", "stage":"Готово", "responsible":"Александр Рубцов", "platform":"Instagram", "priority":5, "planReels":90, "doneReels":90, "startDate":"", "comment":"Выплачено"},
        {"id":8, "name":"Баер из Китая", "stage":"Готово", "responsible":"Константин", "platform":"Instagram", "priority":3, "planReels":60, "doneReels":6, "startDate":"", "comment":"Отказ"},
        {"id":9, "name":"Марафон по религии", "stage":"Готово", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":8, "planReels":90, "doneReels":90, "startDate":"", "comment":"Выплачено"},
        {"id":10, "name":"Авто в аренду Москва", "stage":"В работе", "responsible":"Артём", "platform":"Instagram", "priority":6, "planReels":90, "doneReels":0, "startDate":"", "comment":""},
        {"id":11, "name":"Консалтинг ресторанов", "stage":"В работе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":6, "planReels":60, "doneReels":0, "startDate":"", "comment":""},
        {"id":12, "name":"Клубника в шоколаде", "stage":"В работе", "responsible":"Александр Рубцов", "platform":"Instagram", "priority":5, "planReels":50, "doneReels":0, "startDate":"", "comment":""},
        {"id":13, "name":"Студия рисования", "stage":"На паузе", "responsible":"Елена", "platform":"Instagram", "priority":4, "planReels":50, "doneReels":0, "startDate":"", "comment":""},
        {"id":14, "name":"ИИ-тренер", "stage":"В работе", "responsible":"Александр Рубцов", "platform":"Instagram", "priority":9, "planReels":150, "doneReels":0, "startDate":"", "comment":"Только рилсы"}
    ];

    state.analytics = [
        {"project":"Диски", "responsible":"Дима Кичигин", "startDate":"2026-03-11", "views":118870, "subs":24, "totalSubs":13, "interactions":286, "period":"11.03-30.03"},
        {"project":"Картины по металлу", "responsible":"Дима Кичигин", "startDate":"2026-03-23", "views":31119, "subs":0, "totalSubs":0, "interactions":312, "period":"23.03-30.03"},
        {"project":"Консалтинг ресторанов", "responsible":"Дима Кичигин", "startDate":"2026-02-17", "views":10395, "subs":0, "totalSubs":0, "interactions":37, "period":"17.02-30.03"},
        {"project":"Марафон по религии", "responsible":"Дима Кичигин", "startDate":"2026-02-17", "views":178823, "subs":181, "totalSubs":87, "interactions":71, "period":"17.02-30.03"},
        {"project":"Роллы, пицца, суши", "responsible":"Дима Кичигин", "startDate":"2026-02-10", "views":39371, "subs":5, "totalSubs":4, "interactions":76, "period":"10.02-30.03"}
    ];

    state.tasks = [
        {"id":1, "project":"Все проекты", "task":"Создать чек-листы и прикрепить в таблицу + прописать комментарии", "startDate":"2026-02-04", "endDate":"2026-02-05", "responsible":"Александр Рубцов", "stage":"Готово", "comment":"Сделано!"},
        {"id":2, "project":"Все проекты", "task":"Назначить ответственных и начать выкладку по всем активным проектам", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"Готово", "comment":"В процессе"},
        {"id":3, "project":"Клубника в шоколаде", "task":"Найти оператора в Иркутске за 10 тыс. на 4-5 часов с камерой и светом", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"В работе", "comment":""},
        {"id":4, "project":"Марафон по религии", "task":"Выплатить Насте за религию", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"Ждёт", "comment":"Ждёт Матвея"},
        {"id":5, "project":"БАДы", "task":"Выплатить Диме за БАДы", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"Готово", "comment":""},
        {"id":6, "project":"Консалтинг ресторанов", "task":"Поменять проект и поставить замену в ближайшее время", "startDate":"2026-02-12", "endDate":"2026-02-13", "responsible":"Александр Рубцов", "stage":"Готово", "comment":""}
    ];

    state.employees = [
        {"firstName":"Александр", "lastName":"Рубцов", "city":"Новоуральск", "employment":"Учёба + работа", "projects":"Девочка танцы", "status":"Админ"},
        {"firstName":"Елена", "lastName":"", "city":"Новоуральск", "employment":"Работа", "projects":"Ресницы, Личный бренд дети", "status":"Активен"},
        {"firstName":"Дима", "lastName":"Кичигин", "city":"Новоуральск", "employment":"Свободен", "projects":"Марафон, Консалтинг, Диски, Квизы", "status":"Активен"},
        {"firstName":"Александр", "lastName":"", "city":"Москва", "employment":"Учёба + работа", "projects":"Риелтор Грозный, Цветы", "status":"Активен"},
        {"firstName":"Артём", "lastName":"", "city":"Екатеринбург", "employment":"Учёба + работа", "projects":"Авто в аренду Москва", "status":"Активен"},
        {"firstName":"Валера", "lastName":"", "city":"Новоуральск", "employment":"Свободен", "projects":"Покер Москва", "status":"Активен"},
        {"firstName":"Виктор", "lastName":"Федосеев", "city":"Новоуральск", "employment":"Работа", "projects":"Обучение плаванию", "status":"НЕАктивен"},
        {"firstName":"Константин", "lastName":"", "city":"", "employment":"", "projects":"", "status":"НЕАктивен"}
    ];

    state.access = [
        {"project":"Покер Москва", "tgLink":"https://t.me/+95sY8wwOUvkwYWUy", "login":"poker.nuts.moscow", "password":"NutS1232123", "note":"2508507"},
        {"project":"Авто в аренду Москва", "tgLink":"https://t.me/+L_NlJai8Um1mM2Yy", "login":"rescom_prokatmsk", "password":"rescomspb2021", "note":""},
        {"project":"Личный бренд девочка танцы", "tgLink":"https://t.me/+JtqMzj_lKmYwNGM6", "login":"alex.queendance", "password":"Sasa2408", "note":""},
        {"project":"Консалтинг ресторанов", "tgLink":"https://t.me/+LgoX66sDcMAzZWEy", "login":"dmitriy.rest", "password":"chef_dima97", "note":""}
    ];

    saveDataToLocalStorage();
}

function loadDataFromLocalStorage() {
    const saved = localStorage.getItem('workinsight_data');
    if (saved) {
        const data = JSON.parse(saved);
        state.projects = data.projects || state.projects;
        state.tasks = data.tasks || state.tasks;
        state.employees = data.employees || state.employees;
        state.analytics = data.analytics || state.analytics;
        state.access = data.access || state.access;
        state.reports = data.reports || state.reports;
        state.users = data.users || state.users;
    }
}

function saveDataToLocalStorage() {
    localStorage.setItem('workinsight_data', JSON.stringify({
        projects: state.projects,
        tasks: state.tasks,
        employees: state.employees,
        analytics: state.analytics,
        access: state.access,
        reports: state.reports,
        users: state.users
    }));
}

// ======================== AUTH FUNCTIONS ========================
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

    document.getElementById('emailError').style.display = 'none';
    document.getElementById('phoneError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';

    let hasError = false;

    if (!email || !validateEmail(email)) {
        document.getElementById('emailError').textContent = 'Введите корректный email';
        document.getElementById('emailError').style.display = 'block';
        hasError = true;
    }

    if (state.users.find(u => u.email === email)) {
        document.getElementById('emailError').textContent = 'Email уже зарегистрирован';
        document.getElementById('emailError').style.display = 'block';
        hasError = true;
    }

    if (!name) {
        alert('Введите имя и фамилию');
        hasError = true;
    }

    if (!phone || !validatePhone(phone)) {
        document.getElementById('phoneError').textContent = 'Введите корректный номер телефона';
        document.getElementById('phoneError').style.display = 'block';
        hasError = true;
    }

    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Пароль должен быть минимум 6 символов';
        document.getElementById('passwordError').style.display = 'block';
        hasError = true;
    }

    if (password !== passwordConfirm) {
        document.getElementById('passwordError').textContent = 'Пароли не совпадают';
        document.getElementById('passwordError').style.display = 'block';
        hasError = true;
    }

    if (hasError) return;

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

    document.getElementById('regEmail').value = '';
    document.getElementById('regName').value = '';
    document.getElementById('regPhone').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPasswordConfirm').value = '';

    setTimeout(() => showLoginForm(new Event('click')), 1500);
}

function handleLogin() {
    const input = document.getElementById('userName').value.trim();
    const role = document.querySelector('.role-btn.active').dataset.role;

    if (!input) {
        alert('Введите email или имя');
        return;
    }

    let user = state.users.find(u => u.email === input || u.name === input);

    if (user) {
        const password = document.getElementById('userPassword').value;
        if (password !== user.password) {
            alert('Неверный пароль');
            return;
        }
        state.currentUser = user.name;
        state.userEmail = user.email;
        state.userRole = 'employee';
    } else {
        if (role === 'admin') {
            const password = document.getElementById('userPassword').value;
            if (password !== 'admin2026') {
                alert('Неверный пароль администратора');
                return;
            }
            state.currentUser = input;
            state.userRole = 'admin';
        } else {
            state.currentUser = input;
            state.userRole = 'employee';
        }
    }

    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appContainer').classList.remove('login-active');
    document.getElementById('userName2').textContent = state.currentUser;
    document.getElementById('userRole2').textContent = state.userRole === 'admin' ? 'Администратор' : 'Сотрудник';

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

// ======================== EVENT LISTENERS ========================
function setupEventListeners() {
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const role = btn.dataset.role;
            const passwordGroup = document.getElementById('passwordGroup');
            passwordGroup.style.display = role === 'admin' ? 'block' : 'none';
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

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const section = item.dataset.section;
            renderSection(section);
        });
    });

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

    document.getElementById('addProjectBtn').addEventListener('click', openProjectModal);
    document.getElementById('addTaskBtn').addEventListener('click', openTaskModal);
    document.getElementById('addEmployeeBtn').addEventListener('click', openEmployeeModal);
    document.getElementById('addAnalyticsBtn').addEventListener('click', openAnalyticsModal);
    document.getElementById('addAccessBtn').addEventListener('click', openAccessModal);

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

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                form.dispatchEvent(new Event('submit'));
            }
        });
    });
}

// ======================== RENDER FUNCTIONS ========================
function renderSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    const titleMap = {
        'dashboard': 'Дашборд',
        'projects': 'Проекты',
        'analytics': 'Аналитика',
        'tasks': 'Задачи',
        'employees': 'Сотрудники',
        'reports': 'Отчёты',
        'regulations': 'Регламент',
        'guide': 'Гайд',
        'access': 'Доступы'
    };

    document.getElementById('pageTitle').textContent = titleMap[section] || 'WorkInsight';
    document.getElementById(section + 'Section').classList.add('active');

    if (section === 'dashboard') {
        renderDashboard();
    } else if (section === 'projects') {
        renderProjectsTable();
    } else if (section === 'analytics') {
        renderAnalyticsTable();
        setTimeout(() => renderAnalyticsCharts(), 300);
    } else if (section === 'tasks') {
        renderTasksTable();
    } else if (section === 'employees') {
        renderEmployeesTable();
    } else if (section === 'reports') {
        renderReportsTable();
    } else if (section === 'access') {
        renderAccessTable();
    }
}

function renderDashboard() {
    let projects = state.projects;
    if (state.userRole === 'employee') {
        projects = state.projects.filter(p => p.responsible === state.currentUser);
    }

    const total = projects.length;
    const active = projects.filter(p => p.stage === 'В работе').length;
    const paused = projects.filter(p => p.stage === 'На паузе').length;
    const done = projects.filter(p => p.stage === 'Готово').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statPause').textContent = paused;
    document.getElementById('statDone').textContent = done;

    const tbody = document.getElementById('dashboardTable');
    tbody.innerHTML = '';
    projects.slice(0, 10).forEach(p => {
        const percent = p.planReels > 0 ? Math.round((p.doneReels / p.planReels) * 100) : 0;
        const progressClass = percent <= 33 ? 'low' : percent <= 66 ? 'medium' : percent < 100 ? 'high' : 'complete';

        tbody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${p.responsible}</td>
                <td>${p.platform}</td>
                <td>${p.planReels}</td>
                <td>${p.doneReels}</td>
                <td>${percent}%</td>
                <td><div class="progress-bar"><div class="progress-fill ${progressClass}" style="width: ${percent}%"></div></div></td>
            </tr>
        `;
    });

    setTimeout(() => {
        renderDashboardCharts(projects);
    }, 300);
}

function renderDashboardCharts(projects) {
    if (!projects) projects = state.projects;

    const chartContext1 = document.getElementById('chartCompare');
    if (chartContext1) {
        if (window.compareChart) window.compareChart.destroy();
        window.compareChart = new Chart(chartContext1, {
            type: 'bar',
            data: {
                labels: projects.slice(0, 5).map(p => p.name.substring(0, 15) + '...'),
                datasets: [
                    {
                        label: 'План',
                        data: projects.slice(0, 5).map(p => p.planReels),
                        backgroundColor: '#BFDBFE'
                    },
                    {
                        label: 'Факт',
                        data: projects.slice(0, 5).map(p => p.doneReels),
                        backgroundColor: '#10B981'
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    const chartContext2 = document.getElementById('chartStages');
    if (chartContext2) {
        if (window.stagesChart) window.stagesChart.destroy();
        const stages = {};
        projects.forEach(p => {
            stages[p.stage] = (stages[p.stage] || 0) + 1;
        });

        window.stagesChart = new Chart(chartContext2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(stages),
                datasets: [{
                    data: Object.values(stages),
                    backgroundColor: ['#2563EB', '#F59E0B', '#EF4444', '#10B981']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

function renderProjectsTable() {
    const tbody = document.getElementById('projectsTable');
    tbody.innerHTML = '';

    let projects = state.projects;
    if (state.userRole === 'employee') {
        projects = state.projects.filter(p => p.responsible === state.currentUser);
    }

    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--gray);">Проектов нет. Создайте первый проект!</td></tr>';
        return;
    }

    const responsibleSelect = document.getElementById('projectFilterResponsible');
    if (responsibleSelect && responsibleSelect.children.length === 1) {
        const uniqueResponsible = [...new Set(state.projects.map(p => p.responsible))].sort();
        uniqueResponsible.forEach(r => {
            const option = document.createElement('option');
            option.value = r;
            option.textContent = r;
            responsibleSelect.appendChild(option);
        });
    }

    projects.forEach((p, idx) => {
        const percent = p.planReels > 0 ? Math.round((p.doneReels / p.planReels) * 100) : 0;
        const isOwner = p.responsible === state.currentUser || state.userRole === 'admin';
        const actionButtons = isOwner ? `
            <button class="btn-success" onclick="editProject(${p.id})">✏️</button>
            <button class="btn-danger" onclick="deleteProject(${p.id})">🗑️</button>
        ` : '—';

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>${p.name}</td>
                <td><span class="badge badge-${p.stage === 'Готово' ? 'success' : p.stage === 'Проблемный' ? 'danger' : 'primary'}">${p.stage}</span></td>
                <td>${p.responsible}</td>
                <td>${p.platform}</td>
                <td>${p.priority}</td>
                <td>${p.planReels}</td>
                <td>${p.doneReels}</td>
                <td>${percent}%</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
}

// BUG FIX: remove stale empty rows before appending new ones
function applyProjectFilters() {
    const stage = document.getElementById('projectFilterStage').value;
    const responsible = document.getElementById('projectFilterResponsible').value;
    const tbody = document.getElementById('projectsTable');

    Array.from(tbody.querySelectorAll('.empty-filter-row')).forEach(r => r.remove());

    const rows = tbody.getElementsByTagName('tr');
    let visibleCount = 0;

    Array.from(rows).forEach(row => {
        let show = true;
        if (stage && !row.textContent.includes(stage)) show = false;
        if (responsible && !row.textContent.includes(responsible)) show = false;
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    if (visibleCount === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.classList.add('empty-filter-row');
        emptyRow.innerHTML = '<td colspan="10" style="text-align: center; padding: 40px; color: var(--gray);">Проектов не найдено</td>';
        tbody.appendChild(emptyRow);
    }
}

function renderAnalyticsTable() {
    const tbody = document.getElementById('analyticsTable');
    tbody.innerHTML = '';

    if (state.analytics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">Записей аналитики нет.</td></tr>';
        return;
    }

    state.analytics.forEach((a, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${a.project}</td>
                <td>${a.responsible}</td>
                <td>${a.views.toLocaleString()}</td>
                <td>${a.subs}</td>
                <td>${a.interactions}</td>
                <td>${a.period}</td>
                <td>
                    <button class="btn-success" onclick="editAnalytics(${idx})">✏️</button>
                    <button class="btn-danger" onclick="deleteAnalytics(${idx})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function renderAnalyticsCharts() {
    const chartContext1 = document.getElementById('chartViews');
    if (chartContext1) {
        if (window.viewsChart) window.viewsChart.destroy();
        const sortedByViews = [...state.analytics].sort((a, b) => b.views - a.views).slice(0, 10);
        window.viewsChart = new Chart(chartContext1, {
            type: 'bar',
            data: {
                labels: sortedByViews.map(a => a.project.substring(0, 12) + '...'),
                datasets: [{
                    label: 'Просмотры',
                    data: sortedByViews.map(a => a.views),
                    backgroundColor: '#2563EB'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    const chartContext2 = document.getElementById('chartInteractions');
    if (chartContext2) {
        if (window.interactionsChart) window.interactionsChart.destroy();
        const sortedByInteractions = [...state.analytics].sort((a, b) => b.interactions - a.interactions).slice(0, 10);
        window.interactionsChart = new Chart(chartContext2, {
            type: 'bar',
            data: {
                labels: sortedByInteractions.map(a => a.project.substring(0, 12) + '...'),
                datasets: [{
                    label: 'Взаимодействия',
                    data: sortedByInteractions.map(a => a.interactions),
                    backgroundColor: '#10B981'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }
}

function renderTasksTable() {
    const tbody = document.getElementById('tasksTable');
    tbody.innerHTML = '';

    if (state.tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">Задач нет. Создайте первую задачу!</td></tr>';
        return;
    }

    state.tasks.forEach((t, idx) => {
        const badgeClass = t.stage === 'Готово' ? 'success' : t.stage === 'В работе' ? 'primary' : 'warning';
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>${t.project}</td>
                <td>${t.task}</td>
                <td>${t.endDate || '—'}</td>
                <td>${t.responsible}</td>
                <td><span class="badge badge-${badgeClass}">${t.stage}</span></td>
                <td>
                    <button class="btn-success" onclick="editTask(${t.id})">✏️</button>
                    <button class="btn-danger" onclick="deleteTask(${t.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// BUG FIX: remove stale empty rows before appending new ones
function applyTaskFilters() {
    const stage = document.getElementById('taskFilterStage').value;
    const tbody = document.getElementById('tasksTable');

    Array.from(tbody.querySelectorAll('.empty-filter-row')).forEach(r => r.remove());

    const rows = tbody.getElementsByTagName('tr');
    let visibleCount = 0;

    Array.from(rows).forEach(row => {
        let show = true;
        if (stage && !row.textContent.includes(stage)) show = false;
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    if (visibleCount === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.classList.add('empty-filter-row');
        emptyRow.innerHTML = '<td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">Задач не найдено</td>';
        tbody.appendChild(emptyRow);
    }
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employeesTable');
    tbody.innerHTML = '';

    if (state.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">Сотрудников нет. Добавьте первого сотрудника!</td></tr>';
        return;
    }

    state.employees.forEach((e, idx) => {
        const badgeClass = e.status === 'Активен' ? 'success' : e.status === 'Админ' ? 'primary' : 'danger';
        tbody.innerHTML += `
            <tr>
                <td>${e.firstName} ${e.lastName}</td>
                <td>${e.city}</td>
                <td>${e.employment}</td>
                <td>${e.projects}</td>
                <td><span class="badge badge-${badgeClass}">${e.status}</span></td>
                <td>
                    <button class="btn-success" onclick="editEmployee(${idx})">✏️</button>
                    <button class="btn-danger" onclick="deleteEmployee(${idx})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function renderReportsTable() {
    const tbody = document.getElementById('reportsListTable');
    tbody.innerHTML = '';

    if (state.reports.length === 0) {
        // BUG FIX: was colspan="7", table has 8 columns
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--gray);">Отчётов нет. Создайте первый отчёт!</td></tr>';
        return;
    }

    const employeeSelect = document.getElementById('reportFilterEmployee');
    if (employeeSelect && employeeSelect.children.length === 1) {
        const uniqueEmployees = [...new Set(state.reports.map(r => r.user))].sort();
        uniqueEmployees.forEach(e => {
            const option = document.createElement('option');
            option.value = e;
            option.textContent = e;
            employeeSelect.appendChild(option);
        });
    }

    const projectSelect = document.getElementById('reportFilterProject');
    if (projectSelect && projectSelect.children.length === 1) {
        const uniqueProjects = [...new Set(state.reports.map(r => r.project))].sort();
        uniqueProjects.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            projectSelect.appendChild(option);
        });
    }

    state.reports.forEach(r => {
        const screenshotBtn = r.screenshot ? `<button class="btn-success" onclick="viewScreenshot('${r.id}')">📷 Показать</button>` : '—';
        tbody.innerHTML += `
            <tr>
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${r.user}</td>
                <td>${r.project}</td>
                <td>${r.reelsCreated}/${r.reelsPublished}</td>
                <td>${r.platforms}</td>
                <td>${r.comment || '—'}</td>
                <td>${screenshotBtn}</td>
            </tr>
        `;
    });
}

// BUG FIX: remove stale empty rows; fix colspan 7→8
function applyReportFilters() {
    const dateFrom = document.getElementById('reportFilterDateFrom').value;
    const dateTo = document.getElementById('reportFilterDateTo').value;
    const employee = document.getElementById('reportFilterEmployee').value;
    const project = document.getElementById('reportFilterProject').value;
    const tbody = document.getElementById('reportsListTable');

    Array.from(tbody.querySelectorAll('.empty-filter-row')).forEach(r => r.remove());

    const rows = tbody.getElementsByTagName('tr');
    let visibleCount = 0;

    Array.from(rows).forEach(row => {
        let show = true;
        const dateCell = row.cells[0]?.textContent || '';
        const userCell = row.cells[2]?.textContent || '';
        const projectCell = row.cells[3]?.textContent || '';

        if (dateFrom && dateCell < dateFrom) show = false;
        if (dateTo && dateCell > dateTo) show = false;
        if (employee && userCell !== employee) show = false;
        if (project && projectCell !== project) show = false;

        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    if (visibleCount === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.classList.add('empty-filter-row');
        emptyRow.innerHTML = '<td colspan="8" style="text-align: center; padding: 40px; color: var(--gray);">Отчётов не найдено</td>';
        tbody.appendChild(emptyRow);
    }
}

function clearReportFilters() {
    document.getElementById('reportFilterDateFrom').value = '';
    document.getElementById('reportFilterDateTo').value = '';
    document.getElementById('reportFilterEmployee').value = '';
    document.getElementById('reportFilterProject').value = '';
    applyReportFilters();
}

function renderAccessTable() {
    const tbody = document.getElementById('accessTable');
    tbody.innerHTML = '';

    if (state.access.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">Доступов нет.</td></tr>';
        return;
    }

    state.access.forEach((a, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${a.project}</td>
                <td><a href="${a.tgLink}" target="_blank">TG-группа</a></td>
                <td>${a.login}</td>
                <td><span id="pwd${idx}">••••••</span> <button class="btn-secondary" onclick="togglePassword(${idx})">👁</button></td>
                <td>${a.note}</td>
                <td>
                    <button class="btn-success" onclick="editAccess(${idx})">✏️</button>
                    <button class="btn-danger" onclick="deleteAccess(${idx})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// ======================== MODAL FUNCTIONS ========================
function openProjectModal() {
    document.getElementById('projectForm').reset();
    delete document.getElementById('projectForm').dataset.id;
    document.getElementById('projectModal').classList.add('active');
    populateDropdown('projectResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
}

function openTaskModal() {
    document.getElementById('taskForm').reset();
    delete document.getElementById('taskForm').dataset.id;
    document.getElementById('taskModal').classList.add('active');
    populateDropdown('taskProject', state.projects.map(p => p.name));
    populateDropdown('taskResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
}

function openEmployeeModal() {
    document.getElementById('employeeForm').reset();
    delete document.getElementById('employeeForm').dataset.idx;
    document.getElementById('employeeModal').classList.add('active');
}

function openAnalyticsModal() {
    document.getElementById('analyticsForm').reset();
    delete document.getElementById('analyticsForm').dataset.idx;
    document.getElementById('analyticsModal').classList.add('active');
    populateDropdown('analyticsProject', state.projects.map(p => p.name));
    populateDropdown('analyticsResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
}

function openAccessModal() {
    document.getElementById('accessForm').reset();
    delete document.getElementById('accessForm').dataset.idx;
    document.getElementById('accessModal').classList.add('active');
    populateDropdown('accessProject', state.projects.map(p => p.name));
}

function populateDropdown(id, options) {
    const select = document.getElementById(id);
    if (!select) return;

    const firstOptionHTML = select.querySelector('option:first-child');
    select.innerHTML = '';

    if (firstOptionHTML) {
        select.appendChild(firstOptionHTML.cloneNode(true));
    }

    const uniqueOptions = [...new Set(options)].sort();
    uniqueOptions.forEach(opt => {
        if (opt.trim()) {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        }
    });
}

// ======================== SAVE FUNCTIONS ========================
function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const stage = document.getElementById('projectStage').value;
    const responsible = document.getElementById('projectResponsible').value;
    const platform = document.getElementById('projectPlatform').value;

    if (!name || !stage || !responsible || !platform) {
        alert('Заполните все обязательные поля');
        return;
    }

    const id = document.getElementById('projectForm').dataset.id;
    const project = {
        id: id ? parseInt(id) : Math.max(...state.projects.map(p => p.id), 0) + 1,
        name: name,
        stage: stage,
        responsible: responsible,
        platform: platform,
        priority: parseInt(document.getElementById('projectPriority').value),
        planReels: parseInt(document.getElementById('projectPlanReels').value),
        doneReels: parseInt(document.getElementById('projectDoneReels').value),
        startDate: document.getElementById('projectStartDate').value,
        comment: document.getElementById('projectComment').value
    };

    if (id) {
        const idx = state.projects.findIndex(p => p.id === parseInt(id));
        state.projects[idx] = project;
    } else {
        state.projects.push(project);
    }

    saveDataToLocalStorage();
    document.getElementById('projectForm').reset();
    delete document.getElementById('projectForm').dataset.id;
    document.getElementById('projectModal').classList.remove('active');
    renderProjectsTable();
    showToast('Проект сохранён ✓');
}

function saveTask() {
    const taskName = document.getElementById('taskName').value.trim();
    const project = document.getElementById('taskProject').value;
    const responsible = document.getElementById('taskResponsible').value;
    const stage = document.getElementById('taskStage').value;

    if (!taskName || !project || !responsible || !stage) {
        alert('Заполните все обязательные поля');
        return;
    }

    const id = document.getElementById('taskForm').dataset.id;
    const task = {
        id: id ? parseInt(id) : Math.max(...state.tasks.map(t => t.id), 0) + 1,
        project: project,
        task: taskName,
        startDate: document.getElementById('taskStartDate').value,
        endDate: document.getElementById('taskEndDate').value,
        responsible: responsible,
        stage: stage,
        comment: document.getElementById('taskComment').value
    };

    if (id) {
        const idx = state.tasks.findIndex(t => t.id === parseInt(id));
        state.tasks[idx] = task;
    } else {
        state.tasks.push(task);
    }

    saveDataToLocalStorage();
    document.getElementById('taskForm').reset();
    delete document.getElementById('taskForm').dataset.id;
    document.getElementById('taskModal').classList.remove('active');
    renderTasksTable();
    showToast('Задача сохранена ✓');
}

function saveEmployee() {
    const firstName = document.getElementById('employeeFirstName').value.trim();
    const city = document.getElementById('employeeCity').value.trim();
    const employment = document.getElementById('employeeEmployment').value;
    const status = document.getElementById('employeeStatus').value;

    if (!firstName || !city || !employment || !status) {
        alert('Заполните все обязательные поля');
        return;
    }

    const idx = document.getElementById('employeeForm').dataset.idx;
    const employee = {
        firstName: firstName,
        lastName: document.getElementById('employeeLastName').value,
        city: city,
        employment: employment,
        projects: document.getElementById('employeeProjects').value,
        status: status
    };

    if (idx !== undefined) {
        state.employees[parseInt(idx)] = employee;
    } else {
        state.employees.push(employee);
    }

    saveDataToLocalStorage();
    document.getElementById('employeeForm').reset();
    delete document.getElementById('employeeForm').dataset.idx;
    document.getElementById('employeeModal').classList.remove('active');
    renderEmployeesTable();
    showToast('Сотрудник сохранён ✓');
}

function saveAnalytics() {
    const project = document.getElementById('analyticsProject').value;
    const responsible = document.getElementById('analyticsResponsible').value;

    if (!project || !responsible) {
        alert('Заполните все обязательные поля');
        return;
    }

    const idx = document.getElementById('analyticsForm').dataset.idx;
    const analytics = {
        project: project,
        responsible: responsible,
        startDate: document.getElementById('analyticsStartDate').value,
        views: parseInt(document.getElementById('analyticsViews').value) || 0,
        subs: parseInt(document.getElementById('analyticsSubs').value) || 0,
        totalSubs: parseInt(document.getElementById('analyticsTotalSubs').value) || 0,
        interactions: parseInt(document.getElementById('analyticsInteractions').value) || 0,
        period: document.getElementById('analyticsPeriod').value
    };

    if (idx !== undefined) {
        state.analytics[parseInt(idx)] = analytics;
    } else {
        state.analytics.push(analytics);
    }

    saveDataToLocalStorage();
    document.getElementById('analyticsForm').reset();
    delete document.getElementById('analyticsForm').dataset.idx;
    document.getElementById('analyticsModal').classList.remove('active');
    renderAnalyticsTable();
    showToast('Запись аналитики сохранена ✓');
}

function saveAccess() {
    const project = document.getElementById('accessProject').value;

    if (!project) {
        alert('Выберите проект');
        return;
    }

    const idx = document.getElementById('accessForm').dataset.idx;
    const access = {
        project: project,
        tgLink: document.getElementById('accessTgLink').value,
        login: document.getElementById('accessLogin').value,
        password: document.getElementById('accessPassword').value,
        note: document.getElementById('accessNote').value
    };

    if (idx !== undefined) {
        state.access[parseInt(idx)] = access;
    } else {
        state.access.push(access);
    }

    saveDataToLocalStorage();
    document.getElementById('accessForm').reset();
    delete document.getElementById('accessForm').dataset.idx;
    document.getElementById('accessModal').classList.remove('active');
    renderAccessTable();
    showToast('Доступ сохранён ✓');
}

function saveReport() {
    const project = document.getElementById('reportProject').value;
    const date = document.getElementById('reportDate').value;

    if (!project || !date) {
        alert('Заполните обязательные поля: проект и дата');
        return;
    }

    const platforms = Array.from(document.querySelectorAll('.reportPlatform:checked')).map(cb => cb.value).join(', ') || 'Не выбрано';

    const report = {
        id: Date.now(),
        date: date,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        user: state.currentUser,
        project: project,
        reelsCreated: parseInt(document.getElementById('reportReelsCreated').value) || 0,
        reelsPublished: parseInt(document.getElementById('reportReelsPublished').value) || 0,
        platforms: platforms,
        comment: document.getElementById('reportComment').value,
        screenshot: state.currentScreenshot || null
    };

    state.reports.push(report);
    saveDataToLocalStorage();

    document.getElementById('reportProject').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    document.getElementById('reportReelsCreated').value = '0';
    document.getElementById('reportReelsPublished').value = '0';
    document.querySelectorAll('.reportPlatform').forEach(cb => cb.checked = false);
    document.getElementById('reportComment').value = '';
    document.getElementById('reportScreenshot').value = '';
    document.getElementById('screenshotPreview').innerHTML = '';
    state.currentScreenshot = null;

    renderReportsTable();
    showToast('Отчёт отправлен ✓');
}

// ======================== DELETE FUNCTIONS ========================
function deleteProject(id) {
    if (confirm('Удалить проект?')) {
        state.projects = state.projects.filter(p => p.id !== id);
        saveDataToLocalStorage();
        renderProjectsTable();
        showToast('Проект удалён');
    }
}

function deleteTask(id) {
    if (confirm('Удалить задачу?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveDataToLocalStorage();
        renderTasksTable();
        showToast('Задача удалена');
    }
}

function deleteEmployee(idx) {
    if (confirm('Удалить сотрудника?')) {
        state.employees.splice(idx, 1);
        saveDataToLocalStorage();
        renderEmployeesTable();
        showToast('Сотрудник удалён');
    }
}

function deleteAnalytics(idx) {
    if (confirm('Удалить запись?')) {
        state.analytics.splice(idx, 1);
        saveDataToLocalStorage();
        renderAnalyticsTable();
        showToast('Запись удалена');
    }
}

function deleteAccess(idx) {
    if (confirm('Удалить доступ?')) {
        state.access.splice(idx, 1);
        saveDataToLocalStorage();
        renderAccessTable();
        showToast('Доступ удалён');
    }
}

// ======================== EDIT FUNCTIONS ========================
// BUG FIX: populateDropdown must be called BEFORE setting values,
// otherwise the dropdown is cleared and the selected value is lost.
function editProject(id) {
    const project = state.projects.find(p => p.id === id);
    document.getElementById('projectForm').dataset.id = id;
    populateDropdown('projectResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectStage').value = project.stage;
    document.getElementById('projectResponsible').value = project.responsible;
    document.getElementById('projectPlatform').value = project.platform;
    document.getElementById('projectPriority').value = project.priority;
    document.getElementById('projectPlanReels').value = project.planReels;
    document.getElementById('projectDoneReels').value = project.doneReels;
    document.getElementById('projectStartDate').value = project.startDate;
    document.getElementById('projectComment').value = project.comment;
    document.getElementById('projectModal').classList.add('active');
}

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    document.getElementById('taskForm').dataset.id = id;
    populateDropdown('taskProject', state.projects.map(p => p.name));
    populateDropdown('taskResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
    document.getElementById('taskName').value = task.task;
    document.getElementById('taskProject').value = task.project;
    document.getElementById('taskStartDate').value = task.startDate;
    document.getElementById('taskEndDate').value = task.endDate;
    document.getElementById('taskResponsible').value = task.responsible;
    document.getElementById('taskStage').value = task.stage;
    document.getElementById('taskComment').value = task.comment;
    document.getElementById('taskModal').classList.add('active');
}

function editEmployee(idx) {
    const emp = state.employees[idx];
    document.getElementById('employeeForm').dataset.idx = idx;
    document.getElementById('employeeFirstName').value = emp.firstName;
    document.getElementById('employeeLastName').value = emp.lastName;
    document.getElementById('employeeCity').value = emp.city;
    document.getElementById('employeeEmployment').value = emp.employment;
    document.getElementById('employeeProjects').value = emp.projects;
    document.getElementById('employeeStatus').value = emp.status;
    document.getElementById('employeeModal').classList.add('active');
}

function editAnalytics(idx) {
    const a = state.analytics[idx];
    document.getElementById('analyticsForm').dataset.idx = idx;
    populateDropdown('analyticsProject', state.projects.map(p => p.name));
    populateDropdown('analyticsResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
    document.getElementById('analyticsProject').value = a.project;
    document.getElementById('analyticsResponsible').value = a.responsible;
    document.getElementById('analyticsStartDate').value = a.startDate;
    document.getElementById('analyticsViews').value = a.views;
    document.getElementById('analyticsSubs').value = a.subs;
    document.getElementById('analyticsTotalSubs').value = a.totalSubs;
    document.getElementById('analyticsInteractions').value = a.interactions;
    document.getElementById('analyticsPeriod').value = a.period;
    document.getElementById('analyticsModal').classList.add('active');
}

function editAccess(idx) {
    const a = state.access[idx];
    document.getElementById('accessForm').dataset.idx = idx;
    populateDropdown('accessProject', state.projects.map(p => p.name));
    document.getElementById('accessProject').value = a.project;
    document.getElementById('accessTgLink').value = a.tgLink;
    document.getElementById('accessLogin').value = a.login;
    document.getElementById('accessPassword').value = a.password;
    document.getElementById('accessNote').value = a.note;
    document.getElementById('accessModal').classList.add('active');
}

// ======================== UTILITY FUNCTIONS ========================
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function previewScreenshot(input) {
    const preview = document.getElementById('screenshotPreview');
    preview.innerHTML = '';

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '6px';
            img.style.border = '1px solid var(--border)';
            preview.appendChild(img);
            state.currentScreenshot = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function viewScreenshot(reportId) {
    const report = state.reports.find(r => r.id == reportId);
    if (!report || !report.screenshot) {
        alert('Скриншот не найден');
        return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80vw; max-height: 80vh; overflow: auto;">
            <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: var(--danger); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕ Закрыть</button>
            <img src="${report.screenshot}" style="max-width: 100%; max-height: 100%; border-radius: 4px; margin-top: 10px;">
        </div>
    `;

    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Промпт скопирован в буфер обмена');
    }).catch(() => {
        alert('Ошибка при копировании');
    });
}

function togglePassword(idx) {
    const pwd = document.getElementById('pwd' + idx);
    if (pwd.textContent === '••••••') {
        pwd.textContent = state.access[idx].password;
    } else {
        pwd.textContent = '••••••';
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 9999;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ======================== FILTER/SEARCH FUNCTION ========================
function filterTable(input, tableId) {
    const query = (input.value || '').toLowerCase().trim();
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = Array.from(table.getElementsByTagName('tr'));
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.classList.contains('empty-row')) {
            row.remove();
            return;
        }

        if (query === '') {
            row.style.display = '';
            visibleCount++;
        } else {
            const text = row.textContent.toLowerCase();
            if (text.includes(query)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        }
    });

    if (visibleCount === 0 && query !== '') {
        const emptyRow = document.createElement('tr');
        emptyRow.classList.add('empty-row');
        const colCount = table.querySelector('tr')?.children.length || 10;
        emptyRow.innerHTML = `<td colspan="${colCount}" style="text-align: center; padding: 30px; color: var(--gray);">Ничего не найдено</td>`;
        table.appendChild(emptyRow);
    }
}

// ======================== EXPORT CSV FUNCTION ========================
function exportCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const csvRow = [];
        cols.forEach(col => {
            csvRow.push('"' + col.innerText.replace(/"/g, '""') + '"');
        });
        csv.push(csvRow.join(','));
    });

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ======================== BOOTSTRAP ========================
window.addEventListener('DOMContentLoaded', initializeApp);

window.addEventListener('load', () => {
    const today = new Date().toISOString().split('T')[0];
    const reportDateInput = document.getElementById('reportDate');
    if (reportDateInput && !reportDateInput.value) {
        reportDateInput.value = today;
    }

    const reportProjectSelect = document.getElementById('reportProject');
    if (reportProjectSelect) {
        const activeProjects = state.projects.filter(p => p.stage === 'В работе');
        activeProjects.forEach(p => {
            const option = document.createElement('option');
            option.value = p.name;
            option.textContent = p.name;
            reportProjectSelect.appendChild(option);
        });
    }
});
