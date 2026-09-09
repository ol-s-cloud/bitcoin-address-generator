export function deriveMiningDecision({ site, asset, economics, metrics = {}, connectorHealth = [] }) {
  if (!site || !asset || !economics?.output) throw new Error("decision_inputs_required");

  const breakEvenPenceKwh = Number(economics.output.breakEvenElectricityPerMwh) / 10;
  const sitePenceKwh = Number(site.tariff.pencePerKwh);
  const ratio = breakEvenPenceKwh > 0 ? sitePenceKwh / breakEvenPenceKwh : Infinity;
  const headroomPenceKwh = breakEvenPenceKwh - sitePenceKwh;
  const headroomPct = breakEvenPenceKwh > 0 ? (headroomPenceKwh / breakEvenPenceKwh) * 100 : null;

  let condition = "CURTAIL";
  let action = "CURTAIL";
  if (ratio <= 0.70) { condition = "STRONG"; action = "MINE_NOW"; }
  else if (ratio <= 0.90) { condition = "FAVOURABLE"; action = "MINE_NOW"; }
  else if (ratio <= 1.00) { condition = "MARGINAL"; action = "WATCH"; }
  else if (ratio <= 1.15) { condition = "UNFAVOURABLE"; action = "WAIT"; }

  const surplusMw = metricNumber(metrics.forecast_surplus);
  const carbon = metricNumber(metrics.carbon_intensity);
  const marketGbpMwh = metricNumber(metrics.market_index_price);
  const imbalanceGbpMwh = metricNumber(metrics.system_imbalance_price);

  const drivers = [];
  const risks = [];
  if (Number.isFinite(headroomPct)) {
    drivers.push({
      code: "tariff_vs_break_even",
      direction: headroomPenceKwh >= 0 ? "positive" : "negative",
      text: headroomPenceKwh >= 0
        ? `Site electricity is ${Math.abs(headroomPct).toFixed(1)}% below the current break-even threshold.`
        : `Site electricity is ${Math.abs(headroomPct).toFixed(1)}% above the current break-even threshold.`,
    });
  }
  if (Number.isFinite(surplusMw)) {
    drivers.push({
      code: "grid_headroom",
      direction: surplusMw >= 5000 ? "positive" : surplusMw >= 1000 ? "neutral" : "negative",
      text: surplusMw >= 5000
        ? `GB forecast headroom is elevated at ${(surplusMw / 1000).toFixed(1)} GW.`
        : `GB forecast headroom is ${(surplusMw / 1000).toFixed(1)} GW.`,
    });
  }
  if (Number.isFinite(carbon)) {
    drivers.push({
      code: "carbon",
      direction: carbon < 125 ? "positive" : carbon < 250 ? "neutral" : "negative",
      text: `Grid carbon intensity is ${Math.round(carbon)} gCO₂/kWh.`,
    });
  }
  if (Number.isFinite(marketGbpMwh)) {
    drivers.push({ code: "wholesale_context", direction: "context", text: `GB wholesale market price is £${marketGbpMwh.toFixed(2)}/MWh; this is context, not the site's retail tariff.` });
  }

  if (ratio > 0.90 && ratio <= 1) risks.push("A relatively small deterioration in Bitcoin economics or electricity cost could remove the current margin.");
  if (ratio > 1) risks.push("The current site tariff is above calculated break-even electricity cost.");
  if (Number.isFinite(imbalanceGbpMwh) && Number.isFinite(marketGbpMwh) && imbalanceGbpMwh > marketGbpMwh * 1.5) risks.push("System imbalance price is materially above the wholesale market price, indicating elevated balancing stress.");
  risks.push("Future Bitcoin difficulty, fees and BTC/GBP can change the break-even threshold.");

  const confidence = deriveDataConfidence(connectorHealth, metrics, site, asset);

  return {
    action,
    condition,
    dataConfidence: confidence,
    economics: {
      siteTariffPenceKwh: sitePenceKwh,
      breakEvenPenceKwh,
      headroomPenceKwh,
      headroomPct,
      profitable: economics.output.grossMarginDay > 0,
    },
    drivers,
    risks,
  };
}

function deriveDataConfidence(connectorHealth, metrics, site, asset) {
  const required = ["market_index_price", "forecast_surplus", "carbon_intensity", "bitcoin_network_state"];
  const available = required.filter((code) => metrics[code]).length;
  const freshness = connectorHealth.length
    ? connectorHealth.filter((item) => item?.status === "operational" && !item?.stale).length / connectorHealth.length
    : 0;
  let score = (available / required.length) * 65 + freshness * 25;
  if (site?.tariff?.source === "user_supplied") score += 5;
  if (asset?.source?.type === "manufacturer") score += 5;
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    meaning: "Data confidence measures source availability, freshness and input provenance. It is not a probability of future profit.",
  };
}

function metricNumber(metric) {
  const value = Number(metric?.value);
  return Number.isFinite(value) ? value : null;
}
