(() => {
  const $ = (id) => document.getElementById(id);
  const number = (id) => Number($(id)?.value);
  const fmt = (value, digits = 0) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—";
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  async function runSolar(event) {
    event?.preventDefault();
    const status = $("solarStatus");
    const button = $("solarRun");
    const lat = number("solarLat");
    const lon = number("solarLon");
    const peakPowerKw = number("solarCapacity");
    const lossPct = number("solarLoss");
    const mounting = $("solarMounting")?.value || "free";
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180 || !Number.isFinite(peakPowerKw) || peakPowerKw <= 0 || !Number.isFinite(lossPct)) {
      status.textContent = "Enter a valid latitude, longitude, system capacity and system loss.";
      return;
    }
    button.disabled = true;
    status.textContent = "Calculating solar yield…";
    try {
      const params = new URLSearchParams({ mode: "solar", lat: String(lat), lon: String(lon), peakPowerKw: String(peakPowerKw), lossPct: String(lossPct), mounting });
      const response = await fetch(`/api/v1/intelligence?${params.toString()}`, { headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "solar_calculation_failed");
      const out = data.outputs || {};
      $("solarAnnual").textContent = `${fmt(out.annualEnergyKwh, 0)} kWh`;
      $("solarDaily").textContent = `${fmt(out.averageDailyEnergyKwh, 1)} kWh`;
      $("solarYield").textContent = `${fmt(out.specificYieldKwhKwp, 0)} kWh/kWp`;
      $("solarCf").textContent = `${fmt(out.capacityFactorPct, 1)}%`;
      $("solarIrradiation").textContent = `${fmt(out.annualPlaneIrradiationKwhM2, 0)} kWh/m²`;
      $("solarAngle").textContent = `${fmt(out.optimalSlopeDeg, 1)}°`;
      renderMonthly(out.monthly || []);
      const source = data.source || {};
      $("solarAttribution").innerHTML = `<div><strong>Data & model:</strong> ${escapeHtml(source.provider || "European Commission Joint Research Centre")} · ${escapeHtml(source.model || "PVGIS")}</div><div>${escapeHtml(source.radiationDatabase || "PVGIS radiation data")}${source.yearMin && source.yearMax ? ` · ${source.yearMin}–${source.yearMax}` : ""}</div>`;
      status.textContent = `Calculated for ${lat.toFixed(4)}, ${lon.toFixed(4)} using provider data returned through COBRA.`;
    } catch (error) {
      status.textContent = "Solar calculation is temporarily unavailable. Check the inputs and try again.";
    } finally {
      button.disabled = false;
    }
  }

  function renderMonthly(rows) {
    const root = $("solarMonthly");
    const labels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
    const values = rows.map((row) => Number(row.energyKwh) || 0);
    const max = Math.max(...values, 1);
    root.innerHTML = values.map((value, index) => `<div class="month-bar" title="${labels[index]}: ${fmt(value, 0)} kWh"><i style="height:${Math.max(2, (value / max) * 100)}%"></i><span>${labels[index]}</span></div>`).join("");
  }

  function runHydrogen(event) {
    event?.preventDefault();
    const outputMw = number("h2OutputMw");
    const hours = number("h2Hours");
    const efficiency = number("h2Efficiency") / 100;
    const h2VolFraction = clamp(number("h2Blend") / 100, 0, 1);
    const baselineIntensity = number("h2BaselineIntensity");
    const carbonPrice = number("h2CarbonPrice");
    const electrolyserKwhKg = number("h2Electrolyser");
    const status = $("h2Status");
    if (![outputMw, hours, efficiency, baselineIntensity, carbonPrice, electrolyserKwhKg].every(Number.isFinite) || outputMw <= 0 || hours <= 0 || hours > 8760 || efficiency <= 0 || efficiency > 1 || baselineIntensity < 0 || carbonPrice < 0 || electrolyserKwhKg <= 0) {
      status.textContent = "Enter valid plant output, operating hours, efficiency, emissions intensity and cost assumptions.";
      return;
    }

    const methaneMolarLhvMj = 0.8023;
    const hydrogenMolarLhvMj = 0.2418;
    const h2EnergyFraction = (h2VolFraction * hydrogenMolarLhvMj) / ((h2VolFraction * hydrogenMolarLhvMj) + ((1 - h2VolFraction) * methaneMolarLhvMj || 0));
    const electricalKwh = outputMw * 1000 * hours;
    const fuelKwh = electricalKwh / efficiency;
    const h2ThermalKwh = fuelKwh * h2EnergyFraction;
    const gasThermalKwh = fuelKwh * (1 - h2EnergyFraction);
    const h2Kg = h2ThermalKwh / 33.33;
    const gasKg = gasThermalKwh / 13.9;
    const baselineCo2Tonnes = electricalKwh * baselineIntensity / 1e6;
    const avoidedCo2Tonnes = baselineCo2Tonnes * h2EnergyFraction;
    const resultingIntensity = baselineIntensity * (1 - h2EnergyFraction);
    const carbonValue = avoidedCo2Tonnes * carbonPrice;
    const electrolysisMwh = h2Kg * electrolyserKwhKg / 1000;
    const waterM3 = h2Kg * 9 / 1000;

    $("h2EnergyShare").textContent = `${fmt(h2EnergyFraction * 100, 1)}%`;
    $("h2Reduction").textContent = `${fmt(avoidedCo2Tonnes, 0)} tCO₂`;
    $("h2Intensity").textContent = `${fmt(resultingIntensity, 0)} g/kWh`;
    $("h2Hydrogen").textContent = `${fmt(h2Kg / 1000, 1)} t H₂`;
    $("h2Gas").textContent = `${fmt(gasKg / 1000, 1)} t gas`;
    $("h2Power").textContent = `${fmt(electrolysisMwh, 0)} MWh`;
    $("h2Water").textContent = `${fmt(waterM3, 0)} m³`;
    $("h2CarbonValue").textContent = `£${fmt(carbonValue, 0)}`;
    $("h2Attribution").innerHTML = `<div><strong>Reference structure:</strong> Siemens Energy · Hydrogen Decarbonization Calculator</div><div>COBRA calculation using the site assumptions entered above.</div>`;
    status.textContent = `At ${fmt(h2VolFraction * 100, 0)}% hydrogen by volume, hydrogen supplies about ${fmt(h2EnergyFraction * 100, 1)}% of fuel energy under the stated assumptions.`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[c]);
  }

  $("solarForm")?.addEventListener("submit", runSolar);
  $("h2Form")?.addEventListener("submit", runHydrogen);
  runHydrogen();
})();
