# CHOPBOT — Discord-бот рекрутинга

Бот для приёма заявок на роли через **кнопки и модалки**, одобрения рекрутерами с **ролевым** доступом, автоматической выдачи **нескольких ролей**, смены ника, записи в **аудит** и **ежедневной статистики** по одобрениям.

## Документы для регламента проекта

| Файл | Назначение |
|------|------------|
| [docs/REGULATION_SUBMISSION_RU.md](docs/REGULATION_SUBMISSION_RU.md) | Чеклист подачи заявки (п. 2) |
| [docs/GITHUB_PUBLISH_RU.md](docs/GITHUB_PUBLISH_RU.md) | Как выложить код на GitHub |
| [docs/LETTER_TO_ADMIN_RU.md](docs/LETTER_TO_ADMIN_RU.md) | Шаблон письма администрации |
| [docs/MIGRATION_POSTGRES_RU.md](docs/MIGRATION_POSTGRES_RU.md) | Переход SQLite → PostgreSQL на проде |
| [CHANGELOG.md](CHANGELOG.md) | История изменений (п. 7.2 регламента) |
| [SECURITY.md](SECURITY.md) | Токены и базовые правила безопасности |

## Функционал

- Канал **`PANEL_CHANNEL_ID`**: при старте создаётся/обновляется сообщение с кнопкой **«Подать заявку»** → форма (ранг, имя, фамилия).
- Заявка пишется в **SQLite** (Prisma), в **`MOD_CHANNEL_ID`** — embed с **Approve** / **Reject**.
- Одобрять могут только пользователи с **хотя бы одной** ролью из **`APPROVER_ROLE_IDS`**.
- **Approve** → модалка «способ приёма» → выдача всех ролей из **`TARGET_ROLE_IDS`**, ник по **`NICKNAME_PATTERN`**, сообщение в **`AUDIT_CHANNEL_ID`** с пингом роли **`ACADEMY_ROLE_ID`**.
- **Reject** — без выдачи ролей.
- Повторная обработка той же заявки блокируется.
- Опционально: **`DAILY_STATS_CHANNEL_ID`** + cron — сводка «кто сколько одобрил за вчера» (таймзона **`DAILY_STATS_TIMEZONE`**).
- Slash-команды на гильдии при старте **очищаются** (ошибка доступа не роняет процесс).

## Стек

- Node.js, TypeScript, `discord.js` v14  
- Prisma + **SQLite** (локально); на хостинге проекта — **PostgreSQL** по [docs/MIGRATION_POSTGRES_RU.md](docs/MIGRATION_POSTGRES_RU.md), поднять БД можно через [`docker-compose.yml`](docker-compose.yml)  
- `zod`, `dotenv`, `pino`, `node-cron`, `luxon`

## Установка и БД

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

Создай файл **`.env`** в корне (скопируй из **`.env.example`** и заполни). **Не коммить** токен и секреты.

## Запуск

- Разработка: `npm run dev`
- Сборка: `npm run build`
- Прод: `npm start`

## Права бота на сервере

- Роль бота **выше** выдаваемых ролей в списке сервера.
- Права: управление **ролями** и **никнеймами**, отправка сообщений и embed в задействованных каналах.
- В Developer Portal включить **Server Members Intent**.

## Переменные окружения

См. **`.env.example`**: `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `PANEL_CHANNEL_ID`, `MOD_CHANNEL_ID`, `APPROVER_ROLE_IDS`, `TARGET_ROLE_IDS`, `AUDIT_CHANNEL_ID`, `ACADEMY_ROLE_ID`, опционально `DAILY_STATS_*`, `NICKNAME_PATTERN`, `LOG_LEVEL`, **`LOG_TO_FILE`**, **`LOG_FILE_PATH`**.

На проде для администрации можно включить **`LOG_TO_FILE=true`** — JSON-логи пишутся в файл (папка `logs/` в `.gitignore`).

## Продакшен (миграции)

```bash
npx prisma migrate deploy
```

Скрипт в `package.json`: `npm run prisma:deploy`.
