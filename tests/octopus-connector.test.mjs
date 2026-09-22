import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOctopusAccount } from "../server/connectors/octopus.js";

test("normalizes Octopus electricity and gas meters without exposing credentials", () => {
  const normalized = normalizeOctopusAccount({
    number: "A-1234ABCD",
    properties: [
      {
        id: 101,
        postcode: "G1 1AA",
        address_line_1: "1 Example Street",
        town: "Glasgow",
        electricity_meter_points: [
          {
            mpan: "1234567890123",
            is_export: false,
            meters: [{ serial_number: "ELECTRIC123" }],
            agreements: [
              {
                tariff_code: "E-1R-AGILE-FLEX-24-10-01-A",
                valid_from: "2026-01-01T00:00:00Z",
                valid_to: null,
              },
            ],
          },
        ],
        gas_meter_points: [
          {
            mprn: "9876543210",
            meters: [{ serial_number: "GAS123456" }],
            agreements: [
              {
                tariff_code: "G-1R-VAR-24-01-01-A",
                valid_from: "2026-01-01T00:00:00Z",
                valid_to: null,
              },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(normalized.provider, "Octopus Energy");
  assert.equal(normalized.accountNumber, "A-1234ABCD");
  assert.equal(normalized.properties.length, 1);
  assert.equal(normalized.properties[0].postcode, "G1 1AA");
  assert.equal(normalized.meters.length, 2);
  assert.deepEqual(
    normalized.meters.map(({ fuel, direction }) => ({ fuel, direction })),
    [
      { fuel: "electricity", direction: "import" },
      { fuel: "gas", direction: "import" },
    ],
  );
  assert.equal(normalized.tariffs.length, 2);
  assert.equal(normalized.tariffs[0].fuel, "electricity");
  assert.equal(normalized.tariffs[1].fuel, "gas");
  assert.ok(normalized.meters[0].meterPointMasked.endsWith("0123"));
  assert.ok(normalized.meters[0].meterSerialMasked.endsWith("C123"));
});

test("marks Octopus export MPANs as export meters", () => {
  const normalized = normalizeOctopusAccount({
    number: "A-EXPORT01",
    properties: [
      {
        electricity_meter_points: [
          {
            mpan: "1111222233334",
            is_export: true,
            meters: [{ serial_number: "EXPORTSERIAL" }],
            agreements: [],
          },
        ],
        gas_meter_points: [],
      },
    ],
  });

  assert.equal(normalized.meters.length, 1);
  assert.equal(normalized.meters[0].direction, "export");
});

test("ignores agreements without tariff codes", () => {
  const normalized = normalizeOctopusAccount({
    number: "A-EMPTY001",
    properties: [
      {
        electricity_meter_points: [
          {
            mpan: "1234",
            meters: [],
            agreements: [{ valid_from: "2026-01-01T00:00:00Z" }],
          },
        ],
        gas_meter_points: [],
      },
    ],
  });

  assert.deepEqual(normalized.tariffs, []);
});
