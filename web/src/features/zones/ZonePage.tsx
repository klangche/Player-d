import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../../api/ApiContext";
import type { Zone, ZoneInput } from "../../api/types";
import { MixerPanel } from "./MixerPanel";
import { SourcesPanel } from "./SourcesPanel";
import { DanteIoPanel } from "./DanteIoPanel";
import { ZoneSettings } from "./ZoneSettings";

type ZoneTab = "mixer" | "sources" | "dante" | "settings";

const tabs: { id: ZoneTab; label: string }[] = [
  { id: "mixer", label: "Mixer" },
  { id: "sources", label: "Sources" },
  { id: "dante", label: "Dante I/O" },
  { id: "settings", label: "Settings" },
];

export function ZonePage() {
  const { id } = useParams<{ id: string }>();
  const { zones, sources, api } = useApi();
  const zone = zones.find((zone) => zone.id === id);
  const [tab, setTab] = useState<ZoneTab>("mixer");

  if (!zone) {
    return <div className="empty">Zone not found</div>;
  }

  const patchInput = (inputId: string, patch: Partial<ZoneInput>) => {
    const inputs = zone.inputs.map((input) => (input.id === inputId ? { ...input, ...patch } : input));
    void api.patchZone(zone.id, { inputs });
  };

  const attachSource = (sourceId: string, kind: "spotify" | "tidal" | "airplay" | "local", name: string, channels: 1 | 2) => {
    void api.createSource({ kind, name, channels }).then((source) => {
      const input: ZoneInput = {
        id: `in-${source.id}`,
        kind: "source",
        sourceId: source.id,
        level: 80,
        ceiling: 100,
        mute: false,
        solo: false,
      };
      void api.patchZone(zone.id, { inputs: [...zone.inputs, input] });
    });
  };

  return (
    <div className="zone-page">
      <header className="zone-header">
        <h1>{zone.name}</h1>
      </header>
      <div className="zone-tabs" role="tablist">
        {tabs.map((tabDef) => (
          <button
            key={tabDef.id}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.id}
            className={tab === tabDef.id ? "tab active" : "tab"}
            onClick={() => setTab(tabDef.id)}
          >
            {tabDef.label}
          </button>
        ))}
      </div>
      {tab === "mixer" ? <MixerPanel zone={zone} onPatchInput={patchInput} onMaster={(patch) => void api.patchMaster(zone.id, patch)} /> : null}
      {tab === "sources" ? (
        <SourcesPanel
          zone={zone}
          sources={sources}
          onAttach={attachSource}
          onConnect={(sourceId) => void api.connectSource(sourceId)}
          onDisconnect={(sourceId) => void api.disconnectSource(sourceId)}
        />
      ) : null}      {tab === "dante" ? <DanteIoPanel zone={zone} onPatchZone={(patch) => void api.patchZone(zone.id, patch)} /> : null}
      {tab === "settings" ? <ZoneSettings zone={zone} onPatchZone={(patch) => void api.patchZone(zone.id, patch)} onRestart={() => void api.restart("audio")} /> : null}
    </div>
  );
}
