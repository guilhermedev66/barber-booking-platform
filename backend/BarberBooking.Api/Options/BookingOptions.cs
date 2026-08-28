namespace BarberBooking.Api.Options;

public class BookingOptions
{
    public const string SectionName = "Booking";

    public string TimeZoneId { get; set; } = "America/Sao_Paulo";

    public int SlotIntervalMinutes { get; set; } = 15;
}
