// UI building blocks: icons, event delegation, modals, toasts, small components.
import { t, th } from "./i18n.js";
import { esc, initials } from "./utils.js";

// ── Icons: 24×24 line icons, 1.6 px stroke ────────────────────────────
const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  inbox: '<path d="M4 13.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5.5"/><path d="M4 13.5 6.5 5h11l2.5 8.5"/><path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  chat: '<path d="M20 12a7.5 7.5 0 0 1-10.8 6.7L4 20l1.3-4.6A7.5 7.5 0 1 1 20 12z"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.2a5.5 5.5 0 0 1 3 5.3"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.8-5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4M12 17h.01"/>',
  pause: '<rect x="7" y="5.5" width="3.2" height="13" rx="1"/><rect x="13.8" y="5.5" width="3.2" height="13" rx="1"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  send: '<path d="M4.5 12 20 4.5 16 20l-4-6.5z"/><path d="m12 13.5 8-9"/>',
  bolt: '<path d="M13 3 5 13.5h6.5L10.5 21 19 10.5h-6.5z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  wifi: '<path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.8a7.7 7.7 0 0 1 11 0M9.5 16a3.4 3.4 0 0 1 5 0"/><path d="M12 19.3h.01"/>',
  file: '<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h6"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>',
  printer: '<path d="M7 8V4h10v4"/><rect x="4" y="8" width="16" height="8" rx="1.5"/><path d="M7 13h10v7H7z"/>',
  app: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><path d="M16.75 13.5v6.5M13.5 16.75H20"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/>',
  archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5M10 12.5h4"/>',
  logout: '<path d="M14 4h4.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
  moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.8 12.2A1 1 0 0 0 8.3 20h7.4a1 1 0 0 0 1-.8L17.5 7M9.5 7V4.5h5V7"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  upload: '<path d="M12 20V9M7.5 13.5 12 9l4.5 4.5M5 4h14"/>',
  refresh: '<path d="M19.5 11a7.5 7.5 0 1 0-2.2 5.3"/><path d="M19.5 4.5V11h-6.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5"/>',
  lifebuoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="m6 6 3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5"/>',
  thumbsUp: '<path d="M7.5 10.5V20H5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1zM7.5 10.5 11 3.5a2 2 0 0 1 2 2V9h5.3a1.5 1.5 0 0 1 1.5 1.8l-1.4 7.5a2 2 0 0 1-2 1.7H7.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  activity: '<path d="M3 12h4l2.5-6.5 5 13L17 12h4"/>',
  flag: '<path d="M5 21V4.5M5 4.5h11l-2 4 2 4H5"/>',
  note: '<path d="M5 4.5h14v10l-5 5H5z"/><path d="M14 19.5v-5h5"/>',
  wand: '<path d="m4 20 11-11M13 7l4 4"/><path d="M18 3v3M16.5 4.5h3M20 10v2M19 11h2M9 3v2M8 4h2"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 3.5 5.3 3.5 8.5s-1 6.2-3.5 8.5c-2.5-2.3-3.5-5.3-3.5-8.5s1-6.2 3.5-8.5"/>',
};

export function icon(name, size = 18) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;
}

/** Logo: a ticket with a check. The body follows the text colour, the check uses the AI colour. */
export const LOGO = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
  <path d="M7 6h18a5 5 0 0 1 5 5v2.2a2.8 2.8 0 0 0 0 5.6V21a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-2.2a2.8 2.8 0 0 0 0-5.6V11a5 5 0 0 1 5-5z" fill="currentColor"/>
  <path d="m11 16.3 3.4 3.4 6.8-7" fill="none" stroke="var(--ai)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** The discreet mark used wherever the AI is involved ("IA" / "AI" depending on the language). */
export const aiTag = (label = t("ai.tag")) => `<span class="ai-tag">${esc(label)}</span>`;
export const aiMini = () => `<span class="ai-mini">${th("ai.tag")}</span>`;

export function avatar(user, size = 28) {
  if (!user) return `<span class="avatar none" style="--s:${size}px">${icon("user", Math.round(size * 0.55))}</span>`;
  return `<span class="avatar" style="--s:${size}px;--c:${esc(user.color ?? "#3f5b8c")}" title="${esc(user.name)}">${esc(initials(user.name))}</span>`;
}

export const statusPill = (status) => `<span class="status" data-status="${status}">${th(`status.${status}`)}</span>`;
export const priorityTag = (p) => `<span class="prio" data-p="${p}">${p}</span>`;

