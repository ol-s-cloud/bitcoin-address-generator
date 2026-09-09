(() => {
  const rail = document.querySelector('[data-scenario-rail]');
  if (!rail) return;

  const step = () => Math.max(280, Math.min(460, rail.clientWidth * 0.72));
  document.querySelectorAll('[data-scenario-arrow]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = button.dataset.scenarioArrow === 'next' ? 1 : -1;
      rail.scrollBy({ left: step() * direction, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-open-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.openTab;
      const target = document.querySelector(`[data-tab="${tab}"]`);
      if (target) {
        target.click();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
