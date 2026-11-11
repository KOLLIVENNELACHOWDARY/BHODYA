export const FOCUS_SUPPORT_KEY = "bodhya.focus-support.settings.v1";

export const INTERESTS = [
  { id: "games", label: "Games", emoji: "🎮" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "art", label: "Art & design", emoji: "🎨" },
  { id: "animals", label: "Animals & nature", emoji: "🐾" },
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "coding", label: "Coding & technology", emoji: "💻" },
  { id: "stories", label: "Stories", emoji: "📚" },
  { id: "puzzles", label: "Puzzles", emoji: "🧩" },
  { id: "business", label: "Business & money", emoji: "💡" },
];

export const DEFAULT_SETTINGS = {
  enabled: false,
  interests: ["games", "puzzles"],
  preferredPrompt: "gentle",
  quietMinutes: 12,
  idleMinutes: 6,
};

const BASE_SUGGESTIONS = {
  idle: {
    title: "Want to make the next step smaller?",
    message: "You don't have to finish everything right now. Pick one small thing to do for two minutes.",
    actions: ["tiny_step", "interest_example", "dismiss"],
  },
  returned: {
    title: "Welcome back 🌱",
    message: "Ready to continue? We can pick up with one easy step or switch to a different way of learning.",
    actions: ["tiny_step", "change_format", "dismiss"],
  },
  frequent_switches: {
    title: "Lots happening at once?",
    message: "Would it help to choose just one small task for the next few minutes?",
    actions: ["tiny_step", "quick_reset", "dismiss"],
  },
  stuck: {
    title: "Let's try another way",
    message: "Sometimes a different example or format makes an idea easier. Want to try one?",
    actions: ["interest_example", "change_format", "dismiss"],
  },
  long_session: {
    title: "A quick reset might help",
    message: "You've been studying for a while. A short stretch or water break is okay, too.",
    actions: ["quick_reset", "continue", "dismiss"],
  },
  student_requested: {
    title: "Let's make this more interesting",
    message: "Choose a familiar interest and connect it to the topic you're learning.",
    actions: ["interest_example", "change_format", "dismiss"],
  },
};

const EXAMPLES = {
  math: {
    games: "Treat the next problem like one game level: solve just the first step.",
    sports: "Connect the formula to a score, average or sports statistic.",
    music: "Think of fractions as parts of a beat or bar of music.",
    art: "Sketch the problem as a small visual before calculating.",
    animals: "Use a simple animal-counting or habitat example for the numbers.",
    space: "Use a planet distance or orbit example to make the numbers concrete.",
    coding: "Write the calculation as a tiny function and test one input.",
    stories: "Turn the question into a two-sentence story with knowns and unknowns.",
    puzzles: "Find one clue first; ignore the rest until that step is solved.",
    business: "Connect percentages to a simple budget, price change or discount.",
  },
  science: {
    games: "Turn the concept into a quick predict-and-check challenge.",
    sports: "Relate the concept to movement, energy or recovery in sport.",
    music: "Look for patterns, waves or vibrations in the topic.",
    art: "Draw the process as three simple shapes with arrows.",
    animals: "Choose one animal and explain how the concept affects it.",
    space: "Imagine how the concept appears on a planet or in space.",
    coding: "Describe the process as input → steps → output.",
    stories: "Explain the concept as a cause-and-effect mini story.",
    puzzles: "Make one prediction, then use evidence to check it.",
    business: "Find one real-world product or invention that uses the concept.",
  },
  coding: {
    games: "Treat the bug as a level: reproduce it, change one thing, test again.",
    sports: "Debug like reviewing a play: find the first moment the result changes.",
    music: "Think of each function as a repeated musical phrase with one job.",
    art: "Draw the data flow before writing the next lines.",
    animals: "Model a simple animal or habitat with a small object or class.",
    space: "Trace how one value travels through the system.",
    coding: "Run the smallest example and inspect one variable at a time.",
    stories: "Explain what each line does as a sequence of story events.",
    puzzles: "Write the expected output, then test one small case.",
    business: "Think of the function as a tiny workflow that saves one manual step.",
  },
  reading: {
    games: "Read one page as a short quest; collect one key idea.",
    sports: "Look for the main claim and the evidence that supports it.",
    music: "Notice the rhythm of the argument: claim, evidence, conclusion.",
    art: "Make a one-line visual summary of the page.",
    animals: "Choose one detail that helps explain the subject in real life.",
    space: "Connect one unfamiliar term to a clear example or image.",
    coding: "Turn the paragraph into a three-step algorithm in plain English.",
    stories: "Summarise the page as beginning, key idea, takeaway.",
    puzzles: "Read the question first, then find the sentence that answers it.",
    business: "Identify the main point, the evidence and the practical implication.",
  },
};

export function getSettings() {
  try {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const raw = window.localStorage.getItem(FOCUS_SUPPORT_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FOCUS_SUPPORT_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("bodhya:focus-support-settings-changed"));
  } catch {
    // Private browsing/storage restrictions: current session still works.
  }
}

export function getSuggestion(signal, interests = ["puzzles"], subject = "study") {
  const base = BASE_SUGGESTIONS[signal] || BASE_SUGGESTIONS.student_requested;
  const interest = INTERESTS.find((item) => interests.includes(item.id)) || INTERESTS[8];
  const exampleMap = EXAMPLES[String(subject || "").toLowerCase()];
  const example = exampleMap?.[interest.id] || `Use ${interest.label.toLowerCase()} as a familiar example for one small step in this topic.`;
  return {
    id: `${signal}-${Date.now()}`,
    signal,
    title: base.title,
    message: base.message,
    actions: base.actions,
    interest,
    subjectExample: example,
  };
}

export const SIGNAL_LABELS = {
  idle: "A quiet moment during a focus session",
  returned: "Returning to Bodhya after stepping away",
  frequent_switches: "Frequent changes between Bodhya tabs",
  stuck: "Student asks for a different approach",
  long_session: "A long study session",
  student_requested: "Student asks for an interest-based activity",
};
