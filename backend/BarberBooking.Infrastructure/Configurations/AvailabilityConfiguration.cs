using BarberBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberBooking.Infrastructure.Configurations;

public class AvailabilityConfiguration : IEntityTypeConfiguration<Availability>
{
    public void Configure(EntityTypeBuilder<Availability> builder)
    {
        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_Availabilities_ValidTypeFields",
                "(\"Type\" = 'Recurring' AND \"DayOfWeek\" IS NOT NULL AND \"Date\" IS NULL) OR " +
                "(\"Type\" = 'Exception' AND \"Date\" IS NOT NULL AND \"DayOfWeek\" IS NULL)");
            table.HasCheckConstraint(
                "CK_Availabilities_ValidTimeRange",
                "\"IsDayOff\" OR \"StartTime\" < \"EndTime\"");
            table.HasCheckConstraint(
                "CK_Availabilities_DayOffOnlyForExceptions",
                "\"Type\" = 'Exception' OR NOT \"IsDayOff\"");
        });

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(a => new { a.BarberId, a.Type, a.DayOfWeek });
        builder.HasIndex(a => new { a.BarberId, a.Type, a.Date });
    }
}
