(() => {
  const escapeHtml = (value = "") =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );

  const relativeTime = (value) => {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "Latest";
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const newsCard = (item, variant = "") => {
    const source = escapeHtml(item.source || "Source");
    const sourceKey = source.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const modifier = variant ? ` ${variant}` : "";
    return `<a class="news-card${modifier}" data-source="${sourceKey}" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
      <div class="news-meta"><span>${source}</span><time>${relativeTime(item.published)}</time></div>
      <h3>${escapeHtml(item.title)}</h3>
      <span class="news-open">Read original ↗</span>
    </a>`;
  };

  async function loadNews() {
    const latestTarget = document.getElementById("newsLatest");
    const railTarget = document.getElementById("newsRail");
    const updatedTarget = document.getElementById("newsUpdated");
    if (!latestTarget || !railTarget || !updatedTarget) return;

    try {
      const response = await fetch("/api/news", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("News unavailable");
      const data = await response.json();
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("No headlines");
      }

      const [latest, ...remaining] = data.items;
      latestTarget.innerHTML = newsCard(latest, "latest");
      railTarget.innerHTML = remaining
        .slice(0, 12)
        .map((item) => newsCard(item))
        .join("");
      updatedTarget.textContent = `Updated ${relativeTime(data.updatedAt)}`;
    } catch {
      latestTarget.innerHTML = `<a class="news-card latest" href="https://www.coindesk.com/latest-crypto-news/" target="_blank" rel="noopener noreferrer"><div class="news-meta"><span>CoinDesk</span><time>Latest</time></div><h3>Open the latest Bitcoin and digital-asset reporting.</h3><span class="news-open">Open source ↗</span></a>`;
      railTarget.innerHTML = "";
      updatedTarget.textContent = "Direct source";
    }
  }

  const rail = document.getElementById("newsRail");
  document.getElementById("newsPrev")?.addEventListener("click", () => {
    rail?.scrollBy({
      left: -Math.max(260, rail.clientWidth * 0.8),
      behavior: "smooth",
    });
  });
  document.getElementById("newsNext")?.addEventListener("click", () => {
    rail?.scrollBy({
      left: Math.max(260, rail.clientWidth * 0.8),
      behavior: "smooth",
    });
  });

  const readChoice = (key, options) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      if (options.includes(raw)) return raw;
      const legacy = JSON.parse(raw);
      return options.includes(legacy?.voted) ? legacy.voted : null;
    } catch {
      return null;
    }
  };

  const initialisePoll = ({ key, options, targetId, stateId, noteId }) => {
    const target = document.getElementById(targetId);
    const stateTarget = document.getElementById(stateId);
    const note = document.getElementById(noteId);
    if (!target || !stateTarget || !note) return;

    let selected = readChoice(key, options);
    const render = () => {
      stateTarget.textContent = selected || "No selection";
      target.innerHTML = options
        .map((name) => {
          const active = selected === name;
          return `<button class="poll-option${active ? " selected" : ""}" type="button" data-choice="${escapeHtml(name)}" aria-pressed="${active}"><span class="poll-name">${escapeHtml(name)}</span><span class="poll-choice">${active ? "Selected" : "Choose"}</span><span class="poll-bar" style="--poll:${active ? "100%" : "0%"}"></span></button>`;
        })
        .join("");
      note.textContent = selected
        ? `${selected} selected. Saved on this device.`
        : "Select one option. Your preference is saved on this device.";

      target.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          selected = button.dataset.choice;
          try {
            localStorage.setItem(key, selected);
          } catch {
            // The choice still applies to the current page view.
          }
          render();
        });
      });
    };
    render();
  };

  initialisePoll({
    key: "cobra-next-network-poll-v1",
    options: [
      "Ethereum (EVM Ecosystem)",
      "Solana",
      "Litecoin",
      "Other / Suggest",
    ],
    targetId: "networkPollOptions",
    stateId: "networkPollState",
    noteId: "networkPollNote",
  });

  initialisePoll({
    key: "cobra-next-feature-poll-v1",
    options: [
      "Onchain privacy",
      "Wallet systems",
      "Cold-storage integrations",
      "COBRA cross-border payments",
      "Offline functionality",
      "Public API & SDK",
      "COBRA Mining & Intelligence",
    ],
    targetId: "featurePollOptions",
    stateId: "featurePollState",
    noteId: "featurePollNote",
  });

  loadNews();
})();
