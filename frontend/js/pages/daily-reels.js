// Daily Reels - Reel Counter (Ежедневный счётчик рилсов)

async function renderDailyReels() {
  const section = document.getElementById('dailyReelsSection');
  if (!section) {
    console.warn('❌ dailyReelsSection not found');
    return;
  }

  if (state.isAdmin()) {
    renderAdminDashboard(section);
  } else {
    renderEmployeeDashboard(section);
  }
}

async function renderAdminDashboard(section) {
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
            <h4 style="margin: 0 0 5px 0; color: #1F2937;">${escapeHtml(emp.name)}</h4>
            <p style="margin: 0; color: var(--gray); font-size: 13px;">${escapeHtml(emp.email)}</p>
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
  try {
    const [summary, dailyReels] = await Promise.all([
      api.get(`/daily-reels/summary/${state.currentUserId}`),
      api.get('/daily-reels')
    ]);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = new Date(year, now.getMonth()).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric'
    });
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (new Date(year, now.getMonth(), 1).getDay() + 6) % 7;

    const reelsByDate = dailyReels.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});

    const postedDays = Object.keys(reelsByDate).length;
    const todayEntries = reelsByDate[today] || [];
    const todayPosted = todayEntries.reduce((sum, item) => sum + (parseInt(item.reel_count, 10) || 0), 0);

    const calendarCells = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      calendarCells.push('<td></td>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entries = reelsByDate[dateKey] || [];
      const hasData = entries.length > 0;
      const isTodayDay = dateKey === today;
      const cellColor = hasData ? '#ECFDF5' : '#F8FAFC';
      const borderColor = hasData ? '#10B981' : '#E2E8F0';
      const content = hasData
        ? entries.map(entry => `${escapeHtml(entry.project_name)}: ${escapeHtml(entry.reel_count)}`).join('<br>')
        : '<span style="color:#94A3B8;">Нет</span>';

      calendarCells.push(`
        <td style="padding: 8px; vertical-align: top;">
          <div style="background: ${cellColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 10px; min-height: 100px;${isTodayDay ? ' box-shadow: 0 0 0 2px #2563eb;' : ''}">
            <div style="font-weight: 700; margin-bottom: 8px; color: ${isTodayDay ? '#1d4ed8' : '#111827'};">
              ${day}${isTodayDay ? ' •' : ''}
            </div>
            <div style="font-size: 12px; line-height: 1.4; color: #334155;">${content}</div>
          </div>
        </td>
      `);
    }

    while (calendarCells.length % 7 !== 0) {
      calendarCells.push('<td></td>');
    }

    let rows = '';
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows += `<tr>${calendarCells.slice(i, i + 7).join('')}</tr>`;
    }

    let html = `
      <div style="padding: 20px; display: grid; gap: 20px;">
        <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
          <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin: 0 0 8px 0;">Мой прогресс</h2>
              <p style="color: var(--gray); margin: 0;">Месяц: ${monthName}</p>
            </div>
            <div style="font-size: 14px; color: ${todayPosted > 0 ? '#16a34a' : '#ef4444'}; font-weight: 700;">
              Сегодня: ${todayPosted > 0 ? `да, ${todayPosted} рилс` : 'нет публикаций'}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 24px;">
            <div style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 14px; padding: 18px;">
              <div style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">Всего рилсов</div>
              <div style="font-size: 28px; font-weight: 700;">${summary.totalReels}</div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 14px; padding: 18px;">
              <div style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">Дней с публикацией</div>
              <div style="font-size: 28px; font-weight: 700;">${postedDays}/${daysInMonth}</div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 14px; padding: 18px;">
              <div style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">Осталось до нормы</div>
              <div style="font-size: 28px; font-weight: 700;">${summary.remaining}</div>
            </div>
          </div>
        </div>

        <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px;">
            <div>
              <h3 style="margin: 0 0 8px 0;">Календарь публикаций</h3>
              <p style="color: var(--gray); margin: 0;">Показывает, в какие дни были рилсы, а в какие нет.</p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="font-size: 12px; color: var(--gray);">Норма: 80 рилсов за месяц</div>
              <button class="btn-secondary" id="toggleCalendarBtn" style="white-space: nowrap;">Показать/скрыть месяц</button>
            </div>
          </div>
          <div id="calendarWrapper" style="overflow-x: auto; display: block;">
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
              <thead>
                <tr>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Пн</th>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Вт</th>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Ср</th>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Чт</th>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Пт</th>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Сб</th>
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: var(--gray);">Вс</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
            <h3 style="margin: 0 0 16px 0;">По проектам</h3>
            <div style="display: grid; gap: 12px;">
    `;

    for (const project of summary.summary) {
      html += `
              <div style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                  <div style="font-weight: 700;">${escapeHtml(project.name)}</div>
                  <div style="font-size: 12px; color: var(--gray);">${escapeHtml(project.platform)}</div>
                </div>
                <div style="text-align: right; min-width: 70px;">
                  <div style="font-size: 20px; font-weight: 700;">${project.total_reels}</div>
                  <div style="font-size: 12px; color: var(--gray);">за месяц</div>
                </div>
              </div>
      `;
    }

    html += `
            </div>
          </div>

          <div style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
            <h3 style="margin: 0 0 16px 0;">Быстрая запись</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <select id="todayProject" style="flex: 1; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;">
                  <option value="">Выберите проект</option>
                  ${summary.summary.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
                </select>
                <button class="btn-primary" id="todayAddBtn">+1</button>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" id="todayCount" min="1" value="3" style="width: 72px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;">
                <button class="btn-primary" id="todayAddBatchBtn">Добавить</button>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <input type="date" id="pastDate" value="${today}" style="flex: 1; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;">
                <select id="pastProject" style="flex: 1; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;">
                  <option value="">Выберите проект</option>
                  ${summary.summary.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
                </select>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" id="pastCount" min="1" value="1" style="width: 72px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;">
                <button class="btn-primary" id="addPastBtn">Добавить за дату</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    section.innerHTML = html;

    document.getElementById('todayAddBtn')?.addEventListener('click', async () => {
      const projectId = document.getElementById('todayProject').value;
      if (!projectId) {
        showToast('Выберите проект', 'error');
        return;
      }
      await addReelsForDate(projectId, today, 1, section);
    });

    document.getElementById('todayAddBatchBtn')?.addEventListener('click', async () => {
      const projectId = document.getElementById('todayProject').value;
      const count = parseInt(document.getElementById('todayCount').value, 10) || 1;
      if (!projectId) {
        showToast('Выберите проект', 'error');
        return;
      }
      await addReelsForDate(projectId, today, count, section);
    });

    document.getElementById('toggleCalendarBtn')?.addEventListener('click', () => {
      const wrapper = document.getElementById('calendarWrapper');
      if (!wrapper) return;
      wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
    });

    const addPastBtn = document.getElementById('addPastBtn');
    if (addPastBtn) {
      addPastBtn.addEventListener('click', async () => {
        const date = document.getElementById('pastDate').value;
        const projectId = document.getElementById('pastProject').value;
        const count = parseInt(document.getElementById('pastCount').value, 10) || 1;
        if (!date || !projectId) {
          showToast('⚠️ Выберите дату и проект', 'error');
          return;
        }
        await addReelsForDate(projectId, date, count, section);
      });
    }
  } catch (error) {
    console.error('Error loading summary:', error);
    section.innerHTML = '<p style="padding: 20px; color: var(--danger);">Ошибка загрузки прогресса</p>';
  }
}

async function addReelsForDate(projectId, date, count, section) {
  try {
    await api.post(`/daily-reels/add/${projectId}/${date}`, { count });
    showToast(`✅ Добавлено ${count} рилс`, 'success');
    renderEmployeeDashboard(section);
  } catch (error) {
    showToast('❌ Ошибка', 'error');
  }
}

async function openAdminEditModal(userId, userData) {
  try {
    const summary = await api.get(`/daily-reels/summary/${userId}`);
    const today = new Date().toISOString().split('T')[0];

    let html = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;" id="adminEditModal">
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Редактирование: ${escapeHtml(userData.name)}</h2>
            <button style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--gray);" id="closeModal">✕</button>
          </div>

          <p style="color: var(--gray); margin: 0 0 20px 0;">
            Текущий прогресс: <strong>${summary.totalReels}/80 рилсов</strong>
          </p>

          <div style="border-top: 1px solid var(--border); padding-top: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px;">По проектам на сегодня (${today}):</h3>
            <div style="display: grid; gap: 12px; margin-bottom: 20px;">
    `;

    for (const project of summary.summary) {
      html += `
        <div style="
          background: #F9FAFB;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <h4 style="margin: 0; font-size: 14px;">${escapeHtml(project.name)}</h4>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: var(--gray);">${escapeHtml(project.platform)}</p>
          </div>
          <div style="display: flex; gap: 5px;">
            <input type="number"
              class="admin-reel-input"
              data-user-id="${userId}"
              data-project-id="${project.id}"
              data-date="${today}"
              value="0"
              min="0"
              style="width: 60px; padding: 6px; border: 1px solid var(--border); border-radius: 4px; text-align: center;">
            <button class="btn-sm admin-save-reel" data-user-id="${userId}" data-project-id="${project.id}" data-date="${today}">
              ✓ Сохр.
            </button>
          </div>
        </div>
      `;
    }

    html += `
            </div>

            <div style="border-top: 1px solid var(--border); padding-top: 15px;">
              <h3 style="margin-top: 0; margin-bottom: 15px;">Добавить за другой день:</h3>
              <div style="display: grid; gap: 10px;">
                <input type="date" id="adminEditDate" value="${today}" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
                <select id="adminEditProject" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
                  <option value="">Выберите проект</option>
                  ${summary.summary.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
                </select>
                <input type="number" id="adminEditCount" min="1" value="1" placeholder="Кол-во рилсов" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
                <button class="btn-primary" id="adminAddReel">Добавить</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    document.body.appendChild(modalContainer);

    // Event listeners
    document.getElementById('closeModal').addEventListener('click', () => {
      modalContainer.remove();
    });

    // Save reel buttons
    document.querySelectorAll('.admin-save-reel').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const input = e.target.previousElementSibling;
        const count = parseInt(input.value) || 0;
        const projectId = e.target.dataset.projectId;
        const date = e.target.dataset.date;
        const userId = e.target.dataset.userId;

        try {
          await api.post(`/daily-reels/add/${projectId}/${date}`, { count });
          showToast('✅ Сохранено', 'success');
          // Refresh modal
          modalContainer.remove();
          renderAdminDashboard(document.getElementById('dailyReelsSection'));
        } catch (error) {
          showToast('❌ Ошибка', 'error');
        }
      });
    });

    // Add reel button
    document.getElementById('adminAddReel').addEventListener('click', async () => {
      const date = document.getElementById('adminEditDate').value;
      const projectId = document.getElementById('adminEditProject').value;
      const count = parseInt(document.getElementById('adminEditCount').value) || 1;

      if (!date || !projectId) {
        showToast('⚠️ Выберите дату и проект', 'error');
        return;
      }

      try {
        await api.post(`/daily-reels/add/${projectId}/${date}`, { count });
        showToast(`✅ Добавлено ${count} рилс`, 'success');
        modalContainer.remove();
        renderAdminDashboard(document.getElementById('dailyReelsSection'));
      } catch (error) {
        showToast('❌ Ошибка', 'error');
      }
    });

  } catch (error) {
    console.error('Error opening edit modal:', error);
    showToast('❌ Ошибка загрузки', 'error');
  }
}
