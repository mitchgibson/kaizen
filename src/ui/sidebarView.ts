/**
 * Compact sidebar view for Kaizen habits.
 * Shows habit list with quick-access increment buttons.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Habit, currentStreak, isDoneToday, deriveCount } from '../domain/habit';
import { HabitService } from '../services/habitService';

export const VIEW_TYPE_SIDEBAR = 'kaizen-sidebar';

export const createSidebarView = (habitService: HabitService) => {
  class SidebarView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }

    getViewType() {
      return VIEW_TYPE_SIDEBAR;
    }

    getDisplayText() {
      return 'Kaizen';
    }

    getIcon() {
      return 'check-circle';
    }

    async onOpen() {
      await this.render();
    }

    async render() {
      const container = this.contentEl;
      container.empty();

      // Header
      const header = container.createDiv('kaizen-header');
      header.createEl('h3', { text: 'Kaizen Habits' });

      const habits = await habitService.listHabits();

      if (habits.length === 0) {
        container.createEl('p', {
          text: 'No habits yet. Create one with habit: true in frontmatter.',
          cls: 'kaizen-empty',
        });
        return;
      }

      // Habit list
      const listContainer = container.createDiv('kaizen-list');

      for (const habit of habits) {
        this.renderHabitRow(listContainer, habit);
      }
    }

    renderHabitRow(container: HTMLElement, habit: Habit) {
      const row = container.createDiv('kaizen-row');

      // Habit info section
      const info = row.createDiv('kaizen-info');
      const title = info.createEl('div', {
        text: habit.title,
        cls: 'kaizen-title',
      });

      // Count and streak
      const stats = info.createDiv('kaizen-stats');
      const count = deriveCount(habit);
      const streak = currentStreak(habit);
      stats.createEl('span', {
        text: `${count} done`,
        cls: 'kaizen-count',
      });
      stats.createEl('span', {
        text: `🔥 ${streak}`,
        cls: 'kaizen-streak',
      });

      // Action buttons
      const actions = row.createDiv('kaizen-actions');

      const doneToday = isDoneToday(habit);
      const checkBtn = actions.createEl('button', {
        text: doneToday ? '✅' : '◯',
        cls: 'kaizen-btn kaizen-check-btn',
      });
      checkBtn.classList.toggle('done', doneToday);

      checkBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          await habitService.increment(habit);
          await this.render();
        } catch (err) {
          console.error('Failed to increment habit:', err);
        }
      };

      // Open note link
      const openBtn = actions.createEl('button', {
        text: '📝',
        cls: 'kaizen-btn kaizen-open-btn',
      });
      openBtn.title = 'Open habit note';

      openBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          const file = this.app.vault.getAbstractFileByPath(habit.id);
          if (file) {
            const leaf = this.app.workspace.getLeaf('tab');
            await leaf.openFile(file as any);
          }
        } catch (err) {
          console.error('Failed to open habit note:', err);
        }
      };
    }
  }

  return SidebarView;
};
