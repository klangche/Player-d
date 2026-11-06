import type { Source } from "../../api/types";
import { Dialog } from "../../components/Dialog";

export function AddSourceDialog({
  sources,
  onAttach,
  onClose,
}: {
  sources: Source[];
  onAttach: (sourceId: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog title="Add source" onClose={onClose}>
      <div className="add-source">
        {sources.length === 0 ? <div>No unattached sources</div> : null}
        {sources.map((source) => (
          <button key={source.id} type="button" onClick={() => onAttach(source.id)}>
            {source.name} ({source.kind})
          </button>
        ))}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </Dialog>
  );
}
