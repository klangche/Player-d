import { describe, expect, it } from "vitest";
import { fetchHealth } from "./api";

describe("fetchHealth", () => {
  it("returns the parsed health body", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ status: "ok", version: "0.2.0" }), { status: 200 });
    await expect(fetchHealth(fetcher as typeof fetch)).resolves.toEqual({
      status: "ok",
      version: "0.2.0",
    });
  });

  it("throws on a non-OK response", async () => {
    const fetcher = async () => new Response("", { status: 503 });
    await expect(fetchHealth(fetcher as typeof fetch)).rejects.toThrow("503");
  });
});
