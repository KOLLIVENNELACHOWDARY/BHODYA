import { supabase } from "../../lib/supabaseClient";

const TIME_LOG_COLUMNS = `
  id,
  user_id,
  topic,
  activity_type,
  started_at,
  ended_at,
  duration_seconds,
  active_seconds,
  idle_seconds,
  session_id,
  minutes,
  logged_at
`;

/**
 * Generate a unique tracking session identifier.
 */
export function createSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 14)}`;
}

/**
 * Create a new time-tracking session.
 */
export async function createTimeLog({
  userId,
  activity,
  sessionId,
  startedAt = new Date().toISOString(),
}) {
  assertUserId(userId);

  if (!activity?.key) {
    throw new Error(
      "A valid activity is required.",
    );
  }

  if (!sessionId) {
    throw new Error(
      "A valid session ID is required.",
    );
  }

  const payload = {
    user_id: userId,
    topic: activity.name,
    activity_type: activity.key,
    started_at: startedAt,
    ended_at: null,
    duration_seconds: 0,
    active_seconds: 0,
    idle_seconds: 0,
    session_id: sessionId,
    minutes: 0,
    logged_at: startedAt,
  };

  const { data, error } = await supabase
    .from("time_logs")
    .insert(payload)
    .select(TIME_LOG_COLUMNS)
    .single();

  if (error) {
    throw normalizeSupabaseError(
      error,
      "createTimeLog",
    );
  }

  return data;
}

/**
 * Synchronize an active session without closing it.
 */
export async function syncTimeLog({
  logId,
  durationSeconds,
  activeSeconds,
  idleSeconds,
}) {
  assertLogId(logId);

  const payload = buildTimePayload({
    durationSeconds,
    activeSeconds,
    idleSeconds,
  });

  const { data, error } = await supabase
    .from("time_logs")
    .update(payload)
    .eq("id", logId)
    .select(TIME_LOG_COLUMNS)
    .single();

  if (error) {
    throw normalizeSupabaseError(
      error,
      "syncTimeLog",
    );
  }

  return data;
}

/**
 * Finalize a time-tracking session.
 */
export async function endTimeLog({
  logId,
  durationSeconds,
  activeSeconds,
  idleSeconds,
  endedAt = new Date().toISOString(),
}) {
  assertLogId(logId);

  const payload = {
    ...buildTimePayload({
      durationSeconds,
      activeSeconds,
      idleSeconds,
    }),
    ended_at: endedAt,
  };

  const { data, error } = await supabase
    .from("time_logs")
    .update(payload)
    .eq("id", logId)
    .select(TIME_LOG_COLUMNS)
    .single();

  if (error) {
    throw normalizeSupabaseError(
      error,
      "endTimeLog",
    );
  }

  return data;
}

/**
 * Fetch time logs for a user.
 */
export async function fetchTimeLogs({
  userId,
  startDate,
  endDate,
  activityType,
  limit = 500,
}) {
  assertUserId(userId);

  const safeLimit = Math.min(
    Math.max(1, Math.floor(Number(limit) || 1)),
    1000,
  );

  let query = supabase
    .from("time_logs")
    .select(TIME_LOG_COLUMNS)
    .eq("user_id", userId)
    .order("started_at", {
      ascending: false,
    })
    .limit(safeLimit);

  if (startDate) {
    query = query.gte(
      "started_at",
      startDate,
    );
  }

  if (endDate) {
    query = query.lt(
      "started_at",
      endDate,
    );
  }

  if (activityType) {
    query = query.eq(
      "activity_type",
      activityType,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw normalizeSupabaseError(
      error,
      "fetchTimeLogs",
    );
  }

  return data ?? [];
}

/**
 * Fetch today's activity.
 */
export async function fetchTodayTimeLogs(userId) {
  const { start, end } =
    getLocalDayBounds();

  return fetchTimeLogs({
    userId,
    startDate: start,
    endDate: end,
  });
}

/**
 * Fetch activity for a rolling number of days.
 */
export async function fetchTimeLogsForRange(
  userId,
  days = 7,
) {
  assertUserId(userId);

  const safeDays = Math.max(
    1,
    Math.floor(Number(days) || 1),
  );

  const end = new Date();
  const start = new Date(end);

  start.setDate(
    start.getDate() - safeDays,
  );

  return fetchTimeLogs({
    userId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });
}

/**
 * Aggregate raw sessions into activity statistics.
 */
export function aggregateTimeLogs(logs = []) {
  const byActivity = new Map();

  let activeSeconds = 0;
  let idleSeconds = 0;
  let durationSeconds = 0;

  for (const log of logs) {
    const activityType =
      log.activity_type || "other";

    const active =
      toNonNegativeNumber(
        log.active_seconds,
      );

    const idle =
      toNonNegativeNumber(
        log.idle_seconds,
      );

    const duration =
      toNonNegativeNumber(
        log.duration_seconds,
      );

    activeSeconds += active;
    idleSeconds += idle;
    durationSeconds += duration;

    if (!byActivity.has(activityType)) {
      byActivity.set(activityType, {
        activityType,
        topic:
          log.topic || activityType,
        activeSeconds: 0,
        idleSeconds: 0,
        durationSeconds: 0,
        sessionCount: 0,
      });
    }

    const entry =
      byActivity.get(activityType);

    entry.activeSeconds += active;
    entry.idleSeconds += idle;
    entry.durationSeconds += duration;
    entry.sessionCount += 1;
  }

  const activities =
    [...byActivity.values()]
      .map((entry) => ({
        ...entry,

        activePercentage:
          activeSeconds > 0
            ? Number(
                (
                  (entry.activeSeconds /
                    activeSeconds) *
                  100
                ).toFixed(1),
              )
            : 0,

        averageSessionSeconds:
          entry.sessionCount > 0
            ? Math.round(
                entry.activeSeconds /
                  entry.sessionCount,
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.activeSeconds -
          a.activeSeconds,
      );

  return {
    activeSeconds,
    idleSeconds,
    durationSeconds,
    sessionCount: logs.length,
    activities,
  };
}

/**
 * Format seconds as a human-readable duration.
 */
export function formatDuration(
  totalSeconds = 0,
) {
  const seconds = Math.max(
    0,
    Math.floor(
      Number(totalSeconds) || 0,
    ),
  );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60,
    );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(
      minutes,
    ).padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${String(
      remainingSeconds,
    ).padStart(2, "0")}s`;
  }

  return `${remainingSeconds}s`;
}

