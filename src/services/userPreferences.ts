// User preferences service
export interface TeleprompterPreferences {
  fontSize: number;
  scrollSpeed: number;
  textOpacity: number;
  textPosition: "top" | "center" | "bottom";
  textColor: "white" | "yellow";
}

export interface UserPreferences {
  teleprompter: TeleprompterPreferences;
}

const STORAGE_KEY = "renum_user_preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  teleprompter: {
    fontSize: 24,
    scrollSpeed: 5,
    textOpacity: 0.7,
    textPosition: "center",
    textColor: "white",
  },
};

export const loadPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
  return DEFAULT_PREFERENCES;
};

export const savePreferences = (preferences: Partial<UserPreferences>): void => {
  try {
    const current = loadPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

export const saveTeleprompterPreferences = (prefs: Partial<TeleprompterPreferences>): void => {
  const current = loadPreferences();
  savePreferences({
    teleprompter: { ...current.teleprompter, ...prefs },
  });
};
