(() => {
  const form = document.getElementById('cobraUkForm');
  const status = document.getElementById('cobraUkStatus');
  if (!form || !status) return;

  const useCaseMap = {
    home: 'home_energy',
    business: 'industrial_site',
    mining: 'bitcoin_mining',
    compute: 'data_center_compute',
    generation: 'generation_project',
    developer: 'developer_platform',
    other: 'other',
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const profileType = document.getElementById('ukProfileType').value;
    const interests = [...form.querySelectorAll('input[name="ukInterest"]:checked')].map((input) => input.value);

    const payload = {
      action: 'cobra_plus_waitlist',
      contactName: document.getElementById('ukName').value.trim(),
      email: document.getElementById('ukEmail').value.trim(),
      organization: document.getElementById('ukOrg').value.trim(),
      country: 'United Kingdom',
      postcode: document.getElementById('ukPostcode').value.trim().toUpperCase(),
      energySupplier: document.getElementById('ukSupplier').value,
      smartMeterStatus: document.getElementById('ukSmartMeter').value,
      connectionPreference: document.getElementById('ukConnection').value,
      useCase: useCaseMap[profileType] || 'other',
      siteType: document.getElementById('ukSiteType').value.trim() || profileType,
      powerRange: document.getElementById('ukPowerRange').value,
      interests,
      notes: document.getElementById('ukNotes').value.trim(),
      sourcePath: '/uk.html',
    };

    if (!payload.email) {
      status.textContent = 'Enter an email address.';
      return;
    }

    submit.disabled = true;
    status.textContent = 'Registering site…';
    try {
      const response = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'registration_failed');
      status.textContent = `Registration recorded. Reference: ${data.requestId ?? 'COBRA-UK'}.`;
      form.reset();
    } catch (error) {
      status.textContent = 'Registration could not be recorded. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
})();
