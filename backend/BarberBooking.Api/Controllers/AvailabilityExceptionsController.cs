using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BarberBooking.Domain.Entities;
using BarberBooking.Infrastructure;
using BarberBooking.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberBooking.Api.Controllers;

[ApiController]
[Route("api/barbers/{barberId:guid}/availability/exceptions")]
[Authorize(Roles = Roles.Barber + "," + Roles.Admin)]
public class AvailabilityExceptionsController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<AvailabilityExceptionResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AvailabilityExceptionResponse>> Create(
        Guid barberId,
        CreateAvailabilityExceptionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Date == default)
        {
            ModelState.AddModelError(nameof(request.Date), "A valid date is required.");
        }

        if (!request.IsDayOff && request.StartTime >= request.EndTime)
        {
            ModelState.AddModelError(
                nameof(request.EndTime),
                "EndTime must be after StartTime unless the whole day is blocked.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var barber = await dbContext.Barbers
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == barberId && item.IsActive, cancellationToken);

        if (barber is null)
        {
            return NotFound();
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!User.IsInRole(Roles.Admin) && barber.UserId != userId)
        {
            return Forbid();
        }

        var availability = new Availability
        {
            Id = Guid.NewGuid(),
            BarberId = barberId,
            Type = AvailabilityType.Exception,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsDayOff = request.IsDayOff
        };

        dbContext.Availabilities.Add(availability);
        await dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new AvailabilityExceptionResponse(
            availability.Id,
            availability.BarberId,
            availability.Date!.Value,
            availability.StartTime,
            availability.EndTime,
            availability.IsDayOff));
    }
}

public sealed record CreateAvailabilityExceptionRequest(
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsDayOff = false);

public sealed record AvailabilityExceptionResponse(
    Guid Id,
    Guid BarberId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsDayOff);
