// ============================================================
//  Tiny persistence + subscription layer used by every Bodhya
//  feature store (alarms, todos, study plan, focus, notifications,
//  time tracking). Works in the browser (localStorage) and in
//  Node (tests) — it degrades to an in-memory cache when there is
//  no localStorage, and it never throws.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { emit } from './events.js'

const memory = new Map()   // fallback cache (Node / private mode)

export function loadJSON(key, fallback = null) {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    }
  } catch { /* blocked / corrupted */ }
  if (memory.has(key)) return JSON.parse(memory.get(key))
  return fallback
}

export function saveJSON(key, value) {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, raw)
  } catch { /* quota / blocked — memory copy is enough */ }
  return value
}

export function removeKey(key) {
  memory.delete(key)
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key) } catch { /* ignore */ }
}

export function clone(v) {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v))
}

/**
 * Create a persisted, subscribable store.
 *   const store = makeStore('key', { items: [] })
 *   store.read()                      → state
 *   store.update({ items: [...] })    → merge patch
 *   store.update(s => ({ ...s, x }))  → functional patch
 *   store.subscribe(fn)               → unsubscribe
 *   store.reset()                     → back to defaults
 */
export function makeStore(key, defaults, { changeEvent = null } = {}) {
  let cache = null
  const listeners = new Set()

  function read() {
    if (cache) return cache
    const saved = loadJSON(key, null)
    cache = saved && typeof saved === 'object'
      ? { ...clone(defaults), ...saved, ...(defaults.settings && saved.settings ? { settings: { ...clone(defaults.settings), ...saved.settings } } : {}) }
      : clone(defaults)
    return cache
  }

  function write(next) {
    cache = next
    saveJSON(key, next)
    listeners.forEach((fn) => { try { fn(next) } catch { /* listener error */ } })
    if (changeEvent) emit(changeEvent, { key })
    return next
  }

  function update(patchOrFn) {
    const cur = read()
    const patch = typeof patchOrFn === 'function' ? patchOrFn(clone(cur)) : patchOrFn
    return write({ ...cur, ...(patch || {}) })
  }

  function subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  function reset() {
    removeKey(key)
    cache = null
    return write(clone(defaults))
  }

  return { key, read, write, update, subscribe, reset }
}

/** React hook: re-render a component whenever the store changes. */
export function useStore(store, selector = (s) => s) {
  const selRef = useRef(selector)
  selRef.current = selector
  const [snap, setSnap] = useState(() => selRef.current(store.read()))
  useEffect(() => {
    setSnap(selRef.current(store.read()))
    return store.subscribe((s) => setSnap(selRef.current(s)))
  }, [store])
  return snap
}

/** Stable unique id (no crypto dependency so it also works in tests). */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
