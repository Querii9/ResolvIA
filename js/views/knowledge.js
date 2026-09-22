// Knowledge base (technician side): browse, read, edit, create and AI-generate self-service guides.
import { CONFIG } from "../config.js";
import { aiErrorMessage, generateGuide } from "../ai.js";
import { guideBody, guideCard } from "../components.js";
import { autoLabel, catIcon, catLabel, fmtPct, getLang, t, th } from "../i18n.js";
import { confirmDialog, aiMini, aiTag, icon, on, openModal, thinking, toast } from "../ui.js";
import { deleteGuide, getGuide, getGuides, getState, saveGuide, updateTicket } from "../store.js";
import { esc, loc, mdLite, normalize, uid } from "../utils.js";

const filter = { q: "", category: "" };

export function renderKnowledge(root, params) {
  if (params[0]) return renderGuide(root, params[0]);
  root.innerHTML = `
    <header class="page-head">
      <div><h1>${th("guides.title")}</h1><p class="muted">${th("guides.subtitle", { n: getGuides().length })}</p></div>
      <div class="row wrap">
        <button class="btn" type="button" data-action="guide-generate">${aiTag()}<span>${th("guides.generate")}</span></button>
        <button class="btn btn-primary" type="button" data-action="guide-new">${icon("plus", 16)}<span>${th("guides.new")}</span></button>
      </div>
    </header>
    <div class="toolbar">
      <label class="search">${icon("search", 16)}<input class="input" type="search" data-input="kb-q" value="${esc(filter.q)}" placeholder="${th("guides.search")}" aria-label="${th("guides.search")}"></label>
      <select class="select" data-change="kb-cat" aria-label="${th("tickets.colCategory")}">
        <option value="">${th("tickets.allCategories")}</option>
        ${CONFIG.categories.map((c) => `<option value="${c.id}" ${c.id === filter.category ? "selected" : ""}>${esc(catLabel(c.id))}</option>`).join("")}
      </select>
    </div>
    <div class="guide-grid" id="kb-list"></div>`;
  renderList();
}

function renderList() {
  const box = document.getElementById("kb-list");
  if (!box) return;
  const q = normalize(filter.q);
  const list = getGuides().filter(
    (g) => (!filter.category || g.category === filter.category) && (!q || normalize(`${loc(g.title, getLang())} ${loc(g.summary, getLang())} ${(g.keywords ?? []).join(" ")}`).includes(q)),
  );
  box.innerHTML = list.length ? list.map((g) => guideCard(g, `#/knowledge/${g.id}`)).join("") : `<p class="empty">${th("guides.none")}</p>`;
}

function renderGuide(root, id) {
  const guide = getGuide(id);
  if (!guide) {
    root.innerHTML = `<a class="back" href="#/knowledge">${icon("arrowLeft", 16)}${th("guides.title")}</a><p class="empty">${th("guides.notFound")}</p>`;
    return;
  }
  const stats = getState().guideStats[id] ?? {};
  const votes = (stats.helpful ?? 0) + (stats.notHelpful ?? 0);
  const linked = getState().tickets.filter((tk) => tk.guideId === id);
  root.innerHTML = `
    <a class="back" href="#/knowledge">${icon("arrowLeft", 16)}${th("guides.title")}</a>
    <div class="guide-layout">
      <article class="guide-page">
        <p class="eyebrow">${icon(catIcon(guide.category), 14)}${esc(catLabel(guide.category))} · ${th("guides.minutes", { n: guide.minutes ?? 3 })}${guide.source === "ai" ? ` · ${aiMini()}` : ""}</p>
        <h1>${esc(loc(guide.title, getLang()))}</h1>
        <p class="lead">${esc(loc(guide.summary, getLang()))}</p>
        ${guideBody(guide)}
      </article>
      <aside class="ticket-side">
        <section class="side-card">
          <h3>${th("guides.usage")}</h3>
          <dl class="kv">
            <dt>${th("guides.views")}</dt><dd>${stats.views ?? 0}</dd>
            <dt>${th("guides.helpfulLabel")}</dt><dd>${votes ? fmtPct((stats.helpful ?? 0) / votes) : "—"}</dd>
            <dt>${th("guides.linkedTickets")}</dt><dd>${linked.length}</dd>
            <dt>${th("guides.selfSolved")}</dt><dd>${linked.filter((tk) => tk.resolvedBy === "self-service").length}</dd>
          </dl>
          ${guide.automation ? `<p class="small">${icon("bolt", 14)} ${th("guides.hasAutomation", { action: autoLabel(guide.automation) })}</p>` : ""}
        </section>
        <section class="side-card">
          <h3>${th("guides.manage")}</h3>
          <div class="row wrap">
            <button class="btn btn-sm" type="button" data-action="guide-edit" data-id="${esc(id)}">${icon("edit", 15)}${th("common.edit")}</button>
            ${
              guide.builtIn
                ? guide.edited
                  ? `<button class="btn btn-sm btn-ghost" type="button" data-action="guide-restore" data-id="${esc(id)}">${icon("refresh", 15)}${th("guides.restore")}</button>`
                  : ""
                : `<button class="btn btn-sm btn-ghost danger" type="button" data-action="guide-delete" data-id="${esc(id)}">${icon("trash", 15)}${th("common.delete")}</button>`
            }
          </div>
          <a class="link small" href="#/portal/guides/${esc(id)}">${th("guides.seeAsEmployee")}${icon("external", 13)}</a>
        </section>
      </aside>
    </div>`;
}

