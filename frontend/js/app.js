// Main application file

let chartCompare, chartStages, chartViews, chartInteractions, chartIncome, chartProfitMargin, chartByEmployee;

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

    // Load finance params
    const financeParams = await api.get('/finance/params');
    state.financeParams = financeParams || {};

    // Load expenses (admin only)
    if (state.isAdmin()) {
      const expenses = await api.get('/expenses');
      state.expenses = expenses || [];

      const archived = await api.get('/projects/archived');
      state.archivedProjects = archived || [];
    } else {
      state.expenses = [];
      state.archivedProjects = [];
    }

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

  // Expense modal
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', openExpenseModal);
  }
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) expenseForm.addEventListener('submit', saveExpense);

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
    newReportTab.addEventListener('click', () => showReportTab('new'));
    allReportsTab.addEventListener('click', () => showReportTab('all'));
  }

  // Finance tabs
  setupFinanceTabs();
}

function setupFinanceTabs() {
  const financeReportTab = document.getElementById('financeReportTab');
  const financeAnalyticsTab = document.getElementById('financeAnalyticsTab');

  if (!financeReportTab || !financeAnalyticsTab) return;

  const showPayroll = () => {
    document.getElementById('financeReport').style.display = 'block';
    document.getElementById('financeAnalytics').style.display = 'none';
    financeReportTab.classList.replace('btn-secondary', 'btn-primary');
    financeReportTab.style.background = 'var(--primary)';
    financeReportTab.style.color = 'white';
    financeReportTab.style.border = 'none';
    financeAnalyticsTab.classList.replace('btn-primary', 'btn-secondary');
    financeAnalyticsTab.style.background = '';
    financeAnalyticsTab.style.color = '';
    financeAnalyticsTab.style.border = '';
  };
  const showAnalytics = () => {
    document.getElementById('financeReport').style.display = 'none';
    document.getElementById('financeAnalytics').style.display = 'block';
    financeAnalyticsTab.classList.replace('btn-secondary', 'btn-primary');
    financeAnalyticsTab.style.background = 'var(--primary)';
    financeAnalyticsTab.style.color = 'white';
    financeAnalyticsTab.style.border = 'none';
    financeReportTab.classList.replace('btn-primary', 'btn-secondary');
    financeReportTab.style.background = '';
    financeReportTab.style.color = '';
    financeReportTab.style.border = '';
  };

  financeReportTab.addEventListener('click', showPayroll);
  financeAnalyticsTab.addEventListener('click', showAnalytics);
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
    case 'restore-project':
      e.preventDefault();
      restoreProject(parseInt(target.dataset.id, 10));
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
    case 'toggle-paid':
      if (target.checked) {
        if (!confirm('Отправить проект в архив? Он исчезнет из выплат и активных проектов.')) {
          target.checked = false;
          return;
        }
        archiveProject(parseInt(target.dataset.id, 10));
      }
      break;
    case 'toggle-posting':
      togglePostingBonus(parseInt(target.dataset.id, 10), target.checked);
      break;
  }
}

async function togglePostingBonus(projectId, enabled) {
  const project = (state.projects || []).find(p => p.id === projectId);
  if (!project) return;
  const result = await api.put(`/projects/${projectId}`, { regular_posting_bonus: enabled ? 1 : 0 });
  if (!result) return;
  // Update local state
  Object.assign(project, result);
  renderFinanceReport();
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
    case 'expense':
      editExpense(id);
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
    case 'expense':
      deleteExpense(id);
      break;
  }
}

function renderSection(section) {
  state.currentSection = section;

  // Hide all sections
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  // Show selected section
  // Convert 'dashboard' to 'dashboardSection', etc.
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
    regulations: 'Регламент',
    guide: 'Гайд',
    finance: 'Финансы',
    access: 'Доступы',
    archive: 'Архив'
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
  } else if (section === 'finance') {
    renderFinance();
  } else if (section === 'access') {
    renderAccess();
  } else if (section === 'archive') {
    renderArchive();
  }
}

// Stub functions for rendering - implement later
function renderDashboard() {
  renderDashboardKPI();
  renderDashboardCharts();
}

