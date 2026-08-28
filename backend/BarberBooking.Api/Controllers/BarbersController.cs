using BarberBooking.Api.Services;
using BarberBooking.Infrastructure;
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
