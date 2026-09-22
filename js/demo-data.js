// Demo service desk: technicians + ~150 tickets over the last 45 days, generated relative to "now"
// so the SLA traffic light always looks alive. Deterministic: same seed → same data.
import { CONFIG } from "./config.js";
import { MASS_INCIDENT, REQUESTERS, TECHNICIANS, TICKET_TEMPLATES } from "./demo-templates.js";
import { businessMs, subtractBusinessMs, addBusinessMs } from "./sla.js";
import { DAY, HOUR, MINUTE, loc, seededRandom } from "./utils.js";

const HISTORY_DAYS = 45;
const HISTORY_TICKETS = 132;

// Short generic messages used in the demo conversations.
const PHRASES = {
  ack: {
    ca: "Hola! Ja ho tinc. Ho reviso i et dic alguna cosa aviat.",
    es: "¡Hola! Ya lo tengo. Lo reviso y te digo algo pronto.",
    en: "Hi! Got it. I'm looking into it and will get back to you soon.",
  },
  ask: {
    ca: "Em pots enviar una captura de pantalla de l'error, si us plau? Així ho podré mirar millor.",
    es: "¿Me puedes enviar una captura de pantalla del error, por favor? Así lo podré mirar mejor.",
    en: "Could you send me a screenshot of the error, please? That will help me check it.",
  },
  thanks: {
    ca: "Gràcies! Ara ja funciona.",
    es: "¡Gracias! Ya funciona.",
    en: "Thanks! It works now.",
  },
  selfService: {
    ca: "Resolt per l'usuari seguint la guia d'autoservei.",
    es: "Resuelto por el usuario siguiendo la guía de autoservicio.",
    en: "Solved by the employee using the self-service guide.",
  },
  aiAction: {
    ca: "He executat l'acció automàtica i ja està resolt. Si encara tens problemes, respon aquest missatge.",
    es: "He ejecutado la acción automática y ya está resuelto. Si todavía tienes problemas, responde a este mensaje.",
    en: "I ran the automatic action and it's fixed. If you still have problems, just reply to this message.",
  },
};

