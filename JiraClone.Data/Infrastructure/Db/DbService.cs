using Microsoft.EntityFrameworkCore;
using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Infrastructure.Db;

public class DbService : IDbService
{
    private readonly AppDbContext _context;

    public DbService(AppDbContext context)
    {
        _context = context;
    }

    // Goals
    public async Task<List<Goal>> GetGoalsAsync() => 
        await _context.Goals.Include(g => g.Projects).ThenInclude(p => p.Tasks).ToListAsync();

    public async Task<Goal?> GetGoalByIdAsync(int id) => 
        await _context.Goals.Include(g => g.Projects).ThenInclude(p => p.Tasks).FirstOrDefaultAsync(g => g.Id == id);

    public async Task<Goal> CreateGoalAsync(Goal goal)
    {
        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();
        return goal;
    }

    public async Task UpdateGoalAsync(Goal goal)
    {
        _context.Entry(goal).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteGoalAsync(int id)
    {
        var goal = await _context.Goals.FindAsync(id);
        if (goal != null)
        {
            _context.Goals.Remove(goal);
            await _context.SaveChangesAsync();
        }
    }

    // Projects
    public async Task<List<Project>> GetProjectsAsync() =>
        await _context.Projects.Include(p => p.Tasks).ToListAsync();

    public async Task<List<Project>> GetProjectsByGoalIdAsync(int goalId) =>
        await _context.Projects.Where(p => p.GoalId == goalId).Include(p => p.Tasks).ToListAsync();

    public async Task<Project?> GetProjectByIdAsync(int id) =>
        await _context.Projects.Include(p => p.Tasks).FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Project> CreateProjectAsync(Project project)
    {
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();
        return project;
    }

    public async Task UpdateProjectAsync(Project project)
    {
        _context.Entry(project).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteProjectAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project != null)
        {
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
        }
    }

    // Tasks
    public async Task<List<TaskItem>> GetTasksAsync() =>
        await _context.Tasks
            .Include(t => t.Executor)
            .ToListAsync();

    public async Task<List<TaskItem>> GetTasksByProjectIdAsync(int projectId) =>
        await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Executor)
            .ToListAsync();

    public async Task<TaskItem?> GetTaskByIdAsync(int id) =>
        await _context.Tasks
            .Include(t => t.Comments)
            .Include(t => t.TimeEntries)
            .Include(t => t.Executor)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<TaskItem> CreateTaskAsync(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task UpdateTaskAsync(TaskItem task)
    {
        _context.Entry(task).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteTaskAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task != null)
        {
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
        }
    }

    // Executors
    public async Task<List<Executor>> GetExecutorsAsync() =>
        await _context.Executors.ToListAsync();

    public async Task<Executor> CreateExecutorAsync(Executor executor)
    {
        _context.Executors.Add(executor);
        await _context.SaveChangesAsync();
        return executor;
    }

    public async Task DeleteExecutorAsync(int id)
    {
        var executor = await _context.Executors.FindAsync(id);
        if (executor != null)
        {
            _context.Executors.Remove(executor);
            await _context.SaveChangesAsync();
        }
    }

    // Responsible Persons
    public async Task<List<Leader>> GetLeadersAsync() =>
        await _context.Leaders.ToListAsync();

    public async Task<Leader> CreateLeaderAsync(Leader leader)
    {
        _context.Leaders.Add(leader);
        await _context.SaveChangesAsync();
        return leader;
    }

    public async Task DeleteLeaderAsync(int id)
    {
        var leader = await _context.Leaders.FindAsync(id);
        if (leader != null)
        {
            _context.Leaders.Remove(leader);
            await _context.SaveChangesAsync();
        }
    }
    // Comments
    public async Task<List<Comment>> GetCommentsByTaskIdAsync(int taskId) =>
        await _context.Comments
            .Where(c => c.TaskItemId == taskId)
            .Include(c => c.Author)
            .ToListAsync();

    public async Task<Comment> CreateCommentAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return comment;
    }

    public async Task DeleteCommentAsync(int id)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment != null)
        {
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
        }
    }

    // Time Tracking
    public async Task<List<TimeEntry>> GetTimeEntriesAsync() =>
        await _context.TimeEntries
            .Include(te => te.Executor)
            .ToListAsync();

    public async Task<List<TimeEntry>> GetTimeEntriesByTaskIdAsync(int taskId) =>
        await _context.TimeEntries
            .Where(te => te.TaskItemId == taskId)
            .Include(te => te.Executor)
            .ToListAsync();

    public async Task<TimeEntry> AddTimeEntryAsync(TimeEntry entry)
    {
        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<decimal> GetTotalHoursByTaskAsync(int taskId) =>
        await _context.TimeEntries.Where(te => te.TaskItemId == taskId).SumAsync(te => te.Hours);
}
