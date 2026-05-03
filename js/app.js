// ======================== APPLICATION INITIALIZATION ========================
function initializeApp() {
    loadDataFromLocalStorage();
    if (!localStorage.getItem('workinsight_initialized')) {
        loadInitialData();
        localStorage.setItem('workinsight_initialized', 'true');
    }
    setupEventListeners();
    renderDashboard();
}

// Инициализация при загрузке страницы
window.onload = initializeApp;
