FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY codebook.sln ./
COPY api/CodeBook.Api/CodeBook.Api.csproj ./api/CodeBook.Api/

RUN dotnet restore ./api/CodeBook.Api/CodeBook.Api.csproj

COPY . . 
RUN dotnet publish ./api/CodeBook.Api/CodeBook.Api.csproj -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5000
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CodeBook.Api.dll"]