// ── Event delegation: views register named handlers, markup references them ──
//   <button data-action="name">   <form data-submit="name">   <select data-change="name">   <input data-input="name">
const handlers = { click: {}, submit: {}, change: {}, input: {} };

export function on(type, map) {
  Object.assign(handlers[type], map);
}

export function bindDelegation() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    const fn = el && handlers.click[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    fn(el, e);
  });
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("form[data-submit]");
    if (!form) return;
    e.preventDefault();
    handlers.submit[form.dataset.submit]?.(form, e);
  });
  for (const type of ["change", "input"]) {
    document.addEventListener(type, (e) => {
      const el = e.target.closest(`[data-${type}]`);
      if (el) handlers[type][el.dataset[type]]?.(el, e);
    });
  }
  bindTooltips();
  // Ctrl/⌘ + Enter sends long texts; plain Enter sends short inputs marked data-enter-submit.
  document.addEventListener("keydown", (e) => {
    // Clickable rows/cards that aren't buttons: Enter or Space activates them.
    if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-action][tabindex]:not(button):not(a):not(input):not(textarea)")) {
      e.preventDefault();
      e.target.click();
      return;
    }
    if (e.key !== "Enter" || e.isComposing) return;
    const el = e.target;
    if ((el.matches?.("[data-enter-submit]") && !e.shiftKey) || (el.matches?.("textarea") && (e.ctrlKey || e.metaKey))) {
      if (!el.form) return;
      e.preventDefault();
      el.form.requestSubmit();
    }
  });
}

/** One floating tooltip for every [data-tip] element, on hover and on keyboard focus. */
function bindTooltips() {
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "tooltip");
  document.body.append(tip);
  let owner = null;
  const show = (el) => {
    owner = el;
    tip.textContent = el.dataset.tip;
    tip.classList.add("on");
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
    const top = r.top - tip.offsetHeight - 8;
    tip.style.transform = `translate(${left}px, ${top < 8 ? r.bottom + 8 : top}px)`;
  };
  const hide = () => {
    owner = null;
    tip.classList.remove("on");
  };
  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest?.("[data-tip]");
    if (el && el !== owner) show(el);
    else if (!el && owner) hide();
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest?.("[data-tip]");
    if (el) show(el);
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("scroll", hide, true);
}

// ── Re-render hook (set by app.js, so views don't import app.js) ──────
let renderer = () => {};
export const setRenderer = (fn) => (renderer = fn);
export const rerender = () => renderer();

// ── Modals (native <dialog>) ──────────────────────────────────────────
export function openModal({ title, body, footer = "", size = "", onClose } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = `modal ${size}`;
  dialog.innerHTML = `
    <header class="modal-head">
      <h2>${title}</h2>
      <button class="icon-btn" type="button" data-close aria-label="${th("common.close")}">${icon("x")}</button>
    </header>
    <div class="modal-body">${body}</div>
    ${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}`;
  document.body.append(dialog);

  const close = () => dialog.open && dialog.close();
  dialog.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || e.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    dialog.remove();
    onClose?.();
  });
  dialog.showModal();
  return { el: dialog, close, body: dialog.querySelector(".modal-body"), foot: dialog.querySelector(".modal-foot") };
}

export function confirmDialog(message, { confirmLabel, danger = false } = {}) {
  return new Promise((resolve) => {
    let answer = false;
    const modal = openModal({
      title: th("common.confirm"),
      size: "small",
      body: `<p>${esc(message)}</p>`,
      footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" type="button" data-confirm>${esc(confirmLabel ?? t("common.confirm"))}</button>`,
      onClose: () => resolve(answer),
    });
    modal.el.querySelector("[data-confirm]").addEventListener("click", () => {
      answer = true;
      modal.close();
    });
  });
}

// ── Toasts ────────────────────────────────────────────────────────────
export function toast(message, type = "info", ms = 3600) {
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === "error" ? "alert" : type === "success" ? "checkCircle" : "clock", 16)}<span></span>`;
  el.querySelector("span").textContent = message;
  box.append(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 250);
  }, ms);
}

/** Disable a button and show a spinner while a promise runs. */
export async function withBusy(button, task) {
  if (!button) return task();
  const original = button.innerHTML;
  button.disabled = true;
  button.classList.add("busy");
  try {
    return await task();
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.classList.remove("busy");
      button.innerHTML = original;
    }
  }
}

/** A "thinking" line with a shimmer, used while the AI works. */
export const thinking = (text) => `<p class="thinking">${aiTag()}<span>${esc(text)}</span></p>`;
