# Player-d WebGUI specification (v0.1)

Status: draft for owner sign-off. No backend or frontend code is written
before this document is approved.

This document fixes the layout, components and state ownership for the
WebGUI. It is the contract for Phase 1 (mock UI), Phase 2 (API) and the
later audio phases. Terms: a **source** is a global input that can feed
any zone (Spotify, Tidal, AirPlay, local file). A **Dante channel** is a
network audio channel bound to a zone input or output slot. A **zone**
mixes its inputs into a master bus, then splits to its outputs
(speakers).

Decisions already made in `AGENTS.md`: Docker-first, .NET 8 backend,
React/TypeScript GUI served by the backend, full matrix mixer (per-input
level and ceiling, per-zone level, per-output level), dynamic zones,
global Dante I/O budget, reverse-engineered source backends only.

Related issues and boundaries:

- #14 is the mixer matrix spec (audio graph, clock, budget numbers, what
  is persisted). This document binds those rules to the UI; it does not
  replace #14. Anything marked "to confirm" belongs to #14.
- #20 fixes persistence to one JSON config file. Section 6 assumes it.
- #21 owns LAN binding and token/password access control. Phase 1 is
  mock-only; the route table and API client reserve a login step for
  when #21 lands.
- #15 adds AirPlay as a v0.1 source. It is in the add-source menu even
  though the Phase 0 brief omitted it.
- #5 is the .NET skeleton, static-file serving and CI.

## 1. Information architecture

Left sidebar, always visible, three groups:

1. Zones: one entry per zone, plus a `+` button to create one.
2. Pinned: Dante Controller (global view).
3. System: Settings.

Main pane shows the selected entry. Routes:

| Route          | View                                  |
| -------------- | ------------------------------------- |
| `/`            | Redirect to last zone, or empty state |
| `/zones/:id`   | Zone view                             |
| `/dante`       | Dante Controller                      |
| `/settings`    | Settings                              |

Unknown zone id: show the empty state, no error page. Desktop first,
minimum width 1024 px. No mobile layout in v0.1. A `/login` route is
reserved for #21 and renders only when the server reports that access
control is enabled; Phase 1 has no login.

```
+---------------------+----------------------------------------------+
| Player-d            |                                              |
|                     |                                              |
| ZONES           [+] |              main pane                       |
| > Living Room       |                                              |
|   Kitchen           |                                              |
|   Showroom          |                                              |
|                     |                                              |
| ------------------- |                                              |
| Dante Controller    |                                              |
|                     |                                              |
| ------------------- |                                              |
| Settings            |                                              |
|                     |                                              |
| v0.1.0-dev          |                                              |
+---------------------+----------------------------------------------+
```

The sidebar highlights the active route. A zone entry opens on click.
Creating a zone asks for a name (default "New zone"), selects it and
opens `/zones/:id`.

## 2. Zone view

```
+--------+------------------------------------------------------------+
| side   | Living Room                                        [Delete] |
| bar    | [ Living Room ]  click the name to edit inline              |
|        |                                                              |
|        | +--------------------------+ +---------------------------+ |
|        | | MIXER                    | | SOURCES              [+]  | |
|        | | +------+ +------+ +----+ | | Spotify "Kitchen phone"   | |
|        | | |Spotify| |Local | |Dante| | | online         [Disc.]    | |
|        | | | Lvl  | | Lvl  | |Lvl | | | Tidal "Tidal"             | |
|        | | | Max  | | Max  | |Max | | | idle          [Connect]   | |
|        | | | M S  | | M S  | |M S | | |                           | |
|        | | |meter | |meter | |mtr | | |                           | |
|        | | +------+ +------+ +--+-+ | +---------------------------+ |
|        | | MASTER [=========] meter |                               |
|        | +--------------------------+                               |
|        |                                                              |
|        | +----------------------------------------------------------+ |
|        | | DANTE I/O                     budget 2 in / 1 out       | |
|        | | Inputs  [- 2 +]                Outputs  [- 1 +]          | |
|        | | IN 1   Amp-1 / Tx 3            [change]            [x]   | |
|        | | OUT 1  Amp-1 / Rx 1  [Lvl 70] [meter] [change]    [x]   | |
|        | +----------------------------------------------------------+ |
+--------+------------------------------------------------------------+
```

