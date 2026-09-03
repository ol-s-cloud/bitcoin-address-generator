(() => {
  const root = document.documentElement;
  const storageKey = "cobra-theme";

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
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // The visual preference still applies when storage is unavailable.
      }
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute(
      "content",
      theme === "light" ? "#f7f9f7" : "#050706",
    );

    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const next = theme === "dark" ? "Light" : "Dark";
      button.textContent = `${next} mode`;
      button.setAttribute("aria-label", `Switch to ${next.toLowerCase()} mode`);
    });
  };

  const savedTheme = readPreference();
  applyTheme(savedTheme || "light");

  const currentPath =
    location.pathname.replace(/index\.html$/, "").replace(/\/$/, "") || "/";

  document.querySelectorAll(".site-header").forEach((header, headerIndex) => {
    const nav = header.querySelector("nav");
    if (!nav) return;

    const navId = nav.id || `site-navigation-${headerIndex + 1}`;
    nav.id = navId;

    nav.querySelectorAll("a[href]").forEach((link) => {
      const url = new URL(link.href, location.href);
      const linkPath =
        url.pathname.replace(/index\.html$/, "").replace(/\/$/, "") || "/";
      if (url.origin === location.origin && linkPath === currentPath) {
        link.setAttribute("aria-current", "page");
      }
    });

    let themeButton = nav.querySelector(".theme-toggle");
    if (!themeButton) {
      themeButton = document.createElement("button");
      themeButton.className = "theme-toggle";
      themeButton.type = "button";
      nav.appendChild(themeButton);
    }
    themeButton.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
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
      toggle.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation",
      );
    });

    nav
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", closeNavigation));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeNavigation();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) closeNavigation();
    });
  });
})();
