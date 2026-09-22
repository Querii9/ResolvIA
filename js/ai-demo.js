// Demo mode: what the AI features do when there is no API key.
// Rules and templates over the real data; the UI labels the results as demo.
import { CONFIG } from "./config.js";
import { autoLabel, catLabel, fmtDuration, fmtHours, fmtPct, getLang, prioLabel, t, teamLabel } from "./i18n.js";
import { getGuide, getGuides, getUser } from "./store.js";
import { loc, normalize, wait } from "./utils.js";

const CATEGORY_WORDS = {
  access: ["contrasenya", "contrasena", "password", "clau", "bloquejat", "bloqueado", "locked", "login", "sessio", "sesion", "sign", "mfa", "autenticador", "authenticator", "acces", "acceso", "access", "usuari", "usuario"],
  email: ["correu", "correo", "email", "mail", "outlook", "bustia", "buzon", "mailbox", "regla", "rule", "vacances", "vacaciones", "calendari", "calendario", "adjunt", "adjunto"],
  network: ["vpn", "wifi", "internet", "xarxa", "red", "network", "connexio", "conexion", "connect", "cable", "remot", "remoto"],
  office: ["excel", "word", "powerpoint", "onedrive", "sharepoint", "fitxer", "fichero", "archivo", "file", "document", "full", "hoja", "formula", "plantilla"],
  hardware: ["portatil", "ordinador", "ordenador", "laptop", "computer", "pantalla", "monitor", "screen", "teclat", "teclado", "keyboard", "ratoli", "raton", "mouse", "bateria", "battery", "carregador", "cargador", "lent", "lento", "slow"],
  printing: ["impressora", "impresora", "printer", "imprimir", "print", "toner", "escaner", "scanner", "paper", "papel"],
  software: ["teams", "programa", "aplicacio", "aplicacion", "app", "instal", "llicencia", "licencia", "license", "erp", "crm", "sap", "actualitzacio", "actualizacion", "update", "zoom", "navegador", "browser"],
  phone: ["mobil", "movil", "mobile", "telefon", "telefono", "phone", "extensio", "extension", "trucada", "llamada", "call", "sim"],
};

const tokens = (text) => normalize(text).split(" ").filter((w) => w.length >= 3);
// A keyword counts if a word starts like it ("contrasenyes" ~ "contrasenya"); phrases must appear as such.
const hits = (words, keywords, whole = words.join(" ")) =>
  keywords.filter((k) => (k.includes(" ") ? whole.includes(k) : words.some((w) => w.startsWith(k.slice(0, Math.max(4, k.length - 2))) || (w.length >= 4 && k.startsWith(w))))).length;

/** Best guide for a text, by keyword overlap. */
export function matchGuide(text) {
  const words = tokens(text);
  let best = { guide: null, score: 0 };
  for (const guide of getGuides()) {
    const score = hits(words, (guide.keywords ?? []).map(normalize));
    if (score > best.score) best = { guide, score };
  }
  return best.score >= 1 ? best : { guide: null, score: 0 };
}

function matchCategory(text) {
  const words = tokens(text);
  let best = { id: null, score: 0 };
  for (const [id, keywords] of Object.entries(CATEGORY_WORDS)) {
    const score = hits(words, keywords);
    if (score > best.score) best = { id, score };
  }
  return best.id;
}

function guessPriority(text) {
  const s = normalize(text);
  if (/tota l oficina|toda la oficina|everyone|ningu pot|nadie puede|nobody can|caigut|caido|is down|no funciona res|no funciona nada|servidor/.test(s)) return "P1";
  if (/no puc treballar|no puedo trabajar|can t work|cannot work|urgent|bloquejat|bloqueado|locked|client|reunio|reunion|meeting/.test(s)) return "P2";
  if (/quan pugueu|cuando podais|when you can|consulta|pregunta|dubte|duda|question|com es fa|como se hace|how do i|voldria|quisiera|would like/.test(s)) return "P4";
  return "P3";
}

function makeTitle(text) {
  const first = String(text).trim().split(/(?<=[.!?])\s|\n/)[0].replace(/\s+/g, " ");
  const cut = first.length > 64 ? `${first.slice(0, 62).replace(/\s+\S*$/, "")}…` : first;
  return cut.charAt(0).toUpperCase() + cut.slice(1).replace(/[.!]+$/, "");
}

const guideTitle = (guide) => loc(guide?.title, getLang());
const firstName = (ticket) => ticket.requester?.name?.split(" ")[0] ?? "";

