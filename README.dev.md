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
| Login | string | Логин для входа (макс 12 символов) |
| PasswordHash | string | Хэш пароля (макс 512 символов) |
| Position | string? | Должность (макс 128 символов, nullable) |
| Phone | string? | Номер телефона (макс 32 символа, nullable) |
| Address | string? | Адрес (макс 256 символов, nullable) |

#### Leader (Руководитель) и Executor (Исполнитель)
Наследуют `Employee`. 
- `Executor` имеет связь `Tasks` (1:M) с TaskItem (SetNull при удалении).
- `Leader` используется как справочная сущность или владелец проектов.
- Оба класса имеют дополнительное поле `Password` (string) для хранения пароля (примечание: используется рядом с PasswordHash из базового класса).

#### Profile (Профиль) — JiraClone.Data/Domain/Entities/Profile.cs
| Поле | Тип | Описание |
|------|-----|----------|
| EmployeeId | int? | FK -> Employee (nullable, удаление — каскад) |
| ExternalKey | string? | Внешний ключ (макс 64 символа, nullable, уникальный) |
| IsAdminProfile | bool | Флаг профиля администратора |
| TablesColumnsJson | string | JSON-конфиг видимости столбцов таблиц (по умолчанию '{}') |

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
| PlannedTime | double | Планируемое время на задачу (часы) |
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
| AuthorId | int | Внешний ключ → Employee |
| Author | Employee? | Автор комментария (может быть любой сотрудник: Leader или Executor) |

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
                         ┌─────────────────────────┐
                         │      Employee           │
                         │  (Abstract, TPH)        │
                         │  ↓                      │
                         ├─ Leader                 │
                         └─ Executor               │
                              │                    │
                              │ 1:1               │ 1:1
                              │ (Cascade)         │ (Cascade)
                              ▼                    ▼
                          Profile              Profile

Goal ──1:M──> Project ──1:M──> TaskItem ──1:M──> Comment
                                    │                │
                                    │ 1:M            │ M:1 Author
                                    │ (Cascade)      │ (Restrict)
                                    ▼                ▼
                              TimeEntry ◄────── Employee
                                    │               (or Executor)
                                    │ M:1 Executor
                                    │ (Cascade)
                                    │
                    ┌───────────────┘
                    │
                    └─> TaskItem
                        M:1 Executor (SetNull)
