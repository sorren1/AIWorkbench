export type ThemePreference = "light" | "dark";

export const PREFERENCES_STORAGE_KEY = "ai-delivery-workbench.preferences.v1";

type StoredPreferences = {
  readonly version: 1;
  readonly theme: ThemePreference;
};

export function readPreferences(storage: Storage): StoredPreferences {
  const fallback: StoredPreferences = { version: 1, theme: "light" };
  const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      parsed.version === 1 &&
      "theme" in parsed &&
      (parsed.theme === "light" || parsed.theme === "dark")
    ) {
      return { version: 1, theme: parsed.theme };
    }
  } catch {
    // Invalid preferences are ignored and replaced on the next write.
  }

  return fallback;
}

export function writePreferences(storage: Storage, theme: ThemePreference): void {
  const preferences: StoredPreferences = { version: 1, theme };
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  storage.removeItem("wb-theme");
}

export function clearPreferences(storage: Storage): void {
  storage.removeItem(PREFERENCES_STORAGE_KEY);
  storage.removeItem("wb-theme");
}
