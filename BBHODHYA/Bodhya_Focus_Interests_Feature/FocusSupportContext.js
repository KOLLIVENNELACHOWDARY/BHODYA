import { createContext, useContext } from "react";

export const FocusSupportContext = createContext(null);

export function useFocusSupport() {
  const value = useContext(FocusSupportContext);
  if (!value) {
    throw new Error("useFocusSupport must be used inside FocusSupportProvider");
  }
  return value;
}
