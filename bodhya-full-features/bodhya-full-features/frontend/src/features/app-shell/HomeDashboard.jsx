// ---------- Home: today at a glance (tasks · plan · focus · alarms) ----------
//  A real dashboard instead of a placeholder, because every one of these
//  numbers is now something Bodhya actually tracks.
import { useEffect, useState } from "react";
import { todoStats, toggleTodo } from "../todo-list/store.js";
import { planStats, startFocusForSession } from "../study-schedule/store.js";
import { nextAlarm } from "../alarms/store.js";
import { fmtTime, untilText } from "../alarms/logic.js";
import { NOTIFS, unreadCount } from "../chatbot/brain/notify.js";
import { FOCUS, startFocus } from "../focus/store.js";
import { formatMinutes, goalProgress, todayMinutes } from "../time-tracking/store.js";
import { loadState } from "../chatbot/brain/memory.js";
import { avatarImg } from "../chatbot/data/avatars.js";
import { openFeature, emit, EVT } from "../chatbot/utils/events.js";
import { FOREST, forestState } from "../study-forest/store.js";
import { MUSIC, playPreset, currentPreset, isPlaying, stopMusic } from "../music/store.js";
import { SHIELD, shieldState } from "../focus-shield/store.js";
import { tr } from "../chatbot/i18n/features.js";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

