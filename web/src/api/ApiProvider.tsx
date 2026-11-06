import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ApiContext } from "./ApiContext";
import type { Api } from "./client";
import type { DanteCapacity, DanteDevice, DanteFlows, Source, SystemStatus, Zone } from "./types";
import { createMockApi } from "./mock/mockClient";
const initialCapacity: DanteCapacity = {
  sampleRate: 48000,
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

export function ApiProvider({ children }: { children: ReactNode }) {
  const api: Api = createMockApi();
  const [zones, setZones] = useState<Zone[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [devices, setDevices] = useState<DanteDevice[]>([]);
  const [capacity, setCapacity] = useState<DanteCapacity>(initialCapacity);
  const [flows, setFlows] = useState<DanteFlows>({ capacity: initialCapacity, devices: [] });
  const [status, setStatus] = useState<SystemStatus>({ version: "0.0.0", engine: "running", capacity: initialCapacity });
  const [meter, setMeter] = useState<{ zoneId: string; stripId: string; peakDb: number[] } | null>(null);

  useEffect(() => {
    void (async () => {
      const [z, s, d, c, f, st] = await Promise.all([
        api.getZones(),
        api.getSources(),
        api.scanDevices(),
        Promise.resolve(initialCapacity),
        api.getFlows(),
        api.getSystemStatus(),
      ]);
      setZones(z);
      setSources(s);
      setDevices(d);
      setCapacity(c);
      setFlows(f);
      setStatus(st);
    })();
  }, [api]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMeter({ zoneId: "zone-living", stripId: "master", peakDb: [-42, -50, -48, -52] });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const value = {
    zones,
    sources,
    devices,
    capacity,
    flows,
    status,
    meter,
    api,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
