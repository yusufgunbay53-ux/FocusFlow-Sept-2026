import { AppState, STORAGE_KEY, todayKey } from "../types";

export const emptyState = (): AppState => ({
  tasks: [],
  sessions: [],
  stats: {
    completedToday: 0,
    pomodorosToday: 0,
    lastActiveAt: new Date().toISOString()
  }
});

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    const last = parsed.stats?.lastActiveAt ? todayKey(new Date(parsed.stats.lastActiveAt)) : "";
    if (last !== todayKey()) {
      parsed.stats = {
        completedToday: 0,
        pomodorosToday: 0,
        lastActiveAt: new Date().toISOString()
      };
    }
    return {
      tasks: parsed.tasks ?? [],
      sessions: parsed.sessions ?? [],
      stats: parsed.stats ?? emptyState().stats
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
