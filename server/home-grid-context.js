import { getAccountSession } from "./auth.js";

const CARBON_BASE = "https://api.carbonintensity.org.uk";

export async function readHomeGridContext(request, response) {
  const session = await getAccountSession(request);
  if (!session) return response.status(401).json({ authenticated: false });

  const requestedSiteId = cleanOptional(request.query?.siteId, 120);
  const site = requestedSiteId
    ? (session.sites || []).find((entry) => entry.id === requestedSiteId && entry.product === "home")
    : (session.sites || []).find((entry) => entry.product === "home");
  if (!site) return response.status(404).json({ error: "home_site_not_found" });

  const outwardPostcode = normalizeOutwardPostcode(site.postcode);
  const current = outwardPostcode
    ? await fetchRegionalCarbon(outwardPostcode)
    : await fetchNationalCarbon();

  return response.status(200).json({
    authenticated: true,
    site: { id: site.id, postcode: site.postcode || null, country_code: site.country_code || null },
    grid: current,
    note: "Grid carbon context is not the household retail electricity price.",
  });
}

async function fetchRegionalCarbon(postcode) {
  const endpoint = `${CARBON_BASE}/regional/postcode/${encodeURIComponent(postcode)}`;
  try {
    const payload = await fetchJson(endpoint);
    const region = Array.isArray(payload?.data) ? payload.data[0] : null;
    const point = Array.isArray(region?.data) ? region.data[0] : region;
    const intensity = point?.intensity || region?.intensity || null;
    const generationMix = Array.isArray(point?.generationmix)
      ? point.generationmix
      : Array.isArray(region?.generationmix)
        ? region.generationmix
        : [];

    if (!region || !intensity) throw new Error("invalid_regional_carbon_payload");

    return {
      status: "operational",
      scope: "regional",
      outwardPostcode: postcode,
      regionId: numberOrNull(region.regionid),
      region: region.shortname || region.dnoregion || region.name || null,
      dnoRegion: region.dnoregion || null,
      forecastGco2PerKwh: numberOrNull(intensity.forecast),
      actualGco2PerKwh: numberOrNull(intensity.actual),
      index: intensity.index || null,
      validFrom: point?.from || region?.from || null,
      validTo: point?.to || region?.to || null,
      generationMix: generationMix.map((entry) => ({
        fuel: entry.fuel || null,
        percentage: numberOrNull(entry.perc),
      })).filter((entry) => entry.fuel),
      source: {
        provider: "National Energy System Operator",
        dataset: "Official GB Carbon Intensity API",
        endpoint,
        licence: "CC BY 4.0",
      },
    };
  } catch (error) {
    const national = await fetchNationalCarbon();
    return {
      ...national,
      scope: "national_fallback",
      outwardPostcode: postcode,
      regionalError: String(error?.message || "regional_carbon_unavailable"),
    };
  }
}

async function fetchNationalCarbon() {
  const endpoint = `${CARBON_BASE}/intensity`;
  try {
    const payload = await fetchJson(endpoint);
    const point = Array.isArray(payload?.data) ? payload.data[0] : null;
    if (!point?.intensity) throw new Error("invalid_national_carbon_payload");
    return {
      status: "operational",
      scope: "gb",
      outwardPostcode: null,
      regionId: null,
      region: "Great Britain",
      dnoRegion: null,
      forecastGco2PerKwh: numberOrNull(point.intensity.forecast),
      actualGco2PerKwh: numberOrNull(point.intensity.actual),
      index: point.intensity.index || null,
      validFrom: point.from || null,
      validTo: point.to || null,
      generationMix: [],
      source: {
        provider: "National Energy System Operator",
        dataset: "Official GB Carbon Intensity API",
        endpoint,
        licence: "CC BY 4.0",
      },
    };
  } catch (error) {
    return {
      status: "unavailable",
      scope: "gb",
      outwardPostcode: null,
      region: "Great Britain",
      forecastGco2PerKwh: null,
      actualGco2PerKwh: null,
      index: null,
      validFrom: null,
      validTo: null,
      generationMix: [],
      source: {
        provider: "National Energy System Operator",
        dataset: "Official GB Carbon Intensity API",
        endpoint,
        licence: "CC BY 4.0",
      },
      error: String(error?.message || "carbon_context_unavailable"),
    };
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "COBRA-Home/1.0" },
    });
    if (!response.ok) throw new Error(`carbon_http_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeOutwardPostcode(value) {
  const postcode = String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
  if (!postcode) return null;
  const outward = postcode.includes(" ") ? postcode.split(" ")[0] : postcode;
  return /^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(outward) ? outward : null;
}

function cleanOptional(value, maxLength) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
