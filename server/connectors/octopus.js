const OCTOPUS_API = "https://api.octopus.energy/v1";
const DEFAULT_TIMEOUT_MS = 12000;

export async function fetchOctopusAccount({ apiKey, accountNumber, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const key = cleanSecret(apiKey);
  const account = normalizeAccountNumber(accountNumber);
  if (!key) throw new OctopusError("api_key_required", 400);
  if (!account) throw new OctopusError("invalid_account_number", 400);

  const data = await octopusRequest(`/accounts/${encodeURIComponent(account)}/`, key, timeoutMs);
  return normalizeOctopusAccount(data);
}

export async function fetchOctopusConsumption({
  apiKey,
  fuel,
  meterPoint,
  meterSerial,
  periodFrom,
  periodTo,
  pageSize = 25000,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const key = cleanSecret(apiKey);
  const cleanFuel = fuel === "gas" ? "gas" : fuel === "electricity" ? "electricity" : null;
  const point = String(meterPoint || "").trim();
  const serial = String(meterSerial || "").trim();
  if (!key) throw new OctopusError("api_key_required", 400);
  if (!cleanFuel || !point || !serial) throw new OctopusError("meter_details_required", 400);

  const from = isoOrNull(periodFrom);
  const to = isoOrNull(periodTo);
  if (!from || !to || new Date(from) >= new Date(to)) throw new OctopusError("invalid_period", 400);

  const base = cleanFuel === "electricity"
    ? `/electricity-meter-points/${encodeURIComponent(point)}/meters/${encodeURIComponent(serial)}/consumption/`
    : `/gas-meter-points/${encodeURIComponent(point)}/meters/${encodeURIComponent(serial)}/consumption/`;
  const query = new URLSearchParams({
    page_size: String(Math.max(1, Math.min(25000, Number(pageSize) || 25000))),
    period_from: from,
    period_to: to,
    order_by: "period",
  });

  const data = await octopusRequest(`${base}?${query}`, key, timeoutMs);
  const readings = Array.isArray(data?.results)
    ? data.results.map((row) => ({
        intervalStart: row.interval_start || null,
        intervalEnd: row.interval_end || null,
        quantity: numericOrNull(row.consumption),
        unit: cleanFuel === "electricity" ? "kWh" : "supplier-reported",
        source: "octopus",
      })).filter((row) => row.intervalStart && row.quantity !== null)
    : [];

  return {
    fuel: cleanFuel,
    meterPoint: maskReference(point),
    meterSerial: maskReference(serial),
    count: readings.length,
    readings,
    next: data?.next || null,
  };
}

export function normalizeOctopusAccount(raw) {
  const accountNumber = String(raw?.number || "").trim();
  const properties = Array.isArray(raw?.properties) ? raw.properties : [];
  const meters = [];
  const tariffs = [];

  for (const property of properties) {
    for (const point of property?.electricity_meter_points || []) {
      for (const meter of point?.meters || []) {
        meters.push({
          fuel: "electricity",
          direction: point?.is_export ? "export" : "import",
          meterPoint: String(point?.mpan || ""),
          meterSerial: String(meter?.serial_number || ""),
        });
      }
      for (const agreement of point?.agreements || []) {
        tariffs.push(normalizeAgreement("electricity", agreement));
      }
    }

    for (const point of property?.gas_meter_points || []) {
      for (const meter of point?.meters || []) {
        meters.push({
          fuel: "gas",
          direction: "import",
          meterPoint: String(point?.mprn || ""),
          meterSerial: String(meter?.serial_number || ""),
        });
      }
      for (const agreement of point?.agreements || []) {
        tariffs.push(normalizeAgreement("gas", agreement));
      }
    }
  }

  return {
    provider: "Octopus Energy",
    accountNumber,
    accountNumberMasked: maskReference(accountNumber),
    properties: properties.map((property) => ({
      id: property?.id ?? null,
      movedInAt: property?.moved_in_at || null,
      movedOutAt: property?.moved_out_at || null,
      address: [
        property?.address_line_1,
        property?.address_line_2,
        property?.address_line_3,
        property?.town,
        property?.county,
        property?.postcode,
      ].filter(Boolean).join(", "),
      postcode: property?.postcode || null,
    })),
    meters: meters.map((meter) => ({
      ...meter,
      meterPointMasked: maskReference(meter.meterPoint),
      meterSerialMasked: maskReference(meter.meterSerial),
    })),
    tariffs: tariffs.filter(Boolean),
  };
}

function normalizeAgreement(fuel, agreement) {
  const tariffCode = String(agreement?.tariff_code || "").trim();
  if (!tariffCode) return null;
  return {
    fuel,
    tariffCode,
    productCode: productCodeFromTariff(tariffCode),
    validFrom: agreement?.valid_from || null,
    validTo: agreement?.valid_to || null,
    source: "octopus",
  };
}

function productCodeFromTariff(tariffCode) {
  const code = String(tariffCode || "");
  const match = code.match(/^[EG]-\dR-(.+)-[A-P]$/i);
  return match?.[1] || null;
}

async function octopusRequest(path, apiKey, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OCTOPUS_API}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        "User-Agent": "COBRA-Home/0.1",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) throw new OctopusError("octopus_auth_failed", status);
      if (status === 404) throw new OctopusError("octopus_resource_not_found", status);
      if (status === 429) throw new OctopusError("octopus_rate_limited", status);
      throw new OctopusError("octopus_request_failed", status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof OctopusError) throw error;
    if (error?.name === "AbortError") throw new OctopusError("octopus_timeout", 504);
    throw new OctopusError("octopus_unavailable", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export class OctopusError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.name = "OctopusError";
    this.code = code;
    this.status = status;
  }
}

function cleanSecret(value) {
  const text = String(value || "").trim();
  return text.length >= 8 && text.length <= 256 ? text : null;
}

function normalizeAccountNumber(value) {
  const text = String(value || "").trim().toUpperCase();
  return /^[A-Z]-[A-Z0-9]{4,20}$/.test(text) ? text : null;
}

function isoOrNull(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function numericOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function maskReference(value) {
  const text = String(value || "");
  if (text.length <= 4) return text ? "••••" : null;
  return `${"•".repeat(Math.min(8, text.length - 4))}${text.slice(-4)}`;
}
