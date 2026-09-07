export function calculateMiningEconomics(input) {
  const hashrateTh = positiveNumber(input?.hashrateTh, "hashrateTh");
  const powerW = positiveNumber(input?.powerW, "powerW");
  const networkHashrateGh = positiveNumber(input?.networkHashrateGh, "networkHashrateGh");
  const btcMined24h = nonNegativeNumber(input?.btcMined24h, "btcMined24h");
  const btcPrice = nonNegativeNumber(input?.btcPrice, "btcPrice");
  const electricityPricePerMwh = nonNegativeNumber(input?.electricityPricePerMwh, "electricityPricePerMwh");
  const poolFeePct = optionalNonNegative(input?.poolFeePct, 0);
  const uptimePct = optionalBounded(input?.uptimePct, 100, 0, 100);
  const facilityOverheadPct = optionalNonNegative(input?.facilityOverheadPct, 0);

  const minerHashrateGh = hashrateTh * 1000;
  const networkShare = minerHashrateGh / networkHashrateGh;
  const uptimeFactor = uptimePct / 100;
  const expectedBtcDayGross = networkShare * btcMined24h * uptimeFactor;
  const expectedBtcDayNet = expectedBtcDayGross * (1 - poolFeePct / 100);
  const revenueDay = expectedBtcDayNet * btcPrice;

  const machineKwhDay = (powerW / 1000) * 24 * uptimeFactor;
  const facilityKwhDay = machineKwhDay * (1 + facilityOverheadPct / 100);
  const electricityPricePerKwh = electricityPricePerMwh / 1000;
  const electricityCostDay = facilityKwhDay * electricityPricePerKwh;
  const grossMarginDay = revenueDay - electricityCostDay;
  const grossMarginPct = revenueDay > 0 ? (grossMarginDay / revenueDay) * 100 : null;
  const breakEvenElectricityPerMwh = facilityKwhDay > 0 ? (revenueDay / facilityKwhDay) * 1000 : null;

  return {
    quoteCurrency: String(input?.quoteCurrency || "QUOTE"),
    assumptions: {
      hashrateTh,
      powerW,
      networkHashrateGh,
      btcMined24h,
      btcPrice,
      electricityPricePerMwh,
      poolFeePct,
      uptimePct,
      facilityOverheadPct,
    },
    output: {
      networkShare,
      expectedBtcDayGross,
      expectedBtcDayNet,
      revenueDay,
      machineKwhDay,
      facilityKwhDay,
      electricityCostDay,
      grossMarginDay,
      grossMarginPct,
      breakEvenElectricityPerMwh,
      profitable: grossMarginDay > 0,
    },
  };
}

export function calculateAssetEconomics(asset, market, options = {}) {
  if (!asset) throw new Error("asset_required");
  return calculateMiningEconomics({
    hashrateTh: asset.output,
    powerW: asset.ratedPowerW,
    networkHashrateGh: market?.networkHashrateGh,
    btcMined24h: market?.btcMined24h,
    btcPrice: market?.btcPrice,
    electricityPricePerMwh: market?.electricityPricePerMwh,
    quoteCurrency: market?.quoteCurrency,
    poolFeePct: options.poolFeePct,
    uptimePct: options.uptimePct,
    facilityOverheadPct: options.facilityOverheadPct,
  });
}

function positiveNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`invalid_${name}`);
  return number;
}

function nonNegativeNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`invalid_${name}`);
  return number;
}

function optionalNonNegative(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return nonNegativeNumber(value, "optional_value");
}

function optionalBounded(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error("invalid_bounded_value");
  return number;
}
