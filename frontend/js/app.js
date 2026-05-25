// Main application file

let chartCompare, chartStages, chartViews, chartInteractions, chartIncome, chartProfitMargin;

async function initializeApp() {
  // Setup login/register buttons FIRST (before checking token)
  setupEventListeners();

  // Check if user is already logged in
  const token = api.getToken();

  if (token) {
    // Verify token is still valid
    const user = await api.get('/auth/me');
    if (user) {
      state.setUser(user, token);
      hideLoginScreen();
      await loadAppData();
      renderSection('dashboard');
    } else {
      showLoginScreen();
    }
  } else {
    showLoginScreen();
  }
}

async function loadAppData() {
  try {
    // Load projects
    const projects = await api.get('/projects');
    state.projects = projects || [];

    // Load tasks
    const tasks = await api.get('/tasks');
    state.tasks = tasks || [];

    // Load analytics
    const analytics = await api.get('/analytics');
    state.analytics = analytics || [];

    // Load reports
    const reports = await api.get('/reports');
    state.reports = reports || [];

    // Load employees
    const employees = await api.get('/employees');
    state.employees = employees || [];
    state.users = employees || [];

    // Load access (admin only)
    if (state.isAdmin()) {
      const access = await api.get('/access');
      state.access = access || [];
    }

    // Load daily reels
    try {
      const dailyReels = await api.get('/daily-reels');
      state.dailyReels = dailyReels || [];
    } catch (e) {
      console.warn('Daily reels not available');
      state.dailyReels = [];
    }

    // Load finance params
    const financeParams = await api.get('/finance/params');
    state.financeParams = financeParams || {};

    // Update UI
    updateUserDisplay();
    updateAdminSection();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function updateUserDisplay() {
  const userNameEl = document.getElementById('userName2');
  if (userNameEl) userNameEl.textContent = state.currentUser || '';
  const userRoleEl = document.getElementById('userRole2');
  if (userRoleEl) userRoleEl.textContent = state.userRole === 'admin' ? '🔐 Администратор' : '👥 Сотрудник';
}

function updateAdminSection() {
  const adminSection = document.getElementById('adminSection');
  if (adminSection) {
    adminSection.style.display = state.isAdmin() ? 'block' : 'none';
  }

  // Toggle visibility of create buttons based on role
  ['addProjectBtn','addTaskBtn','addEmployeeBtn','addAnalyticsBtn','addAccessBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = state.isAdmin() ? '' : 'none';
  });

  // Employees data is admin-only — hide its nav button for non-admins
  const employeesNav = document.querySelector('.nav-item[data-section="employees"]');
  if (employeesNav) employeesNav.style.display = state.isAdmin() ? '' : 'none';

  // Finance is admin-only — hide the whole nav group (label + button)
  const financeNav = document.querySelector('.nav-item[data-section="finance"]');
  if (financeNav) {
    const section = financeNav.closest('.nav-section');
    if (section) section.style.display = state.isAdmin() ? '' : 'none';
  }
}

function setupEventListeners() {
  // Login button - ALWAYS setup even on login screen
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => handleLogin());
  }

  // Register button - ALWAYS setup even on login screen
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => handleRegister());
  }

  // Navigation items (only if user is logged in)
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      if (section) {
        renderSection(section);
      }
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Set up modal handlers
  setupModalHandlers();

  // Event delegation for data-action buttons
  document.addEventListener('click', handleDataActionClick);
  document.addEventListener('change', handleDataActionChange);
  document.addEventListener('input', handleDataActionInput);
}

function setupModalHandlers() {
  // Project modal
  const addProjectBtn = document.getElementById('addProjectBtn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', openProjectModal);
  }

  // Task modal
  const addTaskBtn = document.getElementById('addTaskBtn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', openTaskModal);
  }

  // Employee modal
  const addEmployeeBtn = document.getElementById('addEmployeeBtn');
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', openEmployeeModal);
  }

  // Analytics modal
  const addAnalyticsBtn = document.getElementById('addAnalyticsBtn');
  if (addAnalyticsBtn) {
    addAnalyticsBtn.addEventListener('click', openAnalyticsModal);
  }

  // Access modal
  const addAccessBtn = document.getElementById('addAccessBtn');
  if (addAccessBtn) {
    addAccessBtn.addEventListener('click', openAccessModal);
  }

  // Form submit handlers (create / update)
  const projectForm = document.getElementById('projectForm');
  if (projectForm) projectForm.addEventListener('submit', saveProject);

  const taskForm = document.getElementById('taskForm');
  if (taskForm) taskForm.addEventListener('submit', saveTask);

  const employeeForm = document.getElementById('employeeForm');
  if (employeeForm) employeeForm.addEventListener('submit', saveEmployee);

  const analyticsForm = document.getElementById('analyticsForm');
  if (analyticsForm) analyticsForm.addEventListener('submit', saveAnalytics);

  const accessForm = document.getElementById('accessForm');
  if (accessForm) accessForm.addEventListener('submit', saveAccess);

  const submitReportBtn = document.getElementById('submitReportBtn');
  if (submitReportBtn) {
    submitReportBtn.addEventListener('click', submitReport);
  }

  // Report form
  const newReportTab = document.getElementById('newReportTab');
  const allReportsTab = document.getElementById('allReportsTab');
  if (newReportTab && allReportsTab) {
    newReportTab.addEventListener('click', () => {
      document.getElementById('newReportForm').style.display = 'block';
      document.getElementById('allReportsTable').style.display = 'none';
      newReportTab.style.background = 'var(--primary)';
      newReportTab.style.color = 'white';
      allReportsTab.style.background = '';
      allReportsTab.style.color = '';
    });

    allReportsTab.addEventListener('click', () => {
      document.getElementById('newReportForm').style.display = 'none';
      document.getElementById('allReportsTable').style.display = 'block';
      allReportsTab.style.background = 'var(--primary)';
      allReportsTab.style.color = 'white';
      newReportTab.style.background = '';
      newReportTab.style.color = '';
    });
  }

  // Finance tabs
  setupFinanceTabs();
}

