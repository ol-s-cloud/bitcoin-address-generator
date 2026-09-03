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

  const newsCard = (item, featured = false) => {
    const source = escapeHtml(item.source || "Source");
    const sourceKey = source.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<a class="news-card${featured ? " featured" : ""}" data-source="${sourceKey}" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
      <div class="news-meta"><span>${source}</span><time>${relativeTime(item.published)}</time></div>
      <h3>${escapeHtml(item.title)}</h3>
      <span class="news-open">Read original ↗</span>
    </a>`;
  };

  async function loadNews() {
    const featuredTarget = document.getElementById("newsFeatured");
    const railTarget = document.getElementById("newsRail");
    const updatedTarget = document.getElementById("newsUpdated");
    if (!featuredTarget || !railTarget || !updatedTarget) return;

    try {
      const response = await fetch("/api/news", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("News unavailable");
      const data = await response.json();
      if (!Array.isArray(data.items) || data.items.length < 2) {
        throw new Error("Not enough headlines");
      }

      const featured = [];
      for (const source of ["CoinDesk", "The Block"]) {
        const match = data.items.find(
          (item) =>
            item.source === source &&
            !featured.some((selected) => selected.link === item.link),
        );
        if (match) featured.push(match);
      }
      for (const item of data.items) {
        if (featured.length === 2) break;
        if (!featured.some((selected) => selected.link === item.link)) {
          featured.push(item);
        }
      }

      const featuredLinks = new Set(featured.map((item) => item.link));
      const remaining = data.items
        .filter((item) => !featuredLinks.has(item.link))
        .slice(0, 12);

      featuredTarget.innerHTML = featured
        .map((item) => newsCard(item, true))
        .join("");
      railTarget.innerHTML = remaining.map((item) => newsCard(item)).join("");
      updatedTarget.textContent = `Updated ${relativeTime(data.updatedAt)}`;
    } catch {
      featuredTarget.innerHTML = `<a class="news-card featured" href="https://www.coindesk.com/latest-crypto-news/" target="_blank" rel="noopener noreferrer"><div class="news-meta"><span>CoinDesk</span><time>Latest</time></div><h3>Open the latest Bitcoin and digital-asset reporting.</h3><span class="news-open">Open source ↗</span></a><a class="news-card featured" href="https://www.theblock.co/latest" target="_blank" rel="noopener noreferrer"><div class="news-meta"><span>The Block</span><time>Latest</time></div><h3>Open the latest blockchain ecosystem reporting.</h3><span class="news-open">Open source ↗</span></a>`;
      railTarget.innerHTML = "";
      updatedTarget.textContent = "Direct sources";
    }
  }

  const rail = document.getElementById("newsRail");
  document.getElementById("newsPrev")?.addEventListener("click", () => {
    rail?.scrollBy({ left: -Math.max(260, rail.clientWidth * 0.8), behavior: "smooth" });
  });
  document.getElementById("newsNext")?.addEventListener("click", () => {
    rail?.scrollBy({ left: Math.max(260, rail.clientWidth * 0.8), behavior: "smooth" });
  });

  const POLL_KEY = "cobra-privacy-poll-v1";
  const baseline = { Yes: 2139, No: 527, Unsure: 265 };
  let selected = null;
  try {
    const stored = localStorage.getItem(POLL_KEY);
    selected = Object.hasOwn(baseline, stored) ? stored : null;
  } catch {
    selected = null;
  }

  const renderPoll = () => {
    const target = document.getElementById("pollOptions");
    const totalTarget = document.getElementById("pollTotal");
    const note = document.getElementById("pollNote");
    if (!target || !totalTarget || !note) return;

    const counts = { ...baseline };
    if (selected) counts[selected] += 1;
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    totalTarget.textContent = `${total.toLocaleString()} votes`;
    target.innerHTML = Object.entries(counts)
      .map(([name, count]) => {
        const percentage = Math.round((count / total) * 100);
        const active = name === selected;
        return `<button class="poll-option${active ? " selected" : ""}" type="button" data-choice="${name}" aria-pressed="${active}"><span class="poll-name">${name}</span><span class="poll-count">${percentage}%</span><span class="poll-bar" style="--poll:${percentage}%"></span></button>`;
      })
      .join("");
    note.textContent = selected
      ? `Your choice: ${selected}. Saved on this device.`
      : "Choose Yes, No or Unsure.";
    target.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        selected = button.dataset.choice;
        try {
          localStorage.setItem(POLL_KEY, selected);
        } catch {
          // The interaction still works for the current page view.
        }
        renderPoll();
      });
    });
  };

  renderPoll();
  loadNews();
})();
