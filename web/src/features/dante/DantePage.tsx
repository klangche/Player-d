import { useApi } from "../../api/ApiContext";
import { DeviceList } from "./DeviceList";
import { RouteMatrix } from "./RouteMatrix";

export function DantePage() {
  const { capacity, flows, devices, sources, zones } = useApi();

  const sourcesByZone = (sourceId: string) =>
    zones
      .map((zone) => ({ zone, input: zone.inputs.find((input) => input.kind === "source" && input.sourceId === sourceId) }))
      .filter((entry) => entry.input);

  return (
    <div className="dante-page">
      <h1>Dante Controller</h1>
      <section className="dante-capacity">
        <h2>Capacity</h2>
        <div>
          {capacity.usedInChannels}/{capacity.inChannels} in · {capacity.usedOutChannels}/{capacity.outChannels} out ·{" "}
          {capacity.usedInStreams}/{capacity.inStreams} in streams · {capacity.usedOutStreams}/{capacity.outStreams} out streams
        </div>
      </section>
      <DeviceList devices={devices} />
      <section className="dante-sources">
        <h2>Sources</h2>
        {sources.map((source) => {
          const mapped = sourcesByZone(source.id);
          return (
            <div key={source.id} className="dante-source-row">
              <span className="badge">{source.kind}</span>
              <span className="source-name">{source.name}</span>
              <span className="source-status">{source.status}</span>
              {mapped.length > 0 ? <span>-&gt; {mapped.map((entry) => entry.zone.name).join(", ")}</span> : <span>unattached</span>}
            </div>
          );
        })}
      </section>
      <RouteMatrix />
    </div>
  );
}
