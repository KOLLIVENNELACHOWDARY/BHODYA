// ============================================================
//  Study-forest store — planting, growing, withering, coins,
//  streaks and achievements.
//
//  The tree timer IS the focus timer (single source of truth):
//  planting starts a focus block carrying `treeId`, finishing it
//  grows the tree, cancelling or wandering off withers it.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, on, EVT } from '../chatbot/utils/events.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { addXp } from '../chatbot/brain/memory.js'
import { playSound } from '../chatbot/utils/sound.js'
import {
  ACHIEVEMENTS, STAGE_ART, coinsFor, dayKey, evaluateEscape, forestLevel, forestStats,
  isUnlocked, speciesById, stageFor, strictnessById,
} from './logic.js'

export const FOREST = makeStore(
  'bodhya_forest_v1',
  {
    trees: [],        // {id, speciesId, minutes, day, plantedAt, grownAt, status, escapes, strictness, subject, focusId}
    coins: 0,
    alive: null,      // the tree growing right now: {id, speciesId, minutes, plantedAt, escapes, strictness, focusId, subject}
    achievements: [],
    settings: {
      strictness: 'focused',
      autoMusic: true,          // start study music with the tree
      warnOnLeave: true,
      soundOnGrow: true,
      coinsEnabled: true,
    },
    stats: { planted: 0, grown: 0, withered: 0 },
  },
  { changeEvent: EVT.forestChanged }
)

const change = (detail = {}) => { emit(EVT.forestChanged, detail); return detail }

// ------------------------------------------------------------------
//  planting
// ------------------------------------------------------------------
export function plantTree({
  speciesId = 'pine', minutes = null, subject = '', strictness = null, focusId = null, now = new Date(),
} = {}) {
  const species = speciesById(speciesId)
  const stats = forestStats(FOREST.read().trees, now)
  const state = FOREST.read()

  if (!isUnlocked(species, { coins: state.coins, streak: stats.streak })) {
    return { error: 'locked', species }
  }

  const mins = Number(minutes) || species.minutes
  const tree = {
    id: uid('tree'),
    speciesId: species.id,
    minutes: mins,
    subject: subject || '',
    day: dayKey(now),
    plantedAt: now.getTime(),
    grownAt: null,
    status: 'growing',
    escapes: 0,
    awayMs: 0,
    strictness: strictness || state.settings.strictness,
    focusId,
  }
  FOREST.update((s) => ({
    alive: tree,
    trees: [...s.trees, tree],
    stats: { ...s.stats, planted: (s.stats.planted || 0) + 1 },
  }))
  emit(EVT.treePlanted, { tree })
  change({ planted: tree.id })
  return { tree, species }
}

/** Link the tree to the focus block that was just started for it. */
export function linkFocus(treeId, focusId) {
  FOREST.update((s) => ({
    alive: s.alive && s.alive.id === treeId ? { ...s.alive, focusId } : s.alive,
    trees: s.trees.map((t) => (t.id === treeId ? { ...t, focusId } : t)),
  }))
}

export function aliveTree() {
  return FOREST.read().alive
}

export function aliveSpecies() {
  const alive = aliveTree()
  return alive ? speciesById(alive.speciesId) : null
}

export function aliveArt(elapsedMinutes = 0) {
  const alive = aliveTree()
  if (!alive) return null
  const stage = stageFor(alive.minutes, elapsedMinutes)
  return { stage, emoji: STAGE_ART[stage] }
}

// ------------------------------------------------------------------
//  escaping (called by the Focus Shield) & withering
// ------------------------------------------------------------------
export function noteEscape(awayMs = 0) {
  const alive = aliveTree()
  if (!alive) return null
  const escapes = (alive.escapes || 0) + 1
  const awayTotal = (alive.awayMs || 0) + awayMs
  const verdict = evaluateEscape({ awayMs, escapes, strictness: alive.strictness, running: true })
  FOREST.update((s) => ({
    alive: s.alive && s.alive.id === alive.id ? { ...s.alive, escapes, awayMs: awayTotal, lastEscapeAt: Date.now() } : s.alive,
    trees: s.trees.map((t) => (t.id === alive.id ? { ...t, escapes, awayMs: awayTotal } : t)),
  }))
  change({ escape: alive.id, escapes, awayMs })
  return { escapes, awayMs: awayTotal, verdict }
}

