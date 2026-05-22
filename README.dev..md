## Project Overview

**AspNetReactWebApp** is a full-stack web application combining:
- **Backend**: ASP.NET Core 8.0 with C# (.NET 8.0)
- **Frontend**: React 18.2.0 with Create React App (TypeScript 4.9.5)
- **Database**: PostgreSQL 16 (via Docker)
- **Infrastructure**: Docker & Docker Compose for containerization, GitHub Actions for CI/CD

This is a monorepo structure with a single .slnx solution containing the main ASP.NET Core project.

## Architecture Overview

### Backend Structure (`AspNetReactApp/`)
- **Program.cs**: Minimal hosting configuration using ASP.NET Core 8.0's top-level statements
- **Controllers/**: API endpoints (example: `WeatherForecastController` demonstrating REST API pattern)
- **Pages/**: Razor Pages for error handling (Error.cshtml, Error.cshtml.cs)
- **appsettings.json / appsettings.Development.json**: Configuration for logging and runtime settings
- **AspNetReactApp.csproj**: Web SDK project file configured with SPA proxy for React development
  - SPA Root: `ClientApp/`
  - SPA Proxy URL: `https://localhost:44418`
  - Auto-restores npm dependencies during Debug build

### Frontend Structure (`AspNetReactApp/ClientApp/`)
- **src/index.js**: Entry point for React application
- **src/App.js**: Root React component with routing setup
- **src/AppRoutes.js**: Client-side route definitions
- **src/components/**: React functional components
  - `Layout.js`: Page layout wrapper with navigation
  - `NavMenu.js`: Navigation component (with NavMenu.css)
  - `Counter.js`: Stateful counter demo
  - `FetchData.js`: Data fetching from backend API demo
  - `Home.js`: Landing page component
- **public/**: Static assets and index.html template
- **setupProxy.js**: Development proxy configuration (routes API calls to ASP.NET backend on localhost:7000+)
- **package.json**: npm dependencies and scripts (React Router, Bootstrap 5.2, Reactstrap, Workbox PWA libs)

### Сущности доменной модели (`JiraClone.Data/Domain`)
- BaseEntity: Id, CreatedAt, UpdatedAt (таймстемпы автоматически обновляются в SaveChanges/SaveChangesAsync)
- Goal: Title, Description, Projects, вычисляемый Progress (среднее Progress проектов)
- Project: Title, Description, GoalId → Goal, Tasks, вычисляемый Progress (% задач со статусом Done)
- TaskItem: Title, Description, Status (TaskStatus), Priority (TaskPriority), ProjectId → Project, ExecutorId → Executor, Comments, TimeEntries
- Executor: Name, Email, Tasks
- Comment: Text, TaskItemId → TaskItem, AuthorId → Executor
- TimeEntry: Hours (decimal 18,2), Date, TaskItemId → TaskItem, ExecutorId → Executor

Перечисления (`Domain/Enums`):
- TaskStatus: ToDo, InProgress, Done, Canceled
- TaskPriority: Low, Medium, High, Critical

Связи и правила удаления (см. AppDbContext.OnModelCreating):
- Goal 1:M Projects — Cascade
- Project 1:M Tasks — Cascade
- TaskItem 1:M Comments — Cascade
- TaskItem 1:M TimeEntries — Cascade
- Executor 1:M Tasks — SetNull
- Executor 1:M Comments — Restrict
- Executor 1:M TimeEntries — Cascade
- 
### Key Integration Points
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

