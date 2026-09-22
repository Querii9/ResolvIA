// Technicians: the team list, each profile with its numbers and activity, and the profile form.
import { CONFIG } from "../config.js";
import { catLabel, fmtHours, fmtPct, fmtRel, getLang, t, teamLabel, th } from "../i18n.js";
import { computeStats } from "../stats.js";
import { addUser, getSessionUser, getSla, getState, getUser, login, updateUser } from "../store.js";
import { avatar, icon, on, openModal, toast } from "../ui.js";
import { esc, loc } from "../utils.js";
import { ticketRow, ticketTableHead } from "../components.js";

const COLORS = ["#2F5D8A", "#3F7A5C", "#7A4E7E", "#9A5B2E", "#46607A", "#8A3B4E", "#4B4F8C", "#2E7A7A"];

export function renderTeam(root, params) {
  if (params[0]) return renderProfile(root, params[0]);
  const stats = computeStats(getState(), getSla(), new Date());
  const me = getSessionUser();
  const row = (u) => {
    const s = stats.byTech.find((b) => b.id === u.id) ?? {};
    return `<tr data-action="open-profile" data-id="${esc(u.id)}" tabindex="0">
      <td><span class="user-chip">${avatar(u, 30)}<span><strong>${esc(u.name)}</strong>${u.id === me?.id ? ` <span class="tag">${th("team.you")}</span>` : ""}<br><small class="muted">${esc(u.email ?? "")}</small></span></span></td>
      <td>${esc(teamLabel(u.team))}${u.role === "lead" ? ` · <span class="muted">${th("team.lead")}</span>` : ""}</td>
      <td class="num">${s.open ?? 0}</td>
      <td class="num">${s.resolved ?? 0}</td>
      <td class="num">${fmtHours(s.avgResolutionH)}</td>
      <td class="num">${fmtPct(s.compliance)}</td>
    </tr>`;
  };
  root.innerHTML = `
    <header class="page-head">
      <div><h1>${th("team.title")}</h1><p class="muted">${th("team.subtitle", { n: getState().users.length, days: stats.days })}</p></div>
      <button class="btn" type="button" data-action="add-tech">${icon("plus", 16)}<span>${th("team.add")}</span></button>
    </header>
    <div class="table-wrap">
      <table class="table team-table">
        <thead><tr><th>${th("team.colName")}</th><th>${th("team.colTeam")}</th><th class="num">${th("team.colOpen")}</th><th class="num">${th("team.colResolved")}</th><th class="num">${th("team.colAvg")}</th><th class="num">${th("team.colSla")}</th></tr></thead>
        <tbody>${getState().users.map(row).join("")}</tbody>
      </table>
    </div>`;
}

function renderProfile(root, id) {
  const user = getUser(id);
  if (!user) {
    root.innerHTML = `<p class="empty">${th("team.notFound")}</p>`;
    return;
  }
  const me = getSessionUser();
  const canEdit = me && (me.id === user.id || me.role === "lead");
  const stats = computeStats(getState(), getSla(), new Date());
  const s = stats.byTech.find((b) => b.id === id) ?? {};
  const open = stats.queue.filter(({ ticket }) => ticket.assigneeId === id);

  // Activity: status changes and messages by this person, newest first.
  const activity = getState()
    .tickets.flatMap((tk) => [
      ...tk.statusLog.filter((e) => e.by === id).map((e) => ({ at: e.at, ticket: tk, text: t("team.actStatus", { status: t(`status.${e.status}`) }) })),
      ...tk.messages.filter((m) => m.author === id).map((m) => ({ at: m.at, ticket: tk, text: t(m.kind === "internal" ? "team.actNote" : "team.actReply") })),
    ])
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 12);

  root.innerHTML = `
    <a class="back" href="#/team">${icon("arrowLeft", 16)}${th("team.title")}</a>
    <header class="profile-head">
      ${avatar(user, 64)}
      <div class="grow">
        <h1>${esc(user.name)}</h1>
        <p class="muted">${esc(teamLabel(user.team))}${user.role === "lead" ? ` · ${th("team.lead")}` : ""} · ${esc(user.email ?? "")}</p>
        ${user.bio ? `<p>${esc(loc(user.bio, getLang()))}</p>` : ""}
        <div class="row wrap">${(user.skills ?? []).map((c) => `<span class="tag">${esc(catLabel(c))}</span>`).join("")}</div>
      </div>
      ${canEdit ? `<button class="btn" type="button" data-action="edit-profile" data-id="${esc(user.id)}">${icon("edit", 16)}<span>${th("common.edit")}</span></button>` : ""}
    </header>

    <section class="stat-strip">
      <div class="stat"><span class="stat-label">${th("team.colOpen")}</span><span class="stat-value">${s.open ?? 0}</span></div>
      <div class="stat"><span class="stat-label">${th("team.statResolved", { days: stats.days })}</span><span class="stat-value">${s.resolved ?? 0}</span></div>
      <div class="stat"><span class="stat-label">${th("team.colAvg")}</span><span class="stat-value">${fmtHours(s.avgResolutionH)}</span></div>
      <div class="stat"><span class="stat-label">${th("team.colSla")}</span><span class="stat-value">${fmtPct(s.compliance)}</span></div>
    </section>

    <div class="split">
      <section>
        <h2 class="section-title">${th("team.openTickets")}</h2>
        ${open.length ? `<div class="table-wrap"><table class="table tickets">${ticketTableHead()}<tbody>${open.map(ticketRow).join("")}</tbody></table></div>` : `<p class="empty">${th("team.noOpen")}</p>`}
      </section>
      <section>
        <h2 class="section-title">${th("team.activity")}</h2>
        ${
          activity.length
            ? `<ol class="activity">${activity
                .map((a) => `<li><a href="#/tickets/${esc(a.ticket.id)}"><span class="mono">${esc(a.ticket.id)}</span> ${esc(a.text)}</a><small class="muted">${esc(fmtRel(a.at))}</small></li>`)
                .join("")}</ol>`
            : `<p class="empty">${th("team.noActivity")}</p>`
        }
      </section>
    </div>`;
}

