import test from "node:test";
import assert from "node:assert/strict";
import { answerAskCobra } from "../lib/ask-cobra/engine.js";
import { derivePublicIndicatorsFromMetrics } from "../lib/indicators/public.js";

const indicators = derivePublicIndicatorsFromMetrics({
  market_index_price: { code: "market_index_price", value: 55 },
  forecast_surplus: { code: "forecast_surplus", value: 10000 },
  transmission_system_demand: { code: "transmission_system_demand", value: 22000 },
  carbon_intensity: { code: "carbon_intensity", value: 50 },
  bitcoin_network_state: {
    code: "bitcoin_network_state",
    averageBlockMinutes: 9,
    fastestFeeSatVb: 2,
  },
});

test("Ask COBRA answers energy questions from indicator state", () => {
  const result = answerAskCobra("Is electricity favourable right now?", { indicators });
  assert.equal(result.status, "answered");
  assert.equal(result.topic, "energy");
  assert.match(result.answer, /favourable/);
});

test("Ask COBRA answers compute-window questions", () => {
  const result = answerAskCobra("Is this a good compute window?", { indicators });
  assert.equal(result.topic, "compute");
  assert.equal(result.indicator.state, "OPEN");
});

test("Ask COBRA refuses to fabricate mining profitability without site economics", () => {
  const result = answerAskCobra("Would an S21 Pro be profitable right now?", { indicators });
  assert.equal(result.status, "limited");
  assert.equal(result.topic, "mining");
  assert.deepEqual(result.requires, ["device", "site_tariff", "same_currency_btc_price"]);
});
