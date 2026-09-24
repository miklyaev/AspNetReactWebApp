using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using AspNetReactApp.Controllers;
using JiraClone.Data.Domain.Interfaces;
using JiraClone.Data.Domain.Entities;

namespace AspNetReactApp.Tests;

public class TasksControllerTests
{
    [Fact]
    public async Task GetTasks_ReturnsOk_WhenCalled()
    {
        var mockDbService = new Mock<IDbService>();
        mockDbService.Setup(x => x.GetTasksAsync())
            .ReturnsAsync(new List<TaskItem>
            {
                new TaskItem { Id = 1, Title = "Test Task", ProjectId = 1 }
            });

        var controller = new TasksController(mockDbService.Object);
        var result = await controller.GetTasks(null, null);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetTask_ReturnsOk_WhenTaskExists()
    {
        var taskId = 1;
        var mockDbService = new Mock<IDbService>();
        mockDbService.Setup(x => x.GetTaskByIdAsync(taskId))
            .ReturnsAsync(new TaskItem { Id = taskId, Title = "Test Task", ProjectId = 1 });

        var controller = new TasksController(mockDbService.Object);
        var result = await controller.GetTask(taskId);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedTask = Assert.IsType<TaskItem>(okResult.Value);
        Assert.Equal(taskId, returnedTask.Id);
    }

    [Fact]
    public async Task GetTask_ReturnsNotFound_WhenTaskDoesNotExist()
    {
        var taskId = 999;
        var mockDbService = new Mock<IDbService>();
        mockDbService.Setup(x => x.GetTaskByIdAsync(taskId))
            .ReturnsAsync((TaskItem?)null);

        var controller = new TasksController(mockDbService.Object);
        var result = await controller.GetTask(taskId);

        Assert.IsType<NotFoundResult>(result.Result);
    }
}

public class ExecutorsControllerTests
{
    [Fact]
    public async Task GetExecutors_ReturnsOk_WithExecutorList()
    {
        var mockDbService = new Mock<IDbService>();
        mockDbService.Setup(x => x.GetExecutorsAsync())
            .ReturnsAsync(new List<Executor>
            {
                new Executor { Id = 1, Name = "John Doe", Email = "john@example.com", Login = "john" }
            });

        var controller = new ExecutorsController(mockDbService.Object);
        var result = await controller.GetExecutors();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var executors = Assert.IsType<List<Executor>>(okResult.Value);
        Assert.Single(executors);
    }
}

public class LeadersControllerTests
{
    [Fact]
    public async Task GetLeaders_ReturnsOk_WithLeaderList()
    {
        var mockDbService = new Mock<IDbService>();
        mockDbService.Setup(x => x.GetLeadersAsync())
            .ReturnsAsync(new List<Leader>
            {
                new Leader { Id = 1, Name = "Jane Doe", Email = "jane@example.com", Login = "jane" }
            });

        var controller = new LeadersController(mockDbService.Object);
        var result = await controller.GetLeaders();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var leaders = Assert.IsType<List<Leader>>(okResult.Value);
        Assert.Single(leaders);
    }
}

public class CommentsControllerTests
{
    [Fact]
    public async Task GetComments_ReturnsOk_WithCommentList()
    {
        var taskId = 1;
        var mockDbService = new Mock<IDbService>();
        mockDbService.Setup(x => x.GetCommentsByTaskIdAsync(taskId))
            .ReturnsAsync(new List<Comment>
            {
                new Comment { Id = 1, Text = "Test comment", TaskItemId = taskId, AuthorId = 1 }
            });

        var controller = new CommentsController(mockDbService.Object);
        var result = await controller.GetComments(taskId);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var comments = Assert.IsType<List<Comment>>(okResult.Value);
        Assert.Single(comments);
    }
}