function setupFinanceTabs() {
  const financeSettingsTab = document.getElementById('financeSettingsTab');
  const financeReportTab = document.getElementById('financeReportTab');
  const financeAnalyticsTab = document.getElementById('financeAnalyticsTab');

  if (!financeSettingsTab) return;

  financeSettingsTab.addEventListener('click', () => {
    document.getElementById('financeSettings').style.display = 'block';
    document.getElementById('financeReport').style.display = 'none';
    document.getElementById('financeAnalytics').style.display = 'none';
    financeSettingsTab.style.background = 'var(--primary)';
    financeSettingsTab.style.color = 'white';
    financeReportTab.style.background = '';
    financeReportTab.style.color = '';
    financeAnalyticsTab.style.background = '';
    financeAnalyticsTab.style.color = '';
  });

  financeReportTab.addEventListener('click', () => {
    document.getElementById('financeSettings').style.display = 'none';
    document.getElementById('financeReport').style.display = 'block';
    document.getElementById('financeAnalytics').style.display = 'none';
    financeReportTab.style.background = 'var(--primary)';
    financeReportTab.style.color = 'white';
    financeSettingsTab.style.background = '';
    financeSettingsTab.style.color = '';
    financeAnalyticsTab.style.background = '';
    financeAnalyticsTab.style.color = '';
  });

  financeAnalyticsTab.addEventListener('click', () => {
    document.getElementById('financeSettings').style.display = 'none';
    document.getElementById('financeReport').style.display = 'none';
    document.getElementById('financeAnalytics').style.display = 'block';
    financeAnalyticsTab.style.background = 'var(--primary)';
    financeAnalyticsTab.style.color = 'white';
    financeSettingsTab.style.background = '';
    financeSettingsTab.style.color = '';
    financeReportTab.style.background = '';
    financeReportTab.style.color = '';
  });
}

function handleDataActionClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch(action) {
    case 'show-register':
      e.preventDefault();
      showRegisterForm(e);
      break;
    case 'show-login':
      e.preventDefault();
      showLoginForm(e);
      break;
    case 'export-csv':
      e.preventDefault();
      exportCSV(target.dataset.table, target.dataset.table + '.csv');
      break;
    case 'export-xlsx':
      e.preventDefault();
      exportTableToXLSX(target.dataset.table, target.dataset.filename);
      break;
    case 'copy-prompt':
      e.preventDefault();
      copyPrompt(target.dataset.prompt);
      break;
    case 'clear-report-filters':
      e.preventDefault();
      clearReportFilters();
      break;
    case 'edit':
      e.preventDefault();
      handleEdit(target.dataset.type, parseInt(target.dataset.id));
      break;
    case 'delete':
      e.preventDefault();
      handleDelete(target.dataset.type, parseInt(target.dataset.id));
      break;
  }
}

function handleDataActionChange(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch(action) {
    case 'filter-projects':
      applyProjectFilters();
      break;
    case 'filter-tasks':
      applyTaskFilters();
      break;
    case 'filter-reports':
      applyReportFilters();
      break;
    case 'preview-screenshot':
      previewScreenshot(target);
      break;
    case 'update-finance-params':
      saveFinanceParams();
      break;
  }
}

function handleDataActionInput(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch(action) {
    case 'filter-table':
      filterTable(target, target.dataset.table);
      break;
  }
}

function handleEdit(type, id) {
  switch(type) {
    case 'project':
      editProject(id);
      break;
    case 'task':
      editTask(id);
      break;
    case 'employee':
      editEmployee(id);
      break;
    case 'analytics':
      editAnalytics(id);
      break;
    case 'access':
      editAccess(id);
      break;
  }
}

function handleDelete(type, id) {
  if (!confirm('Вы уверены, что хотите удалить?')) return;

  switch(type) {
    case 'project':
      deleteProject(id);
      break;
    case 'task':
      deleteTask(id);
      break;
    case 'employee':
      deleteEmployee(id);
      break;
    case 'analytics':
      deleteAnalytics(id);
      break;
    case 'access':
      deleteAccess(id);
      break;
  }
}

function renderSection(section) {
  state.currentSection = section;

  // Hide all sections
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  // Show selected section
  // Convert 'daily-reels' to 'dailyReelsSection', 'dashboard' to 'dashboardSection', etc.
  const sectionId = section
    .split('-')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Section';

  const sectionEl = document.getElementById(sectionId);
  if (sectionEl) {
    sectionEl.classList.add('active');
  }

  // Mark nav item as active
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

  // Update page title
  const titles = {
    dashboard: 'Дашборд',
    projects: 'Проекты',
    analytics: 'Аналитика',
    tasks: 'Задачи',
    employees: 'Сотрудники',
    reports: 'Отчёты',
    'daily-reels': 'Рилс на сегодня',
    regulations: 'Регламент',
    guide: 'Гайд',
    finance: 'Финансы',
    access: 'Доступы'
  };

  document.getElementById('pageTitle').textContent = titles[section] || 'Страница';

  // Load section-specific data
  if (section === 'dashboard') {
    renderDashboard();
  } else if (section === 'projects') {
    renderProjects();
  } else if (section === 'analytics') {
    renderAnalytics();
  } else if (section === 'tasks') {
    renderTasks();
  } else if (section === 'employees') {
    renderEmployees();
  } else if (section === 'reports') {
    renderReports();
  } else if (section === 'daily-reels') {
    renderDailyReels();
  } else if (section === 'finance') {
    renderFinance();
  } else if (section === 'access') {
    renderAccess();
  }
}

