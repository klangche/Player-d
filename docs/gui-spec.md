# Player-d WebGUI specification (v0.1)

Status: draft for owner sign-off. No backend or frontend code is written
before this document is approved.

This document fixes the layout, components and state ownership for the
WebGUI. It is the contract for Phase 1 (mock UI), Phase 2 (API) and the
later audio phases. Terms: a **source** is a global input that can feed
any zone (Spotify, Tidal, AirPlay, local file). A **Dante channel** is a
mono network audio channel bound to a zone input or output slot. A
**slot** is one mixer channel or one speaker: either one mono channel or
one stereo pair of Dante channels. A **zone** mixes its inputs into a
master bus, then splits to its outputs (speakers).

Decisions already made in `AGENTS.md`: Docker-first, .NET 8 backend,
React/TypeScript GUI served by the backend, full matrix mixer (per-input
level and ceiling, per-zone level, per-output level), dynamic zones,
global Dante I/O capacity, reverse-engineered source backends only.

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
2. Pinned: Dante Controller, Zone Mixer (both global views).
3. System: Settings.

Main pane shows the selected entry. Routes:

| Route          | View                                  |
| -------------- | ------------------------------------- |
| `/`            | Last zone, else first zone, else empty state |
| `/zones/:id`   | Zone view                             |
| `/dante`       | Dante Controller                      |
| `/zone-mixer`  | Zone Mixer (zone-to-zone routing)     |
| `/settings`    | Settings                              |
| `/login`       | Login (Phase 2 shell, disabled until #21) |

Unknown zone id: show the same empty state, with a link to the first
zone. No error page. Desktop first, minimum width 1024 px. No mobile
layout in v0.1. A `/login` route is reserved for #21. Phase 1 has no
login; Phase 2 adds the route shell, disabled until the server reports
that access control is enabled (#21).

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
| Zone Mixer          |                                              |
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
|        | | DANTE I/O               routed 2/512 in  1/512 out    | |
|        | | Channels In [32 v] Out [32 v]  Layout In (mono) Out (stereo)|
|        | | IN 1   Amp-1 / Tx 3            [change]            [x]   | |
|        | | OUT 1  Amp-1 / Rx 1-2  [Lvl 70] [meter] [change]  [x]   | |
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

One channel strip per zone input: a source strip, a Dante input slot or
a zone link, in list order, then the master strip. A stereo slot is one
strip that controls both of its channels.

Strip controls:
- Label: source name, `IN n` plus the bound Dante channel(s), or
  `From <zone>` for a zone-to-zone link.
- Type badge: Spotify, Tidal, AirPlay, Local, Dante, Zone.
- Level slider 0-100. Effective gain is `min(level, ceiling)`.
- Ceiling slider 0-100 (default 100). Caps the level. Editing the
  ceiling below the current level lowers the level to the ceiling.
- Mute (M) and solo (S). Solo is per zone and transient: while one or
  more inputs in a zone are soloed, the others are muted. It is not
  persisted and resets on restart.
- Level meter, -60 to 0 dBFS, one bar per channel, stub in Phase 1
  (animated bar), real in Phase 3 (SignalR, 20 Hz).
- Remove input (`x`). A source or zone strip is removed; the source
  itself stays global. On a Dante input slot, `x` releases the
  subscription and keeps the slot.

Master strip: level 0-100, mute, meter. It follows the last stage of
the zone bus.

Layout: horizontal strips in a wrapping row, at most 32 Dante channels
per zone (32 mono slots or 16 stereo slots), plus source and zone-link
strips. Strips scroll horizontally rather than shrink below ~120 px.
Zone links are added and removed in the Zone Mixer view and appear here
as strips.

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

`+` opens the add-source menu:

- Spotify Connect -> prompts for a display name -> creates a Spotify
  source and attaches it to this zone.
- Tidal Connect -> prompts for a display name -> creates a Tidal source
  and attaches it to this zone.
- AirPlay -> prompts for a display name -> creates an AirPlay source
  and attaches it to this zone.
- Local file -> opens a path picker (server-side path) -> creates a
  Local source and attaches it.
- External Dante -> opens the picker for the next unassigned input slot;
  if none is free, raises the input channel count to the next ladder
  step (2 -> 4 -> 8 -> 16 -> 32) after confirming the added channels and
  capacity. This is a zone input, not a global source.
- Existing source -> lists unattached global sources; attaches one to
  this zone.

A source can feed several zones; each zone gets its own channel strip
with its own level, ceiling and mute.

### 2.4 Dante I/O panel

Dante carries mono channels. A zone has a channel count per direction,
chosen from the Dante ladder: **2, 4, 8, 16 or 32 channels**. 32
channels is 32 mono speakers or 16 stereo speakers. The global capacity
(section 8) caps the sum over all zones.

```
Dante channels   Inputs [32 v]   Outputs [32 v]     2 / 4 / 8 / 16 / 32
[ ] same size for inputs and outputs
Layout           Inputs  (o) mono  ( ) stereo  ( ) mixed
                 Outputs ( ) mono  (o) stereo  ( ) mixed
```

- `mono`: N slots, one channel each. Input: N Rx channels, each bound to
  one device Tx channel. Output: N speakers, each one Tx channel, each
  with a content choice `L`, `R` or `L+R` (default `L+R`).
- `stereo`: N/2 slots of two adjacent channels. Input: two adjacent
  device Tx channels, lower index = L. Output: one speaker per pair,
  L and R fixed.
- `mixed`: per pair, `stereo` or `split` (two independent mono slots).
  This is the mixed mono case: stereo where the speaker has two
  channels, mono everywhere else.
- Content exists on output slots only. A Dante input channel is already
  mono, so there is no L/R to choose; a mono input is centered on the
  zone bus.
- A pair is always two adjacent channels on the same device. A slot
  never mixes devices or non-adjacent channels.
- Source inputs sit beside the Dante input slots and do not consume the
  Dante capacity. They have 1 or 2 channels (mono local file, stereo
  Spotify) and their own strip. Zone links likewise add a strip and no
  Dante channels.
- The zone bus is stereo. A stereo output slot takes L/R; a mono output
  slot picks `L`, `R` or `L+R` from the bus. Exact gains belong to #14.
- The channel count and layout create the slots; an assignment only
  fills one. An unassigned slot has no subscription, is silent, and
  still counts against the capacity. Clearing (`x`) releases the
  subscription and keeps the slot. Lowering the count removes trailing
  slots after confirmation and releases their subscriptions.
- `Same size` is the default and keeps both counts equal. Unchecked, the
  input and output counts can differ, each still from the ladder.
- Changing the count or layout keeps assignments by channel index where
  possible and asks before dropping the rest.
- The selects are disabled with a reason when the global capacity would
  be exceeded.

Dante protocol rules: every Dante channel is mono and stays mono on the
wire. A stereo slot is a Player-d convention over two adjacent device
channels on the same device, lower index = L, higher index = R. A mono
output slot consumes exactly one channel; choosing `L` or `R` does not
copy or duplicate the other channel. No stereo flag is sent to the
device.

Each input slot: channel picker (device > transmit channel, two adjacent
for stereo), clear.
Each output slot (= one speaker): channel picker (device > receive
channel, an adjacent pair for stereo), content L/R/L+R for mono slots,
output level 0-100, mute, meter, clear.

Direction is named from the device's point of view and shown that way
in the picker, because Dante Tx/Rx is the most common source of
misconfiguration:
- Zone input: the virtual device's Rx channel subscribes to a **device
  transmit (Tx)** channel.
- Zone output: the virtual device's Tx channel is subscribed by a
  **device receive (Rx)** channel, managed or advertised (section 8.4).

### 2.5 Channel picker

Modal with the discovered device list, search by device name, and a
channel list. Shows device name, IP, and sample rate. A manual entry
(`device name + channel number`) is available when discovery is
incomplete; see the Phase 4 risk in section 9.

## 3. Routing views

Two global views: Dante Controller (network routing) and Zone Mixer
(zone-to-zone links). Both edit the same server state as the zone view.

### 3.1 Dante Controller

Global view over all zones and all discovered devices. Two matrices
(inputs, outputs) on one page, switched by a tab; each matrix has the
same shape so it reads as one routing table.

```
DANTE CONTROLLER                          [Scan]   last scan 12 s ago
Capacity: 6/512 in  4/512 out  2/64 out streams   clock leader: Amp-1
Direction: ( Inputs )  Outputs

DEVICES                       +---------------------------------------+
v Amp-1      192.168.1.20     | Channel    | Living IN 1 | Living IN 1 |
  Tx 1..4 Rx 1..4             |            |      L      |      R      |
v Stage box  10.0.0.5         | Amp-1 Tx 1 |     [x]     |      -      |
  Tx 1..8 Rx 1..8             | Amp-1 Tx 2 |      -      |     [x]     |
                              | Stage Tx 1 |      -      |      -      |
                              +---------------------------------------+
```

- Left column: discovered devices, expandable to their channels, with
  IP and channel counts. Devices with no channels or unreachable show
  a status marker.
- Rows: device channels in the active direction (Tx on the Inputs tab,
  Rx on the Outputs tab).
- Columns: one mono channel of a zone slot, grouped under the slot
  header. A stereo slot is two adjacent columns, `L` then `R`.
- A cell is one assignment, never a dropdown of slots. Inputs tab: the
  column's Rx channel subscribes to the row's Tx channel, so at most one
  cell per column and many per row (fan-out). Outputs tab: the row's
  device Rx channel subscribes to the column's Tx channel, so at most
  one cell per row and many per column.
- A stereo slot binds as a pair: setting one cell sets the neighbour
  from the next channel on the same device. If the neighbour is taken
  or does not exist, the pair is refused whole with a reason.
- Click a filled cell to release the subscription. A device Rx channel
  that already has a source asks before replacing; confirmed, the server
  releases the old subscription in the same transaction. A forced
  second source returns `409 rx_in_use`.
- Output cells carry a mode badge: `M` managed (subscription created by
  Player-d) or `A` advertised (the device must subscribe; section 8.4).
- The matrix header shows each zone's channel layout, and a mixed zone
  shows `L/R` or `M` per slot, so the routing is readable without
  opening the zone.
- The header shows the clock leader. Rows of a device at another sample
  rate are disabled with that reason.
- The capacity bar shows used and allowed channels and streams. It
  turns red at a limit and the server rejects assignments over it.
- Empty state: no devices discovered -> "No Dante devices found",
  scan button, and a link to the network section of Settings.

The zone's Dante I/O panel and this matrix edit the same server state;
a change in one is visible in the other after the next state push.

### 3.2 Zone Mixer

N×N matrix of zones. A link feeds one zone's post-master mix into
another zone as a mixer input. It is the global connect: any zone can
feed any other zone, with no bulk action.

```
ZONE MIXER                                          4 links
Each zone sends its post-master mix; the receiving strip has its own level.

            TO    Living    Kitchen    Showroom    Studio
FROM Living           -       [ 80 ]         -          -
     Kitchen       [100]          -       [ 60 ]         -
     Showroom          -          -           -      [100]
     Studio            -       [ 90 ]         -          -
```

- Cell = one link from the row zone to the column zone. Click an empty
  cell to connect at level 100; click a link to edit level 0-100, mute
  or disconnect. One link per ordered pair.
- The send taps the source zone **post-master**: its master level and
  mute apply before the link level. The receiving strip is a second
  level stage.
- The receiving zone gets an input strip labelled `From <zone>` with
  level, ceiling, mute, solo and meter, like any other strip.
- Self-links are not offered. A link that would create a cycle (A -> B
  -> A, or longer) is rejected by the server with `409 zone_cycle`; the
  client shows the error and leaves the matrix unchanged. The client
  does not compute cycles.
- Links are internal: no Dante channels, streams or capacity.
- Deleting a zone removes its links in both directions.
- Empty state with fewer than two zones: prompt to create another zone.
- The matrix shows zones only. Sources are attached in the zone view.

Example: a "Source" zone receives Spotify and feeds every room zone;
the room zones stay independent and each keeps its own speaker levels.
Lowering the Source zone master lowers every room at once.

## 4. Settings view

Grouped list, each group a card with a save action; saving applies
immediately, no global submit.

| Group    | Fields                                                                                 |
| -------- | -------------------------------------------------------------------------------------- |
| Network  | Dante interface (NIC) select, host name, sample rate 48/96 kHz, latency 0.25/0.5/1/2/5 ms |
| Defaults | default input level, default output level, default master level, power-on mute, default channel count (2/4/8/16/32) and layout (mono/stereo/mixed) for new zones |
| Backends | Spotify binary path, Spotify bitrate 160/320, AirPlay binary path, Tidal binary path, local music directory |
| Capacity | read-only Dante capacity: channels and streams available, derived from the virtual device's channel count and the sample rate |
| System   | version, audio engine state, restart audio engine, restart source backends, download logs |

A "set every zone to mono" action lives in Defaults: it applies the
layout to all zones after a confirmation that lists affected zones and
released stereo pairs. It is `PUT /zones/layout`, not a client-side
loop.

"Restart" restarts child processes inside the container; it does not
restart the container. A full container restart stays a Docker action.
Version and audio-engine state come from `GET /system/status`; the log
download is `GET /system/logs`.

## 5. Component tree

```
<App>
  <ApiProvider>                     one store, mock or real client
    <BrowserRouter>
      <AppShell>
        <Sidebar>
          <ZoneList><ZoneListItem/> <CreateZoneButton/></ZoneList>
          <NavItem to="/dante"/> <NavItem to="/zone-mixer"/> <NavItem to="/settings"/>
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
                           <AddSourceDialog/>     dialog + name prompt
                         </SourcesPanel>
                         <DanteIoPanel>
                           <IoSizeSelect/>       2/4/8/16/32 per direction
                           <LayoutSelect/>       mono/stereo/mixed per direction
                           <PairLayoutRow/>*     mixed only
                           <InputSlotRow/>* <SpeakerRow/>*
                         </DanteIoPanel>
                       </ZonePage>
          /dante       <DantePage>
                         <CapacityBar/> <DeviceList/> <RouteMatrix/> <ScanButton/>
                       </DantePage>
          /zone-mixer  <ZoneMixerPage>
                         <ZoneMatrix/> <LinkEditor/>
                       </ZoneMixerPage>
          /settings    <SettingsPage>
                         <SettingsGroup/>*  Network, Defaults, Backends, Capacity, System
                       </SettingsPage>
          /login       <LoginPage/>          Phase 2, disabled until #21
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
features/dante/{DantePage,CapacityBar,DeviceList,RouteMatrix}.tsx
features/zoneMixer/{ZoneMixerPage,ZoneMatrix,LinkEditor}.tsx
features/settings/{SettingsPage,SettingsGroup}.tsx
```

No UI framework or state library in v0.1: plain CSS files and React
context plus `useReducer`. This keeps the first review small.

## 6. State model

| State                                            | Owner   | Lifetime            |
| ------------------------------------------------ | ------- | ------------------- |
| Zones, inputs, outputs, routing, layout          | Server  | Persisted           |
| Global sources and their config                  | Server  | Persisted           |
| Levels, ceilings, mutes, master, output levels   | Server  | Persisted           |
| Zone name, global settings                       | Server  | Persisted           |
| Solo                                             | Server  | Runtime only        |
| Source status, meters, Dante devices, flows, capacity | Server | Runtime only   |
| Active route, dialogs, input drafts              | Client  | Session             |
| Optimistic slider value while dragging           | Client  | Until server echo   |

- One store on the server. The client never computes audio state; it
  renders server state and sends intent.
- No UI-only features: every control maps to a server operation in
  section 7. If there is no operation, the control does not ship.
- Slider changes are debounced (~80 ms) and sent as partial updates.
  The client shows the local value until the server state arrives, then
  drops it; a rejected update snaps back and raises a toast.
- Server pushes: SignalR hub `/hubs/player` (Phase 2), events
  `stateChanged`, `meters`, `sourceStatus`, `danteDevices`,
  `danteStatus`. The client refetches on reconnect and after any
  mutation acknowledgement.
- Phase 1 mock: same client interface, in-memory store seeded with
  three zones (one mono, one stereo, one mixed), five sources, two Dante
  devices (4 x 4 and 8 x 8, with flow caps and used counts), capacity
  512/512 channels and 64/64 streams at 48 kHz with a clock leader, and
  one assigned and one unassigned slot per direction. Meters animate
  from a timer and use the same `MeterFrame` shape as Phase 3. Connect
  flips to online after ~1 s. All state survives navigation, not a page
  reload; reload persistence starts in Phase 2.
- Client selection (last zone) is kept in `localStorage`; it is a UI
  preference, not configuration.

## 7. Data model and API surface (Phase 2 contract)

The TypeScript types below are the source for the OpenAPI schema.
`docs/openapi.yaml` is generated from the ASP.NET implementation in
Phase 2, not written by hand twice.

```ts
type SourceKind = "spotify" | "tidal" | "airplay" | "local";
type SourceStatus = "offline" | "connecting" | "online" | "error";
type ChannelDirection = "tx" | "rx";           // from the device's point of view

type ChannelCount = 2 | 4 | 8 | 16 | 32;      // Dante channels per direction
type LayoutMode = "mono" | "stereo" | "mixed";
type PairMode = "stereo" | "split";          // used when LayoutMode = mixed
type MonoContent = "left" | "right" | "sum"; // mono output slots; default sum

interface ZoneIo {
  inChannels: ChannelCount;    // Dante channels per direction; slot count
  outChannels: ChannelCount;   // and layout follow from these
  inLayout: LayoutMode;
  outLayout: LayoutMode;
  linked: boolean;             // "same size" checkbox; default true
  inPairs?: PairMode[];        // length inChannels/2, mixed only
  outPairs?: PairMode[];       // length outChannels/2, mixed only
}

interface Source {
  id: string; kind: SourceKind; name: string;
  status: SourceStatus; detail?: string;
  channels: 1 | 2;              // mono local file vs stereo stream
}

interface ChannelRef { deviceId: string; channelIndex: number }

interface ZoneInput {
  id: string;
  kind: "source" | "dante" | "zone";
  sourceId?: string;            // kind=source
  sourceZoneId?: string;        // kind=zone, the feeding zone
  channels?: ChannelRef[];      // kind=dante, remote device Tx; 1 or 2 entries
  level: number;                // 0..100
  ceiling: number;              // 0..100
  mute: boolean;
  solo: boolean;                // runtime only, always false after restart
}

interface ZoneOutput {          // one speaker
  id: string;
  channels?: ChannelRef[];      // remote device Rx; 1 or 2 adjacent entries
  content?: MonoContent;        // mono output slots; default sum
  routeMode?: "managed" | "advertised";  // derived, read-only; section 8.4
  level: number; mute: boolean;
  signal: boolean;              // runtime only, for the UI
}

interface Zone {
  id: string; name: string;
  io: ZoneIo;
  masterLevel: number; masterMute: boolean;
  inputs: ZoneInput[]; outputs: ZoneOutput[];
}

interface FlowCounts {
  txCap: number; rxCap: number; txUsed: number; rxUsed: number;
}

interface DanteDevice {
  id: string; name: string; address: string;
  sampleRate: number;
  channels: { index: number; direction: ChannelDirection; name?: string }[];
  flows: FlowCounts;           // snapshot; GET /dante/flows is the source
  reachable: boolean;
}

interface Settings {
  network: { nic: string; hostName: string; sampleRate: 48000 | 96000;
             latencyMs: 0.25 | 0.5 | 1 | 2 | 5 };
  defaults: { inputLevel: number; outputLevel: number; masterLevel: number;
              powerOnMute: boolean; channelCount: ChannelCount;
              layout: LayoutMode };
  backends: { spotifyPath: string; spotifyBitrate: 160 | 320;
              airplayPath: string; tidalPath: string; musicDir: string };
}

// Read-only, from GET /dante/flows. Not a setting: Dante fixes capacity
// by link speed and sample rate.
interface DanteCapacity {
  sampleRate: 48000 | 96000;
  inChannels: number; outChannels: number;   // 512/512 at 48 kHz, 256/256 at 96 kHz
  inStreams: number; outStreams: number;     // 64 each; 8 ch/stream at 48, 4 at 96
  usedInChannels: number; usedOutChannels: number;
  usedInStreams: number; usedOutStreams: number;
  clockLeaderId: string | null;              // null means audio cannot start
}

interface SystemStatus {
  version: string;
  engine: "running" | "stopped" | "error";
  capacity: DanteCapacity;
}

// Response of GET /dante/flows: one snapshot for the header and matrix.
interface DanteFlows {
  capacity: DanteCapacity;
  devices: { deviceId: string; flows: FlowCounts }[];
}

// Pushed at 20 Hz while a browser is subscribed; never stored.
interface MeterFrame {
  zoneId: string;
  stripId: string;              // input id, "master", or output id
  peakDb: number[];             // one per channel, -60..0
}
```

`inputs[]` and `outputs[]` hold one entry per slot. The server creates
and removes Dante slots when `io` changes; the client never adds or
deletes one directly. Source and zone strips are the only entries the
client creates.

REST, prefix `/api/v1`:

```
GET    /health
GET    /system/status             version, engine state, capacity, clock leader
GET    /system/logs               log archive download
GET    /zones                     POST /zones
GET    /zones/{id}                PATCH /zones/{id}        DELETE /zones/{id}
PUT    /zones/layout              body: { layout }  both directions, all zones
POST   /zones/{id}/inputs         body: source or zone strip only
PATCH  /zones/{id}/inputs/{inputId}
DELETE /zones/{id}/inputs/{inputId}   source/zone strips only
PATCH  /zones/{id}/master
PATCH  /zones/{id}/outputs/{outputId}
GET    /sources                   POST /sources            DELETE /sources/{id}?detach=true
POST   /sources/{id}/connect      POST /sources/{id}/disconnect
GET    /dante/devices             POST /dante/scan
PUT    /dante/subscriptions     body: { direction: "in" | "out", slotId, assignment: { deviceId, channelIndices: number[] } | null }
GET    /dante/flows              DanteFlows: capacity plus per-device flow counts
GET    /settings                  PUT /settings
POST   /system/restart            body: { target: "audio" | "sources" }
```

Rules: all ids are opaque strings (GUIDs). `PATCH` takes partial
objects. Validation errors return `400` with `{ errors: { field: msg }}`.
Capacity violations return `409` with a machine-readable code
(`capacity_channels`, `capacity_streams`, `clock_rate`, `rx_in_use`). A
zone link is created with `POST /zones/{toZoneId}/inputs` and
`kind="zone"`; a self-link or a cycle returns `409 zone_cycle`. Every
mutation returns the changed resource and the client refetches the
affected zone.

Dante input and output slots are created and removed by the channel
count and layout, not by POST/DELETE. A slot is filled with
`PUT /dante/subscriptions`; `assignment: null` releases it and keeps the
slot. `channels` is read-only in `PATCH`; `content`, `level`, `ceiling`,
`mute` and `solo` are patchable slot settings, and `solo` stays runtime
only. `POST`/`DELETE` on `/inputs` accept only
source and zone strips; a Dante slot returns `409 slot_derived`.
`DELETE /sources/{id}` returns `409 source_in_use` unless `detach=true`,
which removes it from every zone first. `GET /dante/flows` returns
`DanteFlows` and is the source for the header; `DanteDevice.flows` is
the same snapshot embedded in `GET /dante/devices`.

Meters are not in REST; they are pushed at 20 Hz only while at least
one browser is subscribed (SignalR group per zone).

## 8. Limits and Dante enforcement

### 8.1 How Dante works

The model the server and the UI must follow (Audinate Dante Controller
guide and Dante certification material). A new control is only added if
it maps to one of these operations; nothing exists in the UI that Dante
has no concept of.

- A device has transmit (Tx) and receive (Rx) channels. Every channel
  is mono. A stereo signal is two channels, never a stereo stream.
- Routing is a **subscription**: an Rx channel subscribes to exactly
  one Tx channel. Fan-out is allowed: many Rx channels may subscribe to
  the same Tx channel. A Tx channel can have many subscribers; an Rx
  channel has one source.
- Audio travels in **flows**, not channels. Dante unicast flows carry up
  to 4 channels on most devices and 8 on newer ones; multicast flows up
  to 8 (some devices 64). Each receiver needs its own unicast flow, so
  fan-out consumes the transmitter's flow budget. Typical devices
  support 2, 16 or 32 flows each way (Ultimo, Broadway, Brooklyn).
- Capacity: 512 x 512 channels at 48 kHz on one gigabit link, 256 x 256
  at 96 kHz. The flow limit often binds before the channel limit.
- One PTP clock leader and one sample rate for the network. A device at
  another rate cannot subscribe.
- Discovery is mDNS; audio and PTP run over UDP.
- AES67 mode, the Linux container path, is different on the wire: SDP
  streams of up to 8 channels at 48 kHz or 4 at 96 kHz, no Dante
  subscription. A Dante device must be switched to AES67 mode to
  receive those streams.

Player-d is one virtual Dante device. Zone slots map to its own
channels: a zone input slot is one of its Rx channels (two adjacent for
a stereo slot), a zone output slot is one of its Tx channels (again one
or two). Remote devices are reached through subscriptions, not by
"sending to an Rx channel".

### 8.2 Limits

The virtual device streams AES67 as follows:

| Sample rate | Channels per direction | Channels per stream | Streams per direction |
| ----------- | ---------------------- | ------------------- | --------------------- |
| 48 kHz      | 512                    | 8                   | 64                    |
| 96 kHz      | 256                    | 4                   | 64                    |

- Global capacity: the table above, summed over all zones. It is the
  virtual device's channel and stream count, read-only and derived from
  link speed and sample rate, not a setting. The UI shows what is left.
- Per zone, per direction: 2, 4, 8, 16 or 32 channels. This is a
  product cap, not a Dante limit. At full capacity that is 16 zones of
  32 x 32.
- Stream budget: the 64 streams per direction above, plus each remote
  device's reported flow caps and used counts (`GET /dante/flows`). A
  subscription that exceeds either is rejected, not silently dropped.
  In Dante mode the remote device's flow cap applies; in AES67 mode its
  stream cap applies instead.
- Source inputs and zone links consume neither Dante channels nor
  streams.
- Zone links: one per ordered pair; cycles and self-links rejected.
- Name length 1-64 characters, unique per kind is not required.
- Levels are integers 0-100: 0 = silence, 1 = -60 dB, 100 = 0 dB,
  linear in dB between. The meter floor is -60 dB, so every step is
  visible.

### 8.3 Enforcement rules (server, Phase 4)

- Reject an assignment over the channel capacity, the per-zone cap, a
  device flow/stream cap, or with a sample-rate mismatch.
- Reject a second source for one Rx channel. Allow many Rx channels on
  one Tx channel, but warn when fan-out exhausts the transmitter's
  flows.
- A subscription change is atomic per slot. On failure the previous
  subscription stays and the UI shows the error.
- Changing sample rate or latency drops and re-creates affected flows.
  The UI asks first and lists the affected zones.
- The server reports the clock leader and refuses to start audio when
  none exists.
- Zone-link cycles are detected by the server; the client only renders
  the `409 zone_cycle` response.

### 8.4 Managed vs advertised output routing

With the licensed Audinate SDK, Player-d could create subscriptions on
remote devices. With the Linux/AES67 path it cannot: it advertises SDP
streams and the receiving device (or Dante Controller) subscribes.

Each output assignment therefore has a mode:
- `managed`: Player-d created the subscription through the Dante
  control protocol, only if the Phase 4 spike proves it works.
- `advertised`: Player-d transmits the AES67 stream; the matrix records
  the intended target for display and validation, but the user makes
  the subscription on the device.

The matrix shows the mode per link. A failed subscription never leaves
the UI claiming audio is routed. This is the limit of the Docker-first
path and is measured in the Phase 4 spike (#3, #19).

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

Defaults below are accepted unless a row is marked open.

| # | Question | Decision | Needed by |
| - | -------- | -------- | --------- |
| 1 | Should a zone's add menu attach existing global sources, not only create new ones? | Yes, "Existing source" entry | Phase 1 |
| 2 | Solo is transient, not persisted | Accepted | Phase 1 |
| 3 | Deleting a zone leaves its sources global and unattached | Accepted | Phase 1 |
| 4 | `/` opens the last selected zone (else first zone, else empty state) | Accepted | Phase 1 |
| 5 | When does the login screen arrive? It is not in the phase list, but #21 is in the v0.1 roadmap. | Phase 2 shell, disabled until #21 enables it | Phase 2 |
| 6 | Level-to-dB curve for faders | 0 = silence, 1 = -60 dB, 100 = 0 dB, linear in dB | Phase 3 (#14) |
| 7 | Tidal Connect has no mature open-source receiver. If the Phase 5 spike fails, is a non-Connect Tidal source acceptable, or is Tidal deferred? | **Open.** Proposed: defer Tidal rather than ship a fake Connect target | Phase 5 |

## 12. Sign-off

Approved by: (owner) ______________  Date: __________

Approval unlocks Phase 1 only. Phase 1 starts with its own plan and a
confirmation, per `AGENTS.md`.
