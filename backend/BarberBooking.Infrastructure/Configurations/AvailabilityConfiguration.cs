using BarberBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberBooking.Infrastructure.Configurations;

public class AvailabilityConfiguration : IEntityTypeConfiguration<Availability>
{
    public void Configure(EntityTypeBuilder<Availability> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(a => new { a.BarberId, a.Type, a.DayOfWeek });
        builder.HasIndex(a => new { a.BarberId, a.Type, a.Date });
    }
}
