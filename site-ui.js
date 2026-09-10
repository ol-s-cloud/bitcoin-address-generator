(() => {
  const root = document.documentElement;
  const storageKey = "cobra-theme";

  const globalStyles = document.createElement("link");
  globalStyles.rel = "stylesheet";
  globalStyles.href = "/cobra-global-shell.css";
  document.head.appendChild(globalStyles);

  const readPreference = () => {
    try {
      const value = localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  const applyTheme = (theme, persist = false) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) {
      try { localStorage.setItem(storageKey, theme); } catch {}
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute("content", theme === "light" ? "#f7f9f7" : "#050706");
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const next = theme === "dark" ? "Light" : "Dark";
      button.textContent = `${next} mode`;
      button.setAttribute("aria-label", `Switch to ${next.toLowerCase()} mode`);
    });
  };

  applyTheme(readPreference() || "light");

  const coreNavigation = [
    ["/", "Home"],
    ["/docs.html", "Docs"],
    ["/explorer-v2-terminal.html", "Explorer"],
    ["/research.html", "Research"],
    ["/offline.html", "Offline"],
    ["/cli.html", "CLI"],
    ["/plus.html", "COBRA+"],
    ["/store.html", "Store"],
    ["/services.html", "Services"],
    ["/calculators.html", "Calculators"],
  ];
  const githubUrl = "https://github.com/ol-s-cloud/bitcoin-address-generator";
  const currentPath = location.pathname.replace(/index\.html$/, "").replace(/\/$/, "") || "/";

  document.querySelectorAll(".site-header").forEach((header, headerIndex) => {
    const nav = header.querySelector("nav");
    if (!nav) return;

    nav.innerHTML = coreNavigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join("") +
      `<a href="${githubUrl}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`;

    const navId = nav.id || `site-navigation-${headerIndex + 1}`;
    nav.id = navId;
    nav.querySelectorAll("a[href]").forEach((link) => {
      const url = new URL(link.href, location.href);
      const linkPath = url.pathname.replace(/index\.html$/, "").replace(/\/$/, "") || "/";
      if (url.origin === location.origin && linkPath === currentPath) link.setAttribute("aria-current", "page");
    });

    let themeButton = nav.querySelector(".theme-toggle");
    if (!themeButton) {
      themeButton = document.createElement("button");
      themeButton.className = "theme-toggle";
      themeButton.type = "button";
      nav.appendChild(themeButton);
    }
    themeButton.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
    applyTheme(root.dataset.theme);

    let toggle = header.querySelector(".nav-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Open navigation");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", navId);
      toggle.innerHTML = "<span></span><span></span><span></span>";
      header.insertBefore(toggle, nav);
    }
    const closeNavigation = () => {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    };
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeNavigation(); });
    document.addEventListener("click", (event) => { if (!header.contains(event.target)) closeNavigation(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 920) closeNavigation(); });
  });

  const oldPlus = document.querySelector("section.sovereignty#cobra-plus");
  if (oldPlus) {
    oldPlus.id = "cobra-core";
    const eyebrow = oldPlus.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = "COBRA CORE";
  }

  function buildGlobalFooter() {
    if (document.getElementById("cobraGlobalFooter")) return;
    document.querySelectorAll("body > footer, main > footer").forEach((footer) => footer.remove());
    const footer = document.createElement("footer");
    footer.id = "cobraGlobalFooter";
    footer.className = "cobra-global-footer";
    footer.innerHTML = `
      <div class="cobra-footer-grid">
        <div class="cobra-footer-brand">
          <strong>COBRA</strong>
          <p>Cryptographic, energy and compute infrastructure by ol-s-cloud. Public tools remain open; private operating capabilities sit behind COBRA+.</p>
        </div>
        <div class="cobra-footer-col"><strong>PRODUCT</strong>
          <a href="/explorer-v2-terminal.html">Explorer</a><a href="/plus.html">COBRA+</a><a href="/store.html">Store</a><a href="/services.html">Services</a><a href="/calculators.html">Calculators</a>
        </div>
        <div class="cobra-footer-col"><strong>CRYPTOGRAPHY</strong>
          <a href="/#tools">Create</a><a href="/offline.html">Offline</a><a href="/cli.html">CLI</a><a href="/docs.html">Docs</a><a href="${githubUrl}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
        <div class="cobra-footer-col"><strong>INTELLIGENCE</strong>
          <a href="/explorer-v2-terminal.html">Bitcoin & Mining</a><a href="/explorer-v2-terminal.html">Power & Grid</a><a href="/explorer-v2-terminal.html">Compute</a><a href="/explorer-v2-terminal.html">Generation</a><a href="/explorer-v2-terminal.html">Home & Flex</a>
        </div>
        <div class="cobra-footer-col"><strong>BUILD & RESEARCH</strong>
          <a href="/research.html">Research</a><a href="/#developers">Build on COBRA</a><a href="/SECURITY.md">Security</a><a href="/terms.html">Terms</a><a href="/calculators.html#reference">Reference tools</a>
        </div>
      </div>
      <div class="cobra-footer-bottom"><span>COBRA by ol-s-cloud · First rollout 2023 · Updated 2026</span><span>Public references and manufacturer names do not imply partnership unless stated.</span></div>`;
    document.body.appendChild(footer);
  }

  buildGlobalFooter();
})();

(() => {
  if (!location.pathname.endsWith("/explorer-v2-terminal.html")) return;
  ["/explorer-v2-applications.css", "/explorer-v2-live-depth.css", "/explorer-v2-plus.css"].forEach((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
  ["/explorer-v2-decision.js", "/explorer-v2-scenarios.js", "/explorer-v2-home-data.js", "/explorer-v2-applications.js", "/explorer-v2-live-depth.js", "/explorer-v2-plus.js"].forEach((src) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();