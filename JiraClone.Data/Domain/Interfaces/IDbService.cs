using JiraClone.Data.Domain.Entities;

namespace JiraClone.Data.Domain.Interfaces;

public interface IDbService
{
    // Goals
    Task<List<Goal>> GetGoalsAsync();
    Task<Goal?> GetGoalByIdAsync(int id);
    Task<Goal> CreateGoalAsync(Goal goal);
    Task UpdateGoalAsync(Goal goal);
    Task DeleteGoalAsync(int id);

    // Projects
    Task<List<Project>> GetProjectsByGoalIdAsync(int goalId);
    Task<Project?> GetProjectByIdAsync(int id);
    Task<Project> CreateProjectAsync(Project project);
    Task UpdateProjectAsync(Project project);
    Task DeleteProjectAsync(int id);

    // Tasks
    Task<List<TaskItem>> GetTasksByProjectIdAsync(int projectId);
    Task<TaskItem?> GetTaskByIdAsync(int id);
    Task<TaskItem> CreateTaskAsync(TaskItem task);
    Task UpdateTaskAsync(TaskItem task);
    Task DeleteTaskAsync(int id);

    // Executors
    Task<List<Executor>> GetExecutorsAsync();
    Task<Executor> CreateExecutorAsync(Executor executor);

    // Time Tracking
    Task<TimeEntry> AddTimeEntryAsync(TimeEntry entry);
    Task<decimal> GetTotalHoursByTaskAsync(int taskId);
}
