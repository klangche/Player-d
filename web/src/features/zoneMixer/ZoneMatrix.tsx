import { useApi } from "../../api/ApiContext";

export function ZoneMatrix() {
  const { zones } = useApi();
  return (
    <section className="zone-matrix">
      <h2>Matrix</h2>
      {zones.map((from) => (
        <div key={from.id} className="zone-matrix-row">
          <span>{from.name}</span>
          {zones.map((to) => (
            <span key={to.id}>{from.id === to.id ? "self" : "—"}</span>
          ))}
        </div>
      ))}
    </section>
  );
}
