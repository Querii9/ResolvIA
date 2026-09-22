// Automatic actions the AI can run to fix a ticket (reset a password, unlock an account…).
// Without a webhook they are simulated step by step, so the demo shows the whole flow.
// With `webhook` set in config.js, the action is POSTed there (Power Automate, n8n, Zapier…).
import { CONFIG } from "./config.js";
import { getLang } from "./i18n.js";
import { loc, wait } from "./utils.js";

export const getAutomation = (id) => CONFIG.automations.find((a) => a.id === id);

/**
 * Runs an action for a ticket. `onStep(text, index)` is called as each step starts.
 * Returns { ok, simulated, error? }.
 */
export async function runAutomation(id, ticket, onStep = () => {}) {
  const action = getAutomation(id);
  if (!action) return { ok: false, simulated: true, error: "unknown action" };
  const steps = loc(action.steps, getLang());

  if (action.webhook) {
    onStep(steps[0] ?? action.id, 0);
    try {
      const res = await fetch(action.webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.id, ticket: { id: ticket.id, title: ticket.title, requester: ticket.requester } }),
      });
      if (!res.ok) return { ok: false, simulated: false, error: `HTTP ${res.status}` };
      steps.slice(1).forEach((s, i) => onStep(s, i + 1));
      return { ok: true, simulated: false };
    } catch (err) {
      return { ok: false, simulated: false, error: err.message };
    }
  }

  for (const [i, step] of steps.entries()) {
    onStep(step, i);
    await wait(700 + i * 150);
  }
  return { ok: true, simulated: true };
}
