// Daily Reels - Reel Counter (Ежедневный счётчик рилсов)

async function renderDailyReels() {
  console.log('🚀 renderDailyReels called!');

  const section = document.getElementById('dailyReelsSection');
  if (!section) {
    console.error('❌ dailyReelsSection not found');
    return;
  }

  if (state.isAdmin()) {
    renderAdminDashboard(section);
  } else {
    renderEmployeeDashboard(section);
  }
}

async function renderAdminDashboard(section) {
  console.log('👨‍💼 Rendering admin dashboard');

  try {
    const dashboard = await api.get('/daily-reels/admin/dashboard');

    const now = new Date();
    const monthName = new Date(now.getFullYear(), now.getMonth()).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric'
    });

    let html = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0;">Прогресс команды</h2>
          <p style="color: var(--gray); margin: 0;">Месяц: ${monthName} • Норма: 80 рилсов</p>
        </div>

        <div style="display: grid; gap: 15px;">
    `;

    for (const emp of dashboard) {
      const color = emp.percentage >= 100 ? '#10b981' : emp.percentage >= 80 ? '#3b82f6' : emp.percentage >= 50 ? '#f59e0b' : '#ef4444';

      html += `
        <div style="
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 15px;
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 15px;
          align-items: center;
        ">
          <div>
            <h4 style="margin: 0 0 5px 0; color: #1F2937;">${emp.name}</h4>
            <p style="margin: 0; color: var(--gray); font-size: 13px;">${emp.email}</p>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 28px; font-weight: bold; color: ${color};">
              ${emp.total_reels}
            </div>
            <div style="font-size: 12px; color: var(--gray);">
              из 80
            </div>
            <div style="
              margin-top: 8px;
              background: #E5E7EB;
              height: 6px;
              width: 200px;
              border-radius: 3px;
              overflow: hidden;
            ">
              <div style="
                background: ${color};
                height: 100%;
                width: ${Math.min(100, emp.percentage)}%;
                transition: width 0.3s;
              "></div>
            </div>
          </div>

          <button class="btn-sm" data-admin-edit-user="${emp.id}" style="white-space: nowrap;">
            ✏️ Редактировать
          </button>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    section.innerHTML = html;

    // Add event listeners
    document.querySelectorAll('[data-admin-edit-user]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.adminEditUser;
        openAdminEditModal(userId, dashboard.find(e => e.id == userId));
      });
    });

  } catch (error) {
    console.error('Error loading dashboard:', error);
    section.innerHTML = '<p style="padding: 20px; color: var(--danger);">Ошибка загрузки дашборда</p>';
  }
}

async function renderEmployeeDashboard(section) {
  console.log('👤 Rendering employee dashboard');

  try {
    const summary = await api.get(`/daily-reels/summary/${state.currentUser?.id}`);
    const today = new Date().toISOString().split('T')[0];

    const now = new Date();
    const monthName = new Date(now.getFullYear(), now.getMonth()).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric'
    });

    let html = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0;">Мой прогресс</h2>
          <p style="color: var(--gray); margin: 0;">Месяц: ${monthName}</p>
        </div>

        <!-- OVERALL PROGRESS -->
        <div style="
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          color: white;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          text-align: center;
        ">
          <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">
            ${summary.totalReels}
          </div>
          <div style="font-size: 18px; margin-bottom: 15px;">из 80 рилсов</div>
          <div style="
            background: rgba(255,255,255,0.2);
            height: 10px;
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 15px;
          ">
            <div style="
              background: white;
              height: 100%;
              width: ${Math.min(100, (summary.totalReels / 80) * 100)}%;
              transition: width 0.3s;
            "></div>
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            ${summary.remaining > 0 ? `Осталось: ${summary.remaining} рилсов` : '✅ Норма выполнена!'}
          </div>
        </div>

        <!-- PROJECTS LIST -->
        <h3 style="margin-top: 0; margin-bottom: 15px;">По проектам:</h3>
        <div style="display: grid; gap: 12px;">
    `;

    for (const project of summary.summary) {
      html += `
        <div style="
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <h4 style="margin: 0; color: #1F2937;">${project.name}</h4>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: var(--gray);">${project.platform}</p>
          </div>
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
          ">
            <div style="
              font-size: 20px;
              font-weight: bold;
              min-width: 40px;
              text-align: right;
            ">
              ${project.total_reels}
            </div>
            <div style="display: flex; gap: 5px;">
              <button class="btn-sm" data-add-reel="${project.id}" data-date="${today}">
                +1
              </button>
              <button class="btn-sm" data-add-reel="${project.id}" data-date="${today}" data-count="3">
                +3
              </button>
            </div>
          </div>
        </div>
      `;
    }

    html += `
        </div>

        <!-- PAST DAYS OPTION -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border);">
          <h3 style="margin-top: 0;">Добавить рилс за прошлый день:</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="date" id="pastDate" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px;">
            <select id="pastProject" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px;">
              <option value="">Выберите проект</option>
              ${summary.summary.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
            <input type="number" id="pastCount" min="1" value="1" style="width: 60px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px;">
            <button class="btn-primary" id="addPastBtn">Добавить</button>
          </div>
        </div>
      </div>
    `;

    section.innerHTML = html;

    // Event listeners for +1, +3 buttons
    document.querySelectorAll('[data-add-reel]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const projectId = e.target.dataset.addReel;
        const date = e.target.dataset.date;
        const count = parseInt(e.target.dataset.count) || 1;

        try {
          await api.post(`/daily-reels/add/${projectId}/${date}`, { count });
          showToast(`✅ Добавлено ${count} рилс!`, 'success');
          renderEmployeeDashboard(section);
        } catch (error) {
          showToast('❌ Ошибка', 'error');
        }
      });
    });

    // Event listener for past days button
    const addPastBtn = document.getElementById('addPastBtn');
    if (addPastBtn) {
      addPastBtn.addEventListener('click', async () => {
        const date = document.getElementById('pastDate').value;
        const projectId = document.getElementById('pastProject').value;
        const count = parseInt(document.getElementById('pastCount').value) || 1;

        if (!date || !projectId) {
          showToast('⚠️ Выберите дату и проект', 'error');
          return;
        }

        try {
          await api.post(`/daily-reels/add/${projectId}/${date}`, { count });
          showToast(`✅ Добавлено ${count} рилс за ${date}!`, 'success');
          renderEmployeeDashboard(section);
        } catch (error) {
          showToast('❌ Ошибка', 'error');
        }
      });
    }

  } catch (error) {
    console.error('Error loading summary:', error);
    section.innerHTML = '<p style="padding: 20px; color: var(--danger);">Ошибка загрузки прогресса</p>';
  }
}

async function openAdminEditModal(userId, userData) {
  console.log('Opening admin edit modal for user', userId);
  // TODO: Create a modal for editing specific user's reels
  alert(`Редактирование для ${userData.name} - будет реализовано`);
}
