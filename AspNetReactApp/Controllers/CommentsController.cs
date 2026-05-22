using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/comments")]
public class CommentsController : ControllerBase
{
    private readonly IDbService _dbService;

    public CommentsController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Comment>>> GetComments([FromQuery] int taskId)
    {
        var comments = await _dbService.GetCommentsByTaskIdAsync(taskId);
        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<Comment>> CreateComment([FromBody] CommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest("Text is required.");
        }

        var task = await _dbService.GetTaskByIdAsync(request.TaskItemId);
        if (task is null)
        {
            return BadRequest("Task not found.");
        }

        var executors = await _dbService.GetExecutorsAsync();
        if (!executors.Any(e => e.Id == request.AuthorId))
        {
            return BadRequest("Author not found.");
        }

        var comment = new Comment
        {
            Text = request.Text.Trim(),
            TaskItemId = request.TaskItemId,
            AuthorId = request.AuthorId
        };

        var created = await _dbService.CreateCommentAsync(comment);
        return Ok(created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        await _dbService.DeleteCommentAsync(id);
        return NoContent();
    }

    public sealed class CommentRequest
    {
        public string Text { get; set; } = string.Empty;
        public int TaskItemId { get; set; }
        public int AuthorId { get; set; }
    }
}