function renderDashboardKPI() {
  const projects = state.projects || [];
  const analytics = state.analytics || [];

  // Status counts (всего/в работе/на паузе/готово)
  document.getElementById('statTotal').textContent = projects.length;
  document.getElementById('statActive').textContent = projects.filter(p => p.stage === 'В работе').length;
  document.getElementById('statPause').textContent = projects.filter(p => p.stage === 'На паузе').length;
  document.getElementById('statDone').textContent = projects.filter(p => p.stage === 'Готово').length;

  // Aggregate analytics totals (sum across all projects)
  const totals = analytics.reduce((acc, a) => ({
    views: acc.views + (parseInt(a.views, 10) || 0),
    subs: acc.subs + (parseInt(a.subs, 10) || 0),
    interactions: acc.interactions + (parseInt(a.interactions, 10) || 0),
    sales: acc.sales + (parseInt(a.sales, 10) || 0)
  }), { views: 0, subs: 0, interactions: 0, sales: 0 });

  document.getElementById('statViews').textContent = totals.views.toLocaleString('ru-RU');
  document.getElementById('statSubs').textContent = totals.subs.toLocaleString('ru-RU');
  document.getElementById('statInteractions').textContent = totals.interactions.toLocaleString('ru-RU');
  document.getElementById('statSales').textContent = totals.sales.toLocaleString('ru-RU');

  // Plan execution
  const totalPlan = projects.reduce((s, p) => s + (parseInt(p.plan_reels, 10) || 0), 0);
  const totalDone = projects.reduce((s, p) => s + (parseInt(p.done_reels, 10) || 0), 0);
  const overallPct = totalPlan > 0 ? Math.round((totalDone / totalPlan) * 100) : 0;

  document.getElementById('statDoneReels').textContent = totalDone.toLocaleString('ru-RU');
  document.getElementById('statPlanReels').textContent = totalPlan.toLocaleString('ru-RU');
  document.getElementById('statProgress').textContent = overallPct + '%';

  // Top project by % of plan execution
  const withProgress = projects
    .filter(p => (parseInt(p.plan_reels, 10) || 0) > 0)
    .map(p => ({
      name: p.name,
      pct: Math.round(((parseInt(p.done_reels, 10) || 0) / p.plan_reels) * 100)
    }))
    .sort((a, b) => b.pct - a.pct);
  document.getElementById('statTopProject').textContent = withProgress[0]
    ? `${withProgress[0].name} — ${withProgress[0].pct}%`
    : '—';
}

