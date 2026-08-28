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
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["sh", "-c", "exec dotnet BarberBooking.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