### 2.1 Header

- Zone name: inline edit. Click, change, Enter or blur saves, Escape
  cancels. Empty names are rejected; trim whitespace.
- Delete zone: confirmation naming the zone. Sources used only by this
  zone stay global and become unattached. Their backends keep running
  only if another zone still uses them.

### 2.2 Mixer

One channel strip per zone input, in list order, then the master strip.

Strip controls:
- Label: source name, or `IN n` plus the Dante channel.
- Type badge: Spotify, Tidal, AirPlay, Local, Dante.
- Level slider 0-100. Effective gain is `min(level, ceiling)`.
- Ceiling slider 0-100 (default 100). Caps the level. Editing the
  ceiling below the current level lowers the level to the ceiling.
- Mute (M) and solo (S). Solo is per zone and transient: while one or
  more inputs in a zone are soloed, the others are muted. It is not
  persisted and resets on restart.
- Level meter, -60 to 0 dBFS, stub in Phase 1 (animated bar), real in
  Phase 3 (SignalR, 20 Hz).
- Remove input (`x`). Removing a source input does not delete the
  global source; a Dante input slot is removed with its count.

Master strip: level 0-100, mute, meter. It follows the last stage of
the zone bus.

Layout: horizontal strips in a wrapping row, max 8 inputs per zone in
v0.1. Strips scroll horizontally rather than shrink below ~120 px.

### 2.3 Sources panel

Lists the global sources attached to this zone, with type badge, name,
status (`offline`, `connecting`, `online`, `error`), optional detail
line (current track or error text), a connect/disconnect button and a
remove button. Status comes from the server; the client also shows a
pending state between click and server confirmation.

Connect semantics per source kind:

| Kind    | Connect means                     | Disconnect means    |
| ------- | --------------------------------- | ------------------- |
| Spotify | start the librespot instance      | stop the process    |
| Tidal   | start the Tidal backend instance  | stop the process    |
| AirPlay | start the shairport-sync instance | stop the process    |
| Local   | start playback                    | stop playback       |
| Dante   | n/a (always "online" when routed) | n/a                 |

`+` opens the add-source menu:

- Spotify Connect -> prompts for a display name -> creates a Spotify
  source and attaches it to this zone.
- Tidal Connect -> prompts for a display name -> creates a Tidal source
  and attaches it to this zone.
- AirPlay -> prompts for a display name -> creates an AirPlay source
  and attaches it to this zone.
- Local file -> opens a path picker (server-side path) -> creates a
  Local source and attaches it.
- External Dante -> creates one Dante input slot for this zone and
  opens the channel picker. This is a zone input, not a global source.
- Existing source -> lists unattached global sources; attaches one to
  this zone.

A source can feed several zones; each zone gets its own channel strip
with its own level, ceiling and mute.

### 2.4 Dante I/O panel

Two counters: `Inputs` and `Outputs`, 0-8 each in v0.1.

- Increasing `Inputs` adds a Dante input slot at the end of the mixer
  (empty channel until assigned).
- Increasing `Outputs` adds a speaker output slot.
- Decreasing removes trailing slots. If a slot is routed, confirm
  first; the route is released.
- Both counters are disabled with a reason when the global budget
  would be exceeded.

Each input slot: channel picker (device > transmit channel), clear.
Each output slot: channel picker (device > receive channel), output
level 0-100, mute, meter, clear.

Direction is named from the device's point of view and shown that way
in the picker, because Dante Tx/Rx is the most common source of
misconfiguration:
- Zone input subscribes to a **device transmit (Tx)** channel.
- Zone output sends to a **device receive (Rx)** channel.

### 2.5 Channel picker

Modal with the discovered device list, search by device name, and a
channel list. Shows device name, IP, and sample rate. A manual entry
(`device name + channel number`) is available when discovery is
incomplete; see the Phase 4 risk in section 9.

## 3. Dante Controller view

Global view over all zones and all discovered devices. Two matrices
(inputs, outputs) on one page, switched by a tab; each matrix has the
same shape so it reads as one routing table.

