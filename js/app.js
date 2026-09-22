// Entry point: layouts (portal / console), routing (#/tickets/INC-1042…) and the session.
import { CONFIG } from "./config.js";
import { isLive, providerLabel } from "./ai.js";
import { buildDemoData, translateDemo } from "./demo-data.js";
import { LANGS, getLang, initI18n, t, teamLabel, th } from "./i18n.js";
import { getPrefs, getSessionUser, getState, loadState, logout, mutate, replaceAll, setPrefs, subscribe } from "./store.js";
import { LOGO, aiMini, avatar, bindDelegation, icon, on, setRenderer } from "./ui.js";
import { DONE_STATUSES } from "./sla.js";
import { esc } from "./utils.js";
import { renderChat } from "./views/chat.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderKnowledge } from "./views/knowledge.js";
import { renderPortal } from "./views/portal.js";
import { applyTheme, changeLanguage } from "./views/settings.js";
import { renderStart } from "./views/start.js";
import { renderTeam } from "./views/team.js";
import { renderTicket } from "./views/ticket.js";
import { renderTickets } from "./views/tickets.js";

const ROUTES = {
  start: { layout: "plain", render: renderStart },
  portal: { layout: "portal", render: renderPortal },
  dashboard: { layout: "console", render: renderDashboard },
  tickets: { layout: "console", render: (root, params) => (params[0] ? renderTicket(root, params[0]) : renderTickets(root)) },
  knowledge: { layout: "console", render: renderKnowledge },
  chat: { layout: "console", render: renderChat },
  team: { layout: "console", render: renderTeam },
};

const NAV = [
  { route: "dashboard", icon: "home" },
  { route: "tickets", icon: "inbox" },
  { route: "knowledge", icon: "book" },
  { route: "chat", icon: "chat", ai: true },
  { route: "team", icon: "users" },
];

const brand = (href, sub = "") =>
  `<a class="brand" href="${href}">${LOGO}<span class="brand-name">Resolv<b>IA</b></span>${sub ? `<span class="brand-sub">${sub}</span>` : ""}</a>`;

