// ═══════════════════════════════════════════════════════════════════
//  ResolvIA · config.js
//
//  ► CA: Edita aquest fitxer per adaptar l'eina a la teva organització.
//  ► ES: Edita este archivo para adaptar la herramienta a tu organización.
//  ► EN: Edit this file to adapt the tool to your organisation.
// ═══════════════════════════════════════════════════════════════════

export const CONFIG = {
  appName: "ResolvIA",
  author: { name: "Querià Montserrat", url: "https://github.com/Querii9" },
  repoUrl: "https://github.com/Querii9/resolvia",

  // "auto" follows the browser language. Options: "auto" | "ca" | "es" | "en"
  defaultLanguage: "auto",
  ticketPrefix: "INC",

  teams: [
    { id: "servicedesk", label: { ca: "Service Desk", es: "Service Desk", en: "Service Desk" } },
    { id: "network", label: { ca: "Xarxes", es: "Redes", en: "Network" } },
    { id: "systems", label: { ca: "Sistemes i M365", es: "Sistemas y M365", en: "Systems & M365" } },
    { id: "field", label: { ca: "Suport presencial", es: "Soporte presencial", en: "Field support" } },
    { id: "apps", label: { ca: "Aplicacions", es: "Aplicaciones", en: "Applications" } },
  ],

  // Each category is routed to a team by default. `icon` is one of the icons in ui.js.
  categories: [
    { id: "access", icon: "key", team: "servicedesk", label: { ca: "Accessos i contrasenyes", es: "Accesos y contraseñas", en: "Access & passwords" } },
    { id: "email", icon: "mail", team: "systems", label: { ca: "Correu i Outlook", es: "Correo y Outlook", en: "Email & Outlook" } },
    { id: "network", icon: "wifi", team: "network", label: { ca: "Xarxa i VPN", es: "Red y VPN", en: "Network & VPN" } },
    { id: "office", icon: "file", team: "servicedesk", label: { ca: "Ofimàtica", es: "Ofimática", en: "Office apps" } },
    { id: "hardware", icon: "laptop", team: "field", label: { ca: "Equips i maquinari", es: "Equipos y hardware", en: "Devices & hardware" } },
    { id: "printing", icon: "printer", team: "field", label: { ca: "Impressores", es: "Impresoras", en: "Printing" } },
    { id: "software", icon: "app", team: "apps", label: { ca: "Programari i aplicacions", es: "Software y aplicaciones", en: "Software & apps" } },
    { id: "phone", icon: "phone", team: "network", label: { ca: "Telefonia i mòbils", es: "Telefonía y móviles", en: "Phones & mobile" } },
  ],

  priorities: [
    { id: "P1", label: { ca: "Crítica", es: "Crítica", en: "Critical" } },
    { id: "P2", label: { ca: "Alta", es: "Alta", en: "High" } },
    { id: "P3", label: { ca: "Normal", es: "Normal", en: "Normal" } },
    { id: "P4", label: { ca: "Baixa", es: "Baja", en: "Low" } },
  ],

  // Default SLA. Every value can be changed from Settings inside the app.
  sla: {
    // The SLA clock only runs inside business hours (except priorities marked allDay).
    businessHours: { start: 9, end: 18, days: [1, 2, 3, 4, 5] }, // 0 = Sunday
    warnAt: 0.75, // a ticket is "at risk" once 75% of its time is used
    // Targets in hours: first response and resolution.
    targets: {
      P1: { response: 0.5, resolution: 4, allDay: true },
      P2: { response: 1, resolution: 8 },
      P3: { response: 4, resolution: 24 },
      P4: { response: 8, resolution: 40 },
    },
  },

  // A burst of similar tickets in a short time = possible outage.
  massIncident: { windowMinutes: 60, minTickets: 4 },

  // Actions the AI can run to fix a ticket by itself. In the demo they are simulated;
  // set `webhook` to a URL (Power Automate, n8n, Zapier…) to run them for real.
  automations: [
    {
      id: "reset-password",
      icon: "key",
      webhook: "",
      label: { ca: "Restablir la contrasenya", es: "Restablecer la contraseña", en: "Reset password" },
      steps: {
        ca: ["Verificant la identitat de l'usuari", "Generant un enllaç de restabliment", "Enviant-lo al mòbil registrat"],
        es: ["Verificando la identidad del usuario", "Generando un enlace de restablecimiento", "Enviándolo al móvil registrado"],
        en: ["Verifying the user's identity", "Generating a reset link", "Sending it to the registered phone"],
      },
    },
    {
      id: "unlock-account",
      icon: "unlock",
      webhook: "",
      label: { ca: "Desbloquejar el compte", es: "Desbloquear la cuenta", en: "Unlock account" },
      steps: {
        ca: ["Comprovant els intents fallits", "Desbloquejant el compte al directori", "Notificant l'usuari"],
        es: ["Comprobando los intentos fallidos", "Desbloqueando la cuenta en el directorio", "Notificando al usuario"],
        en: ["Checking failed sign-in attempts", "Unlocking the account in the directory", "Notifying the user"],
      },
    },
    {
      id: "archive-mailbox",
      icon: "archive",
      webhook: "",
      label: { ca: "Activar l'arxiu de la bústia", es: "Activar el archivo del buzón", en: "Enable mailbox archive" },
      steps: {
        ca: ["Revisant l'ús de la bústia", "Activant l'arxiu en línia", "Movent els correus de més d'1 any"],
        es: ["Revisando el uso del buzón", "Activando el archivo en línea", "Moviendo los correos de más de 1 año"],
        en: ["Checking mailbox usage", "Enabling the online archive", "Moving emails older than 1 year"],
      },
    },
    {
      id: "grant-mailbox-access",
      icon: "users",
      webhook: "",
      label: { ca: "Donar accés a la bústia compartida", es: "Dar acceso al buzón compartido", en: "Grant shared mailbox access" },
      steps: {
        ca: ["Comprovant l'aprovació del responsable", "Afegint permisos de lectura i enviament", "Esperant la sincronització d'Outlook"],
        es: ["Comprobando la aprobación del responsable", "Añadiendo permisos de lectura y envío", "Esperando la sincronización de Outlook"],
        en: ["Checking manager approval", "Adding read and send permissions", "Waiting for Outlook to sync"],
      },
    },
    {
      id: "clear-print-queue",
      icon: "printer",
      webhook: "",
      label: { ca: "Buidar la cua d'impressió", es: "Vaciar la cola de impresión", en: "Clear print queue" },
      steps: {
        ca: ["Connectant amb el servidor d'impressió", "Cancel·lant els treballs encallats", "Reiniciant la cua"],
        es: ["Conectando con el servidor de impresión", "Cancelando los trabajos atascados", "Reiniciando la cola"],
        en: ["Connecting to the print server", "Cancelling stuck jobs", "Restarting the queue"],
      },
    },
  ],

  ai: {
    // Provider used by default. Each visitor can switch it in Settings.
    provider: "anthropic",
    // Proactive AI: "suggest" = it proposes and a technician approves; "auto" = it resolves on its own
    // when its confidence is at least `autoResolveConfidence`. Also editable in Settings.
    autonomy: "suggest",
    autoResolveConfidence: 0.8,
    // Reasoning effort per feature: "low" | "medium" | "high" (lower = faster & cheaper).
    effort: { triage: "low", resolve: "low", reply: "low", report: "medium", guide: "medium", chat: "medium" },

    // Every provider's official SDK is loaded from a CDN only when it's used (no build step).
    providers: {
      anthropic: {
        label: "Claude",
        company: "Anthropic",
        model: "claude-opus-5",
        models: [
          { id: "claude-opus-5", label: "Claude Opus 5" },
          { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
          { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
        ],
        keyUrl: "https://console.anthropic.com/settings/keys",
        keyHint: "sk-ant-…",
        sdkUrl: "https://esm.sh/@anthropic-ai/sdk@0.127.0",
        refusalFallback: true,
      },
      openai: {
        label: "OpenAI",
        company: "OpenAI",
        model: "gpt-5.6",
        models: [
          { id: "gpt-5.6", label: "GPT-5.6" },
          { id: "gpt-6-astra", label: "GPT-6 Astra" },
          { id: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
          { id: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
        ],
        keyUrl: "https://platform.openai.com/api-keys",
        keyHint: "sk-…",
        sdkUrl: "https://esm.sh/openai@7.21.0",
      },
      gemini: {
        label: "Gemini",
        company: "Google",
        model: "gemini-3.8-flash",
        models: [
          { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
          { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
          { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
        ],
        keyUrl: "https://aistudio.google.com/apikey",
        keyHint: "AIza…",
        sdkUrl: "https://esm.sh/@google/genai@2.24.0",
      },
    },
  },
};
