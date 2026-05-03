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

        // Restore first option
        if (firstOptionHTML) {
            select.appendChild(firstOptionHTML.cloneNode(true));
        }

        // Add unique options
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

