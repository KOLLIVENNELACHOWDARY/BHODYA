import {
  useEffect,
  useState,
} from "react";

import {
  formatDuration,
  formatMinutes,
} from "./api";

import {
  useTimeTracking,
} from "./TimeTrackingProvider";

export default function TimeTrackingDashboard() {
  const {
    activity,
    currentSession,
    stats,
    status,
    updatedAt,
    lastError,
    refreshToday,
  } = useTimeTracking();

  const [, setTick] =
    useState(0);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setTick(
          (value) => value + 1,
        );
      }, 1000);

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  const currentDuration =
    currentSession?.durationSeconds ??
    0;

  const trackingActive =
    status === "tracking";

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Learning Activity
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            Activity Overview
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Current activity:{" "}
            {activity.name}
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {updatedAt
            ? `Updated ${updatedAt.toLocaleTimeString()}`
            : "No activity data yet"}
        </div>
      </header>

      {lastError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Activity data could not be
          synchronized. Tracking will
          continue and retry
          automatically.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Time"
          value={formatDuration(
            stats.activeSeconds,
          )}
        />

        <MetricCard
          label="Idle Time"
          value={formatDuration(
            stats.idleSeconds,
          )}
        />

        <MetricCard
          label="Sessions"
          value={String(
            stats.sessionCount,
          )}
        />

        <MetricCard
          label="Active Minutes"
          value={`${formatMinutes(
            stats.activeSeconds,
          )} min`}
        />
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Current Session
            </h2>

            <p className="text-sm text-gray-500">
              {trackingActive
                ? "Activity tracking is active."
                : "Activity tracking is inactive."}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold">
              {formatDuration(
                currentDuration,
              )}
            </p>

            <p className="text-xs capitalize text-gray-500">
              {activity.category}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Activity Breakdown
            </h2>

            <p className="text-sm text-gray-500">
              Distribution of active
              time for today.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void refreshToday()
            }
            className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {stats.activities.length ===
        0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">
            {stats.activities.map(
              (item) => (
                <ActivityRow
                  key={
                    item.activityType
                  }
                  activity={item}
                  totalActiveSeconds={
                    stats.activeSeconds
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </section>
  );
}

function MetricCard({
  label,
  value,
}) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </article>
  );
}

function ActivityRow({
  activity,
  totalActiveSeconds,
}) {
  const percentage =
    totalActiveSeconds > 0
      ? Math.min(
          100,
          (activity.activeSeconds /
            totalActiveSeconds) *
            100,
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <p className="font-medium">
            {activity.topic}
          </p>

          <p className="text-xs text-gray-500">
            {activity.sessionCount}{" "}
            {activity.sessionCount ===
            1
              ? "session"
              : "sessions"}

            {" · "}

            Average{" "}
            {formatDuration(
              activity.averageSessionSeconds,
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="font-medium">
            {formatDuration(
              activity.activeSeconds,
            )}
          </p>

          <p className="text-xs text-gray-500">
            {percentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${activity.topic}: ${percentage.toFixed(
          1,
        )}%`}
      >
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">
        No activity recorded yet.
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Activity data will appear as
        the application is used.
      </p>
    </div>
  );
}