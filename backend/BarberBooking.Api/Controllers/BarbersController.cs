using System.Security.Claims;
using BarberBooking.Api.Services;
using BarberBooking.Infrastructure;
using BarberBooking.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberBooking.Api.Controllers;

[ApiController]
[Route("api/barbers")]
public class BarbersController(
    AppDbContext dbContext,
    BookingAvailabilityService availabilityService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<BarberResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BarberResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var barbers = await dbContext.Barbers
            .AsNoTracking()
            .Where(barber => barber.IsActive)
            .OrderBy(barber => barber.DisplayName)
            .Select(barber => new BarberResponse(
                barber.Id,
                barber.DisplayName,
                barber.Bio,
                barber.Services
                    .Where(service => service.IsActive)
                    .OrderBy(service => service.Name)
                    .Select(service => new BarberServiceResponse(
                        service.Id,
                        service.Name,
                        (int)service.Duration.TotalMinutes,
                        service.Price))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return Ok(barbers);
    }

    [Authorize(Roles = Roles.Barber)]
    [HttpGet("me")]
    [ProducesResponseType<BarberResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BarberResponse>> GetMe(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var barber = await dbContext.Barbers
            .AsNoTracking()
            .Where(item => item.IsActive && item.UserId == userId)
            .Select(item => new BarberResponse(
                item.Id,
                item.DisplayName,
                item.Bio,
                item.Services
                    .Where(service => service.IsActive)
                    .OrderBy(service => service.Name)
                    .Select(service => new BarberServiceResponse(
                        service.Id,
                        service.Name,
                        (int)service.Duration.TotalMinutes,
                        service.Price))
                    .ToList()))
            .SingleOrDefaultAsync(cancellationToken);

        return barber is null ? NotFound() : Ok(barber);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType<BarberAvailabilityResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BarberAvailabilityResponse>> GetAvailability(
        Guid id,
        [FromQuery] DateOnly date,
        [FromQuery] Guid serviceId,
        CancellationToken cancellationToken)
    {
        if (date == default)
        {
            ModelState.AddModelError(nameof(date), "A valid date is required.");
        }

        if (serviceId == Guid.Empty)
        {
            ModelState.AddModelError(nameof(serviceId), "A serviceId is required.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var availability = await availabilityService.GetAsync(id, serviceId, date, cancellationToken);
        if (availability is null)
        {
            return NotFound();
        }

        return Ok(new BarberAvailabilityResponse(
            availability.BarberId,
            availability.ServiceId,
            availability.Date,
            availability.TimeZoneId,
            availability.Slots
                .Select(slot => new AvailabilitySlotResponse(slot.StartUtc, slot.EndUtc))
                .ToList()));
    }
}

public sealed record BarberResponse(
    Guid Id,
    string DisplayName,
    string? Bio,
    IReadOnlyList<BarberServiceResponse> Services);

public sealed record BarberServiceResponse(
    Guid Id,
    string Name,
    int DurationMinutes,
    decimal Price);

public sealed record BarberAvailabilityResponse(
    Guid BarberId,
    Guid ServiceId,
    DateOnly Date,
    string TimeZoneId,
    IReadOnlyList<AvailabilitySlotResponse> Slots);

public sealed record AvailabilitySlotResponse(DateTime StartUtc, DateTime EndUtc);
