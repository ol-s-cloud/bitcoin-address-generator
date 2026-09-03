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

  const VOTER_KEY = "cobra-global-voter-id-v1";
  const pollControllers = [];

  const randomUuid = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  };

  const voterId = () => {
    try {
      const saved = localStorage.getItem(VOTER_KEY);
      if (/^[0-9a-f-]{36}$/i.test(saved || "")) return saved;
      const created = randomUuid();
      localStorage.setItem(VOTER_KEY, created);
      return created;
    } catch {
      return randomUuid();
    }
  };

  const readChoice = (key, options) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      if (options.some((option) => option.slug === raw)) return raw;
      const legacyOption = options.find((option) => option.label === raw);
      if (legacyOption) return legacyOption.slug;
      const legacy = JSON.parse(raw);
      return (
        options.find((option) => option.label === legacy?.voted)?.slug || null
      );
    } catch {
      return null;
    }
  };

  const initialisePoll = ({
    slug,
    key,
    options,
    targetId,
    stateId,
    noteId,
  }) => {
    const target = document.getElementById(targetId);
    const stateTarget = document.getElementById(stateId);
    const note = document.getElementById(noteId);
    if (!target || !stateTarget || !note) return;

    let selected = readChoice(key, options);
    let serverPoll = null;
    let syncing = false;
    let unavailable = false;

    const render = () => {
      const results = new Map(
        (serverPoll?.options || []).map((option) => [option.slug, option]),
      );
      const totalVotes = Number(serverPoll?.totalVotes || 0);
      stateTarget.textContent = serverPoll
        ? `${totalVotes.toLocaleString()} global vote${totalVotes === 1 ? "" : "s"}`
        : unavailable
          ? "Connection unavailable"
          : "Connecting…";
      target.innerHTML = options
        .map((option) => {
          const active = selected === option.slug;
          const votes = Number(results.get(option.slug)?.votes || 0);
          const share = totalVotes ? (votes / totalVotes) * 100 : 0;
          const resultLabel = serverPoll
            ? `${votes.toLocaleString()} · ${share.toFixed(totalVotes ? 1 : 0)}%`
            : active
              ? "Selected"
              : "Choose";
          return `<button class="poll-option${active ? " selected" : ""}" type="button" data-choice="${escapeHtml(option.slug)}" aria-pressed="${active}"${syncing ? " disabled" : ""}><span class="poll-name">${escapeHtml(option.label)}</span><span class="poll-choice">${resultLabel}</span><span class="poll-bar" style="--poll:${share.toFixed(2)}%"></span></button>`;
        })
        .join("");
      const selectedLabel = options.find(
        (option) => option.slug === selected,
      )?.label;
      note.textContent = syncing
        ? "Recording your vote…"
        : unavailable
          ? "Global voting is temporarily unavailable. Choose an option to retry."
          : selectedLabel
            ? `Your vote: ${selectedLabel}. Choose another option to update it.`
            : "Cast one anonymous vote. You can update it from this device.";

      target.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", async () => {
          selected = button.dataset.choice;
          try {
            localStorage.setItem(key, selected);
          } catch {
            // The choice still applies to the current page view.
          }
          syncing = true;
          unavailable = false;
          render();
          try {
            const response = await fetch("/api/polls", {
              method: "POST",
              credentials: "same-origin",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                poll: slug,
                option: selected,
                voterId: voterId(),
              }),
            });
            if (!response.ok) throw new Error("Vote unavailable");
            const data = await response.json();
            updatePolls(data.polls || {});
          } catch {
            unavailable = true;
          } finally {
            syncing = false;
            render();
          }
        });
      });
    };

    const controller = {
      slug,
      setData(data) {
        serverPoll = data || null;
        unavailable = !data;
        render();
      },
    };
    pollControllers.push(controller);
    render();
  };

  const updatePolls = (polls) => {
    for (const controller of pollControllers) {
      controller.setData(polls[controller.slug]);
    }
  };

  async function loadPolls() {
    try {
      const response = await fetch("/api/polls", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Polls unavailable");
      const data = await response.json();
      updatePolls(data.polls || {});
    } catch {
      updatePolls({});
    }
  }

  initialisePoll({
    slug: "next-network",
    key: "cobra-next-network-poll-v1",
    options: [
      { slug: "ethereum-evm", label: "Ethereum (EVM Ecosystem)" },
      { slug: "solana", label: "Solana" },
      { slug: "litecoin", label: "Litecoin" },
      { slug: "other", label: "Other / Suggest" },
    ],
    targetId: "networkPollOptions",
    stateId: "networkPollState",
    noteId: "networkPollNote",
  });

  initialisePoll({
    slug: "next-feature",
    key: "cobra-next-feature-poll-v1",
    options: [
      { slug: "onchain-privacy", label: "Onchain privacy" },
      { slug: "wallet-systems", label: "Wallet systems" },
      { slug: "cold-storage", label: "Cold-storage integrations" },
      { slug: "cross-border-payments", label: "COBRA cross-border payments" },
      { slug: "offline", label: "Offline functionality" },
      { slug: "api-sdk", label: "Public API & SDK" },
      { slug: "mining-intelligence", label: "COBRA Mining & Intelligence" },
    ],
    targetId: "featurePollOptions",
    stateId: "featurePollState",
    noteId: "featurePollNote",
  });

  loadNews();
  loadPolls();
})();
