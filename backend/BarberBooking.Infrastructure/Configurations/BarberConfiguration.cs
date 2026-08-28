using BarberBooking.Domain.Entities;
using BarberBooking.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberBooking.Infrastructure.Configurations;

public class BarberConfiguration : IEntityTypeConfiguration<Barber>
{
    public void Configure(EntityTypeBuilder<Barber> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.UserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(b => b.DisplayName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.Bio)
            .HasMaxLength(2000);

        builder.HasIndex(b => b.UserId).IsUnique();

        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<Barber>(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.Availabilities)
            .WithOne(a => a.Barber)
            .HasForeignKey(a => a.BarberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Services)
            .WithMany(s => s.Barbers)
            .UsingEntity<Dictionary<string, object>>(
                "BarberService",
                right => right
                    .HasOne<Service>()
                    .WithMany()
                    .HasForeignKey("ServiceId")
                    .OnDelete(DeleteBehavior.Restrict),
                left => left
                    .HasOne<Barber>()
                    .WithMany()
                    .HasForeignKey("BarberId")
                    .OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.ToTable("BarberServices");
                    join.HasKey("BarberId", "ServiceId");
                    join.HasIndex("ServiceId");
                });
    }
}
