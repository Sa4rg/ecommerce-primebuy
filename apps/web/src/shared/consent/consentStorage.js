const STORAGE_KEY = "cookie_consent";
const CURRENT_POLICY_VERSION = "1.0";

export function getDefaultConsent() {
    return {
        status: "pending",
        necessary: true,
        marketing: false,
        functional: false,
        policyVersion: CURRENT_POLICY_VERSION,
        decidedAt: null,
    };
}

export function getStoredConsent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultConsent();
        const parsed = JSON.parse(raw);
        
        if (parsed.policyVersion !== CURRENT_POLICY_VERSION) {
            return getDefaultConsent();
        }

        return parsed;
    } catch {
        return getDefaultConsent();
    }  
}

export function saveConsent(preferences) {
    const record = {
        ...preferences,
        status: "decided",
        policyVersion: CURRENT_POLICY_VERSION,
        decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return record;
}