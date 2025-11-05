/**
 * Settings interface and defaults for Kaizen plugin.
 */

export interface KaizenSettings {
  autoLogToDailyNote: boolean;
  deriveCountFromHistory: boolean;
  habitField: string;
  devLoggingEnabled: boolean;
}

export const DEFAULT_SETTINGS: KaizenSettings = {
  autoLogToDailyNote: false, // off by default
  deriveCountFromHistory: true,
  habitField: 'habit',
  devLoggingEnabled: false,
};
