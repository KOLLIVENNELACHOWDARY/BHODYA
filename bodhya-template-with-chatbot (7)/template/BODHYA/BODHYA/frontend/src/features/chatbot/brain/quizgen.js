// ---------- Offline quiz generator: builds quizzes from YOUR notes (no API keys) ----------
// Techniques: cloze (fill-in-the-blank) + true/false from sentences, with keyword
// importance scoring and distractors taken from the same text — fully offline.

const STOPWORDS = {
  en: new Set(("a an the and or but if then else for of to in on at by with from as is are was were be been being have has had do does did will would can could should may might must this that these those it its he she they we you i me my our their his her not no yes so than too very just about into over after before when where why how what which who whom whose also such only own same other another some any each every both all most much many more less eg ie us vs").split(" ")),
  hi: new Set(("का की के कि को से में पर और है हैं था थी थे हो नहीं यह वह ये वे मैं तुम आप हम उस इस उन इन जो जिस जैसे तो भी ही तक ने कर किया करता रहा रही गया गई लिए बाद पहले अब फिर यहाँ वहाँ कुछ सब एक दो अपना अपनी अपने उनका इसका").split(" ")),
  te: new Set(("యొక్క లో కి కు మరియు మీద తో అని ఉంది ఉన్నారు ఇది అది వీరు వారు నేను మీరు మేము ఆ ఈ వాటి వీటి ఒక రెండు కానీ లేదా కూడా కాదు అవును లేదు అప్పుడు ఇప్పుడు ఇక్కడ అక్కడ ఎందుకు ఎలా ఏమి ఎవరు వచ్చు వెళ్ళు చేయు అయితే మొదలు తర్వాత ముందు").split(" "))
};

const TF_OPTIONS = {
  en: ["True", "False"],
  hi: ["सही", "गलत"],
  te: ["నిజం", "తప్పు"],
};

export function detectNotesLang(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  return "en";
}

export function splitSentences(text) {
  // each line ends a sentence (so titles don't merge with the body)
  const clean = String(text || "").replace(/\s*\n+\s*/g, ". ").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  return clean.split(/(?<=[.!?।…])\s+/u).map((s) => s.trim()).filter((s) => s.length > 0);
}

// Detect section headers ("Chapter 3:", "अध्याय 2:", short lines ending with ':') → topics
export function detectSections(text) {
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let current = { title: "", body: [] };
  for (const line of lines) {
    const isHeader =
      line.length <= 70 &&
      (/[:：]$/.test(line) ||
        /^(chapter|unit|lesson|section|topic|part|अध्याय|पाठ|यूनिट|విభాగం|పాఠం|యూనిట్)\b/i.test(line));
    if (isHeader) {
      if (current.title || current.body.length) sections.push(current);
      current = { title: line.replace(/[:：]+$/, "").trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.title || current.body.length) sections.push(current);
  return sections.map((s) => ({ title: s.title, body: s.body.join(" ") })).filter((s) => s.body);
}

function tokenizeWords(text) {
  return String(text || "").match(/[\p{L}\p{M}]+/gu) || [];
}

function contentWords(text, lang) {
  const stop = STOPWORDS[lang] || STOPWORDS.en;
  return tokenizeWords(text).filter((w) => w.length >= 4 && !stop.has(w.toLowerCase()));
}

function wordScores(text, lang) {
  const stop = STOPWORDS[lang] || STOPWORDS.en;
  const freq = {};
  for (const w of tokenizeWords(text)) {
    const k = w.toLowerCase();
    if (w.length >= 4 && !stop.has(k)) freq[k] = (freq[k] || 0) + 1;
  }
  return freq;
}

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Replace a whole word (unicode-safe, keeps case of surroundings)
function replaceWord(sentence, word, replacement) {
  const re = new RegExp("(^|[^\\p{L}\\p{M}])(" + esc(word) + ")(?=$|[^\\p{L}\\p{M}])", "iu");
  return String(sentence).replace(re, "$1" + replacement);
}

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistractors(answer, scores, origCase, n = 3) {
  const low = answer.toLowerCase();
  const entries = Object.entries(scores).filter(([w]) => w !== low);
  entries.sort((a, b) => b[1] - a[1]);
  const close = entries.filter(([w]) => Math.abs(w.length - low.length) <= 4).slice(0, n);
  const rest = entries.slice(0, n * 8).filter(([w]) => !close.some((c) => c[0] === w));
  return [...close, ...rest].slice(0, n).map(([w]) => origCase[w] || w);
}

function sentenceScore(sentence, scores, lang) {
  const words = contentWords(sentence, lang);
  let sc = 0;
  for (const w of words) {
    const k = w.toLowerCase();
    sc += (scores[k] || 0) * 2;
    if (/^\p{Lu}/u.test(w)) sc += 1.5; // proper nouns / key terms
  }
  if (words.length >= 6 && words.length <= 20) sc += 2;
  return sc;
}

/**
 * Generate a quiz from a text.
 * @returns {{lang, title, questions: [{type:'fill'|'tf', q, options, answer}]}}
 */
export function generateQuiz(text, opts = {}) {
  const lang = detectNotesLang(text);
  const sentences = splitSentences(text).filter((s) => s.length >= 30 && contentWords(s, lang).length >= 3);
  if (sentences.length === 0) return { lang, title: "", questions: [] };

  const scores = wordScores(text, lang);
  const origCase = {};
  for (const w of tokenizeWords(text)) {
    const k = w.toLowerCase();
    if (!(k in origCase)) origCase[k] = w;
  }

  const count = Math.max(1, Math.min(opts.count || 5, sentences.length));
  const pool = [...sentences]
    .sort((a, b) => sentenceScore(b, scores, lang) - sentenceScore(a, scores, lang))
    .slice(0, Math.min(count, sentences.length));

  const questions = [];
  for (let i = 0; i < pool.length && questions.length < count; i++) {
    const s = pool[i];
    const words = contentWords(s, lang).sort(
      (a, b) => sentenceScore(b, scores, lang) - sentenceScore(a, scores, lang)
    );
    const answer = words[0];
    if (!answer) continue;
    const distractors = pickDistractors(answer, scores, origCase, 3);
    if (distractors.length < 3) continue;

    if (i % 3 === 2) {
      // true/false — swap the keyword to make a plausible false statement
      const wrong = replaceWord(s, answer, distractors[0]);
      if (wrong === s) continue;
      const pair = shuffle([
        { text: s, val: true },
        { text: wrong, val: false },
      ]);
      questions.push({ type: "tf", q: pair[0].text, options: TF_OPTIONS[lang], answer: pair[0].val ? 0 : 1 });
    } else {
      const qtext = replaceWord(s, answer, "_____");
      if (qtext === s) continue;
      const options = shuffle([answer, ...distractors]);
      questions.push({ type: "fill", q: qtext, options, answer: options.indexOf(answer) });
    }
  }

  const firstLine = String(text || "").split("\n").map((l) => l.trim()).find(Boolean) || "";
  return { lang, title: firstLine.slice(0, 60), questions };
}

export function countPossible(text) {
  const lang = detectNotesLang(text);
  return splitSentences(text).filter((s) => s.length >= 30 && contentWords(s, lang).length >= 3).length;
}
