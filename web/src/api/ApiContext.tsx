import { createContext, useContext } from "react";
import type { Api } from "./client";
import type { DanteCapacity, DanteDevice, DanteFlows, Source, SystemStatus, Zone } from "./types";

export interface ApiState {
  zones: Zone[];
  sources: Source[];
  devices: DanteDevice[];
  capacity: DanteCapacity;
  flows: DanteFlows;
  status: SystemStatus;
  meter: { zoneId: string; stripId: string; peakDb: number[] } | null;
  api: Api;
}

export const ApiContext = createContext<ApiState | null>(null);

export function useApi(): ApiState {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used inside ApiProvider");
  return ctx;
}
