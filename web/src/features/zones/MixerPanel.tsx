import type { Zone, ZoneInput } from "../../api/types";
import { ChannelStrip } from "./ChannelStrip";

export function MixerPanel({
  zone,
  onPatchInput,
  onMaster,
}: {
  zone: Zone;
  onPatchInput: (inputId: string, patch: Partial<ZoneInput>) => void;
  onMaster: (patch: Partial<{ level: number; mute: boolean }>) => void;
}) {
  return (
    <section className="mixer">
      <h2>Mixer</h2>
      {zone.inputs.map((input) => (
        <ChannelStrip
          key={input.id}
          input={input}
          sourceName={input.sourceId ? `source-${input.sourceId}` : undefined}
          onPatch={(patch) => onPatchInput(input.id, patch)}
        />
      ))}
      <div className="strip master">
        <div className="strip-head">
          <span className="strip-label">Master</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={zone.masterMute ? 0 : zone.masterLevel}
          aria-label="master level"
          onChange={(e) => onMaster({ level: Number(e.target.value) })}
        />
        <button type="button" onClick={() => onMaster({ mute: !zone.masterMute })}>
          M
        </button>
      </div>
    </section>
  );
}
