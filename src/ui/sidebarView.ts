/**
 * Sidebar view for Kaizen habits.
 * Card-based layout with reactive updates and inline creation.
 */

import { ItemView, WorkspaceLeaf, Notice, MarkdownView } from 'obsidian';
import { Habit, currentStreak, isDoneToday, deriveCount, longestStreak, ISODate } from '../domain/habit';
import { HabitService } from '../services/habitService';
import { DayChangeDetector } from '../utils/dayChangeDetector';

export const VIEW_TYPE_SIDEBAR = 'kaizen-sidebar';

export const createSidebarView = (habitService: HabitService) => {
  class SidebarView extends ItemView {
    private habits: Habit[] = [];
    private fileWatcherRef: any = null;
    private isInSidebar: boolean = false;
    private dayChangeDetector: DayChangeDetector = new DayChangeDetector();

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
      await this.loadAndRender();
      this.registerFileWatcher();
      this.registerDayChangeDetector();
    }

    async onClose() {
      this.unregisterFileWatcher();
      this.unregisterDayChangeDetector();
    }

    async loadAndRender() {
      this.habits = await habitService.listHabits();
      this.detectLocation();
      this.render();
    }

    detectLocation() {
      // Check if this leaf is in the right or left sidebar
      const leaf = this.leaf;
      const leftSplit = this.app.workspace.leftSplit;
      const rightSplit = this.app.workspace.rightSplit;
      
      this.isInSidebar = 
        (leftSplit && leftSplit.getRoot() === leaf.getRoot()) ||
        (rightSplit && rightSplit.getRoot() === leaf.getRoot());
    }

    render() {
      const container = this.contentEl;
      container.empty();
      container.addClass('kaizen-sidebar-container');
      
      // Add class for minimalistic sidebar styling
      if (this.isInSidebar) {
        container.addClass('kaizen-in-sidebar');
      } else {
        container.removeClass('kaizen-in-sidebar');
      }

      // Header with create button
      const header = container.createDiv('kaizen-header');
      const headerTop = header.createDiv('kaizen-header-top');
      headerTop.createEl('h3', { text: 'Habits' });
      
      const createBtn = headerTop.createEl('button', {
        text: '+',
        cls: 'kaizen-create-btn',
      });
      createBtn.onclick = () => this.showCreateForm();

      // Stats summary
      if (this.habits.length > 0) {
        const summary = header.createDiv('kaizen-summary');
        const doneToday = this.habits.filter(h => isDoneToday(h)).length;
        summary.createEl('span', {
          text: `${doneToday}/${this.habits.length} done today`,
          cls: 'kaizen-summary-text',
        });
      }

      // Empty state
      if (this.habits.length === 0) {
        const empty = container.createDiv('kaizen-empty-state');
        empty.createEl('div', {
          text: '🌱',
          cls: 'kaizen-empty-icon',
        });
        empty.createEl('p', {
          text: 'No habits yet',
          cls: 'kaizen-empty-title',
        });
        empty.createEl('p', {
          text: 'Click "+ New" to create your first habit',
          cls: 'kaizen-empty-subtitle',
        });
        return;
      }

      // Habit cards
      const listContainer = container.createDiv('kaizen-cards-container');

      for (const habit of this.habits) {
        this.renderHabitCard(listContainer, habit);
      }
    }

    renderHabitCard(container: HTMLElement, habit: Habit) {
      const card = container.createDiv('kaizen-card');
      const doneToday = isDoneToday(habit);
      
      if (doneToday) {
        card.addClass('done-today');
      }

      // Card header with title and done button
      const cardHeader = card.createDiv('kaizen-card-header');
      const titleRow = cardHeader.createDiv('kaizen-title-row');
      
      titleRow.createEl('h4', {
        text: habit.title,
        cls: 'kaizen-card-title',
      });

      // Small done button in top right
      const checkBtn = titleRow.createEl('button', {
        cls: doneToday ? 'kaizen-done-btn-small done' : 'kaizen-done-btn-small',
        attr: { 'aria-label': doneToday ? 'Done today' : 'Mark done' },
      });
      checkBtn.textContent = doneToday ? '✓' : '○';

      checkBtn.onclick = async (e) => {
        e.stopPropagation();
        if (doneToday) {
          new Notice('Already marked done today');
          return;
        }
        
        // Optimistic update
        checkBtn.addClass('done');
        checkBtn.disabled = true;
        checkBtn.textContent = '✓';
        card.addClass('done-today');
        
        // Update stats optimistically
        const count = deriveCount(habit);
        const streak = currentStreak(habit);
        const newCount = count + 1;
        const newStreak = streak + 1;
        const statsValues = card.querySelectorAll('.kaizen-stat-value');
        if (statsValues[0]) statsValues[0].textContent = newCount.toString();
        if (statsValues[1]) statsValues[1].textContent = newStreak.toString();
        
        try {
          const updated = await habitService.increment(habit);
          // Update habit in memory
          const idx = this.habits.findIndex(h => h.id === habit.id);
          if (idx !== -1) {
            this.habits[idx] = updated;
          }
          // Update summary count
          this.updateSummary();
        } catch (err) {
          console.error('Failed to increment habit:', err);
          new Notice('Failed to mark habit done');
          // Revert optimistic update
          checkBtn.removeClass('done');
          checkBtn.disabled = false;
          checkBtn.textContent = '○';
          card.removeClass('done-today');
          // Revert stats
          if (statsValues[0]) statsValues[0].textContent = count.toString();
          if (statsValues[1]) statsValues[1].textContent = streak.toString();
        }
      };

      // Stats grid
      const statsGrid = card.createDiv('kaizen-card-stats');
      
      const count = deriveCount(habit);
      const streak = currentStreak(habit);
      const best = longestStreak(habit);

      this.createStatItem(statsGrid, 'Total', count.toString(), 'kaizen-stat-total');
      this.createStatItem(statsGrid, 'Streak', streak.toString(), 'kaizen-stat-streak');
      this.createStatItem(statsGrid, 'Best', best.toString(), 'kaizen-stat-best');

      // Footer with trigger, schedule, and open note button
      const footer = card.createDiv('kaizen-card-footer');
      
      // Left side: trigger and schedule labels
      const footerLeft = footer.createDiv('kaizen-footer-left');
      
      // Trigger label
      const triggerLabel = footerLeft.createEl('button', {
        cls: habit.trigger ? 'kaizen-footer-label' : 'kaizen-footer-label empty',
      });
      triggerLabel.createEl('span', { text: '🎯', cls: 'kaizen-footer-icon' });
      triggerLabel.createEl('span', {
        text: habit.trigger || 'Add trigger',
        cls: 'kaizen-footer-text',
      });
      
      triggerLabel.onclick = async (e) => {
        e.stopPropagation();
        await this.openHabitNote(habit.id, 'trigger');
      };

      // Schedule label
      const scheduleLabel = footerLeft.createEl('button', {
        cls: habit.schedule ? 'kaizen-footer-label' : 'kaizen-footer-label empty',
      });
      scheduleLabel.createEl('span', { text: '📅', cls: 'kaizen-footer-icon' });
      scheduleLabel.createEl('span', {
        text: habit.schedule || 'Add schedule',
        cls: 'kaizen-footer-text',
      });
      
      scheduleLabel.onclick = async (e) => {
        e.stopPropagation();
        await this.openHabitNote(habit.id, 'schedule');
      };

      // Right side: open note button
      const openBtn = footer.createEl('button', {
        text: '📝',
        cls: 'kaizen-open-btn-footer',
        attr: { 'aria-label': 'Open note' },
      });

      openBtn.onclick = async (e) => {
        e.stopPropagation();
        await this.openHabitNote(habit.id);
      };

    }

    async openHabitNote(habitId: string, focusField?: 'trigger' | 'schedule') {
      try {
        const file = this.app.vault.getAbstractFileByPath(habitId);
        if (file) {
          const leaf = this.app.workspace.getLeaf('tab');
          await leaf.openFile(file as any);
          
          // If focus field specified, try to focus it
          if (focusField) {
            // Wait a bit for the editor to load
            setTimeout(() => {
              const view = this.app.workspace.getActiveViewOfType(MarkdownView);
              if (view && view.editor) {
                const content = view.editor.getValue();
                const regex = new RegExp(`^${focusField}:\\s*(.*)$`, 'im');
                const match = content.match(regex);
                
                if (match) {
                  const line = content.substring(0, match.index).split('\n').length - 1;
                  view.editor.setCursor({ line, ch: match[0].length });
                  view.editor.focus();
                }
              }
            }, 100);
          }
        }
      } catch (err) {
        console.error('Failed to open habit note:', err);
      }
    }

    createStatItem(container: HTMLElement, label: string, value: string, cls?: string) {
      const item = container.createDiv('kaizen-stat-item');
      if (cls) item.addClass(cls);
      
      item.createEl('div', {
        text: value,
        cls: 'kaizen-stat-value',
      });
      item.createEl('div', {
        text: label,
        cls: 'kaizen-stat-label',
      });
    }

    updateSummary() {
      const summaryEl = this.contentEl.querySelector('.kaizen-summary-text');
      if (summaryEl && this.habits.length > 0) {
        const doneToday = this.habits.filter(h => isDoneToday(h)).length;
        summaryEl.textContent = `${doneToday}/${this.habits.length} done today`;
      }
    }

    registerFileWatcher() {
      // Listen for file modifications
      this.fileWatcherRef = this.app.vault.on('modify', async (file) => {
        // Check if modified file is a habit
        const habitIds = this.habits.map(h => h.id);
        if (habitIds.includes(file.path)) {
          console.log('[Kaizen] Habit file modified:', file.path);
          // Reload just this habit's data
          const updatedHabit = await habitService.getHabit(file.path);
          if (updatedHabit) {
            const idx = this.habits.findIndex(h => h.id === file.path);
            if (idx !== -1) {
              this.habits[idx] = updatedHabit;
              // Re-render to show updated trigger/schedule
              this.render();
            }
          }
        }
      });

      // Listen for file deletions
      this.registerEvent(this.app.vault.on('delete', async (file) => {
        const habitIds = this.habits.map(h => h.id);
        if (habitIds.includes(file.path)) {
          console.log('[Kaizen] Habit file deleted:', file.path);
          // Remove from habits list
          this.habits = this.habits.filter(h => h.id !== file.path);
          // Re-render to show updated list
          this.render();
        }
      }));

      // Also listen for metadata changes (frontmatter)
      this.app.metadataCache.on('changed', async (file) => {
        const habitIds = this.habits.map(h => h.id);
        if (habitIds.includes(file.path)) {
          console.log('[Kaizen] Habit metadata changed:', file.path);
          const updatedHabit = await habitService.getHabit(file.path);
          if (updatedHabit) {
            const idx = this.habits.findIndex(h => h.id === file.path);
            if (idx !== -1) {
              this.habits[idx] = updatedHabit;
              this.render();
            }
          }
        }
      });
    }

    unregisterFileWatcher() {
      if (this.fileWatcherRef) {
        this.app.vault.offref(this.fileWatcherRef);
        this.fileWatcherRef = null;
      }
    }

    registerDayChangeDetector() {
      console.log("Registering Day Change Detector");
      // Start day change detector and set up callback
      this.dayChangeDetector.start((oldDate: ISODate, newDate: ISODate) => {
        console.log(`[Kaizen] Day rolled over from ${oldDate} to ${newDate}, refreshing habits`);
        // Refresh all habits when day changes
        this.onDayChanged(oldDate, newDate);
      });
    }

    unregisterDayChangeDetector() {
      console.log("Unregistering Day Change Detector");
      this.dayChangeDetector.stop();
    }

    async onDayChanged(oldDate: ISODate, newDate: ISODate) {
      // Reload and render habits when day changes
      await this.loadAndRender();
      
      // Show a subtle notification that habits have been reset
      const doneCount = this.habits.filter(h => isDoneToday(h)).length;
      if (doneCount > 0) {
        new Notice(`🌅 New day! ${doneCount} habit${doneCount === 1 ? '' : 's'} already done today.`);
      }
    }

    showCreateForm() {
      const container = this.contentEl;
      const existingForm = container.querySelector('.kaizen-create-form');
      if (existingForm) {
        existingForm.remove();
        return;
      }

      const form = container.createDiv('kaizen-create-form');
      
      const formCard = form.createDiv('kaizen-form-card');
      formCard.createEl('h4', { text: 'Create New Habit' });
      
      // Habit name
      const nameLabel = formCard.createEl('label', {
        text: 'Habit Name',
        cls: 'kaizen-form-label',
      });
      const nameInput = formCard.createEl('input', {
        type: 'text',
        placeholder: 'e.g., Morning Exercise',
        cls: 'kaizen-form-input',
      });
      
      // Trigger field
      const triggerLabel = formCard.createEl('label', {
        text: 'Trigger (optional)',
        cls: 'kaizen-form-label',
      });
      const triggerInput = formCard.createEl('input', {
        type: 'text',
        placeholder: 'e.g., After morning coffee',
        cls: 'kaizen-form-input',
      });
      
      // Schedule dropdown
      const scheduleLabel = formCard.createEl('label', {
        text: 'Schedule (optional)',
        cls: 'kaizen-form-label',
      });
      const scheduleSelect = formCard.createEl('select', {
        cls: 'kaizen-form-select',
      });
      
      const scheduleOptions = [
        { value: '', label: 'Select schedule...' },
        { value: 'daily', label: 'Daily' },
        { value: 'every other day', label: 'Every other day' },
        { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
        { value: 'weekends', label: 'Weekends (Sat-Sun)' },
        { value: 'weekly', label: 'Weekly' },
        { value: '3x per week', label: '3x per week' },
        { value: 'monthly', label: 'Monthly' },
      ];
      
      scheduleOptions.forEach(opt => {
        const option = scheduleSelect.createEl('option', {
          value: opt.value,
          text: opt.label,
        });
      });
      
      const buttons = formCard.createDiv('kaizen-form-buttons');
      
      const cancelBtn = buttons.createEl('button', {
        text: 'Cancel',
        cls: 'kaizen-form-btn kaizen-form-cancel',
      });
      
      const createBtn = buttons.createEl('button', {
        text: 'Create',
        cls: 'kaizen-form-btn kaizen-form-create',
      });

      const cleanup = () => form.remove();

      cancelBtn.onclick = cleanup;

      const doCreate = async () => {
        const habitName = nameInput.value.trim();
        if (!habitName) {
          new Notice('Please enter a habit name');
          nameInput.focus();
          return;
        }

        try {
          createBtn.disabled = true;
          createBtn.textContent = 'Creating...';
          
          const filename = `Habits/${habitName}.md`;
          const trigger = triggerInput.value.trim() || undefined;
          const schedule = scheduleSelect.value || undefined;
          
          console.log('[Kaizen] Creating habit:', habitName);
          await habitService.createHabit(filename, habitName, trigger, schedule);
          console.log('[Kaizen] Habit created, reloading...');
          
          new Notice(`✅ Habit "${habitName}" created!`);
          cleanup();
          
          // Wait for Obsidian metadata cache to update
          console.log('[Kaizen] Waiting for metadata cache...');
          await new Promise(resolve => setTimeout(resolve, 150));
          
          console.log('[Kaizen] Calling loadAndRender...');
          await this.loadAndRender();
          console.log('[Kaizen] LoadAndRender complete. Habit count:', this.habits.length);
        } catch (err) {
          console.error('[Kaizen] Failed to create habit:', err);
          new Notice('Failed to create habit');
          createBtn.disabled = false;
          createBtn.textContent = 'Create';
        }
      };

      createBtn.onclick = doCreate;
      nameInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerInput.focus();
        } else if (e.key === 'Escape') {
          cleanup();
        }
      };
      
      triggerInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          scheduleSelect.focus();
        } else if (e.key === 'Escape') {
          cleanup();
        }
      };
      
      scheduleSelect.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doCreate();
        } else if (e.key === 'Escape') {
          cleanup();
        }
      };

      // Insert at top
      const header = container.querySelector('.kaizen-header');
      if (header && header.nextSibling) {
        container.insertBefore(form, header.nextSibling);
      } else {
        container.appendChild(form);
      }

      nameInput.focus();
    }
  }

  return SidebarView;
};