function parseRoute() {
  const [path] = location.hash.replace(/^#\/?/, "").split("?");
  const [name, ...params] = path.split("/").filter(Boolean).map(decodeURIComponent);
  return { name, params };
}

let currentLayout = null;
let lastPath = null;

function render() {
  let { name, params } = parseRoute();
  const user = getSessionUser();
  if (!ROUTES[name]) name = user ? "dashboard" : "start";
  const route = ROUTES[name];
  if (route.layout === "console" && !user) {
    location.replace("#/start");
    return;
  }
  if (route.layout !== currentLayout) renderLayout(route.layout);
  renderChrome(name, user);

  const view = document.getElementById("view");
  route.render(view, params);
  const path = `${name}/${params.join("/")}`;
  if (path !== lastPath) {
    window.scrollTo({ top: 0 });
    view.focus({ preventScroll: true });
  }
  lastPath = path;
}

function renderLayout(layout) {
  currentLayout = layout;
  const app = document.getElementById("app");
  app.dataset.layout = layout;
  if (layout === "console") {
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar" aria-label="${th("nav.main")}">
          ${brand("#/dashboard")}
          <nav class="nav" id="nav"></nav>
          <div class="sidebar-foot" id="sidebar-foot"></div>
        </aside>
        <header class="mobile-top">${brand("#/dashboard")}<div class="row" id="mobile-actions"></div></header>
        <main class="main"><div id="view" class="page" tabindex="-1"></div></main>
        <nav class="mobile-nav" id="mobile-nav" aria-label="${th("nav.main")}"></nav>
      </div>`;
  } else if (layout === "portal") {
    app.innerHTML = `
      <div class="portal">
        <header class="portal-bar"><div class="portal-bar-inner">
          ${brand("#/portal", th("portal.brandSub"))}
          <nav class="portal-nav" id="portal-nav"></nav>
          <div class="row" id="portal-actions"></div>
        </div></header>
        <main id="view" class="portal-main" tabindex="-1"></main>
        <footer class="footer" id="footer"></footer>
      </div>`;
  } else {
    app.innerHTML = `<main id="view" class="plain" tabindex="-1"></main><footer class="footer" id="footer"></footer>`;
  }
}

const isDark = () =>
  document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

const langSelect = () =>
  `<select class="select select-sm" data-change="set-lang" aria-label="${th("settings.language")}">${LANGS.map((l) => `<option value="${l.id}" ${l.id === getLang() ? "selected" : ""}>${l.id.toUpperCase()}</option>`).join("")}</select>`;
const themeButton = () => `<button class="icon-btn" type="button" data-action="toggle-theme" aria-label="${th("settings.theme")}">${icon(isDark() ? "sun" : "moon")}</button>`;

function renderChrome(name, user) {
  document.title = `${t(`nav.${name}`)} · ${CONFIG.appName}`;
  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `${th("footer.madeBy")} <a href="${esc(CONFIG.author.url)}" target="_blank" rel="noopener">${esc(CONFIG.author.name)}</a> · <a href="${esc(CONFIG.repoUrl)}" target="_blank" rel="noopener">${th("footer.source")}</a>`;
  }

  if (currentLayout === "console") {
    const open = getState().tickets.filter((x) => !DONE_STATUSES.has(x.status)).length;
    const link = (item, mobile = false) => `<a href="#/${item.route}" class="${item.route === name ? "active" : ""}" ${item.route === name ? 'aria-current="page"' : ""}>
      ${icon(item.icon)}<span>${th(`nav.${item.route}`)}</span>${!mobile && item.route === "tickets" && open ? `<span class="count">${open}</span>` : ""}${!mobile && item.ai ? aiMini() : ""}</a>`;
    document.getElementById("nav").innerHTML =
      NAV.map((item) => link(item)).join("") +
      `<div class="nav-sep"></div><a href="#/portal">${icon("lifebuoy")}<span>${th("nav.portal")}</span>${icon("external", 14)}</a>`;
    document.getElementById("mobile-nav").innerHTML = NAV.map((item) => link(item, true)).join("");

    const live = isLive();
    document.getElementById("sidebar-foot").innerHTML = `
      <button class="ai-status ${live ? "live" : ""}" type="button" data-action="open-settings">
        <i class="dot"></i><span>${live ? th("ai.live", { provider: providerLabel() }) : th("ai.demo")}</span>
      </button>
      <div class="row between">
        <button class="nav-btn" type="button" data-action="open-settings">${icon("settings")}<span>${th("nav.settings")}</span></button>
        <div class="row">${langSelect()}${themeButton()}</div>
      </div>
      <div class="me">
        <a class="me-link" href="#/team/${esc(user.id)}">${avatar(user, 30)}<span class="me-text"><strong class="truncate">${esc(user.name)}</strong><small class="truncate">${esc(teamLabel(user.team))}</small></span></a>
        <button class="icon-btn" type="button" data-action="logout" aria-label="${th("nav.logout")}" title="${th("nav.logout")}">${icon("logout")}</button>
      </div>`;
    document.getElementById("mobile-actions").innerHTML = `${themeButton()}<button class="icon-btn" type="button" data-action="open-settings" aria-label="${th("nav.settings")}">${icon("settings")}</button><a href="#/team/${esc(user.id)}" aria-label="${esc(user.name)}">${avatar(user, 28)}</a>`;
  }

  if (currentLayout === "portal") {
    const sub = parseRoute().params[0];
    document.getElementById("portal-nav").innerHTML = `
      <a href="#/portal" class="${!sub ? "active" : ""}">${th("portal.navHelp")}</a>
      <a href="#/portal/guides" class="${sub === "guides" ? "active" : ""}">${th("portal.navGuides")}</a>
      <a href="#/portal/tickets" class="${sub === "tickets" ? "active" : ""}">${th("portal.navMine")}</a>`;
    document.getElementById("portal-actions").innerHTML = `${langSelect()}${themeButton()}
      <a class="btn btn-sm" href="${user ? "#/dashboard" : "#/start"}">${icon("inbox", 16)}<span>${th("portal.staff")}</span></a>`;
  }
}

function init() {
  initI18n();
  applyTheme();
  // First visit (or unreadable data): start with the demo service desk so there is something to see.
  if (!loadState()) replaceAll(buildDemoData(getLang()));
  else if (getState().meta.demo && getState().meta.demoLang !== getLang()) mutate((state) => translateDemo(state, getLang()));

  bindDelegation();
  setRenderer(render);
  on("click", {
    "toggle-theme": () => {
      setPrefs({ theme: isDark() ? "light" : "dark" });
      applyTheme();
      render();
    },
    logout: () => {
      logout();
      location.hash = "#/start";
    },
  });
  on("change", { "set-lang": (el) => changeLanguage(el.value) });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => (getPrefs().theme ?? "auto") === "auto" && render());
  window.addEventListener("hashchange", render);

  // Re-render on data changes, except the chat, which manages its own DOM while streaming.
  subscribe(() => (parseRoute().name === "chat" ? renderChrome("chat", getSessionUser()) : render()));
  // SLA timers move with the clock: refresh the view every minute.
  setInterval(() => {
    const typing = document.activeElement?.matches?.("input, textarea, select");
    if (document.visibilityState === "visible" && !typing && !document.querySelector("dialog[open]") && parseRoute().name !== "chat") render();
  }, 60_000);
  render();
}

init();
