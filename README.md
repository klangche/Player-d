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

Two ways, both from the same sample stack file,
[`docker-compose.yml`](docker-compose.yml). Images use the `latest` tag
by default. Details: [docs/install.md](docs/install.md).

**Portainer (recommended):** Stacks > Add stack > Repository, URL of
this repository, compose path `docker-compose.yml`. Set variables from
[`.env.example`](.env.example) under "Environment variables" if the
defaults do not fit. Deploy.

**Docker Compose:**

```
curl -fsSLO https://raw.githubusercontent.com/klangche/Player-d/main/docker-compose.yml
curl -fsSL  https://raw.githubusercontent.com/klangche/Player-d/main/.env.example -o .env
# edit .env (optional)
docker compose up -d
```

First login: read the generated password in the `player-d-core` log
(Portainer: Containers > player-d-core > Logs; Compose:
`docker compose logs core`), open `http://<host>:8080` (or your
`PLAYERD_HTTP_PORT`) and set a new password.

Not released yet: the images are published with the first release.

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
  `airplay` (shairport-sync), `tidal`

Contributors and AI agents follow AGENTS.md.

## License

Commercial: lifetime license per company. Third-party components keep
their own licenses; see each service.
