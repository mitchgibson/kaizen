import { describe, it, expect } from 'vitest';
import { currentStreak, Habit } from './habit';

describe('currentStreak', () => {
  /**
   * Helper to create a habit with given history dates
   */
  const createHabit = (history: string[]): Habit => ({
    id: 'test-habit',
    title: 'Test Habit',
    history: history.sort(),
  });

  describe('consecutive days', () => {
    it('should return 3 when last 3 days are consecutive and completed, current day not completed', () => {
      const habit = createHabit(['2025-11-09', '2025-11-10', '2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(3);
    });

    it('should return 1 when only yesterday is completed and current day is not', () => {
      const habit = createHabit(['2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(1);
    });

    it('should return 4 when last 4 days are consecutive and completed, current day not completed', () => {
      const habit = createHabit(['2025-11-08', '2025-11-09', '2025-11-10', '2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(4);
    });

    it('should include current day in streak if completed today', () => {
      const habit = createHabit(['2025-11-09', '2025-11-10', '2025-11-11', '2025-11-12']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(4);
    });

    it('should include current day in streak if completed today, even if not consecutive', () => {
      const habit = createHabit(['2025-11-09', '2025-11-11', '2025-11-12']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(2);
    });

    it('should show streak when today not completed', () => {
      const habit = createHabit(['2025-11-09', '2025-11-10', '2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(3);
    })
  });

  describe('broken streaks', () => {
    it('should return 1 when yesterday is completed but day before is missing', () => {
      const habit = createHabit(['2025-11-09', '2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(1);
    });

    it('should return 0 when current day and yesterday are both incomplete', () => {
      const habit = createHabit(['2025-11-09', '2025-11-10']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(0);
    });

    it('should return 0 when history is empty', () => {
      const habit = createHabit([]);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(0);
    });

    it('should return 0 when history exists but streak ended more than 1 day ago', () => {
      const habit = createHabit(['2025-11-08', '2025-11-09', '2025-11-10']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(0);
    });
  });

  describe('current day scenarios', () => {
    it('should include today if completed, even without yesterday', () => {
      const habit = createHabit(['2025-11-12']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(1);
    });

    it('should return 2 when both today and yesterday are completed', () => {
      const habit = createHabit(['2025-11-11', '2025-11-12']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(2);
    });

    it('should count consecutive days including today', () => {
      const habit = createHabit(['2025-11-09', '2025-11-10', '2025-11-11', '2025-11-12']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(4);
    });

    it('should not count today if not completed, starting from yesterday', () => {
      const habit = createHabit(['2025-11-10', '2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle single day completed yesterday', () => {
      const habit = createHabit(['2025-11-11']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(1);
    });

    it('should return 0 when only old completions exist', () => {
      const habit = createHabit(['2025-11-01', '2025-11-02', '2025-11-03']);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(0);
    });

    it('should handle future dates in history gracefully', () => {
      const habit = createHabit(['2025-11-12', '2025-11-13', '2025-11-14']);
      // Current is 2025-11-12, so 2025-11-13 and 2025-11-14 are "future"
      // but algorithm should still count backwards from today
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(1); // Only today counts as a consecutive day
    });

    it('should handle duplicate dates in history', () => {
      const habit = createHabit(['2025-11-10', '2025-11-10', '2025-11-11']);
      // Set deduplicates, so should work correctly
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(2);
    });
  });

  describe('long streaks', () => {
    it('should calculate 30-day streak correctly', () => {
      const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date('2025-10-14');
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
      const habit = createHabit(dates);
      const streak = currentStreak(habit, '2025-11-12');
      expect(streak).toBe(30);
    });

    it('should correctly identify where long streak breaks', () => {
      const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date('2025-10-14');
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
      // Remove day 15 to break the streak
      const broken = dates.filter((_, i) => i !== 15);
      const habit = createHabit(broken);
      const streak = currentStreak(habit, '2025-11-12');
      // Should only count from Nov 12 backwards until the break on Oct 29
      expect(streak).toBe(14); // Oct 30 - Nov 12
    });
  });

  describe('default now parameter', () => {
    it('should use current date when now parameter is not provided', () => {
      // This test verifies the function accepts default parameter
      // We can't easily test the actual system date, but we can verify it doesn't throw
      const habit = createHabit(['2025-11-12', '2025-11-11']);
      // Should not throw
      expect(() => currentStreak(habit)).not.toThrow();
    });
  });

  describe('real-world scenarios', () => {
    it('scenario: user completes daily habit, checking before marking today', () => {
      // Completed: Nov 9, 10, 11
      // Today is Nov 12, not yet marked
      const habit = createHabit(['2025-11-09', '2025-11-10', '2025-11-11']);
      expect(currentStreak(habit, '2025-11-12')).toBe(3);
    });

    it('scenario: user misses one day in the middle', () => {
      // Completed: Nov 9, 11 (missed Nov 10)
      // Today is Nov 12, not yet marked
      const habit = createHabit(['2025-11-09', '2025-11-11']);
      expect(currentStreak(habit, '2025-11-12')).toBe(1);
    });

    it('scenario: user just marked todays habit', () => {
      // Completed: Nov 9, 10, 11, 12 (today)
      // Today is Nov 12, already marked
      const habit = createHabit(['2025-11-09', '2025-11-10', '2025-11-11', '2025-11-12']);
      expect(currentStreak(habit, '2025-11-12')).toBe(4);
    });

    it('scenario: first day of new streak after gap', () => {
      // Completed: Nov 1-5, then gap, then Nov 11, 12
      // Today is Nov 12
      const habit = createHabit([
        '2025-11-01', '2025-11-02', '2025-11-03', '2025-11-04', '2025-11-05',
        '2025-11-11', '2025-11-12'
      ]);
      expect(currentStreak(habit, '2025-11-12')).toBe(2);
    });
  });
});
