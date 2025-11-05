/**
 * Settings interface and defaults for Kaizen plugin.
 */

export interface KaizenSettings {
  autoLogToDailyNote: boolean;
  deriveCountFromHistory: boolean;
  habitField: string;
  devLoggingEnabled: boolean;
  openInSidebar: boolean;
}

export const DEFAULT_SETTINGS: KaizenSettings = {
  autoLogToDailyNote: false, // off by default
  deriveCountFromHistory: true,
  habitField: 'habit',
  devLoggingEnabled: false,
  openInSidebar: true, // open in right sidebar by default
};
