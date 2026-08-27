namespace BarberBooking.Domain.Entities;

/// <summary>
/// A barber's working window. Recurring entries repeat weekly on <see cref="DayOfWeek"/>.
/// Exception entries apply to a single <see cref="Date"/> and either override the working
/// hours for that day or mark it as a day off (<see cref="IsDayOff"/>).
/// </summary>
public class Availability
{
    public Guid Id { get; set; }

    public Guid BarberId { get; set; }

    public Barber? Barber { get; set; }

    public AvailabilityType Type { get; set; }

    /// <summary>Required when <see cref="Type"/> is Recurring.</summary>
    public DayOfWeek? DayOfWeek { get; set; }

    /// <summary>Required when <see cref="Type"/> is Exception.</summary>
    public DateOnly? Date { get; set; }

    /// <summary>Working window start. Ignored when <see cref="IsDayOff"/> is true.</summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>Working window end. Ignored when <see cref="IsDayOff"/> is true.</summary>
    public TimeOnly EndTime { get; set; }

    /// <summary>When true (Exception only), the barber is entirely unavailable on <see cref="Date"/>.</summary>
    public bool IsDayOff { get; set; }
}
