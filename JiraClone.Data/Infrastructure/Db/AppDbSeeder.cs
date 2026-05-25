using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace JiraClone.Data.Infrastructure.Db;

public static class AppDbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        var passwordHasher = new PasswordHasher<Employee>();
        const string defaultPassword = "password1234";

        if (!await context.Leaders.AnyAsync())
        {
            var leaders = new List<Leader>
            {
                new() { Name = "Алексей Романов", Email = "alexey.romanov@example.com", Login = "alexey_roman" },
                new() { Name = "Екатерина Морозова", Email = "ekaterina.morozova@example.com", Login = "katya_moroz" }
            };

            foreach (var leader in leaders)
            {
                leader.PasswordHash = passwordHasher.HashPassword(leader, defaultPassword);
            }

            await context.Leaders.AddRangeAsync(leaders);
            await context.SaveChangesAsync();
        }
        if (await context.Goals.AnyAsync())
        {
            return;
        }

        var executors = new List<Executor>
        {
            new() { Name = "Анна Петрова", Email = "anna.petrov@example.com", Login = "anna_petrova" },
            new() { Name = "Иван Смирнов", Email = "ivan.smirnov@example.com", Login = "ivan_smirnov" },
            new() { Name = "Мария Кузнецова", Email = "maria.kuznetsova@example.com", Login = "masha_kuznet" }
        };

        foreach (var executor in executors)
        {
            executor.PasswordHash = passwordHasher.HashPassword(executor, defaultPassword);
        }

        await context.Executors.AddRangeAsync(executors);

        var goals = new List<Goal>
        {
            new()
            {
                Title = "Запуск MVP JiraClone",
                Description = "Собрать рабочий fullstack MVP с базовым управлением задачами"
            },
            new()
            {
                Title = "Повысить прозрачность разработки",
                Description = "Внедрить понятный учёт времени и контроль статусов по задачам"
            }
        };

        await context.Goals.AddRangeAsync(goals);
        await context.SaveChangesAsync();

        var projects = new List<Project>
        {
            new()
            {
                Title = "Backend API",
                Description = "CRUD API для целей, проектов, задач, времени и комментариев",
                GoalId = goals[0].Id
            },
            new()
            {
                Title = "Frontend UI",
                Description = "Экран целей, проектов, задач и времени с формами создания",
                GoalId = goals[0].Id
            },
            new()
            {
                Title = "Аналитика времени",
                Description = "Отчёты и контроль трудозатрат по исполнителям",
                GoalId = goals[1].Id
            }
        };

        await context.Projects.AddRangeAsync(projects);
        await context.SaveChangesAsync();

        var tasks = new List<TaskItem>
        {
            new()
            {
                Title = "Реализовать Goals API",
                Description = "Создать endpoints и валидацию для работы с целями",
                ProjectId = projects[0].Id,
                ExecutorId = executors[0].Id,
                Status = JiraClone.Data.Domain.Enums.TaskStatus.Done,
                Priority = TaskPriority.High
            },
            new()
            {
                Title = "Реализовать Tasks API",
                Description = "Поддержка создания и обновления задач с приоритетом и статусом",
                ProjectId = projects[0].Id,
                ExecutorId = executors[1].Id,
                Status = JiraClone.Data.Domain.Enums.TaskStatus.InProgress,
                Priority = TaskPriority.Critical
            },
            new()
            {
                Title = "Сделать страницу целей стартовой",
                Description = "Настроить маршрутизацию и главное меню на Goals",
                ProjectId = projects[1].Id,
                ExecutorId = executors[2].Id,
                Status = JiraClone.Data.Domain.Enums.TaskStatus.Done,
                Priority = TaskPriority.Medium
            },
            new()
            {
                Title = "Добавить страницу учёта времени",
                Description = "Форма создания time entry и список записей",
                ProjectId = projects[1].Id,
                ExecutorId = executors[0].Id,
                Status = JiraClone.Data.Domain.Enums.TaskStatus.InProgress,
                Priority = TaskPriority.High
            },
            new()
            {
                Title = "Собрать отчёт по времени за неделю",
                Description = "Проверить заполненность данных и общие трудозатраты",
                ProjectId = projects[2].Id,
                ExecutorId = executors[1].Id,
                Status = JiraClone.Data.Domain.Enums.TaskStatus.ToDo,
                Priority = TaskPriority.Medium
            }
        };
        await context.Tasks.AddRangeAsync(tasks);
        await context.SaveChangesAsync();

        var comments = new List<Comment>
        {
            new() { Text = "API для целей готово и покрыто тестовыми запросами.", TaskItemId = tasks[0].Id, AuthorId = executors[0].Id },
            new() { Text = "Проверяю edge cases для статусов задач.", TaskItemId = tasks[1].Id, AuthorId = executors[1].Id },
            new() { Text = "Главная страница теперь открывает цели по умолчанию.", TaskItemId = tasks[2].Id, AuthorId = executors[2].Id }
        };

        await context.Comments.AddRangeAsync(comments);

        var now = DateTime.UtcNow;
        var timeEntries = new List<TimeEntry>
        {
            new() { TaskItemId = tasks[0].Id, ExecutorId = executors[0].Id, Hours = 3.5m, Date = now.AddDays(-2) },
            new() { TaskItemId = tasks[1].Id, ExecutorId = executors[1].Id, Hours = 4.0m, Date = now.AddDays(-1) },
            new() { TaskItemId = tasks[2].Id, ExecutorId = executors[2].Id, Hours = 2.0m, Date = now.AddDays(-3) },
            new() { TaskItemId = tasks[3].Id, ExecutorId = executors[0].Id, Hours = 1.5m, Date = now.AddHours(-12) }
        };

        await context.TimeEntries.AddRangeAsync(timeEntries);
        await context.SaveChangesAsync();
    }
}
