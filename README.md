# Player-d

Player-d is a multi-room audio system for Dante speakers, in the spirit
of Sonos. It runs as a Docker Compose stack on a Linux host: a virtual
Dante soundcard, a mixer per zone, a built-in Dante controller, and
Spotify Connect, AirPlay and Tidal Connect per zone. Everything is
controlled from a web interface.

Intended use: showrooms, stores and homes.

## Features

- Virtual Dante soundcard, up to 256 x 256 channels
- Built-in Dante controller: patch speakers (and Dante inputs) into
  zones once; everything else is done per zone
- Zones with custom names, each with its own mixer: a level per source,
  a level per speaker (speakers can be different models and sizes) and
  a master level
- "All zones": a built-in zone that plays to every zone at once
- Per zone: a Spotify Connect device, an AirPlay target and a Tidal
  Connect target, named after the zone
- Own web address per zone: `<zone>.player-d.local:<port>` (mDNS), or
  `<host>:<port>/z/<zone>`
- Login: every installation generates a unique password, printed once in
  the log, which must be changed at the first login
- Lifetime license per company, verified offline, unlimited use

## Install

One YAML for both Portainer and Docker Compose. Edit the settings at
the top of the file (usually only `PLAYERD_DANTE_NIC`), then deploy.
The same file is [`docker-compose.yml`](docker-compose.yml) in this
repository. Details: [docs/install.md](docs/install.md).

**Portainer:** Stacks > Add stack, name `player-d`, Build method: Web
editor, paste the YAML below, Deploy the stack.

**Docker Compose:** save the YAML below as `docker-compose.yml`, then
`docker compose up -d`.

<!-- compose:start -->
```yaml
# Player-d stack: one file for Portainer (Stacks > Add stack > Web
# editor) and Docker Compose (`docker compose up -d`).
# Change the settings below, then deploy. Nothing else is needed.

name: player-d

# Settings, shared by every service.
x-settings: &settings
  PLAYERD_HTTP_PORT: "8080"     # Web GUI port
  PLAYERD_HOSTNAME: player-d    # mDNS: <zone>.player-d.local
  PLAYERD_DANTE_NIC: eth0       # network interface on the Dante network
  PLAYERD_SAMPLE_RATE: "48000"  # 48000 or 96000
  PLAYERD_LICENSE: ""           # optional; can also be imported in Settings
  PLAYERD_RESET_PASSWORD: "false"  # true: new admin password in the log on every start
  TZ: Etc/UTC

x-service: &service
  restart: unless-stopped
  # Host networking is required: Dante audio, PTP clock and mDNS
  # (zone addresses, Spotify/AirPlay discovery) do not cross Docker NAT.
  network_mode: host
  environment: *settings
  logging:
    driver: json-file
    options:
      max-size: 10m
      max-file: "3"

# Image tag: `latest` follows the newest release. To pin a version or
# run the beta, change `:latest` on all five images (e.g. `:0.2.0`, `:dev`).
services:
  core:
    <<: *service
    image: ghcr.io/klangche/player-d-core:latest
    container_name: player-d-core
    volumes:
      # Config, password hash and license. For a host folder instead of
      # the named volume, use e.g. `/opt/player-d:/config`.
      - player-d-data:/config
      - player-d-run:/run/player-d

  dante:
    <<: *service
    image: ghcr.io/klangche/player-d-dante:latest
    container_name: player-d-dante
    cap_add:
      - NET_ADMIN   # PTP and multicast on the Dante NIC
      - SYS_NICE    # real-time scheduling for audio threads
    volumes:
      - player-d-run:/run/player-d
    depends_on:
      - core

  spotify:
    <<: *service
    image: ghcr.io/klangche/player-d-spotify:latest
    container_name: player-d-spotify
    volumes:
      - player-d-run:/run/player-d
      - player-d-spotify-cache:/cache
    depends_on:
      - core

  airplay:
    <<: *service
    image: ghcr.io/klangche/player-d-airplay:latest
    container_name: player-d-airplay
    volumes:
      - player-d-run:/run/player-d
    depends_on:
      - core

  tidal:
    <<: *service
    image: ghcr.io/klangche/player-d-tidal:latest
    container_name: player-d-tidal
    volumes:
      - player-d-run:/run/player-d
    depends_on:
      - core

volumes:
  player-d-data:
  player-d-run:
  player-d-spotify-cache:
```
<!-- compose:end -->

First login: read the generated password in the `player-d-core` log
(Portainer: Containers > player-d-core > Logs; Compose:
`docker compose logs core`), open `http://<host>:8080` (or your
`PLAYERD_HTTP_PORT`) and set a new password.

Update: Portainer: Stacks > player-d > Update the stack, with "Re-pull
image and redeploy" on. Compose: `docker compose pull && docker compose
up -d`.

Images are published to GHCR by GitHub Actions: `latest` and `<version>`
by the release workflow on `main`, beta builds as `dev` and
`<version>-beta.<n>` on every merge into `dev`. Until the first release,
change `:latest` to `:dev` on the five images.

## Usage

1. Open the Dante controller and patch speakers into zones.
2. Open a zone: pick a source, set the master level and each speaker's
   level.
3. Play from the Spotify, AirPlay or Tidal app to the zone's name.

## Platforms

- Docker on Linux (host networking is required for Dante, PTP and mDNS)

## Development

- `core`: C#/.NET 8 (API, mixer, Dante controller, auth, license)
- WebGUI: TypeScript (React), served by `core`
- Backends, one container each: `dante`, `spotify` (librespot),
  `airplay` (shairport-sync), `tidal`. Until their steps land they are
  placeholder images (`services/placeholder`) that idle.

Build and test:

```
dotnet test core/PlayerD.sln
cd web && npm ci && npm test && npm run build
docker build -f core/Dockerfile -t player-d-core .
scripts/check-readme-compose.sh
```

The YAML in the README must equal `docker-compose.yml`; CI checks it.

Local GUI development: run `core` (`dotnet run --project
core/src/PlayerD.Core`) and `npm run dev` in `web`; Vite proxies `/api`
to port 8080.

Releases: `VERSION` holds the next version; betas from `dev` are
`<VERSION>-beta.<n>`. To release, merge `dev` into `main` and run the
"Release" workflow on `main` in GitHub Actions. Then bump `VERSION` on
`dev` (in a pull request) to the next version.

Contributors and AI agents follow AGENTS.md.

## License

Commercial: lifetime license per company. Third-party components keep
their own licenses; see each service.
