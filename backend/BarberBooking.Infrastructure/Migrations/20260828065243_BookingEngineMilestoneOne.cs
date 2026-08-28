using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BookingEngineMilestoneOne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BarberServices",
                columns: table => new
                {
                    BarberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BarberServices", x => new { x.BarberId, x.ServiceId });
                    table.ForeignKey(
                        name: "FK_BarberServices_Barbers_BarberId",
                        column: x => x.BarberId,
                        principalTable: "Barbers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BarberServices_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Availabilities_DayOffOnlyForExceptions",
                table: "Availabilities",
                sql: "\"Type\" = 'Exception' OR NOT \"IsDayOff\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Availabilities_ValidTimeRange",
                table: "Availabilities",
                sql: "\"IsDayOff\" OR \"StartTime\" < \"EndTime\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Availabilities_ValidTypeFields",
                table: "Availabilities",
                sql: "(\"Type\" = 'Recurring' AND \"DayOfWeek\" IS NOT NULL AND \"Date\" IS NULL) OR (\"Type\" = 'Exception' AND \"Date\" IS NOT NULL AND \"DayOfWeek\" IS NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ClientUserId_StartUtc",
                table: "Appointments",
                columns: new[] { "ClientUserId", "StartUtc" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Appointments_ValidTimeRange",
                table: "Appointments",
                sql: "\"StartUtc\" < \"EndUtc\"");

            migrationBuilder.Sql(
                """
                CREATE EXTENSION IF NOT EXISTS btree_gist;

                ALTER TABLE "Appointments"
                ADD CONSTRAINT "EX_Appointments_BarberId_TimeRange"
                EXCLUDE USING gist
                (
                    "BarberId" WITH =,
                    tstzrange("StartUtc", "EndUtc", '[)') WITH &&
                )
                WHERE ("Status" <> 'Cancelled');
                """);

            migrationBuilder.CreateIndex(
                name: "IX_BarberServices_ServiceId",
                table: "BarberServices",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AspNetUsers_ClientUserId",
                table: "Appointments",
                column: "ClientUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Barbers_AspNetUsers_UserId",
                table: "Barbers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Appointments"
                DROP CONSTRAINT "EX_Appointments_BarberId_TimeRange";
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AspNetUsers_ClientUserId",
                table: "Appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_Barbers_AspNetUsers_UserId",
                table: "Barbers");

            migrationBuilder.DropTable(
                name: "BarberServices");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Availabilities_DayOffOnlyForExceptions",
                table: "Availabilities");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Availabilities_ValidTimeRange",
                table: "Availabilities");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Availabilities_ValidTypeFields",
                table: "Availabilities");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_ClientUserId_StartUtc",
                table: "Appointments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Appointments_ValidTimeRange",
                table: "Appointments");
        }
    }
}
