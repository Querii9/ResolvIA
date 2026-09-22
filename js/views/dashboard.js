// Dashboard: SLA picture, what comes in most, what takes longest, mass incidents, what the AI can fix, AI report.
import { aiErrorMessage, buildReport, isLive, modelLabel } from "../ai.js";
import { autoLabel, catLabel, fmtDate, fmtHours, fmtNum, fmtPct, getLang, t, th } from "../i18n.js";
import { compactHead, compactRow } from "../components.js";
import { DONE_STATUSES } from "../sla.js";
import { computeStats } from "../stats.js";
import { addMessage, getGuide, getRevision, getSessionUser, getSla, getState, batch } from "../store.js";
import { aiTag, icon, on, openModal, rerender, thinking, toast } from "../ui.js";
import { esc, loc } from "../utils.js";

let days = 30;
let report = null; // { result, demo, model, days, revision, lang }
let reporting = false;

const FIXABLE = new Set(["access", "email", "office", "software"]);

/** Open tickets the AI could probably solve by itself (automatic action or a guide for a fixable category). */
export function aiCandidates(tickets) {
  return tickets.filter((tk) => !DONE_STATUSES.has(tk.status) && (tk.automationId || (tk.guideId && FIXABLE.has(tk.category) && tk.priority !== "P1")) && !tk.aiDismissed);
}

function greeting() {
  const h = new Date().getHours();
  return t(h < 14 ? "dash.morning" : h < 20 ? "dash.afternoon" : "dash.evening", { name: getSessionUser()?.name.split(" ")[0] ?? "" });
}

export function renderDashboard(root) {
  const state = getState();
  const stats = computeStats(state, getSla(), new Date(), { days });
  const stale = report && (report.days !== days || report.revision !== getRevision() || report.lang !== getLang());
  if (!reporting && !isLive() && (!report || stale)) queueMicrotask(() => runReport(stats));

  const s = stats.openStates;
  const candidates = aiCandidates(state.tickets);
  root.innerHTML = `
    <header class="page-head">
      <div><h1>${esc(greeting())}</h1><p class="muted">${esc(fmtDate(new Date(), "long"))}</p></div>
      <div class="segmented" role="group" aria-label="${th("dash.period")}">
        ${[7, 30, 90].map((d) => `<button type="button" data-action="dash-days" data-days="${d}" class="${d === days ? "active" : ""}" aria-pressed="${d === days}">${th("dash.days", { n: d })}</button>`).join("")}
      </div>
    </header>

    ${stats.massIncidents.map(massBanner).join("")}

    <section class="stat-strip" aria-label="${th("dash.summary")}">
      ${stat(t("dash.open"), fmtNum(stats.open), t("dash.unassigned", { n: stats.unassigned }))}
      ${stat(t("dash.breached"), fmtNum(s.breached), t("dash.atRisk", { n: s.risk }), s.breached ? "breached" : "")}
      ${stat(t("dash.compliance"), fmtPct(stats.compliance), t("dash.responseCompliance", { pct: fmtPct(stats.responseCompliance) }))}
      ${stat(t("dash.avgResolution"), fmtHours(stats.avgResolutionH), t("dash.businessHours"))}
      ${stat(t("dash.noTech"), fmtPct(stats.selfServiceRate + stats.aiRate), t("dash.selfAi", { self: fmtPct(stats.selfServiceRate), ai: fmtPct(stats.aiRate) }))}
    </section>

    <div class="dash-grid">
      <section class="panel span-2">
        <div class="panel-head"><h2>${th("dash.queue")}</h2><a class="link" href="#/tickets">${th("common.seeAll")}${icon("arrowRight", 14)}</a></div>
        ${
          stats.queue.length
            ? `<div class="table-wrap flush"><table class="table compact queue">${compactHead()}<tbody>${stats.queue.slice(0, 8).map(compactRow).join("")}</tbody></table></div>`
            : `<p class="empty">${th("dash.queueEmpty")}</p>`
        }
      </section>

      <div class="stack">
      <section class="panel">
        <div class="panel-head"><h2>${th("dash.slaOpen")}</h2></div>
        ${slaMeter(s, stats.open)}
      </section>

      <section class="panel">
        <div class="panel-head"><h2>${aiTag()} ${th("dash.aiCanFix")}</h2></div>
        ${
          candidates.length
            ? `<ul class="fix-list">${candidates
                .slice(0, 5)
                .map((tk) => {
                  const remedy = tk.automationId ? autoLabel(tk.automationId) : loc(getGuide(tk.guideId)?.title, getLang());
                  return `<li><a href="#/tickets/${esc(tk.id)}?agent=1">
                    <span class="fix-icon">${icon(tk.automationId ? "bolt" : "book", 15)}</span>
                    <span class="grow"><span class="mono muted">${esc(tk.id)}</span> <strong class="truncate">${esc(tk.title)}</strong><small class="muted truncate">${esc(remedy)}</small></span>
                    ${icon("chevronRight", 16)}</a></li>`;
                })
                .join("")}</ul><p class="muted small">${th("dash.aiCanFixHint", { n: candidates.length })}</p>`
            : `<p class="empty">${th("dash.aiCanFixNone")}</p>`
        }
      </section>
      </div>

      <section class="panel">
        <div class="panel-head"><h2>${th("dash.topCategories")}</h2><span class="muted small">${th("dash.lastDays", { n: days })}</span></div>
        ${bars(
          stats.byCategory.filter((c) => c.total).slice(0, 6).map((c) => ({ label: catLabel(c.id), value: c.total, display: fmtNum(c.total), tip: t("dash.tipTickets", { cat: catLabel(c.id), n: c.total, pct: fmtPct(stats.total ? c.total / stats.total : 0) }) })),
        )}
      </section>

      <section class="panel">
        <div class="panel-head"><h2>${th("dash.slowest")}</h2><span class="muted small">${th("dash.avgBusiness")}</span></div>
        ${bars(
          [...stats.byCategory]
            .filter((c) => c.avgResolutionH != null)
            .sort((a, b) => b.avgResolutionH - a.avgResolutionH)
            .slice(0, 6)
            .map((c) => ({ label: catLabel(c.id), value: c.avgResolutionH, display: fmtHours(c.avgResolutionH), tip: t("dash.tipSlow", { cat: catLabel(c.id), h: fmtHours(c.avgResolutionH), sla: fmtPct(c.compliance), n: c.resolvedCount }) })),
        )}
      </section>

      <section class="panel">
        <div class="panel-head"><h2>${th("dash.daily")}</h2><span class="muted small">${th("dash.last14")}</span></div>
        ${columns(stats.byDay)}
      </section>

      <section class="panel span-3 report">${reportPanel()}</section>
    </div>`;
}

