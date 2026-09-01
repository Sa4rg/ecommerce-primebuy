import { createContext, useContext, useState } from "react";
import { AgeVerificationModal } from "./AgeVerificationModal";
import { getAgeStatus, setAgeStatus } from "./ageVerificationStorage";

const AgeVerificationContext = createContext(null);

export function AgeVerificationProvider({ children }) {
  const [status, setStatus] = useState(() => getAgeStatus());

  function confirmAdult() {
    setAgeStatus("adult");
    setStatus("adult");
    }

  function confirmMinor() {
    setAgeStatus("minor");
    setStatus("minor");
  }

  const value = { isMinor: status === "minor"};

  return (
    <AgeVerificationContext.Provider value={value}>
        {children}
        <AgeVerificationModal
            isOpen={status === null}
            onConfirmAdult={confirmAdult}
            onConfirmMinor={confirmMinor}
        />
    </AgeVerificationContext.Provider>
  );
}

export function useAgeVerification() {
    const ctx = useContext(AgeVerificationContext);
    if (!ctx) {
        throw new Error("useAgeVerification must be used within an AgeVerificationProvider");
    }
    return ctx;
}