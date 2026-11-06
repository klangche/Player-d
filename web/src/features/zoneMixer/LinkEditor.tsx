import { useApi } from "../../api/ApiContext";

export function LinkEditor() {
  const { zones, api } = useApi();
  const createLink = (fromId: string, toId: string) => {
    const from = zones.find((zone) => zone.id === fromId);
    const to = zones.find((zone) => zone.id === toId);
    if (!from || !to) return;
    const input = {
      id: `in-${to.id}-${from.id}`,
      kind: "zone" as const,
      sourceZoneId: from.id,
      level: 100,
      ceiling: 100,
      mute: false,
      solo: false,
    };
    void api.patchZone(to.id, { inputs: [...to.inputs, input] });
  };
  return (
    <section className="link-editor">
      <h2>Links</h2>
      <button type="button" onClick={() => void createLink("zone-living", "zone-kitchen")}>
        Living Room -&gt; Kitchen
      </button>
    </section>
  );
}
