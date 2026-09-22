// Employee help portal: describe the problem → the AI suggests a guide or an automatic fix → ticket if needed.
import { CONFIG } from "../config.js";
import { aiErrorMessage, analyzeRequest } from "../ai.js";
import { getAutomation, runAutomation } from "../automations.js";
import { guideBody, guideCard } from "../components.js";
import { REQUESTERS } from "../demo-templates.js";
import { autoLabel, catIcon, catLabel, departments, fmtDate, fmtRel, getLang, prioLabel, t, teamLabel, th } from "../i18n.js";
import { DONE_STATUSES, ticketSla } from "../sla.js";
import {
  addMessage,
  countGuide,
  createTicket,
  getAutonomy,
  getGuide,
  getGuides,
  getRequester,
  getSla,
  getState,
  getTicket,
  resolveTicket,
  setRequester,
  setStatus,
} from "../store.js";
import { aiTag, icon, on, openModal, rerender, statusPill, thinking, toast } from "../ui.js";
import { esc, loc, normalize } from "../utils.js";

let flow = { step: "ask", text: "", result: null, ticketId: null, running: [], outcome: null };
let guideFilter = { q: "", category: "" };

/** Who is using the portal. In the demo, default to the employee with the most tickets. */
function me() {
  const saved = getRequester();
  if (saved) return saved;
  const counts = new Map();
  for (const tk of getState().tickets) counts.set(tk.requester?.email, (counts.get(tk.requester?.email) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  return REQUESTERS.find((r) => r.email === top) ?? REQUESTERS[0];
}
const firstName = () => me().name.split(" ")[0];
const myTickets = () => getState().tickets.filter((tk) => tk.requester?.email === me().email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export function renderPortal(root, params) {
  if (params[0] === "guides") return params[1] ? renderGuidePage(root, params[1]) : renderGuides(root);
  if (params[0] === "tickets") return renderMine(root, params[1]);
  renderHelp(root);
}

// ── Help flow ────────────────────────────────────────────────────────

function renderHelp(root) {
  const views = { ask, analyzing, suggest, running, details, done };
  root.innerHTML = `<div class="portal-wrap">${views[flow.step]()}</div>`;
  root.querySelector("textarea[name=text]")?.focus({ preventScroll: true });
}

function ask() {
  const popular = [...getGuides()].sort((a, b) => score(b) - score(a)).slice(0, 6);
  const openMine = myTickets().filter((tk) => !DONE_STATUSES.has(tk.status));
  return `
    <section class="hero">
      <p class="eyebrow">${th("portal.eyebrow")}</p>
      <h1>${th("portal.hello", { name: firstName() })}</h1>
      <form class="ask" data-submit="portal-ask">
        <label class="sr-only" for="ask-text">${th("portal.placeholder")}</label>
        <textarea id="ask-text" name="text" rows="3" class="ask-input" placeholder="${th("portal.placeholder")}" required>${esc(flow.text)}</textarea>
        <div class="ask-foot">
          <span class="muted small">${aiTag()} ${th("portal.askHint")}</span>
          <button class="btn btn-primary" type="submit">${th("portal.continue")}${icon("arrowRight", 16)}</button>
        </div>
      </form>
      <div class="chips" aria-label="${th("portal.quick")}">
        ${popular.slice(0, 4).map((g) => `<button class="chip" type="button" data-action="portal-chip" data-text="${esc(loc(g.title, getLang()))}">${icon(catIcon(g.category), 14)}${esc(loc(g.title, getLang()))}</button>`).join("")}
      </div>
    </section>
    ${
      openMine.length
        ? `<a class="notice-card" href="#/portal/tickets">${icon("inbox", 18)}<span>${th("portal.youHaveOpen", { n: openMine.length })}</span>${icon("arrowRight", 16)}</a>`
        : ""
    }
    <section class="portal-section">
      <div class="section-head"><h2>${th("portal.popular")}</h2><a href="#/portal/guides">${th("portal.allGuides")}${icon("arrowRight", 14)}</a></div>
      <div class="guide-grid">${popular.map((g) => guideCard(g, `#/portal/guides/${g.id}`)).join("")}</div>
    </section>`;
}

const score = (g) => {
  const s = getState().guideStats[g.id] ?? {};
  return (s.views ?? 0) + 3 * (s.helpful ?? 0) + (g.automation ? 1 : 0);
};

const quote = () => `<blockquote class="you-said"><span class="muted small">${th("portal.youSaid")}</span>${esc(flow.text)}</blockquote>`;

function analyzing() {
  return `${quote()}<article class="answer">${thinking(t("portal.thinking"))}<div class="skeleton w70"></div><div class="skeleton"></div><div class="skeleton w50"></div></article>`;
}

function suggest() {
  const r = flow.result;
  const guide = r.guide_id ? getGuide(r.guide_id) : null;
  const automation = r.automation_id ? getAutomation(r.automation_id) : null;
  return `
    ${quote()}
    <article class="answer">
      <header class="answer-head">${aiTag()}<p>${esc(r.user_message)}</p>${r.demo ? `<span class="tag">${th("common.demo")}</span>` : ""}</header>
      ${
        automation
          ? `<div class="auto-offer">
              <span class="auto-icon">${icon("bolt", 18)}</span>
              <div class="grow"><strong>${th("portal.autoTitle")}</strong><p class="muted">${th("portal.autoText", { action: autoLabel(automation.id).toLowerCase() })}</p></div>
              <button class="btn btn-ai" type="button" data-action="portal-run-auto">${th("portal.autoRun")}</button>
            </div>`
          : ""
      }
      ${guide ? `<section class="guide-inline"><h2>${icon(catIcon(guide.category), 18)}${esc(loc(guide.title, getLang()))}</h2><p class="muted small">${th("guides.minutes", { n: guide.minutes ?? 3 })} · ${th("portal.tickSteps")}</p>${guideBody(guide)}</section>` : ""}
      <footer class="answer-actions">
        ${guide ? `<button class="btn btn-primary" type="button" data-action="portal-solved">${icon("check", 16)}${th("portal.solved")}</button>` : ""}
        <button class="btn" type="button" data-action="portal-need-help">${th("portal.needHelp")}</button>
        <button class="btn btn-ghost" type="button" data-action="portal-reset">${th("portal.startOver")}</button>
      </footer>
    </article>`;
}

function running() {
  const action = getAutomation(flow.result?.automation_id);
  const steps = loc(action?.steps, getLang()) ?? [];
  return `
    ${quote()}
    <article class="answer">
      <header class="answer-head">${aiTag()}<p><strong>${esc(autoLabel(action?.id))}</strong></p></header>
      <ol class="run-steps">
        ${steps.map((s, i) => `<li data-state="${i < flow.running.length - 1 ? "done" : i === flow.running.length - 1 ? "active" : "todo"}">${icon(i < flow.running.length - 1 ? "checkCircle" : "clock", 16)}<span>${esc(s)}</span></li>`).join("")}
      </ol>
    </article>`;
}

function details() {
  const r = flow.result ?? {};
  const person = me();
  const urgency = [
    ["P4", t("portal.urgencyLow")],
    ["P3", t("portal.urgencyNormal")],
    ["P2", t("portal.urgencyHigh")],
    ["P1", t("portal.urgencyCritical")],
  ];
  const chosen = r.priority ?? "P3";
  return `
    ${quote()}
    <form class="answer form" data-submit="portal-submit">
      <header class="answer-head">${aiTag()}<p>${th("portal.routeTo", { team: teamLabel(r.team), category: catLabel(r.category) })}</p></header>
      <label class="field"><span>${th("portal.title")}</span><input class="input" name="title" required maxlength="90" value="${esc(r.title ?? flow.text.slice(0, 80))}"></label>
      <label class="field"><span>${th("portal.description")}</span><textarea class="input" name="description" rows="4">${esc(flow.text)}</textarea></label>
      <fieldset class="field"><legend>${th("portal.urgency")}</legend>
        <div class="segmented">${urgency.map(([p, label]) => `<label><input type="radio" name="priority" value="${p}" ${p === chosen ? "checked" : ""}><span>${esc(label)}</span></label>`).join("")}</div>
      </fieldset>
      <div class="requester-line">
        <span class="muted small">${th("portal.sendingAs")}</span>
        <strong>${esc(person.name)}</strong><span class="muted">${esc(person.email)}</span>
        <button class="btn-link" type="button" data-action="portal-change-me">${th("portal.notYou")}</button>
      </div>
      <footer class="answer-actions">
        <button class="btn btn-primary" type="submit">${icon("send", 16)}${th("portal.send")}</button>
        <button class="btn btn-ghost" type="button" data-action="portal-reset">${th("common.cancel")}</button>
      </footer>
    </form>`;
}

function done() {
  const ticket = getTicket(flow.ticketId);
  const o = flow.outcome;
  if (o === "self") {
    return `<article class="done">${icon("checkCircle", 40)}<h1>${th("portal.doneSelf")}</h1><p class="muted">${th("portal.doneSelfText")}</p>
      <button class="btn btn-primary" type="button" data-action="portal-reset">${th("portal.backHome")}</button></article>`;
  }
  if (o === "auto") {
    return `<article class="done">${icon("checkCircle", 40)}<h1>${th("portal.doneAuto")}</h1><p class="muted">${th("portal.doneAutoText", { id: ticket?.id ?? "" })}</p>
      <div class="row center"><a class="btn" href="#/portal/tickets/${esc(ticket?.id ?? "")}">${th("portal.viewTicket")}</a><button class="btn btn-primary" type="button" data-action="portal-reset">${th("portal.backHome")}</button></div></article>`;
  }
  const due = ticket ? ticketSla(ticket, getSla()).due : null;
  return `<article class="done">${icon("checkCircle", 40)}<h1>${th("portal.doneTicket", { id: ticket?.id ?? "" })}</h1>
    <p class="muted">${due ? th("portal.doneTicketText", { team: teamLabel(ticket.team), when: fmtDate(due, "stamp") }) : ""}</p>
    <div class="row center"><a class="btn" href="#/portal/tickets/${esc(ticket?.id ?? "")}">${th("portal.viewTicket")}</a><button class="btn btn-primary" type="button" data-action="portal-reset">${th("portal.backHome")}</button></div></article>`;
}

function newTicket(extra = {}) {
  const r = flow.result ?? {};
  return createTicket({
    title: extra.title ?? r.title ?? flow.text.slice(0, 80),
    description: extra.description ?? flow.text,
    requester: { name: me().name, email: me().email, department: me().department },
    category: r.category,
    priority: extra.priority ?? r.priority,
    team: r.team,
    guideId: r.guide_id ?? null,
    automationId: r.automation_id ?? null,
    ai: r.category ? { category: r.category, priority: r.priority, team: r.team, guide_id: r.guide_id ?? null, confidence: r.confidence, reason: r.reason, demo: r.demo } : null,
    source: "portal",
    ...extra,
  });
}

async function runAuto(ticket) {
  flow.step = "running";
  flow.running = [];
  flow.ticketId = ticket.id;
  rerender();
  const result = await runAutomation(ticket.automationId, ticket, (step) => {
    flow.running.push(step);
    if (flow.step === "running") rerender();
  });
  if (result.ok) {
    addMessage(ticket.id, { author: "ai", text: t("portal.autoMessage", { action: autoLabel(ticket.automationId).toLowerCase() }) });
    resolveTicket(ticket.id, { by: "ai", resolvedBy: "ai" });
    flow.outcome = "auto";
  } else {
    addMessage(ticket.id, { author: "system", kind: "system", text: t("portal.autoFailed", { error: result.error ?? "" }) });
    flow.outcome = "ticket";
  }
  flow.step = "done";
  rerender();
}

const shouldAutoResolve = (r) => getAutonomy() === "auto" && r?.automation_id && r.confidence >= CONFIG.ai.autoResolveConfidence;

on("submit", {
  "portal-ask": async (form) => {
    const text = form.text.value.trim();
    if (!text) return;
    flow = { step: "analyzing", text, result: null, ticketId: null, running: [], outcome: null };
    rerender();
    try {
      flow.result = await analyzeRequest(text);
    } catch (err) {
      toast(aiErrorMessage(err), "error", 6000);
      // Without the AI the request still goes through: the team will classify it.
      flow.result = { title: text.slice(0, 80), category: "software", priority: "P3", team: "servicedesk", guide_id: null, automation_id: null, confidence: 0 };
      flow.step = "details";
      rerender();
      return;
    }
    if (shouldAutoResolve(flow.result)) return runAuto(newTicket());
    flow.step = flow.result.guide_id || flow.result.automation_id ? "suggest" : "details";
    rerender();
  },
  "portal-submit": (form) => {
    const data = new FormData(form);
    const ticket = newTicket({ title: String(data.get("title")).trim(), description: String(data.get("description")).trim(), priority: data.get("priority") });
    if (shouldAutoResolve(flow.result)) return runAuto(ticket);
    flow.ticketId = ticket.id;
    flow.outcome = "ticket";
    flow.step = "done";
    rerender();
  },
  "portal-save-me": (form) => {
    const data = new FormData(form);
    setRequester({ name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), department: data.get("department") });
    form.closest("dialog").close();
    rerender();
  },
  "portal-reply": (form) => {
    const text = form.text.value.trim();
    const ticket = getTicket(form.dataset.id);
    if (!text || !ticket) return;
    addMessage(ticket.id, { author: "requester", text });
    if (ticket.status === "pending") setStatus(ticket.id, "open", "requester");
    toast(t("portal.replySent"), "success");
  },
});

on("click", {
  "portal-chip": (el) => {
    flow.text = el.dataset.text;
    rerender();
    document.querySelector(".ask")?.requestSubmit();
  },
  "portal-solved": () => {
    const ticket = newTicket({ status: "resolved", resolvedBy: "self-service" });
    if (ticket.guideId) countGuide(ticket.guideId, "helpful");
    flow.ticketId = ticket.id;
    flow.outcome = "self";
    flow.step = "done";
    rerender();
  },
  "portal-need-help": () => {
    if (flow.result?.guide_id) countGuide(flow.result.guide_id, "notHelpful");
    flow.step = "details";
    rerender();
  },
  "portal-run-auto": () => runAuto(newTicket()),
  "portal-reset": () => {
    flow = { step: "ask", text: "", result: null, ticketId: null, running: [], outcome: null };
    location.hash = "#/portal";
    rerender();
  },
  "portal-change-me": () => {
    const person = me();
    openModal({
      title: th("portal.whoAreYou"),
      size: "small",
      body: `<form id="me-form" class="form" data-submit="portal-save-me">
        <label class="field"><span>${th("team.name")}</span><input class="input" name="name" required value="${esc(person.name)}" autocomplete="name"></label>
        <label class="field"><span>${th("team.email")}</span><input class="input" name="email" type="email" required value="${esc(person.email)}" autocomplete="email"></label>
        <label class="field"><span>${th("portal.department")}</span><select class="select" name="department">${departments().map((d) => `<option value="${d.id}" ${d.id === person.department ? "selected" : ""}>${esc(d.label)}</option>`).join("")}</select></label>
      </form>`,
      footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button><button class="btn btn-primary" type="submit" form="me-form">${th("common.save")}</button>`,
    });
  },
  "portal-guide-vote": (el) => {
    countGuide(el.dataset.id, el.dataset.vote === "yes" ? "helpful" : "notHelpful");
    el.closest(".vote").innerHTML = `<span class="muted">${th("guides.thanks")}</span>`;
  },
  "portal-guide-ticket": (el) => {
    const guide = getGuide(el.dataset.id);
    flow = { step: "ask", text: t("portal.fromGuide", { guide: loc(guide?.title, getLang()) }), result: null, ticketId: null, running: [], outcome: null };
    location.hash = "#/portal";
  },
  "portal-close-ticket": (el) => {
    setStatus(el.dataset.id, "closed", "requester");
    toast(t("portal.closed"), "success");
  },
  "portal-reopen": (el) => {
    addMessage(el.dataset.id, { author: "requester", text: t("portal.reopenText") });
    setStatus(el.dataset.id, "open", "requester");
    toast(t("portal.reopened"), "info");
  },
});

