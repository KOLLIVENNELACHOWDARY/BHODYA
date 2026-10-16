// ---------- LLM agent client: talks to the backend agent (team's llm_router) ----------
// Falls back to the offline rule brain automatically when the backend is down
// or no API keys are configured yet — the chatbot NEVER breaks.

const BACKEND_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "";

/**
 * Ask the LLM agent for a reply.
 * @returns {Promise<{text:string, action?:string|null, mode:'llm'|'rule'}|null>} null if unreachable
 */
export async function chatWithLLM(messages, { context = "home", lang = "en", profile = {} } = {}) {
  if (!BACKEND_URL) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000); // don't leave the user hanging
  try {
    const res = await fetch(`${BACKEND_URL}/api/chatbot-guide/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.slice(-14), context, lang, profile }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.reply) return null;
    return {
      text: data.reply,
      action: data.action || null,
      mode: data.mode === "llm" ? "llm" : "rule",
    };
  } catch {
    return null; // backend down / timeout → caller uses the offline rule brain
  } finally {
    clearTimeout(timer);
  }
}
