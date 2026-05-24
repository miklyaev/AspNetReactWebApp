using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JiraClone.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorEmployeeTPH_Final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Executors_AuthorId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Executors_ExecutorId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Executors_ExecutorId",
                table: "TimeEntries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Executors",
                table: "Executors");

            migrationBuilder.RenameTable(
                name: "Executors",
                newName: "Employees");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeType",
                table: "Employees",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Login",
                table: "Employees",
                type: "character varying(12)",
                maxLength: 12,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "Employees",
                type: "character varying(12)",
                maxLength: 12,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Employees",
                table: "Employees",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Employees_AuthorId",
                table: "Comments",
                column: "AuthorId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Employees_ExecutorId",
                table: "Tasks",
                column: "ExecutorId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Employees_ExecutorId",
                table: "TimeEntries",
                column: "ExecutorId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Employees_AuthorId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Employees_ExecutorId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Employees_ExecutorId",
                table: "TimeEntries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Employees",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmployeeType",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Login",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Password",
                table: "Employees");

            migrationBuilder.RenameTable(
                name: "Employees",
                newName: "Executors");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Executors",
                table: "Executors",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Executors_AuthorId",
                table: "Comments",
                column: "AuthorId",
                principalTable: "Executors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Executors_ExecutorId",
                table: "Tasks",
                column: "ExecutorId",
                principalTable: "Executors",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Executors_ExecutorId",
                table: "TimeEntries",
                column: "ExecutorId",
                principalTable: "Executors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
