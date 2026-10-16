// ============================================================
//  Study-music logic — pure data + maths (no browser APIs, so it
//  is unit-testable in plain Node).
//
//  The music itself is *generated* by engine.js with the Web Audio
//  API: no mp3s, no streaming, no API keys, works offline. This file
//  owns the presets, the musical material (scales/chords) and the
//  honest "why this helps" notes.
// ============================================================

// ----------------------------------------------------------------
//  Binaural-beat bands. A binaural beat is the *difference* between
//  the two tones you hear; it only exists with headphones (one tone
//  per ear). Evidence is mixed — treat these as focus aids, not meds.
// ----------------------------------------------------------------
export const BEAT_BANDS = {
  delta: { hz: 2.5, label: { en: 'Delta (deep sleep)', hi: 'डेल्टा (गहरी नींद)', te: 'డెల్టా (గాఢ నిద్ర)' } },
  theta: { hz: 6, label: { en: 'Theta (memory & recall)', hi: 'थीटा (याद व स्मरण)', te: 'థీటా (జ్ఞాపకం)' } },
  alpha: { hz: 10, label: { en: 'Alpha (calm focus)', hi: 'अल्फा (शांत फोकस)', te: 'ఆల్ఫా (ప్రశాంత ఫోకస్)' } },
  smr: { hz: 13.5, label: { en: 'SMR (steady attention)', hi: 'SMR (स्थिर ध्यान)', te: 'SMR (స్థిర ఏకాగ్రత)' } },
  beta: { hz: 16, label: { en: 'Beta (alert, active)', hi: 'बीटा (सतर्क)', te: 'బీటా (అప్రమత్తం)' } },
  gamma: { hz: 40, label: { en: 'Gamma (peak thinking)', hi: 'गामा (तेज़ सोच)', te: 'గామా (తీవ్ర ఆలోచన)' } },
}

