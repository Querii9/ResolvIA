// Translations + locale-aware formatting.
// To add a language: copy js/lang/en.js, translate it, import it below and add it to LANGS.
import { CONFIG } from "./config.js";
import { DEPARTMENTS } from "./demo-templates.js";
import ca from "./lang/ca.js";
import en from "./lang/en.js";
import es from "./lang/es.js";
import { getPrefs, setPrefs } from "./store.js";
import { DAY, HOUR, MINUTE, esc, loc } from "./utils.js";

export const LANGS = [
  { id: "ca", label: "Català" },
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];
const DICT = { ca, es, en };

let lang = "en";

export function initI18n() {
  const saved = getPrefs().lang;
  lang = DICT[saved] ? saved : DICT[CONFIG.defaultLanguage] ? CONFIG.defaultLanguage : detectLanguage();
  document.documentElement.lang = lang;
}

function detectLanguage() {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (DICT[code]) return code;
  }
  return "en";
}

export const getLang = () => lang;

export function setLang(next) {
  if (!DICT[next]) return;
  lang = next;
  setPrefs({ lang });
  document.documentElement.lang = lang;
}

/**
 * Plain-text translation (for textContent / toasts).
 * "one|other" strings pick the plural form from vars.n: "{n} ticket|{n} tickets".
 */
export function t(key, vars) {
  let text = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (text.includes("|") && typeof vars?.n === "number") {
    const [one, other] = text.split("|");
    text = new Intl.PluralRules(lang).select(vars.n) === "one" ? one : other;
  }
  if (!vars) return text;
  return text.replace(/(\bde )?\{(\w+)\}/g, (_, de = "", k) => {
    const value = String(vars[k] ?? "");
    // Catalan elision: "de Outlook" → "d'Outlook"
    return de && lang === "ca" && /^[aeiouàèéíòóú]/i.test(value) ? `d'${value}` : de + value;
  });
}

/** Same as t(), escaped so it's safe inside HTML (text and attributes). */
export const th = (key, vars) => esc(t(key, vars));

// ── Labels from config ────────────────────────────────────────────────

const find = (list, id) => list.find((x) => x.id === id);
export const catLabel = (id) => loc(find(CONFIG.categories, id)?.label, lang) || id;
export const catIcon = (id) => find(CONFIG.categories, id)?.icon ?? "file";
export const teamLabel = (id) => loc(find(CONFIG.teams, id)?.label, lang) || id || "—";
export const prioLabel = (id) => loc(find(CONFIG.priorities, id)?.label, lang) || id;
export const autoLabel = (id) => loc(find(CONFIG.automations, id)?.label, lang) || id;
export const deptLabel = (key) => loc(DEPARTMENTS[key], lang) || key || "";
export const departments = () => Object.keys(DEPARTMENTS).map((id) => ({ id, label: deptLabel(id) }));

// ── Formatting ────────────────────────────────────────────────────────

export const fmtNum = (n, digits = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(n);
export const fmtPct = (ratio) => (ratio == null ? "—" : new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 0 }).format(ratio));

/** style: "short" → "24 set." · "day" → "24 de setembre" · "long" → "Dijous, 24 de setembre" · "stamp" → "24 set., 14:32" */
export function fmtDate(date, style = "short") {
  const options = {
    short: { day: "numeric", month: "short" },
    day: { day: "numeric", month: "long" },
    long: { weekday: "long", day: "numeric", month: "long" },
    stamp: { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
  }[style];
  const text = new Intl.DateTimeFormat(lang, options).format(new Date(date));
  return style === "long" ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export const fmtTime = (date) => new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(new Date(date));

/** "fa 5 min" / "d'aquí a 2 h" / "ahir" */
export function fmtRel(date, now = Date.now()) {
  const diff = new Date(date).getTime() - now;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return t("time.now");
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  return rtf.format(Math.round(diff / DAY), "day");
}

/** Compact duration for SLA timers: "45m", "2h 14m", "3d 4h" (d = 24 h). */
export function fmtDuration(ms) {
  const total = Math.max(0, Math.round(Math.abs(ms) / MINUTE));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

/** Business hours as a readable number: 1.5 → "1,5 h" */
export const fmtHours = (h) => (h == null ? "—" : `${fmtNum(h, 1)} h`);
