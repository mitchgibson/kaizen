# Kaizen — Habit Tracker for Obsidian

Build habits by focusing on **the habit itself**, not the action repeated by the habit.

## Overview

Kaizen is a lightweight habit tracking plugin for Obsidian that helps you track and maintain the habits you want to build. Instead of tracking isolated actions, Kaizen helps you focus on understanding and strengthening the habits themselves through consistent completion tracking, streak monitoring, and visual analytics.

### Key Features

- **Sidebar View**: Quick access to all habits with one-click completion tracking
- **Full Analytics View**: Detailed statistics including current streak, longest streak, and 30-day completion rate
- **Automatic History Tracking**: Maintains a complete history of completions in YAML frontmatter
- **Daily Note Integration**: Optionally log habit completions to your daily notes
- **Pure Domain Logic**: Clean, testable architecture with domain-driven design
- **Markdown-Based**: All habit data stored in YAML frontmatter for future-proof compatibility

## Installation

1. Clone or copy this plugin into your vault's plugin folder:
   ```
   <vault>/.obsidian/plugins/obsidian-kaizen-habits/
   ```

2. Reload Obsidian
3. Enable "Kaizen Habits" in Settings → Community Plugins
4. Access via the ribbon icon or command palette

## Getting Started

### Creating Your First Habit

1. Open the command palette (Cmd/Ctrl + P)
2. Search for "Create New Habit"
3. Enter a name for your habit
4. A new habit file will be created in the `Habits/` folder

Alternatively, create a markdown file manually with the following frontmatter:

```yaml
---
title: Morning Exercise
habit: true
trigger: After waking up
schedule: daily
history: []
---

# Morning Exercise

Track your daily exercise routine here.
```

### Marking a Habit Complete

**From Sidebar View:**
- Click the ◯ button to mark done (turns ✅ when complete)
- The history array is updated automatically
- Streak and count refresh instantly

**From Full Analytics View:**
- Click "Mark Done" button on any habit card
- Same behavior as sidebar

### Habit File Format

```yaml
---
title: Meditation
habit: true
trigger: Before breakfast
schedule: daily
history:
  - 2025-01-01
  - 2025-01-02
  - 2025-01-04
count: 3
---

# Meditation

_Track your meditation practice here._

## Why I Meditate

Focus, clarity, and mental health.

## Progress Notes

- Consistent 15-minute sessions
- Using the Insight Timer app
```

**Required Fields:**
- `title`: Display name of the habit
- `habit: true`: Marks this file as a habit (must be exactly `true`)
- `history`: Array of ISO date strings (YYYY-MM-DD format)

**Optional Fields:**
- `trigger`: What triggers this habit? (e.g., "After morning coffee")
- `schedule`: How often? (e.g., "daily", "every other day")
- `count`: Explicit count (usually auto-derived from history)

## Views

### Sidebar View

Compact, fast access to all your habits. Shows:
- Habit name
- Total completion count
- Current streak with 🔥 emoji
- Quick ✅ button to mark done
- 📝 button to open the habit note

**Open:** Ribbon icon or Command: "Open Kaizen Sidebar"

### Full Analytics View

Detailed breakdown of each habit with:
- Habit name, trigger, and schedule
- **Total**: Lifetime completions
- **Streak**: Current consecutive days
- **Best**: Longest streak ever achieved
- **30-day %**: Completion rate over past 30 days
- Recent history (last 14 completions)
- Status indicator ("Done Today" / "Not Done Today")

**Open:** Command: "Open Kaizen Analytics"

## Settings

Access via Settings → Kaizen:

- **Auto-log to Daily Note**: When enabled, marking a habit complete also adds an entry to your daily note (default: **OFF**)
- **Derive Count from History**: Calculate count from history array rather than explicit count (default: **ON**)
- **Habit Field Name**: The frontmatter field used to identify habits (default: `habit`)
- **Developer Logging**: Enable debug logging to console (default: **OFF**)

## Commands

- **Create New Habit**: Prompt-based habit creation
- **Open Kaizen Sidebar**: Quick access sidebar view
- **Open Kaizen Analytics**: Detailed analytics view

## Domain Logic

The plugin uses pure, testable domain functions for all habit calculations:

