(() => {
  const createTab = document.getElementById("createTab");
  const loginTab = document.getElementById("loginTab");
  const createForm = document.getElementById("createForm");
  const loginForm = document.getElementById("loginForm");
  const createStatus = document.getElementById("createStatus");
  const loginStatus = document.getElementById("loginStatus");
  if (!createTab || !loginTab || !createForm || !loginForm) return;

  const show = (mode) => {
    const creating = mode === "create";
    createTab.setAttribute("aria-selected", String(creating));
    loginTab.setAttribute("aria-selected", String(!creating));
    createForm.hidden = !creating;
    loginForm.hidden = creating;
  };

  createTab.addEventListener("click", () => show("create"));
  loginTab.addEventListener("click", () => show("login"));

  checkSession();

  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = createForm.querySelector('button[type="submit"]');
    const payload = {
      action: "account_register",
      product: "home",
      accountType: "personal",
      displayName: document.getElementById("createName").value.trim(),
      email: document.getElementById("createEmail").value.trim(),
      password: document.getElementById("createPassword").value,
      siteName: document.getElementById("createSiteName").value.trim() || "My Home",
      siteType: "home",
      postcode: document.getElementById("createPostcode").value.trim().toUpperCase(),
    };

    if (payload.password.length < 12) {
      createStatus.textContent = "Use at least 12 characters for your password.";
      return;
    }

    button.disabled = true;
    createStatus.textContent = "Creating account…";
    try {
      const response = await fetch("/api/registry", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "account_creation_failed");
      location.assign("/home-dashboard.html");
    } catch (error) {
      const code = String(error?.message || "");
      createStatus.textContent = code === "account_exists"
        ? "An account already exists for this email. Sign in instead."
        : code === "password_length"
          ? "Use a password between 12 and 128 characters."
          : "Account could not be created. Please try again.";
    } finally {
      button.disabled = false;
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button[type="submit"]');
    const payload = {
      action: "account_login",
      email: document.getElementById("loginEmail").value.trim(),
      password: document.getElementById("loginPassword").value,
    };
    button.disabled = true;
    loginStatus.textContent = "Signing in…";
    try {
      const response = await fetch("/api/registry", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "login_failed");
      location.assign("/home-dashboard.html");
    } catch {
      loginStatus.textContent = "Email or password was not recognised.";
    } finally {
      button.disabled = false;
    }
  });

  async function checkSession() {
    try {
      const response = await fetch("/api/registry?mode=account_session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.ok) location.assign("/home-dashboard.html");
    } catch {}
  }
})();
