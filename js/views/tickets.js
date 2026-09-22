// Ticket queue: saved views, filters, search, and creating tickets from the console.
import { CONFIG } from "../config.js";
import { aiErrorMessage, analyzeRequest } from "../ai.js";
import { ticketRow, ticketTableHead } from "../components.js";
import { catLabel, prioLabel, t, teamLabel, th } from "../i18n.js";
import { DONE_STATUSES, ticketSla } from "../sla.js";
import { compareSla } from "../stats.js";
import { createTicket, getSessionUser, getSla, getState, assign, batch } from "../store.js";
import { aiTag, icon, on, openModal, toast, withBusy } from "../ui.js";
import { MINUTE, esc, normalize } from "../utils.js";

const VIEWS = ["open", "mine", "unassigned", "risk", "recent", "done", "all"];
const filters = { q: "", view: "open", category: "", priority: "", team: "" };
const LIMIT = 200;

function applyQuery() {
  const query = new URLSearchParams(location.hash.split("?")[1] ?? "");
  if (!query.size) return;
  for (const key of ["view", "category", "priority", "team"]) if (query.has(key)) filters[key] = query.get(key);
  history.replaceState(null, "", "#/tickets");
}

export function renderTickets(root) {
  applyQuery();
  const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`;
  root.innerHTML = `
    <header class="page-head">
      <div><h1>${th("tickets.title")}</h1><p class="muted" id="tickets-count"></p></div>
      <button class="btn btn-primary" type="button" data-action="new-ticket">${icon("plus", 16)}<span>${th("tickets.new")}</span></button>
    </header>
    <div class="views" role="tablist" aria-label="${th("tickets.views")}">
      ${VIEWS.map((v) => `<button type="button" role="tab" data-action="tickets-view" data-view="${v}" aria-selected="${v === filters.view}" class="${v === filters.view ? "active" : ""}">${th(`tickets.view.${v}`)}<span class="count" id="count-${v}"></span></button>`).join("")}
    </div>
    <div class="toolbar">
      <label class="search">${icon("search", 16)}<input class="input" type="search" data-input="tickets-q" value="${esc(filters.q)}" placeholder="${th("tickets.search")}" aria-label="${th("tickets.search")}"></label>
      <select class="select" data-change="tickets-filter" name="category" aria-label="${th("tickets.colCategory")}">${option("", t("tickets.allCategories"), filters.category)}${CONFIG.categories.map((c) => option(c.id, catLabel(c.id), filters.category)).join("")}</select>
      <select class="select" data-change="tickets-filter" name="priority" aria-label="${th("tickets.colPriority")}">${option("", t("tickets.allPriorities"), filters.priority)}${CONFIG.priorities.map((p) => option(p.id, `${p.id} · ${prioLabel(p.id)}`, filters.priority)).join("")}</select>
      <select class="select" data-change="tickets-filter" name="team" aria-label="${th("tickets.team")}">${option("", t("tickets.allTeams"), filters.team)}${CONFIG.teams.map((x) => option(x.id, teamLabel(x.id), filters.team)).join("")}</select>
    </div>
    <div class="table-wrap"><table class="table tickets">${ticketTableHead()}<tbody id="tickets-body"></tbody></table></div>
    <p class="muted small center" id="tickets-more"></p>`;
  renderRows();
}

function matchesView(view, ticket, sla, me, now) {
  const done = DONE_STATUSES.has(ticket.status);
  switch (view) {
    case "open": return !done;
    case "mine": return !done && ticket.assigneeId === me?.id;
    case "unassigned": return !done && !ticket.assigneeId;
    case "risk": return !done && (sla.state === "breached" || sla.state === "risk");
    case "recent": return now - new Date(ticket.createdAt) < 60 * MINUTE;
    case "done": return done;
    default: return true;
  }
}

function renderRows() {
  const body = document.getElementById("tickets-body");
  if (!body) return;
  const me = getSessionUser();
  const now = new Date();
  const sla = getSla();
  const q = normalize(filters.q);
  const all = getState().tickets.map((ticket) => ({ ticket, sla: ticketSla(ticket, sla, now) }));
  const passes = ({ ticket }) =>
    (!filters.category || ticket.category === filters.category) &&
    (!filters.priority || ticket.priority === filters.priority) &&
    (!filters.team || ticket.team === filters.team) &&
    (!q || normalize(`${ticket.id} ${ticket.title} ${ticket.description} ${ticket.requester?.name}`).includes(q));

  for (const v of VIEWS) {
    const el = document.getElementById(`count-${v}`);
    if (el) el.textContent = all.filter((x) => passes(x) && matchesView(v, x.ticket, x.sla, me, now)).length;
  }
  const rows = all.filter((x) => passes(x) && matchesView(filters.view, x.ticket, x.sla, me, now));
  if (filters.view === "done") rows.sort((a, b) => new Date(b.ticket.resolvedAt ?? b.ticket.createdAt) - new Date(a.ticket.resolvedAt ?? a.ticket.createdAt));
  else if (filters.view === "all" || filters.view === "recent") rows.sort((a, b) => new Date(b.ticket.createdAt) - new Date(a.ticket.createdAt));
  else rows.sort((a, b) => compareSla(a.sla, b.sla));

  body.innerHTML = rows.length ? rows.slice(0, LIMIT).map(ticketRow).join("") : `<tr class="empty-row"><td colspan="8"><p class="empty">${th("tickets.empty")}</p></td></tr>`;
  document.getElementById("tickets-count").textContent = t("tickets.count", { n: rows.length });
  document.getElementById("tickets-more").textContent = rows.length > LIMIT ? t("tickets.showing", { n: LIMIT }) : "";
}

// ── New ticket from the console (phone call, walk-in…) ────────────────

function openNewTicket() {
  const me = getSessionUser();
  const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`;
  const modal = openModal({
    title: th("tickets.new"),
    size: "wide",
    body: `<form id="new-ticket" class="form" data-submit="create-ticket">
      <label class="field"><span>${th("tickets.whatHappens")}</span><textarea class="input" name="description" rows="4" required placeholder="${th("tickets.whatHappensPh")}"></textarea></label>
      <div class="row"><button class="btn btn-sm btn-ai" type="button" data-action="classify-new">${aiTag()}<span>${th("tickets.classify")}</span></button><span class="muted small" id="classify-note"></span></div>
      <label class="field"><span>${th("portal.title")}</span><input class="input" name="title" required maxlength="90"></label>
      <div class="form-row">
        <label class="field"><span>${th("tickets.requesterName")}</span><input class="input" name="name" required></label>
        <label class="field"><span>${th("team.email")}</span><input class="input" name="email" type="email" required></label>
      </div>
      <div class="form-row three">
        <label class="field"><span>${th("tickets.colCategory")}</span><select class="select" name="category">${CONFIG.categories.map((c) => option(c.id, catLabel(c.id), "access")).join("")}</select></label>
        <label class="field"><span>${th("tickets.colPriority")}</span><select class="select" name="priority">${CONFIG.priorities.map((p) => option(p.id, `${p.id} · ${prioLabel(p.id)}`, "P3")).join("")}</select></label>
        <label class="field"><span>${th("tickets.team")}</span><select class="select" name="team">${CONFIG.teams.map((x) => option(x.id, teamLabel(x.id), "servicedesk")).join("")}</select></label>
      </div>
      <label class="check"><input type="checkbox" name="assignMe" checked><span>${th("tickets.assignMe", { name: me?.name ?? "" })}</span></label>
      <input type="hidden" name="guideId"><input type="hidden" name="automationId">
    </form>`,
    footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button><button class="btn btn-primary" type="submit" form="new-ticket">${th("tickets.create")}</button>`,
  });
  modal.el.querySelector("textarea").focus();
}

on("click", {
  "open-ticket": (el) => (location.hash = `#/tickets/${el.dataset.id}`),
  "new-ticket": () => openNewTicket(),
  "tickets-view": (el) => {
    filters.view = el.dataset.view;
    document.querySelectorAll(".views [data-view]").forEach((b) => {
      const on = b.dataset.view === filters.view;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    renderRows();
  },
  "classify-new": (el) => {
    const form = el.closest("dialog").querySelector("form");
    const text = form.description.value.trim();
    if (!text) return form.description.focus();
    return withBusy(el, async () => {
      try {
        const r = await analyzeRequest(text);
        form.title.value = r.title;
        form.category.value = r.category;
        form.priority.value = r.priority;
        form.team.value = r.team;
        form.guideId.value = r.guide_id ?? "";
        form.automationId.value = r.automation_id ?? "";
        form.dataset.ai = JSON.stringify({ category: r.category, priority: r.priority, team: r.team, guide_id: r.guide_id, confidence: r.confidence, reason: r.reason, demo: r.demo });
        document.getElementById("classify-note").textContent = r.reason;
      } catch (err) {
        toast(aiErrorMessage(err), "error", 6000);
      }
    });
  },
});

on("input", {
  "tickets-q": (el) => {
    filters.q = el.value;
    renderRows();
  },
});

on("change", {
  "tickets-filter": (el) => {
    filters[el.name] = el.value;
    renderRows();
  },
});

on("submit", {
  "create-ticket": (form) => {
    const data = new FormData(form);
    const me = getSessionUser();
    form.closest("dialog").close();
    const ticket = batch(() => {
      const created = createTicket(
        {
          title: String(data.get("title")).trim(),
          description: String(data.get("description")).trim(),
          requester: { name: String(data.get("name")).trim(), email: String(data.get("email")).trim() },
          category: data.get("category"),
          priority: data.get("priority"),
          team: data.get("team"),
          guideId: data.get("guideId") || null,
          automationId: data.get("automationId") || null,
          ai: form.dataset.ai ? JSON.parse(form.dataset.ai) : null,
          source: "console",
        },
        me?.id,
      );
      if (data.get("assignMe") && me) assign(created.id, me.id, me.id);
      return created;
    });
    toast(t("tickets.created", { id: ticket.id }), "success");
    location.hash = `#/tickets/${ticket.id}`;
  },
});
