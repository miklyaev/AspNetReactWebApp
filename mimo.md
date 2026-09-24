# Предложения по развитию проекта AspNetReactWebApp (JiraClone)

> Дата: 2026-08-14  
> Статус: Предложения по результатам анализа кодовой базы

---

## Содержание

1. [Критические проблемы (исправить немедленно)](#1-критические-проблемы)
2. [Безопасность](#2-безопасность)
3. [Архитектура Backend](#3-архитектура-backend)
4. [Архитектура Frontend](#4-архитектура-frontend)
5. [Инфраструктура и DevOps](#5-инфраструктура-и-devops)
6. [Тестирование](#6-тестирование)
7. [Производительность](#7-производительность)
8. [Функциональность из UI-спецификации](#8-функциональность-из-ui-спецификации)
9. [Документация](#9-документация)
10. [Долгосрочная дорожная карта](#10-долгосрочная-дорожная-карта)

---

## 1. Критические проблемы

### 1.1 Несовпадение имени БД в docker-compose

**Проблема**: `docker-compose.yml` задаёт `POSTGRES_DB=TestDb` (строка 9), но connection string в `Program.cs` использует `Database=TestAiNvkzDb` (строка 27). При первом запуске PostgreSQL создаст БД `TestDb`, а приложение будет искать `TestAiNvkzDb` — подключение упадёт.

**Решение**: привести к единому имени. Рекомендуется использовать переменную окружения:

```yaml
# docker-compose.yml
environment:
  POSTGRES_DB: ${DB_NAME:-TestAiNvkzDb}
```

### 1.2 Несовместимость CI-pipeline и Dockerfile

**Проблема**: `docker-publish.yml` (строка 42) задаёт `context: ./AspNetReactApp`, но `Dockerfile` (строка 11) копирует `AspNetReactApp.slnx` из корня репозитория. Сборка Docker-образа через CI упадёт.

**Решение**: два варианта:
- **Вариант А**: Изменить контекст в workflow на корень репозитория (`context: .`)
- **Вариант Б**: Переместить Dockerfile в `AspNetReactApp/` и обновить пути

### 1.3 Мусорный текст в JSX

**Проблема**: `TimeEntriesPage.js` содержит случайный текст:
**Проблема**: `TimeEntriesPage.js` содержит случайный текст
- Строка 155: `"Я знаю"` внутри div**Решение**: нудалено.х

**Проблема**: `Executor.cs` (строка 8) и `Leader.cs` (строка 7) содержат поле `Password`, которое дублирует `PasswordHash` из базового `Employee`. Эти мёртвые поля мигрируют в БД как отдельные колонки.

**Решение**: удалить `Password` из `Executor` и `Leader`, создать миграцию для удаления колонок.

---

## 2. Безопасность

### 2.1 Дефолтный admin-пароль

**Проблема**: `AuthController.cs` (строка 37) использует `SimpleJira` как пароль по умолчанию, если переменная `ADMIN_PASSWORD` не задана.

**Решение**:
- Сделать `ADMIN_PASSWORD` обязательной переменной окружения (приложение падает при старте без неё)
- Или генерировать случайный пароль при первом запуске и выводить в лог
- Добавить проверку сложности пароля

### 2.2 Rate limiting на авторизацию

**Проблема**: Нет защиты от brute-force на эндпоинт `/api/auth/login`.

**Решение**:
```csharp
// Program.cs
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("login", opts => {
        opts.PermitLimit = 5;
        opts.Window = TimeSpan.FromMinutes(1);
    });
});
```

Применить к `AuthController.Login()` через `[EnableRateLimiting("login")]`.

### 2.3 CSRF-защита

**Проблема**: Нет анти-CSRF токенов при использовании cookie-based аутентификации.

**Решение**: добавить `builder.Services.AddAntiforgery()` и валидацию токена на state-changing эндпоинтах (POST/PUT/DELETE).

### 2.4 Авторизация на GET-эндпоинты

**Проблема**: Некоторые GET-эндпоинты не защищены:
- `TasksController.GetTasks()`
- `ExecutorsController.GetExecutors()`
- `LeadersController.GetLeaders()`
- `CommentsController.GetComments()`

**Решение**: добавить `[Authorize]` на все эндпоинты, содержащие пользовательские данные. Публичные данные (если нужны) вынести в отдельный контроллер.

### 2.5 SameSite cookie

**Проблема**: `SameSite=None` на аутентификационной cookie (`Program.cs` строка 31) делает её уязвимой для CSRF в кросс-сайтовых сценариях.

**Решение**: использовать `SameSite=Lax` для большинства сценариев. `Strict` для повышенной безопасности.

---

## 3. Архитектура Backend

### 3.1 Разделение DbService на репозитории

**Проблема**: `DbService.cs` (226 строк) — «God Service», содержащий все CRUD-операции. Нарушает Single Responsibility Principle.

**Решение**: ввести паттерн Repository + Unit of Work:

```
Domain/
  Interfaces/
    ITaskRepository.cs
    IProjectRepository.cs
    IGoalRepository.cs
    IEmployeeRepository.cs
    ICommentRepository.cs
    ITimeEntryRepository.cs
    IUnitOfWork.cs
Infrastructure/
  Repositories/
    TaskRepository.cs
    ProjectRepository.cs
    ...
    UnitOfWork.cs
```

**Альтернатива**: если проект небольшой, можно оставить `IDbService`, но разбить на несколько сервисов: `ITaskService`, `IProjectService`, `IGoalService`.

### 3.2 Application Service Layer

**Проблема**: контроллеры содержат бизнес-логику (валидация, маппинг, проверки существования). Дублирование в `TasksController` (строки 53–66 и 96–109).

**Решение**: ввести слой Application Services:

```
Application/
  Services/
    TaskAppService.cs      // бизнес-логика задач
    ProjectAppService.cs   // бизнес-логика проектов
  DTOs/
    TaskDto.cs
    CreateTaskDto.cs
  Validators/
    CreateTaskValidator.cs  // FluentValidation
```

### 3.3 Устранение дублирования валидации

**Проблема**: проверка существования проекта и исполнителя повторяется в `TasksController.CreateTask()` и `TasksController.UpdateTask()`.

**Решение**: вынести в отдельный метод или использовать FluentValidation:

```csharp
public class CreateTaskValidator : AbstractValidator<CreateTaskDto> {
    public CreateTaskValidator(IProjectRepository projects, IEmployeeRepository employees) {
        RuleFor(x => x.ProjectId)
            .MustAsync(projects.ExistsAsync)
            .WithMessage("Проект не найден");
        RuleFor(x => x.ExecutorId)
            .MustAsync(employees.ExistsAsync)
            .WithMessage("Исполнитель не найден");
    }
}
```

### 3.4 Исправление ProfileController

**Проблема**: `ProfileController` инжектит `AppDbContext` напрямую (строка 17), а не `IDbService`. Нарушает консистентность.

**Решение**: перенести логику профилей в `DbService` или отдельный `IProfileService`.

### 3.5 Привести Request/Response модели в порядок

**Проблема**: модели запросов определены как nested classes внутри контроллеров (например, `TasksController.TaskRequest`).

**Решение**: вынести в `Models/Requests/` и `Models/Responses/` для переиспользования и документирования в Swagger.

### 3.6 Добавить Swagger/OpenAPI

**Проблема**: Нет API-документации. Нет `Swashbuckle` в зависимостях.

**Решение**:
```bash
dotnet add AspNetReactApp package Swashbuckle.AspNetCore
```

```csharp
// Program.cs
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new() { Title = "JiraClone API", Version = "v1" });
});
```

---

## 4. Архитектура Frontend

### 4.1 Миграция на Functional Components + Hooks

**Проблема**: Весь фронтенд на class components. React 18 рекомендует hooks.

**Решение** (поэтапно):
1. Начать с маленьких компонентов (`NavMenu`, `Layout`)
2. Переписать `Home.js` (626 строк) — самый большой компонент
3. Переписать `TasksPage.js`, `TaskDetailModal.js`
4. Последним — `App.js`

**Пример миграции Layout**:
```jsx
// Было (class component):
class Layout extends Component {
  state = { me: null };
  componentDidMount() { this.loadMe(); }
  forceUpdate() { ... } // антипаттерн
}

// Стало (hooks):
function Layout() {
  const [me, setMe] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { loadMe().then(setMe); }, [tick]);
  return <MeContext.Provider value={{ me, refresh: () => setTick(t => t + 1) }}>...</MeContext.Provider>;
}
```

### 4.2 Context API вместо cloneElement

**Проблема**: `me` (текущий пользователь) передаётся через `React.cloneElement` хак в `Layout.js` (строки 64–87). Это антипаттерн, который ломает приоритеты рендеринга React 18.

**Решение**: создать `AuthContext`:

```jsx
// contexts/AuthContext.js
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const refresh = useCallback(async () => {
    const user = await getMe();
    setMe(user);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ me, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4.3 Разбить монолитные компоненты

**Проблема**: `Home.js` (626 строк) содержит таблицы Leaders/Executors, формы добавления и модальное окно редактирования. Нарушает Single Responsibility.

**Решение**:
```
components/
  Home/
    Home.js               // компоновка
    LeadersTable.js        // таблица лидеров
    ExecutorsTable.js      // таблица исполнителей
    EmployeeForm.js        // форма добавления
    EmployeeEditModal.js   // модальное редактирование
  Tasks/
    TasksPage.js
    TaskCard.js
    TaskFilters.js
    TaskDetailModal.js
```

### 4.4 Удалить мусор

- `FetchData.js` — не используется ни одним маршрутом
- `Counter.js` — не используется ни одним маршрутом
- `setupProxy.js` строка 8: прокси-путь `/weatherforecast` от CRA-шаблона
- `oidc-client` в `package.json` — не используется
- `jQuery` в `package.json` — не используется

### 4.5 Добавить глобальное состояние / data-fetching

**Проблема**: Нет кеширования API-запросов, нет retry-логики, нет оптимистичных обновлений.

**Решение**: внедрить **React Query** (TanStack Query):

```bash
npm install @tanstack/react-query
```

```jsx
// api/hooks.js
export function useTasks(filters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
    staleTime: 30_000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
```

### 4.6 Lazy loading маршрутов

**Проблема**: Все компоненты загружаются сразу. Спецификация (`UI_spec.md`) требует lazy loading.

**Решение**:
```jsx
// AppRoutes.js
import { lazy, Suspense } from 'react';

const GoalsPage = lazy(() => import('./components/GoalsPage'));
const TasksPage = lazy(() => import('./components/TasksPage'));
const ProjectsPage = lazy(() => import('./components/ProjectsPage'));
const TimeEntriesPage = lazy(() => import('./components/TimeEntriesPage'));

// В Layout:
<Suspense fallback={<Spinner />}>
  <Outlet />
</Suspense>
```

### 4.7 TypeScript

**Проблема**: Весь фронтенд на JavaScript без типизации.

**Решение** (долгосрочное): миграция на TypeScript:
1. Переименовать `.js` → `.tsx` поэтапно
2. Начать с API-клиента и типов DTO
3. Добавить `tsconfig.json` с `strict: true`

---

## 5. Инфраструктура и DevOps

### 5.1 Исправить docker-compose

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-TestAiNvkzDb}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=db;Database=${DB_NAME:-TestAiNvkzDb};Username=${DB_USER:-postgres};Password=${DB_PASSWORD}
```

### 5.2 Добавить этап тестирования в CI

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet test --collect:"XPlat Code Coverage"
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd AspNetReactApp/ClientApp && npm ci && npm test -- --watchAll=false
```

### 5.3 Авто-миграции — контроль среды

**Проблема**: `await dbContext.Database.MigrateAsync()` применяется при каждом запуске, включая production.

**Решение**: применять миграции только в Development/Staging:

```csharp
if (app.Environment.IsDevelopment() || app.Environment.IsStaging()) {
    await dbContext.Database.MigrateAsync();
}
```

Для Production — отдельный скрипт/команда `dotnet ef database update` в CI/CD.

### 5.4 Healthchecks

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();

app.MapHealthChecks("/health");
```

---

## 6. Тестирование

### 6.1 Backend-тесты

**Текущее состояние**: 0 тестов.

**Рекомендуемый набор**:

```
tests/
  JiraClone.UnitTests/
    Services/
      TaskServiceTests.cs
      AuthServiceTests.cs
    Controllers/
      TasksControllerTests.cs
      AuthControllerTests.cs
  JiraClone.IntegrationTests/
    CustomWebApplicationFactory.cs
    Controllers/
      TasksControllerTests.cs    // in-memory БД
      AuthControllerTests.cs
```

**Приоритеты**:
1. Unit-тесты на `AuthController.Login()` — критичная бизнес-логика
2. Unit-тесты на валидацию в `TasksController`
3. Интеграционные тесты CRUD-операций

**Инструменты**: xUnit + Moq + FluentAssertions + Microsoft.AspNetCore.Mvc.Testing

### 6.2 Frontend-тесты

**Текущее состояние**: 1 smoke-тест.

**Рекомендуемый набор**:
1. Unit-тесты для API-клиента (`api/client.js`)
2. Unit-тесты для хуков (после миграции на hooks)
3. Компонентные тесты через React Testing Library
4. E2E-тесты через Playwright (критичные сценарии: логин, создание задачи)

---

## 7. Производительность

### 7.1 Пагинация

**Проблема**: `DbService.GetGoalsAsync()` загружает все цели со всеми проектами и задачами. `DbService.GetTasksAsync()` — все задачи. При росте данных — деградация.

**Решение**:
```csharp
public async Task<PagedResult<TaskItem>> GetTasksAsync(int page, int pageSize, TaskFilter filter) {
    var query = _context.Tasks
        .Include(t => t.Executor)
        .Include(t => t.Project)
        .AsQueryable();
    
    // Применить фильтры
    if (filter.Status.HasValue) query = query.Where(t => t.Status == filter.Status);
    
    var total = await query.CountAsync();
    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
    
    return new PagedResult<TaskItem>(items, total, page, pageSize);
}
```

### 7.2 Индексы

**Проблема**: Нет индекса на `Employee.Login` — при каждом логине сканируется вся таблица.

**Решение**:
```csharp
// AppDbContext.cs
modelBuilder.Entity<Employee>()
    .HasIndex(e => e.Login)
    .IsUnique();
```

### 7.3 Оптимизация Progress-вычислений

**Проблема**: `Project.Progress` и `Goal.Progress` вычисляются через загрузку всех связанных сущностей.

**Решение**: вынести в SQL-выражение или вычислять при запросе:

```csharp
// Вместо загрузки всех задач:
modelBuilder.Entity<Project>()
    .Property(p => p.Progress)
    .HasComputedColumnSql(
        "CASE WHEN \"TasksCount\" = 0 THEN 0 ELSE (\"DoneCount\" * 100 / \"TasksCount\") END",
        stored: true);
```

Или использовать projection:

```csharp
var projects = await _context.Projects
    .Select(p => new ProjectDto {
        Id = p.Id,
        Name = p.Name,
        Progress = p.Tasks.Any() 
            ? (int)(p.Tasks.Count(t => t.Status == TaskStatus.Done) * 100.0 / p.Tasks.Count())
            : 0
    })
    .ToListAsync();
```

### 7.4 Login-оптимизация

**Проблема**: `AuthController.Login()` загружает всех лидеров/исполнителей в память для поиска по логину.

**Решение**: один запрос с фильтрацией на уровне БД:

```csharp
var employee = await _context.Employees
    .FirstOrDefaultAsync(e => e.Login == request.Login);
```

---

## 8. Функциональность из UI-спецификации

Следующие требования из `UI_spec.md` не реализованы. Рекомендуемый порядок внедрения:

### 8.1 Приоритет 1 (базовый функционал)

| Функция | Строки в spec | Сложность |
|---|---|---|
| Dashboard (домашняя страница с аналитикой) | 206–243 | Средняя |
| Фильтрация и сортировка задач | 312–340 | Низкая |
| Поиск по задачам | 368 | Низкая |
| Отображение дедлайнов и статусов | 341–367 | Низкая |

### 8.2 Приоритет 2 (улучшение UX)

| Функция | Строки в spec | Сложность |
|---|---|---|
| Kanban-доска (Board View) | 277–285 | Высокая |
| Drag & Drop на доске | 288–291 | Высокая |
| Skeleton loading | 491 | Низкая |
| Responsive design | 456–467 | Средняя |
| Accordion-first UX для Goals | 578 | Средняя |

### 8.3 Приоритет 3 (расширенный функционал)

| Функция | Строки в spec | Сложность |
|---|---|---|
| Таймер задач (TimerWidget) | 406–411 | Средняя |
| Тёмная тема | 480 | Средняя |
| Уведомления | 430–445 | Высокая |
| Экспорт данных (CSV/PDF) | 510–520 | Средняя |

---

## 9. Документация

### 9.1 Добавить немедленно

- **Swagger UI** — автоматическая документация API (см. п. 3.6)
- **README.md** в корне — краткое описание проекта, как запустить, стек технологий
- **.env.example** — пример файла окружения с комментариями

### 9.2 Добавить постепенно

- **CHANGELOG.md** — журнал изменений
- **XML-комментарии** к контроллерам и DTO (для Swagger)
- **JSDoc / TSDoc** к React-компонентам
- **ADR (Architecture Decision Records)** — для фиксации архитектурных решений

---

## 10. Долгосрочная дорожная карта

### Этап 1: Стабилизация (1–2 недели)

- [ ] Исправить критические проблемы (п. 1)
- [ ] Исправить проблемы безопасности (п. 2.1–2.3)
- [ ] Удалить мусор из кодовой базы (п. 4.4)
- [ ] Добавить Swagger
- [ ] Добавить healthchecks

### Этап 2: Качество (2–4 недели)

- [ ] Разделить DbService на репозитории/сервисы (п. 3.1–3.2)
- [ ] Добавить unit-тесты backend (п. 6.1)
- [ ] Добавить пагинацию (п. 7.1)
- [ ] Добавить rate limiting (п. 2.2)
- [ ] Исправить docker-compose (п. 5.1)
- [ ] Добавить тесты в CI (п. 5.2)

### Этап 3: Модернизация Frontend (3–5 недель)

- [ ] Миграция на Functional Components (п. 4.1)
- [ ] Context API вместо cloneElement (п. 4.2)
- [ ] React Query для data-fetching (п. 4.5)
- [ ] Lazy loading маршрутов (п. 4.6)
- [ ] Разбить монолитные компоненты (п. 4.3)
- [ ] Компонентные тесты (п. 6.2)

### Этап 4: Функциональность (4–8 недель)

- [ ] Dashboard с аналитикой (п. 8.1)
- [ ] Фильтрация и поиск задач (п. 8.1)
- [ ] Kanban-доска с Drag & Drop (п. 8.2)
- [ ] Responsive design (п. 8.2)

### Этап 5: Продвинутые возможности (8+ недель)

- [ ] Миграция на TypeScript (п. 4.7)
- [ ] Тёмная тема (п. 8.3)
- [ ] Уведомления (WebSocket/SSE) (п. 8.3)
- [ ] E2E-тесты (Playwright)
- [ ] CQRS / Event Sourcing (по необходимости)
- [ ] Микросервисная архитектура (по необходимости)

---

## Сводка: топ-5 быстрых побед

| # | Действие | Время | Эффект |
|---|---|---|---|
| 1 | Исправить `docker-compose.yml` (имя БД) | 10 мин | Docker запускается |
| 2 | Удалить мусор (`FetchData.js`, `Counter.js`, текст в JSX) | 15 мин | Чистая кодовая база |
| 3 | Добавить `[Authorize]` на незащищённые GET | 20 мин | Базовая безопасность |
| 4 | Убрать дефолтный admin-пароль | 30 мин | Защита от взлома |
| 5 | Добавить Swagger | 1 час | API-документация |
