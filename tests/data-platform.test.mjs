import test from "node:test";
import assert from "node:assert/strict";

import {
  getElexonDemand,
  getElexonMarketPrice,
  normalizeDemandRow,
  normalizeMarketPriceRow,
  volumeWeightedPrice,
} from "../lib/data/connectors/elexon.js";
import { DATA_SOURCES } from "../lib/data/sources.js";

test("normalizes Elexon market price rows", () => {
  assert.deepEqual(
    normalizeMarketPriceRow({
      startTime: "2099-01-01T00:00:00Z",
      dataProvider: "N2EXMIDP",
      settlementDate: "2099-01-01",
      settlementPeriod: 1,
      price: 40,
      volume: 100,
    }),
    {
      observedAt: "2099-01-01T00:00:00.000Z",
      dataProvider: "N2EXMIDP",
      settlementDate: "2099-01-01",
      settlementPeriod: 1,
      price: 40,
      volume: 100,
    },
  );
});

test("calculates volume weighted market price", () => {
  const price = volumeWeightedPrice([
    { price: 40, volume: 100 },
    { price: 60, volume: 300 },
  ]);
  assert.equal(price, 55);
});

test("market price connector emits normalized COBRA metric", async () => {
  const result = await getElexonMarketPrice({
    now: new Date("2099-01-01T02:00:00Z"),
    fetcher: async () => ({
      latencyMs: 12,
      fetchedAt: "2099-01-01T02:00:01.000Z",
      data: {
        data: [
          { startTime: "2099-01-01T01:30:00Z", dataProvider: "N2EXMIDP", settlementDate: "2099-01-01", settlementPeriod: 4, price: 45, volume: 100 },
          { startTime: "2099-01-01T01:30:00Z", dataProvider: "APXMIDP", settlementDate: "2099-01-01", settlementPeriod: 4, price: 55, volume: 100 },
        ],
      },
    }),
  });

  assert.equal(result.health.status, "operational");
  assert.equal(result.metric.code, "market_index_price");
  assert.equal(result.metric.unit, "GBP/MWh");
  assert.equal(result.metric.value, 50);
  assert.equal(result.metric.providers.length, 2);
});

test("normalizes and emits Elexon demand", async () => {
  assert.equal(
    normalizeDemandRow({ startTime: "2099-01-01T01:30:00Z", demand: 25000 })?.value,
    25000,
  );

  const result = await getElexonDemand({
    now: new Date("2099-01-01T02:00:00Z"),
    fetcher: async () => ({
      latencyMs: 8,
      fetchedAt: "2099-01-01T02:00:01.000Z",
      data: {
        data: [
          { startTime: "2099-01-01T01:15:00Z", settlementDate: "2099-01-01", settlementPeriod: 3, demand: 24500 },
          { startTime: "2099-01-01T01:30:00Z", settlementDate: "2099-01-01", settlementPeriod: 4, demand: 25000 },
        ],
      },
    }),
  });

  assert.equal(result.health.status, "operational");
  assert.equal(result.metric.code, "transmission_system_demand");
  assert.equal(result.metric.value, 25000);
  assert.equal(result.metric.unit, "MW");
});

test("source registry distinguishes public and credentialled feeds", () => {
  assert.equal(DATA_SOURCES.find((source) => source.id === "elexon-mid")?.credentialsRequired, false);
  assert.equal(DATA_SOURCES.find((source) => source.id === "entsoe")?.credentialsRequired, true);
  assert.equal(DATA_SOURCES.find((source) => source.id === "fingrid")?.credentialsRequired, true);
});
