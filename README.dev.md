## Обзор проекта

AspNetReactWebApp — full-stack веб-приложение, которое включает в себя:
- Backend: ASP.NET Core 8.0 на C# (.NET 8.0)
- Frontend: React 18.2.0 (Create React App, часть фронтенда — TypeScript)
- База данных: PostgreSQL 16 (в контейнере Docker)
- Инфраструктура: Docker и docker-compose для контейнеризации, GitHub Actions для CI/CD

Структура репозитория — монорепозиторий с единственным решением (.sln), содержащим основной проект ASP.NET Core.

## Architecture Overview

### Структура бэкенда (AspNetReactApp/)
- Program.cs: минимальный хостинг (top-level statements), регистрация AppDbContext (Npgsql), DI для IDbService/DbService (Scoped), контроллеры, CORS, авто-применение миграций и сидирование при старте
- Controllers/: бизнес-контроллеры для API:
  - `AuthController`: аутентификация и авторизация
  - `AccountController`: управление учетными записями
  - `ProfileController`: данные профиля пользователя
  - `GoalsController`, `ProjectsController`, `TasksController`: основные сущности
  - `CommentsController`: комментарии к задачам
  - `ExecutorsController`, `LeadersController`: управление персоналом
  - `TimeEntriesController`: учет времени
- Pages/: Razor Pages (например, Error.cshtml для ошибок)
- appsettings.json / appsettings.Development.json: конфигурация логирования и строки подключения к PostgreSQL
- AspNetReactApp.csproj: Web SDK, настройка SPA proxy для React dev-сервера и интеграция npm
### Структура фронтенда (AspNetReactApp/ClientApp/)
- src/index.js: точка входа, приложение оборачивается в BrowserRouter (basename берётся из `<base href>`)
- src/App.js: корневой React-компонент, рендерит Layout и маршруты из AppRoutes
- src/AppRoutes.js: клиентская маршрутизация (основные разделы)

| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/` (index) | `Home` | Главная: управление руководителями и исполнителями |
| `/goals` | `GoalsPage` | Цели: карточки с прогрессом, проектами и задачами |
| `/projects` | `ProjectsPage` | Проекты: создание, выбор цели, отображение |
| `/tasks` | `TasksPage` | Задачи: CRUD с выбором проекта, исполнителя, статуса, приоритета |
| `/time` | `TimeEntriesPage` | Учёт времени: запись часов по задачам и исполнителями |

- src/components/: React-компоненты
  - Layout.js — корневой layout с NavMenu и контейнером
  - NavMenu.js — навигационная панель с кнопкой профиля
  - ProfilePanel.js — выезжающая панель профиля и авторизации
  - TaskDetailModal.js — модальное окно задачи с комментариями
  - Home.js — таблицы Leaders и Executors, формы добавления
  - GoalsPage.js — аккордеон целей с проектами и задачами, прогресс-бары
  - ProjectsPage.js — создание проекта с выбором цели
  - TasksPage.js — CRUD задач: проект, исполнитель, статус, приоритет
  - TimeEntriesPage.js — создание и просмотр записей учёта времени (шаг 0.25ч)
- src/api/client.js: API-клиент для вызовов backend
- public/: статические ресурсы и index.html
- setupProxy.js: dev-proxy для перенаправления /api/* на бэкенд в режиме разработки
- package.json: npm-зависимости и скрипты (React, React Router, Reactstrap, Bootstrap и т.д.)
### Сущности доменной модели (JiraClone.Data/Domain)

#### Базовый класс: BaseEntity
| Поле | Тип | Описание |
|------|-----|----------|
| Id | int | Первичный ключ |
| CreatedAt | DateTime | Дата создания (устанавливается автоматически в SaveChanges) |
| UpdatedAt | DateTime | Дата обновления (обновляется автоматически в SaveChanges) |

#### Иерархия сотрудников: Employee (абстрактный)
Базовый класс для `Leader` и `Executor`.
| Поле | Тип | Описание |
|------|-----|----------|
| Name | string | Имя сотрудника |
| Email | string | Email |
| Login | string | Логин для входа |
| PasswordHash | string | Хэш пароля |
| Position | string? | Должность |

#### Leader (Руководитель) и Executor (Исполнитель)
Наследуют `Employee`. 
- `Executor` имеет связь `Tasks` (1:M).
- `Leader` используется как справочная сущность или владелец проектов.

#### Profile (Профиль) — JiraClone.Data/Domain/Entities/Profile.cs
| Поле | Тип | Описание |
|------|-----|----------|
| Bio | string? | О себе |
| AvatarUrl | string? | Ссылка на аватар |
| EmployeeId | int | FK -> Employee |

#### Goal (Цель) — JiraClone.Data/Domain/Entities/Goal.cs
| Поле | Тип | Описание |
|------|-----|----------|
| Title | string | Название цели |
| Description | string? | Описание (nullable) |
| Progress | decimal (вычисляемое) | Средний прогресс проектов (0, если проектов нет) |
| Projects | ICollection<Project> | Связь 1:M → Project (удаление — каскад)

#### Project (Проект) — JiraClone.Data/Domain/Entities/Project.cs
| Поле | Тип | Описание |
|------|-----|----------|
| Title | string | Название проекта |
| Description | string? | Описание (nullable) |
| GoalId | int | Внешний ключ → Goal |
| Goal | Goal? | Навигационное свойство |
| Progress | decimal (вычисляемое) | Процент задач в статусе Done (0 если задач нет) |
| Tasks | ICollection<TaskItem> | Связь 1:M → TaskItem (удаление — каскад)

#### TaskItem (Задача) — JiraClone.Data/Domain/Entities/TaskItem.cs
| Поле | Тип | Описание |
|------|-----|----------|
| Title | string | Название задачи |
| Description | string? | Описание (nullable) |
| Status | TaskStatus | Статус: ToDo, InProgress, Done, Canceled |
| Priority | TaskPriority | Приоритет: Low, Medium, High, Critical |
| TimeSpent | double | Суммарное затраченное время (часы) |
| ProjectId | int | Внешний ключ → Project |
| Project | Project? | Навигационное свойство |
| ExecutorId | int? | Внешний ключ → Executor (nullable) |
| Executor | Executor? | Навигационное свойство |
| Comments | ICollection<Comment> | Связь 1:M → Comment (удаление — каскад) |
| TimeEntries | ICollection<TimeEntry> | Связь 1:M → TimeEntry (удаление — каскад)

#### Comment (Комментарий) — JiraClone.Data/Domain/Entities/Comment.cs
| Поле | Тип | Описание |
|------|-----|----------|
| Text | string | Текст комментария |
| TaskItemId | int | Внешний ключ → TaskItem |
| TaskItem | TaskItem? | Навигационное свойство |
| AuthorId | int | Внешний ключ → Executor |
| Author | Executor? | Автор комментария |

#### TimeEntry (Запись учёта времени) — JiraClone.Data/Domain/Entities/TimeEntry.cs
| Поле | Тип | Описание |
|------|-----|----------|
| Hours | decimal(18,2) | Количество часов |
| Date | DateTime | Дата записи (по умолчанию DateTime.UtcNow) |
| TaskItemId | int | Внешний ключ → TaskItem |
| TaskItem | TaskItem? | Навигационное свойство |
| ExecutorId | int | Внешний ключ → Executor |
| Executor | Executor? | Навигационное свойство |

#### Перечисления (Domain/Enums)
| Enum | Значения |
|------|----------|
| TaskStatus | ToDo, InProgress, Done, Canceled |
| TaskPriority | Low, Medium, High, Critical |

#### ER-диаграмма связей
```
Goal ──1:M──> Project ──1:M──> TaskItem ──1:M──> Comment
                                    │                │
                                    │ 1:M            │ M:1 Author
                                    ▼                ▼
                              TimeEntry ◄─────── Executor (is Employee)
                                    │                │
                                    │ M:1 Executor   │ 1:M Tasks (SetNull)
                                    └──────┬─────────┘
                                           │
                                     TaskItem.ExecutorId

Employee ──1:1──> Profile
   ▲
   │
Leader / Executor
```
```