// Stub functions for rendering - implement later
function renderDashboard() {
  renderDashboardTable();
  renderDashboardCharts();
}

function renderDashboardTable() {
  const tbody = document.getElementById('dashboardTable');
  tbody.innerHTML = '';

  // Filter for current user if not admin
  let projects = state.projects;
    if (!state.isAdmin()) {
      projects = projects.filter(p => p.responsible_id === state.currentUserId);
  }

  projects.filter(p => p.stage === 'В работе').forEach(project => {
    const progress = project.plan_reels > 0 ? Math.round((project.done_reels / project.plan_reels) * 100) : 0;
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(project.name)}</td>
        <td>${escapeHtml(project.responsible_name)}</td>
        <td>${escapeHtml(project.platform)}</td>
        <td>${project.plan_reels}</td>
        <td>${project.done_reels}</td>
        <td>${progress}%</td>
        <td><div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: var(--primary); height: 100%; width: ${progress}%;"></div>
        </div></td>
      </tr>
    `;
  });

  // Update stats
  document.getElementById('statTotal').textContent = state.projects.length;
  document.getElementById('statActive').textContent = state.projects.filter(p => p.stage === 'В работе').length;
  document.getElementById('statPause').textContent = state.projects.filter(p => p.stage === 'На паузе').length;
  document.getElementById('statDone').textContent = state.projects.filter(p => p.stage === 'Готово').length;
}

function renderDashboardCharts() {
  // Chart 1: Plan vs Fact
  const ctxCompare = document.getElementById('chartCompare');
  if (ctxCompare && chartCompare) chartCompare.destroy();

  chartCompare = new Chart(ctxCompare, {
    type: 'bar',
    data: {
      labels: state.projects.slice(0, 10).map(p => p.name.substring(0, 15)),
      datasets: [
        {
          label: 'План',
          data: state.projects.slice(0, 10).map(p => p.plan_reels),
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Факт',
          data: state.projects.slice(0, 10).map(p => p.done_reels),
          backgroundColor: '#10b981'
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 2: By stages
  const ctxStages = document.getElementById('chartStages');
  if (ctxStages && chartStages) chartStages.destroy();

  const stageCount = {
    'В работе': 0,
    'На паузе': 0,
    'Готово': 0,
    'Проблемный': 0
  };
  state.projects.forEach(p => {
    if (stageCount.hasOwnProperty(p.stage)) {
      stageCount[p.stage]++;
    }
  });

  chartStages = new Chart(ctxStages, {
    type: 'doughnut',
    data: {
      labels: Object.keys(stageCount),
      datasets: [{
        data: Object.values(stageCount),
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderProjects() {
  const tbody = document.getElementById('projectsTable');
  if (!tbody) return;

  populateProjectFilterResponsible();
  applyProjectFilters();
}

function populateProjectFilterResponsible() {
  const select = document.getElementById('projectFilterResponsible');
  if (!select) return;

  const currentValue = select.value || '';
  select.innerHTML = '<option value="">По ответственному: Все</option>';

  (state.users || []).forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.name || user.email || ('Пользователь ' + user.id);
    select.appendChild(option);
  });

  if (currentValue) {
    select.value = currentValue;
  }
}

function applyProjectFilters() {
  const tbody = document.getElementById('projectsTable');
  if (!tbody) return;

  let projects = state.projects || [];

  if (!state.isAdmin()) {
    projects = projects.filter(p => p.responsible_id === state.currentUserId);
  }

  const stage = document.getElementById('projectFilterStage')?.value || '';
  const responsibleId = parseInt(document.getElementById('projectFilterResponsible')?.value, 10) || null;

  if (stage) {
    projects = projects.filter(p => p.stage === stage);
  }
  if (responsibleId) {
    projects = projects.filter(p => p.responsible_id === responsibleId);
  }

  tbody.innerHTML = '';

  if (projects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; color: var(--gray); padding: 20px;">
          Нет проектов для отображения. Сбросьте фильтры или создайте новый проект.
        </td>
      </tr>
    `;
    return;
  }

  projects.forEach((project, index) => {
    const progress = project.plan_reels > 0 ? Math.round((project.done_reels / project.plan_reels) * 100) : 0;
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(project.name)}</td>
        <td>${escapeHtml(project.stage)}</td>
        <td>${escapeHtml(project.responsible_name)}</td>
        <td>${escapeHtml(project.platform)}</td>
        <td>${project.plan_reels}</td>
        <td>${project.done_reels}</td>
        <td>${progress}%</td>
        <td>
          ${state.isAdmin() ? `
          <button class="btn-sm" data-action="edit" data-type="project" data-id="${project.id}">✏️</button>
          <button class="btn-sm btn-danger" data-action="delete" data-type="project" data-id="${project.id}">🗑️</button>` : '<span style="color: var(--gray);">—</span>'}
        </td>
      </tr>
    `;
  });
}

function renderAnalytics() {
  const tbody = document.getElementById('analyticsTable');
  tbody.innerHTML = '';

  let analytics = state.analytics;
  if (!state.isAdmin()) {
      analytics = analytics.filter(a => a.responsible_id === state.currentUserId);
  }

  analytics.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(a.project_name)}</td>
        <td>${escapeHtml(a.responsible_name)}</td>
        <td>${a.views}</td>
        <td>${a.subs}</td>
        <td>${a.interactions}</td>
        <td>${escapeHtml(a.period)}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="analytics" data-id="${a.id}">✏️</button>
          ${state.isAdmin() ? `<button class="btn-sm btn-danger" data-action="delete" data-type="analytics" data-id="${a.id}">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  });
}

function renderTasks() {
  populateTaskFilterState();
  applyTaskFilters();
}

