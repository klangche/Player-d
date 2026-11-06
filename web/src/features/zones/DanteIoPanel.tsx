import type { Zone } from "../../api/types";

export function DanteIoPanel({
  zone,
  onPatchZone,
}: {
  zone: Zone;
  onPatchZone: (patch: Partial<Zone>) => void;
}) {
  const io = zone.io;
  const setIo = (patch: Partial<Zone["io"]>) => onPatchZone({ io: { ...io, ...patch } });

  return (
    <section className="dante-io">
      <h2>Dante I/O</h2>
      <div className="dante-io-row">
        <label>
          Inputs{" "}
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
          Outputs{" "}
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
        <label>
          Layout{" "}
          <select
            value={io.inLayout}
            onChange={(e) => setIo({ inLayout: e.target.value as Zone["io"]["inLayout"] })}
          >
            <option value="mono">mono</option>
            <option value="stereo">stereo</option>
            <option value="mixed">mixed</option>
          </select>
        </label>
        <label>
          Out layout{" "}
          <select
            value={io.outLayout}
            onChange={(e) => setIo({ outLayout: e.target.value as Zone["io"]["outLayout"] })}
          >
            <option value="mono">mono</option>
            <option value="stereo">stereo</option>
            <option value="mixed">mixed</option>
          </select>
        </label>
      </div>
    </section>
  );
}
