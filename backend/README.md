# WorkInsight Backend - Node.js + Express + SQLite

## Архитектура

Бэкенд разделён на:
- **server.js** - главный файл, запускает Express сервер
- **config/db.js** - инициализация SQLite БД, схема, сиджинг тестовыми данными
- **middleware/auth.js** - проверка JWT токенов и прав доступа
- **routes/** - API маршруты для каждой сущности (projects, tasks, employees, etc)

## Установка и запуск

```bash
npm install
npm start  # или: node server.js
```

Сервер запустится на `http://localhost:3000`

## Переменные окружения

```
JWT_SECRET=secret_key_12345
ADMIN_EMAIL=admin@workinsight.ru
ADMIN_PASSWORD=admin123
ENCRYPTION_KEY=32_character_key_for_aes256
NODE_ENV=development
PORT=3000
```

## API роуты

### /api/auth
- `POST /register` - регистрация
- `POST /login` - вход
- `GET /me` - информация о текущем пользователе

### /api/projects
- `GET /` - список проектов
- `POST /` - создание (только admin)
- `PUT /:id` - обновление (только admin)
- `DELETE /:id` - удаление (только admin)
- `POST /:id/assign` - назначение сотруднику (только admin)

### /api/employees
- `GET /` - список (только admin)
- `POST /` - создание (только admin)
- `PUT /:id` - обновление (только admin)
- `DELETE /:id` - удаление (только admin)

### /api/tasks, /api/analytics, /api/reports
- `GET /` - список
- `POST /` - создание
- `PUT /:id` - обновление
- `DELETE /:id` - удаление

### /api/access
- `GET /` - список (только admin, пароли расшифровываются)
- `POST /` - создание (только admin)
- `PUT /:id` - обновление (только admin)
- `DELETE /:id` - удаление (только admin)

### /api/finance
- `GET /params` - параметры финансов
- `PUT /params` - обновление (только admin)

## Безопасность

- Пароли хешируются bcryptjs
- JWT токены подписываются и проверяются на каждый запрос
- Credential пароли шифруются AES-256
- CORS ограничен до localhost
- Helmet для защиты от распространённых атак
- SQLi защита через prepared statements (better-sqlite3)

## Инициализация БД

При первом запуске:
1. Создаются все таблицы (CREATE TABLE IF NOT EXISTS)
2. Создаётся admin пользователь (email/пароль из .env)
3. Добавляются тестовые данные (35 проектов, 11 сотрудников)
4. Инициализируются параметры финансов

## Структура БД

```sql
users (id, email, name, phone, password_hash, role, city, employment, status)
projects (id, name, stage, responsible_id, responsible_name, platform, priority, plan_reels, done_reels, start_date, comment)
tasks (id, project_id, project_name, task_name, start_date, end_date, responsible_id, responsible_name, stage, comment)
analytics (id, project_id, responsible_id, ..., views, subs, interactions, period)
reports (id, user_id, project_id, date, time, reels_created, reels_published, platforms, comment, screenshot_data)
access (id, project_id, tg_link, login, password_encrypted, note)
finance_params (id, base_salary, base_reels, other_expenses)
```

## Фильтрация по ролям

- **Admin**: видит всё, может редактировать всё
- **Employee**: видит только назначенные ему проекты, может редактировать свои записи
