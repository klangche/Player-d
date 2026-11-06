export type SourceKind = "spotify" | "tidal" | "airplay" | "local";
export type SourceStatus = "offline" | "connecting" | "online" | "error";
export type ChannelDirection = "tx" | "rx";
export type ChannelCount = 2 | 4 | 8 | 16 | 32;
export type LayoutMode = "mono" | "stereo" | "mixed";
export type PairMode = "stereo" | "split";
export type MonoContent = "left" | "right" | "sum";

export interface ZoneIo {
  inChannels: ChannelCount;
  outChannels: ChannelCount;
  inLayout: LayoutMode;
  outLayout: LayoutMode;
  linked: boolean;
  inPairs?: PairMode[];
  outPairs?: PairMode[];
}

export interface Source {
  id: string;
  kind: SourceKind;
  name: string;
  status: SourceStatus;
  detail?: string;
  channels: 1 | 2;
}

export interface ChannelRef {
  deviceId: string;
  channelIndex: number;
}

export interface ZoneInput {
  id: string;
  kind: "source" | "dante" | "zone";
  sourceId?: string;
  sourceZoneId?: string;
  channels?: ChannelRef[];
  level: number;
  ceiling: number;
  mute: boolean;
  solo: boolean;
}

export interface ZoneOutput {
  id: string;
  channels?: ChannelRef[];
  content?: MonoContent;
  routeMode?: "managed" | "advertised";
  level: number;
  mute: boolean;
  signal: boolean;
}

export interface Zone {
  id: string;
  name: string;
  io: ZoneIo;
  masterLevel: number;
  masterMute: boolean;
  inputs: ZoneInput[];
  outputs: ZoneOutput[];
}

export interface FlowCounts {
  txCap: number;
  rxCap: number;
  txUsed: number;
  rxUsed: number;
}

export interface DanteDevice {
  id: string;
  name: string;
  address: string;
  sampleRate: number;
  channels: { index: number; direction: ChannelDirection; name?: string }[];
  flows: FlowCounts;
  reachable: boolean;
}

export interface DanteCapacity {
  sampleRate: 48000 | 96000;
  inChannels: number;
  outChannels: number;
  inStreams: number;
  outStreams: number;
  usedInChannels: number;
  usedOutChannels: number;
  usedInStreams: number;
  usedOutStreams: number;
  clockLeaderId: string | null;
}

export interface DanteFlows {
  capacity: DanteCapacity;
  devices: { deviceId: string; flows: FlowCounts }[];
}

export interface SystemStatus {
  version: string;
  engine: "running" | "stopped" | "error";
  capacity: DanteCapacity;
}

export interface MeterFrame {
  zoneId: string;
  stripId: string;
  peakDb: number[];
}

export interface Settings {
  network: { nic: string; hostName: string; sampleRate: 48000 | 96000; latencyMs: 0.5 };
  defaults: {
    inputLevel: number;
    outputLevel: number;
    masterLevel: number;
    powerOnMute: boolean;
    channelCount: ChannelCount;
    layout: LayoutMode;
  };
  backends: {
    spotifyPath: string;
    spotifyBitrate: 160 | 320;
    airplayPath: string;
    tidalPath: string;
    musicDir: string;
  };
}
