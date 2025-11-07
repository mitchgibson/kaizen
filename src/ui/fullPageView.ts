/**
 * Full-page view for detailed habit analytics.
 * Shows streaks, completion rates, heatmaps, and detailed history.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import {
  Habit,
  currentStreak,
  longestStreak,
  isDoneToday,
  completionRate,
  deriveCount,
  ISODate,
} from '../domain/habit';
import { HabitService } from '../services/habitService';
import { DayChangeDetector } from '../utils/dayChangeDetector';

export const VIEW_TYPE_FULL = 'kaizen-full';

export const createFullPageView = (habitService: HabitService) => {
  class FullPageView extends ItemView {
    private dayChangeDetector: DayChangeDetector = new DayChangeDetector();

    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }

    getViewType() {
      return VIEW_TYPE_FULL;
    }

    getDisplayText() {
      return 'Kaizen Full';
    }

    getIcon() {
      return 'bar-chart-2';
    }

    async onClose() {
      this.unregisterDayChangeDetector();
    }

    async onOpen() {
      await this.render();
      this.registerDayChangeDetector();
    }

    async render() {
      const container = this.contentEl;
      container.empty();

      const header = container.createDiv('kaizen-full-header');
      header.createEl('h2', { text: 'Habit Analytics' });

      const habits = await habitService.listHabits();

      if (habits.length === 0) {
        container.createEl('p', {
          text: 'No habits to display. Create one with habit: true in frontmatter.',
          cls: 'kaizen-empty',
        });
        return;
      }

      const content = container.createDiv('kaizen-full-content');

      for (const habit of habits) {
        this.renderHabitDetail(content, habit);
      }
    }

    renderHabitDetail(container: HTMLElement, habit: Habit) {
      const card = container.createDiv('kaizen-habit-card');

      // Title and meta
      const titleArea = card.createDiv('kaizen-habit-title-area');
      titleArea.createEl('h3', { text: habit.title, cls: 'kaizen-habit-name' });

      if (habit.trigger) {
        titleArea.createEl('div', {
          text: `🎯 Trigger: ${habit.trigger}`,
          cls: 'kaizen-meta-trigger',
        });
      }

      if (habit.schedule) {
        titleArea.createEl('div', {
          text: `📅 Schedule: ${habit.schedule}`,
          cls: 'kaizen-meta-schedule',
        });
      }

      // Stats grid
      const statsGrid = card.createDiv('kaizen-stats-grid');

      const count = deriveCount(habit);
      const streak = currentStreak(habit);
      const longest = longestStreak(habit);
      const rate30 = completionRate(habit, 30);

      const statCards = [
        { label: 'Total', value: count },
        { label: 'Streak', value: streak },
        { label: 'Best', value: longest },
        { label: '30-day %', value: `${rate30}%` },
      ];

      for (const stat of statCards) {
        const statCard = statsGrid.createDiv('kaizen-stat-card');
        statCard.createEl('div', { text: stat.label, cls: 'stat-label' });
        statCard.createEl('div', {
          text: String(stat.value),
          cls: 'stat-value',
        });
      }

      // Done today indicator
      const doneToday = isDoneToday(habit);
      const statusArea = card.createDiv('kaizen-status-area');
      statusArea.createEl('span', {
        text: doneToday ? '✅ Done Today' : '⭕ Not Done Today',
        cls: `status ${doneToday ? 'done' : 'pending'}`,
      });

      // Quick action button
      const actionBtn = statusArea.createEl('button', {
        text: doneToday ? '✅ Mark' : '◯ Mark Done',
        cls: 'kaizen-action-btn',
      });

      actionBtn.onclick = async () => {
        try {
          await habitService.increment(habit);
          await this.render();
        } catch (err) {
          console.error('Failed to increment habit:', err);
        }
      };

      // Recent history
      const historyArea = card.createDiv('kaizen-history-area');
      historyArea.createEl('h4', { text: 'Recent History' });

      const recentDates = habit.history.slice(-14).reverse();

      if (recentDates.length === 0) {
        historyArea.createEl('p', {
          text: 'No history yet.',
          cls: 'kaizen-history-empty',
        });
      } else {
        const historyList = historyArea.createEl('ul', { cls: 'kaizen-history-list' });
        for (const date of recentDates) {
          historyList.createEl('li', { text: date });
        }
      }

      // Open note link
      const footerArea = card.createDiv('kaizen-card-footer');
      const openLink = footerArea.createEl('a', {
        text: 'Open Note',
        href: '#',
        cls: 'kaizen-open-link',
      });

      openLink.onclick = async (e) => {
        e.preventDefault();
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

    registerDayChangeDetector() {
      // Start day change detector and set up callback
      this.dayChangeDetector.start((oldDate: ISODate, newDate: ISODate) => {
        console.log(`[Kaizen] Day rolled over in full view from ${oldDate} to ${newDate}, refreshing`);
        // Refresh the full view when day changes
        this.render();
      });
    }

    unregisterDayChangeDetector() {
      this.dayChangeDetector.stop();
    }
  }

  return FullPageView;
};