```
DANTE CONTROLLER                          [Scan]   last scan 12 s ago
Budget: 6 / 32 in   4 / 32 out  [############.......................]
Direction: ( Inputs )  Outputs

DEVICES                          +--------------------------------------+
v Amp-1        192.168.1.20     | Channel      | Living IN 1 | Kitchen IN 1
  Tx 1..4  Rx 1..4              | Amp-1 Tx 1   |   [slot 1]  |      -
v Stage box    10.0.0.5         | Amp-1 Tx 2   |      -      |   [slot 1]
  Tx 1..8  Rx 1..8              | Stage Tx 1   |   [slot 2]  |      -
                                +--------------------------------------+
```

- Left column: discovered devices, expandable to their channels, with
  IP and channel counts. Devices with no channels or unreachable show
  a status marker.
- Matrix rows: device channels in the direction of the active tab.
  Matrix columns: zone input slots (inputs tab) or zone output slots
  (outputs tab), grouped by zone.
- A cell is a dropdown with that zone's free slots plus "unassigned".
  One channel may feed several zone inputs (fan-out); one zone output
  maps to exactly one device channel. Assigning an already used cell
  replaces the previous binding after confirmation.
- Budget bar shows used and allowed input/output channels. It turns
  red at the limit and the server rejects assignments over it.
- Empty state: no devices discovered -> "No Dante devices found",
  scan button, and a link to the network section of Settings.

The zone's Dante I/O panel and this matrix edit the same server state;
a change in one is visible in the other after the next state push.

## 4. Settings view

Grouped list, each group a card with a save action; saving applies
immediately, no global submit.

| Group    | Fields                                                                                 |
| -------- | -------------------------------------------------------------------------------------- |
| Network  | Dante interface (NIC) select, host name, sample rate 48/96 kHz, latency 0.25/1/5 ms    |
| Defaults | default input level, default output level, default master level, power-on mute          |
| Backends | Spotify binary path, Spotify bitrate 160/320, AirPlay binary path, Tidal binary path, local music directory |
| Budget   | max Dante inputs, max Dante outputs (default 32/32, cap 64/64)                          |
| System   | version, audio engine state, restart audio engine, restart source backends, download logs |

"Restart" restarts child processes inside the container; it does not
restart the container. A full container restart stays a Docker action.

## 5. Component tree

```
<App>
  <ApiProvider>                     one store, mock or real client
    <BrowserRouter>
      <AppShell>
        <Sidebar>
          <ZoneList><ZoneListItem/> <CreateZoneButton/></ZoneList>
          <NavItem to="/dante"/> <NavItem to="/settings"/>
        </Sidebar>
        <main>
          /            <ZoneRedirect/> | <NoZones/>
          /zones/:id   <ZonePage>
                         <ZoneHeader/>            inline name, delete
                         <MixerPanel>
                           <ChannelStrip/>*       level, ceiling, M, S, meter
                           <MasterStrip/>
                         </MixerPanel>
                         <SourcesPanel>
                           <SourceRow/>*          badge, status, connect
                           <AddSourceMenu/>       dialog + name prompt
                         </SourcesPanel>
                         <DanteIoPanel>
                           <SlotCount/> <InputSlotRow/>* <OutputSlotRow/>*
                         </DanteIoPanel>
                       </ZonePage>
          /dante       <DantePage>
                         <BudgetBar/> <DeviceList/> <RouteMatrix/> <ScanButton/>
                       </DantePage>
          /settings    <SettingsPage>
                         <SettingsGroup/>*  Network, Defaults, Backends, Budget, System
                       </SettingsPage>
        </main>
        <ChannelPicker/> <ConfirmDialog/> <Toast/>
      </AppShell>
    </BrowserRouter>
  </ApiProvider>
</App>
```

Planned file layout (`web/src`, no file above 300 LOC):

```
main.tsx  App.tsx  routes.tsx  styles/  components/{Sidebar,Dialog,Toast,...}
api/{types.ts,client.ts,ApiProvider.tsx}
api/mock/{seed.ts,store.ts,mockClient.ts}
features/zones/{ZonePage,MixerPanel,ChannelStrip,SourcesPanel,AddSourceDialog,DanteIoPanel}.tsx
features/dante/{DantePage,BudgetBar,DeviceList,RouteMatrix}.tsx
features/settings/{SettingsPage,SettingsGroup}.tsx
```

