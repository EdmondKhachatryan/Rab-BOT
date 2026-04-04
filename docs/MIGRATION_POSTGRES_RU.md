# Переход с SQLite на PostgreSQL (для хостинга проекта)

1. Подними PostgreSQL, например: `docker compose up -d` в корне репозитория.
2. В `prisma/schema.prisma` замени блок `datasource`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. В `.env` на сервере задай, например:

```env
DATABASE_URL="postgresql://chopbot:chopbot_local_change_me@localhost:5432/chopbot"
```

(пароль смени на продакшене.)

4. Удали старые миграции SQLite **или** согласуй с админами `prisma migrate reset` на пустой БД, затем:

```bash
npx prisma migrate dev --name init_postgres
```

На проде только: `npx prisma migrate deploy`.

5. Пересобери и запусти бота: `npm run build && npm start`.

Файл `prisma/dev.db` после перехода не используется.
