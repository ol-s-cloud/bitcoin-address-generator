setTimeout(()=>{
  const developers=document.querySelector('.developers');
  if(!developers||document.querySelector('.agents-home'))return;
  const section=document.createElement('section');
  section.className='agents-home';
  section.innerHTML=`<div class="eyebrow">COBRA × AI AGENTS</div><div class="agents-home-grid"><div><h2>Agents can reason. Keys authorize.</h2><p>COBRA is exploring agent-compatible infrastructure where AI agents can monitor public blockchain state, analyse transactions, prepare unsigned transaction intent and coordinate workflows — while cryptographic authorization remains isolated from the agent.</p><div class="agents-flow">AGENT → ANALYSE → PREPARE → APPROVAL → OFFLINE SIGNER → BROADCAST</div><p class="agents-note">Private keys, WIFs and seed phrases should never enter prompts, model context, telemetry or remote agent tools.</p></div><div class="agents-actions"><a href="/docs.html#agents">Explore agent architecture →</a><a href="/offline.html">Open COBRA Offline →</a></div></div>`;
  developers.insertAdjacentElement('beforebegin',section);
  if(!document.querySelector('link[href="/agents-home.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/agents-home.css';document.head.appendChild(css);}
},0);