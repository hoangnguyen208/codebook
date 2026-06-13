using CodeBook.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Services;

public class UsageLimits
{
    public int ItemCount { get; set; }
    public int ItemLimit { get; set; }
    public int CollectionCount { get; set; }
    public int CollectionLimit { get; set; }
    public bool IsPro { get; set; }
    public int? ItemsRemaining => IsPro ? null : ItemLimit - ItemCount;
    public int? CollectionsRemaining => IsPro ? null : CollectionLimit - CollectionCount;
    public bool CanCreateItem => IsPro || ItemCount < ItemLimit;
    public bool CanCreateCollection => IsPro || CollectionCount < CollectionLimit;
}

public class UsageLimitsService
{
    private readonly CodeBookDbContext _dbContext;

    public const int FreeItemLimit = 50;
    public const int FreeCollectionLimit = 3;

    public UsageLimitsService(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UsageLimits> GetUsageLimitsAsync(string userId, bool isPro)
    {
        var itemCount = await _dbContext.Items.CountAsync(i => i.UserId == userId);
        var collectionCount = await _dbContext.Collections.CountAsync(c => c.UserId == userId);

        return new UsageLimits
        {
            ItemCount = itemCount,
            ItemLimit = FreeItemLimit,
            CollectionCount = collectionCount,
            CollectionLimit = FreeCollectionLimit,
            IsPro = isPro
        };
    }

    public async Task<bool> CanCreateItemAsync(string userId, bool isPro, string? contentType = null)
    {
        if (isPro) return true;

        var itemCount = await _dbContext.Items.CountAsync(i => i.UserId == userId);
        return itemCount < FreeItemLimit;
    }

    public async Task<bool> CanCreateCollectionAsync(string userId, bool isPro)
    {
        if (isPro) return true;

        var collectionCount = await _dbContext.Collections.CountAsync(c => c.UserId == userId);
        return collectionCount < FreeCollectionLimit;
    }

    public async Task<int> GetItemCountAsync(string userId)
    {
        return await _dbContext.Items.CountAsync(i => i.UserId == userId);
    }

    public async Task<int> GetCollectionCountAsync(string userId)
    {
        return await _dbContext.Collections.CountAsync(c => c.UserId == userId);
    }
}
