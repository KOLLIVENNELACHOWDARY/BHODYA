/**
 * Bodhya - Parental Lock & Usage Control
 *
 * Central configuration for parental controls.
 */

export const LOCK_CONFIG = Object.freeze({
  DEFAULT_DAILY_LIMIT_MINUTES: 60,

  MIN_DAILY_LIMIT_MINUTES: 5,

  MAX_DAILY_LIMIT_MINUTES: 720,

  UNLOCK_DURATION_MINUTES: 30,

  PIN_MIN_LENGTH: 4,

  PIN_MAX_LENGTH: 6,

  STATUS_REFRESH_INTERVAL_MS: 5_000,
});

export const DAILY_LIMIT_OPTIONS =
  Object.freeze([
    {
      value: 15,
      label: "15 minutes",
    },
    {
      value: 30,
      label: "30 minutes",
    },
    {
      value: 45,
      label: "45 minutes",
    },
    {
      value: 60,
      label: "1 hour",
    },
    {
      value: 90,
      label: "1 hour 30 minutes",
    },
    {
      value: 120,
      label: "2 hours",
    },
    {
      value: 180,
      label: "3 hours",
    },
    {
      value: 240,
      label: "4 hours",
    },
    {
      value: 360,
      label: "6 hours",
    },
  ]);

export const RESTRICTABLE_FEATURES =
  Object.freeze([
    {
      key: "ai_tutor",
      label: "AI Tutor",
      description:
        "Access to the AI learning assistant.",
    },
    {
      key: "quiz",
      label: "Quizzes",
      description:
        "Access to quizzes and assessments.",
    },
    {
      key: "notes",
      label: "Notes",
      description:
        "Create and access study notes.",
    },
    {
      key: "study_room",
      label: "Study Room",
      description:
        "Access to focused study sessions.",
    },
    {
      key: "documents",
      label: "Documents",
      description:
        "Access to learning documents.",
    },
  ]);

export const LOCK_MESSAGES =
  Object.freeze({
    LIMIT_REACHED:
      "Your daily Bodhya usage limit has been reached.",

    APP_LOCKED:
      "Bodhya has been locked by a parent or guardian.",

    FEATURE_RESTRICTED:
      "This feature has been restricted.",

    INVALID_PIN:
      "The PIN you entered is incorrect.",

    PIN_REQUIRED:
      "A parent PIN is required to continue.",
  });

export function isValidPin(pin) {
  return (
    typeof pin === "string" &&
    /^\d+$/.test(pin) &&
    pin.length >=
      LOCK_CONFIG.PIN_MIN_LENGTH &&
    pin.length <=
      LOCK_CONFIG.PIN_MAX_LENGTH
  );
}

export function clampDailyLimit(
  minutes,
) {
  const numeric =
    Number(minutes);

  if (!Number.isFinite(numeric)) {
    return (
      LOCK_CONFIG.DEFAULT_DAILY_LIMIT_MINUTES
    );
  }

  return Math.min(
    LOCK_CONFIG.MAX_DAILY_LIMIT_MINUTES,
    Math.max(
      LOCK_CONFIG.MIN_DAILY_LIMIT_MINUTES,
      Math.round(numeric),
    ),
  );
}