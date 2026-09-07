const DEFAULT_TIMEOUT_MS = 8_000;

export async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();

  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "application/json",
      "User-Agent": "COBRA-Data/1.0 (+https://www.cobra-protocol.org)",
      ...(options.headers || {}),
    },
  });

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const error = new Error(`upstream_${response.status}`);
    error.status = response.status;
    error.latencyMs = latencyMs;
    throw error;
  }

  return {
    data: await response.json(),
    latencyMs,
    fetchedAt: new Date().toISOString(),
  };
}
