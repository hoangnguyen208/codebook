using CodeBook.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Data;

public class CodeBookDbContext : DbContext
{
    public CodeBookDbContext(DbContextOptions<CodeBookDbContext> options) : base(options)
    {
    }

    protected CodeBookDbContext()
    {
    }

    public virtual DbSet<Item> Items { get; set; } = null!;
    public virtual DbSet<ItemType> ItemTypes { get; set; } = null!;
    public virtual DbSet<Collection> Collections { get; set; } = null!;
    public virtual DbSet<Tag> Tags { get; set; } = null!;
    public virtual DbSet<ItemTag> ItemTags { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Item configuration
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

    }
}
