import type { Source, Zone } from "../../api/types";
import { AddSourceDialog } from "./AddSourceDialog";

export function SourcesPanel({
  zone,
  sources,
  onAttach,
  onConnect,
  onDisconnect,
}: {
  zone: Zone;
  sources: Source[];
  onAttach: (sourceId: string) => void;
  onConnect: (sourceId: string) => void;
  onDisconnect: (sourceId: string) => void;
}) {
  const attachedIds = new Set(
    zone.inputs.filter((i) => i.kind === "source").map((i) => i.sourceId).filter(Boolean) as string[],
  );
  const available = sources.filter((s) => !attachedIds.has(s.id));

  return (
    <section className="sources">
      <h2>Sources</h2>
      {zone.inputs
        .filter((i) => i.kind === "source")
        .map((input) => {
          const source = sources.find((s) => s.id === input.sourceId);
          if (!source) return null;
          return (
            <div key={input.id} className="source-row">
              <span className="badge">{source.kind}</span>
              <span className="source-name">{source.name}</span>
              <span className="source-status">{source.status}</span>
              <button type="button" onClick={() => onConnect(source.id)}>
                Connect
              </button>
              <button type="button" onClick={() => onDisconnect(source.id)}>
                Disconnect
              </button>
            </div>
          );
        })}
      <AddSourceDialog sources={available} onAttach={onAttach} onClose={() => undefined} />
    </section>
  );
}
