# Study music (feature owner: you)

Music for starting and staying in a study session — **synthesised in the browser**,
so there are no audio files and nothing streams.

- `logic.js` — presets (Deep Focus, Memory Boost, Reading Rain, Lo-fi Study Beats,
  Exam Sprint, Peak Thinking, Calm Night, Pure Noise), binaural bands, scales and
  chord progressions, mixer headroom maths, `suggestPreset(subject)`, listening stats,
  and the honest science notes.
- `engine.js` — the Web Audio graph: noise buffers (white/pink/brown + rain/ocean/wind/
  café shaping), a true binaural pair (one tone per ear via ChannelMerger), and a
  generative scheduler that places pads, plucks and a soft lo-fi pulse ahead of the
  audio clock. Fades in/out, ducks under alarms, sleep timer, own-file playback.
- `store.js` — persisted settings, the listening log, autoplay with focus blocks and
  `applyLayers()` for live layer/band/instrument swaps.
- `MusicPanel.jsx` — the tab: stations, mixer, tuning, sleep timer, own audio, science
  cards, stats.

Shared with alarms through `chatbot/utils/audio.js` (one AudioContext for the app).
