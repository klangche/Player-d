import type { ZoneInput } from "../../api/types";

export function ChannelStrip({
  input,
  label,
  onPatch,
}: {
  input: ZoneInput;
  label: string;
  onPatch: (patch: Partial<ZoneInput>) => void;
}) {
  const effective = Math.min(input.level, input.ceiling);

  return (
    <div className="strip" data-strip={input.id}>
      <div className="strip-head">
        <span className="strip-label">{label}</span>
        <span className="strip-badges">
          {input.mute ? "M" : ""}
          {input.solo ? "S" : ""}
        </span>
      </div>
      <input type="range" min={0} max={100} value={effective} aria-label="level" onChange={(e) => onPatch({ level: Number(e.target.value) })} />
      <div className="strip-row">
        <label>
          Ceiling
          <input
            type="range"
            min={0}
            max={100}
            value={input.ceiling}
            aria-label="ceiling"
            onChange={(e) => onPatch({ ceiling: Number(e.target.value), level: Math.min(input.level, Number(e.target.value)) })}
          />
        </label>
        <button type="button" onClick={() => onPatch({ mute: !input.mute })}>
          M
        </button>
        <button type="button" onClick={() => onPatch({ solo: !input.solo })}>
          S
        </button>
      </div>
    </div>
  );
}