function populateTaskFilterState() {
  const stageSelect = document.getElementById('taskFilterStage');
  if (!stageSelect) return;

  if (!stageSelect.querySelector('option[value=""]').length) {
    stageSelect.innerHTML = `
      <option value="">По этапу: Все</option>
      <option value="В работе">В работе</option>
      <option value="Проблемный">Проблемный</option>
      <option value="На паузе">На паузе</option>
      <option value="Готово">Готово</option>
    `;
  }
}

function applyTaskFilters() {
  const tbody = document.getElementById('tasksTable');
  if (!tbody) return;

  let tasks = state.tasks || [];
  if (!state.isAdmin()) {
    tasks = tasks.filter(t => t.responsible_id === state.currentUserId);
  }

  const stage = document.getElementById('taskFilterStage')?.value || '';
  if (stage) {
    tasks = tasks.filter(t => t.stage === stage);
  }

  tbody.innerHTML = '';

  if (tasks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="padding:20px; text-align:center; color:var(--gray);">
          Нет задач для отображения. Уберите фильтры или создайте новую задачу.
        </td>
      </tr>
    `;
    return;
  }

  tasks.forEach((task, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(task.project_name)}</td>
        <td>${escapeHtml(task.task_name)}</td>
        <td>${escapeHtml(formatDate(task.end_date))}</td>
        <td>${escapeHtml(task.responsible_name)}</td>
        <td>${escapeHtml(task.stage)}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="task" data-id="${task.id}">✏️</button>
          ${state.isAdmin() ? `<button class="btn-sm btn-danger" data-action="delete" data-type="task" data-id="${task.id}">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  });
}