export async function analyzeDemo(text) {
  await wait(700);
  const { guide, score } = matchGuide(text);
  const category = guide?.category ?? matchCategory(text) ?? "software";
  const priority = guessPriority(text);
  const confidence = guide ? Math.min(0.95, 0.5 + score * 0.12) : 0.3;
  const selfService = Boolean(guide) && confidence >= 0.6 && priority !== "P1";
  return {
    title: makeTitle(text),
    category,
    priority,
    team: CONFIG.categories.find((c) => c.id === category)?.team ?? "servicedesk",
    guide_id: guide?.id ?? null,
    automation_id: guide?.automation && confidence >= 0.62 ? guide.automation : null,
    confidence,
    self_service: selfService,
    reason: t("demo.reason", { category: catLabel(category), priority: prioLabel(priority) }),
    user_message: guide ? t("demo.userGuide", { guide: guideTitle(guide) }) : t("demo.userTeam", { team: teamLabel(CONFIG.categories.find((c) => c.id === category)?.team) }),
  };
}

export async function resolveDemo(ticket) {
  await wait(900);
  const guide = ticket.guideId ? getGuide(ticket.guideId) : matchGuide(`${ticket.title} ${ticket.description}`).guide;
  const automation = ticket.automationId ?? guide?.automation ?? null;
  const fixable = ["access", "email", "office", "software"].includes(ticket.category) && ticket.priority !== "P1";
  const canResolve = Boolean(automation) || (Boolean(guide) && fixable);
  const vars = { name: firstName(ticket), action: autoLabel(automation), guide: guideTitle(guide) };
  return {
    can_resolve: canResolve,
    confidence: automation ? 0.9 : guide && fixable ? 0.74 : 0.2,
    guide_id: guide?.id ?? null,
    automation_id: automation,
    reply: canResolve ? t(automation ? "demo.replyAction" : "demo.replyGuideOnly", vars) : "",
    reason: canResolve ? t(automation ? "demo.reasonAction" : "demo.reasonGuide", vars) : t("demo.reasonNo"),
  };
}

export async function replyDemo(ticket, author) {
  await wait(700);
  const guide = ticket.guideId ? getGuide(ticket.guideId) : matchGuide(`${ticket.title} ${ticket.description}`).guide;
  const parts = [
    t("demo.replyHello", { name: firstName(ticket) }),
    guide ? t("demo.replyWithGuide", { guide: guideTitle(guide) }) : t("demo.replyChecking"),
    t("demo.replyBye"),
    author?.name ?? "",
  ];
  return {
    reply: parts.filter(Boolean).join("\n\n"),
    internal_note: guide?.automation ? t("demo.noteAutomation", { action: autoLabel(guide.automation) }) : "",
  };
}

export async function reportDemo(stats) {
  await wait(900);
  const top = stats.byCategory[0];
  const slow = [...stats.byCategory].filter((c) => c.avgResolutionH != null && c.resolvedCount >= 2).sort((a, b) => b.avgResolutionH - a.avgResolutionH)[0];
  const mass = stats.massIncidents[0];
  const withGuides = new Set(getGuides().map((g) => g.category));
  const opportunity = stats.byCategory.find((c) => withGuides.has(c.id) && c.total >= 4 && c.selfService / c.total < 0.35);
  const topPct = stats.total ? top.total / stats.total : 0;

  const findings = [
    { title: t("demo.findTop", { cat: catLabel(top.id) }), detail: t("demo.findTopDetail", { n: top.total, pct: fmtPct(topPct), days: stats.days }), severity: topPct > 0.25 ? "medium" : "low" },
  ];
  if (slow) findings.push({ title: t("demo.findSlow", { cat: catLabel(slow.id) }), detail: t("demo.findSlowDetail", { h: fmtHours(slow.avgResolutionH), avg: fmtHours(stats.avgResolutionH) }), severity: "medium" });
  findings.push({
    title: t("demo.findSla", { pct: fmtPct(stats.compliance) }),
    detail: t("demo.findSlaDetail", { breached: stats.openStates.breached, risk: stats.openStates.risk }),
    severity: stats.compliance < 0.8 ? "high" : stats.compliance < 0.9 ? "medium" : "low",
  });
  if (mass) findings.unshift({ title: t("demo.findMass", { cat: catLabel(mass.category) }), detail: t("demo.findMassDetail", { n: mass.count, people: mass.requesters }), severity: "high" });
  if (opportunity) findings.push({ title: t("demo.findSelf", { cat: catLabel(opportunity.id) }), detail: t("demo.findSelfDetail", { n: opportunity.total, self: opportunity.selfService }), severity: "low" });

  const recommendations = [
    mass && t("demo.recMass", { cat: catLabel(mass.category) }),
    opportunity && t("demo.recSelf", { cat: catLabel(opportunity.id) }),
    slow && t("demo.recSlow", { cat: catLabel(slow.id) }),
    stats.openStates.breached && t("demo.recBreached", { n: stats.openStates.breached }),
  ].filter(Boolean);

  return {
    headline: mass ? t("demo.headMass", { cat: catLabel(mass.category) }) : t("demo.headTop", { cat: catLabel(top.id), pct: fmtPct(topPct) }),
    summary: t("demo.summary", { total: stats.total, open: stats.open, sla: fmtPct(stats.compliance), self: fmtPct(stats.selfServiceRate), ai: fmtPct(stats.aiRate) }),
    findings: findings.slice(0, 5),
    recommendations: recommendations.length ? recommendations : [t("demo.recNone")],
  };
}

