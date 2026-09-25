# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JiraClone — упрощённый аналог Jira. Full-stack монорепозиторий:
- Backend: ASP.NET Core 8.0 (C#), контроллеры + `IDbService`/`DbService` вместо классического repository pattern
- Frontend: React 18.2 (Create React App, class components), в `AspNetReactApp/ClientApp/`
- БД: PostgreSQL 16, EF Core Code First, миграции в `JiraClone.Data/Migrations`
- Решение разбито на 3 проекта: `AspNetReactApp` (веб-хост, контроллеры, auth), `JiraClone.Data` (домен, EF Core, DbService), `AspNetReactApp.Tests` (xUnit + Moq, целевой фреймворк `net10.0`, хотя основной проект — `net8.0`)

Подробное описание доменной модели, ER-диаграммы, ролей и матрицы прав уже задокументированы в `README.dev.md` — читай его первым, не переизлагай информацию заново.

## Commands

### Backend
```bash
dotnet build                    # собрать решение
dotnet run --project AspNetReactApp   # запустить (auto-migrate + SPA proxy к React dev-серверу)
dotnet publish -c Release       # production-сборка (собирает и React через MSBuild target)
dotnet test                     # запустить тесты AspNetReactApp.Tests (xUnit)
dotnet test --filter "FullyQualifiedName~TasksControllerTests"  # один класс тестов
```
Миграции EF Core (проект `JiraClone.Data`, стартовый проект `AspNetReactApp`):
```bash
dotnet ef migrations add <Name> --project JiraClone.Data --startup-project AspNetReactApp
dotnet ef database update --project JiraClone.Data --startup-project AspNetReactApp
```
Также есть `ef-migrate.bat` в корне для тех же операций на Windows.

### Frontend (`AspNetReactApp/ClientApp/`)
```bash
npm install
npm start        # dev-сервер на https://localhost:44418, прокси /api/* через setupProxy.js
npm run build
npm run lint
npm test         # CRA + jest
```

### Docker
```bash
docker-compose up -d --build
docker-compose logs -f
docker-compose down
```
CI: `.github/workflows/docker-publish.yml` собирает и пушит образ в GHCR при push в `main` или теге `v*.*.*`.

## Architecture

### Слои и потоки данных
- `Program.cs`: минимальный хостинг, регистрация `AppDbContext` (Npgsql), DI `IDbService → DbService` (Scoped), cookie-аутентификация (`AuthConstants.CookieScheme`), CORS под `https://localhost:44418`, auto-`MigrateAsync()` при старте, Swagger только в Development, `MapFallbackToFile("index.html")` для SPA-роутинга.
- Все операции с БД идут через единый `IDbService` (`JiraClone.Data/Domain/Interfaces/IDbService.cs`) — не EF-репозитории на сущность, а один God Service (`DbService.cs`) с явными async-методами (`GetGoalsAsync`, `CreateTaskAsync`, ...). Контроллеры принимают `IDbService` через конструктор и не обращаются к `AppDbContext` напрямую.
- Домен — `JiraClone.Data/Domain/Entities`: `BaseEntity` (Id/CreatedAt/UpdatedAt) → иерархия `Employee` (TPH: `Leader`, `Executor`) и цепочка `Goal → Project → TaskItem → (Comment, TimeEntry)`. Прогресс `Goal`/`Project` — вычисляемые поля, не хранятся в БД. Каскадные правила удаления заданы в `AppDbContext.OnModelCreating` — при добавлении новых связей соблюдай существующий паттерн (Cascade вниз по иерархии, `SetNull`/`Restrict` для необязательных ссылок).
- Интерфейсы `IGoal`, `IProject`, `ITaskItem`, `IEmployee` и т.д. (`Domain/Interfaces/IEntities.cs`) описывают контракт сущностей отдельно от EF-классов — при рефакторинге сущностей держи интерфейсы синхронизированными.

### Аутентификация и роли
- Cookie-based auth (не JWT), схема `AuthConstants.CookieScheme = "AppCookie"`. Роли: `Admin`, `Leader`, `Executor` (`AspNetReactApp/Auth/AuthConstants.cs`).
- Логин `admin` — специальный кейс: пароль берётся из конфигурации `ADMIN_PASSWORD` (не из БД, не хешируется отдельной сущностью). Все остальные пользователи — записи `Leader`/`Executor`, пароль хранится как `PasswordHash` (BCrypt.Net-Next), сверяется в `AuthController.Login`.
- Роль/принадлежность определяется claims (`ClaimTypesEx.EmployeeId`, `EmployeeType`, `IsAdmin`), проверяется через `[Authorize(Roles = ...)]` на контроллерах/методах. При добавлении новых защищённых эндпоинтов ориентируйся на существующие контроллеры (например `LeadersController` — только `Admin`).
- Права по ролям (детальная матрица в `README.dev.md`): `Admin` — полный доступ; `Leader` — управляет Executors/Goals/Projects/Tasks, но не Leaders; `Executor` — только смена статуса задач, комментарии и учёт времени, не может создавать Goals/Projects/Tasks и не видит/не редактирует Planned Time.
- На фронтенде роль хранится в объекте `me` (см. `Layout.js`), UI скрывает/дизейблит элементы под роль — при добавлении новых действий в React-компонентах сверяйся с той же матрицей прав, а не только с backend-авторизацией.

### Frontend
- CRA (react-scripts 5), маршруты — `AppRoutes.js` (`/`, `/goals`, `/projects`, `/tasks`, `/time`), компоненты — class components в `ClientApp/src/components/` (Home, GoalsPage, ProjectsPage, TasksPage, TimeEntriesPage, TaskDetailModal, Layout/NavMenu/ProfilePanel).
- API-вызовы — через `src/api/client.js`. В dev-режиме `/api/*` проксируется `setupProxy.js` на backend; в production фронтенд собирается в `wwwroot/` и раздаётся статикой (SPA proxy настроен в `AspNetReactApp.csproj` через MSBuild targets `DebugEnsureNodeEnv`/`PublishRunWebpack`).
- Переменные окружения фронтенда — префикс `REACT_APP_*`.

### Тесты
- Backend: xUnit + Moq в `AspNetReactApp.Tests`, паттерн — мокать `IDbService`, инстанцировать контроллер напрямую и проверять `ActionResult` (см. `ControllerTests.cs`). Новые тесты пиши в том же стиле (Arrange mock → Act контроллер → Assert тип результата).
- Frontend: только smoke-тест CRA (`App.test.js`); полноценного покрытия нет.

## Known project-specific notes
- В `docker-compose.yml` нужно вручную сверить/выставить корректные параметры подключения к БД перед продакшен-деплоем (исторически было расхождение имени БД между compose и connection string).
- `oidc-client` упоминается в старых заметках, но в текущем `package.json` фронтенда отсутствует — аутентификация полностью на cookie+ролях, без OIDC/OAuth.
- В `Employee`/`Leader`/`Executor` есть как `PasswordHash` (используется для входа, BCrypt), так и отдельное поле `Password` в `Leader`/`Executor` — это унаследованная особенность модели, не путай их при работе с аутентификацией.
