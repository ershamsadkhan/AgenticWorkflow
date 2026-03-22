namespace FlowForge.Core.Interfaces;

public interface ICredentialService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
    Dictionary<string, string> DecryptCredential(string encryptedData);
}
