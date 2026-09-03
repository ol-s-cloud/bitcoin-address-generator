(() => {
  const tabs = [...document.querySelectorAll(".network-tab")];
  const state = {
    testnet: { addresses: 0, transactions: 0, received: "0 BTC", active: 0 },
    mainnet: { addresses: 0, transactions: 0, received: "0 BTC", active: 0 },
  };

  function render(network) {
    const data = state[network];
    document.getElementById("exAddresses").textContent = data.addresses;
    document.getElementById("exTransactions").textContent = data.transactions;
    document.getElementById("exReceived").textContent = data.received;
    document.getElementById("exActive").textContent = data.active;
    document.getElementById("explorerActivity").innerHTML =
      `No public COBRA addresses are recorded on Bitcoin ${network === "testnet" ? "Testnet" : "Mainnet"}.<br>` +
      "<small>The shared registry is a roadmap capability and is not connected.</small>";
  }

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      render(tab.dataset.network);
    }),
  );

  render("testnet");
})();
