import { useApi } from "../../api/ApiContext";

export function SettingsPage() {
  const { status, api } = useApi();
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <section className="settings-group">
        <h2>Network</h2>
        <div>Read-only Phase 1: mock values.</div>
      </section>
      <section className="settings-group">
        <h2>Defaults</h2>
        <div>Read-only Phase 1: mock values.</div>
      </section>
      <section className="settings-group">
        <h2>Capacity</h2>
        <div>{status ? `Version ${status.version}, engine ${status.engine}` : "No status"}</div>
      </section>
      <section className="settings-group">
        <h2>Backends</h2>
        <div>Read-only Phase 1: mock values.</div>
      </section>
      <section className="settings-group">
        <h2>System</h2>
        <div>
          Version {status?.version ?? "-"} · Engine {status?.engine ?? "-"}
        </div>
        <button type="button" onClick={() => void api.restart("audio")}>
          Restart audio
        </button>
      </section>
    </div>
  );
}
