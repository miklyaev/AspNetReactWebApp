## Описание

Система представляет собой упрощённый аналог Jira.

Иерархия предметной области:

```text
Цель (Goal)
 └── Проект (Project)
      └── Задача (TaskItem)
```

Основные возможности:

- учет целей
- учет проектов
- управление задачами
- назначение исполнителей
- комментарии к задачам
- минималистичный трекинг времени
- расчет прогресса целей и проектов

---

# Технологический стек

- ASP.NET Core
- Entity Framework Core
- PostgreSQL
- Code First
- Dependency Injection
- EF Core Migrations

---

# Структура проекта

```text
/src
 ├── Domain
 │    ├── Entities
 │    ├── Enums
 │    └── Interfaces
 │
 ├── Infrastructure
 │    ├── Db
 │    │     ├── AppDbContext.cs
 │    │     ├── Configurations
 │    │     └── DbService.cs
 │    │
 │    └── Migrations
 │
 └── Api
```

---

# Доменная модель

# Goal

Цель верхнего уровня.

## Поля

| Поле | Тип |
|---|---|
| Id | Guid |
| Title | string |
| Description | string |
| CreatedAt | DateTime |
| UpdatedAt | DateTime |

## Связи

- Goal -> Projects (1:M)

## Прогресс

Прогресс цели вычисляется автоматически:

```text
GoalProgress =
Среднее значение прогресса всех Project
```

---

# Project

Проект внутри цели.

## Поля

| Поле | Тип |
|---|---|
| Id | Guid |
| GoalId | Guid |
| Title | string |
| Description | string |
| CreatedAt | DateTime |
| UpdatedAt | DateTime |

## Связи

- Project -> Goal (M:1)
- Project -> Tasks (1:M)

## Прогресс

```text
ProjectProgress =
Среднее значение прогресса всех TaskItem
```

---

# TaskItem

Основная рабочая сущность.

## Поля

| Поле | Тип |
|---|---|
| Id | Guid |
| ProjectId | Guid |
| AssigneeId | Guid |
| Title | string |
| Description | string |
| Status | TaskStatus |
| Priority | TaskPriority |
| PlannedHours | decimal |
| SpentHours | decimal |
| ProgressPercent | int |
| CreatedAt | DateTime |
| UpdatedAt | DateTime |
| DueDate | DateTime? |

## Связи

- TaskItem -> Project (M:1)
- TaskItem -> Executor (M:1)
- TaskItem -> Comments (1:M)
- TaskItem -> TimeEntries (1:M)

## Правила прогресса

| Статус | ProgressPercent |
|---|---|
| New | 0 |
| InProgress | 1-99 |
| Done | 100 |

---

# Executor

Исполнитель задач.

## Обязательные поля

| Поле | Тип |
|---|---|
| Id | Guid |
| LastName | string |
| FirstName | string |
| MiddleName | string |
| Position | string |
| Email | string |
| CreatedAt | DateTime |

## Связи

- Executor -> Tasks (1:M)

---

# Comment

Комментарии к задаче.

Комментарий может оставить любой пользователь.

## Поля

| Поле | Тип |
|---|---|
| Id | Guid |
| TaskItemId | Guid |
| AuthorName | string |
| Message | string |
| CreatedAt | DateTime |

## Связи

- Comment -> TaskItem (M:1)

---

# TimeEntry

Минимальный учет времени.

## Поля

| Поле | Тип |
|---|---|
| Id | Guid |
| TaskItemId | Guid |
| ExecutorId | Guid |
| SpentHours | decimal |
| WorkDate | DateTime |
| Comment | string |

## Связи

- TimeEntry -> TaskItem (M:1)
- TimeEntry -> Executor (M:1)

---

# ENUMS

# TaskStatus

```csharp
public enum TaskStatus
{
    New = 0,
    InProgress = 1,
    Done = 2,
    Cancelled = 3
}
```

---

# TaskPriority

```csharp
public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}
```

---

# Entity Framework Core Classes

# Goal.cs

```csharp
public class Goal
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
```

---

# Project.cs

```csharp
public class Project
{
    public Guid Id { get; set; }

    public Guid GoalId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Goal Goal { get; set; } = null!;

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
```

---

# TaskItem.cs

```csharp
public class TaskItem
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public Guid AssigneeId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public TaskStatus Status { get; set; }

    public TaskPriority Priority { get; set; }

    public decimal PlannedHours { get; set; }

    public decimal SpentHours { get; set; }

    public int ProgressPercent { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DueDate { get; set; }

    public Project Project { get; set; } = null!;

    public Executor Assignee { get; set; } = null!;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
```

---

# Executor.cs

```csharp
public class Executor
{
    public Guid Id { get; set; }

    public string LastName { get; set; } = null!;

    public string FirstName { get; set; } = null!;

    public string MiddleName { get; set; } = null!;

    public string Position { get; set; } = null!;

    public string Email { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
```

