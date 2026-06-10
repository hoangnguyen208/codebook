# syntax=docker/dockerfile:1

# ── Build stage ──
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Copy the solution file AND all .csproj files first to preserve NuGet cache
COPY api/CodeBook.Api/CodeBook.Api.csproj api/CodeBook.Api/

# 2. Restore using the BuildKit cache mount
RUN --mount=type=cache,id=nuget-api,target=/root/.nuget/packages \
    dotnet restore api/CodeBook.Api/CodeBook.Api.csproj

# 3. Copy the rest of the source code
COPY api/CodeBook.Api/ api/CodeBook.Api/

# 4. Publish optimized binaries
# Added optimization flags for smaller, faster container starts
RUN --mount=type=cache,id=nuget-api,target=/root/.nuget/packages \
    dotnet publish api/CodeBook.Api/CodeBook.Api.csproj \
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

EXPOSE 5000

# Secure non-root user (Built into .NET images automatically)
USER $APP_UID

COPY --from=build /app .
ENTRYPOINT ["dotnet", "CodeBook.Api.dll"]
