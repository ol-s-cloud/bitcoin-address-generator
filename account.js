(() => {
  const email = document.getElementById("accountEmail");
  const sitesRoot = document.getElementById("accountSites");
  const productsRoot = document.getElementById("accountProducts");
  const signOut = document.getElementById("accountSignOut");

  loadAccount();

  signOut?.addEventListener("click", async () => {
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

  async function loadAccount() {
    try {
      const response = await fetch("/api/registry?mode=account_session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        location.replace("/home-auth.html");
        return;
      }
      const data = await response.json();
      if (email) email.textContent = data.user?.email || "COBRA account";
      renderSites(data.sites || []);
      renderProducts(data.products || []);
    } catch {
      location.replace("/home-auth.html");
    }
  }

  function renderSites(sites) {
    if (!sitesRoot) return;
    if (!sites.length) {
      sitesRoot.innerHTML = '<div class="home-zero"><strong>No sites found.</strong></div>';
      return;
    }
    sitesRoot.innerHTML = sites.map((site) => {
      const destination = site.product === "home" ? "/home-dashboard.html" : "#products";
      return `<div class="home-account-row"><div><strong>${escapeHtml(site.name)}</strong><span>${escapeHtml(site.product)} · ${escapeHtml(site.site_type)} · ${escapeHtml(site.postcode || site.country_code || "")}</span></div><a class="home-app-action" href="${destination}">Open</a></div>`;
    }).join("");
  }

  function renderProducts(products) {
    if (!productsRoot) return;
    if (!products.length) {
      productsRoot.innerHTML = '<div class="home-zero"><strong>No product access found.</strong></div>';
      return;
    }
    productsRoot.innerHTML = products.map((product) => {
      const destination = product.product === "home" ? "/home-dashboard.html" : "#";
      const action = product.product === "home" ? `<a class="home-app-action" href="${destination}">Open Home</a>` : `<span>${escapeHtml(product.plan)} · ${escapeHtml(product.status)}</span>`;
      return `<div class="home-account-row"><div><strong>COBRA ${escapeHtml(capitalize(product.product))}</strong><span>${escapeHtml(product.plan)} plan · ${escapeHtml(product.status)}</span></div>${action}</div>`;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function capitalize(value) {
    const text = String(value || "");
    return text ? text[0].toUpperCase() + text.slice(1) : text;
  }
})();
