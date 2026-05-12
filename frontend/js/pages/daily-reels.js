// Daily Reels (Ежедневный чек-лист рилсов)

async function renderDailyReels() {
  const section = document.getElementById('dailyReelsSection');
  if (!section) return;

  // Get user's assigned projects
  let projects = state.projects;
  if (!state.isAdmin()) {
    projects = projects.filter(p => p.responsible_id === state.currentUser?.id);
  }

  if (projects.length === 0) {
    section.innerHTML = '<p style="padding: 20px;">Нет назначенных проектов</p>';
    return;
  }

  // Fetch all daily reels for current user/admin
  let allReels = [];
  try {
    allReels = await api.get('/daily-reels');
  } catch (error) {
    console.error('Error loading daily reels:', error);
    allReels = [];
  }

  // Get current date
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  let html = `
    <div style="padding: 20px;">
      <div style="margin-bottom: 20px;">
        <h3>Ежедневный чек-лист рилсов</h3>
        <p style="color: var(--gray); margin-top: 5px;">Сегодня: ${formatDate(today)}</p>
      </div>

      <div style="display: grid; gap: 15px;">
  `;

  for (const project of projects) {
    const projectId = project.id;
    const todayReel = allReels.find(r => r.project_id === projectId && r.date === today);
    const completed = todayReel?.completed || false;

      html += `
        <div style="
          background: #F9FAFB;
          border: 2px solid ${completed ? 'var(--success)' : 'var(--border)'};
          border-radius: 8px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s;
        " data-project-id="${projectId}">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: #1F2937;">${project.name}</h4>
            <p style="margin: 0; color: var(--gray); font-size: 13px;">
              Платформа: ${project.platform} • Ответственный: ${project.responsible_name || 'Не назначен'}
            </p>
          </div>
          <label style="
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-size: 16px;
          ">
            <input type="checkbox"
              class="daily-reel-checkbox"
              data-project-id="${projectId}"
              ${completed ? 'checked' : ''}
              style="width: 24px; height: 24px; cursor: pointer;">
            <span style="color: var(--gray);">Рилс выложен</span>
          </label>
        </div>
      `;
  }

  html += `
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border);">
        <h3>Статистика месяца</h3>
        <div id="monthlyStats" style="display: grid; gap: 15px; margin-top: 15px;"></div>
      </div>
    </div>
  `;

  section.innerHTML = html;

  // Add event listeners to checkboxes
  document.querySelectorAll('.daily-reel-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const projectId = e.target.dataset.projectId;
      try {
        await api.post(`/daily-reels/toggle/${projectId}`);
        e.target.checked = !e.target.checked; // Toggle visual state
        showToast('✅ Статус обновлен', 'success');
        // Refresh the display
        renderDailyReels();
      } catch (error) {
        console.error('Error toggling reel:', error);
        showToast('❌ Ошибка обновления', 'error');
        e.target.checked = !e.target.checked; // Revert
      }
    });
  });

  // Load monthly stats
  loadMonthlyStats(projects, allReels);
}

function loadMonthlyStats(projects, allReels) {
  const statsContainer = document.getElementById('monthlyStats');
  if (!statsContainer) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  let statsHtml = '';

  for (const project of projects) {
    // Filter reels for this project in current month
    const projectReels = allReels.filter(r =>
      r.project_id === project.id &&
      r.date &&
      r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
    );

    const completed = projectReels.filter(r => r.completed).length;
    const total = daysInMonth;
    const percentage = Math.round((completed / total) * 100);

    statsHtml += `
        <div style="
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 15px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0;">${project.name}</h4>
            <span style="
              font-size: 20px;
              font-weight: bold;
              color: ${percentage >= 80 ? 'var(--success)' : percentage >= 50 ? '#F59E0B' : 'var(--danger)'};
            ">${percentage}%</span>
          </div>
          <div style="
            background: #E5E7EB;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
          ">
            <div style="
              background: ${percentage >= 80 ? 'var(--success)' : percentage >= 50 ? '#F59E0B' : 'var(--danger)'};
              height: 100%;
              width: ${percentage}%;
              transition: width 0.3s;
            "></div>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: var(--gray);">
            Выложено: ${completed}/${total} рилсов в месяц
          </p>
        </div>
      `;
  }

  statsContainer.innerHTML = statsHtml;
}
