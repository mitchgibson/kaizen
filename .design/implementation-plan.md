# 1) High-level architecture (Domain-Driven, functional modules)

Top-level layers and responsibilities:

- **Domain** — `domain/*`  
    Pure functions and types that model habits and business rules (streak calculation, validate schedule, today-check, derive count from history). No Obsidian API usage here. Feature specs live here.
    
- **Persistence / Repository** — `adapters/repo/*`  
    Functional adapters that read/write habit notes using Obsidian Vault. They map domain objects ↔ YAML frontmatter + file content. Accept `app`/`vault` as injected dependency.
    
- **Application Services** — `services/*`  
    Orchestrate domain logic + repository I/O. e.g. `incrementHabit`, `getAllHabits`, `createHabit`, `toggleLogToDailyNote`. These are pure functions returning effects (Promises) but no UI.
    
- **UI / Views** — `ui/*`  
    Two views: `SidebarView` (compact) and `FullPageView` (detailed pane). Use closure-style components that receive service functions via constructor-like factory.
    
- **Settings / Config** — `settings/*`  
    Persistent plugin settings and a settings UI. Setting for “auto-log to daily note” and whether to store explicit `count` or derive.
    
- **Entry / wiring** — `main.ts`  
    Bootstraps services, wires repo with `app`, registers commands, attaches views, registers settings tab.
    
- **Specs** — `domain/*.spec.ts` (feature specs for domain modules). For I/O integration specs, put them next to the module in `adapters/repo/*` as feature-level spec files.
    

---

# 2) File layout (suggested)

```
obsidian-kaizen/
├─ manifest.json
├─ main.ts
├─ package.json
├─ src/
│  ├─ domain/
│  │  ├─ habit.ts
│  │  └─ habit.spec.ts          <-- feature spec for domain behavior
│  ├─ adapters/
│  │  ├─ repo/
│  │  │  ├─ habitRepo.ts
│  │  │  └─ habitRepo.spec.ts   <-- feature spec (integration-ish)
│  ├─ services/
│  │  └─ habitService.ts
│  ├─ ui/
│  │  ├─ sidebarView.ts
│  │  └─ fullPageView.ts
│  ├─ settings/
│  │  ├─ settings.ts
│  │  └─ settingsTab.ts
│  └─ util/
│     └─ date.ts
└─ README.md
```

---

# 3) Manifest (minimal)

```json
{
  "id": "obsidian-kaizen-habits",
  "name": "Kaizen Habits",
  "version": "0.1.0",
  "minAppVersion": "1.4.0",
  "description": "Lightweight Kaizen habit tracker with sidebar + full view.",
  "author": "You",
  "authorUrl": "",
  "isDesktopOnly": false
}
```

---

# 4) Domain: `src/domain/habit.ts` (closure-style module, pure)

This is pure JS/TS — no Obsidian imports. Keep logic deterministic for easy testing.

```ts
// src/domain/habit.ts
export type ISODate = string; // YYYY-MM-DD

export interface Habit {
  id: string;          // file path or slug
  title: string;
  trigger?: string;
  schedule?: string;   // free text e.g. "daily"
  history: ISODate[];  // sorted ascending recommended
  // count is optional in domain; prefer deriving
  count?: number;
}

export const todayISO = (): ISODate => {
  const d = new Date();
  return d.toISOString().slice(0,10);
};

// deriveCount: returns history.length unless count override provided
export const deriveCount = (h: Habit): number =>
  typeof h.count === 'number' ? h.count : h.history.length;

// returns a new habit with today's date added (idempotent)
export const markDone = (habit: Habit, date: ISODate = todayISO()): Habit => {
  const set = new Set(habit.history);
  if (!set.has(date)) {
    const newHistory = [...habit.history, date].sort(); // ascending
    return { ...habit, history: newHistory, count: newHistory.length };
  }
  return habit;
};

// returns number of consecutive days up to today
export const currentStreak = (habit: Habit, now: ISODate = todayISO()): number => {
  const set = new Set(habit.history);
  let streak = 0;
  const day = (d: string, n: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - n);
    return dt.toISOString().slice(0,10);
  };

  for (let i = 0; ; i++) {
    const dayIso = day(now, i);
    if (set.has(dayIso)) streak++;
    else break;
  }
  return streak;
};
```

And `habit.spec.ts` (feature spec) lives next to it:

```ts
// src/domain/habit.spec.ts (example)
import { markDone, currentStreak } from './habit';

const h = { id: 'a', title: 'x', history: ['2025-11-01','2025-11-03'] };
const after = markDone(h, '2025-11-04');
// assert after.history includes '2025-11-04'
```

(Use your chosen test runner; keep the spec file focused on the feature behavior — not unit-per-function.)

---

# 5) Repository adapter (closure-style) — `src/adapters/repo/habitRepo.ts`

This module interacts with Obsidian; it’s a small functional factory that receives `app` (or `vault`) and returns functions.

