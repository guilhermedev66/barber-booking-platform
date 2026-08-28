using BarberBooking.Domain.Entities;
using BarberBooking.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberBooking.Infrastructure.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable(table =>
            table.HasCheckConstraint(
                "CK_Appointments_ValidTimeRange",
                "\"StartUtc\" < \"EndUtc\""));

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ClientUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(a => a.Barber)
            .WithMany()
            .HasForeignKey(a => a.BarberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Service)
            .WithMany()
            .HasForeignKey(a => a.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(a => a.ClientUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Speeds up the conflict-check query (same barber, time-range lookups).
        builder.HasIndex(a => new { a.BarberId, a.StartUtc, a.EndUtc });
        builder.HasIndex(a => new { a.ClientUserId, a.StartUtc });
    }
}
