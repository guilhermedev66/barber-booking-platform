using BarberBooking.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberBooking.Api.Controllers;

[ApiController]
[Route("api/services")]
public class ServicesController(AppDbContext dbContext) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ServiceResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ServiceResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var services = await dbContext.Services
            .AsNoTracking()
            .Where(service => service.IsActive)
            .OrderBy(service => service.Name)
            .Select(service => new ServiceResponse(
                service.Id,
                service.Name,
                (int)service.Duration.TotalMinutes,
                service.Price))
            .ToListAsync(cancellationToken);

        return Ok(services);
    }
}

public sealed record ServiceResponse(
    Guid Id,
    string Name,
    int DurationMinutes,
    decimal Price);