```ts
// src/adapters/repo/habitRepo.ts
import * as yaml from 'js-yaml';
import { App, TFile } from 'obsidian';
import { Habit, ISODate } from '../../domain/habit';

export const createHabitRepo = (app: App) => {
  const getMarkdownFiles = (): TFile[] => app.vault.getMarkdownFiles();

  async function readFile(path: string): Promise<string> {
    const f = app.vault.getAbstractFileByPath(path) as TFile | null;
    if (!f || !(f instanceof TFile)) throw new Error('file not found: ' + path);
    return await app.vault.read(f);
  }

  function parseFrontmatter(content: string): any {
    const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return null;
    return yaml.load(m[1]) as any;
  }

  async function findAllHabits(tagOrField = 'habit'): Promise<Habit[]> {
    const files = getMarkdownFiles();
    const out: Habit[] = [];
    for (const f of files) {
      const cache = app.metadataCache.getFileCache(f);
      const fm = cache?.frontmatter;
      if (fm && (fm[tagOrField] === true || fm[tagOrField] === 'true')) {
        const raw = await app.vault.read(f);
        const parsed = parseFrontmatter(raw) || {};
        out.push({
          id: f.path,
          title: parsed.title ?? f.basename,
          trigger: parsed.trigger,
          schedule: parsed.schedule,
          history: parsed.history ?? [],
          count: parsed.count,
        });
      }
    }
    return out;
  }

  async function writeHabit(habit: Habit): Promise<void> {
    const f = app.vault.getAbstractFileByPath(habit.id) as TFile | null;
    if (!f) throw new Error('file not found: ' + habit.id);
    const content = await app.vault.read(f);
    const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
    const fmObj = m ? (yaml.load(m[1]) as any) : {};
    fmObj.title = habit.title;
    fmObj.trigger = habit.trigger;
    fmObj.schedule = habit.schedule;
    fmObj.history = habit.history;
    fmObj.count = habit.count ?? habit.history.length;
    const newFront = `---\n${yaml.dump(fmObj)}---\n`;
    const rest = m ? content.slice(m[0].length) : content;
    await app.vault.modify(f, newFront + rest);
  }

  return {
    findAllHabits,
    readFile,
    writeHabit
  };
};
```

Edge-case handling note: always re-read file contents before writing to reduce overwrites; you can add a small retry/merge strategy.

---

# 6) Service layer: `src/services/habitService.ts`

Services orchestrate domain + repo. Again a closure factory that accepts the repo and config.

```ts
// src/services/habitService.ts
import { createHabitRepo } from '../adapters/repo/habitRepo';
import { markDone, deriveCount, Habit, ISODate } from '../domain/habit';
import { App } from 'obsidian';

export const createHabitService = (repo: ReturnType<typeof createHabitRepo>, opts: { autoLogDaily?: boolean, logToDailyNote?: boolean, app: App }) => {
  async function listHabits() {
    return await repo.findAllHabits();
  }
  async function increment(habit: Habit, date?: ISODate) {
    // read fresh file first via repo
    const updated = markDone(habit, date);
    updated.count = deriveCount(updated);
    await repo.writeHabit(updated);
    // optionally append to daily note
    if (opts.autoLogDaily && opts.logToDailyNote) {
      const today = date ?? new Date().toISOString().slice(0,10);
      const dailyPath = await findOrCreateDailyNotePath(opts.app, today);
      const line = `- ✅ ${updated.title} — ${today}\n`;
      await appendLineToFile(opts.app, dailyPath, line);
    }
    return updated;
  }

  return { listHabits, increment };
};

// helper implementations (very small)
async function findOrCreateDailyNotePath(app: App, isoDate: string) {
  // implement by using your daily note plugin format or simple file naming
  const path = `Daily/${isoDate}.md`;
  const f = app.vault.getAbstractFileByPath(path);
  if (!f) await app.vault.create(path, `# ${isoDate}\n\n`);
  return path;
}

async function appendLineToFile(app: App, path: string, line: string) {
  const f = app.vault.getAbstractFileByPath(path) as any;
  const content = await app.vault.read(f);
  await app.vault.modify(f, content + '\n' + line);
}
```

Settings `opts.autoLogDaily` and `opts.logToDailyNote` let the user toggle logging and you can expose them via settings UI.

---

# 7) UI: Sidebar + Full Page (factory components)

Both views are created from factories that accept `habitService` and return lifecycle methods. Keep rendering minimal DOM, use Obsidian `ItemView` pattern.

**Sidebar (compact)** — `src/ui/sidebarView.ts` (pseudo-code)

```ts
import { ItemView, WorkspaceLeaf } from 'obsidian';

