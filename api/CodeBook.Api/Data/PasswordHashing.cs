using System.Security.Cryptography;

namespace CodeBook.Api.Data;

public static class PasswordHashing
{
    public static string HashPassword(string password)
    {
        const int saltSize = 16;
        const int hashSize = 32;
        const int iterations = 210000;

        var salt = RandomNumberGenerator.GetBytes(saltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, hashSize);

        return $"pbkdf2-sha256${iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }
}
