// Ticket detail: conversation, reply composer, SLA clocks, resolution agent, properties, guide, history.
import { CONFIG } from "../config.js";
import { aiErrorMessage, resolveCheck, suggestReply } from "../ai.js";
import { getAutomation, runAutomation } from "../automations.js";
import { catTag, slaBadge } from "../components.js";
import { autoLabel, catLabel, fmtDate, fmtDuration, fmtPct, fmtRel, getLang, prioLabel, t, teamLabel, th } from "../i18n.js";
import { DONE_STATUSES, addBusinessMs, ticketSla } from "../sla.js";
import {
  addMessage,
  assign,
  batch,
  getGuide,
  getSessionUser,
  getSla,
  getTicket,
  getUser,
  getUsers,
  resolveTicket,
  setStatus,
  updateTicket,
} from "../store.js";
import { aiTag, avatar, icon, on, priorityTag, rerender, statusPill, thinking, toast, withBusy } from "../ui.js";
import { esc, loc } from "../utils.js";
import { openGuideGenerator } from "./knowledge.js";

// Composer and agent state survive re-renders of the same ticket.
let composer = { ticketId: null, kind: "public", text: "", note: "" };
let agent = { ticketId: null, phase: "idle", result: null, steps: [] };

export function renderTicket(root, id) {
  const ticket = getTicket(id);
  if (!ticket) {
    root.innerHTML = `<a class="back" href="#/tickets">${icon("arrowLeft", 16)}${th("tickets.title")}</a><p class="empty">${th("tickets.notFound")}</p>`;
    return;
  }
  if (composer.ticketId !== id) composer = { ticketId: id, kind: "public", text: "", note: "" };
  if (agent.ticketId !== id) agent = { ticketId: id, phase: "idle", result: null, steps: [] };
  const wantsAgent = new URLSearchParams(location.hash.split("?")[1] ?? "").has("agent");
  if (wantsAgent) history.replaceState(null, "", `#/tickets/${id}`);

  const sla = ticketSla(ticket, getSla());
  const done = DONE_STATUSES.has(ticket.status);
  const me = getSessionUser();

  root.innerHTML = `
    <a class="back" href="#/tickets">${icon("arrowLeft", 16)}${th("tickets.title")}</a>
    <header class="ticket-head">
      <div class="grow">
        <p class="meta-line"><span class="mono">${esc(ticket.id)}</span><span>${th(`ticket.source.${ticket.source ?? "portal"}`)}</span><span>${esc(fmtDate(ticket.createdAt, "stamp"))}</span></p>
        <h1>${esc(ticket.title)}</h1>
        <p class="row wrap">${statusPill(ticket.status)}${priorityTag(ticket.priority)}${catTag(ticket.category)}<span class="muted small">${esc(teamLabel(ticket.team))}</span>${slaBadge(sla)}</p>
      </div>
      <div class="row wrap head-actions">
        ${
          done
            ? `<button class="btn" type="button" data-action="ticket-reopen" data-id="${esc(id)}">${icon("refresh", 16)}${th("ticket.reopen")}</button>`
            : `${ticket.status === "pending"
                ? `<button class="btn" type="button" data-action="ticket-status" data-id="${esc(id)}" data-status="open">${icon("clock", 16)}${th("ticket.resume")}</button>`
                : `<button class="btn" type="button" data-action="ticket-status" data-id="${esc(id)}" data-status="pending">${icon("pause", 16)}${th("ticket.waitUser")}</button>`}
              <button class="btn btn-primary" type="button" data-action="ticket-resolve" data-id="${esc(id)}">${icon("check", 16)}${th("ticket.resolve")}</button>`
        }
      </div>
    </header>

    <div class="ticket-grid">
      <div class="ticket-main">
        <ol class="thread">
          <li class="msg from-requester">
            <div class="msg-meta">${avatar({ name: ticket.requester?.name ?? "?", color: "#6b6b70" }, 24)}<strong>${esc(ticket.requester?.name ?? "")}</strong><span class="muted">${esc(ticket.requester?.email ?? "")}</span><span>${esc(fmtRel(ticket.createdAt))}</span></div>
            <p>${esc(ticket.description)}</p>
          </li>
          ${ticket.messages.map(messageItem).join("")}
        </ol>
        ${done ? `<p class="muted small center">${th("ticket.doneNote", { by: t(`ticket.resolvedBy.${ticket.resolvedBy ?? "tech"}`) })}</p>` : composerForm(ticket)}
      </div>

      <aside class="ticket-side">
        ${slaCard(ticket, sla)}
        ${done ? "" : agentCard(ticket)}
        ${propsCard(ticket, me)}
        ${ticket.ai ? triageCard(ticket.ai) : ""}
        ${guideCard(ticket)}
        ${historyCard(ticket)}
      </aside>
    </div>`;

  const textarea = root.querySelector(".composer textarea");
  if (textarea) textarea.value = composer.text;
  if (wantsAgent && agent.phase === "idle" && !done) queueMicrotask(() => runCheck(id));
}

