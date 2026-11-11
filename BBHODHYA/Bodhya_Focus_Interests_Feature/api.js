import { getSuggestion } from "./focusSupportLogic.js";

const API_BASE = (import.meta?.env?.VITE_BODHYA_API_URL || "").replace(/\/$/, "");

/** Generic suggestions only. No session events or student profile are uploaded. */
export async function getFocusSuggestion({ signal, interests, subject }) {
  const interest = interests?.[0] || "puzzles";
  if (API_BASE) {
    try {
      const response = await fetch(`${API_BASE}/api/focus-support/recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal, interest, subject: subject || "study" }),
      });
      if (response.ok) {
        const result = await response.json();
        return {
          id: `${signal}-${Date.now()}`,
          signal,
          title: result.title,
          message: result.message,
          actions: result.action === "take_reset"
            ? ["quick_reset", "continue", "dismiss"]
            : result.action === "change_format"
              ? ["change_format", "interest_example", "dismiss"]
              : ["tiny_step", "interest_example", "dismiss"],
          interest: result.interest,
          subjectExample: result.subject_example,
        };
      }
    } catch {
      // Use the local recommendations below if API is unavailable.
    }
  }
  return getSuggestion(signal, interests, subject);
}
