// Settings: AI provider & key, proactive AI autonomy, SLA, language/theme, data.
import { CONFIG } from "../config.js";
import { aiErrorMessage, modelLabel, testConnection } from "../ai.js";
import { buildDemoData, translateDemo } from "../demo-data.js";
import { LANGS, catLabel, getLang, prioLabel, setLang, t, teamLabel, th } from "../i18n.js";
import { ticketSla } from "../sla.js";
import {
  exportJSON,
  getApiKey,
  getAutonomy,
  getModel,
  getPrefs,
  getProvider,
  getSla,
  getState,
  getUser,
  hasApiKey,
  mutate,
  replaceAll,
  setApiKey,
  setAutonomy,
  setModel,
  setPrefs,
  setProvider,
  setSla,
} from "../store.js";
import { aiTag, confirmDialog, icon, on, openModal, rerender, toast, withBusy } from "../ui.js";
import { HOUR, downloadFile, esc, isoDate, round } from "../utils.js";

let modal = null;
let tab = "ai";

export function openSettings(start = tab) {
  tab = start;
  modal?.close();
  modal = openModal({ title: th("settings.title"), size: "wide", body: body(), onClose: () => (modal = null) });
}

function refresh() {
  if (modal) modal.body.innerHTML = body();
}

const mask = (key) => `${key.slice(0, 7)}…${key.slice(-4)}`;
const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`;

function body() {
  const tabs = ["ai", "sla", "general", "data"];
  return `
    <div class="settings">
      <nav class="settings-nav" role="tablist">
        ${tabs.map((x) => `<button type="button" role="tab" aria-selected="${x === tab}" class="${x === tab ? "active" : ""}" data-action="settings-tab" data-tab="${x}">${th(`settings.tab.${x}`)}</button>`).join("")}
      </nav>
      <div class="settings-body">${{ ai: aiTab, sla: slaTab, general: generalTab, data: dataTab }[tab]()}</div>
    </div>`;
}

function aiTab() {
  const provider = getProvider();
  const cfg = CONFIG.ai.providers[provider];
  const key = getApiKey(provider);
  const vars = { provider: cfg.label, company: cfg.company, site: new URL(cfg.keyUrl).host };
  const autonomy = getAutonomy();
  return `
    <section class="settings-section">
      <h3>${th("settings.provider")}</h3>
      <div class="segmented" role="group" aria-label="${th("settings.provider")}">
        ${Object.entries(CONFIG.ai.providers)
          .map(([id, p]) => `<button type="button" data-action="set-provider" data-value="${id}" class="${id === provider ? "active" : ""}" aria-pressed="${id === provider}">${esc(p.label)}${hasApiKey(id) ? ' <i class="dot ok"></i>' : ""}</button>`)
          .join("")}
      </div>
      <p class="ai-state ${key ? "live" : ""}"><i class="dot"></i>${key ? th("settings.aiLive", { ...vars, model: modelLabel(getModel(provider)) }) : th("settings.aiDemo", vars)}</p>
      <form class="key-row" data-submit="save-key" autocomplete="off">
        <input class="input" type="password" name="key" spellcheck="false" autocomplete="off" placeholder="${esc(key ? mask(key) : cfg.keyHint)}" aria-label="${th("settings.apiKey", vars)}">
        <button class="btn btn-primary" type="submit">${th("common.save")}</button>
      </form>
      <p class="muted small">${th("settings.apiKeyHelp", vars)} <a href="${esc(cfg.keyUrl)}" target="_blank" rel="noopener">${th("settings.apiKeyGet", vars)}</a></p>
      <div class="row wrap">
        <label class="field grow"><span>${th("settings.model")}</span><select class="select" data-change="set-model">${cfg.models.map((m) => option(m.id, m.label, getModel(provider))).join("")}</select></label>
      </div>
      ${key ? `<div class="row wrap"><button class="btn" type="button" data-action="test-key">${th("settings.test")}</button><button class="btn btn-ghost danger" type="button" data-action="remove-key">${th("settings.removeKey")}</button></div>` : ""}
    </section>
    <section class="settings-section">
      <h3>${aiTag()} ${th("settings.autonomy")}</h3>
      <p class="muted small">${th("settings.autonomyHelp")}</p>
      <div class="radio-cards">
        <label class="radio-card"><input type="radio" name="autonomy" value="suggest" data-change="set-autonomy" ${autonomy === "suggest" ? "checked" : ""}>
          <span><strong>${th("settings.autonomySuggest")}</strong><small class="muted">${th("settings.autonomySuggestText")}</small></span></label>
        <label class="radio-card"><input type="radio" name="autonomy" value="auto" data-change="set-autonomy" ${autonomy === "auto" ? "checked" : ""}>
          <span><strong>${th("settings.autonomyAuto")}</strong><small class="muted">${th("settings.autonomyAutoText", { pct: Math.round(CONFIG.ai.autoResolveConfidence * 100) })}</small></span></label>
      </div>
      <p class="muted small">${th("settings.automationsNote")}</p>
    </section>`;
}

function slaTab() {
  const sla = getSla();
  const days = [1, 2, 3, 4, 5, 6, 0];
  const dayName = (d) => new Intl.DateTimeFormat(getLang(), { weekday: "short" }).format(new Date(2026, 8, 20 + d)); // 20/09/2026 = Sunday
  return `
    <form class="form" data-submit="save-sla">
      <section class="settings-section">
        <h3>${th("settings.businessHours")}</h3>
        <div class="form-row three">
          <label class="field"><span>${th("settings.dayStart")}</span><input class="input" type="number" name="start" min="0" max="23" step="0.5" value="${sla.businessHours.start}"></label>
          <label class="field"><span>${th("settings.dayEnd")}</span><input class="input" type="number" name="end" min="1" max="24" step="0.5" value="${sla.businessHours.end}"></label>
          <label class="field"><span>${th("settings.warnAt")}</span><input class="input" type="number" name="warn" min="50" max="95" step="5" value="${Math.round(sla.warnAt * 100)}"></label>
        </div>
        <fieldset class="field"><legend>${th("settings.workDays")}</legend><div class="checks">
          ${days.map((d) => `<label class="check"><input type="checkbox" name="days" value="${d}" ${sla.businessHours.days.includes(d) ? "checked" : ""}><span>${esc(dayName(d))}</span></label>`).join("")}
        </div></fieldset>
      </section>
      <section class="settings-section">
        <h3>${th("settings.targets")}</h3>
        <div class="scroll-x"><table class="table compact sla-table">
          <thead><tr><th>${th("tickets.colPriority")}</th><th>${th("sla.clockResponse")} (h)</th><th>${th("sla.clockResolution")} (h)</th><th>24×7</th></tr></thead>
          <tbody>${CONFIG.priorities
            .map((p) => {
              const x = sla.targets[p.id];
              return `<tr><td><strong>${p.id}</strong> <span class="muted">${esc(prioLabel(p.id))}</span></td>
                <td><input class="input input-sm" type="number" name="${p.id}-response" min="0.25" step="0.25" value="${x.response}" aria-label="${esc(`${p.id} ${t("sla.clockResponse")}`)}"></td>
                <td><input class="input input-sm" type="number" name="${p.id}-resolution" min="0.5" step="0.5" value="${x.resolution}" aria-label="${esc(`${p.id} ${t("sla.clockResolution")}`)}"></td>
                <td><input type="checkbox" name="${p.id}-allDay" ${x.allDay ? "checked" : ""} aria-label="${esc(`${p.id} 24×7`)}"></td></tr>`;
            })
            .join("")}</tbody>
        </table></div>
        <p class="muted small">${th("settings.slaHelp")}</p>
      </section>
      <div class="row wrap"><button class="btn btn-primary" type="submit">${th("settings.saveSla")}</button><button class="btn btn-ghost" type="button" data-action="sla-reset">${th("settings.slaDefaults")}</button></div>
    </form>`;
}

function generalTab() {
  const theme = getPrefs().theme ?? "auto";
  return `
    <section class="settings-section">
      <div class="form-row">
        <label class="field"><span>${th("settings.language")}</span><select class="select" data-change="set-lang">${LANGS.map((l) => option(l.id, l.label, getLang())).join("")}</select></label>
        <label class="field"><span>${th("settings.theme")}</span><select class="select" data-change="set-theme">${option("auto", t("settings.themeAuto"), theme)}${option("light", t("settings.themeLight"), theme)}${option("dark", t("settings.themeDark"), theme)}</select></label>
      </div>
    </section>`;
}

function dataTab() {
  return `
    <section class="settings-section">
      <p class="muted small">${th("settings.dataHelp")}</p>
      <div class="row wrap">
        <button class="btn" type="button" data-action="export-json">${icon("download", 16)}${th("settings.exportJson")}</button>
        <button class="btn" type="button" data-action="export-csv">${icon("download", 16)}${th("settings.exportCsv")}</button>
        <button class="btn" type="button" data-action="import-json">${icon("upload", 16)}${th("settings.import")}</button>
      </div>
    </section>
    <section class="settings-section">
      <div class="row wrap">
        <button class="btn" type="button" data-action="reset-demo">${icon("refresh", 16)}${th("settings.resetDemo")}</button>
        <button class="btn btn-ghost danger" type="button" data-action="wipe-data">${icon("trash", 16)}${th("settings.wipe")}</button>
      </div>
    </section>`;
}

/** Applies the saved theme ("auto" follows the operating system). */
export function applyTheme() {
  const theme = getPrefs().theme ?? "auto";
  if (theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

export function changeLanguage(lang) {
  setLang(lang);
  if (getState().meta.demo) mutate((state) => translateDemo(state, lang));
  else rerender();
  refresh();
}

function csvExport() {
  const sla = getSla();
  const header = ["id", "title", "category", "priority", "status", "team", "assignee", "requester", "created", "first_response", "resolved", "resolved_by", "sla_state", "resolution_business_hours"];
  const cell = (v) => (/[",\n;]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
  const rows = getState().tickets.map((tk) => {
    const s = ticketSla(tk, sla);
    return [
      tk.id, tk.title, catLabel(tk.category), tk.priority, t(`status.${tk.status}`), teamLabel(tk.team), getUser(tk.assigneeId)?.name ?? "", tk.requester?.name ?? "",
      tk.createdAt, tk.firstResponseAt ?? "", tk.resolvedAt ?? "", tk.resolvedBy ?? "", s.state, tk.resolvedAt ? round(s.resolution.elapsed / HOUR, 2) : "",
    ].map(cell).join(",");
  });
  return `﻿${[header.join(","), ...rows].join("\n")}`;
}

on("click", {
  "open-settings": () => openSettings(),
  "settings-tab": (el) => {
    tab = el.dataset.tab;
    refresh();
  },
  "set-provider": (el) => {
    setProvider(el.dataset.value);
    refresh();
    rerender();
  },
  "test-key": (el) =>
    withBusy(el, async () => {
      try {
        const model = await testConnection();
        toast(t("settings.testOk", { model: modelLabel(model) }), "success");
      } catch (err) {
        toast(aiErrorMessage(err), "error", 6000);
      }
    }),
  "remove-key": () => {
    setApiKey("");
    toast(t("settings.keyRemoved"), "info");
    refresh();
    rerender();
  },
  "sla-reset": () => {
    setSla(undefined);
    toast(t("settings.slaSaved"), "success");
    refresh();
  },
  "export-json": () => downloadFile(`resolvia-${isoDate(new Date())}.json`, exportJSON(), "application/json"),
  "export-csv": () => downloadFile(`resolvia-tickets-${isoDate(new Date())}.csv`, csvExport(), "text/csv;charset=utf-8"),
  "import-json": () => document.getElementById("import-input").click(),
  "reset-demo": async () => {
    if (!(await confirmDialog(t("settings.resetConfirm"), { confirmLabel: t("settings.resetDemo") }))) return;
    replaceAll(buildDemoData(getLang()));
    toast(t("settings.resetDone"), "success");
    refresh();
  },
  "wipe-data": async () => {
    if (!(await confirmDialog(t("settings.wipeConfirm"), { confirmLabel: t("settings.wipe"), danger: true }))) return;
    const users = getState().users;
    replaceAll({ users, tickets: [], guides: [], guideStats: {}, settings: {}, meta: { seq: 1000 } });
    toast(t("settings.wiped"), "success");
    refresh();
  },
});

on("change", {
  "set-model": (el) => {
    setModel(el.value);
    refresh();
    rerender();
  },
  "set-autonomy": (el) => {
    setAutonomy(el.value);
    toast(t(el.value === "auto" ? "settings.autonomyAutoOn" : "settings.autonomySuggestOn"), "info");
  },
  "set-theme": (el) => {
    setPrefs({ theme: el.value });
    applyTheme();
    rerender();
  },
});

on("submit", {
  "save-key": (form) => {
    const key = form.key.value.trim();
    if (!key) return;
    setApiKey(key);
    toast(t("settings.keySaved"), "success");
    refresh();
    rerender();
  },
  "save-sla": (form) => {
    const data = new FormData(form);
    const num = (name, fallback) => (Number.isFinite(Number(data.get(name))) && data.get(name) !== "" ? Number(data.get(name)) : fallback);
    const current = getSla();
    const start = num("start", current.businessHours.start);
    const end = num("end", current.businessHours.end);
    if (end <= start) return toast(t("settings.slaHoursError"), "error");
    setSla({
      warnAt: Math.min(0.95, Math.max(0.5, num("warn", 75) / 100)),
      businessHours: { start, end, days: data.getAll("days").map(Number) },
      targets: Object.fromEntries(
        CONFIG.priorities.map((p) => [p.id, { response: num(`${p.id}-response`, current.targets[p.id].response), resolution: num(`${p.id}-resolution`, current.targets[p.id].resolution), allDay: data.has(`${p.id}-allDay`) }]),
      ),
    });
    toast(t("settings.slaSaved"), "success");
  },
});

document.getElementById("import-input")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    replaceAll({ ...data, meta: { ...(data.meta ?? {}), demo: false } });
    toast(t("settings.imported"), "success");
  } catch {
    toast(t("settings.importFail"), "error");
  }
});