export async function guideDemo({ topic, ticket }) {
  await wait(1100);
  const subject = topic || ticket?.title || "";
  const category = ticket?.category ?? matchCategory(subject) ?? "software";
  return {
    title: makeTitle(subject),
    summary: t("demo.guideSummary", { topic: subject.toLowerCase() }),
    category,
    keywords: tokens(subject).slice(0, 10),
    body: t("demo.guideBody", { topic: subject.toLowerCase() }),
  };
}

// ── Chat: answers the suggested questions with rules ─────────────────

const INTENTS = [
  ["risk", /venc|breach|risc|riesgo|risk|sla|urgent/],
  ["mass", /massiv|masiv|caigud|caid|outage|alerta/],
  ["slow", /triga|tarda|slow|lent|lento|longest|mes temps|mas tiempo/],
  ["tech", /tecnic|technic|workload|carrega|carga|equip|equipo/],
  ["top", /mes |mas |most|entren|entran|categor|volum/],
];

export function chatDemo(question, stats) {
  const q = `${normalize(question)} `;
  const intent = INTENTS.find(([, re]) => re.test(q))?.[0];
  const line = (text) => `- ${text}`;
  switch (intent) {
    case "risk": {
      const urgent = stats.queue.filter(({ sla }) => sla.state === "breached" || sla.state === "risk").slice(0, 6);
      if (!urgent.length) return t("demo.chatRiskNone");
      return [
        t("demo.chatRisk", { n: urgent.length }),
        "",
        ...urgent.map(({ ticket, sla }) =>
          line(t(sla.state === "breached" ? "demo.chatRiskLate" : "demo.chatRiskSoon", { id: ticket.id, title: ticket.title, time: fmtDuration(sla.active.remaining), who: getUser(ticket.assigneeId)?.name ?? t("tickets.unassigned") })),
        ),
      ].join("\n");
    }
    case "mass": {
      if (!stats.massIncidents.length) return t("demo.chatMassNone");
      return stats.massIncidents.map((m) => t("demo.chatMass", { cat: catLabel(m.category), n: m.count, people: m.requesters })).join("\n\n");
    }
    case "slow": {
      const slow = [...stats.byCategory].filter((c) => c.avgResolutionH != null).sort((a, b) => b.avgResolutionH - a.avgResolutionH).slice(0, 3);
      return [t("demo.chatSlow"), "", ...slow.map((c) => line(t("demo.chatSlowLine", { cat: catLabel(c.id), h: fmtHours(c.avgResolutionH), sla: fmtPct(c.compliance) })))].join("\n");
    }
    case "tech": {
      const rows = stats.byTech.filter((b) => b.open || b.resolved).sort((a, b) => b.open - a.open);
      return [t("demo.chatTech"), "", ...rows.map((b) => line(t("demo.chatTechLine", { name: getUser(b.id)?.name, open: b.open, done: b.resolved, sla: fmtPct(b.compliance) })))].join("\n");
    }
    case "top": {
      const top = stats.byCategory.slice(0, 4);
      return [t("demo.chatTop", { days: stats.days }), "", ...top.map((c) => line(t("demo.chatTopLine", { cat: catLabel(c.id), n: c.total, pct: fmtPct(stats.total ? c.total / stats.total : 0) })))].join("\n");
    }
    default:
      return t("chat.demoFallback");
  }
}
