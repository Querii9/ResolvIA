// AI layer. Every feature has two paths:
//   · live → the chosen provider (Claude, OpenAI or Gemini) through an adapter in js/providers/,
//            called straight from the browser with the user's own key
//   · demo → rules and templates from ai-demo.js when there is no key
// Prompts and JSON schemas live here and are shared by every provider.
import { CONFIG } from "./config.js";
import * as demo from "./ai-demo.js";
import { AIError } from "./ai-errors.js";
import { autoLabel, catLabel, getLang, t, teamLabel } from "./i18n.js";
import { buildSnapshot } from "./stats.js";
import { getGuide, getGuides, getModel, getProvider, getState, getUser, hasApiKey } from "./store.js";
import { loc, wait } from "./utils.js";

export { AIError };

const LANGUAGE_NAMES = { ca: "Catalan", es: "Spanish", en: "English" };
const language = () => LANGUAGE_NAMES[getLang()] ?? "English";

export const isLive = () => hasApiKey();
export const providerLabel = (provider = getProvider()) => CONFIG.ai.providers[provider]?.label ?? provider;

export function modelLabel(id) {
  for (const p of Object.values(CONFIG.ai.providers)) {
    const found = p.models.find((m) => m.id === id || id?.startsWith(`${m.id}-`));
    if (found) return found.label;
  }
  return id;
}

export function aiErrorMessage(err) {
  const code = err instanceof AIError ? err.code : "generic";
  const known = ["auth", "permission", "rate", "server", "network", "networkOrKey", "refusal", "truncated", "sdk", "format", "badRequest", "aborted"];
  return t(known.includes(code) ? `err.${code}` : "err.generic", { msg: err?.detail || err?.message || "", provider: providerLabel() });
}

// Adapters are loaded on demand, so each visitor only downloads the SDK they use.
const ADAPTERS = {
  anthropic: () => import("./providers/anthropic.js"),
  openai: () => import("./providers/openai.js"),
  gemini: () => import("./providers/gemini.js"),
};

async function live() {
  const provider = getProvider();
  return { adapter: await ADAPTERS[provider](), model: getModel(provider) };
}

async function structured(task, { system, text, schema }) {
  const { adapter, model } = await live();
  const { json, model: usedModel } = await adapter.structured({ model, effort: CONFIG.ai.effort[task], system, text, schema });
  try {
    return { data: JSON.parse(json), model: usedModel ?? model };
  } catch {
    throw new AIError("format");
  }
}

// ── Context shared with the model ──────────────────────────────────────

const ids = (list) => list.map((x) => x.id);
const catalogue = () =>
  JSON.stringify({
    categories: CONFIG.categories.map((c) => ({ id: c.id, name: catLabel(c.id), default_team: c.team })),
    teams: CONFIG.teams.map((x) => ({ id: x.id, name: teamLabel(x.id) })),
    priorities: {
      P1: "critical: a service is down or many people are affected",
      P2: "high: one person cannot work",
      P3: "normal: something is broken but there is a workaround",
      P4: "low: a question or a request",
    },
    guides: getGuides().map((g) => ({ id: g.id, category: g.category, title: loc(g.title, getLang()), summary: loc(g.summary, getLang()), automation: g.automation ?? null })),
    automations: CONFIG.automations.map((a) => ({ id: a.id, name: autoLabel(a.id) })),
  });

const ticketText = (ticket) =>
  JSON.stringify({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    requester: ticket.requester,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    conversation: ticket.messages
      .filter((m) => m.kind !== "system")
      .map((m) => ({ from: m.author === "requester" ? "requester" : m.author === "ai" ? "assistant" : getUser(m.author)?.name ?? "technician", internal: m.kind === "internal", text: m.text })),
  });

// Schemas follow the strictest common subset: every field required, no extra properties.
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const str = { type: "string" };

const ANALYZE_SCHEMA = obj({
  title: str,
  category: { type: "string", enum: ids(CONFIG.categories) },
  priority: { type: "string", enum: ids(CONFIG.priorities) },
  team: { type: "string", enum: ids(CONFIG.teams) },
  guide_id: str,
  automation_id: str,
  confidence: { type: "number" },
  self_service: { type: "boolean" },
  reason: str,
  user_message: str,
});

