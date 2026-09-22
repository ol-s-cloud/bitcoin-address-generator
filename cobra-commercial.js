(() => {
  const form = document.getElementById('cobraCommercialForm');
  if (!form) return;
  const value = (id) => document.getElementById(id)?.value?.trim?.() || '';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('ccStatus');
    const button = form.querySelector('button[type="submit"]');
    const interests = [...form.querySelectorAll('input[name="ccInterest"]:checked')].map((input) => input.value);
    const payload = { action:'cobra_plus_waitlist', email:value('ccEmail'), organization:value('ccOrg'), country:value('ccCountry'), useCase:value('ccUseCase'), siteType:value('ccSiteType'), powerRange:value('ccPowerRange'), interests, notes:value('ccNotes'), sourcePath:location.pathname };
    status.textContent='Submitting access request…'; button.disabled=true;
    try {
      const response = await fetch('/api/registry',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||'request_failed');
      status.innerHTML=`<strong>Request recorded.</strong> COBRA+ access is reviewed manually. Reference: ${String(data.requestId||'recorded').replace(/[<>&]/g,'')}.`;
      form.reset();
    } catch (error) {
      status.textContent = error.message === 'invalid_email' ? 'Enter a valid email address.' : 'COBRA+ intake is temporarily unavailable. Please try again.';
    } finally { button.disabled=false; }
  });
})();