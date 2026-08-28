using BarberBooking.Api.Options;
using BarberBooking.Domain.Entities;
using BarberBooking.Domain.Services;
using BarberBooking.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BarberBooking.Api.Services;

public sealed class BookingAvailabilityService(
    AppDbContext dbContext,
    AvailabilitySlotCalculator slotCalculator,
    IOptions<BookingOptions> options,
    TimeProvider timeProvider)
{
    private readonly BookingOptions _options = options.Value;

    public DateOnly GetLocalDate(DateTime utcDateTime)
    {
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(_options.TimeZoneId);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, timeZone));
    }

    public async Task<BookingAvailabilityResult?> GetAsync(
        Guid barberId,
        Guid serviceId,
        DateOnly date,
        CancellationToken cancellationToken)
    {
        var offering = await dbContext.Barbers
            .AsNoTracking()
            .Where(barber => barber.Id == barberId && barber.IsActive)
            .SelectMany(
                barber => barber.Services
                    .Where(service => service.Id == serviceId && service.IsActive)
                    .Select(service => new
                    {
                        BarberName = barber.DisplayName,
                        ServiceName = service.Name,
                        service.Duration,
                        service.Price
                    }))
            .SingleOrDefaultAsync(cancellationToken);

        if (offering is null || offering.Duration <= TimeSpan.Zero)
        {
            return null;
        }

        var availabilities = await dbContext.Availabilities
            .AsNoTracking()
            .Where(availability =>
                availability.BarberId == barberId &&
                ((availability.Type == AvailabilityType.Exception && availability.Date == date) ||
                 (availability.Type == AvailabilityType.Recurring && availability.DayOfWeek == date.DayOfWeek)))
            .ToListAsync(cancellationToken);

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(_options.TimeZoneId);
        var windows = slotCalculator.ResolveWorkingWindows(date, timeZone, availabilities);

        if (windows.Count == 0)
        {
            return new BookingAvailabilityResult(
                barberId,
                offering.BarberName,
                serviceId,
                offering.ServiceName,
                offering.Duration,
                offering.Price,
                date,
                timeZone.Id,
                []);
        }

        var rangeStart = windows.Min(window => window.StartUtc);
        var rangeEnd = windows.Max(window => window.EndUtc);
        var appointments = await dbContext.Appointments
            .AsNoTracking()
            .Where(appointment =>
                appointment.BarberId == barberId &&
                appointment.Status != AppointmentStatus.Cancelled &&
                appointment.StartUtc < rangeEnd &&
                rangeStart < appointment.EndUtc)
            .ToListAsync(cancellationToken);

        var slots = slotCalculator
            .CalculateAvailableSlots(
                barberId,
                offering.Duration,
                TimeSpan.FromMinutes(_options.SlotIntervalMinutes),
                windows,
                appointments)
            .Where(slot => slot.StartUtc > timeProvider.GetUtcNow().UtcDateTime)
            .ToList();

        return new BookingAvailabilityResult(
            barberId,
            offering.BarberName,
            serviceId,
            offering.ServiceName,
            offering.Duration,
            offering.Price,
            date,
            timeZone.Id,
            slots);
    }
}

public sealed record BookingAvailabilityResult(
    Guid BarberId,
    string BarberName,
    Guid ServiceId,
    string ServiceName,
    TimeSpan ServiceDuration,
    decimal ServicePrice,
    DateOnly Date,
    string TimeZoneId,
    IReadOnlyList<AvailabilitySlot> Slots);
