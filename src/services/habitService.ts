/**
 * Service layer: orchestrates domain logic and repository I/O.
 * Pure functions returning Promises, no UI concerns.
 */

import { App, TFile } from 'obsidian';
import { Habit, ISODate, markDone, deriveCount, todayISO } from '../domain/habit';
import { HabitRepo } from '../adapters/repo/habitRepo';

export interface ServiceOptions {
  autoLogDaily?: boolean;
  logToDailyNote?: boolean;
  app: App;
}

export const createHabitService = (repo: HabitRepo, opts: ServiceOptions) => {
  /**
   * List all habits in the vault.
   */
  async function listHabits(): Promise<Habit[]> {
    return await repo.findAllHabits();
  }

  /**
   * Get a single habit by ID.
   */
  async function getHabit(id: string): Promise<Habit | null> {
    return await repo.getHabitById(id);
  }

  /**
   * Increment a habit (mark as done on a given date).
   * Optionally logs to daily note if enabled.
   */
  async function increment(habit: Habit, date?: ISODate): Promise<Habit> {
    const today = date ?? todayISO();

    // Apply domain logic
    const updated = markDone(habit, today);
    updated.count = deriveCount(updated);

    // Persist
    await repo.writeHabit(updated);

    // Optional: log to daily note
    if (opts.autoLogDaily && opts.logToDailyNote) {
      try {
        const dailyPath = await findOrCreateDailyNotePath(today);
        const line = `- ✅ ${updated.title} (${today})`;
        await appendLineToFile(dailyPath, line);
      } catch (e) {
        console.warn('Failed to log habit to daily note:', e);
        // Don't throw; logging is optional
      }
    }

    return updated;
  }

  /**
   * Create a new habit file and return the created habit.
   */
  async function createHabit(
    filename: string,
    title: string,
    trigger?: string,
    schedule?: string
  ): Promise<Habit> {
    const habit: Habit = {
      id: filename,
      title,
      trigger,
      schedule,
      history: [],
      count: 0,
    };

    await repo.createHabitFile(filename, habit);
    return habit;
  }

  /**
   * Helper: find or create daily note at Daily/YYYY-MM-DD.md
   */
  async function findOrCreateDailyNotePath(isoDate: ISODate): Promise<string> {
    const path = `Daily/${isoDate}.md`;
    const f = opts.app.vault.getAbstractFileByPath(path);

    if (!f) {
      const [year, month, day] = isoDate.split('-');
      const dateStr = `${year}-${month}-${day}`;
      await opts.app.vault.create(path, `# ${dateStr}\n\n`);
    }

    return path;
  }

  /**
   * Append a line to a file.
   */
  async function appendLineToFile(path: string, line: string): Promise<void> {
    const f = opts.app.vault.getAbstractFileByPath(path) as TFile | null;
    if (!f || !(f instanceof TFile)) {
      throw new Error(`File not found: ${path}`);
    }

    const content = await opts.app.vault.read(f);
    const newContent = content.endsWith('\n')
      ? content + line + '\n'
      : content + '\n' + line + '\n';

    await opts.app.vault.modify(f, newContent);
  }

  return {
    listHabits,
    getHabit,
    increment,
    createHabit,
  };
};

export type HabitService = ReturnType<typeof createHabitService>;
