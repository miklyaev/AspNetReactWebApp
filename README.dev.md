## Project Overview

**AspNetReactWebApp** is a full-stack web application combining:
- **Backend**: ASP.NET Core 8.0 with C# (.NET 8.0)
- **Frontend**: React 18.2.0 with Create React App (TypeScript 4.9.5)
- **Database**: PostgreSQL 16 (via Docker)
- **Infrastructure**: Docker & Docker Compose for containerization, GitHub Actions for CI/CD

This is a monorepo structure with a single .slnx solution containing the main ASP.NET Core project.

## Architecture Overview

### Backend Structure (`AspNetReactApp/`)
- **Program.cs**: Minimal hosting (top-level statements), регистрация `AppDbContext` (Npgsql), `IDbService`/`DbService` (Scoped), контроллеры + CORS, авто-миграции и сидирование при старте
- **Controllers/**: 8 бизнес-контроллеров + 1 тестовый (см. раздел «API-контроллеры»)
- **Pages/**: Razor Pages для обработки ошибок (Error.cshtml)
- **appsettings.json / appsettings.Development.json**: Конфигурация логирования и строки подключения к PostgreSQL
- **AspNetReactApp.csproj**: Web SDK, SPA proxy для React dev-сервера, авто-восстановление npm
### Frontend Structure (`AspNetReactApp/ClientApp/`)
- **src/index.js**: Entry point, оборачивает приложение в `BrowserRouter` (basename из `<base href>`)
- **src/App.js**: Корневой React-компонент, рендерит `<Layout>` и `<Routes>` из `AppRoutes`
- **src/AppRoutes.js**: Клиентская маршрутизация (5 маршрутов)

| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/` (index) | `Home` | Главная: управление руководителями и исполнителями |
| `/goals` | `GoalsPage` | Цели: карточки с прогрессом, проектами и задачами |
| `/projects` | `ProjectsPage` | Проекты: создание, выбор цели, отображение |
| `/tasks` | `TasksPage` | Задачи: CRUD с выбором проекта, исполнителя, статуса, приоритета |
| `/time` | `TimeEntriesPage` | Учёт времени: запись часов по задачам и исполнителям |

- **src/components/**: React Class Components (JavaScript)
  - `Layout.js` — корневой layout с `<NavMenu />` + `<Container>`
  - `NavMenu.js` — навигационная панель (reactstrap Navbar): Главная, Цели, Проекты, Задачи, Время
  - `Home.js` — отображает таблицы Leaders и Executors, формы добавления
  - `GoalsPage.js` — аккордеон целей с вложенными проектами/задачами, прогресс-бары
  - `ProjectsPage.js` — форма создания проекта с выбором цели, список проектов
  - `TasksPage.js` — полный CRUD задач: выбор проекта, исполнителя, статуса, приоритета
  - `TimeEntriesPage.js` — создание записей учёта времени (шаг 0.25h), просмотр
- **src/api/client.js**: API-клиент (см. раздел «Клиентский API»)
- **public/**: Статические ресурсы и `index.html`
- **setupProxy.js**: Dev-прокси для `/api/*` → ASP.NET backend
- **package.json**: npm-зависимости и скрипты (React 18, React Router 6, Reactstrap, Bootstrap 5)
### Сущности доменной модели (`JiraClone.Data/Domain`)

#### Базовый класс: `BaseEntity`
| Поле | Тип | Описание |
|------|-----|----------|
| `Id` | `int` | Первичный ключ |
| `CreatedAt` | `DateTime` | Дата создания (автоустановка в `SaveChanges`) |
| `UpdatedAt` | `DateTime` | Дата обновления (автообновление в `SaveChanges`) |

#### `Goal` (Цель) — `JiraClone.Data/Domain/Entities/Goal.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Title` | `string` | Название цели |
| `Description` | `string?` | Описание (nullable) |
| `Progress` | `decimal` (вычисл.) | Среднее арифметическое `Progress` всех Projects (0 если нет) |
| `Projects` | `ICollection<Project>` | Связь 1:M → Project (Cascade) |

#### `Project` (Проект) — `JiraClone.Data/Domain/Entities/Project.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Title` | `string` | Название проекта |
| `Description` | `string?` | Описание (nullable) |
| `GoalId` | `int` | FK → Goal |
| `Goal` | `Goal?` | Навигационное свойство |
| `Progress` | `decimal` (вычисл.) | % задач со статусом `Done`; 0 если задач нет |
| `Tasks` | `ICollection<TaskItem>` | Связь 1:M → TaskItem (Cascade) |

#### `TaskItem` (Задача) — `JiraClone.Data/Domain/Entities/TaskItem.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Title` | `string` | Название задачи |
| `Description` | `string?` | Описание (nullable) |
| `Status` | `TaskStatus` | Статус: `ToDo`, `InProgress`, `Done`, `Canceled` (по умолчанию `ToDo`) |
| `Priority` | `TaskPriority` | Приоритет: `Low`, `Medium`, `High`, `Critical` (по умолчанию `Medium`) |
| `ProjectId` | `int` | FK → Project |
| `Project` | `Project?` | Навигационное свойство |
| `ExecutorId` | `int?` | FK → Executor (nullable) |
| `Executor` | `Executor?` | Навигационное свойство |
| `Comments` | `ICollection<Comment>` | Связь 1:M → Comment (Cascade) |
| `TimeEntries` | `ICollection<TimeEntry>` | Связь 1:M → TimeEntry (Cascade) |

#### `Executor` (Исполнитель) — `JiraClone.Data/Domain/Entities/Executor.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Name` | `string` | Имя исполнителя |
| `Email` | `string` | Email |
| `Tasks` | `ICollection<TaskItem>` | Назначенные задачи (SetNull при удалении) |

#### `Leader` (Ответственное лицо) — `JiraClone.Data/Domain/Entities/Leader.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Name` | `string` | Имя |
| `Email` | `string` | Email |

*Не имеет навигационных связей — изолированная справочная сущность.*

#### `Comment` (Комментарий) — `JiraClone.Data/Domain/Entities/Comment.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Text` | `string` | Текст комментария |
| `TaskItemId` | `int` | FK → TaskItem |
| `TaskItem` | `TaskItem?` | Навигационное свойство |
| `AuthorId` | `int` | FK → Executor |
| `Author` | `Executor?` | Автор комментария |

#### `TimeEntry` (Запись учёта времени) — `JiraClone.Data/Domain/Entities/TimeEntry.cs`
| Поле | Тип | Описание |
|------|-----|----------|
| `Hours` | `decimal(18,2)` | Количество часов |
| `Date` | `DateTime` | Дата записи (по умолчанию `DateTime.UtcNow`) |
| `TaskItemId` | `int` | FK → TaskItem |
| `TaskItem` | `TaskItem?` | Навигационное свойство |
| `ExecutorId` | `int` | FK → Executor |
| `Executor` | `Executor?` | Навигационное свойство |

#### Перечисления (`Domain/Enums`)
| Enum | Значения |
|------|----------|
| `TaskStatus` | `ToDo`, `InProgress`, `Done`, `Canceled` |
| `TaskPriority` | `Low`, `Medium`, `High`, `Critical` |

#### ER-диаграмма связей
```
Goal ──1:M──> Project ──1:M──> TaskItem ──1:M──> Comment
                                    │                │
                                    │ 1:M            │ M:1 Author
                                    ▼                ▼
                              TimeEntry ◄─────── Executor
                                    │                │
                                    │ M:1 Executor   │ 1:M Tasks (SetNull)
                                    └──────┬─────────┘
                                           │
                                     TaskItem.ExecutorId
```

#### Правила каскадного удаления (`AppDbContext.OnModelCreating`)
| Родитель → Дочерний | FK | Delete Behavior |
|---------------------|-----|-----------------|
| Goal → Project | `GoalId` | **Cascade** |
| Project → TaskItem | `ProjectId` | **Cascade** |
| TaskItem → Comment | `TaskItemId` | **Cascade** |
| TaskItem → TimeEntry | `TaskItemId` | **Cascade** |
| Executor → TaskItem | `ExecutorId` | **SetNull** |
| Executor → Comment | `AuthorId` | **Restrict** |
| Executor → TimeEntry | `ExecutorId` | **Cascade** |
-### Key Integration Points
1. **SPA Proxy**: The .csproj file uses Microsoft.AspNetCore.SpaProxy to proxy React dev server during development
2. **Build Pipeline**: During publish, React is built (`npm run build`) and output is copied to `wwwroot/` for serving as static files
3. **API Routing**: Backend serves `/api/*` routes; React SPA is fallback route via `MapFallbackToFile("index.html")`
4. **Forwarded Headers**: Program.cs configures X-Forwarded-For/X-Forwarded-Proto for reverse proxy support (e.g., Nginx)

## Development Commands

### Backend (ASP.NET Core)
```bash
# Restore dependencies and build the solution
dotnet build

# Run the ASP.NET Core application (serves on https://localhost:7000 or similar)
dotnet run

# Publish production build
dotnet publish -c Release
```

### Frontend (React in ClientApp/)
```bash
# Install dependencies
npm install

# Start development server with hot reload (proxy configured for /api calls)
# prestart runs aspnetcore-https.js and aspnetcore-react.js to configure dev HTTPS certs
npm start

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm run test
```

### Full Stack Development
From the root directory, running `dotnet run` in the AspNetReactApp folder will:
1. Automatically invoke npm install if node_modules is missing (via MSBuild target)
2. Start the ASP.NET Core application
3. The SPA proxy routes React dev server calls automatically

During development:
- React dev server runs on `https://localhost:44418`
- ASP.NET backend runs on `https://localhost:7000` (or similar)
- API calls are proxied via setupProxy.js in development
- In production, React is pre-built and served as static files from wwwroot/

## Docker & Containerization

### Dockerfile
Multi-stage build:
1. **build stage**: Uses `mcr.microsoft.com/dotnet/sdk:8.0`, installs Node.js 20, builds .NET and React
2. **publish stage**: Publishes .NET application
3. **final stage**: Uses `mcr.microsoft.com/dotnet/aspnet:8.0`, runs on port 5000

### docker-compose.yml
Services:
- **db**: PostgreSQL 16-alpine container
  - Database: TestAiNvkzDb
  - Credentials: test / test_password (note: change in production)
  - Port: 5432
  - Volumes: postgres_data (persists data)
- **web**: ASP.NET React application
  - Built from ./Dockerfile
  - Depends on db service
  - Port: 5000
  - Environment: ASPNETCORE_ENVIRONMENT=Production

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/docker-publish.yml`)
Trigger: Push to main branch, PRs to main, version tags (v*.*.*)
- Builds Docker image from `./AspNetReactApp` context
- Pushes to GitHub Container Registry (ghcr.io)
- Uses Docker's layer caching (type=gha)
- Automated on releases and pull requests

## Build & Deployment Flow

### Development Build
```
dotnet build
  ↓
MSBuild target checks for node_modules
  ↓
npm install (if needed)
  ↓
React dev server configured via setupProxy.js
  ↓
ASP.NET SPA proxy routes to React on :44418
```

### Production Build
```
dotnet publish -c Release
  ↓
npm install + npm run build
  ↓
React output (./build/) copied to wwwroot/
  ↓
Static files served directly by ASP.NET
  ↓
API routes (/api/*) handled by controllers
  ↓
Fallback to index.html for SPA routing
```

### Docker Build
```
Docker build (multi-stage from AspNetReactApp/)
  ↓
SDK stage: dotnet restore + build + publish
  ↓
Final stage: copy published app
  ↓
Kestrel on port 5000
```

## Project File Configuration Notes

### AspNetReactApp.csproj
- `<TargetFramework>net8.0</TargetFramework>`: .NET 8 target
- `<Nullable>enable</Nullable>`: Nullable reference types enabled
- `<SpaRoot>ClientApp\</SpaRoot>`: React app location
- `<SpaProxyServerUrl>https://localhost:44418</SpaProxyServerUrl>`: Dev proxy URL
- `<ImplicitUsings>enable</ImplicitUsings>`: Top-level statements and implicit usings
- MSBuild targets:
  - `DebugEnsureNodeEnv` (before Build in Debug): Checks Node.js, runs npm install
  - `PublishRunWebpack` (after ComputeFilesToPublish): Runs npm build, copies output to wwwroot

## Environment Configuration
- **Development**: Uses appsettings.Development.json (enhanced logging for SpaProxy)
- **Production**: Uses appsettings.json (minimal logging)
- **Docker**: Sets ASPNETCORE_ENVIRONMENT=Production in docker-compose.yml
- **Database Connection**: Currently configured in docker-compose.yml; can be moved to appsettings.json as needed

## Key Dependencies

### NuGet Packages
- Microsoft.AspNetCore.SpaProxy (8.0.0): Enables React dev server proxying

### npm Packages (Frontend)
- react (18.2.0), react-dom (18.2.0)
- react-router-dom (6.11.0): Client-side routing
- reactstrap (9.1.9), bootstrap (5.2.3): UI framework
- workbox-* (6.5.4): Service worker caching for PWA
- oidc-client (1.11.5): OpenID Connect authentication support
- jest, eslint: Testing and linting (via react-scripts)

## Important Notes for Future Development

1. **API Contracts**: Controllers return data that React components fetch via `/api/` routes (example: WeatherForecastController)
2. **Proxy Configuration**: setupProxy.js handles development-only proxy; production doesn't need it
3. **Database Migrations**: Настроены EF Core миграции в проекте `JiraClone.Data` (папка `Migrations/`); для управления используйте `ef-migrate.bat`
4. **Authentication**: oidc-client is installed but not yet integrated; OAuth/OIDC setup may be in progress
5. **Forwarded Headers**: Essential for deployment behind reverse proxies (Nginx, etc.); already configured in Program.cs
6. **PWA Features**: Workbox is included; service worker registration available (serviceWorkerRegistration.js)
7. **Environment Variables**: React uses REACT_APP_* prefix; see ClientApp/.env files for examples
