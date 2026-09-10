(() => {
  const email = document.getElementById("homeUserEmail");
  const title = document.getElementById("homeTitle");
  const signOut = document.getElementById("signOutButton");

  loadHome();

  if (signOut) {
    signOut.addEventListener("click", async () => {
      signOut.disabled = true;
      try {
        await fetch("/api/registry", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "account_logout" }),
        });
      } finally {
        location.assign("/home-auth.html");
      }
    });
  }

  async function loadHome() {
    try {
      const response = await fetch("/api/registry?mode=home_snapshot", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) {
        location.replace("/home-auth.html");
        return;
      }
      if (!response.ok) throw new Error("home_snapshot_unavailable");
      const data = await response.json();
      renderIdentity(data);
      renderSummary(data);
      renderEnergyAccount(data);
      renderDevices(data);
      renderAssets(data);
      renderTwin(data);
      renderOpportunities(data);
    } catch {
      setText("energyAccountNote", "Home data could not be loaded");
      setText("smartMeterNote", "Try refreshing the page");
    }
  }

  function renderIdentity(data) {
    const site = data.site;
    if (email) email.textContent = data.user?.email || "COBRA account";
    if (title && site?.name) title.textContent = site.name;
    const hero = document.querySelector(".home-app-hero > p");
    const locationText = [site?.postcode, site?.country_code].filter(Boolean).join(" · ");
    if (hero && locationText) {
      hero.textContent = `${locationText} · Household energy account, meters, bills, tariffs, appliances and generation assets in one site profile.`;
    }
  }

  function renderSummary(data) {
    const summary = data.summary || {};
    const account = (data.energyAccounts || []).find((entry) => entry.is_primary) || data.energyAccounts?.[0];
    const latestBill = summary.latestBill;

    setText("energyAccountValue", account?.supplier || "—");
    setText("energyAccountNote", account ? connectionLabel(account.connection_status) : "No supplier connected");

    setText("smartMeterValue", summary.smartMeterConnected ? "Connected" : "—");
    setText(
      "smartMeterNote",
      summary.intervalCount
        ? `${Number(summary.intervalCount).toLocaleString()} interval readings · latest ${formatDateTime(summary.latestIntervalAt)}`
        : "No meter data connected",
    );

    const importKwh = Number(summary.electricityImportKwhMonth || 0);
    setText("monthUsageValue", summary.intervalCount ? `${formatNumber(importKwh, 1)} kWh` : "—");
    setText(
      "monthUsageNote",
      latestBill?.total_amount != null
        ? `Latest bill ${formatCurrency(latestBill.total_amount, latestBill.currency || "GBP")}`
        : summary.intervalCount
          ? "Electricity import this calendar month"
          : "Connect usage to establish a baseline",
    );

    const opportunityCount = Number(summary.openOpportunityCount || 0);
    setText("opportunityValue", opportunityCount ? String(opportunityCount) : "—");
    setText("opportunityNote", opportunityCount ? "Open quantified opportunities" : "No quantified opportunities yet");
  }

  function renderEnergyAccount(data) {
    const state = document.getElementById("energyAccountState");
    if (!state) return;
    const accounts = data.energyAccounts || [];
    if (!accounts.length) return;

    const account = accounts.find((entry) => entry.is_primary) || accounts[0];
    const tariff = (data.tariffs || []).find((entry) => entry.energy_account_id === account.id) || data.tariffs?.[0];
    const meterCount = (data.meters || []).length;
    const billCount = (data.bills || []).length;
    state.innerHTML = "";
    appendLine(state, account.supplier || "Energy supplier", connectionLabel(account.connection_status));
    appendLine(state, "Meters", meterCount ? `${meterCount} registered` : "None registered");
    appendLine(state, "Tariff", tariff?.tariff_name || tariff?.product_code || "Not available");
    appendLine(state, "Bills", billCount ? `${billCount} stored` : "No bills stored");
  }

  function renderDevices(data) {
    const state = document.getElementById("deviceState");
    const appliances = data.appliances || [];
    if (!state || !appliances.length) return;
    state.innerHTML = "";
    appendLine(state, `${appliances.length} appliance${appliances.length === 1 ? "" : "s"}`, "registered");
    appliances.slice(0, 5).forEach((item) => {
      const label = [item.manufacturer, item.model].filter(Boolean).join(" ") || item.name || item.category;
      appendLine(state, label, item.flexible ? "Flexible load" : item.category);
    });
  }

  function renderAssets(data) {
    const state = document.getElementById("assetState");
    const assets = data.assets || [];
    if (!state || !assets.length) return;
    state.innerHTML = "";
    appendLine(state, `${assets.length} energy asset${assets.length === 1 ? "" : "s"}`, "registered");
    assets.slice(0, 5).forEach((item) => {
      const label = [item.manufacturer, item.model].filter(Boolean).join(" ") || item.name || humanize(item.asset_type);
      const capacity = item.capacity_kw != null ? `${formatNumber(item.capacity_kw, 1)} kW` : humanize(item.asset_type);
      appendLine(state, label, capacity);
    });
  }

  function renderTwin(data) {
    const state = document.getElementById("twinState");
    if (!state) return;
    const summary = data.summary || {};
    const hasInputs = Number(summary.intervalCount || 0) > 0 || Number(summary.applianceCount || 0) > 0 || Number(summary.assetCount || 0) > 0;
    if (!hasInputs) return;
    state.innerHTML = "";
    appendLine(state, "Site model inputs", `${Number(summary.intervalCount || 0).toLocaleString()} intervals`);
    appendLine(state, "Appliances", String(summary.applianceCount || 0));
    appendLine(state, "Energy assets", String(summary.assetCount || 0));
  }

  function renderOpportunities(data) {
    const state = document.getElementById("optimiseState");
    const opportunities = data.opportunities || [];
    if (!state || !opportunities.length) return;
    state.innerHTML = "";
    opportunities.slice(0, 5).forEach((item) => {
      const value = item.annual_value_gbp != null ? `${formatCurrency(item.annual_value_gbp, "GBP")}/yr` : humanize(item.opportunity_type);
      appendLine(state, item.title, value);
    });
  }

  function appendLine(parent, strongText, detailText) {
    const line = document.createElement("div");
    const strong = document.createElement("strong");
    const detail = document.createElement("span");
    strong.textContent = String(strongText || "—");
    detail.textContent = String(detailText || "");
    line.append(strong, detail);
    parent.appendChild(line);
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value ?? "—");
  }

  function connectionLabel(status) {
    const labels = {
      connected: "Connected",
      pending: "Connection pending",
      needs_attention: "Needs attention",
      disconnected: "Disconnected",
      not_connected: "Not connected",
    };
    return labels[status] || "Not connected";
  }

  function formatNumber(value, decimals = 0) {
    return Number(value || 0).toLocaleString("en-GB", { maximumFractionDigits: decimals });
  }

  function formatCurrency(value, currency) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(Number(value || 0));
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function humanize(value) {
    return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
})();
