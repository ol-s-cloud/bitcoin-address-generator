(() => {
  const panel = document.getElementById("gridState");
  if (!panel) return;

  loadGrid();

  async function loadGrid() {
    try {
      const params = new URLSearchParams({ mode: "home_grid" });
      const response = await fetch(`/api/registry?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) return;
      if (!response.ok) throw new Error("grid_context_unavailable");
      const payload = await response.json();
      renderGrid(payload.grid, payload.note);
    } catch {
      panel.innerHTML = `<strong>Grid context unavailable.</strong><span>Household tariff and meter analysis remain available.</span>`;
    }
  }

  function renderGrid(grid, note) {
    if (!grid || grid.status !== "operational") {
      panel.innerHTML = `<strong>Grid context unavailable.</strong><span>${escapeHtml(note || "Household decisions remain anchored to your own tariff and meter data.")}</span>`;
      return;
    }

    const intensity = grid.actualGco2PerKwh ?? grid.forecastGco2PerKwh;
    const mix = Array.isArray(grid.generationMix) ? grid.generationMix : [];
    const topMix = mix
      .filter((item) => Number.isFinite(Number(item.percentage)))
      .sort((a, b) => Number(b.percentage) - Number(a.percentage))
      .slice(0, 4)
      .map((item) => `${humanize(item.fuel)} ${formatNumber(item.percentage, 1)}%`)
      .join(" · ");

    panel.innerHTML = "";
    append("Region", grid.region || grid.dnoRegion || "Great Britain");
    append("Carbon intensity", intensity == null ? "—" : `${formatNumber(intensity, 0)} gCO₂/kWh`);
    append("Grid condition", grid.index ? humanize(grid.index) : "—");
    if (topMix) append("Generation mix", topMix);
    append("Data window", [formatDateTime(grid.validFrom), formatDateTime(grid.validTo)].filter(Boolean).join(" → ") || "Current");
    append("Source", grid.source?.provider || "National Energy System Operator");

    const noteNode = document.createElement("small");
    noteNode.className = "home-form-note";
    noteNode.textContent = note || "Grid carbon context is not the household retail electricity price.";
    panel.appendChild(noteNode);
  }

  function append(label, value) {
    const row = document.createElement("div");
    row.className = "home-state-line";
    const key = document.createElement("span");
    key.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    row.append(key, strong);
    panel.appendChild(row);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function formatNumber(value, digits) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("en-GB", { maximumFractionDigits: digits }) : "—";
  }

  function humanize(value) {
    return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }
})();
