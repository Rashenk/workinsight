const { runAsync, getAsync, allAsync } = require('./config/db');

async function seedData() {
  console.log('🌱 Starting to seed test data...');

  try {
    // Get all users and projects for relations
    const users = await allAsync('SELECT id FROM users WHERE role = "employee" LIMIT 11');
    const projects = await allAsync('SELECT id FROM projects LIMIT 36');

    console.log(`Found ${users.length} users and ${projects.length} projects`);

    // Seed tasks
    console.log('📝 Seeding tasks...');
    const stages = ['В работе', 'Ждёт', 'Готово'];
    let taskCount = 0;

    for (let i = 0; i < Math.min(50, projects.length * 2); i++) {
      const projectId = projects[i % projects.length].id;
      const userId = users[i % users.length].id;
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const startDate = new Date(2024, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 1);

      await runAsync(
        `INSERT INTO tasks (project_id, task_name, start_date, end_date, responsible_id, stage, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [projectId, `Задача ${i + 1}`, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], userId, stage, `Комментарий к задаче ${i + 1}`]
      );
      taskCount++;
    }
    console.log(`✅ Created ${taskCount} tasks`);

    // Seed analytics
    console.log('📊 Seeding analytics...');
    let analyticsCount = 0;

    for (let i = 0; i < Math.min(40, projects.length); i++) {
      const projectId = projects[i].id;
      const userId = users[i % users.length].id;
      const startDate = new Date(2024, Math.floor(Math.random() * 5), 1);

      await runAsync(
        `INSERT INTO analytics (project_id, responsible_id, start_date, views, subs, total_subs, interactions, period)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          userId,
          startDate.toISOString().split('T')[0],
          Math.floor(Math.random() * 50000) + 1000,
          Math.floor(Math.random() * 5000) + 100,
          Math.floor(Math.random() * 100000) + 10000,
          Math.floor(Math.random() * 10000) + 500,
          'месяц'
        ]
      );
      analyticsCount++;
    }
    console.log(`✅ Created ${analyticsCount} analytics records`);

    // Seed reports
    console.log('📋 Seeding reports...');
    let reportCount = 0;

    for (let i = 0; i < Math.min(30, projects.length); i++) {
      const userId = users[i % users.length].id;
      const projectId = projects[i % projects.length].id;
      const date = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
      const time = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

      await runAsync(
        `INSERT INTO reports (user_id, project_id, date, time, reels_created, reels_published, platforms, comment, screenshot_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          projectId,
          date.toISOString().split('T')[0],
          time,
          Math.floor(Math.random() * 10) + 1,
          Math.floor(Math.random() * 10) + 1,
          'Instagram, TikTok',
          `Отчет по работе ${i + 1}`,
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        ]
      );
      reportCount++;
    }
    console.log(`✅ Created ${reportCount} reports`);

    // Seed access credentials
    console.log('🔐 Seeding access credentials...');
    let accessCount = 0;

    const platforms = ['Instagram', 'TikTok', 'YouTube', 'Pinterest'];

    for (let i = 0; i < Math.min(25, projects.length); i++) {
      const projectId = projects[i].id;
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const tgLink = `https://t.me/account_${i}`;
      const login = `user_${i}@email.com`;
      const note = `${platform} account для проекта ${i}`;

      await runAsync(
        `INSERT INTO access (project_id, tg_link, login, password_encrypted, note)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, tgLink, login, 'encrypted_password_' + i, note]
      );
      accessCount++;
    }
    console.log(`✅ Created ${accessCount} access records`);

    console.log('\n✅ ✅ ✅ Все данные успешно загружены! ✅ ✅ ✅\n');
    console.log('Статистика:');
    console.log(`  📝 Задач: ${taskCount}`);
    console.log(`  📊 Аналитики: ${analyticsCount}`);
    console.log(`  📋 Отчетов: ${reportCount}`);
    console.log(`  🔐 Доступов: ${accessCount}`);
    console.log(`  👥 Сотрудников: ${users.length}`);
    console.log(`  📁 Проектов: ${projects.length}`);

  } catch (error) {
    console.error('❌ Ошибка при заполнении данных:', error);
  }

  process.exit(0);
}

seedData();
