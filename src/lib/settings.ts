export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Settings = {
  weekStartsOn: WeekStartDay;
  quarterlyMonthsBefore: number;
  quarterlyMonthsAfter: number;
  weeklyWeeksBefore: number;
  weeklyWeeksAfter: number;
};

const STORAGE_KEY = "certento:settings";
const defaults: Settings = {
  weekStartsOn: 6, // Saturday
  quarterlyMonthsBefore: 4,
  quarterlyMonthsAfter: 4,
  weeklyWeeksBefore: 3,
  weeklyWeeksAfter: 3,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveSettings(s: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
