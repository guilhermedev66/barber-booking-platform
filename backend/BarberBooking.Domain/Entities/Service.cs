namespace BarberBooking.Domain.Entities;

public class Service
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public TimeSpan Duration { get; set; }

    public decimal Price { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Barber> Barbers { get; set; } = new List<Barber>();
}
