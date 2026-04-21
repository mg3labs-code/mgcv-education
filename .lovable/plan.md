

# 3-Day Unlock Game Loop — Real /student/textbook Reader Integration

## What you're building

A gamified 3-day episode progression system where each day has a strict time limit and unlocks progressively. Day 1 = Spark (4 min), Day 2 = Build (6 min), Day 3 = Master (8 min). Student sees a locked wall for future days. No "Warangal" mentions. Simple, age-appropriate language for Classes 7-10.

## User-facing terminology (age-appropriate for Classes 7-10)

| Internal | Student-Facing |
|----------|---------------|
| Day 1 | "Spark" — "Day 1 of 3" |
| Day 2 | "Build" — "Day 2 of 3" |
| Day 3 | "Master" — "Day 3 of 3" |
| Explorer mode | "Quick Look" |
| Builder mode | "Deep Dive" |
| Master mode | "Full Story" |
| Hook question | "What do you think?" |
| Detective statement | "Believe It or Doubt It" |
| Tutorial Defense | "Prove It" |
| Inner OS | "Your Growth" |
| Streak | "🔥 Your Streak" |

## Architecture (zero new database tables)

All state uses existing tables:
- `episode_progress.layer_scores` jsonb stores `{ day1_completed_at, day2_completed_at, day3_completed_at }`
- `student_preferences.difficulty_level` stores mode preference
- `episode_interactions` stores hook answers and hesitation timing
- `student_inner_os.streak_days` for streak counter

## Day lock logic

- Day 1: Always unlocked. Complete = timestamp stored.
- Day 2: Unlocks when `now() - day1_completed_at >= 20 hours` (so 8pm Monday → 4pm Tuesday after school)
- Day 3: Unlocks when `now() - day2_completed_at >= 20 hours`
- Demo override: `?unlock=all` query param bypasses all locks for stakeholder demos

## File structure to create

```
src/contexts/EpisodeDayContext.tsx       — day state, lock checks, streak
src/components/episode/StageTopbar.tsx   — "Day X of 3" pill, streak badge, mode indicator
src/components/episode/DayLockedWall.tsx — locked screen with countdown timer
src/components/episode/Day1Spark.tsx     — Hook + Concept + Believe/Doubt (3 interactions)
src/components/episode/Day2Build.tsx     — Recall + Deep Dive + Explain + 2×Detective
src/components/episode/Day3Master.tsx    — First Principles + Prove It + Case Study + Growth Reveal
src/hooks/useEpisodeDayUnlock.ts         — day calculation logic
src/lib/childFriendlyLabels.ts           — terminology mapping
```

## Files to edit

```
src/pages/TextbookEpisode.tsx
  - Replace current block list with EpisodeDayContext wrapper
  - Render Day1Spark | Day2Build | Day3Master | DayLockedWall based on unlock state
  - Remove top progress dots, replace with StageTopbar
  - Gate: Math Chapter 1 only for Phase 1

src/components/textbook/EpisodeBlocks.tsx
  - Mode filtering: Explorer = 3 layers, Builder = 5, Master = 7
  - Hide JEE blocks unless mode === "master"

src/components/textbook/JeeSpeedDrillBlock.tsx
  - Remove countdown timer (already done, verify)
  - Replace with "Q{i}/{n}" progress indicator
```

## Day 1 (Spark) — 4 minutes, 3 interactions exactly

```text
Screen 1: "What do you think?"
  - Hook question about the topic
  - Voice-first input (tap mic, speak, see transcript)
  - Submit stores answer in episode_interactions

Screen 2: "Here's the idea"
  - Simple concept card (Explorer depth only)
  - Student's guess appears above ("You thought: [their answer]")
  - 3-second pause before continue appears (Law 5: silence is a feature)

Screen 3: "Believe It or Doubt It"
  - One statement about the concept
  - Two big buttons: "I Believe It" / "I Doubt It"
  - Immediate feedback: green pulse for correct, gentle shake for wrong
  - No score shown, just "Nice thinking!" or "Interesting choice — here's why..."

End Screen: "Day 1 Complete!"
  - 🔥 Streak +1 (if day 1 of streak)
  - "Day 2 unlocks in 18 hours" countdown
  - teaser: "Tomorrow you'll learn WHY this works"
  - CTA: "Back to Dashboard"
```

## Day 2 (Build) — 6 minutes

```text
Screen 1: "Remember this?"
  - Show their Day 1 guess
  - Ask: "Still think the same, or changed your mind?"

Screen 2: "Let's go deeper"
  - Builder depth content (analogy + real-world example)
  - Indian Railways, cricket, everyday situations

Screen 3: "Explain it in your own words"
  - Free text entry, voice supported
  - AI mirrors back: "You explained [X] clearly. One gap: [Y]"

Screen 4-5: "Believe It or Doubt It" ×2
  - Two statements, harder than Day 1
  - Same mechanics

End: "Day 2 Complete!" with Day 3 lock timer
```

## Day 3 (Master) — 8 minutes

```text
Screen 1: "Why does this REALLY work?"
  - First principles breakdown
  - Feynman method for Class 9-10

Screen 2: "Prove It"
  - Tutorial Defense: AI asks 3 Socratic questions
  - Student defends their understanding

Screen 3: "Real World Challenge"
  - Case study (e.g., apply to actual scenario)

Screen 4: "Your Growth"
  - Inner OS reveal: +X% Clarity, +Y% Thinking, +Z% Character
  - Confetti animation
  - 3-day streak badge if all days consecutive
  - "You can explain this to anyone now"

Next episode teaser: "Up next: [topic]"
```

## Sensory layer (micro-interactions)

- Mode color tint: Explorer = warm green, Builder = blue, Master = deep purple
- "Key turn" soft sound on correct detective answer (Web Audio API, muted by default)
- Streak badge pulses when incrementing
- 3-second silence after concept reveal (no button visible, then fades in)

## What's removed/renamed

- "Warangal" — never appears (verify with grep)
- "JEE BOOST" → hidden in Explorer/Builder, visible only in Master
- "87-second timer" → removed entirely
- 14-dot progress bar → replaced with "Day X of 3" pill
- "Inner OS" → "Your Growth" in UI (internal code keeps Inner OS)
- "Tutorial Defense" → "Prove It" in UI
- "Vibe Check" → "Pick Your Style" in UI

## Acceptance test

1. Open `/student/textbook/ch1/ch1-ep1` as new user
2. See "Day 1 of 3" at top, no progress dots
3. Complete 3 screens in under 4 minutes
4. Locked wall shows "Day 2 unlocks in 20 hours"
5. Append `?unlock=all` → Day 2 instantly available
6. Day 2 shows "Remember this?" with Day 1 answer
7. Day 3 ends with growth numbers + confetti + next episode teaser
8. No "Warangal" text anywhere in UI

## Phase rollout

1. **Phase 1 (this build)**: Math Ch1 Ep1 only, behind `adaptiveEnabled` gate
2. **Phase 2**: After student observation feedback, expand to all Math Ch1
3. **Phase 3**: All Mathematics
4. **Phase 4**: Science (Languages keep bilingual framework)

