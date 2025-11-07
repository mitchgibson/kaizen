/**
 * Utility for detecting when the day has changed.
 * Provides callbacks that trigger when the system date rolls over to the next day.
 */

import { todayISO, ISODate } from '../domain/habit';

export type DayChangeCallback = (oldDate: ISODate, newDate: ISODate) => void;

export class DayChangeDetector {
  private lastCheckedDate: ISODate;
  private checkInterval: number | null = null;
  private callbacks: DayChangeCallback[] = [];
  private readonly CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

  constructor() {
    this.lastCheckedDate = todayISO();
  }

  /**
   * Start monitoring for day changes.
   * @param callback Function to call when day changes
   */
  start(callback?: DayChangeCallback): void {
    if (callback) {
      this.callbacks.push(callback);
    }

    // Only start the interval if it's not already running
    if (this.checkInterval === null) {
      this.checkInterval = window.setInterval(this.checkForDayChange.bind(this), this.CHECK_INTERVAL_MS);
      console.debug('[Kaizen] Day change detector started');
    }
  }

  /**
   * Stop monitoring for day changes.
   */
  stop(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.debug('[Kaizen] Day change detector stopped');
    }
  }

  /**
   * Add a callback function to be called when day changes.
   */
  addCallback(callback: DayChangeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove a callback function.
   */
  removeCallback(callback: DayChangeCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Check if day has changed and trigger callbacks if needed.
   * This method is called automatically by the interval.
   */
  private checkForDayChange(): void {
    const currentDate = todayISO();
    
    if (currentDate !== this.lastCheckedDate) {
      console.debug(`[Kaizen] Day changed from ${this.lastCheckedDate} to ${currentDate}`);
      
      // Call all callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(this.lastCheckedDate, currentDate);
        } catch (error) {
          console.error('[Kaizen] Error in day change callback:', error);
        }
      });
      
      this.lastCheckedDate = currentDate;
    }
  }

  /**
   * Get the current date tracker.
   */
  getCurrentDate(): ISODate {
    return this.lastCheckedDate;
  }

  /**
   * Manually trigger a check for day change.
   * Useful after system time changes.
   */
  triggerCheck(): void {
    this.checkForDayChange();
  }
}