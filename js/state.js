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