// ── Conversation ─────────────────────────────────────────────────────

function messageItem(m) {
  if (m.kind === "system") return `<li class="msg system"><span>${esc(m.text)}</span><small>${esc(fmtRel(m.at))}</small></li>`;
  const user = getUser(m.author);
  const who =
    m.author === "requester"
      ? `${avatar({ name: "?", color: "#6b6b70" }, 24)}<strong>${th("ticket.requester")}</strong>`
      : m.author === "ai"
        ? `<span class="ai-avatar">${th("ai.tag")}</span><strong>${th("ticket.aiAgent")}</strong>`
        : `${avatar(user, 24)}<strong>${esc(user?.name ?? t("portal.itTeam"))}</strong>`;
  const cls = m.kind === "internal" ? "internal" : m.author === "requester" ? "from-requester" : m.author === "ai" ? "from-ai" : "from-team";
  return `<li class="msg ${cls}">
    <div class="msg-meta">${who}${m.kind === "internal" ? `<span class="tag">${th("ticket.internal")}</span>` : ""}<span>${esc(fmtRel(m.at))}</span></div>
    <p>${esc(m.text)}</p>
  </li>`;
}

function composerForm(ticket) {
  return `<form class="composer ${composer.kind === "internal" ? "is-internal" : ""}" data-submit="ticket-send" data-id="${esc(ticket.id)}">
    <div class="composer-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="${composer.kind === "public"}" class="${composer.kind === "public" ? "active" : ""}" data-action="composer-kind" data-kind="public">${th("ticket.publicReply")}</button>
      <button type="button" role="tab" aria-selected="${composer.kind === "internal"}" class="${composer.kind === "internal" ? "active" : ""}" data-action="composer-kind" data-kind="internal">${th("ticket.internalNote")}</button>
    </div>
    <label class="sr-only" for="composer-text">${th("ticket.message")}</label>
    <textarea id="composer-text" name="text" rows="5" class="input" data-input="composer-text" placeholder="${th(composer.kind === "internal" ? "ticket.notePh" : "ticket.replyPh", { name: ticket.requester?.name?.split(" ")[0] ?? "" })}" required></textarea>
    ${composer.note ? `<p class="suggested-note">${aiTag()}<span>${esc(composer.note)}</span><button class="btn-link" type="button" data-action="use-note">${th("ticket.addAsNote")}</button></p>` : ""}
    <div class="composer-foot">
      <button class="btn btn-sm" type="button" data-action="suggest-reply" data-id="${esc(ticket.id)}">${aiTag()}<span>${th("ticket.suggest")}</span></button>
      <span class="grow"></span>
      ${
        composer.kind === "public"
          ? `<select class="select select-sm" name="after" aria-label="${th("ticket.after")}">
              <option value="open">${th("ticket.afterOpen")}</option>
              <option value="pending">${th("ticket.afterPending")}</option>
              <option value="resolved">${th("ticket.afterResolved")}</option>
            </select>`
          : ""
      }
      <button class="btn btn-primary" type="submit">${icon("send", 15)}${th(composer.kind === "internal" ? "ticket.saveNote" : "ticket.send")}</button>
    </div>
  </form>`;
}

// ── Side cards ───────────────────────────────────────────────────────

function clockRow(label, clock, calendar, isActive) {
  let note;
  if (clock.done) note = clock.state === "met" ? t("sla.metIn", { time: fmtDuration(clock.elapsed) }) : t("sla.lateBy", { time: fmtDuration(clock.elapsed - clock.target) });
  else if (clock.state === "paused") note = t("sla.pausedNote");
  else if (clock.state === "breached") note = t("sla.breachedFor", { time: fmtDuration(clock.elapsed - clock.target) });
  else note = t(isActive ? "sla.dueAt" : "sla.dueAfter", { when: fmtDate(addBusinessMs(new Date(), clock.remaining, calendar), "stamp") });
  const used = Math.min(100, Math.round(clock.used * 100));
  return `<div class="clock" data-state="${clock.state}">
    <div class="row between"><span>${esc(label)}</span><span class="mono small">${fmtDuration(Math.min(clock.elapsed, clock.target * 9))} / ${fmtDuration(clock.target)}</span></div>
    <div class="clock-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${used}" aria-label="${esc(label)}"><span style="width:${Math.max(used, 2)}%"></span></div>
    <p class="small">${esc(note)}</p>
  </div>`;
}