---

# Comment.cs

```csharp
public class Comment
{
    public Guid Id { get; set; }

    public Guid TaskItemId { get; set; }

    public string AuthorName { get; set; } = null!;

    public string Message { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public TaskItem TaskItem { get; set; } = null!;
}
```

---

# TimeEntry.cs

```csharp
public class TimeEntry
{
    public Guid Id { get; set; }

    public Guid TaskItemId { get; set; }

    public Guid ExecutorId { get; set; }

    public decimal SpentHours { get; set; }

    public DateTime WorkDate { get; set; }

    public string? Comment { get; set; }

    public TaskItem TaskItem { get; set; } = null!;

    public Executor Executor { get; set; } = null!;
}
```

---

# AppDbContext

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Goal> Goals => Set<Goal>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    public DbSet<Executor> Executors => Set<Executor>();

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Goal>()
            .HasMany(x => x.Projects)
            .WithOne(x => x.Goal)
            .HasForeignKey(x => x.GoalId);

        modelBuilder.Entity<Project>()
            .HasMany(x => x.Tasks)
            .WithOne(x => x.Project)
            .HasForeignKey(x => x.ProjectId);

        modelBuilder.Entity<TaskItem>()
            .HasOne(x => x.Assignee)
            .WithMany(x => x.Tasks)
            .HasForeignKey(x => x.AssigneeId);

        modelBuilder.Entity<TaskItem>()
            .HasMany(x => x.Comments)
            .WithOne(x => x.TaskItem)
            .HasForeignKey(x => x.TaskItemId);

        modelBuilder.Entity<TaskItem>()
            .HasMany(x => x.TimeEntries)
            .WithOne(x => x.TaskItem)
            .HasForeignKey(x => x.TaskItemId);

        modelBuilder.Entity<TimeEntry>()
            .HasOne(x => x.Executor)
            .WithMany(x => x.TimeEntries)
            .HasForeignKey(x => x.ExecutorId);
    }
}
```

---

# DbService

Все операции работы с базой данных должны быть вынесены в сервис:

```text
DbService
```

## Ответственность сервиса

- CRUD операции
- работа с транзакциями
- получение данных
- сохранение изменений
- агрегация прогресса
- работа с EF Core

---

# Пример интерфейса

```csharp
public interface IDbService
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    IQueryable<Goal> Goals { get; }

    IQueryable<Project> Projects { get; }

    IQueryable<TaskItem> Tasks { get; }

    IQueryable<Executor> Executors { get; }

    IQueryable<Comment> Comments { get; }

    IQueryable<TimeEntry> TimeEntries { get; }
}
```

---

# Пример реализации

```csharp
public class DbService : IDbService
{
    private readonly AppDbContext _context;

    public DbService(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Goal> Goals => _context.Goals;

    public IQueryable<Project> Projects => _context.Projects;

    public IQueryable<TaskItem> Tasks => _context.Tasks;

    public IQueryable<Executor> Executors => _context.Executors;

    public IQueryable<Comment> Comments => _context.Comments;

    public IQueryable<TimeEntry> TimeEntries => _context.TimeEntries;

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
```

---

# Подключение PostgreSQL

# NuGet Packages

```powershell
Install-Package Microsoft.EntityFrameworkCore
Install-Package Microsoft.EntityFrameworkCore.Design
Install-Package Npgsql.EntityFrameworkCore.PostgreSQL
```

---

# appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=simple_tracker;Username=postgres;Password=postgres"
  }
}
```

---

# Program.cs

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IDbService, DbService>();
```

---

# Package Manager Console

# Создание миграции

```powershell
Add-Migration InitialCreate
```

---

# Применение миграции

```powershell
Update-Database
```

---

# TODO

# Тесты

## Инфраструктурные

- [ ] Проверка подключения к PostgreSQL
- [ ] Проверка применения миграций
- [ ] Проверка создания DbContext
- [ ] Проверка DI регистрации DbService

## Unit Tests

- [ ] Создание Goal
- [ ] Создание Project
- [ ] Создание TaskItem
- [ ] Назначение Executor
- [ ] Добавление Comment
- [ ] Добавление TimeEntry

## Integration Tests

- [ ] Сохранение полного дерева Goal -> Project -> TaskItem
- [ ] Каскадное удаление
- [ ] Загрузка связанных сущностей
- [ ] Проверка вычисления прогресса проекта
- [ ] Проверка вычисления прогресса цели

## Дополнительно

- [ ] Soft Delete
- [ ] Audit logging
- [ ] RowVersion concurrency
- [ ] Seed начальных данных
- [ ] FluentValidation
- [ ] Docker Compose для PostgreSQL
- [ ] HealthChecks
- [ ] Swagger
- [ ] Repository Pattern при необходимости