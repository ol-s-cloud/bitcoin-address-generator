(() => {
  const overview = document.querySelector('[data-panel="overview"]');
  if (!overview || document.querySelector('[data-scenario-rail]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .scenario-section{margin-top:22px}.scenario-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:12px}.scenario-head h3{margin:4px 0 0;font-size:24px;letter-spacing:-.035em}.scenario-arrows{display:flex;gap:8px}.scenario-arrow{width:40px;height:40px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:18px;cursor:pointer}.scenario-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(280px,390px);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;scrollbar-width:thin}.scenario-card{scroll-snap-align:start;border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:20px;min-height:220px;display:flex;flex-direction:column;justify-content:space-between}.scenario-card .tag{font:800 8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--accent)}.scenario-card h4{margin:10px 0 8px;font-size:25px;letter-spacing:-.04em}.scenario-card p{margin:0;color:var(--muted);line-height:1.55;font-size:12px}.scenario-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.scenario-meta div{border-top:1px solid var(--line);padding-top:9px}.scenario-meta span{display:block;color:var(--muted);font:800 8px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.scenario-meta strong{display:block;margin-top:4px;font-size:12px}.scenario-open{border:0;background:transparent;color:var(--text);padding:0;text-align:left;font-weight:900;cursor:pointer}.scenario-open::after{content:' →';color:var(--accent)}
    @media(max-width:620px){.scenario-rail{grid-auto-columns:84vw}.scenario-head h3{font-size:20px}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.className = 'scenario-section';
  section.innerHTML = `
    <div class="scenario-head">
      <div><div class="eyebrow">COBRA APPLICATIONS</div><h3>Explore operating scenarios</h3></div>
      <div class="scenario-arrows"><button class="scenario-arrow" data-scenario-arrow="prev" aria-label="Previous scenarios">←</button><button class="scenario-arrow" data-scenario-arrow="next" aria-label="Next scenarios">→</button></div>
    </div>
    <div class="scenario-rail" data-scenario-rail>
      <article class="scenario-card"><div><span class="tag">Bitcoin mining</span><h4>Machine → Fleet → Facility</h4><p>Use live BTC/network conditions and a site tariff to calculate operating margin, break-even power and current mine/watch/curtail conditions.</p><div class="scenario-meta"><div><span>Engine</span><strong>Live economics</strong></div><div><span>Status</span><strong>Decision-ready</strong></div></div></div><button class="scenario-open" data-open-tab="mining">Open mining</button></article>
      <article class="scenario-card"><div><span class="tag">AI / data centre</span><h4>Flexible inference & compute</h4><p>Model facility capacity, utilisation, PUE and power price to understand energy cost and when flexible compute should run, shift or pause.</p><div class="scenario-meta"><div><span>Inputs</span><strong>MW · PUE · tariff</strong></div><div><span>Status</span><strong>Reference model</strong></div></div></div><button class="scenario-open" data-open-tab="compute">Open compute</button></article>
      <article class="scenario-card"><div><span class="tag">Nuclear / generation</span><h4>Generation → Compute</h4><p>Reference a 470 MW SMR and compare electrical output, daily energy and the scale of co-located compute that generation could support.</p><div class="scenario-meta"><div><span>Nameplate</span><strong>470 MW</strong></div><div><span>Status</span><strong>Reference simulation</strong></div></div></div><button class="scenario-open" data-open-tab="compute">Open generation</button></article>
      <article class="scenario-card"><div><span class="tag">Home / flexible load</span><h4>Smart appliances</h4><p>Explore heat pumps, washing machines, standby loads and EV charging against peak/off-peak tariffs and current grid flexibility signals.</p><div class="scenario-meta"><div><span>Profile</span><strong>Demo household</strong></div><div><span>Next</span><strong>Consented meter data</strong></div></div></div><button class="scenario-open" data-open-tab="home">Open home</button></article>
      <article class="scenario-card"><div><span class="tag">Battery / EV</span><h4>Shift, store, export</h4><p>Use the same power and tariff signals to decide when storage or EV loads should charge, wait or eventually export through a permitted market route.</p><div class="scenario-meta"><div><span>Signal</span><strong>Power + tariff</strong></div><div><span>Status</span><strong>Next module</strong></div></div></div><button class="scenario-open" data-open-tab="home">Open flexible loads</button></article>
    </div>`;

  const summary = overview.querySelector('.summary-strip');
  if (summary) summary.insertAdjacentElement('afterend', section); else overview.prepend(section);

  const rail = section.querySelector('[data-scenario-rail]');
  const step = () => Math.max(280, Math.min(460, rail.clientWidth * 0.72));
  section.querySelectorAll('[data-scenario-arrow]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = button.dataset.scenarioArrow === 'next' ? 1 : -1;
      rail.scrollBy({ left: step() * direction, behavior: 'smooth' });
    });
  });

  section.querySelectorAll('[data-open-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(`[data-tab="${button.dataset.openTab}"]`);
      if (!target) return;
      target.click();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
