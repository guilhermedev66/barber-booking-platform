using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BarberBooking.Api.Controllers;
using BarberBooking.Domain.Entities;
using BarberBooking.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace BarberBooking.Tests;

[Collection(BookingApiCollection.Name)]
public class BookingApiIntegrationTests(BookingApiFixture fixture)
{
    [Fact]
    public async Task Registration_AcceptsPasswordWithOnlyEightCharacters()
    {
        using var client = fixture.CreateClient();
        var email = $"simple-password-{Guid.NewGuid():N}@example.test";

        var registerResponse = await client.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest("Simple Password", email, "12345678"));

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, "12345678"));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task BookingEngine_EnforcesAuthAvailabilityOwnershipAndConcurrentDoubleBooking()
    {
        using var publicClient = fixture.CreateClient();

        var servicesResponse = await publicClient.GetAsync("/api/services");
        servicesResponse.EnsureSuccessStatusCode();
        var services = await servicesResponse.Content.ReadFromJsonAsync<List<ServiceResponse>>();
        Assert.Contains(services!, service => service.Id == fixture.ServiceId);

        var barbersResponse = await publicClient.GetAsync("/api/barbers");
        barbersResponse.EnsureSuccessStatusCode();
        var barbers = await barbersResponse.Content.ReadFromJsonAsync<List<BarberResponse>>();
        Assert.Contains(barbers!, barber =>
            barber.Id == fixture.BarberId &&
            barber.Services.Any(service => service.Id == fixture.ServiceId));

        var availabilityUrl =
            $"/api/barbers/{fixture.BarberId}/availability" +
            $"?date={fixture.BookingDate:yyyy-MM-dd}&serviceId={fixture.ServiceId}";
        var availability = await publicClient.GetFromJsonAsync<BarberAvailabilityResponse>(availabilityUrl);
        Assert.Contains(availability!.Slots, slot => slot.StartUtc == fixture.BookingStartUtc);

        var firstEmail = $"client-one-{Guid.NewGuid():N}@example.test";
        var secondEmail = $"client-two-{Guid.NewGuid():N}@example.test";
        await RegisterAsync(publicClient, firstEmail, "Client One");
        await RegisterAsync(publicClient, secondEmail, "Client Two");

        using var firstClient = await LoginAsync(firstEmail, fixture.Password);
        using var secondClient = await LoginAsync(secondEmail, fixture.Password);
        using var barberClient = await LoginAsync(fixture.BarberEmail, fixture.Password);
        using var adminClient = await LoginAsync(fixture.AdminEmail, fixture.Password);

        await AssertExclusionConstraintExistsAsync();

        var request = new CreateAppointmentRequest(
            fixture.BarberId,
            fixture.ServiceId,
            new DateTimeOffset(fixture.BookingStartUtc));

        var firstBookingTask = firstClient.PostAsJsonAsync("/api/appointments", request);
        var secondBookingTask = secondClient.PostAsJsonAsync("/api/appointments", request);
        var bookingResponses = await Task.WhenAll(firstBookingTask, secondBookingTask);

        Assert.Equal(
            [HttpStatusCode.Created, HttpStatusCode.Conflict],
            bookingResponses.Select(response => response.StatusCode).Order().ToArray());

        var firstWon = bookingResponses[0].StatusCode == HttpStatusCode.Created;
        var winnerClient = firstWon ? firstClient : secondClient;
        var loserClient = firstWon ? secondClient : firstClient;
        var createdResponse = firstWon ? bookingResponses[0] : bookingResponses[1];
        var created = await createdResponse.Content.ReadFromJsonAsync<AppointmentResponse>();
        Assert.NotNull(created);

        var mine = await winnerClient.GetFromJsonAsync<List<AppointmentResponse>>("/api/appointments/mine");
        Assert.Contains(mine!, appointment => appointment.Id == created.Id);

        var unauthorizedCancellation = await loserClient.PostAsync(
            $"/api/appointments/{created.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NotFound, unauthorizedCancellation.StatusCode);

        var barberAgenda = await barberClient.GetFromJsonAsync<List<AppointmentResponse>>("/api/appointments");
        Assert.Contains(barberAgenda!, appointment => appointment.Id == created.Id);

        var adminAgenda = await adminClient.GetFromJsonAsync<List<AppointmentResponse>>("/api/appointments");
        Assert.Contains(adminAgenda!, appointment => appointment.Id == created.Id);

        var clientCancellation = await winnerClient.PostAsync(
            $"/api/appointments/{created.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, clientCancellation.StatusCode);

        var rebookedByClient = await firstClient.PostAsJsonAsync("/api/appointments", request);
        Assert.Equal(HttpStatusCode.Created, rebookedByClient.StatusCode);
        var barberCancelledAppointment = await rebookedByClient.Content.ReadFromJsonAsync<AppointmentResponse>();

        var barberCancellation = await barberClient.PostAsync(
            $"/api/appointments/{barberCancelledAppointment!.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, barberCancellation.StatusCode);

        var rebookedForAdmin = await secondClient.PostAsJsonAsync("/api/appointments", request);
        Assert.Equal(HttpStatusCode.Created, rebookedForAdmin.StatusCode);
        var adminCancelledAppointment = await rebookedForAdmin.Content.ReadFromJsonAsync<AppointmentResponse>();

        var adminCancellation = await adminClient.PostAsync(
            $"/api/appointments/{adminCancelledAppointment!.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, adminCancellation.StatusCode);

        var otherBarberRequest = request with { BarberId = fixture.OtherBarberId };
        var otherBarberBooking = await firstClient.PostAsJsonAsync("/api/appointments", otherBarberRequest);
        Assert.Equal(HttpStatusCode.Created, otherBarberBooking.StatusCode);
        var otherBarberAppointment = await otherBarberBooking.Content.ReadFromJsonAsync<AppointmentResponse>();

        var filteredBarberAgenda = await barberClient.GetFromJsonAsync<List<AppointmentResponse>>("/api/appointments");
        Assert.DoesNotContain(filteredBarberAgenda!, appointment => appointment.Id == otherBarberAppointment!.Id);

        var crossBarberCancellation = await barberClient.PostAsync(
            $"/api/appointments/{otherBarberAppointment!.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NotFound, crossBarberCancellation.StatusCode);

        var adminCancelledOtherBarber = await adminClient.PostAsync(
            $"/api/appointments/{otherBarberAppointment.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, adminCancelledOtherBarber.StatusCode);

        var availableAgain = await publicClient.GetFromJsonAsync<BarberAvailabilityResponse>(availabilityUrl);
        Assert.Contains(availableAgain!.Slots, slot => slot.StartUtc == fixture.BookingStartUtc);
    }

    [Fact]
    public async Task PostgreSqlExclusionConstraint_RejectsConcurrentOverlappingWrites()
    {
        var firstStart = fixture.BookingStartUtc.AddHours(1);
        var first = CreateAppointment(firstStart, firstStart.AddMinutes(30));
        var second = CreateAppointment(firstStart.AddMinutes(15), firstStart.AddMinutes(45));

        using var firstScope = fixture.Services.CreateScope();
        using var secondScope = fixture.Services.CreateScope();
        var firstDbContext = firstScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var secondDbContext = secondScope.ServiceProvider.GetRequiredService<AppDbContext>();
        firstDbContext.Appointments.Add(first);
        secondDbContext.Appointments.Add(second);

        var results = await Task.WhenAll(
            SaveAndCapturePostgresExceptionAsync(firstDbContext),
            SaveAndCapturePostgresExceptionAsync(secondDbContext));

        Assert.Single(results, exception => exception is null);
        var exclusionViolation = Assert.Single(results, exception => exception is not null);
        Assert.Equal(PostgresErrorCodes.ExclusionViolation, exclusionViolation!.SqlState);
    }

    [Fact]
    public async Task BarberAvailabilityException_RemovesBlockedSlotsAndProtectsOwnership()
    {
        using var barberClient = await LoginAsync(fixture.BarberEmail, fixture.Password);
        using var adminClient = await LoginAsync(fixture.AdminEmail, fixture.Password);
        using var publicClient = fixture.CreateClient();
        var date = fixture.BookingDate.AddDays(7);
        var blockRequest = new CreateAvailabilityExceptionRequest(
            date,
            new TimeOnly(10, 0),
            new TimeOnly(11, 0));

        var forbidden = await barberClient.PostAsJsonAsync(
            $"/api/barbers/{fixture.OtherBarberId}/availability/exceptions",
            blockRequest);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        var created = await adminClient.PostAsJsonAsync(
            $"/api/barbers/{fixture.OtherBarberId}/availability/exceptions",
            blockRequest);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        var blockedStart = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(date.ToDateTime(new TimeOnly(10, 0)), DateTimeKind.Unspecified),
            timeZone);
        var stillAvailable = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(date.ToDateTime(new TimeOnly(11, 0)), DateTimeKind.Unspecified),
            timeZone);
        var availability = await publicClient.GetFromJsonAsync<BarberAvailabilityResponse>(
            $"/api/barbers/{fixture.OtherBarberId}/availability?date={date:yyyy-MM-dd}&serviceId={fixture.ServiceId}");

        Assert.DoesNotContain(availability!.Slots, slot => slot.StartUtc == blockedStart);
        Assert.Contains(availability.Slots, slot => slot.StartUtc == stillAvailable);
    }

    [Fact]
    public async Task WalkInBooking_UsesOwnershipAndExclusionConstraint()
    {
        using var barberClient = await LoginAsync(fixture.BarberEmail, fixture.Password);
        using var otherBarberClient = await LoginAsync(
            "other-barber.integration@example.test",
            fixture.Password);
        var bookingDate = fixture.BookingDate.AddDays(7);
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        var walkInStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(bookingDate.ToDateTime(new TimeOnly(10, 0)), DateTimeKind.Unspecified),
            timeZone);
        var request = new CreateWalkInAppointmentRequest(
            fixture.BarberId,
            fixture.ServiceId,
            new DateTimeOffset(walkInStartUtc),
            "Walk-in Client",
            "+5511999999999");

        var forbidden = await otherBarberClient.PostAsJsonAsync("/api/appointments/walk-in", request);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        var firstTask = barberClient.PostAsJsonAsync("/api/appointments/walk-in", request);
        var secondTask = barberClient.PostAsJsonAsync("/api/appointments/walk-in", request with
        {
            ClientName = "Another Walk-in"
        });
        var responses = await Task.WhenAll(firstTask, secondTask);

        Assert.Equal(
            [HttpStatusCode.Created, HttpStatusCode.Conflict],
            responses.Select(response => response.StatusCode).Order().ToArray());

        using var scope = fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var activeAppointments = await dbContext.Appointments
            .CountAsync(appointment =>
                appointment.BarberId == fixture.BarberId &&
                appointment.StartUtc == walkInStartUtc &&
                appointment.Status != AppointmentStatus.Cancelled);
        Assert.Equal(1, activeAppointments);

        var createdResponse = responses.Single(response => response.StatusCode == HttpStatusCode.Created);
        var created = await createdResponse.Content.ReadFromJsonAsync<AppointmentResponse>();
        Assert.NotNull(created);

        var cancelled = await barberClient.PostAsync(
            $"/api/appointments/{created!.Id}/cancel",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, cancelled.StatusCode);
    }

    [Fact]
    public async Task BookingRaceStress_AlwaysCreatesExactlyOneActiveAppointment()
    {
        using var publicClient = fixture.CreateClient();
        var firstEmail = $"stress-one-{Guid.NewGuid():N}@example.test";
        var secondEmail = $"stress-two-{Guid.NewGuid():N}@example.test";
        await RegisterAsync(publicClient, firstEmail, "Stress One");
        await RegisterAsync(publicClient, secondEmail, "Stress Two");

        using var firstClient = await LoginAsync(firstEmail, fixture.Password);
        using var secondClient = await LoginAsync(secondEmail, fixture.Password);
        var request = new CreateAppointmentRequest(
            fixture.BarberId,
            fixture.ServiceId,
            new DateTimeOffset(fixture.BookingStartUtc));

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var gate = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            var firstBookingTask = PostBookingAfterSignalAsync(firstClient, request, gate.Task);
            var secondBookingTask = PostBookingAfterSignalAsync(secondClient, request, gate.Task);
            gate.SetResult(true);

            var responses = await Task.WhenAll(firstBookingTask, secondBookingTask);
            Assert.Equal(
                [HttpStatusCode.Created, HttpStatusCode.Conflict],
                responses.Select(response => response.StatusCode).Order().ToArray());

            var createdResponse = responses.Single(response => response.StatusCode == HttpStatusCode.Created);
            var created = await createdResponse.Content.ReadFromJsonAsync<AppointmentResponse>();
            Assert.NotNull(created);

            using var scope = fixture.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var activeAppointments = await dbContext.Appointments
                .CountAsync(appointment =>
                    appointment.BarberId == fixture.BarberId &&
                    appointment.StartUtc == fixture.BookingStartUtc &&
                    appointment.Status != AppointmentStatus.Cancelled);
            Assert.Equal(1, activeAppointments);

            var winnerClient = responses[0].StatusCode == HttpStatusCode.Created
                ? firstClient
                : secondClient;
            var cancellationResponse = await winnerClient.PostAsync(
                $"/api/appointments/{created!.Id}/cancel",
                content: null);
            Assert.Equal(HttpStatusCode.NoContent, cancellationResponse.StatusCode);
        }
    }

    private async Task RegisterAsync(HttpClient client, string email, string fullName)
    {
        var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest(fullName, email, fixture.Password));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var registered = await response.Content.ReadFromJsonAsync<RegisteredUserResponse>();
        Assert.Equal(["Client"], registered!.Roles);
    }

    private async Task<HttpClient> LoginAsync(string email, string password)
    {
        using var client = fixture.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        response.EnsureSuccessStatusCode();
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();

        var authenticatedClient = fixture.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(login!.TokenType, login.AccessToken);
        return authenticatedClient;
    }

    private static async Task<HttpResponseMessage> PostBookingAfterSignalAsync(
        HttpClient client,
        CreateAppointmentRequest request,
        Task signal)
    {
        await signal;
        return await client.PostAsJsonAsync("/api/appointments", request);
    }

    private async Task AssertExclusionConstraintExistsAsync()
    {
        using var scope = fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.OpenConnectionAsync();
        await using var command = dbContext.Database.GetDbConnection().CreateCommand();
        command.CommandText =
            "SELECT EXISTS (SELECT 1 FROM pg_constraint " +
            "WHERE conname = 'EX_Appointments_BarberId_TimeRange' AND contype = 'x')";

        Assert.True((bool)(await command.ExecuteScalarAsync())!);
    }

    private Appointment CreateAppointment(DateTime startUtc, DateTime endUtc) => new()
    {
        Id = Guid.NewGuid(),
        ClientUserId = fixture.ConstraintClientUserId,
        BarberId = fixture.BarberId,
        ServiceId = fixture.ServiceId,
        StartUtc = startUtc,
        EndUtc = endUtc,
        Status = AppointmentStatus.Confirmed
    };

    private static async Task<PostgresException?> SaveAndCapturePostgresExceptionAsync(
        AppDbContext dbContext)
    {
        try
        {
            await dbContext.SaveChangesAsync();
            return null;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException postgresException)
        {
            return postgresException;
        }
    }
}
