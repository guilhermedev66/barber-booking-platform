using Microsoft.AspNetCore.Identity;

namespace BarberBooking.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
}
