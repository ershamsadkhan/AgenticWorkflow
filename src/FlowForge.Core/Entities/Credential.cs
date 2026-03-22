namespace FlowForge.Core.Entities;

public class Credential
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // e.g., "OAuth2", "ApiKey", "BasicAuth"
    public string EncryptedData { get; set; } = string.Empty; // AES encrypted JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
