using JiraClone.Data.Domain.Enums;

namespace JiraClone.Data.Domain.Interfaces;

public interface IBaseEntity
{
    int Id { get; set; }
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

public interface IGoal : IBaseEntity
{
    string Title { get; set; }
    string? Description { get; set; }
    decimal Progress { get; }
}

public interface IProject : IBaseEntity
{
    string Title { get; set; }
    string? Description { get; set; }
    int GoalId { get; set; }
    decimal Progress { get; }
}

public interface ITaskItem : IBaseEntity
{
    string Title { get; set; }
    string? Description { get; set; }
    JiraClone.Data.Domain.Enums.TaskStatus Status { get; set; }
    JiraClone.Data.Domain.Enums.TaskPriority Priority { get; set; }
    int ProjectId { get; set; }
    int? ExecutorId { get; set; }
}

public interface IExecutor : IBaseEntity
{
    string Name { get; set; }
    string Email { get; set; }
}

public interface IComment : IBaseEntity
{
    string Text { get; set; }
    int TaskItemId { get; set; }
    int AuthorId { get; set; }
}

public interface ITimeEntry : IBaseEntity
{
    decimal Hours { get; set; }
    DateTime Date { get; set; }
    int TaskItemId { get; set; }
    int ExecutorId { get; set; }
}
