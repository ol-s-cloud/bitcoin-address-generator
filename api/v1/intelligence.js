import { collectLiveSnapshot, metricMap } from "../../lib/data/snapshot.js";
import { persistObservations } from "../../lib/data/persistence.js";
import { getComputeAsset } from "../../lib/compute/assets.js";
import { calculateMiningEconomics } from "../../lib/mining/economics.js";
import { normalizeSiteProfile } from "../../lib/intelligence/site-profile.js";
import { deriveMiningDecision } from "../../lib/intelligence/decision-engine.js";
import { buildMiningSensitivity } from "../../lib/intelligence/sensitivity.js";
import { persistDecisionSnapshot } from "../../lib/intelligence/decision-persistence.js";
import { readDecisionHistory } from "../../lib/intelligence/history.js";

export default async function handler(request, response) {
  try {
    const query = request?.query || {};
    const mode = String(query.mode || "").toLowerCase();

    if (mode === "history") {
      const history = await readDecisionHistory({
        siteId: query.siteId,
        assetId: query.assetId,
        hours: query.hours,
        limit: query.limit,
      });
      response.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
      return response.status(history.databaseAvailable ? 200 : 503).json({
        product: "COBRA Intelligence History",
        ...history,
      });
    }

    if (mode === "solar") {
      return handleSolarEstimate(query, response);
    }

    const site = normalizeSiteProfile({
      country: query.country,
      siteName: query.siteName,
      locality: query.locality,
      tariffPenceKwh: query.tariffPenceKwh,
      assetId: query.assetId,
      units: query.units,
      poolFeePct: query.poolFeePct,
      uptimePct: query.uptimePct,
      facilityEnergyOverheadPct: query.facilityEnergyOverheadPct,
      tariffSource: "user_supplied",
    });

    const asset = getComputeAsset(site.fleet.assetId);
    if (!asset) return response.status(400).json({ error: "unknown_asset" });

    const snapshot = await collectLiveSnapshot();
    const metrics = metricMap(snapshot.connectors);
    const bitcoin = metrics.bitcoin_network_state;
    if (!bitcoin?.priceGbp || !bitcoin?.hashRateGh || !bitcoin?.btcMined24h) {
      return response.status(503).json({ error: "bitcoin_economics_unavailable", checkedAt: snapshot.checkedAt });
    }

    const economics = calculateMiningEconomics({
      hashrateTh: asset.output * site.fleet.units,
      powerW: asset.ratedPowerW * site.fleet.units,
      networkHashrateGh: bitcoin.hashRateGh,
      btcMined24h: bitcoin.btcMined24h,
      btcPrice: bitcoin.priceGbp,
      electricityPricePerMwh: site.tariff.gbpPerMwh,
      quoteCurrency: "GBP",
      poolFeePct: site.fleet.poolFeePct,
      uptimePct: site.fleet.uptimePct,
      facilityOverheadPct: site.fleet.facilityEnergyOverheadPct,
    });

    const decision = deriveMiningDecision({
      site,
      asset,
      economics,
      metrics,
      connectorHealth: snapshot.connectors.map((item) => item.health || {}),
    });

    const out = economics.output;
    const market = {
      wholesaleGbpMwh: value(metrics.market_index_price),
      wholesaleEquivalentPenceKwh: divide(value(metrics.market_index_price), 10),
      imbalanceGbpMwh: value(metrics.system_imbalance_price),
      demandMw: value(metrics.transmission_system_demand),
      generationMw: value(metrics.generation_mix),
      forecastSurplusMw: value(metrics.forecast_surplus),
      indicatedMarginMw: value(metrics.indicated_margin),
      carbonGco2Kwh: value(metrics.carbon_intensity),
      constraintCostGbpDay: value(metrics.constraint_activity),
    };

    const bitcoinState = {
      priceGbp: bitcoin.priceGbp,
      priceUsd: bitcoin.priceUsd ?? bitcoin.value,
      blockHeight: bitcoin.blockHeight,
      difficulty: bitcoin.difficulty,
      networkHashrateGh: bitcoin.hashRateGh,
      btcMined24h: bitcoin.btcMined24h,
      blockRewardBtc: bitcoin.blockRewardBtc,
      fastestFeeSatVb: bitcoin.fastestFeeSatVb,
    };

    const economicsOutput = {
      expectedBtcDay: out.expectedBtcDayNet,
      revenueGbpDay: out.revenueDay,
      electricityCostGbpDay: out.electricityCostDay,
      netContributionGbpDay: out.grossMarginDay,
      netContributionGbpMonth: out.grossMarginDay * 30,
      netContributionGbpYear: out.grossMarginDay * 365,
      revenuePerThDayGbp: out.revenueDay / (asset.output * site.fleet.units),
      facilityEnergyKwhDay: out.facilityKwhDay,
      grossMarginPct: out.grossMarginPct,
      breakEvenGbpMwh: out.breakEvenElectricityPerMwh,
      breakEvenPenceKwh: out.breakEvenElectricityPerMwh / 10,
    };

    const sensitivity = buildMiningSensitivity({ site, asset, bitcoin: bitcoinState });
    const payload = {
      product: "COBRA Intelligence",
      version: "v1-preview",
      checkedAt: snapshot.checkedAt,
      country: site.country,
      site,
      asset,
      market,
      bitcoin: bitcoinState,
      economics: economicsOutput,
      decision,
      sensitivity,
      sources: snapshot.connectors.map((item) => ({
        sourceId: item.source?.id || null,
        metricCode: item.metric?.code || null,
        unit: item.metric?.unit || null,
        observedAt: item.metric?.observedAt || item.metric?.timestamp || item.health?.latestDataTimestamp || null,
        status: item.health?.status || "unknown",
        stale: Boolean(item.health?.stale),
      })),
    };

    try { await persistObservations(snapshot.connectors); } catch (error) {
      console.error("COBRA intelligence observation persistence failed", { name: error?.name, code: error?.code });
    }

    let decisionPersistence = { enabled: false, saved: false };
    try { decisionPersistence = await persistDecisionSnapshot(payload); } catch (error) {
      console.error("COBRA intelligence decision persistence failed", { name: error?.name, code: error?.code });
      decisionPersistence = { enabled: true, saved: false, error: "decision_persistence_unavailable" };
    }

    response.setHeader("Cache-Control", "s-maxage=45, stale-while-revalidate=90");
    return response.status(200).json({ ...payload, persistence: { decision: decisionPersistence } });
  } catch (error) {
    const clientErrors = ["unsupported_country", "invalid_tariffPenceKwh", "invalid_units", "invalid_poolFeePct", "invalid_uptimePct", "invalid_facilityEnergyOverheadPct"];
    const message = String(error?.message || "intelligence_failed");
    return response.status(clientErrors.includes(message) ? 400 : 500).json({ error: message });
  }
}

