import { getPublicKey } from "https://esm.sh/@noble/secp256k1@1.7.1";
import { sha256 } from "https://esm.sh/@noble/hashes@1.3.3/sha256";
import { ripemd160 } from "https://esm.sh/@noble/hashes@1.3.3/ripemd160";
const $ = (id) => document.getElementById(id);
const tabs = [...document.querySelectorAll(".tab")],
  panels = { random: $("panel-random"), bitcoin: $("panel-bitcoin") };
const randomType = $("randomType"),
  lengthField = $("lengthField"),
  integerFields = $("integerFields"),
  byteLength = $("byteLength"),
  minValue = $("minValue"),
  maxValue = $("maxValue"),
  randomOutput = $("randomOutput"),
  privateKeyInput = $("privateKeyInput"),
  privateKeyOut = $("privateKeyOut"),
  publicKeyOut = $("publicKeyOut"),
  hash160Out = $("hash160Out"),
  wifOut = $("wifOut"),
  addressOut = $("addressOut"),
  explorerLink = $("explorerLink"),
  activityList = $("activityList"),
  liveActivity = $("liveActivity"),
  metricTotal = $("metricTotal"),
  metricSession = $("metricSession");
let lastRandomHex = "",
  currentWallet = null,
  sessionGenerated = 0;
const CURVE_N = BigInt(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  ),
  LOG_KEY = "cobra-public-address-log-v1";
const explorerUrl = (address) =>
  `https://www.blockchain.com/explorer/addresses/btc/${address}`;
for (const tab of tabs)
  tab.addEventListener("click", () => {
    const selected = tab.dataset.tab;
    for (const item of tabs) {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    }
    for (const [key, panel] of Object.entries(panels)) {
      const active = key === selected;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    }
  });
randomType.addEventListener("change", syncRandomFields);
$("generateRandom").addEventListener("click", generateRandom);
$("generateBitcoin").addEventListener("click", () =>
  deriveAndRender(generateValidPrivateKey(), true),
);
$("deriveAddress").addEventListener("click", () =>
  deriveAndRender(normalizePrivateKey(privateKeyInput.value), true),
);
$("useRandomAsKey").addEventListener("click", () => {
  if (!lastRandomHex || lastRandomHex.length !== 64) {
    alert(
      "Generate a 32-byte hexadecimal value in the Random Generator first.",
    );
    return;
  }
  deriveAndRender(normalizePrivateKey(lastRandomHex), true);
});
$("downloadRecovery").addEventListener("click", downloadRecoveryKit);
$("clearLog").addEventListener("click", () => {
  localStorage.removeItem(LOG_KEY);
  renderLog();
});
document.querySelectorAll("[data-copy]").forEach((button) =>
  button.addEventListener("click", async () => {
    const target = $(button.dataset.copy),
      value = target?.textContent?.trim();
    if (!value || value === "—") return;
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => (button.textContent = original), 1200);
  }),
);
const shareText =
  "COBRA — Cryptographic Oracle for Bytes, Randomness & Addresses. Free Bitcoin cryptography and address research tools.";