const stat = (label, value, sub, state = "") =>
  `<div class="stat" ${state ? `data-state="${state}"` : ""}><span class="stat-label">${esc(label)}</span><span class="stat-value">${esc(value)}</span><span class="stat-sub">${esc(sub)}</span></div>`;

function massBanner(m) {
  const minutes = Math.max(1, Math.round((Date.now() - m.firstAt) / 60000));
  return `<section class="banner" role="alert">
    <span class="banner-icon">${icon("alert", 18)}</span>
    <div><strong>${th("dash.massTitle", { cat: catLabel(m.category) })}</strong><p>${th("dash.massText", { n: m.count, people: m.requesters, min: minutes })}</p></div>
    <div class="banner-actions">
      <a class="btn btn-sm" href="#/tickets?category=${esc(m.category)}&view=recent">${th("dash.massView")}</a>
      <button class="btn btn-sm btn-primary" type="button" data-action="mass-notify" data-category="${esc(m.category)}">${icon("send", 15)}${th("dash.massNotify")}</button>
    </div>
  </section>`;
}

/** Stacked meter of open tickets by SLA state: status colour + icon + label + count. */
function slaMeter(s, total) {
  const order = [
    ["breached", "alert"],
    ["risk", "clock"],
    ["paused", "pause"],
    ["ok", "checkCircle"],
  ];
  if (!total) return `<p class="empty">${th("dash.queueEmpty")}</p>`;
  return `
    <div class="meter" role="img" aria-label="${esc(order.map(([k]) => `${t(`sla.${k}`)}: ${s[k]}`).join(", "))}">
      ${order.filter(([k]) => s[k]).map(([k]) => `<span class="meter-seg" data-state="${k}" style="flex:${s[k]}" data-tip="${esc(`${t(`sla.${k}`)}: ${s[k]}`)}" tabindex="0"></span>`).join("")}
    </div>
    <ul class="legend">
      ${order.map(([k, ic]) => `<li><span class="sla" data-state="${k}">${icon(ic, 14)}</span><span class="grow">${th(`sla.${k}`)}</span><strong class="num">${s[k]}</strong></li>`).join("")}
    </ul>`;
}

/** Horizontal bars: one series, value at the tip, tooltip per bar, readable without it. */
function bars(rows) {
  if (!rows.length) return `<p class="empty">${th("common.noData")}</p>`;
  const max = Math.max(...rows.map((r) => r.value)) || 1;
  return `<ul class="hbars">${rows
    .map(
      (r) => `<li class="hbar" tabindex="0" data-tip="${esc(r.tip)}">
        <span class="hbar-label truncate">${esc(r.label)}</span>
        <span class="hbar-track"><span class="hbar-fill" style="width:${Math.max(2, (r.value / max) * 100)}%"></span></span>
        <span class="hbar-value">${esc(r.display)}</span>
      </li>`,
    )
    .join("")}</ul>`;
}

