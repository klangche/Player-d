import type { Zone } from "../../api/types";

export function ZoneSettings({
  zone,
  onPatchZone,
  onRestart,
}: {
  zone: Zone;
  onPatchZone: (patch: Partial<Zone>) => void;
  onRestart: () => void;
}) {
  const io = zone.io;
  const setIo = (patch: Partial<Zone["io"]>) => onPatchZone({ io: { ...io, ...patch } });

  return (
    <section className="zone-settings">
      <h2>Settings</h2>
      <div className="settings-row">
        <label>
          Startup (power-on mute)
          <input
            type="checkbox"
            checked={zone.masterMute}
            onChange={(e) => onPatchZone({ masterMute: e.target.checked })}
          />
        </label>
      </div>
      <div className="settings-row">
        <button type="button" onClick={onRestart}>
          Restart audio
        </button>
      </div>
      <div className="settings-row">
        <label>
          Dante inputs{" "}
          <select
            value={io.inChannels}
            onChange={(e) => setIo({ inChannels: Number(e.target.value) as Zone["io"]["inChannels"] })}
          >
            {[2, 4, 8, 16, 32].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dante outputs{" "}
          <select
            value={io.outChannels}
            onChange={(e) => setIo({ outChannels: Number(e.target.value) as Zone["io"]["outChannels"] })}
          >
            {[2, 4, 8, 16, 32].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
