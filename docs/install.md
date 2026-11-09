# Installing Player-d

Player-d is a Docker stack. There are two supported ways to install it,
both from the same file, [`docker-compose.yml`](../docker-compose.yml):

1. Portainer stack (main way)
2. Docker Compose

Everything the stack needs is declared in that file: images, volumes,
folders, capabilities and settings. The settings are plain values in the
`x-settings` block at the top of the file; edit them there. There is no
`.env` file and no Portainer environment variable to set. The README
shows the same file. Nothing is set up on the host by hand.

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
  the stack. An `avahi-daemon` on the host can stay running.

## 1. Portainer stack

**From the web editor** (main way):

1. Stacks > Add stack, name `player-d`.
2. Build method: Web editor. Paste the YAML from the README (or
   `docker-compose.yml`).
3. Edit the settings at the top. The usual one is `PLAYERD_DANTE_NIC`.
4. Deploy the stack.

**Update:** Stacks > player-d > Update the stack, with "Re-pull image
and redeploy" switched on. With the `latest` tag this moves to the
newest release. Change settings the same way: edit the YAML in the
editor, then Update the stack.

**From the repository:** Build method: Repository, URL
`https://github.com/klangche/Player-d`, reference `refs/heads/main`,
compose path `docker-compose.yml`. This deploys the file with its
default settings; to change a setting, use the web editor instead.

## 2. Docker Compose

```
mkdir player-d && cd player-d
curl -fsSLO https://raw.githubusercontent.com/klangche/Player-d/main/docker-compose.yml
# edit the settings at the top of docker-compose.yml (optional)
docker compose up -d
```

**Update:** `docker compose pull && docker compose up -d`.

## First login

1. Read the generated password in the `player-d-core` log:
   - Portainer: Containers > player-d-core > Logs.
   - Compose: `docker compose logs core`.
2. Open `http://<host>:8080` (or your `PLAYERD_HTTP_PORT`).
3. Log in and set a new password. The generated password stops working.

Lost password: set `PLAYERD_RESET_PASSWORD: "true"` in the YAML and
redeploy. A new password is printed in the log; set it back to
`"false"` after logging in. While `true`, every start (including a host
reboot) prints a new password and the previous one stops working.

## Settings

All in the `x-settings` block at the top of the YAML. Every service gets
the same values.

| Setting                  | Default    | Meaning                                      |
| ------------------------ | ---------- | -------------------------------------------- |
| `PLAYERD_HTTP_PORT`      | `"8080"`   | Web GUI port                                 |
| `PLAYERD_HOSTNAME`       | `player-d` | mDNS name: `<zone>.<PLAYERD_HOSTNAME>.local` |
| `PLAYERD_DANTE_NIC`      | `eth0`     | Interface on the Dante network               |
| `PLAYERD_SAMPLE_RATE`    | `"48000"`  | `"48000"` or `"96000"`                       |
| `PLAYERD_LICENSE`        | `""`       | Optional license key text                    |
| `PLAYERD_RESET_PASSWORD` | `"false"`  | `"true"` prints a new admin password on start |
| `TZ`                     | `Etc/UTC`  | Time zone for logs                           |

Keep numbers and `true`/`false` in quotes.

Two more settings are elsewhere in the file:

- Image tag: `:latest` on each of the five `image:` lines. Change all
  five to pin a version (for example `:0.2.0`) or to `:dev` for the
  newest beta build from the `dev` branch.
- Data location: `player-d-data:/config` under `core` uses a named
  volume. For a host folder, replace it with an absolute path, for
  example `/opt/player-d:/config`.

The network values (port, host name, Dante NIC, sample rate) are set
only in the YAML. Settings > Network shows them read-only; change them
in the YAML and redeploy.

## Images

The images are on GHCR (`ghcr.io/klangche/player-d-*`) for `amd64` and
`arm64`. Tags:

| Tag                  | Published by                         |
| -------------------- | ------------------------------------ |
| `latest`, `<version>` | Release workflow, from `main`       |
| `dev`, `<version>-beta.<n>` | Every merge into `dev`        |

GHCR makes a new package private. Either set each of the five packages
to public (GitHub > Packages > package > Package settings > Change
visibility), or add `ghcr.io` as a registry in Portainer (Registries >
Add registry > Custom, with a GitHub token that has `read:packages`).

## Data and secrets

- All persistent data lives in one location, mounted at `/config` in
  `core`: configuration, the password hash and the license. Back up
  that volume or folder.
- No secret is needed to start. The admin password is generated on the
  first start and only its hash is stored.
- The license key is entered either in Settings or as `PLAYERD_LICENSE`
  in the YAML. A key in the YAML is stored by Portainer as part of the
  stack; leave it empty and use Settings if that is a concern.

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