function slaCard(ticket, sla) {
  const target = getSla().targets[ticket.priority];
  const hours = getSla().businessHours;
  return `<section class="side-card">
    <h3>${th("ticket.sla")} <span class="muted small">${ticket.priority} · ${esc(prioLabel(ticket.priority))}</span></h3>
    ${clockRow(t("sla.clockResponse"), sla.response, sla.calendar, !sla.response.done)}
    ${clockRow(t("sla.clockResolution"), sla.resolution, sla.calendar, sla.response.done)}
    <p class="muted small">${target.allDay ? th("sla.calendar247") : th("sla.calendarBusiness", { start: hours.start, end: hours.end })}</p>
  </section>`;
}

function agentCard(ticket) {
  const a = agent;
  let body;
  if (a.phase === "checking") body = thinking(t("agent.checking"));
  else if (a.phase === "running") {
    const steps = loc(getAutomation(a.result?.automation_id)?.steps, getLang()) ?? [];
    body = `<ol class="run-steps">${steps.map((s, i) => `<li data-state="${i < a.steps.length - 1 ? "done" : i === a.steps.length - 1 ? "active" : "todo"}">${icon(i < a.steps.length - 1 ? "checkCircle" : "clock", 15)}<span>${esc(s)}</span></li>`).join("")}</ol>`;
  } else if (a.phase === "result" && a.result) {
    const r = a.result;
    const guide = r.guide_id ? getGuide(r.guide_id) : null;
    body = r.can_resolve
      ? `<p class="agent-verdict ok">${icon("checkCircle", 16)}<span>${th("agent.can")}</span><span class="mono">${fmtPct(r.confidence)}</span></p>
         <p class="muted small">${esc(r.reason)}</p>
         <ul class="agent-plan">
           ${r.automation_id ? `<li>${icon("bolt", 15)}<span>${esc(autoLabel(r.automation_id))}</span></li>` : ""}
           ${guide ? `<li>${icon("book", 15)}<span>${esc(loc(guide.title, getLang()))}</span></li>` : ""}
         </ul>
         <label class="field"><span>${th("agent.reply")}</span><textarea class="input" rows="4" data-input="agent-reply">${esc(r.reply)}</textarea></label>
         <div class="row wrap">
           <button class="btn btn-ai" type="button" data-action="agent-apply" data-id="${esc(ticket.id)}">${icon(r.automation_id ? "bolt" : "send", 15)}${th(r.automation_id ? "agent.run" : "agent.sendGuide")}</button>
           <button class="btn btn-ghost" type="button" data-action="agent-dismiss" data-id="${esc(ticket.id)}">${th("agent.dismiss")}</button>
         </div>
         ${r.demo ? `<p class="muted small">${th("agent.demoNote")}</p>` : ""}`
      : `<p class="agent-verdict">${icon("user", 16)}<span>${th("agent.cannot")}</span></p><p class="muted small">${esc(r.reason)}</p>
         <button class="btn btn-sm btn-ghost" type="button" data-action="agent-check" data-id="${esc(ticket.id)}">${icon("refresh", 14)}${th("agent.again")}</button>`;
  } else {
    body = `<p class="muted small">${th("agent.intro")}</p><button class="btn btn-sm btn-ai" type="button" data-action="agent-check" data-id="${esc(ticket.id)}">${th("agent.check")}</button>`;
  }
  return `<section class="side-card agent">${`<h3>${aiTag()} ${th("agent.title")}</h3>`}${body}</section>`;
}