const xUrl = () =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
$("shareX").href = xUrl();
$("shareXBottom").href = xUrl();
$("shareButton").addEventListener("click", async () => {
  const shareData = {
    title: "COBRA",
    text: shareText,
    url: window.location.href,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard.");
  }
});
syncRandomFields();
renderLog();
setInterval(renderRelativeTimes, 1000);
function syncRandomFields() {
  const type = randomType.value;
  integerFields.hidden = type !== "integer";
  lengthField.hidden = type === "integer" || type === "uuid";
}
function generateRandom() {
  const type = randomType.value;
  let output = "";
  if (type === "uuid") output = crypto.randomUUID();
  else if (type === "integer") {
    const min = Number(minValue.value),
      max = Number(maxValue.value);
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) {
      alert(
        "Use safe integer values with maximum greater than or equal to minimum.",
      );
      return;
    }
    output = String(randomInteger(min, max));
  } else {
    const length = Math.max(1, Math.min(4096, Number(byteLength.value) || 32));
    byteLength.value = String(length);
    const bytes = secureBytes(length);
    if (type === "hex") {
      output = bytesToHex(bytes);
      if (length === 32) lastRandomHex = output;
    } else output = [...bytes].join(" ");
  }
  randomOutput.textContent = output;
}
function randomInteger(min, max) {
  const range = max - min + 1;
  if (range <= 0 || range > 0x100000000)
    throw new Error(
      "Integer range must fit within 32 bits for unbiased generation.",
    );
  const limit = Math.floor(0x100000000 / range) * range,
    array = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return min + (value % range);
}
function secureBytes(length) {
  const bytes = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += 65536)
    crypto.getRandomValues(
      bytes.subarray(offset, Math.min(offset + 65536, length)),
    );
  return bytes;
}
function generateValidPrivateKey() {
  while (true) {
    const bytes = secureBytes(32),
      value = BigInt(`0x${bytesToHex(bytes)}`);
    if (value > 0n && value < CURVE_N) return bytesToHex(bytes);
  }
}
function normalizePrivateKey(value) {
  const clean = String(value || "")
    .trim()
    .replace(/^0x/i, "")
    .toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    alert("Private key must be exactly 64 hexadecimal characters.");
    return null;
  }
  const scalar = BigInt(`0x${clean}`);
  if (scalar <= 0n || scalar >= CURVE_N) {
    alert("Private key is outside the valid secp256k1 scalar range.");
    return null;
  }
  return clean;
}
function deriveAndRender(privateHex, logAddress = false) {
  if (!privateHex) return;
  try {
    const privateBytes = hexToBytes(privateHex),
      publicKey = getPublicKey(privateBytes, true),
      hash160 = ripemd160(sha256(publicKey));
    const versioned = new Uint8Array(21);
    versioned[0] = 0;
    versioned.set(hash160, 1);
    const address = base58Check(versioned);
    const wifPayload = new Uint8Array(34);
    wifPayload[0] = 0x80;
    wifPayload.set(privateBytes, 1);
    wifPayload[33] = 0x01;
    const wif = base58Check(wifPayload);
    currentWallet = {
      privateKey: privateHex,
      wif,
      publicKey: bytesToHex(publicKey),
      hash160: bytesToHex(hash160),
      address,
      createdAt: new Date().toISOString(),
      type: "P2PKH mainnet",
    };
    privateKeyInput.value = privateHex;
    privateKeyOut.textContent = privateHex;
    publicKeyOut.textContent = currentWallet.publicKey;
    hash160Out.textContent = currentWallet.hash160;
    wifOut.textContent = wif;
    addressOut.textContent = address;
    explorerLink.href = explorerUrl(address);
    explorerLink.classList.remove("disabled");
    if (logAddress) {
      const added = addPublicLog(address);
      if (added) sessionGenerated++;
    }
    renderLog();
  } catch (error) {
    console.error(error);
    alert(
      "Could not derive the address. Please try another valid private key.",
    );
  }
}
function addPublicLog(address) {
  const log = getLog();
  if (log.some((x) => x.address === address)) return false;
  log.unshift({
    address,
    createdAt: new Date().toISOString(),
    type: "P2PKH mainnet",
  });
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 100)));
  return true;
}
function getLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
function renderLog() {
  const log = getLog();
  metricTotal.textContent = String(log.length);
  metricSession.textContent = String(sessionGenerated);
  if (!log.length) {
    activityList.innerHTML =
      '<div class="empty-state">Generate a Bitcoin address to begin your local activity log.</div>';
    liveActivity.innerHTML =
      '<div class="empty-state">Generate an address to see live activity.</div>';
    return;
  }
  activityList.innerHTML = log
    .map(
      (item) =>
        `<article><div><strong>${shorten(item.address)}</strong><span><time data-time="${item.createdAt}">${relativeTime(item.createdAt)}</time> · ${item.type}</span></div><a href="${explorerUrl(item.address)}" target="_blank" rel="noopener noreferrer">Blockchain.com ↗</a></article>`,
    )
    .join("");
  liveActivity.innerHTML = log
    .slice(0, 8)
    .map(
      (item) =>
        `<article><span class="pulse"></span><div><strong>${shorten(item.address)}</strong><small>generated <time data-time="${item.createdAt}">${relativeTime(item.createdAt)}</time></small></div><a href="${explorerUrl(item.address)}" target="_blank" rel="noopener noreferrer" aria-label="Open address on Blockchain.com Explorer">↗</a></article>`,
    )
    .join("");
}
function renderRelativeTimes() {
  document
    .querySelectorAll("time[data-time]")
    .forEach((el) => (el.textContent = relativeTime(el.dataset.time)));
}
function relativeTime(value) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
function shorten(v) {
  return v.length > 22 ? `${v.slice(0, 12)}…${v.slice(-8)}` : v;
}
function downloadRecoveryKit() {
  if (!currentWallet) {
    alert("Generate or derive an address first.");
    return;
  }
  const text = `COBRA RECOVERY KIT\nSecret material — store securely\nCreated: ${currentWallet.createdAt}\nAddress type: ${currentWallet.type}\n\nBITCOIN ADDRESS\n${currentWallet.address}\n\nPRIVATE KEY — SECRET\n${currentWallet.privateKey}\n\nWIF — SECRET\n${currentWallet.wif}\n\nCOMPRESSED PUBLIC KEY\n${currentWallet.publicKey}\n\nHASH160\n${currentWallet.hash160}\n\nExplorer\n${explorerUrl(currentWallet.address)}\n\nWARNING\nAnyone with the private key or WIF can potentially control funds associated with this address. COBRA does not retain a backup. Store this file securely.\n`;
  const blob = new Blob([text], { type: "text/plain" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `cobra-recovery-${currentWallet.address}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
function base58Check(payload) {
  const checksum = sha256(sha256(payload)).slice(0, 4),
    full = new Uint8Array(payload.length + 4);
  full.set(payload, 0);
  full.set(checksum, payload.length);
  return base58Encode(full);
}
function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  return Uint8Array.from(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
  );
}
function base58Encode(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) + BigInt(byte);
  let encoded = "";
  while (value > 0n) {
    const remainder = Number(value % 58n);
    encoded = alphabet[remainder] + encoded;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte === 0) encoded = "1" + encoded;
    else break;
  }
  return encoded || "1";
}
