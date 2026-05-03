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
        // Filter projects based on user role
        let projects = state.projects;
        if (state.userRole === 'employee') {
            projects = state.projects.filter(p => p.responsible === state.currentUser);
        }

        // Stats
        const total = projects.length;
        const active = projects.filter(p => p.stage === 'В работе').length;
        const paused = projects.filter(p => p.stage === 'На паузе').length;
        const done = projects.filter(p => p.stage === 'Готово').length;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statActive').textContent = active;
        document.getElementById('statPause').textContent = paused;
        document.getElementById('statDone').textContent = done;

        // Table
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

        // Charts
        setTimeout(() => {
            renderDashboardCharts(projects);
        }, 300);
    }

    function renderDashboardCharts(projects) {
        if (!projects) projects = state.projects;

        // Chart 1: Compare
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

        // Chart 2: Stages
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

        // Filter projects based on user role
        let projects = state.projects;
        if (state.userRole === 'employee') {
            projects = state.projects.filter(p => p.responsible === state.currentUser);
        }

        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--gray);">Проектов нет. Создайте первый проект!</td></tr>';
            return;
        }

        // Populate responsible filter
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

    function applyProjectFilters() {
        const stage = document.getElementById('projectFilterStage').value;
        const responsible = document.getElementById('projectFilterResponsible').value;
        const tbody = document.getElementById('projectsTable');
        const rows = tbody.getElementsByTagName('tr');

        let visibleCount = 0;

        Array.from(rows).forEach(row => {
            let show = true;

            if (stage && !row.textContent.includes(stage)) {
                show = false;
            }

            if (responsible && !row.textContent.includes(responsible)) {
                show = false;
            }

            row.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        if (visibleCount === 0) {
            const emptyRow = document.createElement('tr');
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
        // Chart 1: Views
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

        // Chart 2: Interactions
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

    function applyTaskFilters() {
        const stage = document.getElementById('taskFilterStage').value;
        const tbody = document.getElementById('tasksTable');
        const rows = tbody.getElementsByTagName('tr');

        let visibleCount = 0;

        Array.from(rows).forEach(row => {
            let show = true;

            if (stage && !row.textContent.includes(stage)) {
                show = false;
            }

            row.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        if (visibleCount === 0) {
            const emptyRow = document.createElement('tr');
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
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">Отчётов нет. Создайте первый отчёт!</td></tr>';
            return;
        }

        // Populate filters
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

    function applyReportFilters() {
        const dateFrom = document.getElementById('reportFilterDateFrom').value;
        const dateTo = document.getElementById('reportFilterDateTo').value;
        const employee = document.getElementById('reportFilterEmployee').value;
        const project = document.getElementById('reportFilterProject').value;
        const tbody = document.getElementById('reportsListTable');
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
            emptyRow.innerHTML = '<td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">Отчётов не найдено</td>';
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

