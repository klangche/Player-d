# Player-d WebGUI specification (v0.2)

Status: draft for owner sign-off. It replaces v0.1 (plan #27, step #28).
No GUI code is written before this document is approved.

Terms:
- **Zone**: a room. It has sources, speakers, a mixer and its own address.
- **Speaker**: one Dante output slot of a zone. It is one Dante Rx
  channel, or an adjacent pair for stereo, on a remote device.
- **Source**: what plays in a zone: the zone's own Spotify, AirPlay or
  Tidal receiver, a Dante input, or the "All zones" feed.
- **All zones**: a built-in system zone. Whatever plays there is mixed
  into every zone as one more source.

## 1. Design language

Sonos-inspired: plain, content first. It takes the style
only; no Sonos logo, fonts, icons or wording.

- Typography: one sans family (Inter, self-hosted). Large titles
  (28/34 px), body 15/16 px, tabular numbers for levels.
- Color: a neutral light theme (white surfaces, near-black text) and a
  dark theme (near-black surfaces). One accent color for active state
  and sliders. Album art carries the color, not the chrome.
- Surfaces: rounded cards (16 px radius), no borders, soft shadow in
  light mode, a subtle elevation step in dark mode. Spacing on a 4 px
  grid.
- Controls: wide pill sliders with the value shown on drag, 44 px
  minimum touch targets, and a large play/pause button.
- Motion: 150-250 ms ease-out. No motion when the user sets
  `prefers-reduced-motion`.
- Mobile-first: a single column at 390 px, two columns from 1024 px
  (zone list + zone), a three-pane desktop layout from 1440 px.
- All texts live in one strings file with stable keys. English ships
  first; the second language is open (section 10, #2).

## 2. Navigation

Mobile: a bottom tab bar with Zones, Setup and Settings. Desktop: the
same entries in a left rail. The other screens below are not tabs.

| Screen   | Route              | Content                              |
| -------- | ------------------ | ------------------------------------ |
| Zones    | `/`                | zone cards with now playing, volume  |
| Zone     | `/z/:slug`         | zone view (section 4)                |
| Setup    | `/setup/dante`     | Dante controller (section 5)         |
|          | `/setup/zones`     | create, rename, delete zones         |
| Settings | `/settings`        | system, account, license (section 6) |
| Login    | `/login`           | section 7                            |

Zone address: opening `<slug>.player-d.local:<port>` or
`<host>:<port>/z/<slug>` shows that zone in **zone mode**:
- No tab bar. Only that zone's view and a link to "All zones".
- Setup and Settings are hidden; they stay reachable from the main
  address.

A login is still required. Slugs are made from the zone name and are
unique. They are also mDNS host labels: `a-z`, `0-9` and `-` only, no
leading or trailing `-`, at most 63 characters. Renaming a zone changes
its slug and asks first.

## 3. Zones (home)

```
+--------------------------------------+
| Zones                           (gear)|
|                                       |
| +-----------------------------------+ |
| | [art] All zones                   | |
| |       Nothing playing             | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | [art] Showroom                    | |
| |       Song - Artist   Spotify  (>)| |
| |       (vol) ===========o------    | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | [art] Kitchen          AirPlay    | |
| ...                                   |
+--------------------------------------+
| Zones        Setup        Settings   |
+--------------------------------------+
```

- One card per zone, "All zones" pinned first.
- Each card shows: art, zone name, track and artist, source badge,
  play/pause, and the zone volume (master).
- Tap the card to open the zone. Drag the slider to set the master
  level without opening the zone.
- Empty state (no zones yet): "Patch your first speakers" leads to
  Setup.

## 4. Zone view

```
+--------------------------------------+
| <  Showroom                          |
|                                       |
|          [ large album art ]          |
|        Song title                     |
|        Artist - Album                 |
|        via Spotify on "Showroom"      |
|                                       |
|        (|<)   ( > )   (>|)            |
|   (vol) ================o-----  72    |
|                                       |
| Source   [Spotify] AirPlay Tidal      |
|          Dante in   All zones         |
|                                       |
| Mixer                         (open)  |
| +-----------------------------------+ |
| | Spotify          ======o----  80  | |
| | All zones        ====o------  60  | |
| | Dante in 1       --o--------  20  | |
| +-----------------------------------+ |
| Speakers                              |
| +-----------------------------------+ |
| | Front L+R (Amp-1)  ====o---- 70 M | |
| | Sub (Amp-2)        ======o-- 85 M | |
| | Ceiling 3 (Amp-3)  ===o----- 55 M | |
| +-----------------------------------+ |
+--------------------------------------+
```

- **Now playing**: art, title, artist, album, and which receiver is
  playing.
- **Transport**: prev/play/next. Shown only when the active source
  supports it (Spotify and AirPlay remote control); otherwise hidden,
  never disabled without a reason.
- **Master**: zone volume 0-100, plus mute.
- **Source chips**: show which sources are live. Spotify, AirPlay and
  Tidal become active when an app plays to the zone; Dante inputs and
  "All zones" are toggled here.
- **Mixer**: one row per active source: level 0-100 and mute. Collapsed
  on mobile, open on desktop.
- **Speakers**: one row per speaker: name (user label + device), level
  0-100 (the trim per speaker model), mute, and a signal dot. A speaker
  is stereo or mono as patched in Setup; a mono speaker shows L, R or
  L+R.
- "All zones" view: the same layout. Its speakers list is replaced by
  "Sends to": one row per zone with that zone's level for the "All
  zones" source.
- Levels: integers 0-100; 100 = 0 dB, 1 = -60 dB, linear in dB from
  1 to 100, 0 = silence. Sliders send updates debounced at about 80 ms; the server
  echo wins.

## 5. Setup: Dante controller

Used once, to wire the system. Desktop is the target; on mobile it is a
list view.

```
DANTE                               [Scan]   Speakers 18/256  Inputs 2/256
Devices                    | Patch
v Amp-1   192.168.1.20 48k | Rx channel        Zone        Speaker label  Layout
    Rx 1  Rx 2  Rx 3 Rx 4  | Amp-1 Rx 1-2      Showroom    Front          Stereo
v Amp-2   192.168.1.21 48k | Amp-2 Rx 1        Showroom    Sub            Mono L+R
v Mic-in  192.168.1.40 48k | Amp-1 Rx 3        Kitchen     Ceiling        Mono L+R
    Tx 1  Tx 2             | Mic-in Tx 1       Showroom    (input) Dante in 1
```

- Left: discovered devices (name, IP, sample rate, reachable), each
  expandable to its Tx and Rx channels.
- Right: the patch table. Each row binds device channels to a zone:
  - Rx channels become speakers: one channel = a mono speaker, two
    adjacent channels = a stereo speaker.
  - Tx channels become Dante inputs of the zone.
- Patch by dragging a channel onto a zone, or with a picker (device >
  channel > zone). Speaker label and layout are edited inline.
- Rules enforced by the server and shown in the UI:
  - At most 256 speaker channels and 256 input channels in total.
  - One source per Rx channel. A Tx channel may feed several zones.
  - Sample rates must match.
  - Device flow limits are respected; a rejection says which device
    and limit.
- Each row shows the route mode: `managed` (Player-d made the
  subscription) or `advertised` (the user must subscribe on the device,
  in AES67 mode). The UI never claims a route it cannot verify.
- Manual entry (device name + channel) is available when discovery is
  incomplete.

Zones are created in `/setup/zones` (name, slug preview) or inline from
the patch picker ("New zone...").

## 6. Settings

Cards, each saved on its own:

| Card     | Content                                                        |
| -------- | -------------------------------------------------------------- |
| Account  | change password, sign out of all sessions                      |
| Network  | read-only: Dante NIC, host name, web port, sample rate (set in the stack, see `docs/install.md`); editable: latency |
| Services | Spotify, AirPlay, Tidal: enabled, status, restart; Spotify bitrate |
| Defaults | default levels for new zones and speakers, power-on mute       |
| License  | license holder, edition, issue date, import a license file     |
| System   | version, service status, restart services, download logs       |

## 7. Login and first run

- First start: `core` generates a random password and prints it once in
  the log (`docker compose logs core`). Only the hash is stored.
- The login page has a single password field. There is one admin
  account in v0.2.
- After the first login, the user must set a new password (minimum 10
  characters) before anything else loads.
- The session lasts 30 days on the device, and can be revoked in
  Settings.
- Reset: `PLAYERD_RESET_PASSWORD=true` in the stack prints a new
  password on the next start (`docs/install.md`).

## 8. State and API boundary

- The server owns all persistent state: zones, slugs, patch, levels,
  mutes, labels, settings and license. The client renders server state
  and sends intent. There are no client-only features.
- Runtime state comes from the server: now playing, source status,
  meters, Dante devices and route status. It is pushed over one
  WebSocket hub.
- Client-only state: the active route, open dialogs, drafts, the slider
  value while dragging, and the theme preference (`localStorage`).
- Steps #30 and #31 run against an in-memory mock with the same client
  interface. Step #33 defines the real REST contract from this
  document.

## 9. Non-goals for v0.2

Multiple user accounts, roles, TLS termination (use a reverse proxy),
EQ, presets, schedules, alarms, music library browsing, a native app.

## 10. Open questions (owner sign-off)

Silence means the proposed default.

| # | Question | Proposed default |
| - | -------- | ---------------- |
| 1 | Do zone addresses (zone mode) require login, or can a showroom zone page be public? | Login required; a per-zone "public control" toggle can come later |
| 2 | Second GUI language | Swedish |
| 3 | Do Spotify/AirPlay/Tidal also show up for "All zones"? | Yes, as "All zones" receivers |
| 4 | Behavior without a license | Full function, "Unlicensed" banner |

## 11. Sign-off

Approved by: (owner) ______________  Date: __________
