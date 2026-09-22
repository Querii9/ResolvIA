// Entry screen: employees go to the help portal, IT staff pick (or create) their profile.
import { teamLabel, th } from "../i18n.js";
import { getUsers, login } from "../store.js";
import { LOGO, avatar, icon, on } from "../ui.js";
import { esc } from "../utils.js";
import { openProfileForm } from "./team.js";

export function renderStart(root) {
  const users = [...getUsers()].sort((a, b) => (a.role === "lead" ? -1 : b.role === "lead" ? 1 : a.name.localeCompare(b.name)));
  root.innerHTML = `
    <div class="start">
      <div class="start-brand">${LOGO}<span class="brand-name">Resolv<b>IA</b></span></div>
      <h1>${th("start.title")}</h1>
      <p class="lead">${th("start.lead")}</p>

      <div class="start-grid">
        <a class="choice" href="#/portal">
          <span class="choice-icon">${icon("lifebuoy", 22)}</span>
          <strong>${th("start.employee")}</strong>
          <span class="muted">${th("start.employeeText")}</span>
          <span class="choice-go">${th("start.employeeGo")} ${icon("arrowRight", 16)}</span>
        </a>

        <section class="choice staff" aria-labelledby="staff-title">
          <span class="choice-icon">${icon("inbox", 22)}</span>
          <strong id="staff-title">${th("start.staff")}</strong>
          <span class="muted">${th("start.staffText")}</span>
          <ul class="profiles">
            ${users
              .map(
                (u) => `<li><button type="button" data-action="login-as" data-id="${esc(u.id)}">
                  ${avatar(u, 32)}
                  <span class="profile-text"><strong>${esc(u.name)}</strong><small>${esc(teamLabel(u.team))}${u.role === "lead" ? ` · ${th("team.lead")}` : ""}</small></span>
                  ${icon("chevronRight", 16)}
                </button></li>`,
              )
              .join("")}
          </ul>
          <button class="btn btn-ghost" type="button" data-action="sign-up">${icon("plus", 16)}<span>${th("start.createProfile")}</span></button>
        </section>
      </div>
      <p class="muted small center">${th("start.localNote")}</p>
    </div>`;
}

on("click", {
  "login-as": (el) => {
    login(el.dataset.id);
    location.hash = "#/dashboard";
  },
  "sign-up": () => openProfileForm(null),
});
