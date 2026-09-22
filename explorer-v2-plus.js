(() => {
  function upgradeGates() {
    document.querySelectorAll('.subtabs button').forEach((button) => {
      if (!/soon/i.test(button.textContent || '')) return;
      button.textContent = button.textContent.replace(/\s*·?\s*soon/i, ' · COBRA+');
      button.disabled = false;
      button.classList.add('cobra-plus-gate');
      button.setAttribute('aria-label', `${button.textContent.trim()} — open COBRA+`);
      button.addEventListener('click', (event) => {
        event.preventDefault();
        location.href = '/plus.html#access';
      });
    });
  }

  function buildBridge() {
    if (document.getElementById('cobraPlusAccess')) return;
    const main = document.querySelector('main.terminal-shell');
    if (!main) return;
    const section = document.createElement('section');
    section.id = 'cobraPlusAccess';
    section.className = 'cobra-plus-access';
    section.innerHTML = `
      <div class="cobra-plus-hero">
        <div>
          <div class="eyebrow">COBRA+</div>
          <h2>Private site intelligence and connected operations.</h2>
          <p>Connect your site, meters and approved electrical assets to COBRA for private telemetry, operating history, alerts, advanced models and device integrations.</p>
        </div>
        <div class="cobra-plus-actions">
          <a href="/plus.html">Explore COBRA+</a>
          <a href="/plus.html#access" class="secondary">Request access</a>
        </div>
      </div>
      <div class="cobra-plus-usecases" aria-label="COBRA+ platform areas">
        <article><span>01</span><strong>Connected sites</strong><small>Site profiles, tariffs, meters, generation and flexible loads.</small></article>
        <article><span>02</span><strong>Connected assets</strong><small>Miners, meters, batteries, EVs, servers and approved flexible electrical assets.</small></article>
        <article><span>03</span><strong>Operations</strong><small>History, alerts, digital twins and operating decisions.</small></article>
        <article><span>04</span><strong>Deployment</strong><small>COBRA Appliances, equipment specification and engineering services.</small></article>
      </div>
      <div class="cobra-plus-actions">
        <a href="/store.html" class="secondary">COBRA Store →</a>
        <a href="/services.html" class="secondary">COBRA Services →</a>
      </div>`;
    const persistent = document.getElementById('cobraPersistentFooter');
    if (persistent) persistent.insertAdjacentElement('beforebegin', section);
    else main.appendChild(section);
  }

  function initialise() {
    upgradeGates();
    buildBridge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();