on("input", {
  "portal-guide-search": (el) => {
    guideFilter.q = el.value;
    document.getElementById("portal-guide-list").innerHTML = guideList();
  },
});

// ── Knowledge base for employees ──────────────────────────────────────

const guideList = () => {
  const q = normalize(guideFilter.q);
  const list = getGuides().filter((g) => {
    if (guideFilter.category && g.category !== guideFilter.category) return false;
    if (!q) return true;
    return normalize(`${loc(g.title, getLang())} ${loc(g.summary, getLang())} ${(g.keywords ?? []).join(" ")}`).includes(q);
  });
  return list.length ? list.map((g) => guideCard(g, `#/portal/guides/${g.id}`)).join("") : `<p class="empty">${th("guides.none")}</p>`;
};

function renderGuides(root) {
  lastGuideView = null;
  root.innerHTML = `
    <div class="portal-wrap">
      <header class="page-head"><div><h1>${th("portal.navGuides")}</h1><p class="muted">${th("portal.guidesLead")}</p></div></header>
      <div class="toolbar">
        <label class="search">${icon("search", 16)}<input class="input" type="search" data-input="portal-guide-search" value="${esc(guideFilter.q)}" placeholder="${th("guides.search")}" aria-label="${th("guides.search")}"></label>
      </div>
      <div class="chips">
        <button class="chip ${!guideFilter.category ? "active" : ""}" type="button" data-action="portal-guide-cat" data-id="">${th("common.all")}</button>
        ${CONFIG.categories.filter((c) => getGuides().some((g) => g.category === c.id)).map((c) => `<button class="chip ${guideFilter.category === c.id ? "active" : ""}" type="button" data-action="portal-guide-cat" data-id="${c.id}">${icon(c.icon, 14)}${esc(catLabel(c.id))}</button>`).join("")}
      </div>
      <div class="guide-grid" id="portal-guide-list">${guideList()}</div>
    </div>`;
}

