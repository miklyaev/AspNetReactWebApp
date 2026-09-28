# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JiraClone — упрощённый аналог Jira. Full-stack монорепозиторий:
- Backend: ASP.NET Core 8.0 (C#), контроллеры + единый `IDbService`/`DbService` вместо классического repository pattern
- Frontend: React 18.2 (Create React App, class components) в `AspNetReactApp/ClientApp/`
- БД: PostgreSQL 16, EF Core Code First, миграции в `JiraClone.Data/Migrations`
- Решение `AspNetReactApp.slnx` содержит 2 проекта: `AspNetReactApp` (веб-хост, контроллеры, auth) и `JiraClone.Data` (домен, EF Core; `AppDbContext`/`DbService` в `Infrastructure/Db/`). Backend-тестов сейчас нет: проект `AspNetReactApp.Tests` был добавлен и откачен (см. git history) — на диске от него остались только артефакты сборки под `net10.0` (основной проект — `net8.0`). Паттерн прежних тестов: xUnit + Moq, мок `IDbService` → инстанцирование контроллера напрямую → проверка `ActionResult`.

Доменная модель, ER-диаграмма, роли и матрица прав подробно описаны в `README.dev.md` — читай его первым, не переизлагай. Известные проблемы и roadmap улучшений — в `mimo.md` и `предложения по развитию.md` в корне.

## Commands

### Backend
```bash
dotnet build                          # собрать решение
dotnet run --project AspNetReactApp   # backend на https://localhost:7077; auto-migrate при старте; SPA-proxy сам поднимает npm start (React dev на https://localhost:44418)
dotnet publish -c Release             # production-сборка (заодно собирает React через MSBuild-таргет PublishRunWebpack)
```
Миграции EF Core (проект `JiraClone.Data`, стартовый `AspNetReactApp`):
```bash
dotnet ef migrations add <Name> --project JiraClone.Data --startup-project AspNetReactApp
dotnet ef database update --project JiraClone.Data --startup-project AspNetReactApp
```
`ef-migrate.bat` в корне — интерактивное меню тех же операций.

### Frontend (`AspNetReactApp/ClientApp/`)
```bash
npm install
npm start        # dev-сервер на https://localhost:44418 (prestart настраивает dev-сертификаты dotnet dev-certs)
npm run build
npm run lint
npm test         # CRA + jest (только smoke-тест App.test.js)
```
Рекомендуемый dev-цикл — `dotnet run --project AspNetReactApp` (SpaProxy запустит CRA сам). Если запускать `npm start` отдельно, `setupProxy.js` проксирует `/api/*` на `ASPNETCORE_HTTPS_PORT`/`ASPNETCORE_URLS`, а без этих переменных — на http://localhost:40421 (IIS Express, обычно не запущен).

### Docker
```bash
docker-compose up -d --build
docker-compose logs -f
docker-compose down
```
CI: `.github/workflows/docker-publish.yml` — сборка и пуш образа в GHCR при push в `main`, теге `v*.*.*` и PR в `main`.

## Architecture

### Слои и потоки данных
- `Program.cs`: минимальный хостинг, `AppDbContext` (Npgsql), DI `IDbService → DbService` (Scoped), cookie-аутентификация, CORS под `https://localhost:44418`, auto-`MigrateAsync()` при старте (сидирование `AppDbSeeder.SeedAsync` закомментировано), ForwardedHeaders, `MapFallbackToFile("index.html")` для SPA-роутинга. Swagger не подключён.
- Все операции с БД идут через единый `IDbService` (`JiraClone.Data/Domain/Interfaces/IDbService.cs`) — God Service (`DbService.cs`) с явными async-методами (`GetGoalsAsync`, `CreateTaskAsync`, ...). Контроллеры принимают `IDbService` через конструктор и не обращаются к `AppDbContext` напрямую.
- Контроллеры возвращают EF-сущности напрямую (DTO-слоя нет); циклические ссылки и null-поля обрезаются глобальной JSON-конфигурацией (`ReferenceHandler.IgnoreCycles`, `JsonIgnoreCondition.WhenWritingNull`).
- Домен — `JiraClone.Data/Domain/Entities`: `BaseEntity` (Id/CreatedAt/UpdatedAt, таймстемпы проставляются в `SaveChanges`) → иерархия `Employee` (TPH: `Leader`, `Executor`) и цепочка `Goal → Project → TaskItem → (Comment, TimeEntry)`. `Progress` у Goal/Project — вычисляемые свойства (в БД не хранятся). Каскадные правила заданы в `AppDbContext.OnModelCreating`: Cascade вниз по Goal→Project→Task→Comment/TimeEntry, `SetNull` для Executor→Task, `Restrict` для Author→Comment — при добавлении новых связей соблюдай этот паттерн.
- Контракты сущностей — интерфейсы `IGoal`, `IProject`, `ITaskItem`, `IEmployee` и т.д. (`Domain/Interfaces/IEntities.cs`) отдельно от EF-классов — при рефакторинге сущностей держи их синхронизированными.

### Аутентификация и роли
- Cookie-based auth (не JWT), схема `AuthConstants.CookieScheme = "AppCookie"`. Роли: `Admin`, `Leader`, `Executor` (`AspNetReactApp/Auth/AuthConstants.cs`), определяются claims (`ClaimTypesEx.EmployeeId`, `EmployeeType`, `IsAdmin`), проверяются `[Authorize(Roles = ...)]` на методах.
- Логин `admin` — спец-кейс: пароль из конфигурации `ADMIN_PASSWORD` (по умолчанию `SimpleJira`), без записи в БД. Все остальные пользователи — записи `Leader`/`Executor`, вход по `PasswordHash` (BCrypt.Net-Next), сверка в `AuthController.Login`. Первый вход в дев-окружении: `admin` / `SimpleJira`.
- Фактические права в коде расходятся с матрицей README.dev.md (README — целевая спецификация, при добавлении эндпоинтов ориентируйся на неё):
  - чтение бизнес-данных (Goals/Projects/Tasks/Executors/Leaders/Comments/TimeEntries) — GET без `[Authorize]`, т.е. анонимно; `/api/profile` и `/api/account` — только авторизованным;
  - `Admin` — создание/удаление Leaders; `Admin,Leader` — CRUD Goals/Projects/Tasks (создание), Executors, правка Leaders, POST TimeEntries, удаление комментариев;
  - любой авторизованный (включая Executor) — PUT задач, смена статуса (`PUT /api/tasks/{id}/status`), удаление задач, создание комментариев. По факту Executor не может логировать время через API (POST TimeEntries закрыт для него), вопреки матрице README.
- Фронтенд: текущий пользователь приходит из `/api/auth/me` в объект `me`, `Layout.js` прокидывает его в страницы (через `React.cloneElement`) и скрывает/дизейблит UI под роль — при добавлении новых действий сверяйся с той же матрицей прав, а не только с backend-авторизацией.

### Frontend
- CRA (react-scripts 5), маршруты — `AppRoutes.js` (`/`, `/goals`, `/projects`, `/tasks`, `/time`), компоненты — class components в `ClientApp/src/components/` (Home, GoalsPage, ProjectsPage, TasksPage, TimeEntriesPage, TaskDetailModal, Layout/NavMenu/ProfilePanel).
- API-вызовы — через `src/api/client.js` (fetch, `credentials: 'include'`). В dev-режиме `/api/*` проксируется `setupProxy.js`; в production фронтенд собирается в `wwwroot/` и раздаётся статикой (MSBuild-таргеты `DebugEnsureNodeEnv`/`PublishRunWebpack` в `AspNetReactApp.csproj`).
- Переменные окружения фронтенда — префикс `REACT_APP_*`.

## Соглашения
- Отвечай по-русски. Перед нетривиальными изменениями описывай общий план по пунктам, затем реализуй. Учитывай линтеры (ESLint для фронтенда); всегда удаляй ставший ненужным код. Детальные правила стиля — в `.claude/rules/` (загружаются автоматически).
- После значимых изменений (архитектура, backend, компоненты фронтенда) обновляй `dev_notes.md` в корне репозитория — workflow в skill `dev-notes`.

## Known project-specific notes
- `docker-compose.yml` сейчас содержит рассинхрон: `POSTGRES_DB=TestDb`, а connection string сервиса web — `Database=TestAiNvkzDb`. Перед продакшен-деплоем приведи к одному имени.
- CI-воркфлоу собирает Docker с `context: ./AspNetReactApp`, но Dockerfile лежит в корне репозитория и копирует `AspNetReactApp.slnx` из корня — сборка образа через CI в текущем виде не сработает.
- `appsettings.Development.json` указывает на удалённый PostgreSQL (не localhost) — dev-запуск через `dotnet run` работает против внешней БД.
- В `Leader`/`Executor` есть legacy-поле `Password` рядом с `PasswordHash`: для входа используется только `PasswordHash`; `Password` сохраняется в модели, потому что его требует `IEmployee` в `IEntities.cs`.
- README.dev.md упоминает `oidc-client`, но в `package.json` его нет — аутентификация полностью cookie+роли, без OIDC/OAuth.
