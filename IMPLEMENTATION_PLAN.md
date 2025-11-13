# Kaizen Plugin - AI-Powered Gamification Implementation Plan

**Created:** 2025-01-13  
**Purpose:** Break down the AI-powered leveling system into manageable development tasks

---

## Overview

Build an AI-powered habit progression system with 8 levels that personalizes growth paths for users. Each path uses ChatGPT to generate customized habits that start small and progressively increase in difficulty.

---

## Phase 1: Foundation & Data Structures (Days 1-2)

### Task 1.1: Create Type Definitions
**File:** `src/types/gamification.ts`

- [ ] Define `GeneratedPath` interface
- [ ] Define `PathLevel` interface  
- [ ] Define `Habit` interface
- [ ] Define `UserContext` interface
- [ ] Define `PathCategory` enum/type
- [ ] Define `HabitFrequency` type
- [ ] Export all types

**Acceptance Criteria:**
- All types are strongly typed with TypeScript
- Interfaces support nested structures
- Types align with planned data structure from brainstorming

---

### Task 1.2: Create Settings Data Model
**File:** `src/settings.ts`

- [ ] Extend existing settings interface with gamification fields:
  - `apiKey: string` (encrypted)
  - `activePaths: GeneratedPath[]`
  - `archivedPaths: GeneratedPath[]`
  - `xpTotal: number`
  - `currentLevel: number`
  - `achievements: Achievement[]`
- [ ] Add default values for new settings
- [ ] Create migration helper for existing users

**Acceptance Criteria:**
- Settings persist across plugin reloads
- Backward compatible with existing plugin data
- API key is handled securely (never logged)

---

### Task 1.3: Create Path Categories Configuration
**File:** `src/config/path-categories.ts`

- [ ] Define initial category list (15-20 categories)
- [ ] Group categories by type (Professional, Creative, Health, Personal, Academic)
- [ ] Add category metadata (description, icon, difficulty estimate)
- [ ] Export category configuration

**Categories to Include:**
- Professional: Software Engineer, Frontend Dev, Backend Dev, DevOps, Data Science, Product Manager, Technical Writer, UX/UI Designer
- Creative: Fiction Writer, Non-fiction Writer, Digital Artist, Music Producer, Content Creator, Photographer
- Health: Physical Health, Physical Health 40+, Strength Training, Cardio, Mental Health, Sleep Optimization, Nutrition
- Personal: Language Learning, Reading Habit, Productivity, Financial Literacy, Public Speaking
- Academic: Student, Researcher, Lifelong Learner

**Acceptance Criteria:**
- Easy to add new categories
- Categories include helpful descriptions for users
- Icon/emoji support for visual identification

---

## Phase 2: AI Integration (Days 3-4)

### Task 2.1: Create OpenAI Service
**File:** `src/services/openai-service.ts`

- [ ] Create `OpenAIService` class
- [ ] Implement API key validation method
- [ ] Implement rate limiting/throttling
- [ ] Implement error handling with retry logic
- [ ] Add method: `generatePath(category, userContext): Promise<GeneratedPath>`
- [ ] Add method: `regeneratePath(existingPath, feedback): Promise<GeneratedPath>`
- [ ] Add method: `adjustDifficulty(path, completionRate): Promise<PathLevel[]>`
- [ ] Mock mode for development/testing (no API calls)

**Acceptance Criteria:**
- Service handles network failures gracefully
- Rate limiting prevents excessive API calls
- Clear error messages for user-facing issues
- Mock mode allows development without API key

---

### Task 2.2: Design AI Prompts
**File:** `src/prompts/path-generation.ts`

- [ ] Create system prompt template
- [ ] Create path generation prompt template
- [ ] Create regeneration prompt template
- [ ] Create difficulty adjustment prompt template
- [ ] Add category-specific prompt variations
- [ ] Include examples of good/bad outputs in comments

**Prompt Requirements:**
- Generate structured JSON output
- Include 8 levels with progressive difficulty
- Level 1 must be <5min, extremely easy
- Each level includes 1-3 measurable habits
- Include motivational messages
- Specify estimated days per level
- Define unlock criteria

**Acceptance Criteria:**
- Prompts produce consistent, parseable JSON
- Generated habits are specific and measurable
- Progression feels natural and achievable
- Prompts tested with multiple categories

---

### Task 2.3: Create Response Parser
**File:** `src/services/ai-response-parser.ts`

