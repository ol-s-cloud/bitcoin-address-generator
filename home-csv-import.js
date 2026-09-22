(() => {
  const form = document.getElementById("intervalImportForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById("intervalFile");
    const status = document.getElementById("intervalImportStatus");
    const button = form.querySelector("button[type='submit']");
    const file = fileInput?.files?.[0];
    if (!file) return setStatus("Choose a CSV file first.");

    button.disabled = true;
    setStatus("Reading CSV…");
    try {
      const snapshot = await getSnapshot();
      const siteId = snapshot?.site?.id;
      if (!siteId) throw new Error("Home site not found.");

      const text = await file.text();
      const rows = parseEnergyCsv(text);
      if (!rows.length) throw new Error("No usable interval readings were found.");

      const fuel = document.getElementById("intervalFuel")?.value || "electricity";
      const direction = document.getElementById("intervalDirection")?.value || "import";
      let imported = 0;
      const batchSize = 20;
      for (let index = 0; index < rows.length; index += batchSize) {
        const batch = rows.slice(index, index + batchSize);
        setStatus(`Importing ${Math.min(index + batch.length, rows.length)} of ${rows.length}…`);
        const response = await fetch("/api/registry", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "home_interval_import",
            siteId,
            fuel,
            direction,
            rows: batch,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace("/home-auth.html");
          return;
        }
        if (!response.ok) throw new Error(importError(data.error));
        imported += Number(data.imported || 0);
      }

      setStatus(`Imported ${imported.toLocaleString()} interval readings.`);
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      setStatus(error?.message || "Could not import this CSV.");
    } finally {
      button.disabled = false;
    }

    function setStatus(message) {
      if (status) status.textContent = message;
    }
  });

  async function getSnapshot() {
    const response = await fetch("/api/registry?mode=home_snapshot", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 401) {
      location.replace("/home-auth.html");
      return null;
    }
    if (!response.ok) throw new Error("COBRA Home data could not be loaded.");
    return response.json();
  }

  function parseEnergyCsv(text) {
    const clean = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!clean) return [];
    const lines = clean.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseLine(lines[0], delimiter).map(normalizeHeader);
    const timeIndex = findHeader(headers, [
      "interval_start", "intervalstart", "timestamp", "datetime", "date_time", "start", "from",
    ]);
    const valueIndex = findHeader(headers, [
      "consumption_kwh", "consumption", "quantity_kwh", "quantity", "usage_kwh", "usage", "energy_kwh", "energy", "kwh",
    ]);
    const intervalIndex = findHeader(headers, ["interval_minutes", "intervalminutes", "minutes"]);

    if (timeIndex < 0 || valueIndex < 0) {
      throw new Error("CSV needs a timestamp column and a consumption/energy column.");
    }

    const output = [];
    for (let i = 1; i < lines.length; i += 1) {
      const columns = parseLine(lines[i], delimiter);
      const timestamp = parseTimestamp(columns[timeIndex]);
      const quantity = parseNumber(columns[valueIndex]);
      const intervalMinutes = intervalIndex >= 0 ? parseNumber(columns[intervalIndex]) : 30;
      if (!timestamp || quantity === null || quantity < 0) continue;
      output.push({
        intervalStart: timestamp,
        quantityKwh: quantity,
        intervalMinutes: intervalMinutes && intervalMinutes > 0 ? intervalMinutes : 30,
      });
    }

    output.sort((a, b) => new Date(a.intervalStart) - new Date(b.intervalStart));
    return dedupe(output);
  }

  function detectDelimiter(header) {
    const candidates = [",", "\t", ";"];
    return candidates.sort((a, b) => header.split(b).length - header.split(a).length)[0];
  }

  function parseLine(line, delimiter) {
    const values = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function findHeader(headers, accepted) {
    for (const name of accepted) {
      const index = headers.indexOf(name);
      if (index >= 0) return index;
    }
    return -1;
  }

  function parseTimestamp(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    const direct = new Date(text);
    if (!Number.isNaN(direct.getTime())) return direct.toISOString();

    const uk = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!uk) return null;
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = uk;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function parseNumber(value) {
    const text = String(value ?? "").trim().replace(/,/g, "");
    if (!text) return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function dedupe(rows) {
    const map = new Map();
    rows.forEach((row) => map.set(row.intervalStart, row));
    return [...map.values()];
  }

  function importError(code) {
    return ({
      invalid_interval_batch: "COBRA could not validate this interval batch.",
      home_site_not_found: "COBRA Home site not found.",
      payload_too_large: "The CSV batch exceeded the current import limit.",
    })[code] || "COBRA could not store this interval batch.";
  }
})();
