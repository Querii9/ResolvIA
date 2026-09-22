// Small pieces of markup shared by several views.
import { catIcon, catLabel, fmtDuration, fmtRel, getLang, t, th } from "./i18n.js";
import { getState, getUser } from "./store.js";
import { aiMini, avatar, icon, priorityTag, statusPill } from "./ui.js";
import { esc, loc, mdLite } from "./utils.js";

/** A guide as a card (portal and knowledge base). */
export function guideCard(guide, href) {
  const stats = getState().guideStats[guide.id] ?? {};
  const votes = (stats.helpful ?? 0) + (stats.notHelpful ?? 0);
  const origin = guide.source === "ai" ? aiMini() : !guide.builtIn ? `<span class="tag">${th("guides.custom")}</span>` : guide.edited ? `<span class="tag">${th("guides.edited")}</span>` : "";
  return `<a class="guide-card" href="${href}">
    <span class="gc-top"><span class="gc-icon">${icon(catIcon(guide.category), 18)}</span>${origin}</span>
    <strong>${esc(loc(guide.title, getLang()))}</strong>
    <span class="muted small clamp-2">${esc(loc(guide.summary, getLang()))}</span>
    <span class="gc-meta">${th("guides.minutes", { n: guide.minutes ?? 3 })}${votes ? ` · ${th("guides.helpfulPct", { pct: Math.round(((stats.helpful ?? 0) / votes) * 100) })}` : ""}</span>
  </a>`;
}

/** Guide text; numbered steps become a checklist the reader can tick off. */
export const guideBody = (guide) => `<div class="guide-body">${mdLite(loc(guide.body, getLang()))}</div>`;

document.addEventListener("click", (e) => {
  const step = e.target.closest(".guide-body ol[data-steps] > li");
  if (step) step.classList.toggle("done");
});

/** SLA traffic light: icon + time + state label (never colour alone). */
export function slaBadge(sla, { compact = false } = {}) {
  const s = sla.state;
  const active = sla.active;
  const late = Math.max(active.elapsed - active.target, 0);
  const map = {
    breached: { ic: "alert", text: sla.response.done && sla.resolution.done ? th("sla.outOfSla") : `+${fmtDuration(late)}` },
    risk: { ic: "clock", text: fmtDuration(active.remaining) },
    ok: { ic: "clock", text: fmtDuration(active.remaining) },
    paused: { ic: "pause", text: th("sla.paused") },
    met: { ic: "check", text: th("sla.met") },
  }[s];
  const label = s === "breached" && !sla.resolution.done ? t("sla.breachedFor", { time: fmtDuration(late) }) : t(`sla.${s}`);
  const which = !sla.response.done ? t("sla.clockResponse") : t("sla.clockResolution");
  // Timers get a spoken label; "Paused"/"Met" already say it in words.
  const spoken = compact || s === "paused" || s === "met" || (s === "breached" && sla.resolution.done) ? "" : `<span class="sr-only">${esc(label)}</span>`;
  return `<span class="sla" data-state="${s}" title="${esc(`${label} · ${which}`)}">${icon(map.ic, 14)}<span class="${s === "paused" || s === "met" ? "" : "mono"}">${map.text}</span>${spoken}</span>`;
}

export const catTag = (id) => `<span class="cat">${icon(catIcon(id), 14)}<span>${esc(catLabel(id))}</span></span>`;

export function userChip(userId, { size = 22, name = true } = {}) {
  const user = getUser(userId);
  if (!user) return `<span class="user-chip muted">${avatar(null, size)}${name ? `<span>${th("tickets.unassigned")}</span>` : ""}</span>`;
  return `<span class="user-chip">${avatar(user, size)}${name ? `<span class="truncate">${esc(user.name)}</span>` : ""}</span>`;
}

/** Compact queue (dashboard): id, title, priority, SLA, assignee. */
export const compactHead = () =>
  `<thead><tr><th>${th("tickets.colId")}</th><th>${th("tickets.colTitle")}</th><th>${th("tickets.colPriority")}</th><th>${th("tickets.colSla")}</th><th><span class="sr-only">${th("tickets.colAssignee")}</span></th></tr></thead>`;

export function compactRow({ ticket, sla }) {
  return `<tr data-action="open-ticket" data-id="${esc(ticket.id)}" tabindex="0">
    <td class="mono id">${esc(ticket.id)}</td>
    <td class="title-cell"><span class="truncate strong">${esc(ticket.title)}</span><span class="truncate sub">${esc(catLabel(ticket.category))} · ${esc(ticket.requester?.name ?? "")}</span></td>
    <td>${priorityTag(ticket.priority)}</td>
    <td>${slaBadge(sla)}</td>
    <td>${userChip(ticket.assigneeId, { name: false })}</td>
  </tr>`;
}

/** One row of the ticket queue (a real <tr>, the whole row opens the ticket). */
export function ticketRow({ ticket, sla }) {
  return `<tr data-action="open-ticket" data-id="${esc(ticket.id)}" tabindex="0">
    <td class="mono id">${esc(ticket.id)}</td>
    <td class="title-cell">
      <span class="truncate strong">${esc(ticket.title)}</span>
      <span class="truncate sub">${esc(ticket.requester?.name ?? "")}${ticket.ai ? ` · ${aiMini()}` : ""}</span>
    </td>
    <td>${catTag(ticket.category)}</td>
    <td>${priorityTag(ticket.priority)}</td>
    <td>${statusPill(ticket.status)}</td>
    <td>${slaBadge(sla)}</td>
    <td>${userChip(ticket.assigneeId, { name: false })}</td>
    <td class="muted nowrap">${esc(fmtRel(ticket.createdAt))}</td>
  </tr>`;
}

export const ticketTableHead = () => `<thead><tr>
  <th>${th("tickets.colId")}</th><th>${th("tickets.colTitle")}</th><th>${th("tickets.colCategory")}</th>
  <th>${th("tickets.colPriority")}</th><th>${th("tickets.colStatus")}</th><th>${th("tickets.colSla")}</th>
  <th><span class="sr-only">${th("tickets.colAssignee")}</span></th><th>${th("tickets.colCreated")}</th>
</tr></thead>`;