export function buildDemoData(lang = "en", now = new Date()) {
  const rnd = seededRandom(20260922);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const between = (a, b) => a + rnd() * (b - a);
  const weighted = (list) => {
    let r = rnd() * list.reduce((s, x) => s + (x.weight ?? 1), 0);
    for (const x of list) if ((r -= x.weight ?? 1) <= 0) return x;
    return list.at(-1);
  };
  const cal = { ...CONFIG.sla.businessHours, allDay: false };
  const iso = (d) => new Date(d).toISOString();
  const text = (value) => loc(value, lang);

  const users = TECHNICIANS.map((tech) => ({ ...tech, createdAt: iso(now.getTime() - 200 * DAY), demo: true }));
  const byTeam = (team) => users.filter((u) => u.team === team);
  const techFor = (team) => pick(byTeam(team).length ? byTeam(team) : users);
  const calFor = (priority) => ({ ...cal, allDay: Boolean(CONFIG.sla.targets[priority]?.allDay) });

  const tickets = [];
  let seq = 1000;

  const make = (tpl, created, extra = {}) => {
    const requester = extra.requester ?? pick(REQUESTERS);
    const ticket = {
      id: `${CONFIG.ticketPrefix}-${++seq}`,
      title: text(tpl.title),
      description: text(tpl.description),
      requester: { name: requester.name, email: requester.email, department: requester.department },
      category: tpl.category,
      priority: extra.priority ?? tpl.priority,
      team: tpl.team,
      status: "new",
      assigneeId: null,
      createdAt: iso(created),
      firstResponseAt: null,
      resolvedAt: null,
      closedAt: null,
      resolvedBy: null,
      guideId: tpl.guide ?? null,
      automationId: tpl.automation ?? null,
      source: rnd() < 0.75 ? "portal" : "console",
      ai: null,
      messages: [],
      statusLog: [{ status: "new", at: iso(created), by: "requester" }],
      demo: { tpl: tpl.id ?? "mass", variant: extra.variant ?? null },
    };
    if (ticket.source === "portal") ticket.ai = { category: tpl.category, priority: ticket.priority, team: tpl.team, guide_id: tpl.guide ?? null, confidence: Math.round(between(0.66, 0.96) * 100) / 100 };
    tickets.push(ticket);
    return ticket;
  };

  const message = (ticket, author, at, key, kind = "public") => {
    ticket.messages.push({ id: `msg-${ticket.id}-${ticket.messages.length}`, author, kind, text: text(PHRASES[key] ?? key), key, at: iso(at) });
  };
  const status = (ticket, value, at, by) => {
    ticket.status = value;
    ticket.statusLog.push({ status: value, at: iso(at), by });
  };

  // ── History: resolved and closed tickets ──
  const windowBiz = businessMs(now.getTime() - HISTORY_DAYS * DAY, now.getTime() - 20 * HOUR, cal);
  for (let i = 0; i < HISTORY_TICKETS; i++) {
    const tpl = weighted(TICKET_TEMPLATES);
    const created = subtractBusinessMs(now.getTime() - 20 * HOUR, rnd() * windowBiz, cal);
    const ticket = make(tpl, created);
    const pCal = calFor(ticket.priority);
    const target = CONFIG.sla.targets[ticket.priority];

    const byAi = tpl.automation && rnd() < 0.6;
    if (!byAi && tpl.selfService && rnd() < 0.6) {
      const at = new Date(created.getTime() + between(2, 6) * MINUTE);
      ticket.resolvedBy = "self-service";
      ticket.resolvedAt = iso(at);
      ticket.messages.push({ id: `msg-${ticket.id}-0`, author: "system", kind: "system", text: text(PHRASES.selfService), key: "selfService", at: iso(at) });
      status(ticket, "resolved", at, "requester");
      status(ticket, "closed", at.getTime() + 3 * DAY, "system");
      ticket.closedAt = iso(at.getTime() + 3 * DAY);
      continue;
    }
    if (byAi) {
      const at = new Date(created.getTime() + between(3, 9) * MINUTE);
      message(ticket, "ai", at, "aiAction");
      ticket.firstResponseAt = iso(at);
      ticket.resolvedBy = "ai";
      ticket.resolvedAt = iso(at);
      status(ticket, "resolved", at, "ai");
      continue;
    }

    const tech = techFor(tpl.team);
    ticket.assigneeId = tech.id;
    const responded = addBusinessMs(created, target.response * HOUR * between(0.15, 1.25), pCal);
    // Most tickets are solved in time; a few drag on (that's what the SLA report is for).
    const slow = rnd() < 0.14 ? between(1.3, 2.2) : 1;
    const effort = Math.min(between(tpl.effort[0], tpl.effort[1]) * slow, target.resolution * 60 * (slow > 1 ? slow : 0.95));
    const resolved = addBusinessMs(responded, effort * MINUTE, pCal);
    if (resolved > now) {
      tickets.pop();
      continue;
    }
    message(ticket, tech.id, responded, "ack");
    ticket.firstResponseAt = iso(responded);
    status(ticket, "open", responded, tech.id);
    message(ticket, tech.id, resolved, `reply:${tpl.id}`);
    ticket.messages.at(-1).text = text(tpl.reply);
    ticket.resolvedBy = "tech";
    ticket.resolvedAt = iso(resolved);
    status(ticket, "resolved", resolved, tech.id);
    if (now - resolved > 3 * DAY) {
      ticket.closedAt = iso(resolved.getTime() + 3 * DAY);
      status(ticket, "closed", ticket.closedAt, "system");
    }
  }

  // ── Open queue: every SLA state represented ──
  const open = [
    ...Array(3).fill("breached"),
    ...Array(4).fill("risk"),
    ...Array(6).fill("ok"),
    ...Array(2).fill("pending"),
    ...Array(2).fill("new"),
  ];
  for (const kind of open) {
    const tpl = weighted(TICKET_TEMPLATES.filter((x) => x.priority !== "P1"));
    const priority = tpl.priority;
    const target = CONFIG.sla.targets[priority];
    const pCal = calFor(priority);
    const used = { breached: between(1.1, 1.5), risk: between(0.78, 0.94), ok: between(0.1, 0.5), pending: between(0.3, 0.6), new: between(0.1, 0.4) }[kind];
    const clockTarget = kind === "new" ? target.response : target.resolution;
    const created = subtractBusinessMs(now, used * clockTarget * HOUR, pCal);
    const ticket = make(tpl, created);
    if (kind === "new") continue;

    const tech = techFor(tpl.team);
    ticket.assigneeId = rnd() < 0.85 ? tech.id : null;
    const responded = addBusinessMs(created, Math.min(target.response * HOUR * between(0.2, 0.8), businessMs(created, now, pCal) * 0.5), pCal);
    const author = ticket.assigneeId ?? tech.id;
    message(ticket, author, responded, kind === "pending" ? "ask" : "ack");
    ticket.firstResponseAt = iso(responded);
    status(ticket, kind === "pending" ? "pending" : "open", responded, author);
  }

  // ── Mass incident: several people can't use the VPN in the last hour ──
  const people = [...REQUESTERS].sort(() => rnd() - 0.5);
  MASS_INCIDENT.variants.slice(0, 5).forEach((variant, i) => {
    const created = new Date(now.getTime() - (50 - i * 9 - between(0, 4)) * MINUTE);
    const ticket = make({ ...MASS_INCIDENT, id: "mass", title: variant.title, description: variant.description }, created, { requester: people[i], variant: i });
    if (i < 2) {
      const tech = techFor(MASS_INCIDENT.team);
      ticket.assigneeId = tech.id;
      const at = new Date(Math.min(now.getTime(), created.getTime() + 8 * MINUTE));
      message(ticket, tech.id, at, "ack");
      ticket.firstResponseAt = iso(at);
      status(ticket, "open", at, tech.id);
    }
  });

  tickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return {
    users,
    tickets,
    guides: [],
    guideStats: {},
    settings: {},
    meta: { demo: true, demoLang: lang, seq, createdAt: iso(now) },
  };
}

/** When the language changes, translate the demo tickets (only text that hasn't been edited). */
export function translateDemo(state, lang) {
  const templates = new Map(TICKET_TEMPLATES.map((x) => [x.id, x]));
  for (const ticket of state.tickets) {
    if (!ticket.demo) continue;
    const tpl = ticket.demo.tpl === "mass" ? MASS_INCIDENT.variants[ticket.demo.variant] : templates.get(ticket.demo.tpl);
    if (!tpl) continue;
    ticket.title = loc(tpl.title, lang);
    ticket.description = loc(tpl.description, lang);
    for (const m of ticket.messages) {
      if (!m.key) continue;
      if (m.key.startsWith("reply:")) m.text = loc(templates.get(m.key.slice(6))?.reply, lang) || m.text;
      else if (PHRASES[m.key]) m.text = loc(PHRASES[m.key], lang);
    }
  }
  state.meta.demoLang = lang;
}
