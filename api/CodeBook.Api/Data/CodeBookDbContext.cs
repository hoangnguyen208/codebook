using CodeBook.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Data;

public class CodeBookDbContext : DbContext
{
    public CodeBookDbContext(DbContextOptions<CodeBookDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Item> Items { get; set; }
    public DbSet<ItemType> ItemTypes { get; set; }
    public DbSet<Collection> Collections { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<ItemTag> ItemTags { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>()
            .HasKey(u => u.Id);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // ItemType configuration
        modelBuilder.Entity<ItemType>()
            .HasOne(it => it.User)
            .WithMany(u => u.ItemTypes)
            .HasForeignKey(it => it.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Item configuration
        modelBuilder.Entity<Item>()
            .HasOne(i => i.User)
            .WithMany(u => u.Items)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Item>()
            .HasOne(i => i.Type)
            .WithMany(it => it.Items)
            .HasForeignKey(i => i.TypeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Item>()
            .HasOne(i => i.Collection)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CollectionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Collection configuration
        modelBuilder.Entity<Collection>()
            .HasOne(c => c.User)
            .WithMany(u => u.Collections)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Tag configuration
        modelBuilder.Entity<Tag>()
            .HasOne(t => t.User)
            .WithMany(u => u.Tags)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ItemTag configuration (composite key)
        modelBuilder.Entity<ItemTag>()
            .HasKey(it => new { it.ItemId, it.TagId });

        modelBuilder.Entity<ItemTag>()
            .HasOne(it => it.Item)
            .WithMany(i => i.Tags)
            .HasForeignKey(it => it.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemTag>()
            .HasOne(it => it.Tag)
            .WithMany(t => t.Items)
            .HasForeignKey(it => it.TagId)
            .OnDelete(DeleteBehavior.NoAction);

        // Add indexes for performance
        modelBuilder.Entity<Item>()
            .HasIndex(i => new { i.UserId, i.CreatedAt })
            .IsDescending(false, true);

        modelBuilder.Entity<Collection>()
            .HasIndex(c => c.UserId);

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.UserId);
    }
}