// ── Editor ───────────────────────────────────────────────────────────

function openEditor(guide, { isNew = false, linkTicket = "" } = {}) {
  const lang = getLang();
  const v = {
    id: guide?.id ?? uid("guide"),
    title: loc(guide?.title, lang),
    summary: loc(guide?.summary, lang),
    category: guide?.category ?? CONFIG.categories[0].id,
    minutes: guide?.minutes ?? 3,
    automation: guide?.automation ?? "",
    keywords: (guide?.keywords ?? []).join(", "),
    body: loc(guide?.body, lang),
    source: guide?.source ?? "custom",
  };
  const modal = openModal({
    title: th(isNew ? "guides.newTitle" : "guides.editTitle"),
    size: "wide",
    body: `<form id="guide-form" class="form" data-submit="guide-save" data-id="${esc(v.id)}" data-source="${esc(v.source)}" data-link-ticket="${esc(linkTicket)}">
      ${guide?.builtIn ? `<p class="notice">${th("guides.editBuiltIn")}</p>` : ""}
      ${v.source === "ai" && isNew ? `<p class="notice">${aiTag()} ${th("guides.aiDraftNote")}</p>` : ""}
      <label class="field"><span>${th("guides.fieldTitle")}</span><input class="input" name="title" required maxlength="90" value="${esc(v.title)}"></label>
      <label class="field"><span>${th("guides.fieldSummary")}</span><input class="input" name="summary" maxlength="180" value="${esc(v.summary)}"></label>
      <div class="form-row three">
        <label class="field"><span>${th("tickets.colCategory")}</span><select class="select" name="category">${CONFIG.categories.map((c) => `<option value="${c.id}" ${c.id === v.category ? "selected" : ""}>${esc(catLabel(c.id))}</option>`).join("")}</select></label>
        <label class="field"><span>${th("guides.fieldMinutes")}</span><input class="input" type="number" name="minutes" min="1" max="60" value="${v.minutes}"></label>
        <label class="field"><span>${th("guides.fieldAutomation")}</span><select class="select" name="automation"><option value="">—</option>${CONFIG.automations.map((a) => `<option value="${a.id}" ${a.id === v.automation ? "selected" : ""}>${esc(autoLabel(a.id))}</option>`).join("")}</select></label>
      </div>
      <label class="field"><span>${th("guides.fieldKeywords")}</span><input class="input" name="keywords" value="${esc(v.keywords)}" placeholder="${th("guides.keywordsPh")}"></label>
      <div class="editor">
        <label class="field"><span>${th("guides.fieldBody")}</span><textarea class="input mono-text" name="body" rows="14" data-input="guide-preview">${esc(v.body)}</textarea></label>
        <div class="field"><span>${th("guides.preview")}</span><div class="preview guide-body" id="guide-preview">${mdLite(v.body)}</div></div>
      </div>
      <p class="muted small">${th("guides.markdownHelp")}</p>
    </form>`,
    footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button><button class="btn btn-primary" type="submit" form="guide-form">${th("common.save")}</button>`,
  });
  modal.el.querySelector("input[name=title]").focus();
}

/** Ask the AI for a draft guide (from a topic, or from a ticket), then open it in the editor. */
export function openGuideGenerator({ ticket = null } = {}) {
  const modal = openModal({
    title: `${aiTag()} ${th("guides.generate")}`,
    body: `<form id="gen-form" class="form" data-submit="guide-gen">
      ${
        ticket
          ? `<p>${th("guides.fromTicket", { id: ticket.id })}</p><blockquote class="you-said">${esc(ticket.title)}</blockquote><input type="hidden" name="ticketId" value="${esc(ticket.id)}">`
          : `<label class="field"><span>${th("guides.topic")}</span><input class="input" name="topic" required placeholder="${th("guides.topicPh")}"></label>`
      }
      <div id="gen-status"></div>
    </form>`,
    footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button><button class="btn btn-ai" type="submit" form="gen-form">${th("guides.generateGo")}</button>`,
  });
  modal.el.querySelector("input[name=topic]")?.focus();
}

