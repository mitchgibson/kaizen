/**
 * Settings UI tab for Kaizen plugin.
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import KaizenPlugin from '../../main';

export class KaizenSettingsTab extends PluginSettingTab {
  plugin: KaizenPlugin;

  constructor(app: App, plugin: KaizenPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'Kaizen Settings' });
    containerEl.createEl('p', {
      text: 'Configure how your Kaizen habit tracker works.',
    });

    // Auto-log to daily note toggle
    new Setting(containerEl)
      .setName('Auto-log to Daily Note')
      .setDesc(
        'When enabled, marking a habit done will automatically add an entry to your daily note.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoLogToDailyNote)
          .onChange(async (value) => {
            this.plugin.settings.autoLogToDailyNote = value;
            await this.plugin.saveSettings();
          })
      );

    // Derive count from history toggle
    new Setting(containerEl)
      .setName('Derive Count from History')
      .setDesc(
        'If enabled, the count will be calculated from the history array. If disabled, an explicit count value in frontmatter is used.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.deriveCountFromHistory)
          .onChange(async (value) => {
            this.plugin.settings.deriveCountFromHistory = value;
            await this.plugin.saveSettings();
          })
      );

    // Habit field name
    new Setting(containerEl)
      .setName('Habit Field Name')
      .setDesc('The frontmatter field used to identify habit files.')
      .addText((text) =>
        text
          .setPlaceholder('habit')
          .setValue(this.plugin.settings.habitField)
          .onChange(async (value) => {
            this.plugin.settings.habitField = value || 'habit';
            await this.plugin.saveSettings();
          })
      );

    // Open in sidebar toggle
    new Setting(containerEl)
      .setName('Open in Sidebar')
      .setDesc('When enabled, the habit view will open in the right sidebar with a minimalistic design.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openInSidebar)
          .onChange(async (value) => {
            this.plugin.settings.openInSidebar = value;
            await this.plugin.saveSettings();
          })
      );

    // Developer logging toggle
    new Setting(containerEl)
      .setName('Developer Logging')
      .setDesc('Enable debug logging to console.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.devLoggingEnabled)
          .onChange(async (value) => {
            this.plugin.settings.devLoggingEnabled = value;
            await this.plugin.saveSettings();
          })
      );

    // Info section
    containerEl.createEl('hr');
    containerEl.createEl('h3', { text: 'Habit Format' });
    containerEl.createEl('p', {
      text: 'Habit files should have a frontmatter section with:',
    });

    const codeBlock = containerEl.createEl('pre');
    codeBlock.setText(
      `---
title: My Habit
habit: true
trigger: Morning routine
schedule: daily
history:
  - 2025-01-01
  - 2025-01-02
---`
    );
  }
}
