import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  aggregateTimeLogs,
  createSessionId,
  createTimeLog,
  endTimeLog,
  fetchTodayTimeLogs,
  syncTimeLog,
} from "./api";

import {
  resolveActivity,
  TRACKING_CONFIG,
} from "./activityConfig";

const {
  idleThresholdMs,
  heartbeatIntervalMs,
  syncIntervalMs,
  minimumPersistSeconds,
} = TRACKING_CONFIG;

export function useTimeTracker() {
  const { user } = useAuth();
  const location = useLocation();

  const activity = useMemo(
    () =>
      resolveActivity(
        location.pathname,
      ),
    [location.pathname],
  );

  const mountedRef = useRef(false);

  const sessionRef = useRef(null);

  const lastInteractionRef =
    useRef(Date.now());

  const lastTickRef =
    useRef(Date.now());

  const transitionQueueRef =
    useRef(Promise.resolve());

  const [status, setStatus] =
    useState("idle");

  const [todayLogs, setTodayLogs] =
    useState([]);

  const [lastError, setLastError] =
    useState(null);

  const [updatedAt, setUpdatedAt] =
    useState(null);

  const [sessionVersion, setSessionVersion] =
    useState(0);

  /**
   * Component lifecycle.
   *
   * This is intentionally independent from
   * route-change effects.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Records user interaction.
   */
  const markInteraction =
    useCallback(() => {
      lastInteractionRef.current =
        Date.now();
    }, []);

  /**
   * Returns the current session metrics.
   */
  const getCurrentMetrics =
    useCallback(() => {
      const session =
        sessionRef.current;

      if (!session) {
        return {
          durationSeconds: 0,
          activeSeconds: 0,
          idleSeconds: 0,
        };
      }

      const now = Date.now();

      const durationSeconds =
        Math.max(
          0,
          Math.floor(
            (now -
              session.startedAtMs) /
              1000,
          ),
        );

      return {
        durationSeconds,

        activeSeconds: Math.max(
          0,
          Math.floor(
            session.activeSeconds,
          ),
        ),

        idleSeconds: Math.max(
          0,
          Math.floor(
            session.idleSeconds,
          ),
        ),
      };
    }, []);

  /**
   * Refresh today's stored activity.
   */
  const refreshToday =
    useCallback(async () => {
      if (!user?.id) {
        if (mountedRef.current) {
          setTodayLogs([]);
          setUpdatedAt(new Date());
        }

        return;
      }

      try {
        const logs =
          await fetchTodayTimeLogs(
            user.id,
          );

        if (!mountedRef.current) {
          return;
        }

        setTodayLogs(logs);
        setUpdatedAt(new Date());
        setLastError(null);
      } catch (error) {
        console.error(
          "[TimeTracking] Failed to refresh activity.",
          error,
        );

        if (mountedRef.current) {
          setLastError(error);
        }
      }
    }, [user?.id]);

  /**
   * Persist the current session.
   */
  const persistCurrentSession =
    useCallback(
      async ({
        finish = false,
      } = {}) => {
        const session =
          sessionRef.current;

        if (!session?.logId) {
          return;
        }

        const metrics =
          getCurrentMetrics();

        if (
          !finish &&
          metrics.durationSeconds <
            minimumPersistSeconds
        ) {
          return;
        }

        try {
          if (finish) {
            await endTimeLog({
              logId: session.logId,
              ...metrics,
            });
          } else {
            await syncTimeLog({
              logId: session.logId,
              ...metrics,
            });
          }

          if (mountedRef.current) {
            setLastError(null);
          }
        } catch (error) {
          console.error(
            "[TimeTracking] Failed to persist session.",
            error,
          );

          if (mountedRef.current) {
            setLastError(error);
          }
        }
      },
      [getCurrentMetrics],
    );

  /**
   * Stops the current tracking session.
   */
  const stopSession =
    useCallback(async () => {
      const session =
        sessionRef.current;

      if (!session) {
        return;
      }

      /*
       * Keep a reference to the session being
       * finalized so a newer session cannot
       * accidentally be cleared.
       */
      const sessionId =
        session.sessionId;

      await persistCurrentSession({
        finish: true,
      });

      if (
        sessionRef.current
          ?.sessionId === sessionId
      ) {
        sessionRef.current = null;

        if (mountedRef.current) {
          setStatus("idle");
          setSessionVersion(
            (value) => value + 1,
          );
        }
      }
    }, [persistCurrentSession]);

  /**
   * Starts a new tracking session.
   */
  const startSession =
    useCallback(
      async (nextActivity) => {
        if (
          !user?.id ||
          !nextActivity?.trackable
        ) {
          if (mountedRef.current) {
            setStatus("idle");
          }

          return;
        }

        const sessionId =
          createSessionId();

        const startedAt =
          new Date();

        try {
          const log =
            await createTimeLog({
              userId: user.id,
              activity: nextActivity,
              sessionId,
              startedAt:
                startedAt.toISOString(),
            });

          if (!mountedRef.current) {
            return;
          }

          sessionRef.current = {
            logId: log.id,
            sessionId,
            activityKey:
              nextActivity.key,
            startedAtMs:
              startedAt.getTime(),
            activeSeconds: 0,
            idleSeconds: 0,
          };

          lastInteractionRef.current =
            Date.now();

          lastTickRef.current =
            Date.now();

          setStatus("tracking");
          setLastError(null);
          setSessionVersion(
            (value) => value + 1,
          );
        } catch (error) {
          console.error(
            "[TimeTracking] Failed to start session.",
            error,
          );

          if (mountedRef.current) {
            setStatus("error");
            setLastError(error);
          }
        }
      },
      [user?.id],
    );

  /**
   * Serializes session transitions.
   *
   * This prevents two route changes occurring
   * close together from creating overlapping
   * sessions.
   */
  const transitionToActivity =
    useCallback(
      (nextActivity) => {
        const transition =
          async () => {
            if (!mountedRef.current) {
              return;
            }

            await stopSession();

            if (!mountedRef.current) {
              return;
            }

            await startSession(
              nextActivity,
            );
          };

        transitionQueueRef.current =
          transitionQueueRef.current
            .catch(() => undefined)
            .then(transition);

        return transitionQueueRef.current;
      },
      [stopSession, startSession],
    );

  /**
   * Start/stop sessions when the authenticated
   * user or current route changes.
   */
  useEffect(() => {
    if (!user?.id) {
      sessionRef.current = null;
      setStatus("idle");
      return;
    }

    void transitionToActivity(
      activity,
    );
  }, [
    user?.id,
    activity.key,
    transitionToActivity,
  ]);

  /**
   * Heartbeat timer.
   *
   * Every second, elapsed time is classified
   * as either active or idle.
   */
  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const interval =
      window.setInterval(() => {
        const session =
          sessionRef.current;

        if (!session) {
          return;
        }

        const now = Date.now();

        const elapsedSeconds =
          Math.min(
            5,
            Math.max(
              0,
              (now -
                lastTickRef.current) /
                1000,
            ),
          );

        lastTickRef.current =
          now;

        const isVisible =
          document.visibilityState ===
          "visible";

        const recentInteraction =
          now -
            lastInteractionRef.current <
          idleThresholdMs;

        if (
          isVisible &&
          recentInteraction
        ) {
          session.activeSeconds +=
            elapsedSeconds;
        } else {
          session.idleSeconds +=
            elapsedSeconds;
        }

        setSessionVersion(
          (value) => value + 1,
        );
      }, heartbeatIntervalMs);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [user?.id]);

  /**
   * Register browser interaction events.
   */
  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    for (const eventName of events) {
      window.addEventListener(
        eventName,
        markInteraction,
        { passive: true },
      );
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(
          eventName,
          markInteraction,
        );
      }
    };
  }, [
    user?.id,
    markInteraction,
  ]);

  /**
   * Handle browser visibility changes.
   */
  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "hidden"
        ) {
          void persistCurrentSession();
          return;
        }

        lastTickRef.current =
          Date.now();

        lastInteractionRef.current =
          Date.now();

        setSessionVersion(
          (value) => value + 1,
        );
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    user?.id,
    persistCurrentSession,
  ]);

  /**
   * Periodic synchronization.
   */
  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const interval =
      window.setInterval(() => {
        void persistCurrentSession();
        void refreshToday();
      }, syncIntervalMs);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    user?.id,
    persistCurrentSession,
    refreshToday,
  ]);

  /**
   * Initial activity refresh.
   */
  useEffect(() => {
    void refreshToday();
  }, [refreshToday]);

  /**
   * Best-effort cleanup when the tracking
   * hook is unmounted.
   *
   * Periodic synchronization is the primary
   * reliability mechanism because browsers
   * do not guarantee asynchronous requests
   * during page termination.
   */
  useEffect(() => {
    return () => {
      void persistCurrentSession({
        finish: true,
      });
    };
  }, [persistCurrentSession]);

  /**
   * Combine persisted activity with the
   * currently running session for the UI.
   */
  const stats = useMemo(() => {
    const persisted =
      aggregateTimeLogs(
        todayLogs,
      );

    const current =
      sessionRef.current;

    if (!current) {
      return persisted;
    }

    const metrics =
      getCurrentMetrics();

    const existingActivity =
      persisted.activities.find(
        (item) =>
          item.activityType ===
          current.activityKey,
      );

    const activities = [
      ...persisted.activities,
    ];

    if (existingActivity) {
      existingActivity.activeSeconds +=
        metrics.activeSeconds;

      existingActivity.idleSeconds +=
        metrics.idleSeconds;

      existingActivity.durationSeconds +=
        metrics.durationSeconds;

      existingActivity.sessionCount += 1;
    } else {
      activities.push({
        activityType:
          current.activityKey,
        topic:
          activity.name,
        activeSeconds:
          metrics.activeSeconds,
        idleSeconds:
          metrics.idleSeconds,
        durationSeconds:
          metrics.durationSeconds,
        sessionCount: 1,
        activePercentage: 0,
        averageSessionSeconds:
          metrics.activeSeconds,
      });
    }

    const totalActiveSeconds =
      persisted.activeSeconds +
      metrics.activeSeconds;

    const totalIdleSeconds =
      persisted.idleSeconds +
      metrics.idleSeconds;

    const totalDurationSeconds =
      persisted.durationSeconds +
      metrics.durationSeconds;

    const sessionCount =
      persisted.sessionCount + 1;

    const normalizedActivities =
      activities
        .map((item) => ({
          ...item,

          activePercentage:
            totalActiveSeconds > 0
              ? Number(
                  (
                    (item.activeSeconds /
                      totalActiveSeconds) *
                    100
                  ).toFixed(1),
                )
              : 0,

          averageSessionSeconds:
            item.sessionCount > 0
              ? Math.round(
                  item.activeSeconds /
                    item.sessionCount,
                )
              : 0,
        }))
        .sort(
          (a, b) =>
            b.activeSeconds -
            a.activeSeconds,
        );

    return {
      activeSeconds:
        totalActiveSeconds,

      idleSeconds:
        totalIdleSeconds,

      durationSeconds:
        totalDurationSeconds,

      sessionCount,

      activities:
        normalizedActivities,
    };
  }, [
    todayLogs,
    activity.name,
    sessionVersion,
    getCurrentMetrics,
  ]);

  const currentSession =
    useMemo(() => {
      const session =
        sessionRef.current;

      if (!session) {
        return null;
      }

      return {
        ...session,
        ...getCurrentMetrics(),
      };
    }, [
      sessionVersion,
      getCurrentMetrics,
    ]);

  return {
    status,
    activity,
    currentSession,
    todayLogs,
    stats,
    updatedAt,
    lastError,

    markInteraction,
    refreshToday,
    syncCurrentSession:
      persistCurrentSession,
    stopSession,
  };
}