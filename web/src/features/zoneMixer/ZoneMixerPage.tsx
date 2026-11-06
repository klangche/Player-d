import { useApi } from "../../api/ApiContext";

export function ZoneMixerPage() {
  const { zones } = useApi();
  return (
    <div className="zone-mixer-page">
      <h1>Zone Mixer</h1>
      {zones.length < 2 ? <div>Create another zone to link zones.</div> : null}
      {zones.map((from) => (
        <div key={from.id} className="zone-mixer-row">
          <span>{from.name}</span>
          {zones
            .filter((to) => to.id !== from.id)
            .map((to) => (
              <span key={to.id}>{to.name}</span>
            ))}
        </div>
      ))}
    </div>
  );
}