let lastGuideView = null;

function renderGuidePage(root, id) {
  const guide = getGuide(id);
  if (!guide) {
    root.innerHTML = `<div class="portal-wrap"><p class="empty">${th("guides.notFound")}</p></div>`;
    return;
  }
  if (lastGuideView !== id) {
    lastGuideView = id;
    countGuide(id, "views"); // re-renders once; lastGuideView stops it from counting again
    return;
  }
  root.innerHTML = `
    <div class="portal-wrap narrow">
      <a class="back" href="#/portal/guides">${icon("arrowLeft", 16)}${th("portal.navGuides")}</a>
      <article class="guide-page">
        <p class="eyebrow">${icon(catIcon(guide.category), 14)}${esc(catLabel(guide.category))} · ${th("guides.minutes", { n: guide.minutes ?? 3 })}</p>
        <h1>${esc(loc(guide.title, getLang()))}</h1>
        <p class="lead">${esc(loc(guide.summary, getLang()))}</p>
        ${guideBody(guide)}
        <footer class="guide-foot">
          <div class="vote"><span>${th("guides.helpful")}</span>
            <button class="btn btn-sm" type="button" data-action="portal-guide-vote" data-id="${esc(guide.id)}" data-vote="yes">${icon("thumbsUp", 15)}${th("common.yes")}</button>
            <button class="btn btn-sm" type="button" data-action="portal-guide-vote" data-id="${esc(guide.id)}" data-vote="no">${th("common.no")}</button>
          </div>
          <button class="btn" type="button" data-action="portal-guide-ticket" data-id="${esc(guide.id)}">${th("guides.stillStuck")}${icon("arrowRight", 16)}</button>
        </footer>
      </article>
    </div>`;
}

