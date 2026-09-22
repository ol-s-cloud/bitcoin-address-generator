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
    source: { type: "manufacturer", provider: "Bitmain", url: "https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification", checkedAt: "2026-09-07" },
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
    source: { type: "manufacturer", provider: "Bitmain", url: "https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification", checkedAt: "2026-09-07" },
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
    source: { type: "manufacturer", provider: "Bitmain", url: "https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications", checkedAt: "2026-09-07" },
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
    source: { type: "manufacturer", provider: "Bitmain", url: "https://support.bitmain.com/hc/en-us/articles/34523540504857-S21-XP-Hyd-Specification", checkedAt: "2026-09-07" },
  },
  {
    id: "bitmain-antminer-s23-hyd-580t",
    manufacturer: "Bitmain",
    model: "Antminer S23 Hyd",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 580,
    outputUnit: "TH/s",
    ratedPowerW: 5510,
    efficiency: 9.5,
    efficiencyUnit: "J/TH",
    cooling: "hydro",
    voltage: "380-415V AC",
    status: "active",
    source: { type: "manufacturer", provider: "Bitmain", url: "https://www.bitmain.com/en/", checkedAt: "2026-09-09" },
  },
  {
    id: "bitmain-u3s23h-1160t",
    manufacturer: "Bitmain",
    model: "U3S23H",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 1160,
    outputUnit: "TH/s",
    ratedPowerW: 11020,
    efficiency: 9.5,
    efficiencyUnit: "J/TH",
    cooling: "hydro",
    voltage: "industrial",
    status: "active",
    source: { type: "manufacturer", provider: "Bitmain", url: "https://www.bitmain.com/en/", checkedAt: "2026-09-09" },
  },
  {
    id: "canaan-avalon-a16xp-300t",
    manufacturer: "Canaan",
    model: "Avalon A16XP",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 300,
    outputUnit: "TH/s",
    ratedPowerW: 3850,
    efficiency: 12.8,
    efficiencyUnit: "J/TH",
    cooling: "air",
    voltage: "manufacturer-defined",
    status: "active",
    source: { type: "manufacturer", provider: "Canaan", url: "https://shop.canaan.io/products/avalon-miner-a16xp-300t", checkedAt: "2026-09-09" },
  },
  {
    id: "canaan-avalon-a16-282t",
    manufacturer: "Canaan",
    model: "Avalon A16",
    category: "bitcoin-asic",
    algorithm: "SHA-256",
    output: 282,
    outputUnit: "TH/s",
    ratedPowerW: 3900,
    efficiency: 13.8,
    efficiencyUnit: "J/TH",
    cooling: "air",
    voltage: "manufacturer-defined",
    status: "active",
    source: { type: "manufacturer", provider: "Canaan", url: "https://shop.canaan.io/products?categories=mining-machine", checkedAt: "2026-09-09" },
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
