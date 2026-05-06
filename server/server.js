require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');
const { initBot } = require('./bot/telegram');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/access', require('./routes/access'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

async function start() {
    await initDatabase();
    initBot();
    app.listen(PORT, () => {
        console.log(`\n✓ WorkInsight запущен: http://localhost:${PORT}`);
        console.log('✓ Нажми Ctrl+C чтобы остановить\n');
    });
}

start().catch(err => {
    console.error('Ошибка запуска:', err);
    process.exit(1);
});