- [ ] Parse and validate AI JSON responses
- [ ] Handle malformed responses gracefully
- [ ] Sanitize AI output (remove unsafe content)
- [ ] Validate level progression logic
- [ ] Ensure all required fields present
- [ ] Add fallback/default values for optional fields

**Acceptance Criteria:**
- Parser never crashes on bad input
- Validation catches invalid progression (e.g., Level 2 easier than Level 1)
- Clear error messages for debugging
- Unit tests for various response formats

---

## Phase 3: Path Setup Flow (Days 5-6)

### Task 3.1: Create Initial Setup Modal
**File:** `src/ui/setup-modal.ts`

- [ ] Create multi-step modal component
- [ ] Step 1: Welcome + explanation
- [ ] Step 2: API key input with validation
- [ ] Step 3: Category selection (multi-select up to 3)
- [ ] Step 4: Context questions (per category)
- [ ] Step 5: Generation progress + preview
- [ ] Step 6: Confirmation + start
- [ ] Add "Skip for now" / "Use templates" option

**Context Questions:**
- Current skill level (Beginner/Intermediate/Advanced)
- Available time per day (5/15/30/60 minutes)
- Specific goals (free text, optional)
- Constraints (free text, optional)

**Acceptance Criteria:**
- Modal is intuitive and guides user through setup
- Validation prevents invalid configurations
- Progress indicators show AI generation status
- User can review generated path before accepting
- Fallback to templates if API key issues

---

### Task 3.2: Create Path Preview Component
**File:** `src/ui/path-preview.ts`

- [ ] Display all 8 levels in visual journey/map
- [ ] Show level names, descriptions, habits
- [ ] Highlight estimated time per habit
- [ ] Show unlock criteria for each level
- [ ] Add "Regenerate" button
- [ ] Add "Looks good, let's start" button
- [ ] Add "Customize" option for manual edits

**Acceptance Criteria:**
- Preview is visually appealing and scannable
- User can understand full path at a glance
- Easy to trigger regeneration if unhappy
- Responsive design for different vault widths

---

### Task 3.3: Create Fallback Template Paths
**File:** `src/data/template-paths.ts`

- [ ] Create 5-10 pre-generated template paths
- [ ] Cover most popular categories
- [ ] Match the structure of AI-generated paths
- [ ] Include beginner-friendly defaults
- [ ] Add comments explaining template design choices

**Template Categories:**
- Software Engineer (general)
- Frontend Developer
- Physical Health
- Fiction Writer
- Language Learning

**Acceptance Criteria:**
- Templates are high quality and well-tested
- Templates work without any AI calls
- User can start immediately with templates
- Templates can be regenerated later with AI

---

## Phase 4: Progress Tracking (Days 7-8)

### Task 4.1: Create Habit Tracker Component
**File:** `src/ui/habit-tracker.ts`

- [ ] Display current level and active habits
- [ ] Checkbox interface for daily habit completion
- [ ] Show streak counters per habit
- [ ] Display progress toward next level
- [ ] Show XP earned for completions
- [ ] Visual feedback for completion (animation)
- [ ] Daily/weekly view toggle

**Acceptance Criteria:**
- Tracker is accessible from sidebar or command palette
- Completions persist across sessions
- Visual feedback is satisfying but not distracting
- Shows historical completion data

---

### Task 4.2: Create Progress Calculation Engine
**File:** `src/services/progress-service.ts`

- [ ] Track habit completions with timestamps
- [ ] Calculate completion rates per habit
- [ ] Calculate level completion percentage
- [ ] Determine when level unlock criteria met
- [ ] Calculate XP earned per completion
- [ ] Track streaks (current, longest)
- [ ] Generate progress insights

**Level Unlock Logic:**
- Minimum days at level must pass
- Completion rate threshold must be met (e.g., 80%)
- All mandatory habits completed at least once

**XP Calculation:**
- Base XP per habit completion
- Multipliers for streaks
- Bonus XP for level completion
- Penalty for streak breaks (optional)

**Acceptance Criteria:**
- Progress calculations are accurate
- Level unlocking feels fair and achievable
- XP system encourages consistency
- Edge cases handled (missed days, retroactive logging)

---

### Task 4.3: Level Up System
**File:** `src/services/level-up-service.ts`

- [ ] Detect when level unlock criteria met
- [ ] Trigger level-up celebration
- [ ] Update active habits to next level
- [ ] Archive previous level data
- [ ] Award level completion bonus XP
- [ ] Generate personalized congratulations message
- [ ] Unlock achievements if applicable

