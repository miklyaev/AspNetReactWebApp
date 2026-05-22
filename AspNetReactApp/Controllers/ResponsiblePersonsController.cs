using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/responsible-persons")]
public class ResponsiblePersonsController : ControllerBase
{
    private readonly IDbService _dbService;

    public ResponsiblePersonsController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Leader>>> GetResponsiblePersons()
    {
        var responsiblePersons = await _dbService.GetResponsiblePersonsAsync();
        return Ok(responsiblePersons);
    }

    [HttpPost]
    public async Task<ActionResult<Leader>> CreateResponsiblePerson([FromBody] ResponsiblePersonRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Name and email are required.");
        }

        var responsiblePerson = new Leader
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim()
        };

        var created = await _dbService.CreateResponsiblePersonAsync(responsiblePerson);
        return CreatedAtAction(nameof(GetResponsiblePersons), new { id = created.Id }, created);
    }

    public sealed class ResponsiblePersonRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
