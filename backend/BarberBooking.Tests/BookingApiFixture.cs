using BarberBooking.Domain.Entities;
using BarberBooking.Infrastructure;
using BarberBooking.Infrastructure.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace BarberBooking.Tests;

public sealed class BookingApiFixture : IAsyncLifetime
{
    private const string TestPassword = "TestPassword123!";
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("barberbooking_test")
        .WithUsername("postgres")
        .WithPassword("postgres_test_password")
        .Build();

    private BookingWebApplicationFactory? _factory;

    public Guid BarberId { get; private set; }
    public Guid OtherBarberId { get; private set; }
    public Guid ServiceId { get; private set; }
    public string ConstraintClientUserId { get; private set; } = null!;
    public DateOnly BookingDate { get; private set; }
    public DateTime BookingStartUtc { get; private set; }
    public string BarberEmail { get; } = "barber.integration@example.test";
    public string AdminEmail { get; } = "admin.integration@example.test";
    public string Password => TestPassword;

    public HttpClient CreateClient() => Factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost")
    });

    public IServiceProvider Services => Factory.Services;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _factory = new BookingWebApplicationFactory(_postgres.GetConnectionString());

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        await IdentitySeeder.SeedRolesAsync(roleManager);

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var barberUser = await CreateUserAsync(userManager, BarberEmail, "Integration Barber", Roles.Barber);
        var otherBarberUser = await CreateUserAsync(
            userManager,
            "other-barber.integration@example.test",
            "Other Integration Barber",
            Roles.Barber);
        _ = await CreateUserAsync(userManager, AdminEmail, "Integration Admin", Roles.Admin);
        var constraintClient = await CreateUserAsync(
            userManager,
            "constraint-client.integration@example.test",
            "Constraint Client",
            Roles.Client);

        var service = new Service
        {
            Id = Guid.NewGuid(),
            Name = "Haircut",
            Duration = TimeSpan.FromMinutes(30),
            Price = 50m
        };

        var barber = new Barber
        {
            Id = Guid.NewGuid(),
            UserId = barberUser.Id,
            DisplayName = "Integration Barber",
            Services = [service]
        };

        var otherBarber = new Barber
        {
            Id = Guid.NewGuid(),
            UserId = otherBarberUser.Id,
            DisplayName = "Other Integration Barber",
            Services = [service]
        };

        BookingDate = NextDayOfWeek(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), DayOfWeek.Monday);
        var availability = new Availability
        {
            Id = Guid.NewGuid(),
            BarberId = barber.Id,
            Type = AvailabilityType.Recurring,
            DayOfWeek = BookingDate.DayOfWeek,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(12, 0)
        };

        var otherAvailability = new Availability
        {
            Id = Guid.NewGuid(),
            BarberId = otherBarber.Id,
            Type = AvailabilityType.Recurring,
            DayOfWeek = BookingDate.DayOfWeek,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(12, 0)
        };

        dbContext.AddRange(service, barber, otherBarber, availability, otherAvailability);
        await dbContext.SaveChangesAsync();

        BarberId = barber.Id;
        OtherBarberId = otherBarber.Id;
        ServiceId = service.Id;
        ConstraintClientUserId = constraintClient.Id;
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        var localStart = DateTime.SpecifyKind(
            BookingDate.ToDateTime(new TimeOnly(10, 0)),
            DateTimeKind.Unspecified);
        BookingStartUtc = TimeZoneInfo.ConvertTimeToUtc(localStart, timeZone);
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        await _postgres.DisposeAsync();
    }

    private BookingWebApplicationFactory Factory =>
        _factory ?? throw new InvalidOperationException("The test fixture has not been initialized.");

    private static async Task<ApplicationUser> CreateUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string fullName,
        string role)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName
        };

        var createResult = await userManager.CreateAsync(user, TestPassword);
        Assert.True(createResult.Succeeded, string.Join("; ", createResult.Errors.Select(error => error.Description)));

        var roleResult = await userManager.AddToRoleAsync(user, role);
        Assert.True(roleResult.Succeeded, string.Join("; ", roleResult.Errors.Select(error => error.Description)));
        return user;
    }

    private static DateOnly NextDayOfWeek(DateOnly date, DayOfWeek dayOfWeek)
    {
        while (date.DayOfWeek != dayOfWeek)
        {
            date = date.AddDays(1);
        }

        return date;
    }

    private sealed class BookingWebApplicationFactory(string connectionString)
        : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((_, configuration) =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Default"] = connectionString,
                    ["Jwt:Issuer"] = "BarberBooking.IntegrationTests",
                    ["Jwt:Audience"] = "BarberBooking.IntegrationTests.Client",
                    ["Jwt:SigningKey"] = "integration-tests-only-signing-key-at-least-32-bytes-long",
                    ["Jwt:ExpiryMinutes"] = "60",
                    ["Booking:TimeZoneId"] = "America/Sao_Paulo",
                    ["Booking:SlotIntervalMinutes"] = "15"
                });
            });
        }
    }
}

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class BookingApiCollection : ICollectionFixture<BookingApiFixture>
{
    public const string Name = "Booking API PostgreSQL";
}