**Acceptance Criteria:**
- Level-up is detected automatically
- User is notified with celebration UI
- Transition to next level is seamless
- Previous level habits are retired/integrated appropriately

---

## Phase 5: Settings & Management (Days 9-10)

### Task 5.1: Create Settings Tab
**File:** `src/ui/settings-tab.ts`

- [ ] Section: API Configuration
  - API key input (masked)
  - Test connection button
  - Usage stats (if available)
- [ ] Section: Active Paths
  - List active paths with progress
  - Pause/Resume buttons
  - Regenerate path button
  - Archive path button
- [ ] Section: Path Customization
  - Edit habit details
  - Adjust time commitments
  - Modify goals/constraints
- [ ] Section: Display Preferences
  - Show/hide progress in status bar
  - Notification settings
  - Theme options

**Acceptance Criteria:**
- Settings are organized and easy to navigate
- Changes persist immediately
- API key is handled securely
- User can manage multiple paths easily

---

### Task 5.2: Create Path Management View
**File:** `src/ui/path-manager.ts`

- [ ] View all active and archived paths
- [ ] Visual progress indicators per path
- [ ] Detailed stats per path (total XP, completion rate, etc.)
- [ ] Actions: Pause, Resume, Archive, Delete
- [ ] Export path as JSON
- [ ] Import path from JSON
- [ ] Duplicate path for similar goals

**Acceptance Criteria:**
- User can manage multiple paths efficiently
- Data export allows sharing/backup
- Archive vs Delete distinction is clear
- Duplication saves time for similar paths

---

### Task 5.3: Implement Adaptive Difficulty
**File:** `src/services/adaptive-difficulty-service.ts`

- [ ] Monitor completion rates continuously
- [ ] Detect when user consistently exceeds targets
- [ ] Detect when user struggles (<50% completion)
- [ ] Suggest difficulty adjustments
- [ ] Regenerate remaining levels if accepted
- [ ] Option: auto-adjust without AI (rule-based)

**Adjustment Triggers:**
- Exceeding targets: 90%+ completion for 7+ days
- Struggling: <50% completion for 5+ days
- User request: manual feedback button

**Acceptance Criteria:**
- Adjustments feel helpful, not punishing
- User maintains control (opt-in suggestions)
- Rule-based fallback if AI unavailable
- Adjustments preserve existing progress

---

## Phase 6: Visual Polish & UX (Days 11-12)

### Task 6.1: Status Bar Integration
**File:** `src/ui/status-bar.ts`

- [ ] Show current level in status bar
- [ ] Show XP progress bar (optional)
- [ ] Click to open habit tracker
- [ ] Subtle animations for level-up
- [ ] Configurable visibility

**Acceptance Criteria:**
- Status bar element is unobtrusive
- Provides quick at-a-glance info
- Doesn't clutter status bar excessively
- Works on mobile (if applicable)

---

### Task 6.2: Create Path Visualization
**File:** `src/ui/path-visualization.ts`

- [ ] Visual journey/road map of all 8 levels
- [ ] Current level highlighted
- [ ] Completed levels marked with checkmarks
- [ ] Future levels slightly revealed (teasers)
- [ ] Connecting path/line between levels
- [ ] Hover tooltips with level details
- [ ] Responsive design

**Acceptance Criteria:**
- Visualization is motivating and clear
- User can see their progress journey
- Design works in light and dark themes
- Scalable for different screen sizes

---

### Task 6.3: Level-Up Celebration Animation
**File:** `src/ui/celebration.ts`

- [ ] Trigger on level completion
- [ ] Confetti or particle animation
- [ ] Display level name and achievement
- [ ] Show new habits unlocked
- [ ] Motivational message from AI
- [ ] Share achievement option (optional)
- [ ] Dismissable with click/timeout

**Acceptance Criteria:**
- Celebration feels rewarding
- Not too intrusive or annoying
- Performance-friendly (no lag)
- Can be disabled in settings

---

## Phase 7: Achievements & Gamification (Days 13-14)

### Task 7.1: Achievement System
**File:** `src/services/achievement-service.ts`

- [ ] Define achievement types and criteria
- [ ] Track achievement progress
- [ ] Detect when achievements unlocked
- [ ] Award achievement badges
- [ ] Store achievement history

