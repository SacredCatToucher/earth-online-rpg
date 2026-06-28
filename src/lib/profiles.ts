export const currentProfileStorageKey = "rpg-life-current-profile-id";
export const currentProfileCookieName = "rpg-life-current-profile-id";
export const defaultProfileName = "Default Profile";
export const profileNameMaxLength = 40;

export function getCurrentProfileIdFromBrowser() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(currentProfileStorageKey);
}

export function rememberCurrentProfileId(profileId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(currentProfileStorageKey, profileId);
  document.cookie = `${currentProfileCookieName}=${encodeURIComponent(profileId)}; path=/; max-age=31536000; samesite=lax`;
}

export function profileFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const profileId = getCurrentProfileIdFromBrowser();
  const headers = new Headers(init.headers);
  if (profileId) headers.set("x-rpg-life-profile-id", profileId);
  return fetch(input, { ...init, headers });
}