on("click", {
  "portal-guide-cat": (el) => {
    guideFilter.category = el.dataset.id;
    rerender();
  },
});

// ── The employee's own tickets ────────────────────────────────────────

function renderMine(root, id) {
  if (id) return renderMyTicket(root, id);
  const list = myTickets();
  root.innerHTML = `
    <div class="portal-wrap">
      <header class="page-head"><div><h1>${th("portal.navMine")}</h1><p class="muted">${esc(me().name)} · ${esc(me().email)} <button class="btn-link" type="button" data-action="portal-change-me">${th("portal.notYou")}</button></p></div>
        <a class="btn btn-primary" href="#/portal">${icon("plus", 16)}${th("portal.newRequest")}</a></header>
      ${
        list.length
          ? `<ul class="my-tickets">${list
              .map(
                (tk) => `<li><a href="#/portal/tickets/${esc(tk.id)}">
                  <span class="mono muted">${esc(tk.id)}</span>
                  <strong class="truncate">${esc(tk.title)}</strong>
                  ${statusPill(tk.status)}
                  <span class="muted small nowrap">${esc(fmtRel(tk.createdAt))}</span></a></li>`,
              )
              .join("")}</ul>`
          : `<p class="empty">${th("portal.noTickets")}</p>`
      }
    </div>`;
}

