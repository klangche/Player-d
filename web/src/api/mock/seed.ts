import type { Source, Zone, ZoneInput, ZoneOutput } from "../types";

export interface ZoneSeed {
  id: string;
  name: string;
  io: Zone["io"];
  masterLevel: number;
  masterMute: boolean;
  inputs: ZoneInput[];
  outputs: ZoneOutput[];
}

export interface SeedData {
  zones: Zone[];
  sources: Source[];
  devices: {
    id: string;
    name: string;
    address: string;
    sampleRate: number;
    channels: { index: number; direction: "tx" | "rx"; name?: string }[];
    flows: { txCap: number; rxCap: number; txUsed: number; rxUsed: number };
    reachable: boolean;
  }[];
}

export function seedZones(): Zone[] {
  const living: Zone = {
    id: "zone-living",
    name: "Living Room",
    io: { inChannels: 2, outChannels: 2, inLayout: "mono", outLayout: "mono", linked: true },
    masterLevel: 80,
    masterMute: false,
    inputs: [],
    outputs: [
      { id: "out-living-1", content: "sum", level: 70, mute: false, signal: true },
      { id: "out-living-2", content: "sum", level: 70, mute: false, signal: true },
    ],
  };
  const kitchen: Zone = {
    id: "zone-kitchen",
    name: "Kitchen",
    io: { inChannels: 2, outChannels: 2, inLayout: "stereo", outLayout: "stereo", linked: true },
    masterLevel: 75,
    masterMute: false,
    inputs: [],
    outputs: [
      { id: "out-kitchen-1", level: 75, mute: false, signal: true },
    ],
  };
  const showroom: Zone = {
    id: "zone-showroom",
    name: "Showroom",
    io: {
      inChannels: 4,
      outChannels: 4,
      inLayout: "mixed",
      outLayout: "mixed",
      linked: true,
      inPairs: ["stereo", "split"],
      outPairs: ["stereo", "split"],
    },
    masterLevel: 60,
    masterMute: false,
    inputs: [],
    outputs: [
      { id: "out-showroom-1", content: "sum", level: 60, mute: false, signal: true },
      { id: "out-showroom-2", content: "sum", level: 60, mute: false, signal: true },
    ],
  };
  return [living, kitchen, showroom];
}

export function seedSources(): Source[] {
  return [
    { id: "src-spotify", kind: "spotify", name: "Kitchen phone", status: "online", detail: "Track 4:21", channels: 2 },
    { id: "src-tidal", kind: "tidal", name: "Tidal", status: "offline", channels: 2 },
    { id: "src-airplay", kind: "airplay", name: "Living room", status: "offline", channels: 2 },
    { id: "src-local", kind: "local", name: "Jazz", status: "online", detail: "/music/jazz.flac", channels: 2 },
    { id: "src-local2", kind: "local", name: "Podcast", status: "offline", channels: 1 },
  ];
}

export function seedDevices(): SeedData["devices"] {
  return [
    {
      id: "dev-amp-1",
      name: "Amp-1",
      address: "192.168.1.20",
      sampleRate: 48000,
      channels: [
        { index: 1, direction: "tx", name: "Tx 1" },
        { index: 2, direction: "tx", name: "Tx 2" },
        { index: 3, direction: "tx", name: "Tx 3" },
        { index: 4, direction: "tx", name: "Tx 4" },
        { index: 1, direction: "rx", name: "Rx 1" },
        { index: 2, direction: "rx", name: "Rx 2" },
        { index: 3, direction: "rx", name: "Rx 3" },
        { index: 4, direction: "rx", name: "Rx 4" },
      ],
      flows: { txCap: 32, rxCap: 32, txUsed: 2, rxUsed: 2 },
      reachable: true,
    },
    {
      id: "dev-stage",
      name: "Stage box",
      address: "10.0.0.5",
      sampleRate: 48000,
      channels: [
        { index: 1, direction: "tx", name: "Tx 1" },
        { index: 2, direction: "tx", name: "Tx 2" },
        { index: 3, direction: "tx", name: "Tx 3" },
        { index: 4, direction: "tx", name: "Tx 4" },
        { index: 5, direction: "tx", name: "Tx 5" },
        { index: 6, direction: "tx", name: "Tx 6" },
        { index: 7, direction: "tx", name: "Tx 7" },
        { index: 8, direction: "tx", name: "Tx 8" },
        { index: 1, direction: "rx", name: "Rx 1" },
        { index: 2, direction: "rx", name: "Rx 2" },
        { index: 3, direction: "rx", name: "Rx 3" },
        { index: 4, direction: "rx", name: "Rx 4" },
        { index: 5, direction: "rx", name: "Rx 5" },
        { index: 6, direction: "rx", name: "Rx 6" },
        { index: 7, direction: "rx", name: "Rx 7" },
        { index: 8, direction: "rx", name: "Rx 8" },
      ],
      flows: { txCap: 16, rxCap: 16, txUsed: 0, rxUsed: 0 },
      reachable: false,
    },
  ];
}

export function seedCapacity() {
  return {
    sampleRate: 48000 as const,
    inChannels: 512,
    outChannels: 512,
    inStreams: 64,
    outStreams: 64,
    usedInChannels: 2,
    usedOutChannels: 2,
    usedInStreams: 1,
    usedOutStreams: 1,
    clockLeaderId: "dev-amp-1",
  };
}
