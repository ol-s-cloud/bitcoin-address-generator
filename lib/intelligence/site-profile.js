export function normalizeSiteProfile(input = {}) {
  const country = String(input.country || "GB").toUpperCase();
  if (country !== "GB") throw new Error("unsupported_country");

  const tariffPenceKwh = boundedNumber(input.tariffPenceKwh ?? input.electricityPenceKwh ?? 7, "tariffPenceKwh", 0, 500);
  const units = integerNumber(input.units ?? 1, "units", 1, 1000000);
  const poolFeePct = boundedNumber(input.poolFeePct ?? 2, "poolFeePct", 0, 100);
  const uptimePct = boundedNumber(input.uptimePct ?? 100, "uptimePct", 0, 100);
  const facilityEnergyOverheadPct = boundedNumber(input.facilityEnergyOverheadPct ?? input.facilityOverheadPct ?? 7, "facilityEnergyOverheadPct", 0, 500);

  return {
    id: String(input.id || "gb-demo-site"),
    name: String(input.name || input.siteName || "UK Test Site"),
    country,
    region: String(input.region || "GB"),
    locality: String(input.locality || ""),
    tariff: {
      pencePerKwh: tariffPenceKwh,
      gbpPerMwh: tariffPenceKwh * 10,
      source: input.tariffSource ? String(input.tariffSource) : "user_supplied",
    },
    fleet: {
      assetId: String(input.assetId || "bitmain-antminer-s21-pro-234t"),
      units,
      poolFeePct,
      uptimePct,
      facilityEnergyOverheadPct,
    },
  };
}

function boundedNumber(value, name, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`invalid_${name}`);
  return number;
}

function integerNumber(value, name, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`invalid_${name}`);
  return number;
}