/**
 * Convert seconds to rounded minutes.
 */
export function formatMinutes(
  totalSeconds = 0,
) {
  return Math.round(
    Math.max(
      0,
      Number(totalSeconds) || 0,
    ) / 60,
  );
}

function buildTimePayload({
  durationSeconds,
  activeSeconds,
  idleSeconds,
}) {
  const duration =
    toNonNegativeInteger(
      durationSeconds,
    );

  const active =
    toNonNegativeInteger(
      activeSeconds,
    );

  const idle =
    toNonNegativeInteger(
      idleSeconds,
    );

  return {
    duration_seconds: duration,
    active_seconds: active,
    idle_seconds: idle,
    minutes: Math.floor(
      active / 60,
    ),
  };
}

function getLocalDayBounds() {
  const start = new Date();

  start.setHours(
    0,
    0,
    0,
    0,
  );

  const end = new Date(start);

  end.setDate(
    end.getDate() + 1,
  );

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function toNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, number);
}

function toNonNegativeInteger(value) {
  return Math.floor(
    toNonNegativeNumber(value),
  );
}

function assertUserId(userId) {
  if (!userId) {
    throw new Error(
      "A valid authenticated user is required.",
    );
  }
}

function assertLogId(logId) {
  if (
    logId === null ||
    logId === undefined
  ) {
    throw new Error(
      "A valid time log ID is required.",
    );
  }
}

function normalizeSupabaseError(
  error,
  operation,
) {
  const normalized = new Error(
    error?.message ||
      `Time tracking operation failed: ${operation}`,
  );

  normalized.code = error?.code;
  normalized.details = error?.details;
  normalized.hint = error?.hint;
  normalized.operation = operation;

  return normalized;
}