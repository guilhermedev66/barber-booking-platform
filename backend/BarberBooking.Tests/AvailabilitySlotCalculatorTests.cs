using BarberBooking.Domain.Entities;
using BarberBooking.Domain.Services;

namespace BarberBooking.Tests;

public class AvailabilitySlotCalculatorTests
{
    private readonly AvailabilitySlotCalculator _calculator = new();

    [Fact]
    public void ResolveWorkingWindows_UsesDateExceptionInsteadOfRecurringWindow()
    {
        var date = new DateOnly(2027, 1, 4);
        var barberId = Guid.NewGuid();
        var availabilities = new[]
        {
            Recurring(barberId, date.DayOfWeek, new TimeOnly(9, 0), new TimeOnly(17, 0)),
            Exception(barberId, date, new TimeOnly(10, 0), new TimeOnly(11, 0))
        };

        var windows = _calculator.ResolveWorkingWindows(date, TimeZoneInfo.Utc, availabilities);

        var window = Assert.Single(windows);
        Assert.Equal(new DateTime(2027, 1, 4, 10, 0, 0, DateTimeKind.Utc), window.StartUtc);
        Assert.Equal(new DateTime(2027, 1, 4, 11, 0, 0, DateTimeKind.Utc), window.EndUtc);
    }

    [Fact]
    public void ResolveWorkingWindows_ReturnsNoWindowsForDayOffException()
    {
        var date = new DateOnly(2027, 1, 4);
        var barberId = Guid.NewGuid();
        var availabilities = new[]
        {
            Recurring(barberId, date.DayOfWeek, new TimeOnly(9, 0), new TimeOnly(17, 0)),
            new Availability
            {
                Id = Guid.NewGuid(),
                BarberId = barberId,
                Type = AvailabilityType.Exception,
                Date = date,
                IsDayOff = true
            }
        };

        var windows = _calculator.ResolveWorkingWindows(date, TimeZoneInfo.Utc, availabilities);

        Assert.Empty(windows);
    }

    [Fact]
    public void CalculateAvailableSlots_RemovesOverlapsButIgnoresCancelledAppointments()
    {
        var barberId = Guid.NewGuid();
        var start = new DateTime(2027, 1, 4, 9, 0, 0, DateTimeKind.Utc);
        var windows = new[] { new AvailabilityWindow(start, start.AddHours(1)) };
        var appointments = new[]
        {
            Appointment(barberId, start.AddMinutes(30), start.AddHours(1), AppointmentStatus.Confirmed),
            Appointment(barberId, start, start.AddMinutes(30), AppointmentStatus.Cancelled)
        };

        var slots = _calculator.CalculateAvailableSlots(
            barberId,
            TimeSpan.FromMinutes(30),
            TimeSpan.FromMinutes(15),
            windows,
            appointments);

        var slot = Assert.Single(slots);
        Assert.Equal(start, slot.StartUtc);
        Assert.Equal(start.AddMinutes(30), slot.EndUtc);
    }

    private static Availability Recurring(
        Guid barberId,
        DayOfWeek dayOfWeek,
        TimeOnly start,
        TimeOnly end) => new()
        {
            Id = Guid.NewGuid(),
            BarberId = barberId,
            Type = AvailabilityType.Recurring,
            DayOfWeek = dayOfWeek,
            StartTime = start,
            EndTime = end
        };

    private static Availability Exception(
        Guid barberId,
        DateOnly date,
        TimeOnly start,
        TimeOnly end) => new()
        {
            Id = Guid.NewGuid(),
            BarberId = barberId,
            Type = AvailabilityType.Exception,
            Date = date,
            StartTime = start,
            EndTime = end
        };

    private static Appointment Appointment(
        Guid barberId,
        DateTime start,
        DateTime end,
        AppointmentStatus status) => new()
        {
            Id = Guid.NewGuid(),
            ClientUserId = Guid.NewGuid().ToString(),
            BarberId = barberId,
            ServiceId = Guid.NewGuid(),
            StartUtc = start,
            EndUtc = end,
            Status = status
        };
}
