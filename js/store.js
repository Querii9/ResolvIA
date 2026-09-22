// App state + persistence. Everything lives in the browser (localStorage), so the demo needs no server.
// All reads and writes go through this module, which makes it the one place to swap for a real backend.
import { CONFIG } from "./config.js";
import { GUIDES } from "./guides-data.js";
import { uid } from "./utils.js";

const DATA_KEY = "resolvia.data.v1";
const PREFS_KEY = "resolvia.prefs.v1";
const SESSION_KEY = "resolvia.session";
const REQUESTER_KEY = "resolvia.requester";
const API_KEY = "resolvia.apiKey"; // + ".<provider>"

// localStorage can throw (private mode, blocked storage): the app keeps working in memory.
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
const readJSON = (key, fallback) => {
  try {
    return JSON.parse(storage.get(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const empty = () => ({ users: [], tickets: [], guides: [], guideStats: {}, settings: {}, meta: { seq: 1000 } });
let state = empty();
let revision = 0;
let batching = 0;
let dirty = false;
const listeners = new Set();

export const getState = () => state;
export const getRevision = () => revision;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

function commit() {
  if (batching) {
    dirty = true;
    return;
  }
  revision++;
  storage.set(DATA_KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}

/** Group several changes into a single save + re-render. */
export function batch(fn) {
  batching++;
  try {
    return fn();
  } finally {
    batching--;
    if (!batching && dirty) {
      dirty = false;
      commit();
    }
  }
}

export function mutate(fn) {
  fn(state);
  commit();
}

export function loadState() {
  const raw = storage.get(DATA_KEY);
  if (!raw) return false;
  try {
    state = sanitize(JSON.parse(raw));
    revision++;
    return true;
  } catch {
    return false;
  }
}

export function replaceAll(data) {
  state = sanitize(data);
  commit();
}

/** Validates imported/stored data and fills defaults. Throws on garbage. */
export function sanitize(data) {
  if (!data || !Array.isArray(data.tickets) || !Array.isArray(data.users)) throw new Error("Invalid data");
  const base = empty();
  return {
    users: data.users.filter((u) => u && u.id && u.name),
    tickets: data.tickets
      .filter((t) => t && t.id && t.title && t.createdAt)
      .map((t) => ({ messages: [], statusLog: [], ...t })),
    guides: Array.isArray(data.guides) ? data.guides.filter((g) => g && g.id) : [],
    guideStats: data.guideStats && typeof data.guideStats === "object" ? data.guideStats : {},
    settings: data.settings && typeof data.settings === "object" ? data.settings : {},
    meta: { ...base.meta, ...(data.meta ?? {}) },
  };
}

export const exportJSON = () => JSON.stringify({ app: "resolvia", version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);

// ── Settings shared by the team (SLA, AI autonomy) ────────────────────

export function getSla() {
  const custom = state.settings.sla ?? {};
  return {
    ...CONFIG.sla,
    ...custom,
    businessHours: { ...CONFIG.sla.businessHours, ...(custom.businessHours ?? {}) },
    targets: Object.fromEntries(Object.entries(CONFIG.sla.targets).map(([p, v]) => [p, { ...v, ...(custom.targets?.[p] ?? {}) }])),
  };
}

export function setSla(sla) {
  state.settings.sla = sla;
  commit();
}

export const getAutonomy = () => state.settings.autonomy ?? CONFIG.ai.autonomy;
export function setAutonomy(value) {
  state.settings.autonomy = value;
  commit();
}

// ── Technicians & session ─────────────────────────────────────────────

export const getUsers = () => state.users;
export const getUser = (id) => state.users.find((u) => u.id === id);

export function addUser(data) {
  const user = { id: uid("tec"), role: "agent", skills: [], color: "#3f5b8c", createdAt: new Date().toISOString(), ...data };
  state.users.push(user);
  commit();
  return user;
}

export function updateUser(id, patch) {
  const user = getUser(id);
  if (!user) return;
  Object.assign(user, patch);
  commit();
}

export const getSessionUser = () => getUser(storage.get(SESSION_KEY));
export const login = (id) => storage.set(SESSION_KEY, id);
export const logout = () => storage.remove(SESSION_KEY);

/** The employee using the portal (remembered so they don't retype their name). */
export const getRequester = () => readJSON(REQUESTER_KEY, null);
export const setRequester = (requester) => storage.set(REQUESTER_KEY, JSON.stringify(requester));

// ── Tickets ───────────────────────────────────────────────────────────

export const getTicket = (id) => state.tickets.find((t) => t.id === id);

function nextId() {
  state.meta.seq = (state.meta.seq ?? 1000) + 1;
  return `${CONFIG.ticketPrefix}-${state.meta.seq}`;
}

export function createTicket(data, by = "requester") {
  const now = new Date().toISOString();
  const status = data.status ?? "new";
  const ticket = {
    id: nextId(),
    title: data.title,
    description: data.description ?? "",
    requester: data.requester,
    category: data.category ?? "access",
    priority: data.priority ?? "P3",
    team: data.team ?? CONFIG.categories.find((c) => c.id === data.category)?.team ?? CONFIG.teams[0].id,
    status,
    assigneeId: data.assigneeId ?? null,
    createdAt: now,
    firstResponseAt: null,
    resolvedAt: status === "resolved" ? now : null,
    resolvedBy: data.resolvedBy ?? null,
    guideId: data.guideId ?? null,
    automationId: data.automationId ?? null,
    ai: data.ai ?? null,
    source: data.source ?? "portal",
    messages: [],
    statusLog: [{ status, at: now, by }],
  };
  state.tickets.push(ticket);
  commit();
  return ticket;
}

export function updateTicket(id, patch) {
  const ticket = getTicket(id);
  if (!ticket) return;
  Object.assign(ticket, patch);
  commit();
}

export function setStatus(id, status, by) {
  const ticket = getTicket(id);
  if (!ticket || ticket.status === status) return;
  const now = new Date().toISOString();
  ticket.status = status;
  ticket.statusLog.push({ status, at: now, by });
  if (status === "resolved") ticket.resolvedAt = now;
  if (status === "closed") ticket.closedAt = now;
  if (status === "open" || status === "new" || status === "pending") {
    ticket.resolvedAt = null;
    ticket.resolvedBy = null;
  }
  commit();
}

/** author: "requester" | "ai" | "system" | technician id. kind: "public" | "internal" | "system". */
export function addMessage(id, { author, kind = "public", text, meta = null }) {
  const ticket = getTicket(id);
  if (!ticket) return;
  const now = new Date().toISOString();
  ticket.messages.push({ id: uid("msg"), author, kind, text, meta, at: now });
  const fromTeam = author !== "requester" && author !== "system";
  if (fromTeam && kind === "public" && !ticket.firstResponseAt) ticket.firstResponseAt = now;
  if (fromTeam && ticket.status === "new") {
    ticket.status = "open";
    ticket.statusLog.push({ status: "open", at: now, by: author });
  }
  commit();
}

export function assign(id, userId, by) {
  const ticket = getTicket(id);
  if (!ticket) return;
  batch(() => {
    ticket.assigneeId = userId;
    if (userId && ticket.status === "new") setStatus(id, "open", by);
    commit();
  });
}

export function resolveTicket(id, { by, resolvedBy = "tech", message }) {
  batch(() => {
    if (message) addMessage(id, { author: by, kind: "public", text: message });
    setStatus(id, "resolved", by);
    const ticket = getTicket(id);
    ticket.resolvedBy = resolvedBy;
    commit();
  });
}

// ── Knowledge base (built-in guides + your own edits and new guides) ──

export function getGuides() {
  const overrides = new Map(state.guides.map((g) => [g.id, g]));
  const builtIn = GUIDES.map((g) => (overrides.has(g.id) ? { ...g, ...overrides.get(g.id), builtIn: true, edited: true } : { ...g, builtIn: true }));
  const custom = state.guides.filter((g) => !GUIDES.some((b) => b.id === g.id)).map((g) => ({ ...g, builtIn: false }));
  return [...builtIn, ...custom];
}

export const getGuide = (id) => getGuides().find((g) => g.id === id);

export function saveGuide(guide) {
  const i = state.guides.findIndex((g) => g.id === guide.id);
  const saved = { ...guide, updatedAt: new Date().toISOString() };
  delete saved.builtIn;
  delete saved.edited;
  if (i >= 0) state.guides[i] = saved;
  else state.guides.push(saved);
  commit();
  return saved;
}

/** Deletes a custom guide, or restores a built-in one to its original text. */
export function deleteGuide(id) {
  state.guides = state.guides.filter((g) => g.id !== id);
  commit();
}

export function countGuide(id, field) {
  const stats = (state.guideStats[id] ??= { views: 0, helpful: 0, notHelpful: 0 });
  stats[field] = (stats[field] ?? 0) + 1;
  commit();
}

// ── Preferences & API keys (per browser) ──────────────────────────────

export const getPrefs = () => readJSON(PREFS_KEY, {});
export const setPrefs = (patch) => storage.set(PREFS_KEY, JSON.stringify({ ...getPrefs(), ...patch }));

const PROVIDERS = CONFIG.ai.providers;

export function getProvider() {
  const saved = getPrefs().provider;
  return PROVIDERS[saved] ? saved : CONFIG.ai.provider;
}
export const setProvider = (provider) => PROVIDERS[provider] && setPrefs({ provider });

export const getApiKey = (provider = getProvider()) => storage.get(`${API_KEY}.${provider}`) ?? "";
export const hasApiKey = (provider = getProvider()) => Boolean(getApiKey(provider));
export function setApiKey(key, provider = getProvider()) {
  if (key) storage.set(`${API_KEY}.${provider}`, key.trim());
  else storage.remove(`${API_KEY}.${provider}`);
}

export function getModel(provider = getProvider()) {
  const saved = getPrefs().models?.[provider];
  return PROVIDERS[provider].models.some((m) => m.id === saved) ? saved : PROVIDERS[provider].model;
}
export const setModel = (model, provider = getProvider()) => setPrefs({ models: { ...getPrefs().models, [provider]: model } });
