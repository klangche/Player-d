import { useApi } from "../../api/ApiContext";

export function DeviceList({ devices }: { devices: ReturnType<typeof useApi>["devices"] }) {
  const { api } = useApi();
  const scanning = devices.length === 0;
  return (
    <section className="devices">
      <h2>Devices</h2>
      <button type="button" onClick={() => void api.scanDevices()}>
        Scan
      </button>
      {devices.length === 0 ? <div>No Dante devices found</div> : null}
      {devices.map((device) => (
        <div key={device.id} className="device">
          {device.name} @ {device.address}
        </div>
      ))}
    </section>
  );
}