No UI framework or state library in v0.1: plain CSS files and React
context plus `useReducer`. This keeps the first review small.

## 6. State model

| State                                            | Owner   | Lifetime            |
| ------------------------------------------------ | ------- | ------------------- |
| Zones, inputs, outputs, routing                  | Server  | Persisted           |
| Global sources and their config                  | Server  | Persisted           |
| Levels, ceilings, mutes, master, output levels   | Server  | Persisted           |
| Zone name, global settings                       | Server  | Persisted           |
| Solo                                             | Server  | Runtime only        |
| Source status, meters, Dante device list, budget | Server  | Runtime only        |
| Active route, dialogs, input drafts              | Client  | Session             |
| Optimistic slider value while dragging           | Client  | Until server echo   |

- One store on the server. The client never computes audio state; it
  renders server state and sends intent.
- Slider changes are debounced (~80 ms) and sent as partial updates.
  The client shows the local value until the server state arrives, then
  drops it; a rejected update snaps back and raises a toast.
- Server pushes: SignalR hub `/hubs/player` (Phase 2), events
  `stateChanged`, `meters`, `sourceStatus`, `danteDevices`. The client
  refetches on reconnect and after any mutation acknowledgement.
- Phase 1 mock: same client interface, in-memory store seeded with
  three zones and five sources; meters animate on a timer; connect
  flips to online after ~1 s; all state survives navigation but not a
  page reload. Reload persistence starts in Phase 2.
- Client selection (last zone) is kept in `localStorage`; it is a UI
  preference, not configuration.

## 7. Data model and API surface (Phase 2 contract)

The TypeScript types below are the source for the OpenAPI schema.
`docs/openapi.yaml` is generated from the ASP.NET implementation in
Phase 2, not written by hand twice.

```ts
type SourceKind = "spotify" | "tidal" | "airplay" | "local";
type SourceStatus = "offline" | "connecting" | "online" | "error";
type ChannelFlow = "device-tx" | "device-rx";  // device point of view

interface Source {
  id: string; kind: SourceKind; name: string;
  status: SourceStatus; detail?: string;
}

interface ChannelRef { deviceId: string; channelIndex: number }

interface ZoneInput {
  id: string;
  kind: "source" | "dante";
  sourceId?: string;            // kind=source
  channel?: ChannelRef;         // kind=dante, device-tx
  level: number;                // 0..100
  ceiling: number;              // 0..100
  mute: boolean;
  solo: boolean;                // runtime only, always false after restart
}

interface ZoneOutput {
  id: string;
  channel?: ChannelRef;         // device-rx
  level: number; mute: boolean;
  signal: boolean;              // runtime only, for the UI
}

interface Zone {
  id: string; name: string;
  masterLevel: number; masterMute: boolean;
  inputs: ZoneInput[]; outputs: ZoneOutput[];
}

interface DanteDevice {
  id: string; name: string; address: string;
  sampleRate: number;
  channels: { index: number; flow: ChannelFlow; name?: string }[];
  reachable: boolean;
}

interface Settings {
  network: { nic: string; hostName: string; sampleRate: 48000 | 96000;
             latencyMs: 0.25 | 1 | 5 };
  defaults: { inputLevel: number; outputLevel: number; masterLevel: number;
              powerOnMute: boolean };
  backends: { spotifyPath: string; spotifyBitrate: 160 | 320;
              airplayPath: string; tidalPath: string; musicDir: string };
  budget: { maxInputs: number; maxOutputs: number };
}
```

REST, prefix `/api/v1`:

```
GET    /health
GET    /zones                     POST /zones
GET    /zones/{id}                PATCH /zones/{id}        DELETE /zones/{id}
POST   /zones/{id}/inputs         PATCH /zones/{id}/inputs/{inputId}
DELETE /zones/{id}/inputs/{inputId}
PATCH  /zones/{id}/master
POST   /zones/{id}/outputs        PATCH /zones/{id}/outputs/{outputId}
DELETE /zones/{id}/outputs/{outputId}
GET    /sources                   POST /sources            DELETE /sources/{id}
POST   /sources/{id}/connect      POST /sources/{id}/disconnect
GET    /dante/devices             POST /dante/scan
PUT    /dante/assignments         body: { inputSlotId?, outputSlotId?, channelId? | null }
GET    /settings                  PUT /settings
POST   /system/restart            body: { target: "audio" | "sources" }
```

