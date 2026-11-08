# Installing Player-d

Player-d is a Docker stack. There are two supported ways to install it,
both from the same file, [`docker-compose.yml`](../docker-compose.yml):

1. Portainer stack (main way)
2. Docker Compose

Everything the stack needs is declared in that file: images, volumes,
folders, capabilities and settings. Settings are environment variables
with defaults, listed in [`.env.example`](../.env.example). Nothing is
set up on the host by hand.

## Requirements

- Linux host with Docker Engine 24+ (Portainer 2.19+ for the Portainer
  way).
- A network interface on the Dante network. Gigabit is required for
  large channel counts.
- Host networking: the stack uses `network_mode: host` for Dante audio,
  the PTP clock and mDNS. Docker Desktop on Windows or macOS does not
  provide this; use a Linux host or VM.
- Host ports: with host networking every service binds its ports
  directly on the host (web port, Dante, PTP, mDNS, Spotify, AirPlay).
  Stop a PTP daemon on the host (for example `ptp4l`) before starting
  the stack. An `avahi-daemon` on the host can stay; Player-d uses it
  when present.

## 1. Portainer stack

**From the repository** (receives updates on redeploy):

1. Stacks > Add stack, name `player-d`.
2. Build method: Repository.
   - Repository URL: `https://github.com/klangche/Player-d`
   - Reference: `refs/heads/main`
   - Compose path: `docker-compose.yml`
3. Environment variables: add any variable from `.env.example` whose
   default does not fit. The usual one is `PLAYERD_DANTE_NIC`. You can
   also use "Load variables from .env file".
4. Deploy the stack.

**From the web editor:** Build method: Web editor, paste the contents of
`docker-compose.yml`, then follow steps 3 and 4.

**Update:** Stacks > player-d > Pull and redeploy, with "Re-pull image"
switched on. With the `latest` tag this moves to the newest release.

## 2. Docker Compose

```
mkdir player-d && cd player-d
curl -fsSLO https://raw.githubusercontent.com/klangche/Player-d/main/docker-compose.yml
curl -fsSL  https://raw.githubusercontent.com/klangche/Player-d/main/.env.example -o .env
# edit .env (optional)
docker compose up -d
```

**Update:** `docker compose pull && docker compose up -d`.

## First login

1. Read the generated password in the `player-d-core` log:
   - Portainer: Containers > player-d-core > Logs.
   - Compose: `docker compose logs core`.
2. Open `http://<host>:8080` (or your `PLAYERD_HTTP_PORT`).
3. Log in and set a new password. The generated password stops working.

Lost password: set `PLAYERD_RESET_PASSWORD=true` in the stack and
redeploy. A new password is printed in the log; set the variable back to
`false` after logging in.

## Settings

| Variable              | Default          | Meaning                                      |
| --------------------- | ---------------- | -------------------------------------------- |
| `PLAYERD_TAG`         | `latest`         | Image tag for every service                  |
| `PLAYERD_HTTP_PORT`   | `8080`           | Web GUI port                                 |
| `PLAYERD_HOSTNAME`    | `player-d`       | mDNS name: `<zone>.<PLAYERD_HOSTNAME>.local` |
| `PLAYERD_DANTE_NIC`   | `eth0`           | Interface on the Dante network               |
| `PLAYERD_SAMPLE_RATE` | `48000`          | `48000` or `96000`                           |
| `PLAYERD_DATA`        | `player-d-data`  | `player-d-data` (default named volume) or an absolute host path such as `/opt/player-d` |
| `PLAYERD_LICENSE`     | empty            | Optional license key text                    |
| `PLAYERD_RESET_PASSWORD` | `false`       | `true` prints a new admin password on start  |
| `TZ`                  | `Etc/UTC`        | Time zone for logs                           |

The network values (port, host name, Dante NIC, sample rate) are set
only in the stack. Settings > Network shows them read-only; change them
in Portainer or `.env` and redeploy.

Pin a version instead of `latest` by setting `PLAYERD_TAG`, for example
`PLAYERD_TAG=0.2.0`.

## Data and secrets

- All persistent data lives in one location, mounted at `/config` in
  `core`: configuration, the password hash and the license. Back up
  that volume or folder.
- No secret is needed to start. The admin password is generated on the
  first start and only its hash is stored.
- The license key is entered either in Settings or as `PLAYERD_LICENSE`.
  In Portainer, stack environment variables are stored by Portainer and
  are not part of the compose file.

## Services

| Service   | Image                               | Role                                        |
| --------- | ----------------------------------- | ------------------------------------------- |
| `core`    | `ghcr.io/klangche/player-d-core`    | Web GUI, API, mixer, Dante controller       |
| `dante`   | `ghcr.io/klangche/player-d-dante`   | Virtual Dante soundcard                     |
| `spotify` | `ghcr.io/klangche/player-d-spotify` | Spotify Connect, one receiver per zone      |
| `airplay` | `ghcr.io/klangche/player-d-airplay` | AirPlay, one receiver per zone              |
| `tidal`   | `ghcr.io/klangche/player-d-tidal`   | Tidal Connect, one receiver per zone        |

`core` starts the receivers for each zone. A source turned off in
Settings stays idle; its container keeps running.
