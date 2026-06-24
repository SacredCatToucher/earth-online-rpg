"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { type Language } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  function choose(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  return (
    <div className="language-switcher" aria-label={t("language.label")}>
      <span>{t("language.label")}</span>
      <button type="button" className={language === "en" ? "active" : ""} onClick={() => choose("en")}>English</button>
      <button type="button" className={language === "zh-TW" ? "active" : ""} onClick={() => choose("zh-TW")}>繁體中文</button>
    </div>
  );
}
