import { useEffect, useState } from "react";
import { fetchHealth, type Health } from "./api";

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth().then(setHealth, (e: Error) => setError(e.message));
  }, []);

  return (
    <main className="shell">
      <h1>Player-d</h1>
      <p className="status">
        {error ?? (health ? `Core ${health.status}, version ${health.version}` : "Connecting...")}
      </p>
    </main>
  );
}
