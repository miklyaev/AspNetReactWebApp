using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JiraClone.Data.Migrations
{
    /// <inheritdoc />
    public partial class TaskDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "TimeSpent",
                table: "Tasks",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeSpent",
                table: "Tasks");
        }
    }
}
