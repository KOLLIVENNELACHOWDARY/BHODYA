import { createContext, useContext, useState } from "react";

// Drives the "change dashboard according to age" feature — components
// read this instead of each doing their own age check.
const AgeContext = createContext(null);

export function AgeProvider({ children }) {
  const [ageBand, setAgeBand] = useState("teen"); // "child" | "teen" | "adult"
  return (
    <AgeContext.Provider value={{ ageBand, setAgeBand }}>
      {children}
    </AgeContext.Provider>
  );
}

export const useAgeBand = () => useContext(AgeContext);
