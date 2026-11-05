# Player-d

Player-d is a Dante audio server for Windows and Docker. It is a virtual
Dante soundcard and a virtual Dante mixer with Spotify Connect, Tidal and
AirPlay.

One server runs multiple Spotify, Tidal and AirPlay connections and
sends different sources to different Dante speakers. A built-in zone
manager creates zones, maps inputs to zones and controls them; everything
is controlled through a WebGUI in the browser.

Each zone has a custom name and at least one input; multiple inputs in a
zone are mixed. Volume is set per input (max level), per zone and per
speaker, so different sources and speaker sizes can be mixed. A ceiling
on total Dante I/O stays in par with the real network.

Intended use: showrooms, stores and home. Like Sonos, but it works with
every Dante speaker.

## Features

- Spotify Connect sources, multiple per server
- Tidal sources
- AirPlay sources, multiple per server
- Local audio files as sources
- External Dante sources: any Dante device on the network can be added
  as an input
- Zones with custom names, created freely; multiple inputs per zone,
  mixed
- Volume per input (max level), per zone and per speaker
- A ceiling on total Dante I/O, in par with the real network
- Built-in zone manager: create zones, map inputs to zones
- WebGUI: everything is controlled from the browser

## Install

Not released yet. Planned:

- Docker: container image (primary target)
- Windows: native application (v0.2+, after the Docker version)

## Usage

Open the WebGUI in a browser on the Player-d host, then:

1. Create zones with custom names.
2. Map inputs (Spotify, Tidal, AirPlay, local, external Dante) to zones.
3. Set levels per input, zone and speaker.

Details are documented with the first release.

## Platforms

- Docker: Linux container, runs on any host including Windows (Docker
  Desktop). Primary target.
- Windows: native application, later (v0.2+).

## Development

- Backend: C#/.NET 8
- WebGUI: TypeScript (React), served by the backend
- Built from open source components

Contributors and AI agents follow AGENTS.md.

## License

TBD.
