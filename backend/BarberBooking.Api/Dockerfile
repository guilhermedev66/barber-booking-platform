FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["BarberBooking.Api/BarberBooking.Api.csproj", "BarberBooking.Api/"]
COPY ["BarberBooking.Domain/BarberBooking.Domain.csproj", "BarberBooking.Domain/"]
COPY ["BarberBooking.Infrastructure/BarberBooking.Infrastructure.csproj", "BarberBooking.Infrastructure/"]
RUN dotnet restore "BarberBooking.Api/BarberBooking.Api.csproj"

COPY . .
RUN dotnet publish "BarberBooking.Api/BarberBooking.Api.csproj" \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "BarberBooking.Api.dll"]