**Achievement Categories:**
- Milestones: First completion, 100 completions, etc.
- Streaks: 7-day, 30-day, 90-day streaks
- Behavior: Night Owl, Early Bird (time-based)
- Mastery: Complete Level 8, Multiple paths complete
- Special: Seasonal, rare events

**Acceptance Criteria:**
- Achievements are challenging but achievable
- Progress toward achievements is visible
- Unlocking feels rewarding
- Achievements are stored permanently

---

### Task 7.2: Achievement Display
**File:** `src/ui/achievement-display.ts`

- [ ] Achievement notification on unlock
- [ ] Trophy case / badge collection view
- [ ] Progress toward locked achievements
- [ ] Rarity indicators (common, rare, epic, legendary)
- [ ] Achievement descriptions and tips

**Acceptance Criteria:**
- User can view all achievements (locked and unlocked)
- Clear indication of how to unlock achievements
- Rarity adds prestige to difficult achievements
- UI is visually appealing

---

### Task 7.3: Streak System
**File:** `src/services/streak-service.ts`

- [ ] Track consecutive completion days
- [ ] Calculate streak multipliers for XP
- [ ] Detect streak breaks
- [ ] Implement "Freeze" tokens (earned, protect streaks)
- [ ] Weekend handling options (count/skip)
- [ ] Visual streak counter

**Streak Multipliers:**
- 7-day: 1.5x XP
- 30-day: 2x XP
- 90-day: 3x XP

**Acceptance Criteria:**
- Streaks motivate consistency
- Freeze tokens prevent harsh penalties
- Weekend policy is configurable
- Streak progress is always visible

---

## Phase 8: Integration & Polish (Days 15-16)

### Task 8.1: Command Palette Integration
**File:** `src/commands/index.ts`

- [ ] "Open Habit Tracker" command
- [ ] "View Progress Dashboard" command
- [ ] "Add New Path" command
- [ ] "Regenerate Path" command
- [ ] "Mark Habit Complete" command (quick entry)
- [ ] "View Achievements" command

**Acceptance Criteria:**
- All major features accessible via command palette
- Commands have clear, consistent naming
- Keyboard shortcuts work (if defined)

---

### Task 8.2: Daily Note Integration (Optional)
**File:** `src/integrations/daily-notes.ts`

- [ ] Generate habit checkboxes in daily notes
- [ ] Use Obsidian task format: `- [ ] Habit Name`
- [ ] Sync completions between tracker and notes
- [ ] Add daily reflection prompt (optional)
- [ ] Dataview query examples in docs

**Acceptance Criteria:**
- Works with existing daily note templates
- Doesn't break existing daily note workflows
- Syncing is bidirectional
- Can be disabled if not wanted

---

### Task 8.3: Error Handling & Validation
**Files:** Throughout codebase

- [ ] Handle API failures gracefully
- [ ] Validate all user inputs
- [ ] Provide helpful error messages
- [ ] Log errors for debugging (never log API keys)
- [ ] Fallback behaviors for all critical paths
- [ ] Network timeout handling

**Acceptance Criteria:**
- Plugin never crashes
- Users understand what went wrong
- Fallbacks allow continued use during outages
- Errors are logged for troubleshooting

---

## Phase 9: Documentation & Testing (Days 17-18)

### Task 9.1: Write User Documentation
**File:** `README.md` (update)

- [ ] Feature overview with screenshots
- [ ] Setup guide (API key, initial path)
- [ ] How to use habit tracker
- [ ] Path management guide
- [ ] Achievement system explanation
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] Privacy & data handling disclosure

**Acceptance Criteria:**
- Documentation is clear for non-technical users
- Screenshots show key features
- Setup instructions are step-by-step
- Privacy information is prominent

---

### Task 9.2: Create Developer Documentation
**File:** `DEVELOPMENT.md` (new)

- [ ] Architecture overview
- [ ] Key components and services
- [ ] AI prompt engineering guide
- [ ] Adding new categories guide
- [ ] Testing guide
- [ ] Contributing guidelines
- [ ] Code style conventions

**Acceptance Criteria:**
- Other developers can understand codebase
- Clear guidance for extending plugin
- Testing instructions are complete

---

### Task 9.3: Testing & QA
**Files:** `src/**/*.test.ts`

- [ ] Unit tests for core services
- [ ] Integration tests for AI service
- [ ] Mock AI responses for tests
- [ ] Test path generation validation
- [ ] Test progress calculation edge cases
- [ ] Test level unlock logic
- [ ] Manual testing checklist
- [ ] Test with invalid/malformed API responses

