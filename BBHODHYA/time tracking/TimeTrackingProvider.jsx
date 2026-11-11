import {
  createContext,
  useContext,
  useMemo,
} from "react";

import { useTimeTracker } from "./useTimeTracker";

const TimeTrackingContext =
  createContext(null);

export function TimeTrackingProvider({
  children,
}) {
  const tracker =
    useTimeTracker();

  const contextValue = useMemo(
    () => tracker,
    [tracker],
  );

  return (
    <TimeTrackingContext.Provider
      value={contextValue}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const context =
    useContext(
      TimeTrackingContext,
    );

  if (!context) {
    throw new Error(
      "useTimeTracking must be used within TimeTrackingProvider.",
    );
  }

  return context;
}