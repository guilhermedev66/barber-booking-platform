namespace BarberBooking.Domain.Entities;

public enum AvailabilityType
{
    /// <summary>A weekly recurring working window (uses DayOfWeek + Start/EndTime).</summary>
    Recurring = 0,

    /// <summary>A one-off exception for a specific date (day off, or an override window).</summary>
    Exception = 1
}
