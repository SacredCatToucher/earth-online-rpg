"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import { currentProfileStorageKey, profileNameMaxLength } from "@/lib/profiles";

type ProfileSummary = {
  id: string;
  name: string;
  isDefault: boolean;
};

const errorTranslationKeys = {
  PROFILE_NAME_INVALID: "profile.nameRequired",
  PROFILE_NAME_DUPLICATE: "profile.nameDuplicate",
  PROFILE_CREATE_FAILED: "profile.createError",
} satisfies Record<string, TranslationKey>;

export function LocalProfileGate({ initialProfiles }: { initialProfiles: ProfileSummary[] }) {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [currentProfileId, setCurrentProfileId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const currentProfile = useMemo(
    () => profiles.find((profile) => profile.id === currentProfileId) ?? profiles[0] ?? null,
    [currentProfileId, profiles],
  );

  useEffect(() => {
    if (profiles.length === 0) return;
    const stored = window.localStorage.getItem(currentProfileStorageKey);
    const profile = profiles.find((candidate) => candidate.id === stored) ?? profiles[0];
    setCurrentProfileId(profile.id);
    window.localStorage.setItem(currentProfileStorageKey, profile.id);
  }, [profiles]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { errorCode?: keyof typeof errorTranslationKeys };
      setError(t(errorTranslationKeys[body.errorCode ?? "PROFILE_CREATE_FAILED"]));
      setPending(false);
      return;
    }

    const profile = (await response.json()) as ProfileSummary;
    setProfiles([profile]);
    setCurrentProfileId(profile.id);
    window.localStorage.setItem(currentProfileStorageKey, profile.id);
    setPending(false);
  }

  return (
    <>
      {currentProfile ? (
        <div className="profile-chip" aria-label={t("profile.current")}>
          <span>{t("profile.current")}</span>
          <strong>{currentProfile.name}</strong>
        </div>
      ) : null}

      {profiles.length === 0 ? (
        <div className="setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-setup-title">
          <form className="setup-card pixel-panel" onSubmit={submit}>
            <p className="eyebrow">{t("profile.setupEyebrow")}</p>
            <h1 id="profile-setup-title">{t("profile.setupTitle")}</h1>
            <p>{t("profile.setupDescription")}</p>
            <label htmlFor="profile-name">{t("profile.nameLabel")}</label>
            <input
              id="profile-name"
              name="name"
              maxLength={profileNameMaxLength}
              autoComplete="off"
              autoFocus
              required
            />
            {error ? <p className="form-error">{error}</p> : null}
            <button className="pixel-button" type="submit" disabled={pending}>
              {pending ? t("profile.creating") : t("profile.create")}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
