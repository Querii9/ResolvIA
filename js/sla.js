// SLA engine. Pure functions: business-time maths, pauses and the traffic light.
//
//   elapsed   = business time since the ticket was created (minus the time it was waiting on the requester)
//   remaining = target − elapsed
//   state     = ok · risk (≥ warnAt of the target) · breached · paused · met (done in time)
import { HOUR, addDays, startOfDay } from "./utils.js";

export const SLA_STATES = ["breached", "risk", "paused", "ok", "met"]; // worst first
export const PAUSE_STATUSES = new Set(["pending"]);
export const DONE_STATUSES = new Set(["resolved", "closed"]);

/** Business milliseconds between two dates for a calendar { start, end, days, allDay }. */
export function businessMs(from, to, cal) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!(b > a)) return 0;
  if (cal.allDay) return b - a;
  let total = 0;
  let day = startOfDay(a);
  for (let i = 0; day.getTime() < b && i < 800; i++) {
    if (cal.days.includes(day.getDay())) {
      const open = day.getTime() + cal.start * HOUR;
      const close = day.getTime() + cal.end * HOUR;
      const s = Math.max(a, open);
      const e = Math.min(b, close);
      if (e > s) total += e - s;
    }
    day = addDays(day, 1);
  }
  return total;
}

/** The date reached after adding `ms` of business time to `from`. */
export function addBusinessMs(from, ms, cal) {
  const start = new Date(from).getTime();
  if (cal.allDay) return new Date(start + ms);
  let t = start;
  let left = ms;
  for (let i = 0; i < 800; i++) {
    const day = startOfDay(t);
    if (cal.days.includes(day.getDay())) {
      const open = day.getTime() + cal.start * HOUR;
      const close = day.getTime() + cal.end * HOUR;
      const s = Math.max(t, open);
      if (s < close) {
        if (left <= close - s) return new Date(s + left);
        left -= close - s;
      }
    }
    t = addDays(day, 1).getTime();
  }
  return new Date(t);
}

/** The date reached after going back `ms` of business time from `to` (used by the demo generator). */
export function subtractBusinessMs(to, ms, cal) {
  const end = new Date(to).getTime();
  if (cal.allDay) return new Date(end - ms);
  let t = end;
  let left = ms;
  for (let i = 0; i < 800; i++) {
    const day = startOfDay(t - 1);
    if (cal.days.includes(day.getDay())) {
      const open = day.getTime() + cal.start * HOUR;
      const close = day.getTime() + cal.end * HOUR;
      const e = Math.min(t, close);
      if (e > open) {
        if (left <= e - open) return new Date(e - left);
        left -= e - open;
      }
    }
    t = day.getTime();
  }
  return new Date(t);
}

/** Is `date` inside business hours? */
export function isBusinessTime(date, cal) {
  if (cal.allDay) return true;
  const d = new Date(date);
  const h = d.getHours() + d.getMinutes() / 60;
  return cal.days.includes(d.getDay()) && h >= cal.start && h < cal.end;
}

/** Intervals the ticket spent waiting on the requester (resolution clock stopped). */
function pauses(ticket, end) {
  const log = [...(ticket.statusLog ?? [])].sort((a, b) => new Date(a.at) - new Date(b.at));
  const list = [];
  let from = null;
  for (const entry of log) {
    const at = new Date(entry.at);
    if (PAUSE_STATUSES.has(entry.status) && !from) from = at;
    else if (!PAUSE_STATUSES.has(entry.status) && from) {
      list.push([from, at]);
      from = null;
    }
  }
  if (from) list.push([from, end]);
  return list;
}

function clock({ elapsed, target, done, paused, warnAt }) {
  let state;
  if (done) state = elapsed <= target ? "met" : "breached";
  else if (elapsed > target) state = "breached";
  else if (paused) state = "paused";
  else if (elapsed >= warnAt * target) state = "risk";
  else state = "ok";
  return { target, elapsed, remaining: target - elapsed, used: target ? elapsed / target : 0, state, done };
}

/**
 * Full SLA picture for a ticket.
 * Returns { response, resolution, state (worst of both, ignoring met), due (Date|null) }.
 */
export function ticketSla(ticket, sla, now = new Date()) {
  const target = sla.targets[ticket.priority] ?? sla.targets.P3;
  const cal = { ...sla.businessHours, allDay: Boolean(target.allDay) };
  const created = new Date(ticket.createdAt);
  const done = DONE_STATUSES.has(ticket.status);

  const responseEnd = ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : done ? new Date(ticket.resolvedAt ?? now) : now;
  const response = clock({
    elapsed: businessMs(created, responseEnd, cal),
    target: target.response * HOUR,
    done: Boolean(ticket.firstResponseAt) || done,
    paused: false,
    warnAt: sla.warnAt,
  });

  const resolutionEnd = done && ticket.resolvedAt ? new Date(ticket.resolvedAt) : now;
  const pausedMs = pauses(ticket, resolutionEnd).reduce((total, [a, b]) => total + businessMs(a, b, cal), 0);
  const resolution = clock({
    elapsed: Math.max(0, businessMs(created, resolutionEnd, cal) - pausedMs),
    target: target.resolution * HOUR,
    done,
    paused: PAUSE_STATUSES.has(ticket.status),
    warnAt: sla.warnAt,
  });

  // The clock that matters now: the response one until someone answers, then the resolution one.
  const active = !response.done ? response : resolution;
  const due = done || resolution.state === "paused" ? null : addBusinessMs(now, Math.max(0, active.remaining), cal);
  const rank = (s) => SLA_STATES.indexOf(s);
  const state = done ? (response.state === "breached" || resolution.state === "breached" ? "breached" : "met") : rank(response.state) < rank(resolution.state) ? response.state : resolution.state;

  return { response, resolution, active, state, due, calendar: cal };
}
