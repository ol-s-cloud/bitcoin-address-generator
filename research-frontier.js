const research=document.querySelector('.research-lab');
if(research){
  const frontier=document.createElement('section');
  frontier.className='research-frontier';
  frontier.innerHTML=`
    <div class="eyebrow">COBRA RESEARCH FRONTIER · EXPERIMENTAL / NOT DEPLOYED</div>
    <h2>Privacy, agentic sovereignty & post-quantum cryptography.</h2>
    <p class="frontier-intro">COBRA is exploring how locally controlled cryptography could evolve beyond today's address-generation model: privacy-preserving agents, stronger unlinkability, selective disclosure, post-quantum signatures and sovereign transaction architectures that do not require a new custodian.</p>
    <div class="frontier-grid">
      <article><span>01</span><h3>Post-quantum security</h3><p>Research into signature agility, hash-based signatures, STARK-compatible proving systems and other primitives intended to remain secure against future quantum-capable adversaries.</p><a href="https://ethereum.org/roadmap/security/quantum-resistance/" target="_blank" rel="noopener noreferrer">Ethereum post-quantum roadmap ↗</a></article>
      <article><span>02</span><h3>Privacy-preserving agents</h3><p>Explore agents that can mediate intent, key rotation, selective disclosure and private proving while reducing unnecessary public linkage between a human identity and repeated on-chain actions.</p><a href="https://ethereum.org/roadmap/privacy/" target="_blank" rel="noopener noreferrer">Ethereum privacy roadmap ↗</a></article>
      <article><span>03</span><h3>Sovereignty vs programmable compliance</h3><p>Tokenized real-world assets increasingly embed policy controls. ERC-7943 formalizes transfer checks, freezing and enforcement hooks for RWAs. COBRA treats this as a useful research counterpoint to autonomy, privacy and self-custody.</p><a href="https://eips.ethereum.org/EIPS/eip-7943" target="_blank" rel="noopener noreferrer">Read ERC-7943 / uRWA ↗</a></article>
      <article><span>04</span><h3>Quantum + privacy together</h3><p>The long-term problem is not only quantum resistance or privacy in isolation, but whether both can coexist with usability, verifiability, decentralization and user-controlled keys.</p><a href="https://www.nature.com/articles/s41598-023-32701-6" target="_blank" rel="noopener noreferrer">Post-quantum blockchain research ↗</a></article>
    </div>
    <div class="research-call">
      <div><div class="eyebrow">CALL FOR PAPERS · RESEARCHERS · DEVELOPERS</div><h3>Working on adjacent problems?</h3><p>COBRA invites researchers, cryptographers, protocol engineers and developers working on post-quantum blockchain security, zero-knowledge systems, privacy-preserving agents, transaction unlinkability, sovereign identity, self-custody or programmable compliance to get in touch. Relevant papers, preprints, prototypes, repositories and collaboration proposals are welcome.</p></div>
      <div class="research-call-actions"><a class="primary-link" href="mailto:gs_wl889@icloud.com?subject=COBRA%20Research%20Collaboration">Submit research / collaborate</a><a class="secondary-link" href="https://github.com/ol-s-cloud/bitcoin-address-generator/issues/new?title=COBRA%20research%20reference%20or%20collaboration&body=Paper%20%2F%20project%20link%3A%20%0A%0AResearch%20area%3A%20%0A%0AWhy%20it%20is%20relevant%20to%20COBRA%3A%20" target="_blank" rel="noopener noreferrer">Open research issue ↗</a></div>
    </div>`;
  research.insertAdjacentElement('afterend',frontier);
}

setTimeout(()=>{
  const news=document.querySelector('.news-pulse');
  if(news&&!news.querySelector('.protocol-watch')){
    const watch=document.createElement('div');
    watch.className='protocol-watch-stack';
    watch.innerHTML=`
      <a class="protocol-watch" href="https://eips.ethereum.org/EIPS/eip-7943" target="_blank" rel="noopener noreferrer"><span class="protocol-label">PROTOCOL WATCH · ERC-7943</span><strong>uRWA — Universal Real World Asset Interface</strong><small>Final standard covering common RWA compliance checks, transfer controls, freezing and enforcement hooks. Track alongside COBRA's sovereignty and programmable-compliance research. ↗</small></a>
      <a class="protocol-watch" href="https://www.justice.gov/opa/speech/acting-assistant-attorney-general-matthew-r-galeotti-delivers-remarks-american" target="_blank" rel="noopener noreferrer"><span class="protocol-label">POLICY WATCH · OPEN-SOURCE CRYPTO DEVELOPMENT</span><strong>U.S. DOJ: merely writing code without ill intent is not a crime</strong><small>DOJ guidance says neutral-tool developers should generally not be held responsible for third-party misuse where they lack criminal intent, while preserving prosecution for fraud, laundering, sanctions evasion and intentional criminal assistance. Primary source ↗</small></a>`;
    const head=news.querySelector('.news-head');
    if(head)head.insertAdjacentElement('afterend',watch);
  }
},0);

const style=document.createElement('link');
style.rel='stylesheet';style.href='/research-frontier.css';document.head.appendChild(style);
