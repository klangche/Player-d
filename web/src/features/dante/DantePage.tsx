import { useApi } from "../../api/ApiContext";
import { CapacityBar } from "./CapacityBar";
import { DeviceList } from "./DeviceList";
import { RouteMatrix } from "./RouteMatrix";

export function DantePage() {
  const { capacity, flows, devices } = useApi();
  return (
    <div className="dante-page">
      <h1>Dante Controller</h1>
      <CapacityBar capacity={capacity} flows={flows} />
      <DeviceList devices={devices} />
      <RouteMatrix />
    </div>
  );
}
