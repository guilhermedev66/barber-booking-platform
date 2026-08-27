using BarberBooking.Domain.Entities;
using BarberBooking.Domain.Services;

namespace BarberBooking.Tests;

public class AppointmentConflictCheckerTests
{
    private readonly AppointmentConflictChecker _checker = new();

    private static Appointment CreateAppointment(
        Guid barberId,
        DateTime startUtc,
        DateTime endUtc,
        AppointmentStatus status = AppointmentStatus.Confirmed) =>
        new()
        {
            Id = Guid.NewGuid(),
            ClientUserId = "client-1",
            BarberId = barberId,
            ServiceId = Guid.NewGuid(),
            StartUtc = startUtc,
            EndUtc = endUtc,
            Status = status
        };

    [Fact]
    public void HasConflict_ReturnsTrue_WhenTimesOverlapForSameBarber()
    {
        var barberId = Guid.NewGuid();
        var baseTime = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);

        var existing = CreateAppointment(barberId, baseTime, baseTime.AddMinutes(30));

        var candidate = CreateAppointment(
            barberId,
            baseTime.AddMinutes(15),
            baseTime.AddMinutes(45));

        var result = _checker.HasConflict(candidate, [existing]);

        Assert.True(result);
    }

    [Fact]
    public void HasConflict_ReturnsFalse_WhenTimesDoNotOverlap()
    {
        var barberId = Guid.NewGuid();
        var baseTime = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);

        var existing = CreateAppointment(barberId, baseTime, baseTime.AddMinutes(30));

        var candidate = CreateAppointment(
            barberId,
            baseTime.AddMinutes(30),
            baseTime.AddMinutes(60));

        var result = _checker.HasConflict(candidate, [existing]);

        Assert.False(result);
    }

    [Fact]
    public void HasConflict_ReturnsFalse_WhenOverlapIsForDifferentBarber()
    {
        var baseTime = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);

        var existing = CreateAppointment(Guid.NewGuid(), baseTime, baseTime.AddMinutes(30));

        var candidate = CreateAppointment(
            Guid.NewGuid(),
            baseTime.AddMinutes(15),
            baseTime.AddMinutes(45));

        var result = _checker.HasConflict(candidate, [existing]);

        Assert.False(result);
    }

    [Fact]
    public void HasConflict_ReturnsFalse_WhenOverlappingAppointmentIsCancelled()
    {
        var barberId = Guid.NewGuid();
        var baseTime = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);

        var existing = CreateAppointment(
            barberId,
            baseTime,
            baseTime.AddMinutes(30),
            AppointmentStatus.Cancelled);

        var candidate = CreateAppointment(
            barberId,
            baseTime.AddMinutes(15),
            baseTime.AddMinutes(45));

        var result = _checker.HasConflict(candidate, [existing]);

        Assert.False(result);
    }

    [Fact]
    public void HasConflict_IgnoresItself_WhenUpdatingAnExistingAppointment()
    {
        var barberId = Guid.NewGuid();
        var baseTime = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();

        var existing = new Appointment
        {
            Id = id,
            ClientUserId = "client-1",
            BarberId = barberId,
            ServiceId = Guid.NewGuid(),
            StartUtc = baseTime,
            EndUtc = baseTime.AddMinutes(30),
            Status = AppointmentStatus.Confirmed
        };

        var candidate = new Appointment
        {
            Id = id,
            ClientUserId = "client-1",
            BarberId = barberId,
            ServiceId = existing.ServiceId,
            StartUtc = baseTime.AddMinutes(5),
            EndUtc = baseTime.AddMinutes(35),
            Status = AppointmentStatus.Confirmed
        };

        var result = _checker.HasConflict(candidate, [existing]);

        Assert.False(result);
    }
}
