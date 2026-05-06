const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { db } = require('../db');

let bot = null;

function initBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || token.includes('сюда_вставь')) {
        console.log('⚠ Telegram bot не настроен — пропускаем');
        return;
    }

    bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, `👋 WorkInsight Bot активен!\nВаш Chat ID: <code>${msg.chat.id}</code>`, { parse_mode: 'HTML' });
    });

    bot.onText(/\/status/, (msg) => {
        const today = new Date().toISOString().split('T')[0];
        const checklist = db.prepare(`
            SELECT dc.employee_name, dc.project, dc.published
            FROM daily_checklist dc
            WHERE dc.check_date = ?
        `).all(today);

        const activeProjects = db.prepare("SELECT * FROM projects WHERE stage = 'В работе'").all();

        let text = `📊 *Статус на сегодня (${today})*\n\n`;
        activeProjects.forEach(p => {
            const entry = checklist.find(c => c.project === p.name && c.employee_name === p.responsible);
            const icon = entry?.published ? '✅' : '❌';
            text += `${icon} ${p.name} — ${p.responsible}\n`;
        });

        bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/top/, (msg) => {
        const projects = db.prepare('SELECT * FROM projects').all();
        const employees = db.prepare("SELECT * FROM employees WHERE status = 'Активен'").all();

        const leaderboard = employees.map(emp => {
            const name = (emp.first_name + ' ' + (emp.last_name || '')).trim();
            const empProjects = projects.filter(p => p.responsible === name);
            const plan = empProjects.reduce((s, p) => s + p.plan_reels, 0);
            const done = empProjects.reduce((s, p) => s + p.done_reels, 0);
            const pct = plan > 0 ? Math.round((done / plan) * 100) : 0;
            return { name, done, plan, pct };
        }).sort((a, b) => b.pct - a.pct);

        let text = '🏆 *Топ сотрудников*\n\n';
        leaderboard.forEach((e, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            text += `${medal} ${e.name} — ${e.done}/${e.plan} (${e.pct}%)\n`;
        });

        bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
    });

    // Daily reminder at 20:00 — check who hasn't published today
    cron.schedule('0 20 * * *', () => {
        sendDailyReminder(chatId);
    }, { timezone: 'Europe/Moscow' });

    // Final check at 21:30 — report who missed
    cron.schedule('30 21 * * *', () => {
        sendMissedReport(chatId);
    }, { timezone: 'Europe/Moscow' });

    console.log('✓ Telegram bot started (rashenka_tracker_bot)');
    return bot;
}

function sendDailyReminder(chatId) {
    if (!bot || !chatId) return;

    const today = new Date().toISOString().split('T')[0];
    const activeProjects = db.prepare("SELECT * FROM projects WHERE stage = 'В работе'").all();

    const notPublished = activeProjects.filter(p => {
        const entry = db.prepare(
            'SELECT * FROM daily_checklist WHERE employee_name = ? AND project = ? AND check_date = ?'
        ).get(p.responsible, p.name, today);
        return !entry || !entry.published;
    });

    if (notPublished.length === 0) {
        bot.sendMessage(chatId, '✅ Все ролики на сегодня выложены! Отличная работа команда 💪');
        return;
    }

    let text = '⏰ *Напоминание — до 21:00 нужно выложить:*\n\n';
    notPublished.forEach(p => {
        text += `❌ ${p.name} — @${p.responsible}\n`;
    });
    text += '\nЗайди в WorkInsight и отметь выполненное ✅';

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

function sendMissedReport(chatId) {
    if (!bot || !chatId) return;

    const today = new Date().toISOString().split('T')[0];
    const activeProjects = db.prepare("SELECT * FROM projects WHERE stage = 'В работе'").all();

    const missed = activeProjects.filter(p => {
        const entry = db.prepare(
            'SELECT * FROM daily_checklist WHERE employee_name = ? AND project = ? AND check_date = ?'
        ).get(p.responsible, p.name, today);
        return !entry || !entry.published;
    });

    if (missed.length === 0) {
        bot.sendMessage(chatId, '🎉 Итог дня: все проекты выложены!\n\n👏 Молодцы!');
        return;
    }

    let text = `🔴 *Итог дня ${today} — НЕ выложено:*\n\n`;
    missed.forEach(p => {
        text += `• ${p.name} (${p.responsible})\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

    // Mark as notified
    missed.forEach(p => {
        db.prepare(`
            INSERT INTO daily_checklist (employee_name, project, check_date, published, notified)
            VALUES (?, ?, ?, 0, 1)
            ON CONFLICT(employee_name, project, check_date) DO UPDATE SET notified = 1
        `).run(p.responsible, p.name, today);
    });
}

function sendToGroup(message) {
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (bot && chatId) {
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
}

module.exports = { initBot, sendToGroup, sendDailyReminder };
