import type {
  DanteCapacity,
  DanteDevice,
  DanteFlows,
  MeterFrame,
  Source,
  SystemStatus,
  Zone,
  ZoneInput,
} from "./types";

export interface SubscriptionInput {
  direction: "in" | "out";
  slotId: string;
  assignment: { deviceId: string; channelIndices: number[] } | null;
}

export interface Api {
  getZones: () => Promise<Zone[]>;
  createZone: (name: string) => Promise<Zone>;
  deleteZone: (id: string) => Promise<void>;
  patchZone: (id: string, patch: Partial<Zone>) => Promise<Zone>;
  patchMaster: (zoneId: string, patch: Partial<{ level: number; mute: boolean }>) => Promise<Zone>;
  getSources: () => Promise<Source[]>;
  createSource: (source: Omit<Source, "id" | "status">) => Promise<Source>;
  deleteSource: (id: string) => Promise<void>;
  connectSource: (id: string) => Promise<Source>;
  disconnectSource: (id: string) => Promise<Source>;
  scanDevices: () => Promise<DanteDevice[]>;
  putSubscription: (input: SubscriptionInput) => Promise<void>;
  getFlows: () => Promise<DanteFlows>;
  getSystemStatus: () => Promise<SystemStatus>;
  restart: (target: "audio" | "sources") => Promise<void>;
  setLayoutAll: (layout: "mono") => Promise<void>;
}