/** Kill the tree (cancel / escape limit / app closed too long). */
export function witherTree(treeId = null, reason = 'cancelled') {
  const state = FOREST.read()
  const target = treeId ? state.trees.find((t) => t.id === treeId) : state.alive
  if (!target || target.status !== 'growing') return null

  const withered = { ...target, status: 'withered', witheredAt: Date.now(), witherReason: reason }
  FOREST.update((s) => ({
    alive: s.alive && s.alive.id === target.id ? null : s.alive,
    trees: s.trees.map((t) => (t.id === target.id ? withered : t)),
    stats: { ...s.stats, withered: (s.stats.withered || 0) + 1 },
  }))
  if (state.settings.soundOnGrow) playSound('soft', 0.4)
  emit(EVT.treeWithered, { tree: withered, reason })

  const message = {
    cancelled: {
      en: ['🥀 Your tree withered', 'You stopped the session, so the tree is gone. Plant again — no guilt, just restart.'],
      hi: ['🥀 आपका पेड़ मुरझा गया', 'सत्र रोका गया, इसलिए पेड़ चला गया। फिर लगाइए — कोई बुरा नहीं लगेगा।'],
      te: ['🥀 మీ చెట్టు వాడిపోయింది', 'సెషన్ ఆపారు, అందుకే చెట్టు పోయింది. మళ్లీ నాటండి.'],
    },
    'away-too-long': {
      en: ['🥀 Your tree withered — you left the app', 'That was the deal with yourself. Next one will survive.'],
      hi: ['🥀 पेड़ मुरझा गया — आप ऐप से बाहर गए', 'यही आपका अपने-आप से वादा था। अगला बचेगा।'],
      te: ['🥀 చెట్టు వాడిపోయింది — యాప్ నుంచి బయటకు వెళ్లారు', 'ఇది మీతో మీరు చేసుకున్న ఒప్పందం. తదుపరిది బతుకుతుంది.'],
    },
    'too-many-escapes': {
      en: ['🥀 Too many escapes this time', 'The tree needed full attention. Try a shorter species next round.'],
      hi: ['🥀 इस बार बहुत बार भटके', 'पेड़ को पूरा ध्यान चाहिए था। अगली बार छोटा पेड़ चुनिए।'],
      te: ['🥀 ఈసారి చాలా సార్లు బయటకు వెళ్లారు', 'చెట్టుకు పూర్తి శ్రద్ధ కావాలి. తదుపరిసారి చిన్న చెట్టు ఎంచుకోండి.'],
    },
  }[reason] || {
    en: ['🥀 Your tree withered', 'Something ended the session early.'],
    hi: ['🥀 पेड़ मुरझा गया', 'किसी कारण सत्र जल्दी खत्म हो गया।'],
    te: ['🥀 చెట్టు వాడిపోయింది', 'ఏదో సెషన్‌ను ముందుగా ముగించింది.'],
  }

  pushNotification({
    kind: 'forest',
    title: message.en[0].startsWith('🥀') ? `${message.en[0]}` : '🥀 Tree withered',
    body: (message.en[1]),
    silent: true,
    action: { feature: 'forest' },
    meta: { treeId: target.id },
  })
  change({ withered: target.id, reason })
  return withered
}

/** Success! Called when the focus block finishes with this tree attached. */
export function growTree(treeId = null, { minutes = null, escapes = null } = {}) {
  const state = FOREST.read()
  const target = treeId ? state.trees.find((t) => t.id === treeId) : state.alive
  if (!target || target.status !== 'growing') return null

  const mins = Number(minutes) || target.minutes
  const grown = {
    ...target,
    minutes: mins,
    status: 'grown',
    grownAt: Date.now(),
    escapes: escapes ?? target.escapes ?? 0,
  }
  const coins = state.settings.coinsEnabled ? coinsFor(mins) : 0
  const bonusXp = 15 + Math.round(mins / 2) + (grown.escapes === 0 ? 10 : 0)

  FOREST.update((s) => ({
    alive: s.alive && s.alive.id === target.id ? null : s.alive,
    trees: s.trees.map((t) => (t.id === target.id ? grown : t)),
    coins: s.coins + coins,
    stats: { ...s.stats, grown: (s.stats.grown || 0) + 1 },
  }))

  if (state.settings.soundOnGrow) playSound('marimba', 0.6)
  const xp = addXp(bonusXp)
  emit(EVT.treeGrown, { tree: grown, coins, xp: bonusXp })

  const stats = forestStats(FOREST.read().trees)
  const species = speciesById(grown.speciesId)
  const clean = grown.escapes === 0
  pushNotification({
    kind: 'forest',
    title: `${species.emoji} ${species.name.en} grew!`,
    body: `${mins} min${clean ? ' · a clean session 🛡️' : ` · ${grown.escapes} escape(s)`} · +${coins} 🪙 · +${bonusXp} XP · streak ${stats.streak} day(s)`,
    silent: true,
    groupKey: `tree-grown-${grown.id}`,
    action: { feature: 'forest' },
    meta: { treeId: grown.id },
  })

  checkAchievements(stats)
  change({ grown: grown.id, coins, xp: bonusXp, leveledUp: xp.leveledUp })
  return { tree: grown, coins, xp: bonusXp, stats }
}

