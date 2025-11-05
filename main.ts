/**
 * Kaizen Plugin - Main entry point
 * Habit tracker focusing on building habits over actions.
 */

import { Plugin, Notice } from 'obsidian';
import { createHabitRepo } from './src/adapters/repo/habitRepo';
import { createHabitService } from './src/services/habitService';
import { createSidebarView, VIEW_TYPE_SIDEBAR } from './src/ui/sidebarView';
import { createFullPageView, VIEW_TYPE_FULL } from './src/ui/fullPageView';
import { KaizenSettingsTab } from './src/settings/settingsTab';
import {
  KaizenSettings,
  DEFAULT_SETTINGS,
} from './src/settings/settings';

export default class KaizenPlugin extends Plugin {
  settings: KaizenSettings;

  async onload() {
    await this.loadSettings();

    if (this.settings.devLoggingEnabled) {
      console.log('Kaizen plugin loaded with settings:', this.settings);
    }

    // Create repository and service
    const repo = createHabitRepo(this.app);
    const service = createHabitService(repo, {
      autoLogDaily: this.settings.autoLogToDailyNote,
      logToDailyNote: this.settings.autoLogToDailyNote,
      app: this.app,
    });

    // Ribbon icon
    this.addRibbonIcon('check-circle', 'Kaizen Habits', async (evt: MouseEvent) => {
      await this.openHabitView();
    });

    // Register views
    const SidebarView = createSidebarView(service);
    const FullPageView = createFullPageView(service);
    
    this.registerView(
      VIEW_TYPE_SIDEBAR,
      (leaf) => new SidebarView(leaf)
    );
    this.registerView(
      VIEW_TYPE_FULL,
      (leaf) => new FullPageView(leaf)
    );

    // Commands
    this.addCommand({
      id: 'kaizen-open-sidebar',
      name: 'Open Kaizen Sidebar',
      callback: async () => {
        await this.openHabitView();
      },
    });

    this.addCommand({
      id: 'kaizen-open-full',
      name: 'Open Kaizen Analytics',
      callback: () => {
        this.app.workspace.getLeaf('split', 'vertical').setViewState({
          type: VIEW_TYPE_FULL,
        });
      },
    });

    this.addCommand({
      id: 'kaizen-create-habit',
      name: 'Create New Habit',
      callback: async () => {
        const habitName = await this.promptForHabitName();
        if (habitName) {
          try {
            const filename = `Habits/${habitName}.md`;
            await service.createHabit(filename, habitName);
            new Notice(`✅ Habit "${habitName}" created!`);
          } catch (err) {
            new Notice(`❌ Failed to create habit: ${err}`);
          }
        }
      },
    });

    // Settings tab
    this.addSettingTab(new KaizenSettingsTab(this.app, this));
  }

  onunload() {
    if (this.settings.devLoggingEnabled) {
      console.log('Kaizen plugin unloaded');
    }
  }

  private promptForHabitName(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.placeholder = 'Enter habit name...';
      input.style.padding = '8px';
      input.style.marginBottom = '8px';
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';

      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.backgroundColor = 'white';
      modal.style.padding = '20px';
      modal.style.borderRadius = '8px';
      modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      modal.style.zIndex = '10000';
      modal.style.maxWidth = '400px';
      modal.style.width = '90%';

      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.zIndex = '9999';

      const label = document.createElement('label');
      label.textContent = 'Habit Name:';
      label.style.display = 'block';
      label.style.marginBottom = '8px';

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '8px';
      btnContainer.style.marginTop = '16px';

      const okBtn = document.createElement('button');
      okBtn.textContent = 'Create';
      okBtn.style.padding = '8px 16px';
      okBtn.style.cursor = 'pointer';
      okBtn.style.flex = '1';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.padding = '8px 16px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.flex = '1';

      const cleanup = () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
      };

      okBtn.onclick = () => {
        cleanup();
        resolve(input.value || null);
      };

      cancelBtn.onclick = () => {
        cleanup();
        resolve(null);
      };

      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          okBtn.click();
        } else if (e.key === 'Escape') {
          cancelBtn.click();
        }
      };

      modal.appendChild(label);
      modal.appendChild(input);
      btnContainer.appendChild(okBtn);
      btnContainer.appendChild(cancelBtn);
      modal.appendChild(btnContainer);

      document.body.appendChild(overlay);
      document.body.appendChild(modal);

      input.focus();
    });
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async openHabitView() {
    const { workspace } = this.app;
    
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR)[0];
    
    if (!leaf) {
      if (this.settings.openInSidebar) {
        // Open in right sidebar
        const rightLeaf = workspace.getRightLeaf(false);
        if (rightLeaf) {
          leaf = rightLeaf;
        } else {
          leaf = workspace.getLeaf('split', 'vertical');
        }
      } else {
        // Open in main area
        leaf = workspace.getLeaf('split', 'vertical');
      }
      
      await leaf.setViewState({
        type: VIEW_TYPE_SIDEBAR,
        active: true,
      });
    }
    
    workspace.revealLeaf(leaf);
  }
}
