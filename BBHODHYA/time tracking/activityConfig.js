/**
 * Bodhya - Time & Activity Tracking
 *
 * Central registry for application activities.
 *
 * Activity keys are stable identifiers used for analytics.
 * Routes may be changed without changing historical activity keys.
 */

const ACTIVITY_REGISTRY = Object.freeze({
  HOME: {
    key: "home",
    name: "Home",
    category: "navigation",
    routes: ["/"],
    trackable: true,
  },

  DASHBOARD: {
    key: "dashboard",
    name: "Dashboard",
    category: "navigation",
    routes: ["/dashboard"],
    trackable: true,
  },

  AI_TUTOR: {
    key: "ai_tutor",
    name: "AI Tutor",
    category: "learning",
    routes: ["/chat", "/tutor"],
    trackable: true,
  },

  QUIZ: {
    key: "quiz",
    name: "Quiz",
    category: "assessment",
    routes: ["/quiz"],
    trackable: true,
  },

  NOTES: {
    key: "notes",
    name: "Notes",
    category: "learning",
    routes: ["/notes"],
    trackable: true,
  },

  STUDY_ROOM: {
    key: "study_room",
    name: "Study Room",
    category: "learning",
    routes: ["/study-room"],
    trackable: true,
  },

  DOCUMENTS: {
    key: "documents",
    name: "Documents",
    category: "learning",
    routes: ["/documents"],
    trackable: true,
  },

  OTHER: {
    key: "other",
    name: "Other",
    category: "other",
    routes: [],
    trackable: false,
  },
});

const ACTIVITY_ENTRIES = Object.freeze(
  Object.values(ACTIVITY_REGISTRY),
);

export const ACTIVITY_CONFIG = ACTIVITY_REGISTRY;

export const ACTIVITY_CATEGORIES = Object.freeze({
  LEARNING: "learning",
  ASSESSMENT: "assessment",
  NAVIGATION: "navigation",
  OTHER: "other",
});

export const TRACKING_CONFIG = Object.freeze({
  /**
   * No interaction for this duration means
   * the current interval is classified as idle.
   */
  idleThresholdMs: 60_000,

  /**
   * Frequency at which active/idle state is evaluated.
   */
  heartbeatIntervalMs: 1_000,

  /**
   * Frequency at which the current session
   * is persisted to Supabase.
   */
  syncIntervalMs: 15_000,

  /**
   * Sessions shorter than this are not
   * unnecessarily synchronized.
   */
  minimumPersistSeconds: 1,
});

/**
 * Resolve a browser pathname into a registered activity.
 */
export function resolveActivity(pathname = "/") {
  const normalizedPath = normalizePath(pathname);

  const exactMatch = ACTIVITY_ENTRIES.find(
    (activity) =>
      activity.routes.some(
        (route) =>
          normalizePath(route) === normalizedPath,
      ),
  );

  if (exactMatch) {
    return exactMatch;
  }

  const nestedMatches = ACTIVITY_ENTRIES
    .filter(
      (activity) => activity.routes.length > 0,
    )
    .flatMap((activity) =>
      activity.routes.map((route) => ({
        activity,
        route: normalizePath(route),
      })),
    )
    .filter(
      ({ route }) =>
        route !== "/" &&
        (
          normalizedPath === route ||
          normalizedPath.startsWith(`${route}/`)
        ),
    )
    .sort(
      (a, b) =>
        b.route.length - a.route.length,
    );

  if (nestedMatches.length > 0) {
    return nestedMatches[0].activity;
  }

  return ACTIVITY_REGISTRY.OTHER;
}

export function isTrackableRoute(pathname = "/") {
  return resolveActivity(pathname).trackable;
}

export function getActivityKey(pathname = "/") {
  return resolveActivity(pathname).key;
}

export function getActivityCategory(pathname = "/") {
  return resolveActivity(pathname).category;
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const cleanPath = pathname
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  return cleanPath ? `/${cleanPath}` : "/";
}