import { getPublicKey } from 'https://esm.sh/@noble/secp256k1@1.7.1';
import { sha256 } from 'https://esm.sh/@noble/hashes@1.3.3/sha256';
import { ripemd160 } from 'https://esm.sh/@noble/hashes@1.3.3/ripemd160';

const tabs = [...document.querySelectorAll('.tab')];
const panels = {
  random: document.getElementById('panel-random'),
  bitcoin: document.getElementById('panel-bitcoin')
};

const randomType = document.getElementById('randomType');
const lengthField = document.getElementById('lengthField');
const integerFields = document.getElementById('integerFields');
const byteLength = document.getElementById('byteLength');
const minValue = document.getElementById('minValue');
const maxValue = document.getElementById('maxValue');
const randomOutput = document.getElementById('randomOutput');
const privateKeyInput = document.getElementById('privateKeyInput');
const privateKeyOut = document.getElementById('privateKeyOut');
const publicKeyOut = document.getElementById('publicKeyOut');
const hash160Out = document.getElementById('hash160Out');
const addressOut = document.getElementById('addressOut');

let lastRandomHex = '';
const CURVE_N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    const selected = tab.dataset.tab;
    for (const item of tabs) {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    }
    for (const [key, panel] of Object.entries(panels)) {
      const active = key === selected;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    }
  });
}

randomType.addEventListener('change', syncRandomFields);
document.getElementById('generateRandom').addEventListener('click', generateRandom);
document.getElementById('generateBitcoin').addEventListener('click', () => deriveAndRender(generateValidPrivateKey()));
document.getElementById('deriveAddress').addEventListener('click', () => deriveAndRender(normalizePrivateKey(privateKeyInput.value)));
document.getElementById('useRandomAsKey').addEventListener('click', () => {
  if (!lastRandomHex || lastRandomHex.length !== 64) {
    alert('Generate a 32-byte hexadecimal value in the Random Generator first.');
    return;
  }
  deriveAndRender(normalizePrivateKey(lastRandomHex));
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy);
    const value = target?.textContent?.trim();
    if (!value || value === '—') return;
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => (button.textContent = original), 1200);
  });
});

document.getElementById('shareButton').addEventListener('click', async () => {
  const shareData = {
    title: 'Entropy Lab',
    text: 'Free browser-based random generator and educational Bitcoin address lab.',
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard.');
  }
});

syncRandomFields();

function syncRandomFields() {
  const type = randomType.value;
  integerFields.hidden = type !== 'integer';
  lengthField.hidden = type === 'integer' || type === 'uuid';
}

function generateRandom() {
  const type = randomType.value;
  let output = '';

  if (type === 'uuid') {
    output = crypto.randomUUID();
  } else if (type === 'integer') {
    const min = Number(minValue.value);
    const max = Number(maxValue.value);
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) {
      alert('Use safe integer values with maximum greater than or equal to minimum.');
      return;
    }
    output = String(randomInteger(min, max));
  } else {
    const length = Math.max(1, Math.min(4096, Number(byteLength.value) || 32));
    byteLength.value = String(length);
    const bytes = secureBytes(length);
    if (type === 'hex') {
      output = bytesToHex(bytes);
      if (length === 32) lastRandomHex = output;
    } else {
      output = [...bytes].join(' ');
    }
  }

  randomOutput.textContent = output;
}

function randomInteger(min, max) {
  const range = max - min + 1;
  if (range <= 0 || range > 0x100000000) {
    throw new Error('Integer range must fit within 32 bits for unbiased generation.');
  }
  const maxUint = 0x100000000;
  const limit = Math.floor(maxUint / range) * range;
  const array = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return min + (value % range);
}

function secureBytes(length) {
  const bytes = new Uint8Array(length);
  const chunkSize = 65536;
  for (let offset = 0; offset < length; offset += chunkSize) {
    crypto.getRandomValues(bytes.subarray(offset, Math.min(offset + chunkSize, length)));
  }
  return bytes;
}

function generateValidPrivateKey() {
  while (true) {
    const bytes = secureBytes(32);
    const value = BigInt(`0x${bytesToHex(bytes)}`);
    if (value > 0n && value < CURVE_N) return bytesToHex(bytes);
  }
}

function normalizePrivateKey(value) {
  const clean = String(value || '').trim().replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    alert('Private key must be exactly 64 hexadecimal characters.');
    return null;
  }
  const scalar = BigInt(`0x${clean}`);
  if (scalar <= 0n || scalar >= CURVE_N) {
    alert('Private key is outside the valid secp256k1 scalar range.');
    return null;
  }
  return clean;
}

function deriveAndRender(privateHex) {
  if (!privateHex) return;

  try {
    const privateBytes = hexToBytes(privateHex);
    const publicKey = getPublicKey(privateBytes, true);
    const hash160 = ripemd160(sha256(publicKey));
    const versioned = new Uint8Array(1 + hash160.length);
    versioned[0] = 0x00;
    versioned.set(hash160, 1);
    const checksum = sha256(sha256(versioned)).slice(0, 4);
    const payload = new Uint8Array(versioned.length + checksum.length);
    payload.set(versioned, 0);
    payload.set(checksum, versioned.length);
    const address = base58Encode(payload);

    privateKeyInput.value = privateHex;
    privateKeyOut.textContent = privateHex;
    publicKeyOut.textContent = bytesToHex(publicKey);
    hash160Out.textContent = bytesToHex(hash160);
    addressOut.textContent = address;
  } catch (error) {
    console.error(error);
    alert('Could not derive the address. Please try another valid private key.');
  }
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) + BigInt(byte);

  let encoded = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    encoded = alphabet[remainder] + encoded;
    value /= 58n;
  }

  for (const byte of bytes) {
    if (byte === 0) encoded = '1' + encoded;
    else break;
  }
  return encoded || '1';
}
