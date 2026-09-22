import test from "node:test";
import assert from "node:assert/strict";
import { derivePublicIndicators, energyCondition, gridFlexibility, miningEconomics, lowCarbonCompute } from "../lib/indicators/public.js";

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
  const indicators = derivePublicIndicators({ marketPricePerMwh: 55, surplusMw: 10000, demandMw: 22000, grossMarginPct: 20, carbonIntensity: 50, averageBlockMinutes: 9, fastestFeeSatVb: 2 });
  assert.equal(indicators.computeWindow.available, true);
  assert.equal(indicators.computeWindow.state, "OPEN");
});
