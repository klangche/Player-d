export interface Health {
  status: string;
  version: string;
}

export async function fetchHealth(fetcher: typeof fetch = fetch): Promise<Health> {
  const response = await fetcher("/api/health");
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return (await response.json()) as Health;
}
