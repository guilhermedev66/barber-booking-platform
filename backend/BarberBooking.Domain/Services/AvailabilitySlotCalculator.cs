using BarberBooking.Domain.Entities;

namespace BarberBooking.Domain.Services;

public sealed record AvailabilityWindow(DateTime StartUtc, DateTime EndUtc);

public sealed record AvailabilitySlot(DateTime StartUtc, DateTime EndUtc);

public class AvailabilitySlotCalculator
{
    public IReadOnlyList<AvailabilityWindow> ResolveWorkingWindows(
        DateOnly date,
        TimeZoneInfo timeZone,
        IEnumerable<Availability> availabilities)
    {
        var entries = availabilities.ToList();
        var exceptions = entries
            .Where(a => a.Type == AvailabilityType.Exception && a.Date == date)
            .ToList();

        if (exceptions.Any(a => a.IsDayOff))
        {
            return [];
        }

        var recurringWindows = entries
            .Where(a =>
                a.Type == AvailabilityType.Recurring &&
                a.DayOfWeek == date.DayOfWeek &&
                !a.IsDayOff &&
                a.StartTime < a.EndTime)
            .Select(a => new AvailabilityWindow(
                ToUtc(date, a.StartTime, timeZone),
                ToUtc(date, a.EndTime, timeZone)))
            .Distinct()
            .OrderBy(window => window.StartUtc)
            .ToList();

        var blockedWindows = exceptions
            .Where(a => !a.IsDayOff && a.StartTime < a.EndTime)
            .Select(a => new AvailabilityWindow(
                ToUtc(date, a.StartTime, timeZone),
                ToUtc(date, a.EndTime, timeZone)))
            .OrderBy(window => window.StartUtc)
            .ToList();

        foreach (var blockedWindow in blockedWindows)
        {
            recurringWindows = recurringWindows
                .SelectMany(window => Subtract(window, blockedWindow))
                .ToList();
        }

        return recurringWindows;
    }

    public IReadOnlyList<AvailabilitySlot> CalculateAvailableSlots(
        Guid barberId,
        TimeSpan serviceDuration,
        TimeSpan slotInterval,
        IEnumerable<AvailabilityWindow> workingWindows,
        IEnumerable<Appointment> existingAppointments)
    {
        if (serviceDuration <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(serviceDuration));
        }

        if (slotInterval <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(slotInterval));
        }

        var blockingAppointments = existingAppointments
            .Where(a =>
                a.BarberId == barberId &&
                a.Status != AppointmentStatus.Cancelled)
            .ToList();

        var slots = new List<AvailabilitySlot>();

        foreach (var window in workingWindows)
        {
            for (var start = window.StartUtc;
                 start.Add(serviceDuration) <= window.EndUtc;
                 start = start.Add(slotInterval))
            {
                var end = start.Add(serviceDuration);
                var hasConflict = blockingAppointments.Any(appointment =>
                    start < appointment.EndUtc &&
                    appointment.StartUtc < end);

                if (!hasConflict)
                {
                    slots.Add(new AvailabilitySlot(start, end));
                }
            }
        }

        return slots
            .Distinct()
            .OrderBy(slot => slot.StartUtc)
            .ToList();
    }

    private static DateTime ToUtc(DateOnly date, TimeOnly time, TimeZoneInfo timeZone)
    {
        var localDateTime = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);

        if (timeZone.IsInvalidTime(localDateTime))
        {
            throw new InvalidOperationException(
                $"The local time {localDateTime:O} does not exist in time zone {timeZone.Id}.");
        }

        return TimeZoneInfo.ConvertTimeToUtc(localDateTime, timeZone);
    }

    private static IEnumerable<AvailabilityWindow> Subtract(
        AvailabilityWindow source,
        AvailabilityWindow blocked)
    {
        if (blocked.EndUtc <= source.StartUtc || blocked.StartUtc >= source.EndUtc)
        {
            yield return source;
            yield break;
        }

        if (source.StartUtc < blocked.StartUtc)
        {
            yield return new AvailabilityWindow(source.StartUtc, blocked.StartUtc);
        }

        if (blocked.EndUtc < source.EndUtc)
        {
            yield return new AvailabilityWindow(blocked.EndUtc, source.EndUtc);
        }
    }
}
