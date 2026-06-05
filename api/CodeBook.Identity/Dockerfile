FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY codebook.sln ./
COPY api/CodeBook.Identity/CodeBook.Identity.csproj ./api/CodeBook.Identity/

RUN dotnet restore ./api/CodeBook.Identity/CodeBook.Identity.csproj

COPY . .
RUN dotnet publish ./api/CodeBook.Identity/CodeBook.Identity.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5001
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CodeBook.Identity.dll"]
