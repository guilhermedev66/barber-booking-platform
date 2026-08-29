using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BarberBooking.Api.Services;
using BarberBooking.Domain.Entities;
using BarberBooking.Domain.Services;
using BarberBooking.Infrastructure;
using BarberBooking.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace BarberBooking.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController(
    AppDbContext dbContext,
    BookingAvailabilityService availabilityService,
    AppointmentConflictChecker conflictChecker,
    TimeProvider timeProvider,
    UserManager<ApplicationUser> userManager) : ControllerBase
{
    [Authorize(Roles = Roles.Client)]
    [HttpPost]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> Create(
        CreateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var startUtc = request.StartUtc.UtcDateTime;

        if (startUtc <= timeProvider.GetUtcNow().UtcDateTime)
        {
            ModelState.AddModelError(nameof(request.StartUtc), "Appointment start must be in the future.");
            return ValidationProblem(ModelState);
        }

        var localDate = availabilityService.GetLocalDate(startUtc);
        var availability = await availabilityService.GetAsync(
            request.BarberId,
            request.ServiceId,
            localDate,
            cancellationToken);

        if (availability is null)
        {
            return NotFound();
        }

        var selectedSlot = availability.Slots.SingleOrDefault(slot => slot.StartUtc == startUtc);
        if (selectedSlot is null)
        {
            return BookingConflict("The selected time is not available for this barber and service.");
        }

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            ClientUserId = userId,
            BarberId = request.BarberId,
            ServiceId = request.ServiceId,
            StartUtc = selectedSlot.StartUtc,
            EndUtc = selectedSlot.EndUtc,
            Status = AppointmentStatus.Confirmed
        };

        var possibleConflicts = await dbContext.Appointments
            .AsNoTracking()
            .Where(existing =>
                existing.BarberId == appointment.BarberId &&
                existing.Status != AppointmentStatus.Cancelled &&
                appointment.StartUtc < existing.EndUtc &&
                existing.StartUtc < appointment.EndUtc)
            .ToListAsync(cancellationToken);

        if (conflictChecker.HasConflict(appointment, possibleConflicts))
        {
            return BookingConflict("The selected time was already booked.");
        }

        dbContext.Appointments.Add(appointment);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (IsBookingContention(exception))
        {
            return BookingConflict("The selected time was already booked.");
        }

        return StatusCode(StatusCodes.Status201Created, new AppointmentResponse(
            appointment.Id,
            User.FindFirstValue(ClaimTypes.Name),
            appointment.BarberId,
            availability.BarberName,
            appointment.ServiceId,
            availability.ServiceName,
            (int)availability.ServiceDuration.TotalMinutes,
            availability.ServicePrice,
            appointment.StartUtc,
            appointment.EndUtc,
            appointment.Status.ToString()));
    }

    [Authorize(Roles = Roles.Barber + "," + Roles.Admin)]
    [HttpPost("walk-in")]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> CreateWalkIn(
        CreateWalkInAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ClientName))
        {
            ModelState.AddModelError(nameof(request.ClientName), "ClientName is required.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var barber = await dbContext.Barbers
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.BarberId && item.IsActive, cancellationToken);

        if (barber is null)
        {
            return NotFound();
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!User.IsInRole(Roles.Admin) && barber.UserId != userId)
        {
            return Forbid();
        }

        var startUtc = request.StartUtc.UtcDateTime;
        if (startUtc <= timeProvider.GetUtcNow().UtcDateTime)
        {
            ModelState.AddModelError(nameof(request.StartUtc), "Appointment start must be in the future.");
            return ValidationProblem(ModelState);
        }

        var availability = await availabilityService.GetAsync(
            request.BarberId,
            request.ServiceId,
            availabilityService.GetLocalDate(startUtc),
            cancellationToken);

        if (availability is null)
        {
            return NotFound();
        }

        var selectedSlot = availability.Slots.SingleOrDefault(slot => slot.StartUtc == startUtc);
        if (selectedSlot is null)
        {
            return BookingConflict("The selected time is not available for this barber and service.");
        }

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            ClientUserId = string.Empty,
            BarberId = request.BarberId,
            ServiceId = request.ServiceId,
            StartUtc = selectedSlot.StartUtc,
            EndUtc = selectedSlot.EndUtc,
            Status = AppointmentStatus.Confirmed
        };

        var possibleConflicts = await dbContext.Appointments
            .AsNoTracking()
            .Where(existing =>
                existing.BarberId == appointment.BarberId &&
                existing.Status != AppointmentStatus.Cancelled &&
                appointment.StartUtc < existing.EndUtc &&
                existing.StartUtc < appointment.EndUtc)
            .ToListAsync(cancellationToken);

        if (conflictChecker.HasConflict(appointment, possibleConflicts))
        {
            return BookingConflict("The selected time was already booked.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var walkInKey = Guid.NewGuid().ToString("N");
        var walkInUser = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = $"walk-in-{walkInKey}@barberbooking.local",
            Email = $"walk-in-{walkInKey}@barberbooking.local",
            FullName = request.ClientName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.ClientPhone) ? null : request.ClientPhone.Trim(),
            EmailConfirmed = true
        };

        var userResult = await userManager.CreateAsync(walkInUser);
        if (!userResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            foreach (var error in userResult.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return ValidationProblem(ModelState);
        }

        appointment.ClientUserId = walkInUser.Id;
        dbContext.Appointments.Add(appointment);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception exception) when (IsBookingContention(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return BookingConflict("The selected time was already booked.");
        }

        return StatusCode(StatusCodes.Status201Created, new AppointmentResponse(
            appointment.Id,
            request.ClientName.Trim(),
            appointment.BarberId,
            availability.BarberName,
            appointment.ServiceId,
            availability.ServiceName,
            (int)availability.ServiceDuration.TotalMinutes,
            availability.ServicePrice,
            appointment.StartUtc,
            appointment.EndUtc,
            appointment.Status.ToString()));
    }

    [Authorize(Roles = Roles.Client)]
    [HttpGet("mine")]
    [ProducesResponseType<IReadOnlyList<AppointmentResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AppointmentResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await LoadAppointmentsAsync(
            dbContext.Appointments.Where(appointment => appointment.ClientUserId == userId),
            cancellationToken));
    }

    [Authorize(Roles = Roles.Barber + "," + Roles.Admin)]
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AppointmentResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AppointmentResponse>>> GetAgenda(
        CancellationToken cancellationToken)
    {
        var appointments = dbContext.Appointments.AsQueryable();
        if (!User.IsInRole(Roles.Admin))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            appointments = appointments.Where(appointment => appointment.Barber!.UserId == userId);
        }

        return Ok(await LoadAppointmentsAsync(appointments, cancellationToken));
    }

    [Authorize(Roles = Roles.Client + "," + Roles.Barber + "," + Roles.Admin)]
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var appointment = await dbContext.Appointments
            .Include(item => item.Barber)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (appointment is null)
        {
            return NotFound();
        }

        var canCancel = User.IsInRole(Roles.Admin) ||
                        (User.IsInRole(Roles.Barber) && appointment.Barber!.UserId == userId) ||
                        (User.IsInRole(Roles.Client) && appointment.ClientUserId == userId);

        if (!canCancel)
        {
            return NotFound();
        }

        if (appointment.Status == AppointmentStatus.Completed)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Completed appointments cannot be cancelled."
            });
        }

        if (appointment.Status != AppointmentStatus.Cancelled)
        {
            appointment.Status = AppointmentStatus.Cancelled;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return NoContent();
    }

    private async Task<IReadOnlyList<AppointmentResponse>> LoadAppointmentsAsync(
        IQueryable<Appointment> appointments,
        CancellationToken cancellationToken)
    {
        var rows = await (
                from appointment in appointments.AsNoTracking()
                join client in dbContext.Users.AsNoTracking()
                    on appointment.ClientUserId equals client.Id
                orderby appointment.StartUtc
                select new AppointmentRow(
                    appointment.Id,
                    client.FullName,
                    appointment.BarberId,
                    appointment.Barber!.DisplayName,
                    appointment.ServiceId,
                    appointment.Service!.Name,
                    appointment.Service.Duration,
                    appointment.Service.Price,
                    appointment.StartUtc,
                    appointment.EndUtc,
                    appointment.Status))
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new AppointmentResponse(
                row.Id,
                row.ClientName,
                row.BarberId,
                row.BarberName,
                row.ServiceId,
                row.ServiceName,
                (int)row.ServiceDuration.TotalMinutes,
                row.ServicePrice,
                row.StartUtc,
                row.EndUtc,
                row.Status.ToString()))
            .ToList();
    }

    private ConflictObjectResult BookingConflict(string detail) => Conflict(new ProblemDetails
    {
        Status = StatusCodes.Status409Conflict,
        Title = "Appointment conflict.",
        Detail = detail
    });

    private static bool IsBookingContention(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgresException &&
                (postgresException.SqlState == PostgresErrorCodes.ExclusionViolation ||
                 postgresException.SqlState == PostgresErrorCodes.DeadlockDetected))
            {
                return true;
            }
        }

        return false;
    }

    private sealed record AppointmentRow(
        Guid Id,
        string? ClientName,
        Guid BarberId,
        string BarberName,
        Guid ServiceId,
        string ServiceName,
        TimeSpan ServiceDuration,
        decimal ServicePrice,
        DateTime StartUtc,
        DateTime EndUtc,
        AppointmentStatus Status);
}

public sealed record CreateAppointmentRequest(
    [Required] Guid BarberId,
    [Required] Guid ServiceId,
    [Required] DateTimeOffset StartUtc);

public sealed record CreateWalkInAppointmentRequest(
    [Required] Guid BarberId,
    [Required] Guid ServiceId,
    [Required] DateTimeOffset StartUtc,
    [Required, MinLength(2), MaxLength(200)] string ClientName,
    [MaxLength(30)] string? ClientPhone);

public sealed record AppointmentResponse(
    Guid Id,
    string? ClientName,
    Guid BarberId,
    string BarberName,
    Guid ServiceId,
    string ServiceName,
    int DurationMinutes,
    decimal Price,
    DateTime StartUtc,
    DateTime EndUtc,
    string Status);
