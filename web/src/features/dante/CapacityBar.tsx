import type { DanteCapacity, DanteFlows } from "../../api/types";

export function CapacityBar({ capacity, flows }: { capacity: DanteCapacity; flows: DanteFlows | null }) {
  const used = flows?.capacity ?? capacity;
  const pct = (used.usedInChannels / used.inChannels) * 100;
  const over = used.usedInChannels > used.inChannels;
  return (
    <div className={over ? "capacity red" : "capacity"}>
      <div>Capacity: {used.usedInChannels}/{used.inChannels} in&nbsp; {used.usedOutChannels}/{used.outChannels} out</div>
      <div>Streams: {used.usedInStreams}/{used.inStreams} in&nbsp; {used.usedOutStreams}/{used.outStreams} out</div>
      <div className="meter">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
