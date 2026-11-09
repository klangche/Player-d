# Player-d core: .NET 8 API serving the React WebGUI.
# Build context: repository root.

FROM --platform=$BUILDPLATFORM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Framework-dependent output runs on every architecture of the
# runtime image, so it is built once on the build platform.
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS core
WORKDIR /src
COPY core/src/PlayerD.Core/PlayerD.Core.csproj core/src/PlayerD.Core/packages.lock.json ./
RUN dotnet restore --locked-mode
COPY core/src/PlayerD.Core/ ./
RUN dotnet publish -c Release --no-restore -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
ARG VERSION=dev
ENV PLAYERD_VERSION=$VERSION
WORKDIR /app
COPY --from=core /out ./
COPY --from=web /web/dist ./wwwroot
VOLUME ["/config", "/run/player-d"]
ENTRYPOINT ["dotnet", "PlayerD.Core.dll"]
