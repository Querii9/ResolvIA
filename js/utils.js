// Small shared helpers. Everything here is pure except downloadFile().

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole calendar days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY);
}

export function isoDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape any value before putting it into HTML. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Lowercase, strip accents and punctuation: "Contrasenya caducada!" → "contrasenya caducada". */
export function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const round = (n, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const sum = (list, fn = (x) => x) => list.reduce((total, x) => total + fn(x), 0);
export const avg = (list, fn = (x) => x) => (list.length ? sum(list, fn) / list.length : 0);

/** Localised value: { ca, es, en } → string for `lang`; plain strings pass through. */
export function loc(value, lang) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.en ?? Object.values(value)[0] ?? "";
}

/**
 * Tiny, safe Markdown subset: paragraphs, ### headings, lists, **bold**, *italic*, `code`.
 * Numbered lists get `data-steps` so guides can render them as a checklist.
 */
export function mdLite(source) {
  const inline = (s) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");

  let html = "";
  let list = null;
  for (const raw of esc(source).split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      if (list !== type) {
        if (list) html += `</${list}>`;
        html += type === "ol" ? `<ol data-steps>` : `<ul>`;
        list = type;
      }
      html += `<li>${inline((bullet || numbered)[1])}</li>`;
      continue;
    }
    if (list) {
      html += `</${list}>`;
      list = null;
    }
    if (!line.trim() || /^-{3,}$/.test(line.trim())) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    html += heading ? `<h4>${inline(heading[1])}</h4>` : `<p>${inline(line)}</p>`;
  }
  if (list) html += `</${list}>`;
  return html;
}

export function downloadFile(filename, content, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Deterministic pseudo-random generator (same seed → same demo data). */
export function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Initials for avatars: "Laia Puig Serra" → "LP". */
export const initials = (name) =>
  String(name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
