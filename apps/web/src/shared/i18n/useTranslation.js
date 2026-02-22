import { useLanguageContext } from "./LanguageContext.jsx";

export function useTranslation() {
  return useLanguageContext();
}