const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '../../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Promisify db methods
const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

function encryptPassword(password) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedData) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function initializeDatabase() {
  try {
    // Create tables
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'employee')) DEFAULT 'employee',
        city TEXT,
        employment TEXT,
        status TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        stage TEXT,
        responsible_id INTEGER NOT NULL,
        responsible_name TEXT,
        platform TEXT,
        priority INTEGER DEFAULT 5,
        plan_reels INTEGER DEFAULT 0,
        done_reels INTEGER DEFAULT 0,
        regular_posting_bonus INTEGER DEFAULT 0,
        archived INTEGER DEFAULT 0,
        archived_at TEXT,
        start_date TEXT,
        comment TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        project_name TEXT,
        task_name TEXT,
        start_date TEXT,
        end_date TEXT,
        responsible_id INTEGER,
        responsible_name TEXT,
        stage TEXT,
        comment TEXT
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        project_name TEXT,
        responsible_id INTEGER,
        responsible_name TEXT,
        start_date TEXT,
        views INTEGER DEFAULT 0,
        subs INTEGER DEFAULT 0,
        total_subs INTEGER DEFAULT 0,
        interactions INTEGER DEFAULT 0,
        sales INTEGER DEFAULT 0,
        period TEXT
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        project_id INTEGER,
        project_name TEXT,
        date TEXT,
        time TEXT,
        reels_created INTEGER DEFAULT 0,
        reels_published INTEGER DEFAULT 0,
        platforms TEXT,
        comment TEXT,
        screenshot_data TEXT
      );

      CREATE TABLE IF NOT EXISTS access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        project_name TEXT,
        tg_link TEXT,
        login TEXT,
        password_encrypted TEXT,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS finance_params (
        id INTEGER PRIMARY KEY DEFAULT 1,
        base_salary INTEGER DEFAULT 4000,
        base_reels INTEGER DEFAULT 80,
        other_expenses INTEGER DEFAULT 0,
        bonus_threshold INTEGER DEFAULT 500000,
        bonus_amount INTEGER DEFAULT 1000
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        project_id INTEGER,
        read BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;

    for (const stmt of schema.split(';')) {
      if (stmt.trim()) {
        await runAsync(stmt);
      }
    }

    // Enforce unique project names at the DB level (idempotent — won't error if duplicates already gone)
    await runAsync('CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_name_unique ON projects(name)').catch(err => {
      console.error('Could not create unique index on projects.name — duplicates exist:', err.message);
    });

    // Migrate older databases: add new bonus-tracking columns if absent
    const analyticsColumns = await allAsync('PRAGMA table_info(analytics)');
    if (!analyticsColumns.some(c => c.name === 'sales')) {
      await runAsync('ALTER TABLE analytics ADD COLUMN sales INTEGER DEFAULT 0');
    }
    const projectsColumns = await allAsync('PRAGMA table_info(projects)');
    if (!projectsColumns.some(c => c.name === 'regular_posting_bonus')) {
      await runAsync('ALTER TABLE projects ADD COLUMN regular_posting_bonus INTEGER DEFAULT 0');
    }
    if (!projectsColumns.some(c => c.name === 'archived')) {
      await runAsync('ALTER TABLE projects ADD COLUMN archived INTEGER DEFAULT 0');
    }
    if (!projectsColumns.some(c => c.name === 'archived_at')) {
      await runAsync('ALTER TABLE projects ADD COLUMN archived_at TEXT');
    }

    // Migrate older databases: add finance bonus columns if absent
    const financeColumns = await allAsync('PRAGMA table_info(finance_params)');
    if (!financeColumns.some(c => c.name === 'bonus_threshold')) {
      await runAsync('ALTER TABLE finance_params ADD COLUMN bonus_threshold INTEGER DEFAULT 500000');
    }
    if (!financeColumns.some(c => c.name === 'bonus_amount')) {
      await runAsync('ALTER TABLE finance_params ADD COLUMN bonus_amount INTEGER DEFAULT 1000');
    }

    await seedDatabase();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function seedDatabase() {
  try {
    const adminCount = await getAsync('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    if (adminCount.count === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@workinsight.ru';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminHash = bcrypt.hashSync(adminPassword, 10);

      await runAsync(`
        INSERT INTO users (email, name, phone, password_hash, role, city, employment, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [adminEmail, 'Administrator', '', adminHash, 'admin', 'System', 'Work', 'Активен']);
    }

    // Employees
    const employees = [
      { firstName: 'Александр', lastName: 'Рубцов', city: 'Новоуральск', employment: 'Учеба + работа', status: 'Активен' },
      { firstName: 'Елена', lastName: '', city: 'Новоуральск', employment: 'Работа', status: 'Активен' },
      { firstName: 'Дима', lastName: 'Кичигин', city: 'Новоуральск', employment: 'Свободен', status: 'Активен' },
      { firstName: 'Александр', lastName: '', city: 'Москва', employment: 'Учеба + работа', status: 'НЕАктивен' },
      { firstName: 'Артем', lastName: '', city: 'Екатеринбург', employment: 'Учеба + работа', status: 'Активен' },
      { firstName: 'Валера', lastName: '', city: 'Новоуральск', employment: 'Свободен', status: 'Активен' },
      { firstName: 'Виктор', lastName: 'Федосеев', city: 'Новоуральск', employment: 'Работа', status: 'НЕАктивен' },
      { firstName: 'Паша', lastName: 'Рубцов', city: 'Новоуральск', employment: 'Учеба', status: 'НЕАктивен' },
      { firstName: 'Константин', lastName: '', city: 'Новоуральск', employment: 'Учеба + работа', status: 'НЕАктивен' },
      { firstName: 'Виктория', lastName: '', city: 'Новоуральск', employment: 'Работа', status: 'НЕАктивен' },
      { firstName: 'Миша', lastName: '', city: 'Екатеринбург', employment: 'Учеба + работа', status: 'Стажер' }
    ];

    const userMap = {};
    const passwordHash = bcrypt.hashSync('password123', 10);

    for (const emp of employees) {
      const fullName = emp.firstName + (emp.lastName ? ' ' + emp.lastName : '');
      const email = emp.firstName.toLowerCase() + '@example.com';

      const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) {
        userMap[fullName] = existing.id;
        continue;
      }

      const res = await new Promise((resolve) => {
        db.run(`
          INSERT INTO users (email, name, phone, password_hash, role, city, employment, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [email, fullName, '', passwordHash, 'employee', emp.city, emp.employment, emp.status], function(err) {
          if (!err) resolve(this.lastID);
          else resolve(null);
        });
      });
      userMap[fullName] = res;
    }

    // Projects
    const projects = [
      { name: 'Производство мебели', responsible: 'Артем' },
      { name: 'Трейдинг', responsible: 'Артем' },
      { name: 'Мужской бренд одежды', responsible: 'Дима Кичигин' },
      { name: 'Картины по металлу', responsible: 'Дима Кичигин' },
      { name: 'Аппаратный массаж', responsible: 'Миша' },
      { name: 'Покер еще новый', responsible: 'Валера' },
      { name: 'Личный бренд дети', responsible: 'Елена' },
      { name: 'Ресницы', responsible: 'Елена' },
      { name: 'Обучение детей плаванию', responsible: 'Артем' },
      { name: 'Рольставни', responsible: 'Дима Кичигин' },
      { name: 'Дизайн интерьера', responsible: 'Елена' },
      { name: 'Туры в Сахалин', responsible: 'Артем' },
      { name: 'Психолог новый', responsible: 'Елена' },
      { name: 'Репетитор Английский', responsible: 'Артем' },
      { name: 'Личный бренд девочка танцы', responsible: 'Александр Рубцов' },
      { name: 'Идилия капельницы', responsible: 'Дима Кичигин' },
      { name: 'Риелтор Грозный Альбина', responsible: 'Александр Рубцов' },
      { name: 'Диски', responsible: 'Дима Кичигин' },
      { name: 'Товары оптом из Китая', responsible: 'Дима Кичигин' },
      { name: 'Покер Москва', responsible: 'Валера' },
      { name: 'Авто в аренду Москва', responsible: 'Артем' },
      { name: 'Марафон по религии', responsible: 'Дима Кичигин' },
      { name: 'Консалтинг ресторанов', responsible: 'Дима Кичигин' },
      { name: 'Роллы, пицца, суши', responsible: 'Дима Кичигин' },
      { name: 'Квизы', responsible: 'Дима Кичигин' },
      { name: 'Тренер', responsible: 'Виктор Федосеев' },
      { name: 'Покер Питер', responsible: 'Александр Рубцов' },
      { name: 'Клубника в шоколаде', responsible: 'Валера' },
      { name: 'Аквапарк Москва', responsible: 'Артем' },
      { name: 'Баер из Китая', responsible: 'Константин' },
      { name: 'Психолог', responsible: 'Елена' },
      { name: 'Цветочный Минск', responsible: 'Паша Рубцов' },
      { name: 'Студия рисования', responsible: 'Паша Рубцов' },
      { name: 'Цветы', responsible: 'Александр Рубцов' },
      { name: 'Пойзон', responsible: 'Артем' },
      { name: 'Риелтор Калининград', responsible: 'Дима Кичигин' }
    ];

    for (const proj of projects) {
      const responsibleId = userMap[proj.responsible] || null;
      if (!responsibleId) continue;
      const existing = await getAsync('SELECT id FROM projects WHERE name = ?', [proj.name]);
      if (existing) continue;
      const doneReels = Math.floor(Math.random() * 81);
      await runAsync(`
        INSERT INTO projects (name, stage, responsible_id, responsible_name, platform, priority, plan_reels, done_reels)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [proj.name, 'В работе', responsibleId, proj.responsible, 'ВКонтакте', 5, 80, doneReels]);
    }

    // Finish Finance params
    await runAsync(`
      INSERT OR REPLACE INTO finance_params (id, base_salary, base_reels, other_expenses, bonus_threshold, bonus_amount)
      VALUES (1, 4000, 80, 0, 500000, 1000)
    `);

    // Seed Analytics
    const analytics = [
      { project: 'Производство мебели', views: 45000, subs: 1200, interactions: 3400 },
      { project: 'Трейдинг', views: 78000, subs: 2100, interactions: 5600 },
      { project: 'Мужской бренд одежды', views: 32000, subs: 890, interactions: 2100 },
      { project: 'Картины по металлу', views: 18000, subs: 450, interactions: 900 },
      { project: 'Аппаратный массаж', views: 56000, subs: 1800, interactions: 4200 },
      { project: 'Покер еще новый', views: 92000, subs: 3200, interactions: 7800 },
      { project: 'Личный бренд дети', views: 41000, subs: 1500, interactions: 3100 },
      { project: 'Ресницы', views: 28000, subs: 750, interactions: 1800 },
      { project: 'Обучение детей плаванию', views: 35000, subs: 920, interactions: 2400 },
      { project: 'Рольставни', views: 22000, subs: 580, interactions: 1200 },
      { project: 'Дизайн интерьера', views: 51000, subs: 1650, interactions: 3900 },
      { project: 'Туры в Сахалин', views: 67000, subs: 2100, interactions: 5100 },
      { project: 'Психолог новый', views: 38000, subs: 1100, interactions: 2800 },
      { project: 'Репетитор Английский', views: 44000, subs: 1300, interactions: 3200 },
      { project: 'Личный бренд девочка танцы', views: 73000, subs: 2400, interactions: 6100 },
      { project: 'Идилия капельницы', views: 29000, subs: 820, interactions: 1900 },
      { project: 'Риелтор Грозный Альбина', views: 15000, subs: 380, interactions: 700 },
      { project: 'Диски', views: 58000, subs: 1900, interactions: 4500 },
      { project: 'Товары оптом из Китая', views: 82000, subs: 2800, interactions: 6700 },
      { project: 'Покер Москва', views: 95000, subs: 3400, interactions: 8200 },
      { project: 'Авто в аренду Москва', views: 37000, subs: 1050, interactions: 2700 },
      { project: 'Марафон по религии', views: 26000, subs: 680, interactions: 1500 },
      { project: 'Консалтинг ресторанов', views: 19000, subs: 520, interactions: 1100 },
      { project: 'Роллы, пицца, суши', views: 62000, subs: 2000, interactions: 4800 },
      { project: 'Квизы', views: 48000, subs: 1400, interactions: 3600 }
    ];

    const analyticsCount = await getAsync('SELECT COUNT(*) as count FROM analytics');
    if (analyticsCount.count === 0) {
      for (const a of analytics) {
        const proj = await getAsync('SELECT id, responsible_id, responsible_name FROM projects WHERE name = ?', [a.project]);
        if (proj) {
          await runAsync(`
            INSERT INTO analytics (project_id, project_name, responsible_id, responsible_name, views, subs, total_subs, interactions, period)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [proj.id, a.project, proj.responsible_id, proj.responsible_name, a.views, 150, a.subs, a.interactions, 'май 2026']);
        }
      }
    }

    // Seed Access (project credentials)
    const accessData = [
      { project: 'Производство мебели', login: 'admin_mebel', password: 'Meb3l2026!', tg: 'https://t.me/mebel_group' },
      { project: 'Трейдинг', login: 'trader_main', password: 'Tr@d3r123', tg: 'https://t.me/trading_signals' },
      { project: 'Мужской бренд одежды', login: 'mens_brand', password: 'MensBr@nd2026', tg: 'https://t.me/mens_fashion' },
      { project: 'Картины по металлу', login: 'metal_art', password: 'MetalArt!2026', tg: 'https://t.me/metal_paintings' },
      { project: 'Аппаратный массаж', login: 'massage_pro', password: 'Mass@ge2026!', tg: 'https://t.me/massage_clinic' },
      { project: 'Покер еще новый', login: 'poker_room', password: 'P0ker!2026new', tg: 'https://t.me/poker_channel' },
      { project: 'Личный бренд дети', login: 'kids_brand', password: 'KidsBr@nd123', tg: 'https://t.me/kids_content' },
      { project: 'Ресницы', login: 'lashes_studio', password: 'L@shes2026!', tg: 'https://t.me/lashes_beauty' },
      { project: 'Обучение детей плаванию', login: 'swim_class', password: 'Swim!2026class', tg: 'https://t.me/swimming_school' },
      { project: 'Рольставни', login: 'rollstavni_shop', password: 'Roll!2026st', tg: 'https://t.me/rollstavni_sales' },
      { project: 'Дизайн интерьера', login: 'interior_pro', password: 'Int3rior!2026', tg: 'https://t.me/interior_design' },
      { project: 'Туры в Сахалин', login: 'sakhalin_tour', password: 'S@khalin2026!', tg: 'https://t.me/sakhalin_tours' },
      { project: 'Психолог новый', login: 'psycho_consult', password: 'Psych!2026con', tg: 'https://t.me/psychology_help' },
      { project: 'Репетитор Английский', login: 'english_tutor', password: 'Engl!sh2026', tg: 'https://t.me/english_lessons' },
      { project: 'Личный бренд девочка танцы', login: 'dance_girl', password: 'D@nce2026girl', tg: 'https://t.me/dance_academy' },
      { project: 'Идилия капельницы', login: 'idiliya_clinic', password: 'Idil!ya2026', tg: 'https://t.me/medical_IV' }
    ];

    const accessCount = await getAsync('SELECT COUNT(*) as count FROM access');
    if (accessCount.count === 0) {
      for (const acc of accessData) {
        const proj = await getAsync('SELECT id FROM projects WHERE name = ?', [acc.project]);
        if (proj) {
          const encrypted = encryptPassword(acc.password);
          await runAsync(`
            INSERT INTO access (project_id, project_name, tg_link, login, password_encrypted, note)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [proj.id, acc.project, acc.tg, acc.login, encrypted, 'Основной доступ']);
        }
      }
    }

    // Seed Tasks (example tasks tied to existing projects)
    const tasksData = [
      { project: 'Производство мебели', task_name: 'Найти монтажера для рекламных роликов', stage: 'В работе', days_from_now: 5, comment: 'Нужен опытный монтажер с портфолио' },
      { project: 'Трейдинг', task_name: 'Сделать ежемесячный отчёт по аналитике', stage: 'В работе', days_from_now: 3, comment: 'Включить графики просмотров и подписок' },
      { project: 'Мужской бренд одежды', task_name: 'Подготовить контент-план на июнь', stage: 'Ждёт', days_from_now: 7, comment: 'Согласовать с клиентом' },
      { project: 'Аппаратный массаж', task_name: 'Снять 5 рекламных клипов', stage: 'В работе', days_from_now: 4, comment: 'Локации: кабинет + улица' },
      { project: 'Покер еще новый', task_name: 'Провести анализ конкурентов', stage: 'Готово', days_from_now: -2, comment: 'Отчёт отправлен' },
      { project: 'Личный бренд дети', task_name: 'Записать серию интервью', stage: 'Ждёт', days_from_now: 10, comment: 'Согласовать сценарий' },
      { project: 'Дизайн интерьера', task_name: 'Опубликовать кейсы за май', stage: 'В работе', days_from_now: 2, comment: '3 кейса с фото до/после' },
      { project: 'Туры в Сахалин', task_name: 'Согласовать ТЗ с клиентом', stage: 'Ждёт', days_from_now: 1, comment: 'Созвон в 14:00' },
      { project: 'Репетитор Английский', task_name: 'Написать сценарий для нового ролика', stage: 'В работе', days_from_now: 3, comment: 'Тема: 5 ошибок начинающих' },
      { project: 'Идилия капельницы', task_name: 'Обработать комментарии в постах', stage: 'Готово', days_from_now: -1, comment: 'Все ответы отправлены' },
      { project: 'Картины по металлу', task_name: 'Подготовить тайм-лапс производства', stage: 'В работе', days_from_now: 6, comment: 'Снять процесс изготовления' },
      { project: 'Ресницы', task_name: 'Сделать подборку отзывов клиентов', stage: 'Ждёт', days_from_now: 8, comment: 'Минимум 10 отзывов с фото' }
    ];

    const tasksCount = await getAsync('SELECT COUNT(*) as count FROM tasks');
    if (tasksCount.count === 0) {
      const today = new Date();
      for (const t of tasksData) {
        const proj = await getAsync('SELECT id, responsible_id, responsible_name FROM projects WHERE name = ?', [t.project]);
        if (proj) {
          const start = new Date(today);
          const end = new Date(today);
          end.setDate(end.getDate() + t.days_from_now);
          const startStr = start.toISOString().split('T')[0];
          const endStr = end.toISOString().split('T')[0];
          await runAsync(`
            INSERT INTO tasks (project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [proj.id, t.project, t.task_name, startStr, endStr, proj.responsible_id, proj.responsible_name, t.stage, t.comment]);
        }
      }
    }

    // Backfill: ensure every project with done_reels > 0 has a backing report.
    // Without this, the first user report would overwrite done_reels via recalc.
    const orphanProjects = await allAsync(`
      SELECT p.id, p.name, p.done_reels
      FROM projects p
      WHERE COALESCE(p.archived, 0) = 0
        AND p.done_reels > 0
        AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.project_id = p.id)
    `);
    for (const op of orphanProjects) {
      await runAsync(`
        INSERT INTO reports (user_id, user_name, project_id, project_name, date, time, reels_created, reels_published, platforms, comment)
        VALUES (1, 'Administrator', ?, ?, '2026-05-01', '09:00', 0, ?, 'ВКонтакте', 'Backfill: первичный учёт сделанной работы')
      `, [op.id, op.name, op.done_reels]);
    }
    if (orphanProjects.length > 0) {
      console.log(`✅ Backfilled ${orphanProjects.length} historical report(s) so done_reels matches reports`);
    }

    // Auto-promote completed 'В работе' projects to 'Готово' (one-time backfill at startup)
    const promoted = await runAsync(
      `UPDATE projects SET stage = 'Готово' WHERE stage = 'В работе' AND plan_reels > 0 AND done_reels >= plan_reels`
    );
    if (promoted && promoted.changes) {
      console.log(`✅ Auto-promoted ${promoted.changes} project(s) to 'Готово' (100% reached)`);
    }

    // Migrate legacy Instagram platform values to ВКонтакте
    const migratedProjects = await runAsync(
      `UPDATE projects SET platform = 'ВКонтакте' WHERE platform IN ('Instagram', 'Instagram+ВК')`
    );
    if (migratedProjects && migratedProjects.changes) {
      console.log(`✅ Migrated ${migratedProjects.changes} project(s) platform Instagram → ВКонтакте`);
    }
    const migratedReports = await runAsync(
      `UPDATE reports SET platforms = REPLACE(REPLACE(platforms, 'Instagram+ВК', 'ВКонтакте'), 'Instagram', 'ВКонтакте') WHERE platforms LIKE '%Instagram%'`
    );
    if (migratedReports && migratedReports.changes) {
      console.log(`✅ Migrated ${migratedReports.changes} report(s) platforms Instagram → ВКонтакте`);
    }

    // One analytics row per project. Dedupe legacy duplicates, prefer the row
    // with the most real data so user-entered numbers survive the merge.
    const dupGroups = await allAsync(`
      SELECT project_id, COUNT(*) as cnt FROM analytics
      WHERE project_id IS NOT NULL
      GROUP BY project_id HAVING cnt > 1
    `);
    for (const g of dupGroups) {
      const rows = await allAsync(
        'SELECT * FROM analytics WHERE project_id = ? ORDER BY id',
        [g.project_id]
      );
      const score = (r) => (r.views || 0) + (r.subs || 0) + (r.total_subs || 0) + (r.interactions || 0) + (r.sales || 0);
      const winner = rows.reduce((a, b) => (score(b) > score(a) ? b : a));
      const losers = rows.filter(r => r.id !== winner.id);
      for (const l of losers) {
        await runAsync('DELETE FROM analytics WHERE id = ?', [l.id]);
      }
    }
    if (dupGroups.length > 0) {
      console.log(`✅ Deduped analytics for ${dupGroups.length} project(s)`);
    }

    // Backfill: every project must have an analytics row.
    // Covers manually-added projects (UI/SQL) and any past seed gaps.
    const monthsRu = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const now = new Date();
    const period = `${monthsRu[now.getMonth()]} ${now.getFullYear()}`;
    const missing = await allAsync(`
      SELECT p.id, p.name, p.responsible_id, p.responsible_name, p.start_date
      FROM projects p
      LEFT JOIN analytics a ON a.project_id = p.id
      WHERE a.id IS NULL
    `);
    for (const p of missing) {
      await runAsync(`
        INSERT INTO analytics (project_id, project_name, responsible_id, responsible_name, start_date, views, subs, total_subs, interactions, period)
        VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)
      `, [p.id, p.name, p.responsible_id, p.responsible_name, p.start_date || '', period]);
    }
    if (missing.length > 0) {
      console.log(`✅ Backfilled analytics for ${missing.length} project(s)`);
    }

    // Populate empty analytics rows with realistic demo numbers
    // (only fills rows where all metrics are 0 — never overwrites user data)
    const emptyRows = await allAsync(`
      SELECT id FROM analytics
      WHERE COALESCE(views, 0) = 0 AND COALESCE(subs, 0) = 0
        AND COALESCE(total_subs, 0) = 0 AND COALESCE(interactions, 0) = 0
        AND COALESCE(sales, 0) = 0
    `);
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    for (const r of emptyRows) {
      const views = rand(35000, 480000);
      const subs = Math.round(views * (0.004 + Math.random() * 0.006));
      const totalSubs = subs * rand(8, 25);
      const interactions = Math.round(views * (0.0004 + Math.random() * 0.0008));
      const sales = Math.round(subs * (0.04 + Math.random() * 0.09));
      await runAsync(
        `UPDATE analytics SET views = ?, subs = ?, total_subs = ?, interactions = ?, sales = ? WHERE id = ?`,
        [views, subs, totalSubs, interactions, sales, r.id]
      );
    }
    if (emptyRows.length > 0) {
      console.log(`✅ Populated ${emptyRows.length} empty analytics row(s) with demo numbers`);
    }

    console.log('✅ Database seeded with initial data');
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
  initializeDatabase,
  encryptPassword,
  decryptPassword
};
