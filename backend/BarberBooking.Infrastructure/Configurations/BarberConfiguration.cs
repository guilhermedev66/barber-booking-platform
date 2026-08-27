using BarberBooking.Domain.Entities;
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

        builder.HasMany(b => b.Availabilities)
            .WithOne(a => a.Barber)
            .HasForeignKey(a => a.BarberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
