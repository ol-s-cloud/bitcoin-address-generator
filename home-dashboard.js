(() => {
  const email = document.getElementById("homeUserEmail");
  const title = document.getElementById("homeTitle");
  const signOut = document.getElementById("signOutButton");
  let homeData = null;

  bindForms();
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
      homeData = await response.json();
      renderAll(homeData);
    } catch {
      setText("energyAccountNote", "Home data could not be loaded");
      setText("smartMeterNote", "Try refreshing the page");
    }
  }

  function renderAll(data) {
    renderIdentity(data);
    renderSummary(data);
    renderEnergyAccount(data);
    renderTariffs(data.tariffs || []);
    renderBills(data.bills || []);
    renderAppliances(data.appliances || []);
    renderAssets(data.assets || []);
    renderTwin(data);
    renderOpportunities(data.opportunities || []);
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
    const account = primaryEnergyAccount(data);
    const latestBill = summary.latestBill;
    setText("energyAccountValue", account?.supplier || "—");
    setText("energyAccountNote", account ? connectionLabel(account.connection_status) : "No supplier connected");
    setText("smartMeterValue", summary.smartMeterConnected ? "Connected" : "—");
    setText("smartMeterNote", summary.intervalCount ? `${Number(summary.intervalCount).toLocaleString()} interval readings · latest ${formatDateTime(summary.latestIntervalAt)}` : "No meter data connected");
    const importKwh = Number(summary.electricityImportKwhMonth || 0);
    setText("monthUsageValue", summary.intervalCount ? `${formatNumber(importKwh, 1)} kWh` : "—");
    setText("monthUsageNote", latestBill?.total_amount != null ? `Latest bill ${formatCurrency(latestBill.total_amount, latestBill.currency || "GBP")}` : summary.intervalCount ? "Electricity import this calendar month" : "Connect usage to establish a baseline");
    const count = Number(summary.openOpportunityCount || 0);
    setText("opportunityValue", count ? String(count) : "—");
    setText("opportunityNote", count ? "Open quantified opportunities" : "No quantified opportunities yet");
  }

  function renderEnergyAccount(data) {
    const state = document.getElementById("energyAccountState");
    const account = primaryEnergyAccount(data);
    if (!state) return;
    clearNode(state);
    if (!account) {
      appendLine(state, "No energy account added.", "Add your supplier or data source below.");
      return;
    }
    appendLine(state, account.supplier || "Energy supplier", connectionLabel(account.connection_status));
    appendLine(state, "Data source", humanize(account.source_type));
    appendLine(state, "Meters", data.meters?.length ? `${data.meters.length} registered` : "No meter records");
    appendLine(state, "Latest sync", latestConnectionSync(data.connections));
    setValue("energySupplier", account.supplier || "");
    setValue("energyAccountLabel", account.account_label || "");
    setValue("energySourceType", account.source_type || "manual");
    const connection = (data.connections || []).find((item) => item.energy_account_id === account.id);
    if (connection) setValue("energyConnectionType", connection.connection_type || "manual");
  }

  function renderTariffs(items) {
    setText("tariffCount", `${items.length} tariff${items.length === 1 ? "" : "s"}`);
    const list = document.getElementById("tariffList");
    if (!list) return;
    clearNode(list);
    if (!items.length) return appendEmpty(list, "No tariff recorded.");
    items.slice(0, 8).forEach((item) => {
      const rate = item.unit_rate_p_per_kwh != null ? `${formatNumber(item.unit_rate_p_per_kwh, 3)}p/kWh` : humanize(item.rate_type);
      appendRecord(list, item.tariff_name || item.product_code || `${humanize(item.fuel)} tariff`, `${rate}${item.standing_charge_p_per_day != null ? ` · ${formatNumber(item.standing_charge_p_per_day, 2)}p/day` : ""}`, [humanize(item.fuel), item.supplier].filter(Boolean).join(" · "));
    });
  }

  function renderBills(items) {
    setText("billCount", `${items.length} bill${items.length === 1 ? "" : "s"}`);
    const list = document.getElementById("billList");
    if (!list) return;
    clearNode(list);
    if (!items.length) return appendEmpty(list, "No bills recorded.");
    items.slice(0, 8).forEach((item) => {
      const period = [formatDate(item.period_start), formatDate(item.period_end)].filter(Boolean).join(" → ");
      const usage = [item.electricity_kwh != null ? `${formatNumber(item.electricity_kwh, 1)} kWh electricity` : "", item.gas_kwh != null ? `${formatNumber(item.gas_kwh, 1)} kWh gas` : ""].filter(Boolean).join(" · ");
      appendRecord(list, item.total_amount != null ? formatCurrency(item.total_amount, item.currency || "GBP") : "Bill", period || item.supplier || "Supplier record", usage);
    });
  }

  function renderAppliances(items) {
    setText("applianceCount", `${items.length} appliance${items.length === 1 ? "" : "s"}`);
    const list = document.getElementById("applianceList");
    if (!list) return;
    clearNode(list);
    if (!items.length) return appendEmpty(list, "No Appliance Passports yet. Start with one of the home's largest electrical loads.");
    items.forEach((item) => {
      const titleText = [item.manufacturer, item.model].filter(Boolean).join(" ") || item.name || humanize(item.category);
      const specs = [item.rated_power_w != null ? `${formatNumber(item.rated_power_w, 0)} W` : "", item.energy_per_cycle_kwh != null ? `${formatNumber(item.energy_per_cycle_kwh, 3)} kWh/cycle` : "", item.annual_energy_kwh != null ? `${formatNumber(item.annual_energy_kwh, 1)} kWh/year` : ""].filter(Boolean).join(" · ");
      const row = appendRecord(list, titleText, specs || humanize(item.category), `${item.flexible ? "Flexible · " : ""}${humanize(item.connectivity)}`);
      const actions = actionBar();
      actions.append(actionButton("Edit", () => editAppliance(item)), actionButton("Remove", () => removeAppliance(item.id), true));
      row.append(actions);
    });
  }

  function renderAssets(items) {
    setText("assetCount", `${items.length} asset${items.length === 1 ? "" : "s"}`);
    const list = document.getElementById("assetList");
    if (!list) return;
    clearNode(list);
    if (!items.length) return appendEmpty(list, "No generation, storage or flexible energy assets registered.");
    items.forEach((item) => {
      const titleText = [item.manufacturer, item.model].filter(Boolean).join(" ") || item.name || humanize(item.asset_type);
      const capacities = [item.capacity_kw != null ? `${formatNumber(item.capacity_kw, 2)} kW` : "", item.capacity_kwh != null ? `${formatNumber(item.capacity_kwh, 2)} kWh` : ""].filter(Boolean).join(" · ");
      const row = appendRecord(list, titleText, capacities || humanize(item.asset_type), [humanize(item.asset_type), item.connectivity].filter(Boolean).join(" · "));
      const actions = actionBar();
      actions.append(actionButton("Remove", () => removeAsset(item.id), true));
      row.append(actions);
    });
  }

  function renderTwin(data) {
    const state = document.getElementById("twinState");
    if (!state) return;
    clearNode(state);
    const summary = data.summary || {};
    const inputs = Number(summary.intervalCount || 0) + Number(summary.applianceCount || 0) + Number(summary.assetCount || 0) + (data.tariffs?.length || 0);
    if (!inputs) return appendLine(state, "Waiting for site data.", "Energy and appliance records establish the first home state.");
    appendLine(state, "Site model inputs", `${Number(summary.intervalCount || 0).toLocaleString()} meter intervals`);
    appendLine(state, "Appliance Passports", String(summary.applianceCount || 0));
    appendLine(state, "Energy assets", String(summary.assetCount || 0));
    appendLine(state, "Tariffs", String(data.tariffs?.length || 0));
  }

  function renderOpportunities(items) {
    const state = document.getElementById("optimiseState");
    const list = document.getElementById("opportunityList");
    if (!state || !list) return;
    clearNode(list);
    state.hidden = Boolean(items.length);
    items.slice(0, 8).forEach((item) => appendRecord(list, item.title, item.annual_value_gbp != null ? `${formatCurrency(item.annual_value_gbp, "GBP")}/yr` : humanize(item.opportunity_type), item.description || ""));
  }

  function bindForms() {
    bindSubmit("energyAccountForm", async () => {
      setStatus("energyAccountStatus", "Saving…");
      await postHome({ action: "home_energy_account_upsert", supplier: value("energySupplier"), accountLabel: value("energyAccountLabel"), sourceType: value("energySourceType"), connectionType: value("energyConnectionType") });
      setStatus("energyAccountStatus", "Saved");
      await loadHome();
    });

    bindSubmit("tariffForm", async (form) => {
      setStatus("tariffStatus", "Saving…");
      await postHome({ action: "home_tariff_add", fuel: value("tariffFuel"), supplier: primaryEnergyAccount(homeData)?.supplier || "", tariffName: value("tariffName"), rateType: value("tariffRateType"), unitRatePPerKwh: value("tariffUnitRate"), standingChargePPerDay: value("tariffStandingCharge"), source: "manual" });
      form.reset(); setStatus("tariffStatus", "Added"); await loadHome();
    });

    bindSubmit("billForm", async (form) => {
      setStatus("billStatus", "Saving…");
      await postHome({ action: "home_bill_add", supplier: primaryEnergyAccount(homeData)?.supplier || "", periodStart: value("billPeriodStart"), periodEnd: value("billPeriodEnd"), totalAmount: value("billTotal"), electricityKwh: value("billElectricityKwh"), gasKwh: value("billGasKwh"), source: "manual" });
      form.reset(); setStatus("billStatus", "Added"); await loadHome();
    });

    bindSubmit("applianceForm", async (form) => {
      setStatus("applianceStatus", "Saving…");
      const applianceId = value("applianceId");
      await postHome({ action: applianceId ? "home_appliance_update" : "home_appliance_add", applianceId: applianceId || undefined, category: value("applianceCategory"), name: value("applianceName"), manufacturer: value("applianceManufacturer"), model: value("applianceModel"), gtin: value("applianceGtin"), ratedPowerW: value("appliancePower"), annualEnergyKwh: value("applianceAnnualEnergy"), energyPerCycleKwh: value("applianceCycleEnergy"), flexible: document.getElementById("applianceFlexible")?.checked || false, connectivity: value("applianceConnectivity"), specSource: value("applianceSpecSource") });
      resetApplianceForm(form); setStatus("applianceStatus", applianceId ? "Updated" : "Added"); await loadHome();
    });

    document.getElementById("applianceCancel")?.addEventListener("click", () => resetApplianceForm(document.getElementById("applianceForm")));

    bindSubmit("assetForm", async (form) => {
      setStatus("assetStatus", "Saving…");
      await postHome({ action: "home_asset_add", assetType: value("assetType"), name: value("assetName"), manufacturer: value("assetManufacturer"), model: value("assetModel"), capacityKw: value("assetCapacityKw"), capacityKwh: value("assetCapacityKwh"), connectivity: value("assetConnectivity") });
      form.reset(); setStatus("assetStatus", "Added"); await loadHome();
    });
  }

  function bindSubmit(id, handler) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      if (button) button.disabled = true;
      try { await handler(form); } catch (error) { setFormError(form, error?.message || "Request failed"); } finally { if (button) button.disabled = false; }
    });
  }

  async function postHome(payload) {
    const response = await fetch("/api/registry", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, siteId: homeData?.site?.id }) });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { location.replace("/home-auth.html"); throw new Error("Session expired"); }
    if (!response.ok) throw new Error(errorLabel(data.error));
    return data;
  }

  function editAppliance(item) {
    setValue("applianceId", item.id); setValue("applianceCategory", item.category); setValue("applianceName", item.name); setValue("applianceManufacturer", item.manufacturer); setValue("applianceModel", item.model); setValue("applianceGtin", item.gtin); setValue("appliancePower", item.rated_power_w); setValue("applianceAnnualEnergy", item.annual_energy_kwh); setValue("applianceCycleEnergy", item.energy_per_cycle_kwh); setValue("applianceConnectivity", item.connectivity || "none"); setValue("applianceSpecSource", item.spec_source);
    const flexible = document.getElementById("applianceFlexible"); if (flexible) flexible.checked = Boolean(item.flexible);
    setText("applianceSubmit", "Update appliance"); const cancel = document.getElementById("applianceCancel"); if (cancel) cancel.hidden = false;
    document.getElementById("applianceForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function removeAppliance(id) {
    if (!confirm("Remove this Appliance Passport from the site?")) return;
    await postHome({ action: "home_appliance_delete", applianceId: id }); await loadHome();
  }

  async function removeAsset(id) {
    if (!confirm("Remove this energy asset from the site?")) return;
    await postHome({ action: "home_asset_delete", assetId: id }); await loadHome();
  }

  function resetApplianceForm(form) {
    form?.reset(); setValue("applianceId", ""); setText("applianceSubmit", "Add appliance"); const cancel = document.getElementById("applianceCancel"); if (cancel) cancel.hidden = true;
  }

  function primaryEnergyAccount(data) { return (data?.energyAccounts || []).find((item) => item.is_primary) || data?.energyAccounts?.[0] || null; }
  function latestConnectionSync(connections) { const synced = (connections || []).filter((item) => item.last_sync_at).sort((a,b) => new Date(b.last_sync_at) - new Date(a.last_sync_at)); return synced.length ? formatDateTime(synced[0].last_sync_at) : "No data sync yet"; }

  function appendRecord(parent, heading, detail, meta) {
    const row = document.createElement("article"); row.className = "home-record";
    const copy = document.createElement("div"); const strong = document.createElement("strong"); const detailNode = document.createElement("span"); const metaNode = document.createElement("small");
    strong.textContent = String(heading || "—"); detailNode.textContent = String(detail || ""); metaNode.textContent = String(meta || ""); copy.append(strong, detailNode, metaNode); row.append(copy); parent.append(row); return row;
  }
  function appendEmpty(parent, text) { const node = document.createElement("div"); node.className = "home-empty-line"; node.textContent = text; parent.append(node); }
  function appendLine(parent, strongText, detailText) { const line = document.createElement("div"); const strong = document.createElement("strong"); const detail = document.createElement("span"); strong.textContent = String(strongText || "—"); detail.textContent = String(detailText || ""); line.append(strong, detail); parent.append(line); }
  function actionBar() { const node = document.createElement("div"); node.className = "home-record-actions"; return node; }
  function actionButton(label, onClick, danger = false) { const button = document.createElement("button"); button.type = "button"; button.textContent = label; if (danger) button.className = "danger"; button.addEventListener("click", onClick); return button; }
  function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = String(value ?? "—"); }
  function setValue(id, value) { const node = document.getElementById(id); if (node) node.value = value == null ? "" : String(value); }
  function value(id) { return document.getElementById(id)?.value?.trim?.() ?? ""; }
  function setStatus(id, text) { setText(id, text); }
  function setFormError(form, message) { const status = form.querySelector(".home-inline-status"); if (status) status.textContent = message; }
  function connectionLabel(status) { return ({ connected: "Connected", pending: "Connection pending", needs_attention: "Needs attention", disconnected: "Disconnected", not_connected: "Not connected" })[status] || "Not connected"; }
  function formatNumber(value, decimals = 0) { return Number(value || 0).toLocaleString("en-GB", { maximumFractionDigits: decimals }); }
  function formatCurrency(value, currency) { return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(Number(value || 0)); }
  function formatDate(value) { if (!value) return ""; const date = new Date(`${String(value).slice(0,10)}T12:00:00Z`); return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  function formatDateTime(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  function humanize(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
  function errorLabel(code) { return ({ unsupported_field: "Some fields were not accepted.", category_required: "Choose an appliance category.", invalid_asset_type: "Choose an energy asset type.", home_site_not_found: "COBRA Home site not found." })[code] || "Could not save this Home record."; }
})();
