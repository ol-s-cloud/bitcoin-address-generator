import assert from "node:assert/strict";
import test from "node:test";

import bitcoinHandler from "../api/bitcoin.js";
import { isMainnetP2pkhAddress } from "../server/bitcoin-address.js";
import { requestIsSameOrigin } from "../server/http.js";

test("validates mainnet P2PKH addresses with Base58Check", () => {
  const genesisAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  assert.equal(isMainnetP2pkhAddress(genesisAddress), true);
  assert.equal(
    isMainnetP2pkhAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb"),
    false,
  );
  assert.equal(isMainnetP2pkhAddress("bc1qexample"), false);
});

test("accepts only matching browser origins when Origin is present", () => {
  assert.equal(
    requestIsSameOrigin({
      headers: {
        origin: "https://www.cobra-protocol.org",
        host: "www.cobra-protocol.org",
      },
    }),
    true,
  );
  assert.equal(
    requestIsSameOrigin({
      headers: {
        origin: "https://example.com",
        host: "www.cobra-protocol.org",
      },
    }),
    false,
  );
});

test("normalizes live Bitcoin market, mining, block and mempool data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const text = String(url);
    let payload;
    if (text.includes("/stats")) {
      payload = {
        market_price_usd: 60_000,
        totalbc: 1_970_000_000_000_000,
        timestamp: 1_700_000_000,
        n_blocks_total: 840_000,
        n_tx: 450_000,
        hash_rate: 700_000_000_000,
        minutes_between_blocks: 9.8,
        difficulty: 80_000_000_000_000,
        n_btc_mined: 45_000_000_000,
        estimated_transaction_volume_usd: 4_000_000_000,
      };
    } else if (text.includes("timespan=1day")) {
      payload = {
        values: [
          { x: 1, y: 59_000 },
          { x: 2, y: 61_000 },
        ],
      };
    } else if (text.includes("market-price")) {
      payload = {
        values: [
          { x: 1, y: 58_000 },
          { x: 2, y: 60_000 },
        ],
      };
    } else if (text.includes("n-transactions")) {
      payload = {
        values: [
          { x: 1, y: 400_000 },
          { x: 2, y: 450_000 },
        ],
      };
    } else if (text.includes("hash-rate")) {
      payload = {
        values: [
          { x: 1, y: 690_000_000_000 },
          { x: 2, y: 700_000_000_000 },
        ],
      };
    } else if (text.includes("estimated-transaction-volume-usd")) {
      payload = {
        values: [
          { x: 1, y: 3e9 },
          { x: 2, y: 4e9 },
        ],
      };
    } else if (text.endsWith("/blocks")) {
      payload = [
        {
          id: "abc",
          height: 840_000,
          timestamp: 1_700_000_000,
          tx_count: 3000,
          size: 1_500_000,
          weight: 3_900_000,
          extras: { pool: { name: "Example Pool" } },
        },
      ];
    } else if (text.endsWith("/mempool/recent")) {
      payload = [{ txid: "def", fee: 1000, vsize: 200, value: 50_000 }];
    } else if (text.endsWith("/mempool")) {
      payload = { count: 25_000, vsize: 50_000_000 };
    } else {
      payload = { fastestFee: 12 };
    }
    return { ok: true, json: async () => payload };
  };

  let status;
  let body;
  const response = {
    setHeader() {},
    status(value) {
      status = value;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };

  try {
    await bitcoinHandler({ method: "GET" }, response);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(status, 200);
  assert.equal(body.market.high24hUsd, 61_000);
  assert.equal(body.market.low24hUsd, 59_000);
  assert.equal(body.network.blockRewardBtc, 3.125);
  assert.equal(body.network.algorithm, "SHA-256");
  assert.equal(body.latestBlocks[0].pool, "Example Pool");
  assert.equal(body.latestTransactions[0].feeSats, 1000);
});
