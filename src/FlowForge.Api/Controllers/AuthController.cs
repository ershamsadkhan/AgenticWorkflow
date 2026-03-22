using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FlowForge.Api.DTOs;
using FlowForge.Core.Entities;
using FlowForge.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly IConfiguration _config;

    public AuthController(IUserRepository users, IConfiguration config)
    {
        _users = users;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _users.GetByEmailAsync(request.Email);
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password" });

        user.LastLoginAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        var token = GenerateToken(user);
        return Ok(new AuthResponse(token, user.Email, user.FirstName, user.LastName, user.Role));
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var existing = await _users.GetByEmailAsync(request.Email);
        if (existing != null)
            return Conflict(new { message = "Email already registered" });

        var user = new User
        {
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName
        };

        await _users.CreateAsync(user);
        var token = GenerateToken(user);
        return Ok(new AuthResponse(token, user.Email, user.FirstName, user.LastName, user.Role));
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? "FlowForge-Super-Secret-Key-2026-Must-Be-Long-Enough!"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "FlowForge",
            audience: _config["Jwt:Audience"] ?? "FlowForge",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }
}
