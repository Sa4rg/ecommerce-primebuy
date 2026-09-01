import { createContext, useContext, useState, useEffect } from "react";
import { getStoredConsent, saveConsent, getDefaultConsent } from "./consentStorage";
import { enableMetaPixel } from "../../infrastructure/metaPixel";
import { loadVoiceflowWidget } from "../../infrastructure/voiceflowWidget";

const ConsentContext = createContext(null);

function applyConsentSideEffects(consent) {
  if (consent.marketing) {
    enableMetaPixel();
  }
  if (consent.functional) {
    loadVoiceflowWidget();
  }
}

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(getDefaultConsent);

    useEffect(() => {
        const stored = getStoredConsent();
        setConsent(stored);
        if (stored.status === "decided") {
            applyConsentSideEffects(stored);
        }
    }, []);

    function acceptAll() {
        const updated = saveConsent({necessary: true, marketing: true, functional: true});
        setConsent(updated);
        applyConsentSideEffects(updated);
    }

    function rejectAll() {
        const updated = saveConsent({necessary: true, marketing: false, functional: false});
        setConsent(updated);
    }

    function savePreferences(partialPreferences) {
        const updated = saveConsent({
            necessary: true,
            ...partialPreferences
        });
        setConsent(updated);
        applyConsentSideEffects(updated);
    }

    const value = {
        consent,
        acceptAll,
        rejectAll,
        savePreferences,
    };

    return (
        <ConsentContext.Provider value={value}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent() {
    const ctx = useContext(ConsentContext);
    if (!ctx) {
        throw new Error("useConsent must be used within a ConsentProvider");
    }
    return ctx;
}