on("input", {
  "kb-q": (el) => {
    filter.q = el.value;
    renderList();
  },
  "guide-preview": (el) => {
    const box = document.getElementById("guide-preview");
    if (box) box.innerHTML = mdLite(el.value);
  },
});

on("change", {
  "kb-cat": (el) => {
    filter.category = el.value;
    renderList();
  },
});

on("click", {
  "guide-new": () => openEditor(null, { isNew: true }),
  "guide-edit": (el) => openEditor(getGuide(el.dataset.id)),
  "guide-generate": () => openGuideGenerator(),
  "guide-delete": async (el) => {
    if (!(await confirmDialog(t("guides.deleteConfirm"), { confirmLabel: t("common.delete"), danger: true }))) return;
    deleteGuide(el.dataset.id);
    location.hash = "#/knowledge";
    toast(t("guides.deleted"), "success");
  },
  "guide-restore": async (el) => {
    if (!(await confirmDialog(t("guides.restoreConfirm"), { confirmLabel: t("guides.restore") }))) return;
    deleteGuide(el.dataset.id);
    toast(t("guides.restored"), "success");
  },
});

on("submit", {
  "guide-save": (form) => {
    const data = new FormData(form);
    const guide = {
      id: form.dataset.id,
      title: String(data.get("title")).trim(),
      summary: String(data.get("summary")).trim(),
      category: data.get("category"),
      minutes: Number(data.get("minutes")) || 3,
      automation: data.get("automation") || null,
      keywords: String(data.get("keywords"))
        .split(",")
        .map((k) => normalize(k))
        .filter(Boolean),
      body: String(data.get("body")),
      source: form.dataset.source,
    };
    if (!guide.title) return;
    saveGuide(guide);
    if (form.dataset.linkTicket) updateTicket(form.dataset.linkTicket, { guideId: guide.id });
    form.closest("dialog").close();
    toast(t("guides.saved"), "success");
    location.hash = `#/knowledge/${guide.id}`;
  },
  "guide-gen": async (form) => {
    const status = form.querySelector("#gen-status");
    const button = form.closest("dialog").querySelector("[type=submit]");
    const ticketId = form.ticketId?.value;
    const topic = form.topic?.value.trim();
    const ticket = ticketId ? getState().tickets.find((tk) => tk.id === ticketId) : null;
    if (!ticket && !topic) return;
    button.disabled = true;
    status.innerHTML = thinking(t("guides.generating"));
    try {
      const draft = await generateGuide({ topic, ticket });
      form.closest("dialog").close();
      openEditor({ ...draft, minutes: 5, source: "ai" }, { isNew: true, linkTicket: ticket?.id ?? "" });
    } catch (err) {
      status.innerHTML = "";
      button.disabled = false;
      toast(aiErrorMessage(err), "error", 6000);
    }
  },
});
