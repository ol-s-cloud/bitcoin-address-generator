// COBRA public indicators — deliberately small, transparent surface.
// Advanced scoring, thresholds, weights, personalised recommendations and
// optimisation belong in cobra-core-private.

export function derivePublicIndicators(input = {}) {
  return {
    energyCondition: energyCondition(input.marketPricePerMwh),
    gridFlexibility: gridFlexibility(input.surplusMw, input.demandMw),
    bitcoinNetwork: bitcoinNetwork(input.averageBlockMinutes, input.fastestFeeSatVb),
    miningEconomics: miningEconomics(input.grossMarginPct),
    lowCarbonCompute: lowCarbonCompute(input.carbonIntensity),
    computeWindow: computeWindow(input),
  };
}

export function derivePublicIndicatorsFromMetrics(metrics = {}, context = {}) {
  const bitcoin = metrics.bitcoin_network_state || {};
  const input = {
    marketPricePerMwh: metrics.market_index_price?.value,
    surplusMw: metrics.forecast_surplus?.value,
    demandMw: metrics.transmission_system_demand?.value,
    carbonIntensity: metrics.carbon_intensity?.value,
    averageBlockMinutes: bitcoin.averageBlockMinutes,
    fastestFeeSatVb: bitcoin.fastestFeeSatVb,
    grossMarginPct: context.grossMarginPct,
  };

  return {
    region: context.region || "GB",
    generatedAt: new Date().toISOString(),
    indicators: derivePublicIndicators(input),
    inputs: {
      marketPricePerMwh: finite(input.marketPricePerMwh),
      surplusMw: finite(input.surplusMw),
      demandMw: finite(input.demandMw),
      carbonIntensity: finite(input.carbonIntensity),
      averageBlockMinutes: finite(input.averageBlockMinutes),
      fastestFeeSatVb: finite(input.fastestFeeSatVb),
      grossMarginPct: finite(input.grossMarginPct),
    },
  };
}

export function energyCondition(price) {
  const value = finite(price);
  if (value === null) return unavailable("energy_condition");
  // V1 public bands are intentionally simple. Historical percentile scoring
  // will supersede these once COBRA has sufficient retained history.
  if (value < 50) return indicator("energy_condition", 85, "VERY_FAVOURABLE");
  if (value < 80) return indicator("energy_condition", 72, "FAVOURABLE");
  if (value < 130) return indicator("energy_condition", 55, "NEUTRAL");
  if (value < 180) return indicator("energy_condition", 35, "EXPENSIVE");
  return indicator("energy_condition", 18, "VERY_EXPENSIVE");
}

export function gridFlexibility(surplusMw, demandMw) {
  const surplus = finite(surplusMw);
  const demand = finite(demandMw);
  if (surplus === null || demand === null || demand <= 0) return unavailable("grid_flexibility");
  const ratio = surplus / demand;
  if (ratio >= 0.4) return indicator("grid_flexibility", 85, "HIGH", { surplusRatio: ratio });
  if (ratio >= 0.2) return indicator("grid_flexibility", 68, "ELEVATED", { surplusRatio: ratio });
  if (ratio >= 0.08) return indicator("grid_flexibility", 50, "NORMAL", { surplusRatio: ratio });
  return indicator("grid_flexibility", 28, "TIGHT", { surplusRatio: ratio });
}

export function bitcoinNetwork(averageBlockMinutes, fastestFeeSatVb) {
  const blocks = finite(averageBlockMinutes);
  const fees = finite(fastestFeeSatVb);
  if (blocks === null || fees === null) return unavailable("bitcoin_network");
  let score = 60;
  if (blocks > 13) score -= 15;
  else if (blocks < 8) score += 8;
  if (fees > 50) score -= 18;
  else if (fees > 20) score -= 8;
  else if (fees <= 5) score += 8;
  score = clamp(score);
  return indicator("bitcoin_network", score, label(score));
}

export function miningEconomics(grossMarginPct) {
  const margin = finite(grossMarginPct);
  if (margin === null) return unavailable("mining_economics");
  if (margin >= 30) return indicator("mining_economics", 88, "STRONG", { grossMarginPct: margin });
  if (margin >= 10) return indicator("mining_economics", 72, "FAVOURABLE", { grossMarginPct: margin });
  if (margin >= 0) return indicator("mining_economics", 56, "MARGINAL", { grossMarginPct: margin });
  if (margin >= -20) return indicator("mining_economics", 35, "UNFAVOURABLE", { grossMarginPct: margin });
  return indicator("mining_economics", 15, "LOSS_MAKING", { grossMarginPct: margin });
}

export function lowCarbonCompute(carbonIntensity) {
  const value = finite(carbonIntensity);
  if (value === null) return unavailable("low_carbon_compute");
  if (value < 75) return indicator("low_carbon_compute", 90, "STRONG");
  if (value < 125) return indicator("low_carbon_compute", 75, "FAVOURABLE");
  if (value < 200) return indicator("low_carbon_compute", 55, "NEUTRAL");
  if (value < 300) return indicator("low_carbon_compute", 35, "WEAK");
  return indicator("low_carbon_compute", 18, "POOR");
}

export function computeWindow(input = {}) {
  const components = [
    energyCondition(input.marketPricePerMwh),
    gridFlexibility(input.surplusMw, input.demandMw),
    miningEconomics(input.grossMarginPct),
    lowCarbonCompute(input.carbonIntensity),
  ].filter((item) => item.available);
  if (components.length < 3) return unavailable("compute_window");
  const score = Math.round(components.reduce((sum, item) => sum + item.score, 0) / components.length);
  const state = score >= 70 ? "OPEN" : score >= 45 ? "WATCH" : "CLOSED";
  return indicator("compute_window", score, state, { componentCount: components.length });
}

function indicator(code, score, state, details = undefined) {
  return { code, available: true, score: clamp(score), state, ...(details ? { details } : {}) };
}
function unavailable(code) { return { code, available: false, score: null, state: "UNAVAILABLE" }; }
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function clamp(value) { return Math.max(0, Math.min(100, Math.round(value))); }
function label(score) { return score >= 75 ? "STRONG" : score >= 60 ? "FAVOURABLE" : score >= 45 ? "NEUTRAL" : "WEAK"; }