// ----------------------------------------------------------------
//  Musical material for the generative engine.
//  All note numbers are semitone offsets from the root; the engine
//  turns them into frequencies (A4 = 440 Hz).
// ----------------------------------------------------------------
export const SCALES = {
  pentatonicMinor: [0, 3, 5, 7, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  major: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
}

// chord = [rootOffset, third, fifth, seventh?] (semitone offsets)
export const PROGRESSIONS = {
  // calm lo-fi / study hip-hop
  lofi: [
    [-5, -1, 2, 5],    // Fmaj7
    [0, 3, 7, 10],     // Am7-ish
    [-3, 0, 4, 7],     // Dm7-ish
    [-5, -2, 2, 4],    // G-ish
  ],
  // bright, hopeful (morning study)
  bright: [
    [0, 4, 7, 11],     // Cmaj7
    [-3, 0, 4, 7],     // Am7
    [-5, -1, 2, 5],    // Fmaj7
    [-7, -3, 0, 4],    // G
  ],
  // deep, slow, cinematic (long sessions)
  deep: [
    [0, 3, 7, 10],     // Am7
    [-2, 2, 5, 9],     // Gmaj-ish
    [-4, 0, 3, 7],     // Em
    [-5, -1, 2, 5],    // Fmaj7
  ],
  // minimal drone (no movement, best for reading)
  drone: [
    [0, 7, 12],
    [0, 7, 12],
    [0, 7, 12],
    [0, 7, 12],
  ],
}

/**
 * Preset = one "station". A preset independently sets:
 *   music    — the generative instrument layer
 *   ambient  — the noise/atmosphere layer
 *   binaural — optional binaural beat layer (headphones)
 * so the mixer sliders always make sense.
 */
export const PRESETS = [
  {
    id: 'deep-focus', emoji: '🎯',
    name: { en: 'Deep Focus', hi: 'गहरा फोकस', te: 'డీప్ ఫోకస్' },
    desc: { en: 'Warm pads + alpha waves. For problem sets and writing.', hi: 'गर्म पैड + अल्फा तरंगें। सवाल हल करने और लिखने के लिए।', te: 'వెచ్చని ప్యాడ్‌లు + ఆల్ఫా తరంగాలు. సమస్యలు, రాయడానికి.' },
    music: { style: 'pad', progression: 'lofi', root: 261.63, scale: 'pentatonicMinor', density: 0.35, tempo: 68 },
    ambient: { type: 'brown', level: 0.5 },
    binaural: { band: 'alpha', carrier: 200, level: 0.5 },
    bestFor: ['maths', 'physics', 'coding', 'writing'],
    science: 'focus',
  },
  {
    id: 'memory-boost', emoji: '🧠',
    name: { en: 'Memory Boost', hi: 'याददाश्त बूस्ट', te: 'మెమరీ బూస్ట్' },
    desc: { en: 'Slow theta waves + soft drone. Use while revising facts and definitions.', hi: 'धीमी थीटा तरंगें + कोमल ड्रोन। तथ्य और परिभाषाएँ दोहराते समय।', te: 'నెమ్మది థీటా తరంగాలు + సాఫ్ట్ డ్రోన్. ఫ్యాక్ట్స్ రివిజన్‌కు.' },
    music: { style: 'drone', progression: 'drone', root: 220, scale: 'pentatonicMinor', density: 0.22, tempo: 56 },
    ambient: { type: 'pink', level: 0.4 },
    binaural: { band: 'theta', carrier: 180, level: 0.6 },
    bestFor: ['revision', 'languages', 'biology'],
    science: 'memory',
  },
  {
    id: 'reading-rain', emoji: '🌧️',
    name: { en: 'Reading Rain', hi: 'पढ़ाई की बारिश', te: 'చదువు వర్షం' },
    desc: { en: 'Rain on a window with a quiet piano. No beat, no distraction.', hi: 'खिड़की पर बारिश और धीमा पियानो। कोई बीट नहीं, कोई ध्यान भंग नहीं।', te: 'కిటికీ మీద వర్షం, నెమ్మది పియానో. బీట్ లేదు.' },
    music: { style: 'piano', progression: 'bright', root: 261.63, scale: 'pentatonicMajor', density: 0.3, tempo: 60 },
    ambient: { type: 'rain', level: 0.7 },
    binaural: null,
    bestFor: ['reading', 'history', 'novels'],
    science: 'noise',
  },
  {
    id: 'lofi-study', emoji: '🎧',
    name: { en: 'Lo-fi Study Beats', hi: 'लो-फ़ाई स्टडी बीट्स', te: 'లో-ఫై స్టడీ బీట్స్' },
    desc: { en: 'Slow lo-fi groove you can study *with* — keeps you company, not loud.', hi: 'धीमी लो-फ़ाई लय — साथ देती है, पर शोर नहीं करती।', te: 'నెమ్మది లో-ఫై గ్రూవ్ — తోడుగా ఉంటుంది, గట్టిగా ఉండదు.' },
    music: { style: 'lofi', progression: 'lofi', root: 261.63, scale: 'dorian', density: 0.45, tempo: 74 },
    ambient: { type: 'brown', level: 0.28 },
    binaural: null,
    bestFor: ['homework', 'notes', 'long sessions'],
    science: 'mood',
  },
  {
    id: 'exam-sprint', emoji: '🚀',
    name: { en: 'Exam Sprint', hi: 'परीक्षा स्प्रिंट', te: 'పరీక్ష స్ప్రింట్' },
    desc: { en: 'Faster pulse + beta waves for the last stretch before a test.', hi: 'तेज़ लय + बीटा तरंगें — परीक्षा से पहले आख़िरी दौर के लिए।', te: 'వేగవంతమైన లయ + బీటా తరంగాలు — పరీక్ష ముందు చివరి దౌర్‌కు.' },
    music: { style: 'piano', progression: 'bright', root: 293.66, scale: 'major', density: 0.5, tempo: 92 },
    ambient: { type: 'cafe', level: 0.35 },
    binaural: { band: 'beta', carrier: 240, level: 0.5 },
    bestFor: ['mock tests', 'quick revision'],
    science: 'arousal',
  },
  {
    id: 'peak-thinking', emoji: '⚡',
    name: { en: 'Peak Thinking', hi: 'पीक थिंकिंग', te: 'పీక్ థింకింగ్' },
    desc: { en: '40 Hz gamma tones for hard puzzles. Try 15 minutes at a time.', hi: 'मुश्किल पहेलियों के लिए 40 Hz गामा। 15-15 मिनट करके आज़माएँ।', te: 'కష్టమైన పజిల్స్ కి 40 Hz గామా. 15 నిమిషాల చొప్పున ప్రయత్నించండి.' },
    music: { style: 'pad', progression: 'deep', root: 246.94, scale: 'lydian', density: 0.3, tempo: 64 },
    ambient: { type: 'pink', level: 0.3 },
    binaural: { band: 'gamma', carrier: 260, level: 0.35 },
    bestFor: ['puzzles', 'mock tests'],
    science: 'gamma',
  },
  {
    id: 'calm-night', emoji: '🌙',
    name: { en: 'Calm Night', hi: 'शांत रात', te: 'ప్రశాంత రాత్రి' },
    desc: { en: 'Soft wind, low drone and slow breathing pace. Good for late, tired study.', hi: 'हल्की हवा, गहरा ड्रोन और धीमी साँसों की लय। थकी हुई देर रात की पढ़ाई के लिए।', te: 'మెల్లని గాలి, లోతైన డ్రోన్. అలసట రాత్రి చదువుకు.' },
    music: { style: 'drone', progression: 'deep', root: 196, scale: 'pentatonicMinor', density: 0.18, tempo: 50 },
    ambient: { type: 'wind', level: 0.6 },
    binaural: { band: 'theta', carrier: 150, level: 0.45 },
    bestFor: ['night study', 'wind-down'],
    science: 'relax',
  },
  {
    id: 'white-noise', emoji: '📻',
    name: { en: 'Pure Noise', hi: 'शुद्ध नॉइज़', te: 'ప్యూర్ నాయిస్' },
    desc: { en: 'Brown/white noise only — masks a noisy house, no music at all.', hi: 'सिर्फ़ ब्राउन/व्हाइट नॉइज़ — शोरगुल दबाने के लिए, संगीत नहीं।', te: 'బ్రౌన్/వైట్ నాయిస్ మాత్రమే — శబ్దం మరుగుకు.' },
    music: null,
    ambient: { type: 'brown', level: 0.85 },
    binaural: null,
    bestFor: ['noisy places', 'hostel'],
    science: 'noise',
  },
]

export const AMBIENT_TYPES = [
  { id: 'brown', emoji: '🟤', label: { en: 'Brown noise', hi: 'ब्राउन नॉइज़', te: 'బ్రౌన్ నాయిస్' } },
  { id: 'pink', emoji: '🌸', label: { en: 'Pink noise', hi: 'पिंक नॉइज़', te: 'పింక్ నాయిస్' } },
  { id: 'white', emoji: '⚪', label: { en: 'White noise', hi: 'व्हाइट नॉइज़', te: 'వైట్ నాయిస్' } },
  { id: 'rain', emoji: '🌧️', label: { en: 'Rain', hi: 'बारिश', te: 'వర్షం' } },
  { id: 'ocean', emoji: '🌊', label: { en: 'Ocean', hi: 'समुद्र', te: 'సముద్రం' } },
  { id: 'wind', emoji: '🍃', label: { en: 'Wind', hi: 'हवा', te: 'గాలి' } },
  { id: 'cafe', emoji: '☕', label: { en: 'Café hum', hi: 'कैफ़े की गूँज', te: 'కేఫే హమ్' } },
]

export const MUSIC_STYLES = [
  { id: 'pad', emoji: '🎹', label: { en: 'Warm pads', hi: 'गर्म पैड', te: 'వెచ్చని ప్యాడ్‌లు' } },
  { id: 'piano', emoji: '🎼', label: { en: 'Soft piano', hi: 'धीमा पियानो', te: 'సాఫ్ట్ పియానో' } },
  { id: 'lofi', emoji: '🎧', label: { en: 'Lo-fi groove', hi: 'लो-फ़ाई लय', te: 'లో-ఫై గ్రూవ్' } },
  { id: 'drone', emoji: '🕉️', label: { en: 'Drone', hi: 'ड्रोन', te: 'డ్రోన్' } },
  { id: 'none', emoji: '🔇', label: { en: 'No instruments', hi: 'कोई वाद्य नहीं', te: 'వాద్యాలు వద్దు' } },
]

// ----------------------------------------------------------------
//  Honest, non-hyped explanations of why each layer is used.
//  (Evidence varies — the wording is deliberately careful.)
// ----------------------------------------------------------------
export const SCIENCE_NOTES = {
  focus: {
    emoji: '🎯',
    title: { en: 'Alpha waves (8–12 Hz)', hi: 'अल्फा तरंगें (8–12 Hz)', te: 'ఆల్ఫా తరంగాలు (8–12 Hz)' },
    body: {
      en: 'Alpha activity is linked to relaxed-but-awake attention. Binaural alpha is popular for focused work; studies show small, mixed effects — best treated as a concentration ritual, with headphones.',
      hi: 'अल्फा गतिविधि को शांत-पर-जागरूक ध्यान से जोड़ा जाता है। बाइनॉरल अल्फा फोकस के लिए लोकप्रिय है; शोध के नतीजे छोटे और मिले-जुले हैं — इसे एकाग्रता की आदत मानिए, हेडफ़ोन के साथ।',
      te: 'ఆల్ఫా కార్యకలాపం ప్రశాంత-అప్రమత్త ఏకాగ్రతతో ముడిపడి ఉంది. బైనారల్ ఆల్ఫా ఫోకస్‌కు ప్రసిద్ధం; పరిశోధనలు చిన్న, మిశ్రమ ఫలితాలు ఇస్తాయి — హెడ్‌ఫోన్‌తో ఒక అలవాటుగా వాడండి.',
    },
  },
  memory: {
    emoji: '🧠',
    title: { en: 'Theta & why sleep matters', hi: 'थीटा और नींद क्यों ज़रूरी है', te: 'థీటా మరియు నిద్ర ప్రాముఖ్యత' },
    body: {
      en: 'Theta (4–8 Hz) is prominent while the brain files memories. Sound cannot replace sleep — but a slow, low-stimulation soundscape while you revise keeps you relaxed so rehearsal is easier.',
      hi: 'थीटा (4–8 Hz) तब सक्रिय रहती है जब दिमाग यादें जमा करता है। आवाज़ नींद की जगह नहीं ले सकती — पर दोहराते समय धीमी, कम-उत्तेजक ध्वनि आपको शांत रखती है।',
      te: 'మెదడు జ్ఞాపకాలను నిల్వ చేసేటప్పుడు థీటా (4–8 Hz) ప్రముఖంగా ఉంటుంది. శబ్దం నిద్రను భర్తీ చేయదు — కానీ రివిజన్‌లో నెమ్మది శబ్దం మిమ్మల్ని ప్రశాంతంగా ఉంచుతుంది.',
    },
  },
  noise: {
    emoji: '📻',
    title: { en: 'Noise masks distraction', hi: 'नॉइज़ ध्यान भंग रोकता है', te: 'నాయిస్ డిస్ట్రాక్షన్ ఆపుతుంది' },
    body: {
      en: 'Steady noise (brown/pink) covers sudden sounds — a door, a phone, chatter — which are what actually break concentration. This is one of the better-supported uses of sound for studying.',
      hi: 'लगातार नॉइज़ (ब्राउन/पिंक) अचानक आवाज़ों को ढक देता है — दरवाज़ा, फ़ोन, बातचीत — यही असल में ध्यान तोड़ती हैं। पढ़ाई में ध्वनि का सबसे भरोसेमंद इस्तेमाल यही है।',
      te: 'నిరంతర నాయిస్ (బ్రౌన్/పింక్) అకస్మాత్తు శబ్దాలను కవర్ చేస్తుంది — తలుపు, ఫోన్, మాటలు — ఇవే ఏకాగ్రతను దెబ్బతీస్తాయి. చదువుకు శబ్దం వాడేందుకు ఇది బాగా ఆధారిత మార్గం.',
    },
  },
  mood: {
    emoji: '🎧',
    title: { en: 'Music you like helps more', hi: 'पसंदीदा संगीत ज़्यादा मदद करता है', te: 'ఇష్టమైన సంగీతం ఎక్కువ సహాయం' },
    body: {
      en: 'Familiar, mid-energy instrumental music lifts mood and reduces the urge to switch tasks. Lyrics are the problem: they compete with reading and writing in your head.',
      hi: 'जाना-पहचाना, मध्यम-ऊर्जा वाला वाद्य संगीत मूड बेहतर करता है और ध्यान भटकने की चाह घटाता है। दिक्कत गीत के बोल हैं: वे पढ़ने-लिखने से दिमाग़ में मुकाबला करते हैं।',
      te: 'తెలిసిన, మధ్యస్థ శక్తి వాద్య సంగీతం మూడ్ పెంచుతుంది, టాస్క్ మార్చాలనే కోరిక తగ్గిస్తుంది. సాహిత్యం (లిరిక్స్) మాత్రం సమస్య: అవి చదవడంతో పోటీపడతాయి.',
    },
  },
  arousal: {
    emoji: '🚀',
    title: { en: 'Arousal, not magic', hi: 'जागरूकता, जादू नहीं', te: 'అప్రమత్తత, మాయ కాదు' },
    body: {
      en: 'Faster tempo raises alertness — useful in the last hour before a test, tiring over long sessions. Switch back to slow presets when you start re-reading the same line.',
      hi: 'तेज़ लय सतर्कता बढ़ाती है — परीक्षा से पहले के आख़िरी घंटे में अच्छी, लंबे सत्रों में थका देती है। एक ही लाइन बार-बार पढ़ने लगें तो धीमे प्रीसेट पर लौटें।',
      te: 'వేగమైన లయ అప్రమత్తత పెంచుతుంది — పరీక్ష ముందు చివరి గంటకు మంచిది, పొడవైన సెషన్లలో అలసట కలిగిస్తుంది. ఒకే లైన్ మళ్లీ మళ్లీ చదివితే నెమ్మది ప్రీసెట్‌కు మారండి.',
    },
  },
  gamma: {
    emoji: '⚡',
    title: { en: '40 Hz gamma — experimental', hi: '40 Hz गामा — प्रयोगात्मक', te: '40 Hz గామా — ప్రయోగాత్మకం' },
    body: {
      en: 'Gamma rhythms are associated with binding information together; 40 Hz stimulation is an active research area with early, promising but not settled results. Keep sessions short and take breaks.',
      hi: 'गामा लय जानकारी को जोड़कर समझने से जुड़ी है; 40 Hz पर शोध चल रहा है — शुरुआती नतीजे उम्मीद भरे हैं, पर तय नहीं। सत्र छोटे रखें, ब्रेक लें।',
      te: 'గామా లయలు సమాచారాన్ని కలపడంతో ముడిపడి ఉన్నాయి; 40 Hz పరిశోధన ఇంకా కొనసాగుతోంది — ప్రారంభ ఫలితాలు ఆశాజనకం కానీ నిర్ధారితం కావు. సెషన్లు చిన్నగా ఉంచండి.',
    },
  },
  relax: {
    emoji: '🌙',
    title: { en: 'Wind-down', hi: 'आराम की ओर', te: 'విశ్రాంతి' },
    body: {
      en: 'Slow sound and lower light tell the brain the day is ending, which protects the sleep that consolidates what you learned. Study at night with the quietest preset.',
      hi: 'धीमी आवाज़ और कम रोशनी दिमाग़ को बताती हैं कि दिन ख़त्म हो रहा है — और नींद बचाती हैं, जो सीखा हुआ पक्का करती है। रात की पढ़ाई सबसे शांत प्रीसेट से करें।',
      te: 'నెమ్మది శబ్దం, తక్కువ వెలుతురు రోజు ముగిసిందని మెదడుకు చెబుతాయి — నేర్చుకున్నది స్థిరపరిచే నిద్రను కాపాడుతాయి. రాత్రి చదువుకు అత్యంత నిశ్శబ్ద ప్రీసెట్ వాడండి.',
    },
  },
}

export const HEADPHONE_NOTE = {
  en: 'Binaural presets need headphones (right ear hears a slightly higher tone — the beat exists only inside your head).',
  hi: 'बाइनॉरल प्रीसेट के लिए हेडफ़ोन ज़रूरी है (दाएँ कान को थोड़ा ऊँचा स्वर मिलता है — बीट सिर्फ़ आपके दिमाग़ में बनती है)।',
  te: 'బైనారల్ ప్రీసెట్‌లకు హెడ్‌ఫోన్ కావాలి (కుడి చెవికి కొంచెం ఎక్కువ స్వరం — బీట్ మీ తలలోనే ఏర్పడుతుంది).',
}

// ----------------------------------------------------------------
//  Small pure helpers used by the engine and by tests
// ----------------------------------------------------------------

/** Semitone offset from a root frequency → Hz. */
export function noteHz(root, semitones) {
  return root * Math.pow(2, semitones / 12)
}

/** Binaural pair frequencies (left = carrier, right = carrier + beat). */
export function binauralPair(band, carrier = 200) {
  const beat = BEAT_BANDS[band]?.hz ?? 10
  return { left: carrier, right: carrier + beat, beat }
}

/**
 * Pick the next note for the melody layer.
 * @param {number[]} scale  semitone offsets
 * @param {number} step     which scale degree to take
 * @param {number} octave   transpose in octaves
 */
export function scaleNote(scale, step, octave = 0) {
  const s = scale.length ? scale : [0]
  const idx = ((step % s.length) + s.length) % s.length
  return s[idx] + octave * 12
}

/** Deterministic-ish density gate so a "quiet" preset really is quiet. */
export function shouldPlay(density, rnd = Math.random) {
  return rnd() < Math.max(0, Math.min(1, density))
}

/** Fade durations (seconds) for start/stop, scaled by how much is playing. */
export function fadeFor(action = 'stop', layers = {}) {
  const active = [layers.music, layers.ambient, layers.binaural].filter(Boolean).length
  const base = action === 'start' ? 2.5 : 1.6
  return Math.min(6, base + active * 0.7)
}

/** Volume presets so the mixer never clips (sum of buses ≤ 1). */
export function safeMix(mix = {}) {
  const m = Math.max(0, Math.min(1, mix.master ?? 0.8))
  const music = Math.max(0, Math.min(1, mix.music ?? 0.6))
  const ambient = Math.max(0, Math.min(1, mix.ambient ?? 0.5))
  const binaural = Math.max(0, Math.min(1, mix.binaural ?? 0.5))
  const sum = music * 0.5 + ambient * 0.4 + binaural * 0.12
  return { master: m, music, ambient, binaural, headroom: sum > 1 ? 1 / sum : 1 }
}

/** Total listening minutes from the log. */
export function listeningStats(log = [], now = Date.now()) {
  const day = (ts) => new Date(ts).toDateString()
  const today = log.filter((l) => day(l.at) === day(now))
  const week = log.filter((l) => now - l.at < 7 * 86400000)
  const sum = (list) => list.reduce((a, l) => a + (l.minutes || 0), 0)
  const byPreset = {}
  log.forEach((l) => { byPreset[l.preset] = (byPreset[l.preset] || 0) + (l.minutes || 0) })
  const favourite = Object.entries(byPreset).sort((a, b) => b[1] - a[1])[0]
  return {
    todayMinutes: sum(today),
    weekMinutes: sum(week),
    totalMinutes: sum(log),
    sessions: log.length,
    duringFocus: sum(log.filter((l) => l.duringFocus)),
    byPreset,
    favourite: favourite ? favourite[0] : null,
  }
}

/** Preset suggestion from a subject the student is working on. */
export function suggestPreset(subject = '') {
  const s = String(subject).toLowerCase()
  const table = [
    [/math|गणित|గణిత|physics|भौतिक|ఫిజిక్స|chem|रसायन|కెమిస్ట్రీ|coding|program|code/, 'deep-focus'],
    [/revis|रिवीज़न|రివిజన|memory|याद|జ్ఞాపక|flash ?card|definition/, 'memory-boost'],
    [/read|पढ़|చదువ|novel|history|इतिहास|చరిత్ర|story/, 'reading-rain'],
    [/homework|असाइनमेंट|హోంవర్క|notes|नोट्स|నోట్స/, 'lofi-study'],
    [/test|exam|परीक्षा|పరీక్ష|mock/, 'exam-sprint'],
    [/puzzle|aptitude|reasoning/, 'peak-thinking'],
  ]
  for (const [re, id] of table) if (re.test(s)) return id
  return 'deep-focus'
}

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || null
}