Rules: all ids are opaque strings (GUIDs). `PATCH` takes partial
objects. Validation errors return `400` with `{ errors: { field: msg }}`.
Budget violations return `409` with a machine-readable code. Every
mutation returns the changed resource and the client refetches the
affected zone.

Meters are not in REST; they are pushed at 20 Hz only while at least
one browser is subscribed (SignalR group per zone).

## 8. Limits

- Global Dante budget: the server owns the numbers; the UI only reads
  them. Placeholder defaults for Phase 1 are 32 inputs and 32 outputs
  with a 64/64 cap. #14 confirms the real figures against Audinate's
  published limits per link speed and latency.
- Per zone: 8 mixer inputs, 8 outputs in v0.1 (UI cap that the server
  enforces too). Configurable later.
- Name length 1-64 characters, unique per kind is not required.
- Levels are integers 0-100; 100 maps to 0 dB, 0 to silence. The
  curve is linear in dB (documented again in the mixer phase).

## 9. Source and Dante backends (intent, binding decision in the phase)

| Source  | Backend                                     | Risk |
| ------- | ------------------------------------------- | ---- |
| Spotify | librespot (Rust, unofficial Connect receiver) | Unofficial client; Spotify Premium required; ToS risk |
| AirPlay | shairport-sync                              | Reverse-engineered AirPlay; widely used |
| Local   | built-in player (Phase 5)                   | none |
| Tidal   | to be selected in a Phase 5 spike           | No mature open-source Tidal Connect receiver known; fallback is unofficial Tidal API playback, which is not a Connect target |

The source backend is an interface with start/stop/status; official
SDKs stay replaceable. No DRM circumvention. Legal and licensing notes
go into `AGENTS.md` and the README.

Dante: the Audinate SDK is licensed, Windows/macOS only, and does not
run in a Linux container. The realistic path is **AES67 mode on the
Dante devices** with a Linux AES67/RTP stack and mDNS discovery, plus
manual channel entry as fallback. Full Dante Controller parity
(subscriptions, device naming, clock status) is not achievable through
AES67 alone; Phase 4 starts with a spike that measures this on real
hardware. The GUI is designed so discovery can be incomplete without
blocking the user (manual channel entry, explicit device list).

## 10. Non-goals for v0.1

- Authentication itself: #21 owns LAN binding and token/password access
  control. Phase 1 is mock-only. TLS and multi-user accounts stay out.
- Mobile layout, touch gestures, themes.
- Zone groups, presets, schedules, ducking, EQ, crossfade.
- Live reordering of strips (order = input creation order).
- Full Dante device management (renaming devices, clock, firmware).

## 11. Open questions (owner sign-off)

Each question has the proposed default; silence means the default.

| # | Question | Proposed default | Needed by |
| - | -------- | ---------------- | --------- |
| 1 | Should a zone's add menu attach existing global sources, not only create new ones? | Yes, "Existing source" entry | Phase 1 |
| 2 | Per-zone caps (the global budget numbers come from #14) | 8 inputs / 8 outputs per zone | Phase 1 |
| 3 | Solo is transient, not persisted | Accepted | Phase 1 |
| 4 | Deleting a zone leaves its sources global and unattached | Accepted | Phase 1 |
| 5 | `/` opens the last selected zone (else first zone) | Accepted | Phase 1 |
| 6 | When does the login screen arrive? It is not in the phase list, but #21 is in the v0.1 roadmap. | Phase 2 shell (disabled) + enabled with #21 | Phase 2 |
| 7 | Level-to-dB curve for faders | 100 = 0 dB, linear in dB, 0 = silence | Phase 3 (#14) |
| 8 | Tidal Connect has no mature open-source receiver. If the Phase 5 spike fails, is a non-Connect Tidal source acceptable, or is Tidal deferred? | Defer Tidal rather than ship a fake Connect target | Phase 5 |

## 12. Sign-off

Approved by: (owner) ______________  Date: __________

Approval unlocks Phase 1 only. Phase 1 starts with its own plan and a
confirmation, per `AGENTS.md`.
