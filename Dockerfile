FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release

# Установка Node.js для сборки React
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /src

# Копируем файлы решений и проектов для восстановления зависимостей
COPY ["AspNetReactApp.slnx", "./"]
COPY ["AspNetReactApp/AspNetReactApp.csproj", "AspNetReactApp/"]
COPY ["JiraClone.Data/JiraClone.Data.csproj", "JiraClone.Data/"]

RUN dotnet restore "AspNetReactApp/AspNetReactApp.csproj"

# Копируем весь исходный код
COPY . .

WORKDIR "/src/AspNetReactApp"
RUN dotnet build "AspNetReactApp.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
RUN dotnet publish "AspNetReactApp.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Настройка Kestrel на порт 5000 (стандарт для контейнеров)
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "AspNetReactApp.dll"]
