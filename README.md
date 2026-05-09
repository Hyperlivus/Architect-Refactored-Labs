# KPI Chat API

REST API для чат-застосунку, побудований на NestJS із Clean Architecture.

## Технології

- **NestJS** — фреймворк
- **TypeORM** + **PostgreSQL** — база даних
- **JWT** — автентифікація
- **Nodemailer** — надсилання email (OTP)
- **class-validator** — валідація DTO

## Швидкий старт

### 1. Встановити залежності

```bash
npm install
```

### 2. Налаштувати середовище

Скопіювати файл прикладу та заповнити значення:

```bash
cp env/.env.example env/.env
```

Відкрити `env/.env` і вказати:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=kpi_chat

JWT_SECRET=your_jwt_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your@gmail.com
```

### 3. Запустити PostgreSQL

Переконайтесь що PostgreSQL запущений і база даних існує:

```sql
CREATE DATABASE kpi_chat;
```

> Схема бази даних синхронізується автоматично при запуску (`synchronize: true`).

### 4. Запустити сервер

```bash
# Режим розробки (з авто-перезавантаженням)
npm run start:dev

# Продакшн збірка
npm run build
npm run start:prod
```

Сервер буде доступний за адресою: `http://localhost:3000`

---

## Тестування

```bash
# Всі unit-тести
npm run test

# Конкретний файл
npx jest src/user/user.service.spec.ts

# Тести за назвою
npx jest --testNamePattern="should register"

# E2E тести (потребують запущеної БД)
npm run test:e2e

# Покриття коду
npm run test:cov
```

---

## API

### Автентифікація

| Метод | Endpoint | Опис |
|-------|----------|------|
| POST | `/auth/register` | Реєстрація (надсилає OTP на email) |
| POST | `/auth/login` | Вхід (повертає JWT токен) |
| POST | `/auth/verify-email` | Підтвердження email через OTP |
| POST | `/auth/resend-otp` | Повторне надсилання OTP |

### Користувач

| Метод | Endpoint | Опис | Auth |
|-------|----------|------|------|
| GET | `/user/me` | Власний профіль | JWT |

### Чати

| Метод | Endpoint | Опис | Auth |
|-------|----------|------|------|
| POST | `/chat` | Створити чат | JWT |
| GET | `/chat` | Список чатів (пагінація) | JWT |
| GET | `/chat/:chatId` | Деталі чату | Member |
| PATCH | `/chat/:chatId` | Оновити чат | Member + EDIT_CHAT_INFO |

### Учасники

| Метод | Endpoint | Опис | Auth |
|-------|----------|------|------|
| POST | `/chat/:chatId/members` | Додати учасника | Member + ADD_MEMBERS |
| DELETE | `/chat/:chatId/members/leave` | Вийти з чату | Member |
| PATCH | `/chat/:chatId/members/:id/ban` | Заблокувати | Member + BAN_MEMBERS |
| PATCH | `/chat/:chatId/members/:id/unban` | Розблокувати | Member + BAN_MEMBERS |
| PATCH | `/chat/:chatId/members/:id/permissions` | Змінити права | Member + EDIT_PERMISSIONS |
| PATCH | `/chat/:chatId/members/:id/role` | Змінити роль | Member + EDIT_PERMISSIONS |

### Повідомлення

| Метод | Endpoint | Опис | Auth |
|-------|----------|------|------|
| POST | `/chat/:chatId/messages` | Надіслати повідомлення | Member + SEND_MESSAGES |
| GET | `/chat/:chatId/messages` | Список повідомлень (пагінація) | Member |
| DELETE | `/chat/:chatId/messages/:id` | Видалити повідомлення | Member (власне або DELETE_MESSAGES) |

**Пагінація**: `?page=1&limit=20`

**Авторизація**: `Authorization: Bearer <token>`

---

## Архітектура

Проєкт побудований за принципами **Clean Architecture**. Детальний аналіз — у файлі [ANALYSIS.md](./ANALYSIS.md).

Варіанти використання — у файлі [USE-CASE.md](./USE-CASE.md).

```
src/
  shared/          # Спільні утиліти (DomainError, Guards, Decorators)
  mail/            # Модуль надсилання email (DynamicModule)
  user/            # Користувачі
  auth/            # Автентифікація та OTP
  chat/            # Чат-кімнати
  member/          # Членство та права
  message/         # Повідомлення
```

Кожен модуль містить:
- `*.entity.ts` — TypeORM-сутність
- `*.factory.ts` — валідація бізнес-інваріантів (чистий TypeScript)
- `*.errors.ts` — доменні помилки
- `*.service.ts` — бізнес-логіка та оркестрація
- `*.controller.ts` — HTTP-шар
- `*.dto.ts` — валідація вхідних даних
