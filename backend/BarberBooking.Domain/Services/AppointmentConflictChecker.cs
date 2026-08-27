using BarberBooking.Domain.Entities;

namespace BarberBooking.Domain.Services;

/// <summary>
/// Enforces the "no overlapping appointments for the same barber" invariant.
/// Cancelled appointments do not block new bookings.
/// </summary>
public class AppointmentConflictChecker
{
    public bool HasConflict(Appointment candidate, IEnumerable<Appointment> existingAppointments)
    {
        if (candidate.StartUtc >= candidate.EndUtc)
        {
            throw new ArgumentException("Appointment start must be before its end.", nameof(candidate));
        }

        return existingAppointments.Any(existing =>
            existing.Id != candidate.Id &&
            existing.BarberId == candidate.BarberId &&
            existing.Status != AppointmentStatus.Cancelled &&
            candidate.StartUtc < existing.EndUtc &&
            existing.StartUtc < candidate.EndUtc);
    }
}
