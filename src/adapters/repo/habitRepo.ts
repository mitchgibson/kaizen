/**
 * Repository adapter for persisting habits.
 * Handles reading/writing YAML frontmatter and habit data to Obsidian vault files.
 */

import * as yaml from 'js-yaml';
import { App, TFile } from 'obsidian';
import { Habit, ISODate } from '../../domain/habit';

export const createHabitRepo = (app: App) => {
  const getMarkdownFiles = (): TFile[] => app.vault.getMarkdownFiles();

  /**
   * Read a file's content by path.
   */
  async function readFile(path: string): Promise<string> {
    const f = app.vault.getAbstractFileByPath(path) as TFile | null;
    if (!f || !(f instanceof TFile)) {
      throw new Error(`File not found: ${path}`);
    }
    return await app.vault.read(f);
  }

  /**
   * Convert history array to ISO date strings (YYYY-MM-DD only, no time/timezone).
   * Handles Date objects from YAML parsing and string dates.
   */
  function normalizeHistory(history: any): ISODate[] {
    if (!Array.isArray(history)) return [];
    return history
      .map((item: any) => {
        if (item instanceof Date) {
          // Extract only the date part (YYYY-MM-DD) using UTC to avoid timezone issues
          const year = item.getUTCFullYear();
          const month = String(item.getUTCMonth() + 1).padStart(2, '0');
          const day = String(item.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        // If it's a string, extract only the YYYY-MM-DD part (strip time if present)
        const str = String(item);
        const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : str;
      })
      .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
  }

  /**
   * Parse YAML frontmatter from markdown content.
   * Returns the parsed object or null if no frontmatter found.
   */
  function parseFrontmatter(content: string): Record<string, any> | null {
    const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return null;
    try {
      return yaml.load(m[1]) as Record<string, any>;
    } catch (e) {
      console.error('Failed to parse frontmatter:', e);
      return null;
    }
  }

  /**
   * Find all habits marked with a habit field in frontmatter.
   * By default, looks for `habit: true` or `habit: "true"`.
   */
  async function findAllHabits(
    tagOrField: string = 'habit'
  ): Promise<Habit[]> {
    const files = getMarkdownFiles();
    const out: Habit[] = [];

    for (const f of files) {
      const cache = app.metadataCache.getFileCache(f);
      const fm = cache?.frontmatter;

      if (fm && (fm[tagOrField] === true || fm[tagOrField] === 'true')) {
        try {
          const raw = await app.vault.read(f);
          const parsed = parseFrontmatter(raw) || {};

          out.push({
            id: f.path,
            title: parsed.title ?? f.basename,
            trigger: parsed.trigger,
            schedule: parsed.schedule,
            history: normalizeHistory(parsed.history),
            count: parsed.count,
          });
        } catch (e) {
          console.error(`Error reading habit file ${f.path}:`, e);
        }
      }
    }

    return out;
  }

  /**
   * Write/update a habit to its file.
   * Updates frontmatter and preserves the body content.
   */
  async function writeHabit(habit: Habit): Promise<void> {
    const f = app.vault.getAbstractFileByPath(habit.id) as TFile | null;
    if (!f) {
      throw new Error(`File not found: ${habit.id}`);
    }

    const content = await app.vault.read(f);
    const m = content.match(/^---\n([\s\S]*?)\n---\n?/);

    // Parse existing frontmatter or create new object
    let fmObj: Record<string, any> = {};
    if (m) {
      try {
        fmObj = (yaml.load(m[1]) as Record<string, any>) || {};
      } catch (e) {
        console.error('Failed to parse existing frontmatter:', e);
      }
    }

    // Update frontmatter fields
    fmObj.title = habit.title;
    if (habit.trigger) fmObj.trigger = habit.trigger;
    if (habit.schedule) fmObj.schedule = habit.schedule;
    fmObj.history = habit.history.sort();
    if (habit.count !== undefined) {
      fmObj.count = habit.count;
    }
    // Always ensure habit field is true
    fmObj.habit = true;

    // Reconstruct file content
    const newFront = `---\n${yaml.dump(fmObj)}---\n`;
    const rest = m ? content.slice(m[0].length) : content;

    await app.vault.modify(f, newFront + rest);
  }

  /**
   * Create a new habit file.
   * Auto-creates parent folder if it doesn't exist.
   */
  async function createHabitFile(
    filename: string,
    habit: Habit
  ): Promise<void> {
    // Ensure parent folder exists
    const parts = filename.split('/');
    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      const folder = app.vault.getAbstractFileByPath(folderPath);
      if (!folder) {
        await app.vault.createFolder(folderPath);
      }
    }

    const fm = {
      title: habit.title,
      habit: true,
      trigger: habit.trigger || '',
      schedule: habit.schedule || '',
      history: habit.history,
      count: habit.count || 0,
    };

    const frontmatter = `---\n${yaml.dump(fm)}---\n`;
    const body =
      '\n# ' +
      habit.title +
      '\n\n' +
      (habit.trigger ? `**Trigger**: ${habit.trigger}\n\n` : '') +
      (habit.schedule ? `**Schedule**: ${habit.schedule}\n\n` : '') +
      '## Progress\n\n_Track your habit progress here._\n';

    await app.vault.create(filename, frontmatter + body);
  }

  /**
   * Get a single habit by ID (file path).
   */
  async function getHabitById(id: string): Promise<Habit | null> {
    try {
      const content = await readFile(id);
      const parsed = parseFrontmatter(content);

      if (!parsed) return null;

      return {
        id,
        title: parsed.title ?? id,
        trigger: parsed.trigger,
        schedule: parsed.schedule,
        history: normalizeHistory(parsed.history),
        count: parsed.count,
      };
    } catch (e) {
      console.error(`Error reading habit ${id}:`, e);
      return null;
    }
  }

  return {
    findAllHabits,
    readFile,
    writeHabit,
    createHabitFile,
    getHabitById,
  };
};

export type HabitRepo = ReturnType<typeof createHabitRepo>;
