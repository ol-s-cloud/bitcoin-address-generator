export function parseJsonBody(request) {
  const body = request.body;
  if (!body) return {};
  if (typeof body === "object" && !Buffer.isBuffer(body)) return body;
  const text = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
  return JSON.parse(text);
}

export function requestIsSameOrigin(request) {
  const origin = request.headers?.origin;
  if (!origin) return true;
  const host = request.headers?.["x-forwarded-host"] || request.headers?.host;
  if (!host) return false;
  try {
    return new URL(origin).host === String(host).split(",")[0].trim();
  } catch {
    return false;
  }
}

export function rejectLargeBody(request, maximumBytes = 4096) {
  const length = Number(request.headers?.["content-length"] || 0);
  return Number.isFinite(length) && length > maximumBytes;
}

export function noStore(response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
}
