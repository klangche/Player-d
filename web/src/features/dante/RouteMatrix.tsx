import { useApi } from "../../api/ApiContext";

export function RouteMatrix() {
  const { zones } = useApi();
  return (
    <section className="route-matrix">
      <h2>Routing</h2>
      {zones.map((zone) => (
        <div key={zone.id} className="route-row">
          <span>{zone.name}</span>
        </div>
      ))}
    </section>
  );
}
