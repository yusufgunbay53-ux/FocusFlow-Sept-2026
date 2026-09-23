export type Priority = "low" | "medium" | "high";
export type ColumnId = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: Priority;
  column: ColumnId;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PomodoroSession {
  id: string;
  mode: "work" | "break";
  durationSec: number;
  completedAt: string;
}

export interface AppStats {
  completedToday: number;
  pomodorosToday: number;
  lastActiveAt: string;
}

export interface AppState {
  tasks: Task[];
  sessions: PomodoroSession[];
  stats: AppStats;
}

export const STORAGE_KEY = "focusflow.v1";

export function createId() {
  return crypto.randomUUID();
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
