import test from "node:test";
import assert from "node:assert/strict";
import { derivePublicIndicators, derivePublicIndicatorsFromMetrics, energyCondition, gridFlexibility, miningEconomics, lowCarbonCompute } from "../lib/indicators/public.js";

test("energy condition uses transparent V1 bands", () => {
  assert.equal(energyCondition(45).state, "VERY_FAVOURABLE");
  assert.equal(energyCondition(140).state, "EXPENSIVE");
});

test("grid flexibility derives surplus ratio", () => {
  const result = gridFlexibility(10000, 20000);
  assert.equal(result.state, "HIGH");
  assert.equal(result.details.surplusRatio, 0.5);
});

test("mining economics distinguishes positive and negative margin", () => {
  assert.equal(miningEconomics(22).state, "FAVOURABLE");
  assert.equal(miningEconomics(-25).state, "LOSS_MAKING");
});

test("low carbon compute classifies low intensity", () => {
  assert.equal(lowCarbonCompute(46).state, "STRONG");
});

test("compute window requires enough component evidence", () => {
  const indicators = derivePublicIndicators({ marketPricePerMwh: 55, surplusMw: 10000, demandMw: 22000, gridFlexibilityComparable: true, grossMarginPct: 20, carbonIntensity: 50, averageBlockMinutes: 9, fastestFeeSatVb: 2 });
  assert.equal(indicators.computeWindow.available, true);
  assert.equal(indicators.computeWindow.state, "OPEN");
});

test("missing MID value never becomes a zero-price mining signal", () => {
  const result = derivePublicIndicatorsFromMetrics({
    market_index_price: { value: null },
    forecast_surplus: { value: 10000 },
    transmission_system_demand: { value: 22000 },
    carbon_intensity: { value: 150 },
    bitcoin_network_state: { priceGbp: 65000, hashRateGh: 900000000000, btcMined24h: 450, averageBlockMinutes: 10, fastestFeeSatVb: 2 },
  });
  assert.equal(result.inputs.marketPricePerMwh, null);
  assert.equal(result.indicators.energyCondition.available, false);
  assert.equal(result.indicators.miningEconomics.available, false);
  assert.equal(result.indicators.computeWindow.available, false);
});

test("forward surplus is not mixed with current demand", () => {
  const result = derivePublicIndicatorsFromMetrics({
    market_index_price: { value: 80 },
    forecast_surplus: { value: 12000 },
    transmission_system_demand: { value: 28000 },
    carbon_intensity: { value: 150 },
    bitcoin_network_state: { averageBlockMinutes: 10, fastestFeeSatVb: 2 },
  }, { grossMarginPct: 5 });
  assert.equal(result.indicators.gridFlexibility.available, false);
  assert.equal(result.indicators.gridFlexibility.state, "UNAVAILABLE");
  assert.equal(result.indicators.computeWindow.details.componentCount, 3);
});
