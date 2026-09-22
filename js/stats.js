// Analytics over the tickets. Pure functions: the numbers the dashboard shows and the AI reasons about.
import { CONFIG } from "./config.js";
import { DONE_STATUSES, SLA_STATES, ticketSla } from "./sla.js";
import { DAY, HOUR, MINUTE, addDays, avg, isoDate, round, startOfDay } from "./utils.js";

const isHandled = (t) => t.resolvedBy !== "self-service";

/** Most urgent first: breached (most overdue first), at risk, ok, paused; done tickets last. */
export function compareSla(a, b) {
  const rank = (s) => (s.response.done && s.resolution.done ? 99 : SLA_STATES.indexOf(s.state));
  return rank(a) - rank(b) || a.active.remaining - b.active.remaining;
}

/** Tickets of the same category arriving in a short window → probable outage. */
export function detectMassIncidents(tickets, now = new Date(), cfg = CONFIG.massIncident) {
  const since = now.getTime() - cfg.windowMinutes * MINUTE;
  const groups = new Map();
  for (const t of tickets) {
    if (new Date(t.createdAt).getTime() < since || t.resolvedBy === "self-service") continue;
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category).push(t);
  }
  return [...groups]
    .map(([category, list]) => ({
      category,
      tickets: list,
      count: list.length,
      requesters: new Set(list.map((t) => t.requester?.email)).size,
      firstAt: new Date(Math.min(...list.map((t) => new Date(t.createdAt)))),
      open: list.filter((t) => !DONE_STATUSES.has(t.status)).length,
    }))
    .filter((g) => g.count >= cfg.minTickets && g.requesters >= cfg.minTickets - 1 && g.open > 0)
    .sort((a, b) => b.count - a.count);
}

export function computeStats(state, sla, now = new Date(), { days = 30 } = {}) {
  const since = now.getTime() - days * DAY;
  const tickets = state.tickets;
  const slaById = new Map(tickets.map((t) => [t.id, ticketSla(t, sla, now)]));
  const slaOf = (t) => slaById.get(t.id);
  const hours = (t) => slaOf(t).resolution.elapsed / HOUR;

  const recent = tickets.filter((t) => new Date(t.createdAt).getTime() >= since);
  const open = tickets.filter((t) => !DONE_STATUSES.has(t.status));
  const resolved = tickets.filter((t) => t.resolvedAt && new Date(t.resolvedAt).getTime() >= since);
  const handled = resolved.filter(isHandled);
  const met = (list) => (list.length ? list.filter((t) => slaOf(t).state === "met").length / list.length : null);

  const openStates = Object.fromEntries(SLA_STATES.map((s) => [s, 0]));
  for (const t of open) openStates[slaOf(t).state]++;

  const byCategory = CONFIG.categories
    .map((c) => {
      const inCat = recent.filter((t) => t.category === c.id);
      const done = handled.filter((t) => t.category === c.id);
      return {
        id: c.id,
        total: inCat.length,
        open: open.filter((t) => t.category === c.id).length,
        selfService: inCat.filter((t) => t.resolvedBy === "self-service").length,
        resolvedCount: done.length,
        avgResolutionH: done.length ? round(avg(done, hours), 1) : null,
        compliance: met(done),
      };
    })
    .sort((a, b) => b.total - a.total);

  const today = startOfDay(now);
  const byDay = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(today, i - 13);
    const key = isoDate(day);
    return {
      date: day,
      created: tickets.filter((t) => isoDate(t.createdAt) === key).length,
      resolved: tickets.filter((t) => t.resolvedAt && isoDate(t.resolvedAt) === key).length,
    };
  });

  const byTech = state.users.map((u) => {
    const mine = handled.filter((t) => t.assigneeId === u.id);
    return {
      id: u.id,
      open: open.filter((t) => t.assigneeId === u.id).length,
      resolved: mine.length,
      avgResolutionH: mine.length ? round(avg(mine, hours), 1) : null,
      compliance: met(mine),
    };
  });

  return {
    days,
    now,
    slaById,
    total: recent.length,
    open: open.length,
    unassigned: open.filter((t) => !t.assigneeId).length,
    openStates,
    compliance: met(handled),
    responseCompliance: handled.length ? handled.filter((t) => slaOf(t).response.state === "met").length / handled.length : null,
    selfServiceRate: recent.length ? recent.filter((t) => t.resolvedBy === "self-service").length / recent.length : 0,
    aiRate: recent.length ? recent.filter((t) => t.resolvedBy === "ai").length / recent.length : 0,
    avgResolutionH: handled.length ? round(avg(handled, hours), 1) : null,
    byCategory,
    byDay,
    byTech,
    massIncidents: detectMassIncidents(tickets, now),
    queue: open.map((t) => ({ ticket: t, sla: slaOf(t) })).sort((a, b) => compareSla(a.sla, b.sla)),
  };
}

/** Compact JSON the AI receives for the report and the chat. Numbers are already computed. */
export function buildSnapshot(state, stats, { lang, labels }) {
  const userName = new Map(state.users.map((u) => [u.id, u.name]));
  const minutes = (ms) => Math.round(ms / MINUTE);
  return {
    now: stats.now.toISOString(),
    period_days: stats.days,
    totals: {
      tickets_in_period: stats.total,
      open: stats.open,
      unassigned: stats.unassigned,
      open_by_sla_state: stats.openStates,
      sla_compliance_pct: stats.compliance == null ? null : Math.round(stats.compliance * 100),
      first_response_compliance_pct: stats.responseCompliance == null ? null : Math.round(stats.responseCompliance * 100),
      self_service_pct: Math.round(stats.selfServiceRate * 100),
      resolved_by_ai_pct: Math.round(stats.aiRate * 100),
      avg_resolution_business_hours: stats.avgResolutionH,
    },
    categories: stats.byCategory.map((c) => ({
      category: labels.category(c.id),
      tickets: c.total,
      open: c.open,
      self_service: c.selfService,
      avg_resolution_business_hours: c.avgResolutionH,
      sla_compliance_pct: c.compliance == null ? null : Math.round(c.compliance * 100),
    })),
    technicians: stats.byTech.map((b) => ({
      name: userName.get(b.id),
      open: b.open,
      resolved: b.resolved,
      avg_resolution_business_hours: b.avgResolutionH,
      sla_compliance_pct: b.compliance == null ? null : Math.round(b.compliance * 100),
    })),
    mass_incidents: stats.massIncidents.map((m) => ({ category: labels.category(m.category), tickets_last_hour: m.count, people: m.requesters })),
    open_tickets: stats.queue.map(({ ticket: t, sla }) => ({
      id: t.id,
      title: t.title,
      category: labels.category(t.category),
      priority: t.priority,
      status: t.status,
      team: labels.team(t.team),
      assignee: userName.get(t.assigneeId) ?? null,
      requester: t.requester?.name,
      sla_state: sla.state,
      sla_minutes_left: minutes(sla.active.remaining),
    })),
    language: lang,
  };
}