export const createSidebarView = (habitService) => {
  class SidebarView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() { return 'kaizen-sidebar'; }
    getDisplayText() { return 'Kaizen'; }
    async onOpen() {
      this.render();
    }
    async render() {
      const container = this.contentEl;
      container.empty();
      const habits = await habitService.listHabits();
      for (const h of habits) {
        const row = container.createDiv('kaizen-row');
        row.createEl('span', { text: h.title });
        const countBadge = row.createEl('span', { text: String(h.count ?? h.history.length) });
        const btn = row.createEl('button', { text: '✅' });
        btn.onclick = async () => {
          await habitService.increment(h);
          this.render();
        };
      }
    }
  }
  return SidebarView;
};
```

**Full page view** — `src/ui/fullPageView.ts`  
Similar but with expanded details, heatmap, open note link, filters, and settings toggle for logging.

---

# 8) Settings & Optional Logging

`settings/settings.ts` exposes:

```ts
export interface Settings {
  autoLogToDailyNote: boolean;
  deriveCountFromHistory: boolean; // if false, plugin will respect explicit count in frontmatter
  habitField: string; // frontmatter field name e.g. "habit"
}
```

Expose a SettingsTab UI to toggle `autoLogToDailyNote` and `deriveCountFromHistory`. The `createHabitService` will read these settings at creation time and you can re-create the service if settings change.

Important: logging to daily note must be optional and off by default. Also enable a developer-only setting `devLoggingEnabled` to output debug Notices or write to a dev log file.

---

# 9) Specs approach

You asked for feature specs (not per-file unit tests). Place them in the module folder as `*.spec.ts`. Example intent:

- `src/domain/habit.spec.ts` — tests: `markDone` idempotence, `currentStreak` scenarios (today done / missing yesterday / long streak)
    
- `src/adapters/repo/habitRepo.spec.ts` — integration-like spec: given a sample markdown file string, parse frontmatter → habit object → write back and assert YAML shape.
    
- `src/services/habitService.spec.ts` — scenario specs: increment an in-memory fake repo and validate it appends to history and triggers daily note append when enabled.
    

Use a test harness like Vitest or Jest for running these locally (outside obsidian). Keep them lightweight — they test pure domain logic and your repo functions can be faked/mocked for behavior verification.

Example spec file header:

```ts
// src/domain/habit.spec.ts
import { markDone, currentStreak } from './habit';
describe('habit domain - markDone & streaks', () => {
  it('adds today if missing', () => { /* ... */ });
  it('is idempotent', () => { /* ... */ });
  it('computes streak across days', () => { /* ... */ });
});
```

---

# 10) Implementation milestones (practical)

1. **Scaffold repo + settings** (manifest, main.ts, settings UI). Wire a simple command to open sidebar view.
    
2. **Domain + specs** (domain/habit.ts + domain/habit.spec.ts). Run tests locally.
    
3. **Repo adapter** — implement `findAllHabits` + `writeHabit` and test with sample notes in a test vault folder.
    
4. **Service** — implement `increment` with `autoLogDaily` option.
    
5. **Sidebar view** — minimal render + increment button.
    
6. **Full page view** — advanced UI: streaks, open note, heatmap.
    
7. **Polish** — settings, hotkeys, safe write/merge logic, dev logging toggle.
    
8. **Release** — README, versioning, sample templates.
    

---

# 11) Helpful implementation notes / gotchas

- Timezones: store `YYYY-MM-DD` local ISO as you specified. Use local date methods, not UTC, to avoid cross-midnight issues.
    
- Concurrency: always re-read file content before writing; consider using a small optimistic lock (compare frontmatter before write; if changed, re-merge).
    
- Idempotence: ensure increment is idempotent per-day unless user explicitly wants multiple counts per day (expose as setting).
    
- UX: make the sidebar super fast (use cached in-memory list, refresh after any write). Full page can re-fetch for authoritative state.
    

---

# 12) Example `main.ts` wiring (sketch)

```ts
import { Plugin } from 'obsidian';
import { createHabitRepo } from './adapters/repo/habitRepo';
import { createHabitService } from './services/habitService';
import { createSidebarView } from './ui/sidebarView';
import { createFullPageView } from './ui/fullPageView';
import { loadSettings, saveSettings } from './settings/settings';

export default class KaizenPlugin extends Plugin {
  settings: any;
  async onload() {
    await this.loadSettings();
    const repo = createHabitRepo(this.app);
    const service = createHabitService(repo, { autoLogDaily: this.settings.autoLogToDailyNote, logToDailyNote: this.settings.logToDailyNote, app: this.app });

    this.addRibbonIcon('check', 'Kaizen', () => {
      this.app.workspace.togglePinnedLeaf(this.app.workspace.getLeftLeaf());
      // open the sidebar view if not open
    });

    this.registerView('kaizen-sidebar', (leaf) => new (createSidebarView(service))(leaf));
    this.registerView('kaizen-full', (leaf) => new (createFullPageView(service))(leaf));

    this.addCommand({ id: 'open-kaizen-sidebar', name: 'Open Kaizen Sidebar', callback: () => {
      this.app.workspace.getRightLeaf(false).setViewState({type: 'kaizen-sidebar'});
    }});
    // settings tab registration...
  }
  onunload() { /* cleanup views, etc */ }
}
```

---

# 13) Next step options (pick one)

- I can generate a full repo scaffold (all files + TypeScript code) ready to paste into `~/.obsidian/plugins/obsidian-kaizen-habits`.
    
- Or I can produce the complete `src` files (domain + repo + service + UI) inside a single text bundle in the chat.
    
- Or I can produce only the domain + specs you asked for so you can iterate TDD-style first.
    