function checkAchievements(stats) {
  const earned = FOREST.read().achievements || []
  const newly = ACHIEVEMENTS.filter((a) => !earned.includes(a.id) && a.test(stats))
  if (!newly.length) return []
  FOREST.update({ achievements: [...earned, ...newly.map((a) => a.id)] })
  newly.forEach((a) => pushNotification({
    kind: 'forest',
    title: `${a.emoji} Achievement: ${a.name.en}`,
    body: 'Open your forest to see everything you have grown.',
    silent: true,
    action: { feature: 'forest' },
  }))
  return newly
}

export function achievements() {
  const earned = FOREST.read().achievements || []
  const stats = forestStats(FOREST.read().trees)
  return ACHIEVEMENTS.map((a) => ({ ...a, earned: earned.includes(a.id) || a.test(stats) }))
}

// ------------------------------------------------------------------
//  coins & unlocks
// ------------------------------------------------------------------
export function buySpecies(speciesId) {
  const state = FOREST.read()
  const species = speciesById(speciesId)
  const stats = forestStats(state.trees)
  const u = species.unlock || { type: 'free' }
  if (u.type !== 'coins') return { error: 'not-for-sale' }
  if (state.coins < (u.cost || 0)) return { error: 'not-enough-coins', needed: (u.cost || 0) - state.coins }
  FOREST.update((s) => ({
    coins: s.coins - (u.cost || 0),
    unlocked: [...new Set([...(s.unlocked || []), speciesId])],
  }))
  void stats
  change({ unlocked: speciesId })
  return { ok: true, species }
}

export function unlockedSpecies() {
  const state = FOREST.read()
  const stats = forestStats(state.trees)
  const bought = state.unlocked || []
  return speciesWithAvailability(bought, stats)
}

function speciesWithAvailability(bought, stats) {
  return { bought, stats }
}

/** Revive the newest withered tree (Forest-app style, costs coins). */
export function reviveLastWithered(cost = 5) {
  const state = FOREST.read()
  const withered = state.trees.filter((t) => t.status === 'withered').sort((a, b) => b.witheredAt - a.witheredAt)
  const target = withered[0]
  if (!target) return { error: 'nothing-to-revive' }
  if (state.coins < cost) return { error: 'not-enough-coins', needed: cost - state.coins }
  FOREST.update((s) => ({
    coins: s.coins - cost,
    trees: s.trees.map((t) => (t.id === target.id
      ? { ...t, status: 'grown', revivedAt: Date.now(), witherReason: null, grownAt: Date.now() }
      : t)),
    stats: { ...s.stats, withered: Math.max(0, (s.stats.withered || 0) - 1), grown: (s.stats.grown || 0) + 1 },
  }))
  change({ revived: target.id })
  return { ok: true, tree: target }
}

export function addCoins(n = 1) {
  FOREST.update((s) => ({ coins: s.coins + n }))
}

export function setForestSettings(patch = {}) {
  FOREST.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

export function clearForest({ keepWithered = false } = {}) {
  FOREST.update((s) => ({
    trees: keepWithered ? s.trees.filter((t) => t.status === 'withered') : [],
    alive: null,
  }))
  change({ cleared: true })
}

// ------------------------------------------------------------------
//  queries
// ------------------------------------------------------------------
export function forestState(now = new Date()) {
  const state = FOREST.read()
  const stats = forestStats(state.trees, now)
  return {
    ...state,
    stats,
    level: forestLevel(stats.total),
    alive: state.alive,
    aliveSpecies: state.alive ? speciesById(state.alive.speciesId) : null,
    strictness: strictnessById(state.settings.strictness),
  }
}

export function snapshot() {
  const alive = aliveTree()
  if (!alive) return null
  const elapsedMin = Math.max(0, (Date.now() - alive.plantedAt) / 60000)
  const stage = stageFor(alive.minutes, elapsedMin)
  return {
    ...alive,
    species: speciesById(alive.speciesId),
    stage,
    art: STAGE_ART[stage],
    elapsedMin,
  }
}

export { speciesById, strictnessById, evaluateEscape, forestStats, forestLevel, stageFor, STAGE_ART }

// ------------------------------------------------------------------
//  wiring: the focus timer is the tree timer.
//  (the focus store stays dependency-free and just emits richer events)
// ------------------------------------------------------------------
on(EVT.focusChanged, (detail = {}) => {
  if (detail.treeGrown) {
    growTree(detail.treeGrown, { minutes: detail.minutes })
  }
  if (detail.treeWithered) {
    witherTree(detail.treeWithered, detail.treeReason === 'cancelled' ? 'cancelled' : 'cancelled')
  }
})

/**
 * Called on app boot: a tree that was still growing when the tab closed
 * does not survive — that is the whole point of the mechanic.
 */
export function catchUpTree(now = new Date()) {
  const alive = aliveTree()
  if (!alive) return null
  const expired = now.getTime() >= alive.plantedAt + alive.minutes * 60000
  return witherTree(alive.id, expired ? 'away-too-long' : 'app-closed')
}