function renderEmployees() {
  if (!state.isAdmin()) return;

  const tbody = document.getElementById('employeesTable');
  tbody.innerHTML = '';

  state.employees.forEach(emp => {
    const projectNames = state.projects
      .filter(p => p.responsible_id === emp.id)
      .map(p => p.name)
      .join(', ') || '-';

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(emp.name)}</td>
        <td>${escapeHtml(emp.city)}</td>
        <td>${escapeHtml(emp.employment)}</td>
        <td>${escapeHtml(projectNames)}</td>
        <td>${escapeHtml(emp.status)}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="employee" data-id="${emp.id}">✏️</button>
          <button class="btn-sm btn-danger" data-action="delete" data-type="employee" data-id="${emp.id}">🗑️</button>
        </td>
      </tr>
    `;
  });
}

function renderReports() {
  renderReportSummary();

  const activeProjects = state.projects.filter(p => p.stage === 'В работе');
  populateDropdown('reportProject', activeProjects);
  populateDropdown('reportFilterEmployee', state.users || []);
  populateDropdown('reportFilterProject', activeProjects);

  let reports = state.reports;
  if (!state.isAdmin()) {
    reports = reports.filter(r => r.user_id === state.currentUserId);
  }

  renderReportRows(reports);
}

function renderReportSummary() {
  const tbody = document.getElementById('reportsSummaryTable');
  if (!tbody) return;

  const activeProjects = state.projects.filter(p => p.stage === 'В работе');
  tbody.innerHTML = '';

  if (activeProjects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:var(--gray);">Нет проектов в работе</td>
      </tr>
    `;
    return;
  }

  activeProjects.forEach(project => {
    const projectAnalytics = (state.analytics || []).filter(a => a.project_id === project.id);
    const totalViews = projectAnalytics.reduce((sum, a) => sum + (parseInt(a.views, 10) || 0), 0);
    const totalSubs = projectAnalytics.reduce((sum, a) => sum + (parseInt(a.subs, 10) || 0), 0);
    const totalInteractions = projectAnalytics.reduce((sum, a) => sum + (parseInt(a.interactions, 10) || 0), 0);
    const responsible = (state.users || []).find(u => u.id === project.responsible_id)?.name || '-';

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(project.name)}</td>
        <td>${escapeHtml(responsible)}</td>
        <td>${project.plan_reels ?? 0}</td>
        <td>${project.done_reels ?? 0}</td>
        <td>${totalViews}</td>
        <td>${totalSubs}</td>
        <td>${totalInteractions}</td>
      </tr>
    `;
  });
}

function renderReportRows(reports) {
  const tbody = document.getElementById('reportsListTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!reports || reports.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding:20px; text-align:center; color:var(--gray);">
          Нет отчётов для отображения. Создайте новый отчёт или уберите фильтры.
        </td>
      </tr>
    `;
    return;
  }

  reports.forEach(report => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(formatDate(report.date))}</td>
        <td>${escapeHtml(report.time)}</td>
        <td>${escapeHtml(report.user_name)}</td>
        <td>${escapeHtml(report.project_name)}</td>
        <td>${report.reels_created} / ${report.reels_published}</td>
        <td>${escapeHtml(report.platforms)}</td>
        <td>${escapeHtml(report.comment)}</td>
        <td>${report.screenshot_data ? '📸' : '-'}</td>
      </tr>
    `;
  });
}

async function submitReport() {
  const projectId = parseInt(document.getElementById('reportProject').value, 10) || null;
  if (!projectId) {
    showToast('Выберите проект для отчёта', 'error');
    return;
  }

  const project = state.projects.find(p => p.id === projectId);
  const reelsCreated = parseInt(document.getElementById('reportReelsCreated').value, 10) || 0;
  const reelsPublished = parseInt(document.getElementById('reportReelsPublished').value, 10) || 0;
  const platforms = Array.from(document.querySelectorAll('.reportPlatform:checked')).map(input => input.value).join(', ');
  const comment = document.getElementById('reportComment').value.trim();
  const screenshotData = await getScreenshotAsBase64(document.getElementById('reportScreenshot'));
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const data = {
    project_id: projectId,
    project_name: project?.name || '',
    date,
    time,
    reels_created: reelsCreated,
    reels_published: reelsPublished,
    platforms,
    comment,
    screenshot_data: screenshotData
  };

  const result = await api.post('/reports', data);
  if (!result) return;

  state.reports = (await api.get('/reports')) || [];
  renderReports();
  showToast('Отчёт отправлен', 'success');

  document.getElementById('reportProject').value = '';
  document.getElementById('reportReelsCreated').value = 0;
  document.getElementById('reportReelsPublished').value = 0;
  document.querySelectorAll('.reportPlatform:checked').forEach(input => input.checked = false);
  document.getElementById('reportComment').value = '';
  document.getElementById('reportScreenshot').value = '';
  document.getElementById('screenshotPreview').innerHTML = '';
}

function applyReportFilters() {
  let reports = state.reports;
  if (!state.isAdmin()) {
    reports = reports.filter(r => r.user_id === state.currentUserId);
  }

  const dateFrom = document.getElementById('reportFilterDateFrom').value;
  const dateTo = document.getElementById('reportFilterDateTo').value;
  const employeeId = parseInt(document.getElementById('reportFilterEmployee').value, 10) || null;
  const projectId = parseInt(document.getElementById('reportFilterProject').value, 10) || null;

  if (dateFrom) {
    reports = reports.filter(r => r.date >= dateFrom);
  }
  if (dateTo) {
    reports = reports.filter(r => r.date <= dateTo);
  }
  if (employeeId) {
    reports = reports.filter(r => r.user_id === employeeId);
  }
  if (projectId) {
    reports = reports.filter(r => r.project_id === projectId);
  }

  renderReportRows(reports);
}

function clearReportFilters() {
  document.getElementById('reportFilterDateFrom').value = '';
  document.getElementById('reportFilterDateTo').value = '';
  document.getElementById('reportFilterEmployee').value = '';
  document.getElementById('reportFilterProject').value = '';
  renderReports();
}

function renderFinance() {
  // Restore inputs from saved params (API returns snake_case; working copy is camelCase)
  const p = state.financeParams || {};
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };
  setVal('baseSalary', p.base_salary ?? p.baseSalary ?? 4000);
  setVal('baseReels', p.base_reels ?? p.baseReels ?? 80);
  setVal('analyticsBonusThreshold', p.bonus_threshold ?? p.analyticsBonusThreshold ?? 500000);
  setVal('analyticsBonusAmount', p.bonus_amount ?? p.analyticsBonusAmount ?? 1000);
  setVal('otherExpenses', p.other_expenses ?? p.otherExpenses ?? 0);
  updateFinanceParams();
}

async function saveFinanceParams() {
  updateFinanceParams();
  const p = state.financeParams;
  const result = await api.put('/finance/params', {
    base_salary: p.baseSalary,
    base_reels: p.baseReels,
    other_expenses: p.otherExpenses,
    bonus_threshold: p.analyticsBonusThreshold,
    bonus_amount: p.analyticsBonusAmount
  });
  if (result) {
    showToast('Параметры расчёта сохранены', 'success');
  }
}

function renderAccess() {
  if (!state.isAdmin()) return;

  const tbody = document.getElementById('accessTable');
  tbody.innerHTML = '';

  state.access.forEach(acc => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(acc.project_name)}</td>
        <td><a href="${escapeHtml(acc.tg_link)}" target="_blank" rel="noopener noreferrer">TG</a></td>
        <td>${escapeHtml(acc.login)}</td>
        <td><input type="password" value="${escapeHtml(acc.password)}" readonly style="width:150px;"></td>
        <td>${escapeHtml(acc.note)}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="access" data-id="${acc.id}">✏️</button>
          <button class="btn-sm btn-danger" data-action="delete" data-type="access" data-id="${acc.id}">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// Modal opening functions with dropdown population
function openProjectModal() {
  state.editingId = null;
  document.getElementById('projectForm').reset();
  openModal('projectModal');
  populateDropdown('projectResponsible', state.users || []);
  populateDropdown('projectPlatform', ['Instagram', 'TikTok', 'YouTube', 'Pinterest']);
}

function openTaskModal() {
  state.editingId = null;
  document.getElementById('taskForm').reset();
  openModal('taskModal');
  populateDropdown('taskProject', state.projects || []);
  populateDropdown('taskResponsible', state.users || []);
}

function openAnalyticsModal() {
  state.editingId = null;
  document.getElementById('analyticsForm').reset();
  openModal('analyticsModal');
  populateDropdown('analyticsProject', state.projects || []);
  populateDropdown('analyticsResponsible', state.users || []);
}

function openEmployeeModal(selectedProjectIds = []) {
  state.editingId = null;
  document.getElementById('employeeForm').reset();
  openModal('employeeModal');
  populateDropdown('employeeProjects', state.projects || [], selectedProjectIds);
}

function openAccessModal() {
  state.editingId = null;
  document.getElementById('accessForm').reset();
  openModal('accessModal');
  populateDropdown('accessProject', state.projects || []);
}

// ===== Projects CRUD =====
async function saveProject(e) {
  e.preventDefault();
  if (!state.isAdmin()) {
    showToast('Только администратор может создавать или редактировать проекты', 'error');
    return;
  }
  const data = {
    name: document.getElementById('projectName').value.trim(),
    stage: document.getElementById('projectStage').value,
    responsible_id: parseInt(document.getElementById('projectResponsible').value) || null,
    platform: document.getElementById('projectPlatform').value,
    priority: parseInt(document.getElementById('projectPriority').value) || 5,
    plan_reels: parseInt(document.getElementById('projectPlanReels').value) || 0,
    done_reels: parseInt(document.getElementById('projectDoneReels').value) || 0,
    start_date: document.getElementById('projectStartDate').value,
    comment: document.getElementById('projectComment').value
  };

  const id = state.editingId;
  const result = id
    ? await api.put(`/projects/${id}`, data)
    : await api.post('/projects', data);
  if (!result) return;

  closeModal('projectModal');
  state.editingId = null;
  showToast(id ? 'Проект обновлён' : 'Проект создан', 'success');
  state.projects = (await api.get('/projects')) || [];
  renderProjects();
}

function editProject(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) {
    showToast('Проект не найден', 'error');
    return;
  }
  openProjectModal();
  state.editingId = id;
  document.getElementById('projectName').value = project.name || '';
  document.getElementById('projectStage').value = project.stage || '';
  document.getElementById('projectPriority').value = project.priority ?? 5;
  document.getElementById('projectPlanReels').value = project.plan_reels ?? 0;
  document.getElementById('projectDoneReels').value = project.done_reels ?? 0;
  document.getElementById('projectStartDate').value = project.start_date || '';
  document.getElementById('projectComment').value = project.comment || '';
  document.getElementById('projectResponsible').value = project.responsible_id || '';
  document.getElementById('projectPlatform').value = project.platform || '';
}

async function deleteProject(id) {
  const result = await api.delete(`/projects/${id}`);
  if (result === null) return;
  showToast('Проект удалён', 'success');
  state.projects = state.projects.filter(p => p.id !== id);
  renderProjects();
}

// ===== Tasks CRUD =====
async function saveTask(e) {
  e.preventDefault();
  const projectId = parseInt(document.getElementById('taskProject').value) || null;
  const responsibleId = parseInt(document.getElementById('taskResponsible').value) || null;
  const project = state.projects.find(p => p.id === projectId);
  const responsible = (state.users || []).find(u => u.id === responsibleId);

  const data = {
    project_id: projectId,
    project_name: project?.name || '',
    task_name: document.getElementById('taskName').value.trim(),
    start_date: document.getElementById('taskStartDate').value,
    end_date: document.getElementById('taskEndDate').value,
    responsible_id: responsibleId,
    responsible_name: responsible?.name || '',
    stage: document.getElementById('taskStage').value,
    comment: document.getElementById('taskComment').value
  };

  const id = state.editingId;
  const result = id
    ? await api.put(`/tasks/${id}`, data)
    : await api.post('/tasks', data);
  if (!result) return;

  closeModal('taskModal');
  state.editingId = null;
  showToast(id ? 'Задача обновлена' : 'Задача создана', 'success');
  state.tasks = (await api.get('/tasks')) || [];
  renderTasks();
}

function editTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) {
    showToast('Задача не найдена', 'error');
    return;
  }
  openTaskModal();
  state.editingId = id;
  document.getElementById('taskProject').value = task.project_id || '';
  document.getElementById('taskName').value = task.task_name || '';
  document.getElementById('taskStartDate').value = task.start_date || '';
  document.getElementById('taskEndDate').value = task.end_date || '';
  document.getElementById('taskResponsible').value = task.responsible_id || '';
  document.getElementById('taskStage').value = task.stage || '';
  document.getElementById('taskComment').value = task.comment || '';
}

async function deleteTask(id) {
  const result = await api.delete(`/tasks/${id}`);
  if (result === null) return;
  showToast('Задача удалена', 'success');
  state.tasks = state.tasks.filter(t => t.id !== id);
  renderTasks();
}

// ===== Employees CRUD =====
async function saveEmployee(e) {
  e.preventDefault();
  const firstName = document.getElementById('employeeFirstName').value.trim();
  const lastName = document.getElementById('employeeLastName').value.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const selectedProjectIds = Array.from(document.getElementById('employeeProjects').selectedOptions)
    .map(option => parseInt(option.value, 10))
    .filter(Boolean);

  const data = {
    name: fullName,
    city: document.getElementById('employeeCity').value.trim(),
    employment: document.getElementById('employeeEmployment').value,
    status: document.getElementById('employeeStatus').value,
    email: '',
    phone: ''
  };

  if (!data.name) {
    showToast('Укажите имя', 'error');
    return;
  }

  const id = state.editingId;
  const result = id
    ? await api.put(`/employees/${id}`, data)
    : await api.post('/employees', data);
  if (!result) return;

  const employeeId = id || result.id;
  try {
    await assignEmployeeProjects(employeeId, selectedProjectIds);
  } catch (error) {
    return;
  }

  await loadAppData();
  closeModal('employeeModal');
  state.editingId = null;
  showToast(id ? 'Сотрудник обновлён' : 'Сотрудник добавлен', 'success');
  renderEmployees();
}

async function assignEmployeeProjects(employeeId, selectedProjectIds = []) {
  const currentProjectIds = (state.projects || [])
    .filter(p => p.responsible_id === employeeId)
    .map(p => p.id);

  const toAssign = selectedProjectIds.filter(id => !currentProjectIds.includes(id));
  const toUnassign = currentProjectIds.filter(id => !selectedProjectIds.includes(id));

  if (toUnassign.length > 0) {
    showToast('Чтобы снять проект с сотрудника, переназначьте его другому сотруднику через форму проекта.', 'error');
    throw new Error('Unassigning project without replacement is not allowed');
  }

  const assignPromises = toAssign.map(projectId =>
    api.post(`/projects/${projectId}/assign`, { userId: employeeId })
  );

  await Promise.all(assignPromises);
}

function editEmployee(id) {
  const employee = state.employees.find(e => e.id === id);
  if (!employee) {
    showToast('Сотрудник не найден', 'error');
    return;
  }

  const assignedProjectIds = state.projects
    .filter(p => p.responsible_id === id)
    .map(p => p.id);

  openEmployeeModal(assignedProjectIds);
  state.editingId = id;
  const parts = (employee.name || '').split(' ');
  document.getElementById('employeeFirstName').value = parts[0] || '';
  document.getElementById('employeeLastName').value = parts.slice(1).join(' ') || '';
  document.getElementById('employeeCity').value = employee.city || '';
  document.getElementById('employeeEmployment').value = employee.employment || '';
  document.getElementById('employeeStatus').value = employee.status || '';
}

async function deleteEmployee(id) {
  const result = await api.delete(`/employees/${id}`);
  if (result === null) return;
  showToast('Сотрудник удалён', 'success');
  state.employees = state.employees.filter(e => e.id !== id);
  state.users = state.employees;
  renderEmployees();
}

// ===== Analytics CRUD =====
async function saveAnalytics(e) {
  e.preventDefault();
  const projectId = parseInt(document.getElementById('analyticsProject').value) || null;
  const responsibleId = parseInt(document.getElementById('analyticsResponsible').value) || null;
  const project = state.projects.find(p => p.id === projectId);
  const responsible = (state.users || []).find(u => u.id === responsibleId);

  const data = {
    project_id: projectId,
    project_name: project?.name || '',
    responsible_id: responsibleId,
    responsible_name: responsible?.name || '',
    start_date: document.getElementById('analyticsStartDate').value,
    views: parseInt(document.getElementById('analyticsViews').value) || 0,
    subs: parseInt(document.getElementById('analyticsSubs').value) || 0,
    total_subs: parseInt(document.getElementById('analyticsTotalSubs').value) || 0,
    interactions: parseInt(document.getElementById('analyticsInteractions').value) || 0,
    period: document.getElementById('analyticsPeriod').value
  };

  const id = state.editingId;
  const result = id
    ? await api.put(`/analytics/${id}`, data)
    : await api.post('/analytics', data);
  if (!result) return;

  closeModal('analyticsModal');
  state.editingId = null;
  showToast(id ? 'Запись обновлена' : 'Запись создана', 'success');
  state.analytics = (await api.get('/analytics')) || [];
  renderAnalytics();
}

function editAnalytics(id) {
  const a = state.analytics.find(x => x.id === id);
  if (!a) {
    showToast('Запись не найдена', 'error');
    return;
  }
  openAnalyticsModal();
  state.editingId = id;
  document.getElementById('analyticsProject').value = a.project_id || '';
  document.getElementById('analyticsResponsible').value = a.responsible_id || '';
  document.getElementById('analyticsStartDate').value = a.start_date || '';
  document.getElementById('analyticsViews').value = a.views ?? 0;
  document.getElementById('analyticsSubs').value = a.subs ?? 0;
  document.getElementById('analyticsTotalSubs').value = a.total_subs ?? 0;
  document.getElementById('analyticsInteractions').value = a.interactions ?? 0;
  document.getElementById('analyticsPeriod').value = a.period || '';
}

async function deleteAnalytics(id) {
  const result = await api.delete(`/analytics/${id}`);
  if (result === null) return;
  showToast('Запись удалена', 'success');
  state.analytics = state.analytics.filter(a => a.id !== id);
  renderAnalytics();
}

// ===== Access CRUD =====
async function saveAccess(e) {
  e.preventDefault();
  const projectId = parseInt(document.getElementById('accessProject').value) || null;
  const project = state.projects.find(p => p.id === projectId);

  const data = {
    project_id: projectId,
    project_name: project?.name || '',
    tg_link: document.getElementById('accessTgLink').value,
    login: document.getElementById('accessLogin').value,
    password: document.getElementById('accessPassword').value,
    note: document.getElementById('accessNote').value
  };

  const id = state.editingId;
  const result = id
    ? await api.put(`/access/${id}`, data)
    : await api.post('/access', data);
  if (!result) return;

  closeModal('accessModal');
  state.editingId = null;
  showToast(id ? 'Доступ обновлён' : 'Доступ добавлен', 'success');
  state.access = (await api.get('/access')) || [];
  renderAccess();
}

function editAccess(id) {
  const item = state.access.find(a => a.id === id);
  if (!item) {
    showToast('Доступ не найден', 'error');
    return;
  }
  openAccessModal();
  state.editingId = id;
  document.getElementById('accessProject').value = item.project_id || '';
  document.getElementById('accessTgLink').value = item.tg_link || '';
  document.getElementById('accessLogin').value = item.login || '';
  document.getElementById('accessPassword').value = item.password || '';
  document.getElementById('accessNote').value = item.note || '';
}

async function deleteAccess(id) {
  const result = await api.delete(`/access/${id}`);
  if (result === null) return;
  showToast('Доступ удалён', 'success');
  state.access = state.access.filter(a => a.id !== id);
  renderAccess();
}

function updateFinanceParams() {
  const financeParams = state.financeParams = state.financeParams || {};
  financeParams.baseSalary = parseFloat(document.getElementById('baseSalary')?.value || 4000);
  financeParams.baseReels = parseFloat(document.getElementById('baseReels')?.value || 80);
  financeParams.analyticsBonusThreshold = parseInt(document.getElementById('analyticsBonusThreshold')?.value || 500000, 10);
  financeParams.analyticsBonusAmount = parseInt(document.getElementById('analyticsBonusAmount')?.value || 1000, 10);
  financeParams.otherExpenses = parseFloat(document.getElementById('otherExpenses')?.value || 0);
  const pricePerReel = Math.round(financeParams.baseSalary / financeParams.baseReels);

  const priceEl = document.getElementById('pricePerReel');
  if (priceEl) {
    priceEl.textContent = pricePerReel + '₽';
  }

  const bonusRuleEl = document.getElementById('bonusRule');
  if (bonusRuleEl) {
    bonusRuleEl.textContent = `+${financeParams.analyticsBonusAmount}₽ за ${financeParams.analyticsBonusThreshold.toLocaleString('ru-RU')} просмотров`;
  }

  renderFinanceReport();
  renderFinanceAnalytics();
}

function getEmployeeDoneReels(employeeId) {
  return state.projects.reduce((sum, project) => {
    return sum + ((project.responsible_id === employeeId) ? (parseInt(project.done_reels, 10) || 0) : 0);
  }, 0);
}

function getEmployeeViews(employeeId) {
  return state.analytics.reduce((sum, item) => {
    return sum + ((item.responsible_id === employeeId) ? (parseInt(item.views, 10) || 0) : 0);
  }, 0);
}

function getEmployeeSalary(employee) {
  const financeParams = state.financeParams = state.financeParams || {};
  const doneReels = getEmployeeDoneReels(employee.id);
  const views = getEmployeeViews(employee.id);
  const baseSalary = Math.round(Math.min(doneReels, financeParams.baseReels) / financeParams.baseReels * financeParams.baseSalary);
  const bonus = views >= financeParams.analyticsBonusThreshold ? financeParams.analyticsBonusAmount : 0;
  const total = baseSalary + bonus;

  return {
    name: employee.name || 'Неизвестный',
    doneReels,
    views,
    baseSalary,
    bonus,
    total
  };
}

function getTotalPayroll() {
  return state.employees.reduce((sum, employee) => sum + getEmployeeSalary(employee).total, 0);
}

function getTotalBonus() {
  return state.employees.reduce((sum, employee) => sum + getEmployeeSalary(employee).bonus, 0);
}

function getTotalViews() {
  return state.analytics.reduce((sum, item) => sum + (parseInt(item.views, 10) || 0), 0);
}

function renderFinanceReport() {
  const financeParams = state.financeParams = state.financeParams || {};
  const tbody = document.getElementById('financePayrollTable');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!state.employees || state.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">Нет сотрудников для расчёта выплат.</td></tr>';
    return;
  }

  let totalBase = 0;
  let totalBonus = 0;

  state.employees.forEach(employee => {
    const salary = getEmployeeSalary(employee);
    totalBase += salary.baseSalary;
    totalBonus += salary.bonus;

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(salary.name)}</td>
        <td>${salary.doneReels}</td>
        <td>${salary.views.toLocaleString('ru-RU')}</td>
        <td>${salary.baseSalary.toLocaleString('ru-RU')}₽</td>
        <td>${salary.bonus.toLocaleString('ru-RU')}₽</td>
        <td>${salary.total.toLocaleString('ru-RU')}₽</td>
        <td>${salary.doneReels >= financeParams.baseReels ? 'Норма выполнена' : 'Норма не выполнена'}</td>
      </tr>
    `;
  });

  document.getElementById('totalBaseSalary').textContent = totalBase.toLocaleString('ru-RU') + '₽';
  document.getElementById('totalBonusSalary').textContent = totalBonus.toLocaleString('ru-RU') + '₽';
  document.getElementById('totalExpenses').textContent = financeParams.otherExpenses.toLocaleString('ru-RU') + '₽';
  document.getElementById('totalPayout').textContent = (totalBase + totalBonus + financeParams.otherExpenses).toLocaleString('ru-RU') + '₽';
}

