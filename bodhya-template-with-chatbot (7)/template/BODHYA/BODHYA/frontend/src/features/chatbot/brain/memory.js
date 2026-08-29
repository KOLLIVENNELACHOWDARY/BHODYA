// ---------- Bodhya memory & adaptive engine (localStorage, no server) ----------

const KEY = 'bodhya_v1'
const OLD_KEY = 'studymate_v1' // migrate from the older working title
let memStore = null // in-memory fallback if localStorage is unavailable

function safeGet() {
  try {
    if (typeof window !== 'undefined') {
      let v = window.localStorage.getItem(KEY)
      if (!v) {
        const old = window.localStorage.getItem(OLD_KEY)
        if (old) {
          window.localStorage.setItem(KEY, old)
          window.localStorage.removeItem(OLD_KEY)
          v = old
        }
      }
      return v
    }
  } catch { /* storage blocked */ }
  return null
}
function safeSet(v) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(KEY, v) } catch { /* storage blocked — keep in memory */ }
}

export const DEFAULT_STATE = {
  profile: {
    name: '',
    ageGroup: 'teen',
    tone: 'auto',        // auto | fun | simple | pro
    lang: 'en',          // en | hi | te
    avatar: 'banyan',    // user-picked mascot (see data/avatars.js)
    quizTheme: 'auto',   // 'auto' | 'professional' | 'gamified'
    onboarded: false,
    tourDone: false
  },
  memory: {
    level: 1,            // 1..5 adaptive difficulty
    xp: 0,
    quizzes: 0,
    quizCorrect: 0,
    tasksDone: 0,
    topicsLearned: [],   // topic ids explained
    chatCount: 0,
    lastActive: null,
    lastQuizScore: null,
    lastQuizTier: null,
    levelUpFlash: false
  },
  tasks: [],            // {id, subject, minutes, done, createdAt}
  session: { lastTopic: null, pendingSocratic: false }
}

export function loadState() {
  if (memStore) return memStore
  const raw = safeGet()
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      memStore = {
        profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
        memory: { ...DEFAULT_STATE.memory, ...(parsed.memory || {}) },
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        session: { ...DEFAULT_STATE.session, ...(parsed.session || {}) }
      }
      return memStore
    } catch { /* corrupted — fall through */ }
  }
  memStore = JSON.parse(JSON.stringify(DEFAULT_STATE))
  return memStore
}

export function saveState() {
  const s = loadState()
  safeSet(JSON.stringify({ profile: s.profile, memory: s.memory, tasks: s.tasks }))
}

export function updateProfile(patch) {
  const s = loadState()
  s.profile = { ...s.profile, ...patch }
  saveState()
  return s.profile
}

export function updateMemory(patch) {
  const s = loadState()
  s.memory = { ...s.memory, ...patch }
  recomputeLevel(s)
  saveState()
  return s.memory
}

export function addXp(n) {
  const s = loadState()
  const prevLevel = s.memory.level
  s.memory.xp += n
  recomputeLevel(s)
  const leveled = s.memory.level > prevLevel
  saveState()
  if (leveled && typeof window !== 'undefined') {
    // tell the app to celebrate (kawaii level-up!)
    try {
      window.dispatchEvent(new CustomEvent('bodhya:levelup', {
        detail: { level: s.memory.level, xp: s.memory.xp },
      }))
    } catch {}
  }
  return { xp: s.memory.xp, level: s.memory.level, leveledUp: leveled }
}

// Adaptive difficulty: level rises with XP milestones
export function recomputeLevel(s) {
  const xp = s.memory.xp
  s.memory.level = xp >= 500 ? 5 : xp >= 300 ? 4 : xp >= 160 ? 3 : xp >= 60 ? 2 : 1
}

export function xpForLevel(level) {
  return [0, 60, 160, 300, 500][Math.min(level, 4)]
}

export function addTask(subject, minutes) {
  const s = loadState()
  const task = { id: Date.now(), subject: subject.trim(), minutes: Number(minutes) || 30, done: false, createdAt: Date.now() }
  s.tasks.push(task)
  saveState()
  return task
}

export function toggleTask(id) {
  const s = loadState()
  const t = s.tasks.find(x => x.id === id)
  if (!t) return null
  t.done = !t.done
  if (t.done) s.memory.tasksDone += 1
  saveState()
  return t
}

export function removeTask(id) {
  const s = loadState()
  s.tasks = s.tasks.filter(x => x.id !== id)
  saveState()
}

export function clearDoneTasks() {
  const s = loadState()
  s.tasks = s.tasks.filter(x => !x.done)
  saveState()
}

export function markTopicLearned(topicId) {
  const s = loadState()
  if (!s.memory.topicsLearned.includes(topicId)) s.memory.topicsLearned.push(topicId)
  saveState()
}

export function resetAll() {
  memStore = JSON.parse(JSON.stringify(DEFAULT_STATE))
  try {
    window.localStorage.removeItem(KEY)
    window.localStorage.removeItem(OLD_KEY)
  } catch {}
}

export function touchActive() {
  const s = loadState()
  const today = new Date().toDateString()
  if (s.memory.lastActive === today) return
  if (s.memory.lastActive) {
    const y = new Date(s.memory.lastActive); y.setDate(y.getDate() + 1)
    if (y.toDateString() === today) s.memory.streak = (s.memory.streak || 0) + 1
    else s.memory.streak = 1
  } else s.memory.streak = 1
  s.memory.lastActive = today
  saveState()
}
