// ============================================================
//  Study Music — offline, generative music that helps you start
//  and stay in a study session.
//
//  • 8 presets built from three layers (instruments · ambience ·
//    binaural beats) you can mix with sliders
//  • nothing streams: the Web Audio API synthesises it live
//  • autoplay with a focus block / tree, sleep timer, alarm ducking
//  • drop in your own audio files if you prefer
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MUSIC, applyLayers, currentPreset, currentState, musicStats, ownTrack,
  playOwnFile, playPreset, setMix, setMusicSettings, setSleep, sleepRemaining,
  stopMusic, stopOwnFile, toggleFavourite, toggleLayer, toggleMusic,
} from './store.js'
import {
  AMBIENT_TYPES, BEAT_BANDS, HEADPHONE_NOTE, MUSIC_STYLES, PRESETS, SCIENCE_NOTES,
  fadeFor, safeMix, suggestPreset,
} from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { subscribe as subscribeEngine } from './engine.js'
import { formatMinutes } from '../time-tracking/store.js'
import { FOCUS } from '../focus/store.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'
const chip = (active) => `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
  active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
}`

function Slider({ label, emoji, value, onChange, hint }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[12px] font-bold text-slate-600">
        <span>{emoji} {label}</span>
        <span className="tabular-nums text-slate-400">{Math.round(value * 100)}%</span>
      </span>
      <input type="range" min="0" max="1" step="0.05" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600" />
      {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

function WaveRow({ playing, now }) {
  const bars = useMemo(() => Array.from({ length: 22 }, () => 0.25 + Math.random() * 0.75), [playing])
  return (
    <div className="flex h-8 items-end gap-[3px]">
      {bars.map((h, i) => (
        <span key={i}
          className="w-[3px] rounded-t bg-gradient-to-t from-indigo-500 to-fuchsia-400"
          style={{
            height: playing ? `${Math.round(h * 100)}%` : '12%',
            animation: playing ? `bounce 1.${(i % 9) + 1}s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
            opacity: playing ? 1 : 0.35,
          }} />
      ))}
      {void now}
    </div>
  )
}

export default function MusicPanel({ lang: langProp = null }) {
  const state = useStore(MUSIC)
  const lang = langProp || loadState().profile?.lang || 'en'
  const [engineState, setEngineState] = useState(() => currentState())
  const [tick, setTick] = useState(0)
  const [openNote, setOpenNote] = useState(null)
  const [fileError, setFileError] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const off = subscribeEngine(setEngineState)
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => { off(); clearInterval(iv) }
  }, [])

  const preset = currentPreset()
  const stats = musicStats()
  const playing = engineState.playing
  const mix = engineState.mix || state.mix
  const sleepMs = sleepRemaining()
  const focusActive = FOCUS.read().active
  const suggestion = suggestPreset(focusActive?.subject || '')
  void tick
  const avatar = featureAvatar('music')

  return (
    <div className="mx-auto max-w-4xl">
      {/* ---------- now playing ---------- */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && (
            <div className={`relative ${playing ? 'animate-pulse' : ''}`}>
              <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-violet-100" />
              {playing && <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white">▶</span>}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">🎵 {tr(lang, 'music.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'music.sub')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-bold">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-700">
                {preset.emoji} {preset.name[lang] || preset.name.en}
              </span>
              {playing && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700">
                  {engineState.layers.music && '🎹'}
                  {engineState.layers.ambient && '📻'}
                  {engineState.layers.binaural && '🧠'}
                  {' '}{tr(lang, 'music.playing')}
                </span>
              )}
              {sleepMs > 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                  🌙 {Math.ceil(sleepMs / 60000)} {tr(lang, 'plan.min')}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => toggleMusic({ presetId: preset.id })}
                className={`${btn} px-5 py-2.5 ${playing ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {playing ? `⏹ ${tr(lang, 'music.stop')}` : `▶ ${tr(lang, 'music.play')}`}
              </button>
              <button onClick={() => openFeature('focus')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                ⏳ {tr(lang, 'focus.title')}
              </button>
            </div>
            <WaveRow playing={playing} now={tick} />
          </div>
        </div>

        <p className="mt-2 text-[11.5px] text-slate-400">🎧 {HEADPHONE_NOTE[lang] || HEADPHONE_NOTE.en}</p>
      </div>

      {/* ---------- presets ---------- */}
      <div className={`${card} mb-4`}>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-[13.5px] font-extrabold text-slate-800">🎚️ {tr(lang, 'music.presets')}</h3>
          <span className="text-[11.5px] text-slate-400">{tr(lang, 'music.presetsHint')}</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => {
            const active = preset.id === p.id
            const fav = state.favourites.includes(p.id)
            return (
              <div key={p.id}
                className={`relative rounded-2xl border-2 p-3 transition ${active ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
                <button onClick={() => toggleFavourite(p.id)}
                  className="absolute right-2 top-2 text-[14px] opacity-70 hover:opacity-100"
                  title={tr(lang, 'music.favourite')}>{fav ? '❤️' : '🤍'}</button>
                <div className="text-2xl">{p.emoji}</div>
                <div className="mt-1 text-[13px] font-extrabold text-slate-800">{p.name[lang] || p.name.en}</div>
                <p className="mt-0.5 min-h-[48px] text-[11.5px] leading-snug text-slate-500">{p.desc[lang] || p.desc.en}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(p.bestFor || []).slice(0, 3).map((b) => (
                    <span key={b} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{b}</span>
                  ))}
                </div>
                <button
                  onClick={() => playPreset(p.id)}
                  className={`mt-2 w-full rounded-full py-1.5 text-[12px] font-bold transition ${
                    active && playing ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'
                  }`}>
                  {active && playing ? `▶ ${tr(lang, 'music.playing')}` : `▶ ${tr(lang, 'music.play')}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------- mixer + layers ---------- */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🎛️ {tr(lang, 'music.mixer')}</h3>
          <div className="space-y-3">
            <Slider label={tr(lang, 'music.master')} emoji="🔊" value={mix.master}
              onChange={(v) => setMix({ master: v })} />
            <Slider label={tr(lang, 'music.layerMusic')} emoji="🎹" value={mix.music}
              hint={preset.music ? (MUSIC_STYLES.find((m) => m.id === preset.music.style)?.label[lang] || '') : tr(lang, 'music.none')}
              onChange={(v) => setMix({ music: v })} />
            <Slider label={tr(lang, 'music.layerAmbient')} emoji="📻" value={mix.ambient}
              hint={preset.ambient ? (AMBIENT_TYPES.find((a) => a.id === preset.ambient.type)?.label[lang] || '') : tr(lang, 'music.none')}
              onChange={(v) => setMix({ ambient: v })} />
            <Slider label={tr(lang, 'music.layerBinaural')} emoji="🧠" value={mix.binaural}
              hint={preset.binaural ? (BEAT_BANDS[preset.binaural.band]?.label[lang] || '') : tr(lang, 'music.none')}
              onChange={(v) => setMix({ binaural: v })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['music', 'ambient', 'binaural'].map((k) => (
              <button key={k} onClick={() => toggleLayer(k)} className={chip(!!engineState.layers[k])}>
                {engineState.layers[k] ? '⏸' : '▶'} {tr(lang, `music.layer${k[0].toUpperCase()}${k.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🎧 {tr(lang, 'music.customise')}</h3>

          <div className="mb-2">
            <span className="mb-1 block text-[12px] font-bold text-slate-600">📻 {tr(lang, 'music.ambientType')}</span>
            <div className="flex flex-wrap gap-1.5">
              {AMBIENT_TYPES.map((a) => (
                <button key={a.id}
                  onClick={() => applyLayers({ ambient: { type: a.id, level: preset.ambient?.level ?? 0.5 } })}
                  className={chip(preset.ambient?.type === a.id)}>
                  {a.emoji} {a.label[lang] || a.label.en}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <span className="mb-1 block text-[12px] font-bold text-slate-600">🧠 {tr(lang, 'music.binauralBand')}</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(BEAT_BANDS).map(([id, b]) => (
                <button key={id}
                  onClick={() => applyLayers({ binaural: { band: id, carrier: preset.binaural?.carrier ?? 200, level: preset.binaural?.level ?? 0.5 } })}
                  className={chip(preset.binaural?.band === id)}>
                  {b.hz} Hz
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <span className="mb-1 block text-[12px] font-bold text-slate-600">🎼 {tr(lang, 'music.instrument')}</span>
            <div className="flex flex-wrap gap-1.5">
              {MUSIC_STYLES.map((m) => (
                <button key={m.id}
                  onClick={() => applyLayers({ music: { ...(preset.music || {}), style: m.id, progression: preset.music?.progression || 'lofi', root: preset.music?.root || 261.63, scale: preset.music?.scale || 'pentatonicMinor', density: preset.music?.density ?? 0.35, tempo: preset.music?.tempo ?? 68 } })}
                  className={chip(preset.music?.style === m.id)}>
                  {m.emoji} {m.label[lang] || m.label.en}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <span className="mb-1 block text-[12px] font-bold text-slate-600">🌙 {tr(lang, 'music.sleepTimer')}</span>
            <div className="flex flex-wrap gap-1.5">
              {[0, 15, 30, 45, 60, 90].map((m) => (
                <button key={m} onClick={() => setSleep(m)} className={chip((state.sleepMinutes === m) && (m > 0 || !sleepMs))}>
                  {m === 0 ? tr(lang, 'music.off') : `${m} ${tr(lang, 'plan.min')}`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {[
              { key: 'autoplayWithFocus', label: tr(lang, 'music.autoplay') },
              { key: 'autoStopWithFocus', label: tr(lang, 'music.autostop') },
              { key: 'duckOnAlarm', label: tr(lang, 'music.duck') },
              { key: 'forSubject', label: tr(lang, 'music.matchSubject') },
            ].map((row) => (
              <label key={row.key} className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
                <input type="checkbox" className="h-4 w-4 accent-indigo-600"
                  checked={state.settings[row.key]}
                  onChange={(e) => setMusicSettings({ [row.key]: e.target.checked })} />
                {row.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- your own audio ---------- */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📁 {tr(lang, 'music.ownAudio')}</h3>
        <p className="mb-2 text-[12px] text-slate-500">{tr(lang, 'music.ownAudioHint')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              if (file.size > 40 * 1024 * 1024) { setFileError(tr(lang, 'music.fileTooBig')); return }
              setFileError(null)
              playOwnFile(file)
            }} />
          <button onClick={() => fileRef.current?.click()} className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
            ➕ {tr(lang, 'music.chooseFile')}
          </button>
          {ownTrack() && (
            <>
              <span className="text-[12.5px] font-bold text-slate-600">🎵 {ownTrack().name}</span>
              <button onClick={() => stopOwnFile()} className={`${btn} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
                ⏹ {tr(lang, 'music.stop')}
              </button>
            </>
          )}
        </div>
        {fileError && <p className="mt-2 text-[12px] font-bold text-rose-600">{fileError}</p>}
      </div>

      {/* ---------- why it works ---------- */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🔬 {tr(lang, 'music.science')}</h3>
        <div className="space-y-2">
          {Object.entries(SCIENCE_NOTES).map(([id, note]) => {
            const open = openNote === id
            return (
              <div key={id} className="rounded-xl border border-slate-200">
                <button onClick={() => setOpenNote(open ? null : id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left">
                  <span>{note.emoji}</span>
                  <span className="flex-1 text-[12.5px] font-extrabold text-slate-700">{note.title[lang] || note.title.en}</span>
                  <span className="text-[11px] text-slate-400">{open ? '▾' : '▸'}</span>
                </button>
                {open && (
                  <p className="border-t border-slate-100 px-3 py-2 text-[12.5px] leading-relaxed text-slate-600">
                    {note.body[lang] || note.body.en}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] italic text-slate-400">{tr(lang, 'music.disclaimer')}</p>
      </div>

      {/* ---------- stats ---------- */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: tr(lang, 'music.today'), value: formatMinutes(stats.todayMinutes) },
          { label: tr(lang, 'time.week'), value: formatMinutes(stats.weekMinutes) },
          { label: tr(lang, 'music.total'), value: formatMinutes(stats.totalMinutes) },
          { label: tr(lang, 'music.duringFocus'), value: formatMinutes(stats.duringFocus) },
        ].map((s) => (
          <div key={s.label} className={card}>
            <div className="text-[11.5px] font-bold text-slate-400">{s.label}</div>
            <div className="text-[18px] font-black text-slate-800">{s.value}</div>
          </div>
        ))}
      </div>

      <div className={`${card} mb-6 flex flex-wrap items-center gap-3`}>
        <span className="text-[12.5px] text-slate-600">
          💡 {tr(lang, 'music.tipSubject', { preset: (PRESETS.find((p) => p.id === suggestion)?.name?.[lang]) || '' })}
        </span>
        <button onClick={() => playPreset(suggestion)}
          className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
          ▶ {tr(lang, 'music.playSuggested')}
        </button>
        <button onClick={() => stopMusic({ notifyUser: true })} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          ⏹ {tr(lang, 'music.stop')}
        </button>
      </div>
      <p className="mb-6 text-center text-[11px] text-slate-300">
        {fadeFor('start', preset)}s fade · {safeMix(mix).headroom.toFixed(2)} headroom
      </p>
    </div>
  )
}