const RESOLVE_SCHEMA = obj({ can_resolve: { type: "boolean" }, confidence: { type: "number" }, guide_id: str, automation_id: str, reply: str, reason: str });
const REPLY_SCHEMA = obj({ reply: str, internal_note: str });
const REPORT_SCHEMA = obj({
  headline: str,
  summary: str,
  findings: { type: "array", items: obj({ title: str, detail: str, severity: { type: "string", enum: ["high", "medium", "low"] } }) },
  recommendations: { type: "array", items: str },
});
const GUIDE_SCHEMA = obj({ title: str, summary: str, category: { type: "string", enum: ids(CONFIG.categories) }, keywords: { type: "array", items: str }, body: str });

const validGuide = (id) => (id && getGuide(id) ? id : null);
const validAutomation = (id) => (id && CONFIG.automations.some((a) => a.id === id) ? id : null);

// ── Features ───────────────────────────────────────────────────────────

/** New request from the portal → category, priority, team, best guide, possible automatic fix. */
export async function analyzeRequest(text) {
  if (!isLive()) return { ...(await demo.analyzeDemo(text)), demo: true };
  const system = `You triage IT support requests for the service desk tool ${CONFIG.appName}.
Catalogue (JSON): ${catalogue()}

Rules:
- title: a short ticket title (max 8 words) in the same language as the request.
- category, priority, team: pick from the catalogue. Use the category's default team unless the text clearly says otherwise.
- guide_id: the id of the guide that most likely solves it, or "" if none fits well. Never invent ids.
- automation_id: an automation that would fix it without a technician (for example a password reset), or "".
- confidence: 0 to 1, how sure you are that the guide or automation solves the problem.
- self_service: true only if an employee could solve it alone by following the guide.
- reason: at most 20 words, why you chose this category and priority.
- user_message: 1–2 warm, plain sentences to the employee, in the language of the request. If there is a guide, invite them to try it; otherwise tell them the right team will take it.`;
  const { data, model } = await structured("triage", { system, text: `Request:\n"""${text}"""`, schema: ANALYZE_SCHEMA });
  return { ...data, guide_id: validGuide(data.guide_id), automation_id: validAutomation(data.automation_id), demo: false, model };
}

/** Proactive agent: can the AI solve this ticket by itself (guide and/or automatic action)? */
export async function resolveCheck(ticket) {
  if (!isLive()) return { ...(await demo.resolveDemo(ticket)), demo: true };
  const system = `You are the resolution agent of the service desk tool ${CONFIG.appName}. Decide if this ticket can be solved without a technician, using a guide from the catalogue and/or an automation.
Catalogue (JSON): ${catalogue()}

Rules:
- can_resolve: true only if the guide or the automation clearly fixes the problem described. Hardware failures, outages, purchases and anything ambiguous are false.
- confidence: 0 to 1.
- guide_id / automation_id: ids from the catalogue or "".
- reply: the message the requester will receive, in the requester's language: short, friendly, says what was done or which guide to follow. If can_resolve is false, "".
- reason: at most 20 words for the technician, in ${language()}.`;
  const { data, model } = await structured("resolve", { system, text: `Ticket (JSON):\n${ticketText(ticket)}`, schema: RESOLVE_SCHEMA });
  return { ...data, guide_id: validGuide(data.guide_id), automation_id: validAutomation(data.automation_id), demo: false, model };
}

/** Draft reply for the technician (plus an internal note). */
export async function suggestReply(ticket, author) {
  if (!isLive()) return { ...(await demo.replyDemo(ticket, author)), demo: true };
  const guide = ticket.guideId ? getGuide(ticket.guideId) : null;
  const system = `You write replies for IT technicians in the service desk tool ${CONFIG.appName}.
- reply: the next public message to the requester, in the language they wrote in. Warm and brief (max 90 words), concrete next steps, no jargon. Sign as ${author?.name ?? "the IT team"}.
- internal_note: 1–2 lines for colleagues in ${language()} (what to check next, or "" if nothing).
${guide ? `Relevant guide the requester can follow: "${loc(guide.title, getLang())}" — ${loc(guide.summary, getLang())}` : ""}`;
  const { data, model } = await structured("reply", { system, text: `Ticket (JSON):\n${ticketText(ticket)}`, schema: REPLY_SCHEMA });
  return { ...data, demo: false, model };
}

