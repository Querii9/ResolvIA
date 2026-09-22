// Chat with the tickets: questions in plain language, answered from the live numbers.
import { aiErrorMessage, askChat, isLive } from "../ai.js";
import { th } from "../i18n.js";
import { computeStats } from "../stats.js";
import { getSla, getState } from "../store.js";
import { aiTag, icon, on } from "../ui.js";
import { esc, mdLite } from "../utils.js";

let messages = []; // { role: "user"|"assistant", content, error? }
let busy = false;
let controller = null;

export function renderChat(root) {
  root.innerHTML = `
    <header class="page-head">
      <div><h1>${aiTag()} ${th("chat.title")}</h1><p class="muted">${th("chat.subtitle")}</p></div>
      <button class="btn" type="button" data-action="chat-clear">${icon("refresh", 16)}<span>${th("chat.clear")}</span></button>
    </header>
    ${isLive() ? "" : `<p class="notice">${th("chat.demoBanner")} <button class="btn-link" type="button" data-action="open-settings">${th("common.addKey")}</button></p>`}
    <section class="chat">
      <div class="chat-log" id="chat-log" aria-live="polite"></div>
      <div class="chips">${["chat.s1", "chat.s2", "chat.s3", "chat.s4"].map((k) => `<button class="chip" type="button" data-action="chat-suggest">${th(k)}</button>`).join("")}</div>
      <form class="chat-input" data-submit="chat-send">
        <label class="sr-only" for="chat-q">${th("chat.placeholder")}</label>
        <textarea id="chat-q" class="input" name="q" rows="1" data-enter-submit placeholder="${th("chat.placeholder")}"></textarea>
        <button class="btn btn-primary" type="submit" aria-label="${th("chat.send")}">${icon("send", 16)}</button>
      </form>
    </section>`;
  paint();
}

const bubble = (m) =>
  `<div class="bubble ${m.role} ${m.error ? "error" : ""}">${m.role === "assistant" ? (m.content ? mdLite(m.content) : `<span class="typing"><i></i><i></i><i></i></span>`) : esc(m.content)}</div>`;

function paint() {
  const log = document.getElementById("chat-log");
  if (!log) return;
  log.innerHTML = `<div class="bubble assistant">${th("chat.welcome")}</div>${messages.map(bubble).join("")}`;
  log.scrollTop = log.scrollHeight;
}

function paintLast(message) {
  const log = document.getElementById("chat-log");
  if (!log?.lastElementChild) return;
  log.lastElementChild.outerHTML = bubble(message);
  log.scrollTop = log.scrollHeight;
}

async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  const history = [...messages.filter((m) => !m.error), { role: "user", content: text }].map(({ role, content }) => ({ role, content }));
  messages.push({ role: "user", content: text });
  const reply = { role: "assistant", content: "" };
  messages.push(reply);
  busy = true;
  controller = new AbortController();
  paint();
  try {
    const recent = history.slice(-20);
    while (recent[0]?.role !== "user") recent.shift();
    const stats = computeStats(getState(), getSla(), new Date());
    await askChat(recent, stats, (delta) => {
      reply.content += delta;
      paintLast(reply);
    }, { signal: controller.signal });
  } catch (err) {
    if (err.code !== "aborted") {
      reply.content = aiErrorMessage(err);
      reply.error = true;
    }
  } finally {
    if (!reply.content) messages = messages.filter((m) => m !== reply);
    busy = false;
    controller = null;
    paint();
  }
}

on("submit", {
  "chat-send": (form) => {
    const text = form.q.value;
    form.q.value = "";
    send(text);
  },
});

on("click", {
  "chat-suggest": (el) => send(el.textContent),
  "chat-clear": () => {
    controller?.abort();
    messages = [];
    busy = false;
    paint();
  },
});