function renderMyTicket(root, id) {
  const ticket = getTicket(id);
  if (!ticket || ticket.requester?.email !== me().email) {
    root.innerHTML = `<div class="portal-wrap"><p class="empty">${th("tickets.notFound")}</p></div>`;
    return;
  }
  const done = DONE_STATUSES.has(ticket.status);
  const visible = ticket.messages.filter((m) => m.kind !== "internal");
  const who = (m) => (m.author === "requester" ? me().name : m.author === "ai" ? t("ticket.aiAgent") : m.author === "system" ? "" : t("portal.itTeam"));
  root.innerHTML = `
    <div class="portal-wrap narrow">
      <a class="back" href="#/portal/tickets">${icon("arrowLeft", 16)}${th("portal.navMine")}</a>
      <header class="page-head"><div><p class="mono muted">${esc(ticket.id)}</p><h1>${esc(ticket.title)}</h1><p class="row">${statusPill(ticket.status)}<span class="muted small">${esc(fmtDate(ticket.createdAt, "stamp"))}</span></p></div></header>
      <ol class="thread">
        <li class="msg from-requester"><div class="msg-meta"><strong>${esc(me().name)}</strong><span>${esc(fmtRel(ticket.createdAt))}</span></div><p>${esc(ticket.description)}</p></li>
        ${visible
          .map((m) =>
            m.kind === "system"
              ? `<li class="msg system"><span>${esc(m.text)}</span></li>`
              : `<li class="msg ${m.author === "requester" ? "from-requester" : m.author === "ai" ? "from-ai" : "from-team"}"><div class="msg-meta"><strong>${esc(who(m))}</strong>${m.author === "ai" ? aiTag() : ""}<span>${esc(fmtRel(m.at))}</span></div><p>${esc(m.text)}</p></li>`,
          )
          .join("")}
      </ol>
      ${
        done
          ? `<div class="row wrap"><span class="muted">${th("portal.isSolved")}</span><button class="btn" type="button" data-action="portal-reopen" data-id="${esc(ticket.id)}">${th("portal.notSolved")}</button></div>`
          : `<form class="composer" data-submit="portal-reply" data-id="${esc(ticket.id)}">
              <textarea class="input" name="text" rows="3" placeholder="${th("portal.replyPlaceholder")}" required></textarea>
              <div class="row between"><button class="btn btn-ghost" type="button" data-action="portal-close-ticket" data-id="${esc(ticket.id)}">${th("portal.closeIt")}</button><button class="btn btn-primary" type="submit">${icon("send", 16)}${th("portal.reply")}</button></div>
            </form>`
      }
    </div>`;
}
