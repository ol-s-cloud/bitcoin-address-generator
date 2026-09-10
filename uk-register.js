(() => {
  const form = document.getElementById('cobraUkForm');
  const status = document.getElementById('cobraUkStatus');
  if (!form || !status) return;

  const readChecked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const payload = {
      action: 'cobra_uk_registration',
      contactName: document.getElementById('ukName').value.trim(),
      email: document.getElementById('ukEmail').value.trim(),
      organization: document.getElementById('ukOrg').value.trim(),
      segment: document.getElementById('ukSegment').value,
      postcode: document.getElementById('ukPostcode').value.trim().toUpperCase(),
      energySupplier: document.getElementById('ukSupplier').value.trim(),
      smartMeterStatus: document.getElementById('ukSmartMeter').value,
      connectionPreference: document.getElementById('ukConnection').value,
      siteType: document.getElementById('ukSiteType').value.trim(),
      powerRange: document.getElementById('ukPowerRange').value,
      assets: readChecked('ukAsset'),
      interests: readChecked('ukInterest'),
      notes: document.getElementById('ukNotes').value.trim(),
      sourcePath: '/uk.html',
    };

    if (!payload.email) {
      status.textContent = 'Enter an email address.';
      return;
    }

    submit.disabled = true;
    status.textContent = 'Registering your site…';
    try {
      const response = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'registration_failed');
      status.textContent = `Site registered. COBRA reference: ${data.reference || 'CBR-UK'}.`;
      form.reset();
    } catch (error) {
      status.textContent = 'Registration could not be recorded. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
})();