function renderFinanceAnalytics() {
  const financeParams = state.financeParams = state.financeParams || {};
  const totalViews = getTotalViews();
  const totalPayroll = getTotalPayroll();
  const totalBonus = getTotalBonus();
  const totalPayout = totalPayroll + financeParams.otherExpenses;

  const totalViewsEl = document.getElementById('totalViewsAll');
  const totalEmployeesEl = document.getElementById('totalEmployeesAll');
  const totalBonusRuleEl = document.getElementById('totalBonusRule');
  const totalPayoutAllEl = document.getElementById('totalPayoutAll');

  if (totalViewsEl) totalViewsEl.textContent = totalViews.toLocaleString('ru-RU');
  if (totalEmployeesEl) totalEmployeesEl.textContent = state.employees.length;
  if (totalBonusRuleEl) totalBonusRuleEl.textContent = `+${financeParams.analyticsBonusAmount}₽ за ${financeParams.analyticsBonusThreshold.toLocaleString('ru-RU')} просмотров`;
  if (totalPayoutAllEl) totalPayoutAllEl.textContent = totalPayout.toLocaleString('ru-RU') + '₽';

  renderFinanceCharts(totalPayroll, totalBonus, totalPayout);
}

function renderFinanceCharts(payroll, bonus, payout) {
  const financeParams = state.financeParams = state.financeParams || {};
  const chartPayrollCtx = document.getElementById('chartPayroll');
  const chartViewsCtx = document.getElementById('chartViews');

  if (window.financeChartPayroll) window.financeChartPayroll.destroy();
  if (window.financeChartViews) window.financeChartViews.destroy();

  if (chartPayrollCtx) {
    window.financeChartPayroll = new Chart(chartPayrollCtx, {
      type: 'doughnut',
      data: {
        labels: ['Базовая зарплата', 'Премии', 'Расходы'],
        datasets: [{
          data: [payroll, bonus, financeParams.otherExpenses],
          backgroundColor: ['#2563EB', '#10B981', '#EF4444'],
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  const topEmployees = state.employees
    .map(employee => ({
      name: employee.name || 'Неизвестный',
      views: getEmployeeViews(employee.id)
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  if (chartViewsCtx) {
    window.financeChartViews = new Chart(chartViewsCtx, {
      type: 'bar',
      data: {
        labels: topEmployees.map(item => item.name),
        datasets: [{
          label: 'Просмотры',
          data: topEmployees.map(item => item.views),
          backgroundColor: '#2563EB'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function exportTableToXLSX(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;
  if (!window.XLSX) {
    alert('Библиотека XLSX не загружена.');
    return;
  }

  const workbook = XLSX.utils.table_to_book(table, { sheet: 'Выплаты' });
  XLSX.writeFile(workbook, filename || 'finance-payroll.xlsx');
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
