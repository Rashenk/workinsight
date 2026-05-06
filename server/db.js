const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'workinsight.db');

// Thin synchronous wrapper around sql.js to mimic better-sqlite3 API
// so routes don't need to change
class SyncDB {
    constructor(sqlDb) {
        this._db = sqlDb;
    }

    pragma(str) {
        this._db.run(`PRAGMA ${str}`);
    }

    exec(sql) {
        this._db.run(sql);
        this._persist();
    }

    prepare(sql) {
        const self = this;
        return {
            run(...args) {
                const stmt = self._db.prepare(sql);
                stmt.run(args);
                stmt.free();
                const lastId = self._db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] ?? null;
                self._persist();
                return { lastInsertRowid: lastId, changes: self._db.getRowsModified() };
            },
            get(...args) {
                const stmt = self._db.prepare(sql);
                stmt.bind(args);
                const row = stmt.step() ? stmt.getAsObject() : undefined;
                stmt.free();
                return row;
            },
            all(...args) {
                const stmt = self._db.prepare(sql);
                stmt.bind(args);
                const rows = [];
                while (stmt.step()) rows.push(stmt.getAsObject());
                stmt.free();
                return rows;
            }
        };
    }

    _persist() {
        const data = this._db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    }
}

let db = null;

async function initDatabase() {
    const SQL = await initSqlJs();

    let sqlDb;
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(fileBuffer);
    } else {
        sqlDb = new SQL.Database();
    }

    db = new SyncDB(sqlDb);
    module.exports.db._real = db; // wire up the lazy proxy

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
    return db;
}

function getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
}

// Lazy proxy — routes can do `const { db } = require('../db')` safely
// because db is initialized before any request arrives
const db = new Proxy({}, {
    get(_, prop) {
        if (!db._real) throw new Error('DB not initialized');
        const val = db._real[prop];
        return typeof val === 'function' ? val.bind(db._real) : val;
    }
});

module.exports = { initDatabase, getDb, db };
