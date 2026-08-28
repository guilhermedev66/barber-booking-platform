using System.ComponentModel.DataAnnotations;
using BarberBooking.Api.Services;
using BarberBooking.Infrastructure;
using BarberBooking.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BarberBooking.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    JwtTokenService jwtTokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType<RegisteredUserResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RegisteredUserResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim()
        };

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return IdentityValidationProblem(createResult);
        }

        var roleResult = await userManager.AddToRoleAsync(user, Roles.Client);
        if (!roleResult.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return IdentityValidationProblem(roleResult);
        }

        await transaction.CommitAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new RegisteredUserResponse(
            user.Id,
            user.FullName,
            user.Email!,
            [Roles.Client]));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return InvalidCredentials();
        }

        var signInResult = await signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);

        if (!signInResult.Succeeded)
        {
            return InvalidCredentials();
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.Create(user, roles);

        return Ok(new LoginResponse(
            token.AccessToken,
            "Bearer",
            token.ExpiresAtUtc,
            new AuthenticatedUserResponse(
                user.Id,
                user.FullName,
                user.Email!,
                roles.ToList())));
    }

    private ActionResult IdentityValidationProblem(IdentityResult result)
    {
        foreach (var errorGroup in result.Errors.GroupBy(error => error.Code))
        {
            ModelState.AddModelError(errorGroup.Key, string.Join(" ", errorGroup.Select(error => error.Description)));
        }

        return ValidationProblem(ModelState);
    }

    private UnauthorizedObjectResult InvalidCredentials() => Unauthorized(new ProblemDetails
    {
        Status = StatusCodes.Status401Unauthorized,
        Title = "Invalid credentials."
    });
}

public sealed record RegisterRequest(
    [Required, MaxLength(200)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record RegisteredUserResponse(
    string Id,
    string? FullName,
    string Email,
    IReadOnlyList<string> Roles);

public sealed record AuthenticatedUserResponse(
    string Id,
    string? FullName,
    string Email,
    IReadOnlyList<string> Roles);

public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    DateTimeOffset ExpiresAtUtc,
    AuthenticatedUserResponse User);
