// Global application state
const state = {
  currentUser: null,
  currentUserId: null,
  userRole: null,
  userEmail: null,

  // Data arrays
  projects: [],
  tasks: [],
  employees: [],
  analytics: [],
  reports: [],
  access: [],
  users: [],
  dailyReels: [],

  // Finance
  financeParams: {},

  // UI state
  currentSection: 'dashboard',
  editingId: null,

  setUser(user, token) {
    this.currentUser = user.name;
    this.currentUserId = user.id || null;
    this.userEmail = user.email;
    this.userRole = user.role;
    api.setToken(token);
  },

  logout() {
    this.currentUser = null;
    this.currentUserId = null;
    this.userRole = null;
    this.userEmail = null;
    api.setToken(null);
    this.projects = [];
    this.tasks = [];
    this.employees = [];
    this.analytics = [];
    this.reports = [];
    this.access = [];
    this.dailyReels = [];
  },

  isAdmin() {
    return this.userRole === 'admin';
  }
};
