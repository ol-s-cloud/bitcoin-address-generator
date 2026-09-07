export const COMPUTE_ASSETS = [
  {
    id: "bitmain-antminer-s21-200t",
    manufacturer: "Bitmain",
    model: "Antminer S21",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 200,
    outputUnit: "TH/s",
    ratedPowerW: 3500,
    efficiency: 17.5,
    efficiencyUnit: "J/TH",
    cooling: "air",
    voltage: "220-277V AC",
    status: "active",
    source: {
      type: "manufacturer",
      provider: "Bitmain",
      url: "https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification",
      checkedAt: "2026-09-07",
    },
  },
  {
    id: "bitmain-antminer-s21-pro-234t",
    manufacturer: "Bitmain",
    model: "Antminer S21 Pro",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 234,
    outputUnit: "TH/s",
    ratedPowerW: 3510,
    efficiency: 15,
    efficiencyUnit: "J/TH",
    cooling: "air",
    voltage: "220-277V AC",
    status: "active",
    source: {
      type: "manufacturer",
      provider: "Bitmain",
      url: "https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification",
      checkedAt: "2026-09-07",
    },
  },
  {
    id: "bitmain-antminer-s21-xp-270t",
    manufacturer: "Bitmain",
    model: "Antminer S21 XP",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 270,
    outputUnit: "TH/s",
    ratedPowerW: 3645,
    efficiency: 13.5,
    efficiencyUnit: "J/TH",
    cooling: "air",
    voltage: "220-277V AC",
    status: "active",
    source: {
      type: "manufacturer",
      provider: "Bitmain",
      url: "https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications",
      checkedAt: "2026-09-07",
    },
  },
  {
    id: "bitmain-antminer-s21-xp-hyd-473t",
    manufacturer: "Bitmain",
    model: "Antminer S21 XP Hyd",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 473,
    outputUnit: "TH/s",
    ratedPowerW: 5676,
    efficiency: 12,
    efficiencyUnit: "J/TH",
    cooling: "hydro",
    voltage: "380-415V AC",
    status: "active",
    source: {
      type: "manufacturer",
      provider: "Bitmain",
      url: "https://support.bitmain.com/hc/en-us/articles/34523540504857-S21-XP-Hyd-Specification",
      checkedAt: "2026-09-07",
    },
  },
];

export function getComputeAsset(id) {
  return COMPUTE_ASSETS.find((asset) => asset.id === id) ?? null;
}

export function listComputeAssets(filters = {}) {
  return COMPUTE_ASSETS.filter((asset) => {
    if (filters.category && asset.category !== filters.category) return false;
    if (filters.manufacturer && asset.manufacturer.toLowerCase() !== String(filters.manufacturer).toLowerCase()) return false;
    if (filters.cooling && asset.cooling !== filters.cooling) return false;
    return true;
  });
}

export function validateComputeAsset(asset) {
  if (!asset?.id || !asset?.manufacturer || !asset?.model) return false;
  if (!Number.isFinite(asset.output) || asset.output <= 0) return false;
  if (!Number.isFinite(asset.ratedPowerW) || asset.ratedPowerW <= 0) return false;
  if (!Number.isFinite(asset.efficiency) || asset.efficiency <= 0) return false;
  return Math.abs(asset.ratedPowerW / asset.output - asset.efficiency) < 0.2;
}
