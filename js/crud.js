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

        // Reset form
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
    function editProject(id) {
        const project = state.projects.find(p => p.id === id);
        document.getElementById('projectForm').dataset.id = id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectStage').value = project.stage;
        document.getElementById('projectResponsible').value = project.responsible;
        document.getElementById('projectPlatform').value = project.platform;
        document.getElementById('projectPriority').value = project.priority;
        document.getElementById('projectPlanReels').value = project.planReels;
        document.getElementById('projectDoneReels').value = project.doneReels;
        document.getElementById('projectStartDate').value = project.startDate;
        document.getElementById('projectComment').value = project.comment;
        populateDropdown('projectResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
        document.getElementById('projectModal').classList.add('active');
    }

    function editTask(id) {
        const task = state.tasks.find(t => t.id === id);
        document.getElementById('taskForm').dataset.id = id;
        document.getElementById('taskName').value = task.task;
        document.getElementById('taskProject').value = task.project;
        document.getElementById('taskStartDate').value = task.startDate;
        document.getElementById('taskEndDate').value = task.endDate;
        document.getElementById('taskResponsible').value = task.responsible;
        document.getElementById('taskStage').value = task.stage;
        document.getElementById('taskComment').value = task.comment;
        populateDropdown('taskProject', state.projects.map(p => p.name));
        populateDropdown('taskResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
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
        document.getElementById('analyticsProject').value = a.project;
        document.getElementById('analyticsResponsible').value = a.responsible;
        document.getElementById('analyticsStartDate').value = a.startDate;
        document.getElementById('analyticsViews').value = a.views;
        document.getElementById('analyticsSubs').value = a.subs;
        document.getElementById('analyticsTotalSubs').value = a.totalSubs;
        document.getElementById('analyticsInteractions').value = a.interactions;
        document.getElementById('analyticsPeriod').value = a.period;
        populateDropdown('analyticsProject', state.projects.map(p => p.name));
        populateDropdown('analyticsResponsible', state.employees.map(e => e.firstName + ' ' + e.lastName));
        document.getElementById('analyticsModal').classList.add('active');
    }

    function editAccess(idx) {
        const a = state.access[idx];
        document.getElementById('accessForm').dataset.idx = idx;
        document.getElementById('accessProject').value = a.project;
        document.getElementById('accessTgLink').value = a.tgLink;
        document.getElementById('accessLogin').value = a.login;
        document.getElementById('accessPassword').value = a.password;
        document.getElementById('accessNote').value = a.note;
        populateDropdown('accessProject', state.projects.map(p => p.name));
        document.getElementById('accessModal').classList.add('active');
    }

