import test from "node:test";
import assert from "node:assert/strict";

import { COMPUTE_ASSETS, getComputeAsset, validateComputeAsset } from "../lib/compute/assets.js";
import { calculateAssetEconomics, calculateMiningEconomics } from "../lib/mining/economics.js";

test("compute catalogue entries are internally consistent", () => {
  assert.ok(COMPUTE_ASSETS.length >= 4);
  for (const asset of COMPUTE_ASSETS) assert.equal(validateComputeAsset(asset), true, asset.id);
});

test("S21 Pro catalogue values match seeded manufacturer specification", () => {
  const asset = getComputeAsset("bitmain-antminer-s21-pro-234t");
  assert.equal(asset.output, 234);
  assert.equal(asset.ratedPowerW, 3510);
  assert.equal(asset.efficiency, 15);
});

test("mining economics derives electricity and break-even values transparently", () => {
  const result = calculateMiningEconomics({
    hashrateTh: 200,
    powerW: 3500,
    networkHashrateGh: 1_000_000_000_000,
    btcMined24h: 450,
    btcPrice: 80_000,
    electricityPricePerMwh: 100,
    quoteCurrency: "USD",
  });

  assert.equal(result.output.machineKwhDay, 84);
  assert.equal(result.output.electricityCostDay, 8.4);
  assert.ok(result.output.expectedBtcDayGross > 0);
  assert.ok(Number.isFinite(result.output.breakEvenElectricityPerMwh));
});

test("asset economics supports facility overhead, uptime and pool fees", () => {
  const asset = getComputeAsset("bitmain-antminer-s21-xp-270t");
  const result = calculateAssetEconomics(asset, {
    networkHashrateGh: 1_000_000_000_000,
    btcMined24h: 450,
    btcPrice: 80_000,
    electricityPricePerMwh: 75,
    quoteCurrency: "USD",
  }, {
    poolFeePct: 2,
    uptimePct: 95,
    facilityOverheadPct: 8,
  });

  assert.equal(result.assumptions.poolFeePct, 2);
  assert.equal(result.assumptions.uptimePct, 95);
  assert.equal(result.assumptions.facilityOverheadPct, 8);
  assert.ok(result.output.facilityKwhDay > result.output.machineKwhDay);
});

test("economics rejects mixed or incomplete numeric inputs instead of guessing", () => {
  assert.throws(() => calculateMiningEconomics({
    hashrateTh: 200,
    powerW: 3500,
  }), /invalid_networkHashrateGh/);
});
