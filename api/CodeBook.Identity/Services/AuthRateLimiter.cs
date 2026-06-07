using System.Collections.Concurrent;
using System.Threading.RateLimiting;

namespace CodeBook.Identity.Services;

public class AuthRateLimiter
{
    private readonly ConcurrentDictionary<string, SlidingWindowEntry> _slidingWindows = new();
    private readonly ConcurrentDictionary<string, FixedWindowEntry> _fixedWindows = new();

    public (bool IsAllowed, TimeSpan RetryAfter) TryAcquireSliding(string key, int permitLimit, TimeSpan window)
    {
        var entry = _slidingWindows.GetOrAdd(key, _ => new SlidingWindowEntry(
            permitLimit, window));

        var now = DateTimeOffset.UtcNow;

        lock (entry)
        {
            entry.Timestamps.RemoveAll(t => now - t > window);

            if (entry.Timestamps.Count >= permitLimit)
            {
                var oldest = entry.Timestamps[0];
                var retryAfter = oldest + window - now;
                return (false, retryAfter > TimeSpan.Zero ? retryAfter : TimeSpan.Zero);
            }

            entry.Timestamps.Add(now);
            return (true, TimeSpan.Zero);
        }
    }

    public (bool IsAllowed, TimeSpan RetryAfter) TryAcquireFixed(string key, int permitLimit, TimeSpan window)
    {
        var entry = _fixedWindows.GetOrAdd(key, _ => new FixedWindowEntry(window));

        var now = DateTimeOffset.UtcNow;

        lock (entry)
        {
            if (now > entry.WindowExpiry)
            {
                entry.WindowExpiry = now + window;
                entry.Count = 1;
                return (true, TimeSpan.Zero);
            }

            if (entry.Count < permitLimit)
            {
                entry.Count++;
                return (true, TimeSpan.Zero);
            }

            return (false, entry.WindowExpiry - now);
        }
    }

    private class FixedWindowEntry
    {
        public DateTimeOffset WindowExpiry;
        public int Count;

        public FixedWindowEntry(TimeSpan window)
        {
            WindowExpiry = DateTimeOffset.UtcNow + window;
            Count = 0;
        }
    }

    private class SlidingWindowEntry
    {
        public List<DateTimeOffset> Timestamps;

        public SlidingWindowEntry(int permitLimit, TimeSpan window)
        {
            Timestamps = new List<DateTimeOffset>(permitLimit);
        }
    }
}

public static class RateLimitFormat
{
    public static string FormatRetryAfter(TimeSpan retryAfter)
    {
        if (retryAfter.TotalSeconds <= 60)
            return $"{Math.Ceiling(retryAfter.TotalSeconds)} seconds";

        if (retryAfter.TotalMinutes < 60)
            return $"{Math.Ceiling(retryAfter.TotalMinutes)} minutes";

        return $"{Math.Ceiling(retryAfter.TotalHours)} hours";
    }
}
