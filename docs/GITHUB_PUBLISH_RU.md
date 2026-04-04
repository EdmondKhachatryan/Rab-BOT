# Как выложить репозиторий на GitHub (публично, для регламента)

Сделай **один раз** на своём ПК (нужен аккаунт GitHub).

## Вариант A — сайт GitHub

1. Зайди на https://github.com/new  
2. **Repository name:** например `chopbot-discord`  
3. **Public**  
4. **Не** ставь галочки «Add README / .gitignore» (они уже есть в проекте).  
5. Создай репозиторий.

В папке проекта (где `package.json`):

```powershell
git remote add origin https://github.com/ТВОЙ_ЛОГИН/chopbot-discord.git
git branch -M main
git push -u origin main
```

(Если Git спросит логин — используй **Personal Access Token** вместо пароля.)

## Вариант B — GitHub Desktop

Скачай [GitHub Desktop](https://desktop.github.com/) → Add existing repository → выбери папку `ЧОПБОТ` → Publish repository → **Public**.

## После публикации

1. Скопируй URL репозитория (например `https://github.com/username/chopbot-discord`).  
2. Вставь его в [REGULATION_SUBMISSION_RU.md](./REGULATION_SUBMISSION_RU.md) в блок «Ссылка на публичный репозиторий».  
3. Снова commit + push.

Убедись, что в истории **нет** коммитов с токеном бота. Если был — сбрось токен в Discord и используй `git filter-repo` или новый репозиторий (по ситуации).
