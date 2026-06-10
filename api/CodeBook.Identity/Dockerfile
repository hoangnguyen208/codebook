# syntax=docker/dockerfile:1

# ── Build stage ──
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file only first, for NuGet layer caching
COPY api/CodeBook.Identity/CodeBook.Identity.csproj api/CodeBook.Identity/

RUN --mount=type=cache,id=nuget-identity,target=/root/.nuget/packages \
    dotnet restore api/CodeBook.Identity/CodeBook.Identity.csproj

# Copy the rest of the source and publish
COPY api/CodeBook.Identity/ api/CodeBook.Identity/

RUN --mount=type=cache,id=nuget-identity,target=/root/.nuget/packages \
    dotnet publish api/CodeBook.Identity/CodeBook.Identity.csproj \
      -c Release \
      -o /app \
      --no-restore \
      -p:UseAppHost=false \
      -p:PublishReadyToRun=false

# ── Runtime stage ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

EXPOSE 5001

# Create writable directory for Duende signing keys before switching user
RUN mkdir -p /app/keys && chown -R $APP_UID:$APP_UID /app/keys

# Secure non-root user
USER $APP_UID

COPY --from=build /app .
ENTRYPOINT ["dotnet", "CodeBook.Identity.dll"]
