import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";

import {
  useParentalLock,
} from "./useParentalLock";

import LockScreen from "./LockScreen";

const ParentalLockContext =
  createContext(null);

export function ParentalLockProvider({
  children,
}) {
  const controls =
    useParentalLock();

  /*
   * Re-check the current state periodically.
   *
   * TimeTrackingProvider supplies the live
   * active-time counter. This interval mainly
   * handles settings/override changes.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        void controls.refresh();
      }, 5_000);

    return () =>
      window.clearInterval(
        interval,
      );
  }, [controls.refresh]);

  const contextValue =
    useMemo(
      () => controls,
      [controls],
    );

  if (
    controls.loading &&
    controls.settings === null
  ) {
    return (
      <ParentalLockContext.Provider
        value={contextValue}
      >
        {children}
      </ParentalLockContext.Provider>
    );
  }

  return (
    <ParentalLockContext.Provider
      value={contextValue}
    >
      {controls.locked ? (
        <LockScreen />
      ) : (
        children
      )}
    </ParentalLockContext.Provider>
  );
}

export function useParentalLockContext() {
  const context =
    useContext(
      ParentalLockContext,
    );

  if (!context) {
    throw new Error(
      "useParentalLockContext must be used within ParentalLockProvider.",
    );
  }

  return context;
}