function renderDashboardCharts() {
  const projects = state.projects || [];

  // Chart 1: By stages (doughnut)
  const ctxStages = document.getElementById('chartStages');
  if (ctxStages && chartStages) chartStages.destroy();

  const stages = ['В работе', 'На паузе', 'Готово', 'Проблемный', 'Отказ'];
  const stageCount = Object.fromEntries(stages.map(s => [s, 0]));
  projects.forEach(p => {
    if (stageCount.hasOwnProperty(p.stage)) stageCount[p.stage]++;
  });

  if (ctxStages) {
    chartStages = new Chart(ctxStages, {
      type: 'doughnut',
      data: {
        labels: stages,
        datasets: [{
          data: stages.map(s => stageCount[s]),
          backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#dc2626', '#6b7280']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // Chart 2: Top-5 projects by progress (% of plan)
  const ctxCompare = document.getElementById('chartCompare');
  if (ctxCompare && chartCompare) chartCompare.destroy();

  const top5 = projects
    .filter(p => p.stage === 'В работе' && (parseInt(p.plan_reels, 10) || 0) > 0)
    .map(p => ({
      name: p.name,
      plan: parseInt(p.plan_reels, 10) || 0,
      done: parseInt(p.done_reels, 10) || 0,
      pct: Math.round(((parseInt(p.done_reels, 10) || 0) / p.plan_reels) * 100)
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  if (ctxCompare) {
    chartCompare = new Chart(ctxCompare, {
      type: 'bar',
      data: {
        labels: top5.map(p => p.name),
        datasets: [
          { label: 'План', data: top5.map(p => p.plan), backgroundColor: '#94a3b8' },
          { label: 'Сделано', data: top5.map(p => p.done), backgroundColor: '#10b981' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }

  // Chart 3: Project distribution by employee (bar)
  const ctxEmp = document.getElementById('chartByEmployee');
  if (ctxEmp && chartByEmployee) chartByEmployee.destroy();

  const byEmployee = new Map();
  projects.forEach(p => {
    const name = p.responsible_name || '—';
    byEmployee.set(name, (byEmployee.get(name) || 0) + 1);
  });
  const employeeRows = Array.from(byEmployee.entries())
    .sort((a, b) => b[1] - a[1]);

  if (ctxEmp) {
    chartByEmployee = new Chart(ctxEmp, {
      type: 'bar',
      data: {
        labels: employeeRows.map(r => r[0]),
        datasets: [{
          label: 'Проектов',
          data: employeeRows.map(r => r[1]),
          backgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }
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
        <td>${a.sales || 0}</td>
        <td>${escapeHtml(a.period)}</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="analytics" data-id="${a.id}">✏️</button>
          ${state.isAdmin() ? `<button class="btn-sm btn-danger" data-action="delete" data-type="analytics" data-id="${a.id}">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  });

  renderAnalyticsCharts(analytics);
}

function renderAnalyticsCharts(analytics) {
  // Aggregate by project_name (multiple analytics rows per project are summed)
  const byProject = new Map();
  analytics.forEach(a => {
    const key = a.project_name || '—';
    const cur = byProject.get(key) || { views: 0, interactions: 0 };
    cur.views += parseInt(a.views, 10) || 0;
    cur.interactions += parseInt(a.interactions, 10) || 0;
    byProject.set(key, cur);
  });

  const allRows = Array.from(byProject.entries()).map(([name, v]) => ({ name, ...v }));
  const topViews = allRows.filter(r => r.views > 0).sort((a, b) => b.views - a.views).slice(0, 10);
  const topInter = allRows.filter(r => r.interactions > 0).sort((a, b) => b.interactions - a.interactions).slice(0, 10);

  const viewsCtx = document.getElementById('chartAnalyticsViews');
  const interCtx = document.getElementById('chartAnalyticsInteractions');

  if (chartViews) { chartViews.destroy(); chartViews = null; }
  if (chartInteractions) { chartInteractions.destroy(); chartInteractions = null; }

  if (viewsCtx && topViews.length) {
    chartViews = new Chart(viewsCtx, {
      type: 'bar',
      data: {
        labels: topViews.map(r => r.name),
        datasets: [{
          label: 'Просмотры',
          data: topViews.map(r => r.views),
          backgroundColor: '#2563EB'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }

  if (interCtx && topInter.length) {
    chartInteractions = new Chart(interCtx, {
      type: 'bar',
      data: {
        labels: topInter.map(r => r.name),
        datasets: [{
          label: 'Взаимодействия',
          data: topInter.map(r => r.interactions),
          backgroundColor: '#10B981'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }
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
          ${state.isAdmin() ? `
            <button class="btn-sm" data-action="edit" data-type="task" data-id="${task.id}">✏️</button>
            <button class="btn-sm btn-danger" data-action="delete" data-type="task" data-id="${task.id}">🗑️</button>
          ` : ''}
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

function showReportTab(which) {
  const form = document.getElementById('newReportForm');
  const table = document.getElementById('allReportsTable');
  const newTab = document.getElementById('newReportTab');
  const allTab = document.getElementById('allReportsTab');
  if (!form || !table || !newTab || !allTab) return;

  const activate = (btn) => {
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
    btn.style.background = 'var(--primary)';
    btn.style.color = 'white';
    btn.style.border = 'none';
  };
  const deactivate = (btn) => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    btn.style.background = '';
    btn.style.color = '';
    btn.style.border = '';
  };

  if (which === 'new') {
    form.style.display = 'block';
    table.style.display = 'none';
    activate(newTab);
    deactivate(allTab);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const projectSelect = document.getElementById('reportProject');
    if (projectSelect) {
      projectSelect.onchange = updateReportReelsHint;
      updateReportReelsHint();
      projectSelect.focus();
    }
  } else {
    form.style.display = 'none';
    table.style.display = 'block';
    activate(allTab);
    deactivate(newTab);
  }
}

function updateReportReelsHint() {
  const projectId = parseInt(document.getElementById('reportProject').value, 10) || null;
  const input = document.getElementById('reportReelsPublished');
  const hint = document.getElementById('reportReelsHint');
  if (!input || !hint) return;

  if (!projectId) {
    input.removeAttribute('max');
    hint.textContent = '';
    return;
  }
  const project = (state.projects || []).find(p => p.id === projectId);
  if (!project || !project.plan_reels) {
    input.removeAttribute('max');
    hint.textContent = '';
    return;
  }
  const remaining = Math.max(0, (project.plan_reels || 0) - (project.done_reels || 0));
  input.max = remaining;
  hint.textContent = `План ${project.plan_reels}, уже сделано ${project.done_reels || 0}, осталось: ${remaining}`;
  hint.style.color = remaining === 0 ? 'var(--danger, #dc2626)' : 'var(--gray)';
}

async function submitReport() {
  const projectId = parseInt(document.getElementById('reportProject').value, 10) || null;
  if (!projectId) {
    showToast('Выберите проект для отчёта', 'error');
    return;
  }

  const project = state.projects.find(p => p.id === projectId);
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
    reels_published: reelsPublished,
    platforms,
    comment,
    screenshot_data: screenshotData
  };

  const result = await api.post('/reports', data);
  if (!result) return;

  state.reports = (await api.get('/reports')) || [];
  // Project's done_reels changes whenever a report is submitted — refresh projects
  state.projects = (await api.get('/projects')) || [];
  renderReports();
  showToast('Отчёт отправлен', 'success');

  document.getElementById('reportProject').value = '';
  document.getElementById('reportReelsPublished').value = 0;
  document.querySelectorAll('.reportPlatform:checked').forEach(input => input.checked = false);
  document.getElementById('reportComment').value = '';
  document.getElementById('reportScreenshot').value = '';
  document.getElementById('screenshotPreview').innerHTML = '';

  showReportTab('all');
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
  renderFinanceReport();
  renderFinanceAnalytics();
}

function renderArchive() {
  if (!state.isAdmin()) return;
  const tbody = document.getElementById('archiveTable');
  if (!tbody) return;

  const rows = state.archivedProjects || [];
  tbody.innerHTML = '';

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">В архиве пока пусто. Проекты попадают сюда, когда вы ставите галочку «Выплачено» в финансах.</td></tr>';
    return;
  }

  rows.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.stage || '')}</td>
        <td>${escapeHtml(p.responsible_name || '')}</td>
        <td>${(p.plan_reels || 0)} / ${(p.done_reels || 0)}</td>
        <td>${escapeHtml(formatDate(p.archived_at) || '—')}</td>
        <td>
          <button class="btn-sm" data-action="restore-project" data-id="${p.id}">↩️ Восстановить</button>
        </td>
      </tr>
    `;
  });
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
  populateDropdown('projectPlatform', ['ВКонтакте', 'VK Клипы', 'TikTok', 'YouTube']);
}

function openTaskModal() {
  state.editingId = null;
  document.getElementById('taskForm').reset();
  openModal('taskModal');
  populateDropdown('taskProject', state.projects || []);
  document.getElementById('taskResponsible').value = '';

  const projectSelect = document.getElementById('taskProject');
  projectSelect.onchange = () => {
    const projId = parseInt(projectSelect.value) || null;
    const proj = (state.projects || []).find(p => p.id === projId);
    document.getElementById('taskResponsible').value = proj?.responsible_name || '';
  };
}

function openAnalyticsModal() {
  state.editingId = null;
  document.getElementById('analyticsForm').reset();
  openModal('analyticsModal');
  populateDropdown('analyticsProject', state.projects || []);
  populateDropdown('analyticsResponsible', state.users || []);

  const projectSelect = document.getElementById('analyticsProject');
  const responsibleSelect = document.getElementById('analyticsResponsible');

  projectSelect.onchange = () => {
    const pid = parseInt(projectSelect.value) || null;
    const project = (state.projects || []).find(p => p.id === pid);
    if (project && project.responsible_id) {
      const owner = (state.users || []).find(u => u.id === project.responsible_id);
      if (owner) {
        populateDropdown('analyticsResponsible', [owner]);
        responsibleSelect.value = owner.id;
        return;
      }
    }
    populateDropdown('analyticsResponsible', state.users || []);
  };

  responsibleSelect.onchange = () => {
    const uid = parseInt(responsibleSelect.value) || null;
    const prevProjectId = projectSelect.value;
    if (uid) {
      const owned = (state.projects || []).filter(p => p.responsible_id === uid);
      populateDropdown('analyticsProject', owned);
      if (owned.some(p => String(p.id) === String(prevProjectId))) {
        projectSelect.value = prevProjectId;
      }
    } else {
      populateDropdown('analyticsProject', state.projects || []);
      if (prevProjectId) projectSelect.value = prevProjectId;
    }
  };
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

function openExpenseModal() {
  state.editingId = null;
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseAmount').value = 0;
  openModal('expenseModal');
}

async function saveExpense(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('expenseName').value.trim(),
    amount: parseInt(document.getElementById('expenseAmount').value, 10) || 0
  };
  if (!data.name) {
    showToast('Введите название статьи', 'error');
    return;
  }
  const id = state.editingId;
  const result = id
    ? await api.put(`/expenses/${id}`, data)
    : await api.post('/expenses', data);
  if (!result) return;

  closeModal('expenseModal');
  state.editingId = null;
  state.expenses = (await api.get('/expenses')) || [];
  renderFinanceReport();
  showToast(id ? 'Статья обновлена' : 'Статья добавлена', 'success');
}

function editExpense(id) {
  const item = (state.expenses || []).find(e => e.id === id);
  if (!item) return;
  openExpenseModal();
  state.editingId = id;
  document.getElementById('expenseName').value = item.name || '';
  document.getElementById('expenseAmount').value = item.amount || 0;
}

async function deleteExpense(id) {
  const result = await api.delete(`/expenses/${id}`);
  if (result === null) return;
  state.expenses = state.expenses.filter(e => e.id !== id);
  renderFinanceReport();
  showToast('Статья удалена', 'success');
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

  const data = {
    project_id: projectId,
    task_name: document.getElementById('taskName').value.trim(),
    start_date: document.getElementById('taskStartDate').value,
    end_date: document.getElementById('taskEndDate').value,
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
  document.getElementById('taskResponsible').value = task.responsible_name || '';
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
    sales: parseInt(document.getElementById('analyticsSales').value) || 0,
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
  document.getElementById('analyticsSales').value = a.sales ?? 0;
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


// ---- Constants from Регламент ----
const PAYROLL = {
  BASE_SALARY: 4000,     // 100% выполнения плана
  BONUS_AMOUNT: 1000,    // одна премия
  VIEWS_THRESHOLD: 500000,
  SUBS_THRESHOLD: 2000,
  SALES_THRESHOLD: 200
};

// Aggregate analytics totals for a single project
function getProjectAnalyticsTotals(projectId) {
  const rows = (state.analytics || []).filter(a => a.project_id === projectId);
  return rows.reduce((acc, a) => ({
    views: acc.views + (parseInt(a.views, 10) || 0),
    subs: acc.subs + (parseInt(a.subs, 10) || 0),
    sales: acc.sales + (parseInt(a.sales, 10) || 0)
  }), { views: 0, subs: 0, sales: 0 });
}

// Calculate salary + bonus for a single project. Only Готово / Отказ project payments are non-zero.
function calculateProjectPayout(project) {
  const plan = parseInt(project.plan_reels, 10) || 80;
  const done = parseInt(project.done_reels, 10) || 0;

  let salary = 0;
  if (project.stage === 'Готово') {
    salary = PAYROLL.BASE_SALARY;
  } else if (project.stage === 'Отказ') {
    const halfPay = Math.round(PAYROLL.BASE_SALARY / 2);
    const actualPay = Math.round(done * PAYROLL.BASE_SALARY / plan);
    // 50% if done ≥ 50% of plan, else actual (linear)
    salary = (done >= plan / 2) ? halfPay : actualPay;
  }

  // Four independent bonuses, +1000 ₽ each
  const totals = getProjectAnalyticsTotals(project.id);
  const bonuses = {
    regularPosting: !!project.regular_posting_bonus,
    views: totals.views >= PAYROLL.VIEWS_THRESHOLD,
    subs: totals.subs >= PAYROLL.SUBS_THRESHOLD,
    sales: totals.sales >= PAYROLL.SALES_THRESHOLD
  };
  const bonusCount = Object.values(bonuses).filter(Boolean).length;
  const bonus = bonusCount * PAYROLL.BONUS_AMOUNT;

  return { salary, bonus, total: salary + bonus, bonuses, totals, plan, done };
}

function getPayablesByEmployee() {
  // Group payable projects (Готово / Отказ) by responsible_name
  const payable = (state.projects || []).filter(p => p.stage === 'Готово' || p.stage === 'Отказ');
  const groups = new Map();
  payable.forEach(p => {
    const key = p.responsible_name || 'Без ответственного';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });
  return groups;
}

// Archive a paid project via API. The checkbox is the trigger.
async function archiveProject(projectId) {
  const result = await api.post(`/projects/${projectId}/archive`);
  if (!result) return;
  // Refresh state: project moves from active to archived list
  state.projects = state.projects.filter(p => p.id !== projectId);
  state.archivedProjects = state.archivedProjects || [];
  state.archivedProjects.unshift(result);
  renderFinanceReport();
  showToast('Проект отправлен в архив', 'success');
}

async function restoreProject(projectId) {
  const result = await api.post(`/projects/${projectId}/restore`);
  if (!result) return;
  state.archivedProjects = (state.archivedProjects || []).filter(p => p.id !== projectId);
  state.projects.unshift(result);
  renderArchive();
  showToast('Проект восстановлен', 'success');
}

function getTotalExpenses() {
  const fp = state.financeParams || {};
  const other = parseInt(fp.other_expenses ?? fp.otherExpenses ?? 0, 10);
  const tools = (state.expenses || []).reduce((s, e) => s + (parseInt(e.amount, 10) || 0), 0);
  return other + tools;
}

function renderFinanceReport() {
  const tbody = document.getElementById('financePayrollTable');
  if (!tbody) return;

  tbody.innerHTML = '';

  const groups = getPayablesByEmployee();
  const cellOk = (active) => active
    ? `<td style="text-align: center; color: var(--success); font-weight: 600;">+1 000</td>`
    : `<td style="text-align: center; color: var(--gray);">—</td>`;

  if (groups.size === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--gray);">Нет проектов в статусе «Готово» или «Отказ» для расчёта выплат.</td></tr>';
  } else {
    let totalBase = 0;
    let totalBonus = 0;

    Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru')).forEach(([name, projects]) => {
      let empSalary = 0;
      let empBonus = 0;

      projects.forEach((project, idx) => {
        const { salary, bonus, total, bonuses, totals, plan, done } = calculateProjectPayout(project);
        empSalary += salary;
        empBonus += bonus;

        tbody.innerHTML += `
          <tr>
            <td title="Отметить выплаченным → проект уйдёт в архив"><input type="checkbox" data-action="toggle-paid" data-id="${project.id}"></td>
            <td>${idx === 0 ? `<strong>${escapeHtml(name)}</strong>` : ''}</td>
            <td>${escapeHtml(project.name)}</td>
            <td>${escapeHtml(project.stage)}</td>
            <td>${plan} / ${done}</td>
            <td>${salary.toLocaleString('ru-RU')} ₽</td>
            <td style="text-align: center;">
              <input type="checkbox" data-action="toggle-posting" data-id="${project.id}" ${bonuses.regularPosting ? 'checked' : ''}>
            </td>
            ${cellOk(bonuses.views)}
            ${cellOk(bonuses.subs)}
            ${cellOk(bonuses.sales)}
            <td><strong>${total.toLocaleString('ru-RU')} ₽</strong></td>
          </tr>
        `;
      });

      tbody.innerHTML += `
        <tr style="background: #FEF3C7; font-weight: 600;">
          <td></td>
          <td colspan="4" style="text-align: right;">Итого ${escapeHtml(name)}: оклад ${empSalary.toLocaleString('ru-RU')} ₽ + премии ${empBonus.toLocaleString('ru-RU')} ₽</td>
          <td>${empSalary.toLocaleString('ru-RU')} ₽</td>
          <td colspan="4" style="text-align: right;">${empBonus.toLocaleString('ru-RU')} ₽</td>
          <td>${(empSalary + empBonus).toLocaleString('ru-RU')} ₽</td>
        </tr>
      `;

      totalBase += empSalary;
      totalBonus += empBonus;
    });

    tbody.innerHTML += `
      <tr style="background: #D1FAE5; font-weight: 700;">
        <td></td>
        <td colspan="4" style="text-align: right;">ВСЕГО: оклад ${totalBase.toLocaleString('ru-RU')} ₽ + премии ${totalBonus.toLocaleString('ru-RU')} ₽</td>
        <td>${totalBase.toLocaleString('ru-RU')} ₽</td>
        <td colspan="4" style="text-align: right;">${totalBonus.toLocaleString('ru-RU')} ₽</td>
        <td>${(totalBase + totalBonus).toLocaleString('ru-RU')} ₽</td>
      </tr>
    `;

    document.getElementById('totalBaseSalary').textContent = totalBase.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('totalBonusSalary').textContent = totalBonus.toLocaleString('ru-RU') + ' ₽';
    const totalExpenses = getTotalExpenses();
    document.getElementById('totalExpenses').textContent = totalExpenses.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('totalPayout').textContent = (totalBase + totalBonus + totalExpenses).toLocaleString('ru-RU') + ' ₽';
  }

  renderExpensesTable();
}

function renderExpensesTable() {
  const tbody = document.getElementById('financeExpensesTable');
  if (!tbody) return;

  const rows = state.expenses || [];
  tbody.innerHTML = '';
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--gray);">Нет статей расходов. Добавьте через «+ Добавить статью».</td></tr>';
    return;
  }

  rows.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(e.name)}</td>
        <td>${(parseInt(e.amount, 10) || 0).toLocaleString('ru-RU')} ₽</td>
        <td>
          <button class="btn-sm" data-action="edit" data-type="expense" data-id="${e.id}">✏️</button>
          <button class="btn-sm btn-danger" data-action="delete" data-type="expense" data-id="${e.id}">🗑️</button>
        </td>
      </tr>
    `;
  });
}

function renderFinanceAnalytics() {
  // Aggregate from payable projects (Готово / Отказ)
  const groups = getPayablesByEmployee();
  let payroll = 0;
  let bonus = 0;
  const employeeViews = new Map();
  groups.forEach((projects, name) => {
    projects.forEach(project => {
      const p = calculateProjectPayout(project);
      payroll += p.salary;
      bonus += p.bonus;
      employeeViews.set(name, (employeeViews.get(name) || 0) + p.totals.views);
    });
  });

  const totalExpenses = getTotalExpenses();
  const totalPayout = payroll + bonus + totalExpenses;
  const totalViews = (state.analytics || []).reduce((s, a) => s + (parseInt(a.views, 10) || 0), 0);

  const totalViewsEl = document.getElementById('totalViewsAll');
  const totalEmployeesEl = document.getElementById('totalEmployeesAll');
  const totalBonusRuleEl = document.getElementById('totalBonusRule');
  const totalPayoutAllEl = document.getElementById('totalPayoutAll');

  if (totalViewsEl) totalViewsEl.textContent = totalViews.toLocaleString('ru-RU');
  if (totalEmployeesEl) totalEmployeesEl.textContent = (state.employees || []).length;
  if (totalBonusRuleEl) totalBonusRuleEl.textContent = `4 премии × ${PAYROLL.BONUS_AMOUNT} ₽ за проект`;
  if (totalPayoutAllEl) totalPayoutAllEl.textContent = totalPayout.toLocaleString('ru-RU') + '₽';

  renderFinanceCharts(payroll, bonus, totalExpenses, employeeViews);
}

function renderFinanceCharts(payroll, bonus, expenses, employeeViews) {
  const chartPayrollCtx = document.getElementById('chartPayroll');
  const chartViewsCtx = document.getElementById('chartViews');

  if (window.financeChartPayroll) window.financeChartPayroll.destroy();
  if (window.financeChartViews) window.financeChartViews.destroy();

  if (chartPayrollCtx) {
    window.financeChartPayroll = new Chart(chartPayrollCtx, {
      type: 'doughnut',
      data: {
        labels: ['Оклады', 'Премии', 'Расходы'],
        datasets: [{
          data: [payroll, bonus, expenses],
          backgroundColor: ['#2563EB', '#10B981', '#EF4444'],
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  const topEmployees = Array.from(employeeViews.entries())
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  if (chartViewsCtx) {
    window.financeChartViews = new Chart(chartViewsCtx, {
      type: 'bar',
      data: {
        labels: topEmployees.map(item => item.name),
        datasets: [{
          label: 'Просмотры (по оплаченным проектам)',
          data: topEmployees.map(item => item.views),
          backgroundColor: '#2563EB'
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
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
