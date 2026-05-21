using Microsoft.AspNetCore.Mvc;
using JiraClone.Data.Domain.Interfaces;
using JiraClone.Data.Domain.Entities;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/data")]
public class DataController : ControllerBase
{
    private readonly IDbService _dbService;

    public DataController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetData()
    {
        try
        {
            var goals = await _dbService.GetGoalsAsync();
            return Ok(new { 
                success = true, 
                data = goals,
                message = "Data retrieved successfully" 
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                success = false, 
                message = ex.Message 
            });
        }
    }
}
