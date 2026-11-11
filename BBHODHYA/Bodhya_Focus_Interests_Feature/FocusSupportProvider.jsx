import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FocusSupportContext } from "./FocusSupportContext.js";
import { getSettings, saveSettings, getSuggestion } from "./focusSupportLogic.js";
import FocusSupportNudge from "./FocusSupportNudge.jsx";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "click", "scroll"];

export function FocusSupportProvider({ children, activeTab, lang = "en", onAction }) {
  const [settings, setSettings] = useState(() => getSettings());
  const [sessionActive, setSessionActive] = useState(false);
  const [nudge, setNudge] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const lastActivityRef = useRef(Date.now());
  const hiddenAtRef = useRef(null);
  const tabChangesRef = useRef([]);
  const previousTabRef = useRef(activeTab);
  const sessionStartedAtRef = useRef(null);
  const lastLongPromptAtRef = useRef(0);
  const lastNudgeAtRef = useRef(0);
  const lastSignalRef = useRef("");
  const cooldownMs = Math.max(5, Number(settings.quietMinutes) || 12) * 60_000;

  useEffect(() => {
    const reload = () => setSettings(getSettings());
    window.addEventListener("bodhya:focus-support-settings-changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("bodhya:focus-support-settings-changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const setEnabled = useCallback((enabled) => {
    const next = { ...settings, enabled: Boolean(enabled) };
    saveSettings(next);
    setSettings(next);
    if (!enabled) {
      setNudge(null);
      setSessionActive(false);
    }
  }, [settings]);

  const updateSettings = useCallback((patch) => {
    const next = { ...settings, ...patch };
    saveSettings(next);
    setSettings(next);
  }, [settings]);

  const startSession = useCallback(() => {
    if (!settings.enabled) return false;
    lastActivityRef.current = Date.now();
    sessionStartedAtRef.current = Date.now();
    lastLongPromptAtRef.current = 0;
    hiddenAtRef.current = null;
    tabChangesRef.current = [];
    lastNudgeAtRef.current = 0;
    setNudge(null);
    setSessionActive(true);
    return true;
  }, [settings.enabled]);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    setNudge(null);
    hiddenAtRef.current = null;
    sessionStartedAtRef.current = null;
  }, []);

  const showNudge = useCallback((signal, subject = "study") => {
    const now = Date.now();
    if (!settings.enabled || !sessionActive || nudge || now - lastNudgeAtRef.current < cooldownMs) return false;
    if (lastSignalRef.current === signal && now - lastNudgeAtRef.current < cooldownMs) return false;
    const next = getSuggestion(signal, settings.interests, subject);
    lastNudgeAtRef.current = now;
    lastSignalRef.current = signal;
    setNudge(next);
    return true;
  }, [settings, sessionActive, nudge, cooldownMs]);

  useEffect(() => {
    if (!settings.enabled || !sessionActive) return undefined;
    const markActive = () => { lastActivityRef.current = Date.now(); };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current) {
        const awayFor = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        lastActivityRef.current = Date.now();
        if (awayFor > 90_000) showNudge("returned");
      }
    };
    const onCustomSignal = (event) => {
      const signal = event?.detail?.signal;
      const allowed = ["idle", "returned", "frequent_switches", "stuck", "long_session", "student_requested"];
      if (!allowed.includes(signal)) return;
      const subject = typeof event?.detail?.subject === "string" ? event.detail.subject.slice(0, 40) : "study";
      showNudge(signal, subject);
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("bodhya:focus-support-signal", onCustomSignal);
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;
      if (idleMs >= Math.max(2, Number(settings.idleMinutes) || 6) * 60_000) {
        showNudge("idle");
        lastActivityRef.current = now;
      }
      const sessionAge = sessionStartedAtRef.current ? now - sessionStartedAtRef.current : 0;
      if (sessionAge >= 45 * 60_000 && now - lastLongPromptAtRef.current >= 45 * 60_000) {
        if (showNudge("long_session")) lastLongPromptAtRef.current = now;
      }
    }, 15_000);
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("bodhya:focus-support-signal", onCustomSignal);
      window.clearInterval(intervalId);
    };
  }, [settings.enabled, settings.idleMinutes, sessionActive, showNudge]);

  useEffect(() => {
    const changed = previousTabRef.current !== activeTab;
    previousTabRef.current = activeTab;
    if (!changed || !settings.enabled || !sessionActive || activeTab == null) return;
    const now = Date.now();
    const recent = tabChangesRef.current.filter((item) => now - item.at < 90_000);
    recent.push({ tab: activeTab, at: now });
    tabChangesRef.current = recent;
    if (recent.length >= 7) {
      tabChangesRef.current = [];
      showNudge("frequent_switches");
    }
    lastActivityRef.current = now;
  }, [activeTab, settings.enabled, sessionActive, showNudge]);

  const dismissNudge = useCallback(() => {
    setNudge(null);
    lastActivityRef.current = Date.now();
  }, []);

  const respondToNudge = useCallback((action, current = nudge) => {
    if (action === "dismiss") return dismissNudge();
    setLastAction({ action, nudge: current, at: Date.now() });
    if (action === "quick_reset") {
      setSessionActive(false);
    }
    onAction?.(action, current);
    setNudge(null);
    lastActivityRef.current = Date.now();
  }, [dismissNudge, nudge, onAction]);

  const requestInterestPrompt = useCallback((subject) => {
    if (!settings.enabled) return setLastAction({ action: "enable_first", at: Date.now() });
    const suggestion = getSuggestion("student_requested", settings.interests, subject || "study");
    setNudge(suggestion);
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    enabled: settings.enabled,
    setEnabled,
    updateSettings,
    sessionActive,
    startSession,
    stopSession,
    nudge,
    showNudge,
    dismissNudge,
    respondToNudge,
    requestInterestPrompt,
    lastAction,
  }), [settings, setEnabled, updateSettings, sessionActive, startSession, stopSession, nudge, showNudge, dismissNudge, respondToNudge, requestInterestPrompt, lastAction]);

  return (
    <FocusSupportContext.Provider value={value}>
      {children}
      <FocusSupportNudge nudge={nudge} lang={lang} onAction={respondToNudge} onDismiss={dismissNudge} />
    </FocusSupportContext.Provider>
  );
}

export default FocusSupportProvider;