**Test Coverage Goals:**
- Core services: 80%+ coverage
- AI integration: Mock-based, 70%+
- UI components: Snapshot tests

**Acceptance Criteria:**
- All critical paths have tests
- Tests run automatically
- No regressions in existing features
- Plugin works on desktop (and mobile if applicable)

---

## Phase 10: Release Preparation (Day 19-20)

### Task 10.1: Security Audit
- [ ] Verify API key never logged or exposed
- [ ] Check for sensitive data in error messages
- [ ] Validate input sanitization
- [ ] Review network requests (no tracking)
- [ ] Ensure data stays local
- [ ] Review third-party dependencies

**Acceptance Criteria:**
- No security vulnerabilities
- Privacy policy compliant
- Follows Obsidian plugin guidelines

---

### Task 10.2: Performance Optimization
- [ ] Profile plugin load time
- [ ] Optimize expensive calculations
- [ ] Lazy load UI components
- [ ] Cache AI responses aggressively
- [ ] Minimize vault file reads/writes
- [ ] Test with large datasets

**Acceptance Criteria:**
- Plugin loads quickly
- No noticeable lag during use
- Vault performance unaffected
- Works smoothly with 100+ completions

---

### Task 10.3: Release Checklist
- [ ] Update `manifest.json` version
- [ ] Update `versions.json`
- [ ] Build production bundle
- [ ] Test production build in clean vault
- [ ] Write release notes
- [ ] Tag release in git
- [ ] Prepare GitHub release assets
- [ ] Submit to Obsidian community (if applicable)

**Acceptance Criteria:**
- Build artifacts are correct
- Release follows Obsidian guidelines
- Release notes are comprehensive
- Version numbers match everywhere

---

## Future Enhancements (Post-Launch)

### Potential Phase 11+
- [ ] Local LLM support (Ollama, LM Studio)
- [ ] Social features (anonymous leaderboards)
- [ ] Prestige system (reset with bonuses)
- [ ] Seasonal events
- [ ] Cloud sync (premium)
- [ ] Custom categories (user-defined)
- [ ] Team/group paths
- [ ] Integration with external habit trackers
- [ ] Mobile app optimizations
- [ ] Voice input for habit logging
- [ ] Analytics dashboard
- [ ] Weekly AI coach check-ins

---

## Development Guidelines

### Code Organization Principles
- Keep `main.ts` minimal (lifecycle only)
- Split features into focused modules
- Maximum ~300 lines per file
- Clear module boundaries and responsibilities
- Use TypeScript strict mode

### Commit Strategy
- Commit after each completed task
- Use conventional commits format
- Keep commits focused and atomic
- Write descriptive commit messages

### Testing Strategy
- Write tests alongside features
- Mock external dependencies (AI, network)
- Test edge cases and error conditions
- Maintain test fixtures for AI responses

### Daily Session Plan
- Start: Review IMPLEMENTATION_PLAN.md
- Check off completed tasks as you go
- End: Update progress, note blockers
- Commit work at logical stopping points

---

## Progress Tracking

**Phase 1:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 2:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 3:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 4:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 5:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 6:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 7:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 8:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 9:** [ ] Not Started / [ ] In Progress / [ ] Complete  
**Phase 10:** [ ] Not Started / [ ] In Progress / [ ] Complete  

---

## Notes & Decisions Log

_Use this section to track important decisions, changes to the plan, or blockers encountered during development._

**Example Entry:**
- **Date:** 2025-01-15
- **Decision:** Changed from 10 levels to 8 levels for MVP
- **Reason:** User feedback indicated 10 felt overwhelming
- **Impact:** Adjust prompt templates, update docs

---

## Resources

- OpenAI API Docs: https://platform.openai.com/docs
- Obsidian Plugin API: https://docs.obsidian.md
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Obsidian Sample Plugin: https://github.com/obsidianmd/obsidian-sample-plugin

---

**Total Estimated Duration:** 18-20 development days (2-3 weeks at ~6-8 hours/day)

**Priority Order:**
1. Phase 1-2: Core data structures and AI integration (foundation)
2. Phase 3-4: User-facing path setup and tracking (MVP)
3. Phase 5-7: Management, polish, gamification (enhancement)
4. Phase 8-10: Integration, testing, release (finalization)