#### Правила каскадного удаления (AppDbContext.OnModelCreating)
| Родитель → Дочерний | FK | Поведение при удалении |
|---------------------|-----|----------------------|
| Goal → Project | GoalId | Cascade |
| Project → TaskItem | ProjectId | Cascade |
| TaskItem → Comment | TaskItemId | Cascade |
| TaskItem → TimeEntry | TaskItemId | Cascade |
| Executor → TaskItem | ExecutorId | SetNull |
| Executor → Comment | AuthorId | Restrict |
| Executor → TimeEntry | ExecutorId | Cascade |
### Важные интеграционные моменты
1. SPA Proxy: в .csproj настроен Microsoft.AspNetCore.SpaProxy для проксирования вызовов к React dev-серверу в режиме разработки
2. Конвейер сборки: при публикации React собирается (npm run build), результат копируется в wwwroot/ и отдается как статические файлы
3. Маршрутизация API: бэкенд обслуживает маршруты /api/*; SPA отдаёт fallback в виде index.html через MapFallbackToFile("index.html")
4. Forwarded Headers: в Program.cs настроена обработка X-Forwarded-For / X-Forwarded-Proto для корректной работы за обратным прокси (Nginx и т.п.)

## Команды для разработки

### Backend (ASP.NET Core)
```bash
# Восстановить зависимости и собрать решение
dotnet build

# Запустить приложение ASP.NET Core (например, https://localhost:7000)
dotnet run

# Опубликовать production-сборку
dotnet publish -c Release
```

### Frontend (React в ClientApp/)
```bash
# Установить зависимости
npm install

# Запустить dev сервер с hot-reload (proxy для /api настроен)
# prestart выполняет скрипты для настройки dev HTTPS сертификатов
npm start

# Сборка для production
npm run build

# Запуск линтинга
npm run lint

# Запуск тестов
npm run test
```

### Полная разработка (Full stack)
Если из корня проекта запустить dotnet run в папке AspNetReactApp, то:
1. Через MSBuild-таргет при необходимости автоматически выполнится npm install (если отсутствует node_modules)
2. Запустится приложение ASP.NET Core
3. SPA proxy будет перенаправлять запросы к React dev-серверу в режиме разработки

В режиме разработки:
- React dev-сервер работает на https://localhost:44418
- ASP.NET backend работает на https://localhost:7000 (пример)
- Запросы к API проксируются через setupProxy.js
В production React заранее собирается и файлы обслуживаются из wwwroot/


## Docker и контейнеризация

### Dockerfile
Многоступенчатая сборка:
1. build stage: на базе mcr.microsoft.com/dotnet/sdk:8.0, устанавливается Node.js 20, собираются .NET и React
2. publish stage: публикация .NET-приложения
3. final stage: на базе mcr.microsoft.com/dotnet/aspnet:8.0, контейнер слушает порт 5000

### docker-compose.yml
Сервисы:
- db: контейнер PostgreSQL 16-alpine
  - Database: TestAiNvkzDb
  - Учетные данные: test / test_password (измените перед деплоем в production)
  - Порт: 5432
  - Volume: postgres_data (для персистентности данных)
- web: ASP.NET React приложение
  - Собирается по Dockerfile
  - Зависит от db
  - Порт: 5000
  - Переменные окружения: ASPNETCORE_ENVIRONMENT=Production

## CI/CD

### GitHub Actions (.github/workflows/docker-publish.yml)
Триггеры: push в main, PR в main, теги релизов (v*.*.*)
- Собирает Docker-образ из контекста ./AspNetReactApp
- Публикует образ в GitHub Container Registry (ghcr.io)
- Использует кэширование слоёв Docker (type=gha)
- Автоматизация для релизов и PR

## Схема сборки и деплоя

### Сборка для разработки
```
dotnet build
  ↓
MSBuild проверяет наличие node_modules
  ↓
npm install (если нужно)
  ↓
React dev-сервер (setupProxy.js) настраивается
  ↓
SPA proxy перенаправляет вызовы к React на :44418
```

### Сборка для production
```
dotnet publish -c Release
  ↓
npm install + npm run build
  ↓
Выходной каталог React (./build/) копируется в wwwroot/
  ↓
Статические файлы обслуживаются ASP.NET
  ↓
Маршруты API (/api/*) обрабатываются контроллерами
  ↓
SPA fallback — index.html
```

### Docker Build
```
Docker build (multi-stage из AspNetReactApp/)
  ↓
SDK stage: dotnet restore + build + publish
  ↓
Final stage: копирование опубликованного приложения
  ↓
Kestrel слушает порт 5000
```

## Примечания по конфигурации проекта

### AspNetReactApp.csproj
- `<TargetFramework>net8.0</TargetFramework>`: таргет .NET 8
- `<Nullable>enable</Nullable>`: включены nullable reference types
- `<SpaRoot>ClientApp\</SpaRoot>`: расположение React-приложения
- `<SpaProxyServerUrl>https://localhost:44418</SpaProxyServerUrl>`: URL dev-прокси
- `<ImplicitUsings>enable</ImplicitUsings>`: implicit usings и top-level statements
- MSBuild targets:
  - DebugEnsureNodeEnv (перед Build в Debug): проверяет Node.js и выполняет npm install при необходимости
  - PublishRunWebpack (после ComputeFilesToPublish): выполняет npm run build и копирует output в wwwroot

## Конфигурация окружений
- Development: используется appsettings.Development.json (расширенное логирование, настройки для SpaProxy)
- Production: используется appsettings.json (минимальное логирование)
- Docker: в docker-compose.yml задаётся ASPNETCORE_ENVIRONMENT=Production
- Подключение к БД: настроено в docker-compose.yml (можно переместить в appsettings при необходимости)

## Ключевые зависимости

### NuGet
- Microsoft.AspNetCore.SpaProxy (8.0.0): проксирование React dev-сервера

### npm (фронтенд)
- react (18.2.0), react-dom (18.2.0)
- react-router-dom (6.11.0): маршрутизация на клиенте
- reactstrap (9.1.9), bootstrap (5.2.3): UI
- workbox-* (6.5.4): сервис-воркеры для PWA
- oidc-client (1.11.5): клиент OIDC (в проекте присутствует, но интеграция может быть не завершена)
- jest, eslint: тестирование и линтинг (через react-scripts)

## Важные замечания для дальнейшей разработки

1. API-контракты: контроллеры возвращают данные, которые фронтенд запрашивает через /api/* (пример: WeatherForecastController)
2. Proxy: setupProxy.js используется только в режиме разработки для перенаправления вызовов к React dev-серверу; в production прокси не нужен
3. Миграции базы данных: EF Core миграции находятся в проекте JiraClone.Data (папка Migrations). Для управления миграциями в корне решения есть скрипты, также можно использовать ef-migrate.bat
4. Аутентификация: в проекте установлен oidc-client, но интеграция OIDC/OAuth может быть не завершена
5. Forwarded Headers: необходимы при развёртывании за обратным прокси (Nginx и т.п.); уже настроено в Program.cs
6. PWA: Workbox включён, регистрация service worker доступна (serviceWorkerRegistration.js)
7. Переменные окружения для React: используют префикс REACT_APP_*; см. ClientApp/.env

8. Аутентификация и изменения модели Employee: модель пользователей/сотрудников вынесена в абстрактный класс Employee (реализуемый Leader и Executor). Employee содержит поля Login, PasswordHash и опциональное Position. Пароли не хранятся в открытом виде — для хеширования используется BCrypt. В сидере по умолчанию создаются пользователи Leader и Executor с логинами и PasswordHash, полученным из пароля-значения по умолчанию "password1234". Обязательно замените этот пароль в production.

9. Миграции, связанные с аутентификацией и профилем сотрудников: в репозитории добавлены миграции для колонок пароля и позиции (например, 20260525104309_PasswordHashAndPosition и 20260624120000_AddEmployeePosition). Перед запуском приложения локально убедитесь, что база данных актуальна:

```bash
dotnet ef database update --project JiraClone.Data --startup-project AspNetReactApp
```

См. также папку JiraClone.Data/Migrations для подробностей по миграциям.
