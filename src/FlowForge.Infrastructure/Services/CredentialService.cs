using System.Security.Cryptography;
using System.Text;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json;

namespace FlowForge.Infrastructure.Services;

public class CredentialService : ICredentialService
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public CredentialService(string encryptionKey)
    {
        using var sha256 = SHA256.Create();
        _key = sha256.ComputeHash(Encoding.UTF8.GetBytes(encryptionKey));
        _iv = _key[..16];
    }

    public string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        var encryptor = aes.CreateEncryptor();
        var bytes = Encoding.UTF8.GetBytes(plainText);
        var encrypted = encryptor.TransformFinalBlock(bytes, 0, bytes.Length);
        return Convert.ToBase64String(encrypted);
    }

    public string Decrypt(string cipherText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        var decryptor = aes.CreateDecryptor();
        var bytes = Convert.FromBase64String(cipherText);
        var decrypted = decryptor.TransformFinalBlock(bytes, 0, bytes.Length);
        return Encoding.UTF8.GetString(decrypted);
    }

    public Dictionary<string, string> DecryptCredential(string encryptedData)
    {
        try
        {
            var json = Decrypt(encryptedData);
            return JsonConvert.DeserializeObject<Dictionary<string, string>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }
}
