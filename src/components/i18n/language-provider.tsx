"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { isLanguage, languageStorageKey, translate, type Language, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(languageStorageKey);
    if (stored && isLanguage(stored)) setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key) => translate(language, key),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function T({ k }: { k: TranslationKey }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}