async function handleSolarEstimate(query, response) {
  const lat = bounded(query.lat, -90, 90, "invalid_latitude");
  const lon = bounded(query.lon, -180, 180, "invalid_longitude");
  const peakPowerKw = bounded(query.peakPowerKw ?? 10, 0.05, 500000, "invalid_peak_power");
  const lossPct = bounded(query.lossPct ?? 14, -5, 99, "invalid_loss");
  const mounting = String(query.mounting || "free") === "building" ? "building" : "free";

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    peakpower: String(peakPowerKw),
    loss: String(lossPct),
    mountingplace: mounting,
    pvtechchoice: "crystSi",
    optimalangles: "1",
    outputformat: "json",
  });
  const sourceUrl = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  let upstream;
  try {
    upstream = await fetch(sourceUrl, {
      headers: { Accept: "application/json", "User-Agent": "COBRA/1.0 ol-s-cloud" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!upstream?.ok) {
    return response.status(upstream?.status === 529 ? 503 : 502).json({
      error: "solar_source_unavailable",
      source: "European Commission JRC PVGIS 5.3",
      upstreamStatus: upstream?.status || null,
    });
  }

  const data = await upstream.json();
  const totals = data?.outputs?.totals?.fixed || {};
  const monthly = Array.isArray(data?.outputs?.monthly?.fixed) ? data.outputs.monthly.fixed : [];
  const system = data?.inputs?.mounting_system?.fixed || {};
  const meteo = data?.inputs?.meteo_data || {};

  const payload = {
    product: "COBRA Solar Calculator",
    checkedAt: new Date().toISOString(),
    inputs: { lat, lon, peakPowerKw, lossPct, mounting },
    outputs: {
      annualEnergyKwh: finite(totals.E_y),
      averageDailyEnergyKwh: finite(totals.E_d),
      annualPlaneIrradiationKwhM2: finite(totals["H(i)_y"]),
      annualVariabilityKwh: finite(totals.SD_y),
      totalLossPct: finite(totals.l_total),
      optimalSlopeDeg: finite(system?.slope?.value),
      optimalAzimuthDeg: finite(system?.azimuth?.value),
      specificYieldKwhKwp: finite(totals.E_y) != null ? finite(totals.E_y) / peakPowerKw : null,
      capacityFactorPct: finite(totals.E_y) != null ? (finite(totals.E_y) / (peakPowerKw * 8760)) * 100 : null,
      monthly: monthly.map((row) => ({
        month: Number(row.month),
        energyKwh: finite(row.E_m),
        dailyKwh: finite(row.E_d),
        irradiationKwhM2: finite(row["H(i)_m"]),
      })),
    },
    source: {
      provider: "European Commission Joint Research Centre",
      model: "PVGIS 5.3 · PVcalc",
      radiationDatabase: meteo.radiation_db || null,
      meteoDatabase: meteo.meteo_db || null,
      yearMin: meteo.year_min || null,
      yearMax: meteo.year_max || null,
      methodologyUrl: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en",
    },
  };

  response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  return response.status(200).json(payload);
}

function bounded(input, min, max, error) {
  const number = Number(input);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(error);
  return number;
}

function finite(input) {
  const number = Number(input);
  return Number.isFinite(number) ? number : null;
}

function value(metric) {
  const number = Number(metric?.value);
  return Number.isFinite(number) ? number : null;
}

function divide(number, divisor) {
  return Number.isFinite(number) ? number / divisor : null;
}
