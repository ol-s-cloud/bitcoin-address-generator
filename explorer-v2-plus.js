(() => {
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[c]);

  function upgradeSoonLabels() {
    document.querySelectorAll(".subtabs button").forEach((button) => {
      if (!/soon/i.test(button.textContent || "")) return;
      button.textContent = button.textContent.replace(/\s*·?\s*soon/i, " · COBRA+");
      button.disabled = false;
      button.classList.add("cobra-plus-gate");
      button.setAttribute("aria-label", `${button.textContent.trim()} — request COBRA+ access`);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        showPlus("feature_gate");
      });
    });
  }

  function buildPlus() {
    if ($("cobraPlusAccess")) return;
    const main = document.querySelector("main.terminal-shell");
    if (!main) return;

    const section = document.createElement("section");
    section.id = "cobraPlusAccess";
    section.className = "cobra-plus-access";
    section.innerHTML = `
      <div class="cobra-plus-hero">
        <div>
          <div class="eyebrow">COBRA+ · PRIVATE ACCESS</div>
          <h2>Connect your site to the COBRA ecosystem.</h2>
          <p>COBRA Intelligence provides the operating layer for energy-aware compute and power assets. COBRA+ adds private site intelligence, metering and telemetry, deployment support, engineering services and selected equipment pathways.</p>
        </div>
        <div class="cobra-plus-actions">
          <button type="button" id="cobraPlusWhitelist">Request access</button>
          <button type="button" id="cobraPlusWaitlist" class="secondary">Join waitlist</button>
        </div>
      </div>

      <div class="cobra-plus-usecases" aria-label="COBRA+ use cases">
        <article><span>01</span><strong>Bitcoin & mining</strong><small>Mining sites, fleets, power economics and dispatch intelligence.</small></article>
        <article><span>02</span><strong>Industrial power</strong><small>Mines, factories, private grids, microgrids and flexible electrical assets.</small></article>
        <article><span>03</span><strong>AI & data centres</strong><small>Compute facilities, workload timing, power cost and energy-aware operation.</small></article>
        <article><span>04</span><strong>Home energy</strong><small>Smart-meter analysis, tariff optimisation, EVs, batteries and flexible appliances.</small></article>
        <article><span>05</span><strong>Generation</strong><small>Solar, storage, gas generation, SMR/nuclear and generation-to-compute scenarios.</small></article>
        <article><span>06</span><strong>Developers</strong><small>APIs, data, models and private COBRA integrations.</small></article>
      </div>

      <div class="cobra-plus-commercial">
        <div>
          <div class="eyebrow">COBRA+ · SITE & EQUIPMENT</div>
          <h3>From site data to deployed infrastructure.</h3>
          <p>Metering, telemetry, miners, batteries, solar, onsite generation and engineering services are specified around each site's operating requirements. Equipment supply, installation and commissioning remain subject to project scope, regulation, manufacturer availability and qualified delivery partners.</p>
        </div>
        <div class="cobra-plus-tags">
          <span>Smart metering</span><span>Telemetry</span><span>Bitcoin miners</span><span>Battery storage</span><span>Solar</span><span>Gas turbines / power islands</span><span>SMR / nuclear pathway</span><span>Site engineering</span><span>Installation & commissioning</span><span>Maintenance</span>
        </div>
      </div>

      <form id="cobraPlusForm" class="cobra-plus-form" hidden>
        <div class="cobra-plus-form-head">
          <div><div class="eyebrow">COBRA+ ACCESS INTAKE</div><h3>Tell us about your site.</h3></div>
          <button type="button" id="cobraPlusClose" aria-label="Close COBRA+ form">×</button>
        </div>
        <div class="cobra-plus-fields">
          <label>Email<input type="email" id="plusEmail" required maxlength="254" placeholder="you@company.com" /></label>
          <label>Organisation / project<input id="plusOrg" maxlength="160" placeholder="Optional" /></label>
          <label>Country<input id="plusCountry" maxlength="120" placeholder="United Kingdom" /></label>
          <label>Primary use case<select id="plusUseCase" required>
            <option value="bitcoin_mining">Bitcoin mining</option>
            <option value="industrial_site">Industrial / private electricity site</option>
            <option value="data_center_compute">AI / data centre compute</option>
            <option value="home_energy">Home energy / bills</option>
            <option value="generation_project">Generation / microgrid project</option>
            <option value="developer_platform">Developer / API integration</option>
            <option value="other">Other</option>
          </select></label>
          <label>Site type<input id="plusSiteType" maxlength="160" placeholder="Mine, data centre, home, factory, power project…" /></label>
          <label>Approx. electrical scale<select id="plusPowerRange">
            <option value="">Not sure yet</option>
            <option>Under 20 kW</option>
            <option>20–100 kW</option>
            <option>100–500 kW</option>
            <option>500 kW–1 MW</option>
            <option>1–5 MW</option>
            <option>5–20 MW</option>
            <option>20–100 MW</option>
            <option>100 MW+</option>
          </select></label>
        </div>
        <fieldset class="cobra-plus-interests">
          <legend>Services and systems of interest</legend>
          ${[
            ["cobra_intelligence", "COBRA Intelligence"],
            ["private_deployment", "Private site deployment"],
            ["metering_telemetry", "Metering & telemetry"],
            ["bitcoin_miners", "Bitcoin miners"],
            ["battery_storage", "Battery storage"],
            ["solar", "Solar / renewable package"],
            ["gas_generation", "Gas turbine / generation"],
            ["smr_nuclear", "SMR / nuclear project pathway"],
            ["engineering", "Engineering / site design"],
            ["installation", "Installation & commissioning"],
            ["maintenance", "Maintenance / lifecycle service"],
            ["api_data", "API / data access"],
          ].map(([value, label]) => `<label><input type="checkbox" name="plusInterest" value="${value}" />${label}</label>`).join("")}
        </fieldset>
        <label class="cobra-plus-notes">Project brief<textarea id="plusNotes" maxlength="1500" rows="5" placeholder="Site, energy requirement, equipment, compute load, mining fleet, home-energy objective or project stage…"></textarea></label>
        <div class="cobra-plus-submit">
          <p>Submitting this form requests access only. It does not create a commercial agreement, equipment order or partnership.</p>
          <button type="submit">Request COBRA+ access</button>
        </div>
        <div id="cobraPlusStatus" class="cobra-plus-status" role="status"></div>
      </form>`;

    const persistent = $("cobraPersistentFooter");
    if (persistent) persistent.insertAdjacentElement("beforebegin", section);
    else main.appendChild(section);

    $("cobraPlusWhitelist")?.addEventListener("click", () => showPlus("whitelist"));
    $("cobraPlusWaitlist")?.addEventListener("click", () => showPlus("waitlist"));
    $("cobraPlusClose")?.addEventListener("click", () => $("cobraPlusForm").hidden = true);
    $("cobraPlusForm")?.addEventListener("submit", submitPlus);
  }

  function showPlus() {
    const section = $("cobraPlusAccess");
    const form = $("cobraPlusForm");
    if (!section || !form) return;
    form.hidden = false;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => $("plusEmail")?.focus(), 500);
  }

  async function submitPlus(event) {
    event.preventDefault();
    const status = $("cobraPlusStatus");
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const interests = [...document.querySelectorAll('input[name="plusInterest"]:checked')].map((input) => input.value);
    const payload = {
      action: "cobra_plus_waitlist",
      email: $("plusEmail").value.trim(),
      organization: $("plusOrg").value.trim(),
      country: $("plusCountry").value.trim(),
      useCase: $("plusUseCase").value,
      siteType: $("plusSiteType").value.trim(),
      powerRange: $("plusPowerRange").value,
      interests,
      notes: $("plusNotes").value.trim(),
      sourcePath: location.pathname,
    };

    status.textContent = "Submitting access request…";
    button.disabled = true;
    try {
      const response = await fetch("/api/registry", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "request_failed");
      status.innerHTML = `<strong>Request recorded.</strong> COBRA+ access is reviewed manually. Reference: ${escapeHtml(data.requestId || "recorded")}.`;
      event.currentTarget.reset();
    } catch (error) {
      status.textContent = error.message === "invalid_email" ? "Enter a valid email address." : "COBRA+ intake is temporarily unavailable. Please try again.";
    } finally {
      button.disabled = false;
    }
  }

  function initialise() {
    buildPlus();
    upgradeSoonLabels();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise, { once: true });
  else initialise();
})();
