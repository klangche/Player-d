# Player-d

Player-d is a Dante audio server for Windows and Docker. It is a virtual
Dante soundcard and a virtual Dante mixer with Spotify Connect and Tidal.

One server runs multiple Spotify Connect and multiple Tidal connections
and sends different sources to different Dante speakers. A built-in zone
manager creates zones, maps inputs to zones and controls them; everything
is controlled through a WebGUI in the browser.

Each zone has a custom name and at least one input; multiple inputs in a
zone are mixed. Volume is set per zone and per speaker, so different
speaker sizes and models can be mixed.

Intended use: showrooms, stores and home. Like Sonos, but it works with
every Dante speaker.

## Features

- Spotify Connect sources, multiple per server
- Tidal sources, multiple per server
- Local audio files as sources
- External Dante sources: any Dante device on the network can be added
  as an input
- Zones with custom names; multiple inputs per zone, mixed
- Volume per zone and per speaker
- Built-in zone manager: create zones, map inputs to zones
- WebGUI: everything is controlled from the browser

## Install

Not released yet. Planned:

- Windows: native application (installer)
- Docker: Linux container

## Usage

Open the WebGUI in a browser on the Player-d host, then:

1. Create zones with custom names.
2. Map inputs (Spotify, Tidal, local, external Dante) to zones.
3. Set volume per zone and per speaker.

Details are documented with the first release.

## Platforms

- Windows: native application
- Docker: Linux container

## Development

- Backend: C#/.NET 8
- WebGUI: TypeScript (React), served by the backend
- Built from open source components

Contributors and AI agents follow AGENTS.md.

## License

TBD.
