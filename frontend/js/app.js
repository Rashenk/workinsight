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
  const navItems = document.querySelectorAll('.nav-item');
  console.log('🔗 Found nav items:', navItems.length);
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      console.log('🖱️ Nav item clicked, section:', section);
      if (section) {
        console.log('📄 Calling renderSection with:', section);
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
  console.log('📊 renderProjects called');
  const tbody = document.getElementById('projectsTable');
  if (!tbody) {
    console.error('❌ projectsTable not found');
    return;
  }
  tbody.innerHTML = '';

  let projects = state.projects;
  console.log('📋 Total projects:', projects.length);
  console.log('👤 Is admin:', state.isAdmin());

  if (!state.isAdmin()) {
    projects = projects.filter(p => p.responsible_id === state.currentUser?.id);
  }

  console.log('📋 Filtered projects:', projects.length);

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

function openEmployeeModal() {
  state.editingId = null;
  document.getElementById('employeeForm').reset();
  openModal('employeeModal');
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

  closeModal('employeeModal');
  state.editingId = null;
  showToast(id ? 'Сотрудник обновлён' : 'Сотрудник добавлен', 'success');
  state.employees = (await api.get('/employees')) || [];
  state.users = state.employees;
  renderEmployees();
}

function editEmployee(id) {
  const employee = state.employees.find(e => e.id === id);
  if (!employee) {
    showToast('Сотрудник не найден', 'error');
    return;
  }
  openEmployeeModal();
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
