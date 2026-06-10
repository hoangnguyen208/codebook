using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodeBook.Api.Migrations
{
    /// <inheritdoc />
    public partial class ManyToManyItemCollections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItemCollections",
                columns: table => new
                {
                    ItemId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CollectionId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemCollections", x => new { x.ItemId, x.CollectionId });
                    table.ForeignKey(
                        name: "FK_ItemCollections_Collections_CollectionId",
                        column: x => x.CollectionId,
                        principalTable: "Collections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItemCollections_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItemCollections_CollectionId",
                table: "ItemCollections",
                column: "CollectionId");

            // Migrate existing data from Item.CollectionId to ItemCollections
            migrationBuilder.Sql(
                @"INSERT INTO ItemCollections (ItemId, CollectionId)
                  SELECT Id, CollectionId FROM Items WHERE CollectionId IS NOT NULL");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Collections_CollectionId",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Items_CollectionId",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "CollectionId",
                table: "Items");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CollectionId",
                table: "Items",
                type: "nvarchar(450)",
                nullable: true);

            // Restore data: pick first collection per item (lossy for many-to-many)
            migrationBuilder.Sql(
                @"UPDATE Items SET CollectionId = (
                  SELECT TOP 1 CollectionId FROM ItemCollections WHERE ItemCollections.ItemId = Items.Id)");

            migrationBuilder.CreateIndex(
                name: "IX_Items_CollectionId",
                table: "Items",
                column: "CollectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Collections_CollectionId",
                table: "Items",
                column: "CollectionId",
                principalTable: "Collections",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.DropTable(
                name: "ItemCollections");
        }
    }
}
