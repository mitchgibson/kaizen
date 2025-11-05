/**
 * Domain model for Kaizen habits.
 * Pure functions and types — no Obsidian API usage.
 */

export type ISODate = string; // YYYY-MM-DD format

export interface Habit {
  id: string;           // file path or slug
  title: string;
  trigger?: string;     // what triggers this habit
  schedule?: string;    // free text e.g. "daily", "every other day"
  history: ISODate[];   // dates when habit was completed (sorted ascending recommended)
  count?: number;       // optional explicit count; prefer deriving from history
}

/**
 * Get today's date in YYYY-MM-DD format (local time, not UTC).
 */
export const todayISO = (): ISODate => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

/**
 * Derive count from history, or use explicit count if provided.
 */
export const deriveCount = (h: Habit): number =>
  typeof h.count === 'number' ? h.count : h.history.length;

/**
 * Mark habit as done on a given date (idempotent).
 * Returns a new habit with the date added to history if not already present.
 */
export const markDone = (habit: Habit, date: ISODate = todayISO()): Habit => {
  const set = new Set(habit.history);
  if (!set.has(date)) {
    const newHistory = [...habit.history, date].sort();
    return {
      ...habit,
      history: newHistory,
      count: newHistory.length,
    };
  }
  return habit;
};

/**
 * Calculate current streak: consecutive days up to today where habit was done.
 * Returns 0 if habit not done today or yesterday.
 */
export const currentStreak = (
  habit: Habit,
  now: ISODate = todayISO()
): number => {
  const set = new Set(habit.history);
  let streak = 0;

  // Helper: get date N days before the given date
  const dayBefore = (d: string, n: number): ISODate => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - n);
    return dt.toISOString().slice(0, 10);
  };

  // Count consecutive days backwards from now
  for (let i = 0; ; i++) {
    const dayIso = dayBefore(now, i);
    if (set.has(dayIso)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Get the longest streak in the habit's history.
 */
export const longestStreak = (habit: Habit): number => {
  if (habit.history.length === 0) return 0;

  const sorted = [...habit.history].sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i - 1]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

/**
 * Check if habit was completed today.
 */
export const isDoneToday = (
  habit: Habit,
  now: ISODate = todayISO()
): boolean => {
  return habit.history.includes(now);
};

/**
 * Get completion rate: percentage of days with completions out of past N days.
 */
export const completionRate = (
  habit: Habit,
  pastDays: number,
  now: ISODate = todayISO()
): number => {
  if (pastDays <= 0) return 0;

  const set = new Set(habit.history);
  let count = 0;

  const dayBefore = (d: string, n: number): ISODate => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - n);
    return dt.toISOString().slice(0, 10);
  };

  for (let i = 0; i < pastDays; i++) {
    if (set.has(dayBefore(now, i))) {
      count++;
    }
  }

  return Math.round((count / pastDays) * 100);
};
