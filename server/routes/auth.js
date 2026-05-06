const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
    const { email, name, phone, password } = req.body;

    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)')
        .run(email, name, phone || '', hash, 'employee');

    res.json({ ok: true, message: 'Аккаунт создан' });
});

// Login
router.post('/login', (req, res) => {
    const { input, password, role } = req.body;

    if (!input) return res.status(400).json({ error: 'Введите email или имя' });

    // Admin login
    if (role === 'admin') {
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Неверный пароль администратора' });
        }
        const token = jwt.sign(
            { name: input, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.json({ ok: true, token, name: input, role: 'admin' });
    }

    // Employee login — by email or name
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(input, input);

    if (!user) {
        // Guest login (no password required)
        const token = jwt.sign(
            { name: input, role: 'employee' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.json({ ok: true, token, name: input, role: 'employee' });
    }

    if (!bcrypt.compareSync(password || '', user.password_hash)) {
        return res.status(401).json({ error: 'Неверный пароль' });
    }

    const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    res.json({ ok: true, token, name: user.name, role: user.role });
});

module.exports = router;