/** 14 daily columns; the peak and today are labelled, every day has a tooltip, and a table for screen readers. */
function columns(daysList) {
  const max = Math.max(...daysList.map((d) => d.created)) || 1;
  const peak = daysList.reduce((best, d, i) => (d.created > daysList[best].created ? i : best), 0);
  const last = daysList.length - 1;
  return `
    <div class="cols" aria-hidden="true">
      ${daysList
        .map((d, i) => {
          const label = i === peak || i === last;
          const weekend = [0, 6].includes(d.date.getDay());
          return `<div class="col ${weekend ? "weekend" : ""}" tabindex="-1" data-tip="${esc(t("dash.tipDay", { date: fmtDate(d.date), created: d.created, resolved: d.resolved }))}">
            <span class="col-bar" style="height:${(d.created / max) * 100}%">${label && d.created ? `<span class="col-value">${d.created}</span>` : ""}</span>
            <span class="col-x">${i % 2 === last % 2 ? esc(fmtDate(d.date).split(" ")[0]) : ""}</span>
          </div>`;
        })
        .join("")}
    </div>
    <table class="sr-only"><caption>${th("dash.daily")}</caption><thead><tr><th>${th("common.date")}</th><th>${th("dash.created")}</th><th>${th("dash.resolved")}</th></tr></thead>
      <tbody>${daysList.map((d) => `<tr><td>${esc(fmtDate(d.date))}</td><td>${d.created}</td><td>${d.resolved}</td></tr>`).join("")}</tbody></table>`;
}

function reportPanel() {
  const head = `<div class="panel-head"><h2>${aiTag()} ${th("dash.report")}</h2>
    <button class="btn btn-sm" type="button" data-action="run-report" ${reporting ? "disabled" : ""}>${icon("refresh", 15)}${th(report ? "dash.reportAgain" : "dash.reportRun")}</button></div>`;
  if (reporting) return `${head}${thinking(t("dash.reportWorking"))}<div class="skeleton w70"></div><div class="skeleton"></div><div class="skeleton w50"></div>`;
  if (!report) return `${head}<p class="muted">${th("dash.reportIntro")}</p>`;
  const r = report.result;
  return `${head}
    <p class="report-note muted small">${report.demo ? th("dash.reportDemo") : th("dash.reportBy", { model: modelLabel(report.model) })}</p>
    <h3 class="report-headline">${esc(r.headline)}</h3>
    <p>${esc(r.summary)}</p>
    <div class="report-cols">
      <ul class="findings">${r.findings.map((f) => `<li data-severity="${esc(f.severity)}"><span class="sev">${th(`dash.sev.${f.severity}`)}</span><strong>${esc(f.title)}</strong><span class="muted">${esc(f.detail)}</span></li>`).join("")}</ul>
      <div><h4>${th("dash.recommendations")}</h4><ol class="recs">${r.recommendations.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
    </div>`;
}

async function runReport(stats) {
  reporting = true;
  rerender();
  try {
    const res = await buildReport(stats ?? computeStats(getState(), getSla(), new Date(), { days }));
    report = { result: res, demo: res.demo, model: res.model, days, revision: getRevision(), lang: getLang() };
  } catch (err) {
    toast(aiErrorMessage(err), "error", 6000);
  } finally {
    reporting = false;
    rerender();
  }
}

on("click", {
  "dash-days": (el) => {
    days = Number(el.dataset.days);
    rerender();
  },
  "run-report": () => runReport(),
  "mass-notify": (el) => {
    const category = el.dataset.category;
    const stats = computeStats(getState(), getSla(), new Date(), { days });
    const incident = stats.massIncidents.find((m) => m.category === category);
    if (!incident) return;
    const open = incident.tickets.filter((tk) => !DONE_STATUSES.has(tk.status));
    const modal = openModal({
      title: th("dash.massNotify"),
      body: `<form id="mass-form" class="form" data-submit="mass-send" data-ids="${esc(open.map((tk) => tk.id).join(","))}">
        <p class="muted">${th("dash.massNotifyText", { n: open.length })}</p>
        <label class="field"><span>${th("ticket.message")}</span><textarea class="input" name="text" rows="4" required>${esc(t("dash.massMessage", { cat: catLabel(category) }))}</textarea></label>
      </form>`,
      footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button><button class="btn btn-primary" type="submit" form="mass-form">${icon("send", 15)}${th("dash.massSend", { n: open.length })}</button>`,
    });
    modal.el.querySelector("textarea").focus();
  },
});

on("submit", {
  "mass-send": (form) => {
    const ids = form.dataset.ids.split(",").filter(Boolean);
    const text = form.text.value.trim();
    const me = getSessionUser();
    if (!text || !me) return;
    form.closest("dialog").close();
    batch(() => ids.forEach((id) => addMessage(id, { author: me.id, text })));
    toast(t("dash.massSent", { n: ids.length }), "success");
  },
});