/** Sign-up (user = null) or profile edit. */
export function openProfileForm(user, { signIn = true } = {}) {
  const isNew = !user;
  const v = user ?? { name: "", email: "", team: CONFIG.teams[0].id, role: "agent", skills: [], color: COLORS[0], bio: "" };
  const modal = openModal({
    title: th(isNew ? "team.signUpTitle" : "team.editTitle"),
    body: `<form id="profile-form" class="form" data-submit="save-profile" data-id="${esc(user?.id ?? "")}" data-sign-in="${signIn ? 1 : 0}">
      <label class="field"><span>${th("team.name")}</span><input class="input" name="name" required maxlength="60" value="${esc(v.name)}" autocomplete="name"></label>
      <label class="field"><span>${th("team.email")}</span><input class="input" name="email" type="email" maxlength="80" value="${esc(v.email ?? "")}" autocomplete="email"></label>
      <div class="form-row">
        <label class="field"><span>${th("team.colTeam")}</span><select class="select" name="team">${CONFIG.teams.map((x) => `<option value="${x.id}" ${x.id === v.team ? "selected" : ""}>${esc(teamLabel(x.id))}</option>`).join("")}</select></label>
        <label class="field"><span>${th("team.role")}</span><select class="select" name="role"><option value="agent" ${v.role !== "lead" ? "selected" : ""}>${th("team.agent")}</option><option value="lead" ${v.role === "lead" ? "selected" : ""}>${th("team.lead")}</option></select></label>
      </div>
      <fieldset class="field"><legend>${th("team.skills")}</legend><div class="checks">
        ${CONFIG.categories.map((c) => `<label class="check"><input type="checkbox" name="skills" value="${c.id}" ${v.skills?.includes(c.id) ? "checked" : ""}><span>${esc(catLabel(c.id))}</span></label>`).join("")}
      </div></fieldset>
      <fieldset class="field"><legend>${th("team.color")}</legend><div class="swatches">
        ${COLORS.map((c) => `<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${c === v.color ? "checked" : ""}><span></span></label>`).join("")}
      </div></fieldset>
      <label class="field"><span>${th("team.bio")}</span><textarea class="input" name="bio" rows="2" maxlength="160">${esc(loc(v.bio, getLang()))}</textarea></label>
    </form>`,
    footer: `<button class="btn" type="button" data-close>${th("common.cancel")}</button><button class="btn btn-primary" type="submit" form="profile-form">${th(isNew ? "team.create" : "common.save")}</button>`,
  });
  modal.el.querySelector("input[name=name]").focus();
}

on("click", {
  "open-profile": (el) => (location.hash = `#/team/${el.dataset.id}`),
  "add-tech": () => openProfileForm(null, { signIn: false }),
  "edit-profile": (el) => openProfileForm(getUser(el.dataset.id)),
});

on("submit", {
  "save-profile": (form) => {
    const data = new FormData(form);
    const profile = {
      name: String(data.get("name")).trim(),
      email: String(data.get("email") ?? "").trim(),
      team: data.get("team"),
      role: data.get("role"),
      skills: data.getAll("skills"),
      color: data.get("color") ?? COLORS[0],
      bio: String(data.get("bio") ?? "").trim(),
    };
    if (!profile.name) return;
    form.closest("dialog").close();
    if (form.dataset.id) {
      updateUser(form.dataset.id, profile);
      toast(t("team.saved"), "success");
    } else {
      const user = addUser(profile);
      if (form.dataset.signIn === "0") {
        toast(t("team.added", { name: user.name }), "success");
        return;
      }
      login(user.id);
      toast(t("team.welcome", { name: user.name.split(" ")[0] }), "success");
      location.hash = "#/dashboard";
    }
  },
});
