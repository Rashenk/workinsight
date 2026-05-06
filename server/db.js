const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'workinsight.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'employee',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            stage TEXT NOT NULL,
            responsible TEXT NOT NULL,
            platform TEXT NOT NULL,
            priority INTEGER DEFAULT 5,
            plan_reels INTEGER DEFAULT 0,
            done_reels INTEGER DEFAULT 0,
            start_date TEXT,
            comment TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project TEXT NOT NULL,
            task TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            responsible TEXT NOT NULL,
            stage TEXT NOT NULL,
            comment TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT,
            city TEXT,
            employment TEXT,
            projects TEXT,
            status TEXT DEFAULT 'Активен',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project TEXT NOT NULL,
            responsible TEXT NOT NULL,
            start_date TEXT,
            views INTEGER DEFAULT 0,
            subs INTEGER DEFAULT 0,
            total_subs INTEGER DEFAULT 0,
            interactions INTEGER DEFAULT 0,
            period TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS access_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project TEXT NOT NULL,
            tg_link TEXT,
            login TEXT,
            password_encrypted TEXT,
            note TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_date TEXT NOT NULL,
            report_time TEXT NOT NULL,
            user_name TEXT NOT NULL,
            project TEXT NOT NULL,
            reels_created INTEGER DEFAULT 0,
            reels_published INTEGER DEFAULT 0,
            platforms TEXT,
            comment TEXT,
            screenshot TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS daily_checklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT NOT NULL,
            project TEXT NOT NULL,
            check_date TEXT NOT NULL,
            published INTEGER DEFAULT 0,
            notified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(employee_name, project, check_date)
        );
    `);

    console.log('✓ Database initialized');
}

module.exports = { db, initDatabase };
