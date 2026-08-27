namespace BarberBooking.Domain.Entities;

public class Appointment
{
    public Guid Id { get; set; }

    /// <summary>Foreign key to the Identity user (AspNetUsers.Id) of the client who booked.</summary>
    public required string ClientUserId { get; set; }

    public Guid BarberId { get; set; }

    public Barber? Barber { get; set; }

    public Guid ServiceId { get; set; }

    public Service? Service { get; set; }

    public DateTime StartUtc { get; set; }

    public DateTime EndUtc { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
}
