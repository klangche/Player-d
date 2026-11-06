import type { Api } from "../client";
import type { DanteDevice, DanteFlows, Source, SystemStatus, Zone } from "../types";
import { getMock, nextId } from "./store";

function capacity() {
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

export function createMockApi(): Api {
  const mock = getMock;

  return {
    getZones: async () => mock().zones,
    createZone: async (name: string) => {
      const zone: Zone = {
        id: nextId("zone"),
        name,
        io: { inChannels: 2 as const, outChannels: 2 as const, inLayout: "mono" as const, outLayout: "mono" as const, linked: true },
        masterLevel: 80,
        masterMute: false,
        inputs: [],
        outputs: [],
      };
      mock().zones.push(zone);
      return zone;
    },
    deleteZone: async (id: string) => {
      const m = mock();
      m.zones = m.zones.filter((zone) => zone.id !== id);
    },
    patchZone: async (id: string, patch: Partial<Zone>) => {
      const m = mock();
      const zone = m.zones.find((zone) => zone.id === id);
      if (!zone) throw new Error(`zone ${id} not found`);
      const next = { ...zone, ...patch };
      m.zones = m.zones.map((zone) => (zone.id === id ? next : zone));
      return next;
    },
    patchMaster: async (zoneId: string, patch: { level?: number; mute?: boolean }) => {
      const m = mock();
      const zone = m.zones.find((zone) => zone.id === zoneId);
      if (!zone) throw new Error(`zone ${zoneId} not found`);
      const next = { ...zone, masterLevel: patch.level ?? zone.masterLevel, masterMute: patch.mute ?? zone.masterMute };
      m.zones = m.zones.map((zone) => (zone.id === zoneId ? next : zone));
      return next;
    },
    getSources: async () => mock().sources,
    createSource: async (source: Omit<Source, "id" | "status">) => {
      const src: Source = { ...source, id: nextId("src"), status: "offline" };
      mock().sources.push(src);
      return src;
    },
    deleteSource: async (id: string) => {
      const m = mock();
      m.sources = m.sources.filter((source) => source.id !== id);
    },
    connectSource: async (id: string) => {
      const m = mock();
      const src = m.sources.find((source) => source.id === id);
      if (!src) throw new Error(`source ${id} not found`);
      const next = { ...src, status: "online" as const };
      m.sources = m.sources.map((source) => (source.id === id ? next : source));
      return next;
    },
    disconnectSource: async (id: string) => {
      const m = mock();
      const src = m.sources.find((source) => source.id === id);
      if (!src) throw new Error(`source ${id} not found`);
      const next = { ...src, status: "offline" as const };
      m.sources = m.sources.map((source) => (source.id === id ? next : source));
      return next;
    },
    scanDevices: async (): Promise<DanteDevice[]> => mock().devices,
    putSubscription: async () => {
      // Phase 1: no routing yet.
    },
    getFlows: async (): Promise<DanteFlows> => {
      const devices = mock().devices.map((device) => ({ deviceId: device.id, flows: device.flows }));
      const cap = capacity();
      return { capacity: cap, devices };
    },
    getSystemStatus: async (): Promise<SystemStatus> => ({ version: "0.0.0", engine: "running", capacity: capacity() }),
    restart: async () => {
      // Phase 1: no engine yet.
    },
    setLayoutAll: async () => {
      // Phase 1: no persistence yet.
    },
  };
}
