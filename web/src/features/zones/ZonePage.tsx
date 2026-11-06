import { useParams } from "react-router-dom";
import { useApi } from "../../api/ApiContext";
import type { ZoneInput } from "../../api/types";
import { MixerPanel } from "./MixerPanel";
import { SourcesPanel } from "./SourcesPanel";
import { DanteIoPanel } from "./DanteIoPanel";

export function ZonePage() {
  const { id } = useParams<{ id: string }>();
  const { zones, sources, api } = useApi();
  const zone = zones.find((zone) => zone.id === id);

  if (!zone) {
    return <div className="empty">Zone not found</div>;
  }

  const patchInput = (inputId: string, patch: Partial<ZoneInput>) => {
    const inputs = zone.inputs.map((input) => (input.id === inputId ? { ...input, ...patch } : input));
    void api.patchZone(zone.id, { inputs });
  };

  const attachSource = (sourceId: string) => {
    void api.createSource({ kind: "spotify", name: sourceId, channels: 2 }).then((source) => {
      const input = { id: "in-x", kind: "source" as const, sourceId: source.id, level: 80, ceiling: 100, mute: false, solo: false };
      void api.patchZone(zone.id, { inputs: [...zone.inputs, input] });
    });
  };

  return (
    <div className="zone-page">
      <header className="zone-header">
        <h1>{zone.name}</h1>
      </header>
      <MixerPanel
        zone={zone}
        onPatchInput={patchInput}
        onMaster={(patch) => void api.patchMaster(zone.id, patch)}
      />
      <SourcesPanel
        zone={zone}
        sources={sources}
        onAttach={attachSource}
        onConnect={(sourceId) => void api.connectSource(sourceId)}
        onDisconnect={(sourceId) => void api.disconnectSource(sourceId)}
      />
      <DanteIoPanel zone={zone} onPatchZone={(patch) => void api.patchZone(zone.id, patch)} />
    </div>
  );
}
