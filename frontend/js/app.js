// Main application file

let chartCompare, chartStages, chartViews, chartInteractions, chartIncome, chartProfitMargin;

async function initializeApp() {
  console.log('🚀 Initializing app...');

  // Setup login/register buttons FIRST (before checking token)
  setupEventListeners();

  // Check if user is already logged in
  const token = api.getToken();

  if (token) {
    console.log('📍 Found token, verifying...');
    // Verify token is still valid
    const user = await api.get('/auth/me');
    if (user) {
      console.log('✅ User authenticated:', user.name);
      state.setUser(user, token);
      hideLoginScreen();
      await loadAppData();
      renderSection('dashboard');
    } else {
      console.log('❌ Token invalid, showing login');
      showLoginScreen();
    }
  } else {
    console.log('📍 No token found, showing login screen');
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
  document.getElementById('userName2').textContent = state.currentUser;
  document.getElementById('userRole2').textContent = state.userRole === 'admin' ? '🔐 Администратор' : '👥 Сотрудник';
}

function updateAdminSection() {
  const adminSection = document.getElementById('adminSection');
  if (state.isAdmin()) {
    adminSection.style.display = 'block';
  } else {
    adminSection.style.display = 'none';
  }
}

function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');

  // Login button - ALWAYS setup even on login screen
  const loginBtn = document.getElementById('loginBtn');
  console.log('🔘 Login button found:', !!loginBtn);
  if (loginBtn) {
    console.log('✅ Adding click listener to loginBtn');
    loginBtn.addEventListener('click', () => {
      console.log('🖱️ Login button clicked!');
      handleLogin();
    });
  } else {
    console.error('❌ Login button NOT found!');
  }

  // Register button - ALWAYS setup even on login screen
  const registerBtn = document.getElementById('registerBtn');
  console.log('🔘 Register button found:', !!registerBtn);
  if (registerBtn) {
    console.log('✅ Adding click listener to registerBtn');
    registerBtn.addEventListener('click', () => {
      console.log('🖱️ Register button clicked!');
      handleRegister();
    });
  } else {
    console.warn('⚠️ Register button NOT found');
  }

  // Navigation items (only if user is logged in)
  document.querySelectorAll('.nav-item').forEach(item => {
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
      updateFinanceParams();
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
    // TODO: Get current user ID from server
    projects = projects.filter(p => p.responsible_id === state.currentUser?.id);
  }

  projects.filter(p => p.stage === 'В работе').forEach(project => {
    const progress = project.plan_reels > 0 ? Math.round((project.done_reels / project.plan_reels) * 100) : 0;
    tbody.innerHTML += `
      <tr>
        <td>${project.name}</td>
        <td>${project.responsible_name}</td>
        <td>${project.platform}</td>
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
  tbody.innerHTML = '';

  let projects = state.projects;
  if (!state.isAdmin()) {
    projects = projects.filter(p => p.responsible_id === state.currentUser?.id);
  }

  projects.forEach((project, index) => {
    const progress = project.plan_reels > 0 ? Math.round((project.done_reels / project.plan_reels) * 100) : 0;
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${project.name}</td>
        <td>${project.stage}</td>
        <td>${project.responsible_name}</td>
        <td>${project.platform}</td>
        <td>${project.plan_reels}</td>
        <td>${project.done_reels}</td>
        <td>${progress}%</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="project" data-id="${project.id}">✏️</button>
          ${state.isAdmin() ? `<button class="btn-sm btn-danger" data-action="delete" data-type="project" data-id="${project.id}">🗑️</button>` : ''}
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
    analytics = analytics.filter(a => a.responsible_id === state.currentUser?.id);
  }

  analytics.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${a.project_name}</td>
        <td>${a.responsible_name}</td>
        <td>${a.views}</td>
        <td>${a.subs}</td>
        <td>${a.interactions}</td>
        <td>${a.period}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="analytics" data-id="${a.id}">✏️</button>
          ${state.isAdmin() ? `<button class="btn-sm btn-danger" data-action="delete" data-type="analytics" data-id="${a.id}">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  });
}

function renderTasks() {
  const tbody = document.getElementById('tasksTable');
  tbody.innerHTML = '';

  state.tasks.forEach((task, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${task.project_name}</td>
        <td>${task.task_name}</td>
        <td>${formatDate(task.end_date)}</td>
        <td>${task.responsible_name}</td>
        <td>${task.stage}</td>
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
    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.city}</td>
        <td>${emp.employment}</td>
        <td>${emp.status}</td>
        <td>${emp.status}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="employee" data-id="${emp.id}">✏️</button>
          <button class="btn-sm btn-danger" data-action="delete" data-type="employee" data-id="${emp.id}">🗑️</button>
        </td>
      </tr>
    `;
  });
}

function renderReports() {
  const tbody = document.getElementById('reportsListTable');
  tbody.innerHTML = '';

  let reports = state.reports;
  if (!state.isAdmin()) {
    reports = reports.filter(r => r.user_id === state.currentUser?.id);
  }

  reports.forEach(report => {
    tbody.innerHTML += `
      <tr>
        <td>${formatDate(report.date)}</td>
        <td>${report.time}</td>
        <td>${report.user_name}</td>
        <td>${report.project_name}</td>
        <td>${report.reels_created}/${report.reels_published}</td>
        <td>${report.platforms}</td>
        <td>${report.comment}</td>
        <td>${report.screenshot_data ? '📸' : '-'}</td>
      </tr>
    `;
  });
}

function renderFinance() {
  // Load finance params
  const baseSalary = document.getElementById('baseSalary');
  if (baseSalary) {
    baseSalary.value = state.financeParams.base_salary || 4000;
  }
  updateFinanceParams();
}

function renderAccess() {
  if (!state.isAdmin()) return;

  const tbody = document.getElementById('accessTable');
  tbody.innerHTML = '';

  state.access.forEach(acc => {
    tbody.innerHTML += `
      <tr>
        <td>${acc.project_name}</td>
        <td><a href="${acc.tg_link}" target="_blank">TG</a></td>
        <td>${acc.login}</td>
        <td><input type="password" value="${acc.password}" readonly style="width:150px;"></td>
        <td>${acc.note}</td>
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
  openModal('projectModal');
  populateDropdown('projectResponsible', state.users || []);
  populateDropdown('projectPlatform', ['Instagram', 'TikTok', 'YouTube', 'Pinterest']);
}

function openTaskModal() {
  openModal('taskModal');
  populateDropdown('taskProject', state.projects || []);
  populateDropdown('taskResponsible', state.users || []);
}

function openAnalyticsModal() {
  openModal('analyticsModal');
  populateDropdown('analyticsProject', state.projects || []);
  populateDropdown('analyticsResponsible', state.users || []);
}

function openEmployeeModal() { openModal('employeeModal'); }

function openAccessModal() {
  openModal('accessModal');
  populateDropdown('accessProject', state.projects || []);
}

function updateFinanceParams() {
  const baseSalary = parseFloat(document.getElementById('baseSalary')?.value || 4000);
  const baseReels = parseFloat(document.getElementById('baseReels')?.value || 80);
  const otherExpenses = parseFloat(document.getElementById('otherExpenses')?.value || 0);
  const pricePerReel = Math.round(baseSalary / baseReels);

  const priceEl = document.getElementById('pricePerReel');
  if (priceEl) {
    priceEl.textContent = pricePerReel + '₽';
  }
}

// Initialize app when DOM is loaded
console.log('📄 App.js loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded event fired');
    initializeApp();
  });
} else {
  console.log('📄 DOM already ready, initializing...');
  initializeApp();
}
