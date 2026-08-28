using BarberBooking.Domain.Entities;
using BarberBooking.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BarberBooking.Infrastructure;

public static class DevelopmentDataSeeder
{
    public const string DemoBarberPassword = "DemoBarber123!";

    public static async Task SeedAsync(
        AppDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken = default)
    {
        var marcosUser = await EnsureBarberUserAsync(
            userManager,
            "marcos.demo@barberbooking.test",
            "Marcos Andrade");
        var diegoUser = await EnsureBarberUserAsync(
            userManager,
            "diego.demo@barberbooking.test",
            "Diego Fontes");

        if (await dbContext.Services.AnyAsync(cancellationToken) ||
            await dbContext.Barbers.AnyAsync(cancellationToken))
        {
            return;
        }

        var services = new List<Service>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Corte clássico",
                Duration = TimeSpan.FromMinutes(40),
                Price = 60m
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Barba completa",
                Duration = TimeSpan.FromMinutes(30),
                Price = 45m
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Corte + barba",
                Duration = TimeSpan.FromMinutes(70),
                Price = 95m
            }
        };

        var barbers = new List<Barber>
        {
            CreateBarber(
                marcosUser.Id,
                "Marcos Andrade",
                "Especialista em cortes clássicos e acabamento na navalha.",
                services),
            CreateBarber(
                diegoUser.Id,
                "Diego Fontes",
                "Especialista em degradê, barba e atendimento personalizado.",
                services)
        };

        dbContext.Services.AddRange(services);
        dbContext.Barbers.AddRange(barbers);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Barber CreateBarber(
        string userId,
        string displayName,
        string bio,
        IReadOnlyCollection<Service> services)
    {
        var barber = new Barber
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DisplayName = displayName,
            Bio = bio,
            Services = services.ToList()
        };

        foreach (var dayOfWeek in new[]
                 {
                     DayOfWeek.Monday,
                     DayOfWeek.Tuesday,
                     DayOfWeek.Wednesday,
                     DayOfWeek.Thursday,
                     DayOfWeek.Friday
                 })
        {
            barber.Availabilities.Add(new Availability
            {
                Id = Guid.NewGuid(),
                BarberId = barber.Id,
                Type = AvailabilityType.Recurring,
                DayOfWeek = dayOfWeek,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(18, 0)
            });
        }

        return barber;
    }

    private static async Task<ApplicationUser> EnsureBarberUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string fullName)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FullName = fullName
            };

            EnsureSucceeded(
                await userManager.CreateAsync(user, DemoBarberPassword),
                $"create development barber user '{email}'");
        }

        if (!await userManager.HasPasswordAsync(user))
        {
            EnsureSucceeded(
                await userManager.AddPasswordAsync(user, DemoBarberPassword),
                $"add password to development barber user '{email}'");
        }

        if (!await userManager.IsInRoleAsync(user, Roles.Barber))
        {
            EnsureSucceeded(
                await userManager.AddToRoleAsync(user, Roles.Barber),
                $"assign role '{Roles.Barber}' to development user '{email}'");
        }

        return user;
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join(", ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"Could not {operation}: {errors}");
    }
}