export default function HomeDashboard({ lang, onNavigate }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const names = [EVT.todoChanged, EVT.planChanged, EVT.timeLogged, EVT.focusChanged, EVT.notifyChanged, EVT.forestChanged, EVT.shieldChanged, EVT.musicChanged];
    const bump = () => setTick((t) => t + 1);
    names.forEach((n) => window.addEventListener(n, bump));
    return () => names.forEach((n) => window.removeEventListener(n, bump));
  }, []);

  void tick;
  void MUSIC;
  void SHIELD;
  const now = new Date();
  const todos = todoStats(now);
  const plan = planStats(now);
  const alarm = nextAlarm(now);
  const unread = unreadCount(NOTIFS.read());
  const focusActive = FOCUS.read().active;
  const todayMin = todayMinutes(now);
  const goalPct = goalProgress(now).pct;
  const profile = loadState().profile || {};
  const avatar = avatarImg(profile.avatar || "banyan");
  const name = (profile.name || "").trim();

  const forest = forestState(now);
  const shield = shieldState();
  const musicOn = isPlaying();
  const musicPreset = currentPreset();
  const hour = now.getHours();
  const hi = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quick = [
    { id: "focus", emoji: "⏳", label: tr(lang, "focus.start"), tone: "bg-indigo-600 text-white" },
    { id: "todo", emoji: "✅", label: tr(lang, "todo.title"), tone: "bg-white text-slate-700 border border-slate-200" },
    { id: "planner", emoji: "📅", label: tr(lang, "plan.title"), tone: "bg-white text-slate-700 border border-slate-200" },
    { id: "alarms", emoji: "⏰", label: tr(lang, "alarm.set"), tone: "bg-white text-slate-700 border border-slate-200" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* greeting */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-4`}>
        <img src={avatar} alt="Bodhya" className="h-16 w-16 rounded-full object-cover shadow ring-4 ring-emerald-100" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-800">
            {hi}{name ? `, ${name}` : ""}! 👋
          </h2>
          <p className="text-[13px] text-slate-500">
            {unread > 0
              ? `${unread} ${tr(lang, "notif.unread")} · `
              : `${tr(lang, "notif.allRead")} · `}
            {alarm
              ? `${tr(lang, "alarm.next")}: ${fmtTime(alarm.alarm.time, false)} (${untilText(alarm.at - now, lang)})`
              : tr(lang, "alarm.noneUpcoming")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q.id} onClick={() => onNavigate?.(q.id)}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold transition hover:opacity-90 ${q.tone}`}>
              {q.emoji} {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* stat cards */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <button onClick={() => onNavigate?.("todo")} className={`${card} text-left transition hover:border-emerald-300`}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, "todo.progress")}</div>
          <div className="text-[20px] font-black text-slate-800">{todos.done}/{todos.total}</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${todos.pct}%` }} />
          </div>
          {todos.overdue > 0 && (
            <div className="mt-1 text-[11px] font-bold text-rose-600">
              ⚠️ {todos.overdue} {tr(lang, "todo.overdue")}
            </div>
          )}
        </button>

        <button onClick={() => onNavigate?.("time")} className={`${card} text-left transition hover:border-indigo-300`}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, "time.today")}</div>
          <div className="text-[20px] font-black text-slate-800">{formatMinutes(todayMin)}</div>
          <div className="text-[11px] text-slate-400">{tr(lang, "time.goal")}: {goalPct}%</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${goalPct}%` }} />
          </div>
        </button>

        <button onClick={() => onNavigate?.("planner")} className={`${card} text-left transition hover:border-rose-300`}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, "plan.today")}</div>
          <div className="text-[20px] font-black text-slate-800">
            {plan.today.filter((s) => s.done).length}/{plan.today.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {plan.countdown
              ? (plan.countdown.isToday ? tr(lang, "plan.examToday") : tr(lang, "plan.daysLeft", { n: plan.countdown.days }))
              : tr(lang, "plan.noExam")}
          </div>
        </button>

        <button onClick={() => onNavigate?.("forest")} className={`${card} text-left transition hover:border-emerald-300`}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, "forest.title")}</div>
          <div className="text-[20px] font-black text-slate-800">
            {FOREST.read().alive ? "🌱" : "🌳"} {forest.stats.total}
          </div>
          <div className="text-[11px] text-slate-400">
            🔥 {forest.stats.streak} · 🪙 {forest.coins} · {forest.stats.todayTrees} {tr(lang, "common.today")}
          </div>
        </button>

        <button onClick={() => onNavigate?.("shield")} className={`${card} text-left transition hover:border-sky-300`}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, "shield.title")}</div>
          <div className="text-[20px] font-black text-slate-800">
            {shield.stats.cleanStreak > 0 ? `🛡️ ${shield.stats.cleanStreak}` : "🛡️"}
          </div>
          <div className="text-[11px] text-slate-400">
            🚪 {shield.budget.escapes} · 💪 {shield.budget.resisted} · ☕ {shield.budget.left}/{shield.settings.dailyScrollBreaks}
          </div>
        </button>

        <button onClick={() => onNavigate?.("focus")} className={`${card} text-left transition hover:border-violet-300`}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, "focus.title")}</div>
          <div className="text-[20px] font-black text-slate-800">{focusActive ? "▶" : "⏳"}</div>
          <div className="text-[11px] text-slate-400">
            {focusActive
              ? `${focusActive.subject || tr(lang, "focus.working")} · ${focusActive.minutes} ${tr(lang, "plan.min")}`
              : tr(lang, "focus.tipText").slice(0, 42) + "…"}
          </div>
        </button>
      </div>

      {/* today's tasks + sessions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13.5px] font-extrabold text-slate-800">✅ {tr(lang, "todo.sectionToday")}</h3>
            <button onClick={() => onNavigate?.("todo")} className="text-[11.5px] font-bold text-indigo-600 hover:underline">
              {tr(lang, "common.viewAll")}
            </button>
          </div>
          {[...todos.groups.overdue, ...todos.groups.today].length === 0 ? (
            <p className="text-[12.5px] text-slate-400">{todos.open ? tr(lang, "notif.allRead") : tr(lang, "todo.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {[...todos.groups.overdue, ...todos.groups.today].slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <button onClick={() => toggleTodo(t.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300 text-[11px] hover:border-emerald-500"
                    aria-label="done" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-700">{t.title}</span>
                  <span className="shrink-0 text-[10.5px] font-bold text-slate-400">
                    {{ high: "🔴", med: "🟡", low: "🟢" }[t.priority]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={card}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13.5px] font-extrabold text-slate-800">📘 {tr(lang, "plan.today")}</h3>
            <button onClick={() => onNavigate?.("planner")} className="text-[11.5px] font-bold text-indigo-600 hover:underline">
              {tr(lang, "common.viewAll")}
            </button>
          </div>
          {plan.today.length === 0 ? (
            <button onClick={() => onNavigate?.("planner")}
              className="rounded-full bg-indigo-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-indigo-700">
              ✨ {tr(lang, "plan.generate")}
            </button>
          ) : (
            <ul className="space-y-2">
              {plan.today.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[12px] font-black tabular-nums text-slate-500">{s.startTime}</span>
                  <span className={`min-w-0 flex-1 truncate text-[12.5px] ${s.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {s.subjectName} · {s.minutes}m
                  </span>
                  {!s.done && (
                    <button onClick={() => startFocusForSession(s.id)}
                      className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100">
                      ▶
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* music quick bar */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-3`}>
        <span className="text-lg">🎵</span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-extrabold text-slate-800">
            {musicPreset.emoji} {musicPreset.name[lang] || musicPreset.name.en}
          </div>
          <div className="truncate text-[11px] text-slate-400">{tr(lang, "music.quickHint")}</div>
        </div>
        <button onClick={() => (musicOn ? stopMusic({ notifyUser: true }) : playPreset(null, { subject: focusActive?.subject || "" }))}
          className={`rounded-full px-4 py-2 text-[12.5px] font-bold transition ${musicOn ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
          {musicOn ? `⏹ ${tr(lang, "music.stop")}` : `▶ ${tr(lang, "music.play")}`}
        </button>
        <button onClick={() => onNavigate?.("music")}
          className="rounded-full border border-slate-300 px-4 py-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50">
          {tr(lang, "common.viewAll")}
        </button>
      </div>

      {/* chat nudge */}
      <div className={`${card} mt-4 flex flex-wrap items-center gap-3`}>
        <img src={avatar} alt="Bodhya" className="h-10 w-10 rounded-full object-cover" />
        <p className="min-w-0 flex-1 text-[12.5px] text-slate-600">
          💬 {tr(lang, "todo.chatHint")}
        </p>
        <button
          onClick={() => { emit(EVT.open, {}); emit(EVT.chatMessage, { text: tr(lang, "focus.title") ? "What's my plan today?" : "hi" }) }}
          className="rounded-full bg-slate-800 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-slate-900">
          {tr(lang, "common.askBodhya")} →
        </button>
        <button onClick={() => startFocus({ minutes: 25, subject: "" }) || openFeature("focus")}
          className="rounded-full border border-slate-300 px-4 py-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50">
          ⏳ 25 min
        </button>
      </div>
    </div>
  );
}
