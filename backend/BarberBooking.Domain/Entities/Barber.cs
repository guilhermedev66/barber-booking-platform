namespace BarberBooking.Domain.Entities;

public class Barber
{
    public Guid Id { get; set; }

    /// <summary>Foreign key to the Identity user (AspNetUsers.Id) this barber profile belongs to.</summary>
    public required string UserId { get; set; }

    public required string DisplayName { get; set; }

    public string? Bio { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();
}
