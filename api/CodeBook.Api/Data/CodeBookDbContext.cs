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
    public virtual DbSet<ItemCollection> ItemCollections { get; set; } = null!;

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
            .HasIndex(i => i.UserId);

        modelBuilder.Entity<Collection>()
            .HasIndex(c => c.UserId);

        // ItemCollection (many-to-many Item ↔ Collection)
        modelBuilder.Entity<ItemCollection>()
            .HasKey(ic => new { ic.ItemId, ic.CollectionId });

        modelBuilder.Entity<ItemCollection>()
            .HasOne(ic => ic.Item)
            .WithMany(i => i.ItemCollections)
            .HasForeignKey(ic => ic.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemCollection>()
            .HasOne(ic => ic.Collection)
            .WithMany(c => c.ItemCollections)
            .HasForeignKey(ic => ic.CollectionId)
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
    }
}
