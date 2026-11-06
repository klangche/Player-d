import type { Source, Zone, ZoneInput } from "../types";
import { seedDevices, seedSources, seedZones } from "./seed";

export interface MockDevice {
  id: string;
  name: string;
  address: string;
  sampleRate: number;
  channels: { index: number; direction: "tx" | "rx"; name?: string }[];
  flows: { txCap: number; rxCap: number; txUsed: number; rxUsed: number };
  reachable: boolean;
}

export interface MockState {
  zones: Zone[];
  sources: Source[];
  devices: MockDevice[];
}

let state: MockState = { zones: seedZones(), sources: seedSources(), devices: seedDevices() };
let seq = 0;

export function getMock(): MockState {
  return state;
}

export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
