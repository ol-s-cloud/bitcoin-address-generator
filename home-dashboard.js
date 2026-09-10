(() => {
  const email = document.getElementById("homeUserEmail");
  const title = document.getElementById("homeTitle");
  const signOut = document.getElementById("signOutButton");

  loadSession();

  if (signOut) {
    signOut.addEventListener("click", async () => {
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
  }

  async function loadSession() {
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
      const homeSite = (data.sites || []).find((site) => site.product === "home") || data.sites?.[0];
      if (email) email.textContent = data.user?.email || "COBRA account";
      if (title && homeSite?.name) title.textContent = homeSite.name;
      if (homeSite) {
        const hero = document.querySelector(".home-app-hero p");
        const locationText = [homeSite.postcode, homeSite.country_code].filter(Boolean).join(" · ");
        if (hero && locationText) {
          hero.textContent = `${locationText} · Household energy account, meters, bills, tariffs, appliances and generation assets in one site profile.`;
        }
      }
    } catch {
      location.replace("/home-auth.html");
    }
  }
})();