function propsCard(ticket, me) {
  const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`;
  return `<section class="side-card">
    <h3>${th("ticket.properties")}</h3>
    <div class="props">
      <label><span>${th("tickets.colAssignee")}</span>
        <select class="select select-sm" data-change="ticket-prop" data-id="${esc(ticket.id)}" name="assigneeId">${option("", t("tickets.unassigned"), ticket.assigneeId ?? "")}${getUsers().map((u) => option(u.id, u.name, ticket.assigneeId)).join("")}</select></label>
      ${ticket.assigneeId !== me?.id ? `<button class="btn-link" type="button" data-action="assign-me" data-id="${esc(ticket.id)}">${th("ticket.assignMe")}</button>` : ""}
      <label><span>${th("tickets.colPriority")}</span>
        <select class="select select-sm" data-change="ticket-prop" data-id="${esc(ticket.id)}" name="priority">${CONFIG.priorities.map((p) => option(p.id, `${p.id} · ${prioLabel(p.id)}`, ticket.priority)).join("")}</select></label>
      <label><span>${th("tickets.colCategory")}</span>
        <select class="select select-sm" data-change="ticket-prop" data-id="${esc(ticket.id)}" name="category">${CONFIG.categories.map((c) => option(c.id, catLabel(c.id), ticket.category)).join("")}</select></label>
      <label><span>${th("tickets.team")}</span>
        <select class="select select-sm" data-change="ticket-prop" data-id="${esc(ticket.id)}" name="team">${CONFIG.teams.map((x) => option(x.id, teamLabel(x.id), ticket.team)).join("")}</select></label>
    </div>
    <p class="muted small">${esc(ticket.requester?.name ?? "")}${ticket.requester?.email ? ` · ${esc(ticket.requester.email)}` : ""}</p>
  </section>`;
}

function triageCard(ai) {
  return `<section class="side-card">
    <h3>${aiTag()} ${th("ticket.triage")}</h3>
    <p class="small">${th("ticket.triageText", { category: catLabel(ai.category), priority: ai.priority, team: teamLabel(ai.team) })}</p>
    ${ai.confidence != null ? `<div class="conf"><span class="conf-bar"><span style="width:${Math.round(ai.confidence * 100)}%"></span></span><span class="mono small">${fmtPct(ai.confidence)}</span></div>` : ""}
    ${ai.reason ? `<p class="muted small">${esc(ai.reason)}</p>` : ""}
  </section>`;
}

function guideCard(ticket) {
  const guide = ticket.guideId ? getGuide(ticket.guideId) : null;
  return `<section class="side-card">
    <h3>${th("ticket.guide")}</h3>
    ${
      guide
        ? `<a class="linked-guide" href="#/knowledge/${esc(guide.id)}">${icon("book", 16)}<span>${esc(loc(guide.title, getLang()))}</span></a>
           ${DONE_STATUSES.has(ticket.status) ? "" : `<button class="btn btn-sm" type="button" data-action="insert-guide" data-id="${esc(ticket.id)}">${th("ticket.insertGuide")}</button>`}`
        : `<p class="muted small">${th("ticket.noGuide")}</p>
           <button class="btn btn-sm" type="button" data-action="guide-from-ticket" data-id="${esc(ticket.id)}">${aiTag()}<span>${th("ticket.makeGuide")}</span></button>`
    }
  </section>`;
}

function historyCard(ticket) {
  const who = (by) => (by === "requester" ? t("ticket.requester") : by === "ai" ? t("ticket.aiAgent") : by === "system" ? t("ticket.system") : getUser(by)?.name ?? "—");
  return `<section class="side-card">
    <h3>${th("ticket.history")}</h3>
    <ol class="history">${[...ticket.statusLog]
      .reverse()
      .map((e) => `<li><span>${th(`status.${e.status}`)}</span><span class="muted small">${esc(who(e.by))} · ${esc(fmtDate(e.at, "stamp"))}</span></li>`)
      .join("")}</ol>
  </section>`;
}

// ── Agent ────────────────────────────────────────────────────────────

async function runCheck(id) {
  const ticket = getTicket(id);
  agent = { ticketId: id, phase: "checking", result: null, steps: [] };
  rerender();
  try {
    const result = await resolveCheck(ticket);
    if (agent.ticketId !== id) return;
    agent.result = result;
    agent.phase = "result";
  } catch (err) {
    toast(aiErrorMessage(err), "error", 6000);
    agent.phase = "idle";
  }
  rerender();
}

async function applyAgent(id) {
  const ticket = getTicket(id);
  const r = agent.result;
  if (!ticket || !r) return;
  const reply = r.reply?.trim() || t("agent.defaultReply");
  if (r.automation_id) {
    agent.phase = "running";
    agent.steps = [];
    rerender();
    const result = await runAutomation(r.automation_id, ticket, (step) => {
      agent.steps.push(step);
      rerender();
    });
    if (!result.ok) {
      addMessage(id, { author: "system", kind: "system", text: t("portal.autoFailed", { error: result.error ?? "" }) });
      agent.phase = "idle";
      toast(t("agent.failed"), "error");
      return;
    }
  }
  batch(() => {
    if (r.guide_id && !ticket.guideId) updateTicket(id, { guideId: r.guide_id });
    addMessage(id, { author: "ai", text: reply });
    addMessage(id, { author: "system", kind: "system", text: t("agent.approvedBy", { name: getSessionUser()?.name ?? "" }) });
    resolveTicket(id, { by: "ai", resolvedBy: "ai" });
  });
  agent.phase = "idle";
  toast(t("agent.done", { id }), "success");
}

// ── Actions ──────────────────────────────────────────────────────────

const me = () => getSessionUser();

on("click", {
  "composer-kind": (el) => {
    composer.kind = el.dataset.kind;
    rerender();
    document.querySelector(".composer textarea")?.focus();
  },
  "suggest-reply": (el) =>
    withBusy(el, async () => {
      try {
        const res = await suggestReply(getTicket(el.dataset.id), me());
        composer.kind = "public";
        composer.text = res.reply;
        composer.note = res.internal_note ?? "";
        rerender();
        document.querySelector(".composer textarea")?.focus();
      } catch (err) {
        toast(aiErrorMessage(err), "error", 6000);
      }
    }),
  "use-note": () => {
    const id = composer.ticketId;
    addMessage(id, { author: me().id, kind: "internal", text: composer.note });
    composer.note = "";
  },
  "insert-guide": (el) => {
    const ticket = getTicket(el.dataset.id);
    const guide = getGuide(ticket.guideId);
    composer.kind = "public";
    composer.text = `${composer.text ? `${composer.text}\n\n` : ""}${t("ticket.guideMessage", { title: loc(guide.title, getLang()), summary: loc(guide.summary, getLang()) })}`;
    rerender();
  },
  "guide-from-ticket": (el) => openGuideGenerator({ ticket: getTicket(el.dataset.id) }),
  "assign-me": (el) => assign(el.dataset.id, me().id, me().id),
  "ticket-status": (el) => {
    setStatus(el.dataset.id, el.dataset.status, me().id);
    toast(t(el.dataset.status === "pending" ? "ticket.pausedToast" : "ticket.resumedToast"), "info");
  },
  "ticket-resolve": (el) => {
    const ticket = getTicket(el.dataset.id);
    batch(() => {
      if (!ticket.assigneeId) assign(ticket.id, me().id, me().id);
      resolveTicket(ticket.id, { by: me().id, resolvedBy: "tech" });
    });
    toast(t("ticket.resolvedToast", { id: ticket.id }), "success");
  },
  "ticket-reopen": (el) => {
    setStatus(el.dataset.id, "open", me().id);
    toast(t("ticket.reopenedToast"), "info");
  },
  "agent-check": (el) => runCheck(el.dataset.id),
  "agent-apply": (el) => applyAgent(el.dataset.id),
  "agent-dismiss": (el) => {
    updateTicket(el.dataset.id, { aiDismissed: true });
    agent = { ticketId: el.dataset.id, phase: "idle", result: null, steps: [] };
    rerender();
  },
});

on("input", {
  "composer-text": (el) => (composer.text = el.value),
  "agent-reply": (el) => agent.result && (agent.result.reply = el.value),
});

on("change", {
  "ticket-prop": (el) => {
    const id = el.dataset.id;
    const field = el.name;
    const value = el.value || null;
    if (field === "assigneeId") return assign(id, value, me().id);
    const label = { priority: (v) => `${v} · ${prioLabel(v)}`, category: catLabel, team: teamLabel }[field];
    batch(() => {
      updateTicket(id, { [field]: value });
      addMessage(id, { author: "system", kind: "system", text: t("ticket.changed", { field: t(`ticket.field.${field}`), value: label(value), name: me().name }) });
    });
    if (field === "priority") toast(t("ticket.slaRecalc"), "info");
  },
});

on("submit", {
  "ticket-send": (form) => {
    const id = form.dataset.id;
    const text = form.text.value.trim();
    if (!text) return;
    const after = form.after?.value ?? "open";
    const kind = composer.kind;
    batch(() => {
      const ticket = getTicket(id);
      if (!ticket.assigneeId && kind === "public") assign(id, me().id, me().id);
      addMessage(id, { author: me().id, kind, text });
      if (kind === "public" && after === "pending") setStatus(id, "pending", me().id);
      if (kind === "public" && after === "resolved") resolveTicket(id, { by: me().id, resolvedBy: "tech" });
    });
    composer = { ticketId: id, kind, text: "", note: "" };
    toast(t(kind === "internal" ? "ticket.noteSaved" : after === "resolved" ? "ticket.sentResolved" : "ticket.sent"), "success");
  },
});
