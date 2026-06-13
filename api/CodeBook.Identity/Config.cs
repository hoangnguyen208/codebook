using Duende.IdentityServer.Models;

namespace CodeBook.Identity;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        new IdentityResource[]
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResources.Email(),
            new IdentityResource("pro", new[] { "isPro", "stripeCustomerId" }),
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new ApiScope[]
        {
            new("codebook.api", "CodeBook API")
            {
                UserClaims = { "isPro", "stripeCustomerId" }
            },
        };

    public static IEnumerable<Client> GetClients(IConfiguration configuration)
    {
        var issuerBaseUrl = configuration["AuthClient:BaseUrl"] ?? "http://localhost:3000";
        var clientId = configuration["AuthClient:ClientId"] ?? "codebook-webapp";
        var clientSecret = configuration["AuthClient:ClientSecret"] ?? "codebook-webapp-secret";

        return new Client[]
        {
            new Client
            {
                ClientId = clientId,
                ClientName = "CodeBook Web App",
                ClientSecrets = { new Secret(clientSecret.Sha256()) },

                AllowedGrantTypes = { GrantType.AuthorizationCode, GrantType.ResourceOwnerPassword },
                RequirePkce = true,
                RequireClientSecret = true,
                AllowAccessTokensViaBrowser = false,

                RedirectUris =
                {
                    $"{issuerBaseUrl}/api/auth/callback/duende-identity-server6"
                },
                PostLogoutRedirectUris =
                {
                    issuerBaseUrl
                },
                AllowedCorsOrigins =
                {
                    issuerBaseUrl
                },

                AllowOfflineAccess = true,
                AllowedScopes = { "openid", "profile", "email", "pro", "codebook.api" }
            },
        };
    }
}