- **`markDone(habit, date?)`**: Idempotent completion marking
- **`currentStreak(habit, now?)`**: Current consecutive days
- **`longestStreak(habit)`**: Best streak ever
- **`completionRate(habit, pastDays, now?)`**: Percentage of days completed
- **`isDoneToday(habit, now?)`**: Boolean check for today's completion

All date handling uses local ISO dates (YYYY-MM-DD) to avoid timezone issues.

## Architecture

### Layers

1. **Domain** (`src/domain/habit.ts`)
   - Pure functions, no Obsidian API
   - Types for Habit, ISODate
   - Business logic for streak, completion rates

2. **Repository** (`src/adapters/repo/habitRepo.ts`)
   - YAML frontmatter parsing/writing
   - File I/O abstraction
   - Habit file discovery

3. **Service** (`src/services/habitService.ts`)
   - Orchestrates domain + repo
   - Handles daily note logging
   - Application use cases

4. **UI** (`src/ui/`)
   - `sidebarView.ts`: Compact sidebar
   - `fullPageView.ts`: Detailed analytics

5. **Settings** (`src/settings/`)
   - Configuration interface
   - Settings UI tab

6. **Main** (`src/main.ts`)
   - Plugin bootstrap
   - Command registration
   - View registration

## Daily Note Integration

When enabled in settings, marking a habit complete adds:

```
- ✅ Exercise (2025-01-15)
```

to your daily note at `Daily/2025-01-15.md`. The file is created automatically if it doesn't exist.

## Best Practices

### Habit Design

1. **Make it specific**: "Morning run" is better than "Exercise"
2. **Include a trigger**: What cue prompts you to do this?
3. **Choose a schedule**: Daily, weekly, etc.
4. **Keep it small**: One habit per file to avoid clutter

### Tracking

1. **Mark immediately**: Log your habit as soon as it's complete
2. **Be consistent**: Same time every day helps build the neural pathway
3. **Review streaks**: Use the sidebar for quick motivation
4. **Analyze patterns**: Check full analytics view weekly

### Long-term

1. **Archive completed habits**: Move old habits to an `Archive/` folder
2. **Chain habits**: Track habits that support each other
3. **Reflect**: Use the habit note body for reflection and notes
4. **Iterate**: Adjust triggers, schedules, or habits based on what works

## Data Storage

All habit data is stored in markdown files with YAML frontmatter. No external services or cloud storage required.

**Locations:**
- Default habit folder: `Habits/`
- Optional daily notes: `Daily/YYYY-MM-DD.md`
- Settings: `.obsidian/plugins/obsidian-kaizen-habits/data.json`

## Troubleshooting

### Habits not showing up

- Ensure the file has `habit: true` in frontmatter
- Check file is in markdown format (`.md`)
- Reload the plugin or restart Obsidian

### Changes not persisting

- Check file permissions
- Ensure history array is valid YAML
- Look for errors in the console (Developer Logging setting)

### Dates not updating correctly

- Use local ISO dates (YYYY-MM-DD)
- Ensure your system timezone is correct
- Restart Obsidian to refresh date handling

## Development

### Project Structure

```
src/
├── domain/
│   └── habit.ts              # Pure domain logic
├── adapters/
│   └── repo/
│       └── habitRepo.ts      # File I/O adapter
├── services/
│   └── habitService.ts       # Orchestration layer
├── ui/
│   ├── sidebarView.ts        # Sidebar component
│   └── fullPageView.ts       # Analytics component
├── settings/
│   ├── settings.ts           # Config interface
│   └── settingsTab.ts        # Settings UI
└── main.ts                   # Plugin entry point
```

### Testing

Domain logic is easily testable without Obsidian:

```typescript
import { markDone, currentStreak } from './domain/habit';

const habit = {
  id: 'exercise',
  title: 'Exercise',
  history: ['2025-01-01', '2025-01-02', '2025-01-03'],
};

const updated = markDone(habit, '2025-01-04');
console.log(currentStreak(updated)); // 4
```

### Building

```bash
npm install
npm run dev     # Watch mode
npm run build   # Production build
```

## License

MIT License — Feel free to use, modify, and distribute.

## Changelog

### v0.1.0

- Initial release
- Sidebar and full analytics views
- Habit creation and tracking
- Daily note integration
- Settings tab
- Full domain-driven architecture

---

**Questions or feedback?** Open an issue or contribute on GitHub.

Build your habits. Change your life. One day at a time. 🔥
