namespace BarberBooking.Infrastructure.Identity;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Barber = "Barber";
    public const string Client = "Client";

    public static readonly string[] All = [Admin, Barber, Client];
}
