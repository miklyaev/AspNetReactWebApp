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
    Task<List<Project>> GetProjectsAsync();
    Task<List<Project>> GetProjectsByGoalIdAsync(int goalId);
    Task<Project?> GetProjectByIdAsync(int id);
    Task<Project> CreateProjectAsync(Project project);
    Task UpdateProjectAsync(Project project);
    Task DeleteProjectAsync(int id);

    // Tasks
    Task<List<TaskItem>> GetTasksAsync();
    Task<List<TaskItem>> GetTasksByProjectIdAsync(int projectId);
    Task<List<TaskItem>> GetTasksByGoalIdAsync(int goalId);
    Task<TaskItem?> GetTaskByIdAsync(int id);    Task<TaskItem> CreateTaskAsync(TaskItem task);
    Task UpdateTaskAsync(TaskItem task);
    Task DeleteTaskAsync(int id);

    // Executors
    Task<List<Executor>> GetExecutorsAsync();
    Task<Executor?> GetExecutorByIdAsync(int id);
    Task<Executor> CreateExecutorAsync(Executor executor);
    Task DeleteExecutorAsync(int id);

    Task UpdateEmployeeAsync(Employee employee);

    // Responsible Persons
    Task<List<Leader>> GetLeadersAsync();
    Task<Leader?> GetLeaderByIdAsync(int id);
    Task<Leader> CreateLeaderAsync(Leader leader);
    Task DeleteLeaderAsync(int id);
    // Comments
    Task<List<Comment>> GetCommentsByTaskIdAsync(int taskId);
    Task<Comment> CreateCommentAsync(Comment comment);
    Task DeleteCommentAsync(int id);

    // Time Tracking
    Task<List<TimeEntry>> GetTimeEntriesAsync();
    Task<List<TimeEntry>> GetTimeEntriesByTaskIdAsync(int taskId);
    Task<TimeEntry> AddTimeEntryAsync(TimeEntry entry);
    Task<decimal> GetTotalHoursByTaskAsync(int taskId);
}
