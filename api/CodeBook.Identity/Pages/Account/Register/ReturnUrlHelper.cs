using Microsoft.AspNetCore.WebUtilities;

namespace CodeBook.Identity.Pages.Account.Register;

internal static class ReturnUrlHelper
{
    public static string? StripSignupScreenHint(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return returnUrl;
        }

        var queryStartIndex = returnUrl.IndexOf('?', StringComparison.Ordinal);
        if (queryStartIndex < 0 || queryStartIndex == returnUrl.Length - 1)
        {
            return returnUrl;
        }

        var path = returnUrl[..queryStartIndex];
        var query = returnUrl[(queryStartIndex + 1)..];
        var parsedQuery = QueryHelpers.ParseQuery(query);

        if (!parsedQuery.Keys.Any(key => string.Equals(key, "screen_hint", StringComparison.OrdinalIgnoreCase)))
        {
            return returnUrl;
        }

        var filteredQuery = parsedQuery
            .Where(entry => !string.Equals(entry.Key, "screen_hint", StringComparison.OrdinalIgnoreCase))
            .SelectMany(entry => entry.Value, (entry, value) => new KeyValuePair<string, string?>(entry.Key, value));

        return QueryHelpers.AddQueryString(path, filteredQuery);
    }
}