```

#### Правила каскадного удаления (AppDbContext.OnModelCreating)
| Родитель → Дочерний | FK | Поведение при удалении |
|---------------------|-----|----------------------|
| Goal → Project | GoalId | Cascade |
| Project → TaskItem | ProjectId | Cascade |
| TaskItem → Comment | TaskItemId | Cascade |
| TaskItem → TimeEntry | TaskItemId | Cascade |
| Employee → Profile | EmployeeId | Cascade |
| Executor → TaskItem | ExecutorId | SetNull |
| Employee → Comment | AuthorId | Restrict |
| Executor → TimeEntry | ExecutorId | Cascade |

## Ролевая модель и права доступа

В приложении используется ролевая модель доступа (RBAC), разделяющая пользователей на три уровня ответственности.

### Список ролей
1.  **Admin**: Системный администратор. Имеет полный доступ ко всем ресурсам, включая управление списком руководителей.
2.  **Leader**: Руководитель. Отвечает за стратегическое планирование: создание целей, проектов и постановку задач.
3.  **Executor**: Исполнитель. Основная роль для работы над задачами, комментирования и учета времени.

### Матрица прав доступа (Permissions Matrix)

| Действие | Admin | Leader | Executor |
| :--- | :---: | :---: | :---: |
| Управление руководителями (Leaders) | ✅ | ❌ | ❌ |
| Управление исполнителями (Executors) | ✅ | ✅ | ❌ |
| Создание/удаление целей (Goals) | ✅ | ✅ | ❌ |
| Создание/удаление проектов (Projects) | ✅ | ✅ | ❌ |
| Создание/назначение задач (Tasks) | ✅ | ✅ | ❌ |
| Установка планируемого времени (Planned Time) | ✅ | ✅ | ❌ |
| Изменение статуса задач | ✅ | ✅ | ✅ |
| Добавление комментариев | ✅ | ✅ | ✅ |
| Логирование времени (Time Entries) | ✅ | ✅ | ✅ |
| Просмотр аналитики и прогресса | ✅ | ✅ | ✅ |

### Техническая реализация

#### Backend (ASP.NET Core)
*   **Константы**: Роли определены в `AspNetReactApp/Auth/AuthConstants.cs`.
*   **Авторизация**: Доступ к методам API ограничен атрибутом `[Authorize(Roles = ...)]`. Например, `LeadersController` доступен только для `Admin`.
*   **Определение роли**: При входе система проверяет, в какой таблице (`Leaders` или `Executors`) находится пользователь. Специальный логин `admin` (настраивается в `appsettings.json`) всегда получает роль `Admin`.

#### Frontend (React)
*   **Состояние**: Информация о текущем пользователе и его роли хранится в объекте `me` (доступен через контекст или пропсы в `Layout.js`).
*   **UI-контроль**: 
    *   Кнопки создания (например, "Add Goal", "Create Task") скрываются для роли `Executor`.
    *   Поля ввода планируемого времени (`Planned Time`) блокируются (`disabled`) для исполнителей.
    *   Навигационное меню (`NavMenu.js`) адаптируется под права пользователя.

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

Проект полностью контейнеризирован и готов к запуску в Docker-окружении.

### Dockerfile
Используется многоэтапная сборка (multi-stage build):
1.  **build**: Базовый образ `.NET 8.0 SDK`. Устанавливается `Node.js 20.x` для сборки React-приложения. Выполняется `dotnet restore` и `dotnet build`.
2.  **publish**: Выполняется `dotnet publish`, который автоматически запускает `npm run build` для фронтенда (благодаря настройкам в `.csproj`).
3.  **final**: Минимальный образ `aspnet:8.0`. Копируются только опубликованные файлы. Приложение слушает порт `5000`.

### Docker Compose
Файл `docker-compose.yml` поднимает два сервиса:
- **db**: PostgreSQL 16 на базе Alpine. Данные сохраняются в volume `postgres_data`.
- **web**: Основное приложение. Зависит от `db`. Настроены переменные окружения для подключения к базе и режим `Production`.
- файл `docker-compose.yml` следует отредактировать, вписать правильные параметры для подключения к базе данных на продакшене

### Команды для запуска
```bash
# Сборка и запуск всех контейнеров в фоновом режиме
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка и удаление контейнеров
docker-compose down
```

## Схема сборки и деплоя

### CI/CD (GitHub Actions)
Автоматизация настроена через workflow `.github/workflows/docker-publish.yml`.

**Процесс:**
1.  **Trigger**: Push в ветку `main` или создание тега `v*.*.*`.
2.  **Build**:
    - Checkout кода.
    - Авторизация в GitHub Container Registry (ghcr.io).
    - Сборка Docker-образа с использованием кэширования слоёв (`type=gha`).
    - Присвоение тегов (например, `latest` или номер версии).
3.  **Push**: Публикация готового образа в репозиторий пакетов GitHub.

### Схема развертывания
1.  **Локально**: Разработчик использует `docker-compose` для поднятия идентичного production-окружения.
2.  **Production**:
    - Образ забирается из `ghcr.io`.
    - Запускается за обратным прокси (Nginx/Traefik), который терминирует SSL и проксирует запросы на порт `5000`.
    - При старте контейнера `web` автоматически применяются миграции БД (настроено в `Program.cs`).

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

8. Аутентификация и изменения модели Employee: модель пользователей/сотрудников вынесена в абстрактный класс Employee (реализуемый Leader и Executor). Employee содержит поля Login, PasswordHash и опциональное Position. Пароли не хранятся в открытом виде — они хешируются.

```bash
dotnet ef database update --project JiraClone.Data --startup-project AspNetReactApp
```

См. также папку JiraClone.Data/Migrations для подробностей по миграциям.

## Что не реализовано
1. Проект сырой требует тщательного тестирования
2. Нет AI-помощника. В будущем планируется при превышении планируемого времени на задачу (например больше 32 часов)
использовать AI-помощника, который бы делал декомпозицию на несколько задач.

## Первоначальная настройка
 Для того чтобы начать работать с приложением, необходимо залогиниться с правами администратора
 login: admin
 password: SimpleJira

 Администратор может и должен добавить ответственных лиц и исполнителей задач. И вообще он имеет полный доступ ко всем возможностям приложения.
