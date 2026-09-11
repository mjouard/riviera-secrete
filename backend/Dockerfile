FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY RivieraSecrete.Domain/RivieraSecrete.Domain.csproj RivieraSecrete.Domain/
COPY RivieraSecrete.Infrastructure/RivieraSecrete.Infrastructure.csproj RivieraSecrete.Infrastructure/
COPY RivieraSecrete.Api/RivieraSecrete.Api.csproj RivieraSecrete.Api/
RUN dotnet restore RivieraSecrete.Api/RivieraSecrete.Api.csproj

COPY . .
RUN dotnet publish RivieraSecrete.Api/RivieraSecrete.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "RivieraSecrete.Api.dll"]
