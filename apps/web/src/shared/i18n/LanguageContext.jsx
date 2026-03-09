import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations.js";

const LanguageContext = createContext();

const STORAGE_KEY = "primebuy:lang";

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "es";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  function t(key, params) {
    const keys = key.split(".");
    let value = translations[language];

    for (const k of keys) {
        value = value?.[k];
    }

    if (!value) return key;

    if (params && typeof value === "string") {
        return value.replace(/\{(\w+)\}/g, (_, name) => {
        const v = params[name];
        return v === undefined || v === null ? `{${name}}` : String(v);
        });
    }

    return value;
    }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used within LanguageProvider");
  }
  return ctx;
}