const statLabels = { category: catLabel, team: teamLabel };

/** Manager report: what comes in most, what takes longest, SLA, and what to do about it. */
export async function buildReport(stats) {
  if (!isLive()) return { ...(await demo.reportDemo(stats)), demo: true };
  const snapshot = buildSnapshot(getState(), stats, { lang: getLang(), labels: statLabels });
  delete snapshot.open_tickets;
  const system = `You analyse service desk data for the IT manager using ${CONFIG.appName}. The numbers are already computed: trust them, don't recompute. Write everything in ${language()}.
- headline: max 12 words, the single most important takeaway.
- summary: max 3 sentences.
- findings: 3 to 5, each with a short title, one concrete sentence with numbers, and severity. Cover: what comes in most, what takes longest to resolve, SLA compliance, self-service and automation opportunities, any mass incident.
- recommendations: 2 to 4 concrete actions (for example "Publish the password guide on the intranet: 28% of tickets are passwords").`;
  const { data, model } = await structured("report", { system, text: `Data (JSON, last ${stats.days} days):\n${JSON.stringify(snapshot)}`, schema: REPORT_SCHEMA });
  return { ...data, demo: false, model };
}

/** Draft of a new self-service guide, from a topic or from a ticket. */
export async function generateGuide({ topic, ticket }) {
  if (!isLive()) return { ...(await demo.guideDemo({ topic, ticket })), demo: true };
  const system = `You write self-service guides for non-technical employees, for the knowledge base of ${CONFIG.appName}. Write in ${language()}.
- title: clear and specific (max 8 words). summary: one sentence.
- body: simple Markdown only (paragraphs, "### " subheadings, numbered steps "1. ", "- " bullets, **bold** for menu names). Structure: one short intro sentence; "### " + a steps heading with 4–8 numbered steps; a final "### " heading for when it doesn't work, suggesting to open a ticket. 90–170 words. No links, no tables, no emojis. Keep it generic (Microsoft 365 / Windows) unless the topic says otherwise.
- keywords: 8–14 lowercase words without accents, mixing Catalan, Spanish and English, the way employees would describe the problem.`;
  const text = ticket ? `Write a guide that would have solved this ticket (JSON):\n${ticketText(ticket)}` : `Topic:\n"""${topic}"""`;
  const { data, model } = await structured("guide", { system, text, schema: GUIDE_SCHEMA });
  return { ...data, demo: false, model };
}

/** Streaming chat about the tickets. history: [{ role, content }] ending with the user turn. */
export async function askChat(history, stats, onText, { signal } = {}) {
  if (!isLive()) {
    const answer = demo.chatDemo(history.at(-1).content, stats);
    await wait(400);
    for (const piece of answer.match(/\S+\s*/g) ?? [answer]) {
      if (signal?.aborted) return { demo: true };
      onText(piece);
      await wait(14);
    }
    return { demo: true };
  }
  const snapshot = buildSnapshot(getState(), stats, { lang: getLang(), labels: statLabels });
  const system = `You are the assistant of the IT service desk tool ${CONFIG.appName}, answering technicians and managers in a chat panel. The numbers are already computed: trust them.
Data (JSON): ${JSON.stringify(snapshot)}

- Use only this data; if something isn't there, say so.
- Be brief: max ~120 words, plain sentences or a short list. Mention ticket ids (e.g. INC-1042) when you refer to tickets.
- sla_minutes_left is business minutes; negative means already breached.
- Reply in the language the user writes in (default ${language()}).`;
  const { adapter, model } = await live();
  const result = await adapter.stream({ model, effort: CONFIG.ai.effort.chat, system, history, onText, signal });
  return { demo: false, model: result.model ?? model };
}

export async function testConnection() {
  const { adapter, model } = await live();
  return (await adapter.test({ model })) ?? model;
}
