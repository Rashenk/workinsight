const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '../database.sqlite');
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

      CREATE TABLE IF NOT EXISTS daily_reels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        responsible_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        reel_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(project_id, responsible_id, date)
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
    `;

    for (const stmt of schema.split(';')) {
      if (stmt.trim()) {
        await runAsync(stmt);
      }
    }

    // Migrate older databases: add finance bonus columns if absent
    const financeColumns = await allAsync('PRAGMA table_info(finance_params)');
    if (!financeColumns.some(c => c.name === 'bonus_threshold')) {
      await runAsync('ALTER TABLE finance_params ADD COLUMN bonus_threshold INTEGER DEFAULT 500000');
    }
    if (!financeColumns.some(c => c.name === 'bonus_amount')) {
      await runAsync('ALTER TABLE finance_params ADD COLUMN bonus_amount INTEGER DEFAULT 1000');
    }

    // Check if admin exists
    const admin = await getAsync('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);

    if (admin.count === 0) {
      await seedDatabase();
    }
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function seedDatabase() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@workinsight.ru';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = bcrypt.hashSync(adminPassword, 10);

    // Create admin user
    await runAsync(`
      INSERT INTO users (email, name, phone, password_hash, role, city, employment, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminEmail, 'Administrator', '', adminHash, 'admin', 'System', 'Work', 'Активен']);

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
      { name: 'Риелтор Грозный Альбина', responsible: 'Александр' },
      { name: 'Диски', responsible: 'Дима Кичигин' },
      { name: 'Товары оптом из Китая', responsible: 'Дима Кичигин' },
      { name: 'Покер Москва', responsible: 'Валера' },
      { name: 'Авто в аренду Москва', responsible: 'Артем' },
      { name: 'Марафон по религии', responsible: 'Дима Кичигин' },
      { name: 'Консалтинг ресторанов', responsible: 'Дима Кичигин' },
      { name: 'Роллы, пицца, суши', responsible: 'Дима Кичигин' },
      { name: 'Квизы', responsible: 'Дима Кичигин' },
      { name: 'Тренер', responsible: '-------' },
      { name: 'Покер Питер', responsible: 'Александр Рубцов' },
      { name: 'Клубника в шоколаде', responsible: 'Александр Костя' },
      { name: 'Аквапарк Москва', responsible: '-------' },
      { name: 'Баер из Китая', responsible: 'Константин' },
      { name: 'Психолог', responsible: 'Елена' },
      { name: 'Цветочный Минск', responsible: 'Паша Рубцов' },
      { name: 'Студия рисования', responsible: 'Паша Рубцов' },
      { name: 'Цветы', responsible: 'Александр' },
      { name: 'Пойзон', responsible: 'Александр' },
      { name: 'Риелтор Калининград', responsible: 'Дима Кичигин' }
    ];

    for (const proj of projects) {
      const responsibleId = userMap[proj.responsible] || null;
      // Skip projects whose responsible employee could not be resolved
      // (responsible_id is NOT NULL — inserting null would abort seeding)
      if (!responsibleId) continue;
      const doneReels = Math.floor(Math.random() * 81);
      await runAsync(`
        INSERT INTO projects (name, stage, responsible_id, responsible_name, platform, priority, plan_reels, done_reels)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [proj.name, 'В работе', responsibleId, proj.responsible, 'Instagram', 5, 80, doneReels]);
    }

    // Finish Finance params
    await runAsync(`
      INSERT OR REPLACE INTO finance_params (id, base_salary, base_reels, other_expenses, bonus_threshold, bonus_amount)
      VALUES (1, 4000, 80, 0, 500000, 1000)
    `);

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
