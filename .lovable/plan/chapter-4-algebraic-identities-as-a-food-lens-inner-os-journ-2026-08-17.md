# Chapter 4 (Algebraic Identities) as a Food-Lens Inner OS Journey

Goal: take NCERT Grade 9 Ganita Manjari Chapter 4 "Exploring Algebraic Identities" and run it through the existing `/student/inner-os` pipeline, with food as the single default curiosity lens, packaged as a 3-day Spark Session.

## What already exists (verified)

- `/student/inner-os` renders a left path, a center one-step-at-a-time card stack, a right Buddy panel.
- `src/data/foodInnerOS.ts` is the only content source: `InnerModule[]`, each with `steps` of kind `hook | guess | reveal | concept | apply | close`, plus `STEP_META` tints.
- Current content is Number Systems (5 modules, 3-4 min each). No day grouping, no chapter grouping, no persistence — XP/streak/completion live in component state only.

## Chapter 4 content mapped to food

The chapter's real spine is: patterns surprise you -> areas explain them -> identities become calculation superpowers -> factorisation reverses them.

| Chapter section | Food-lens module | Kitchen story |
| --- | --- | --- |
| 4.1 Introduction (consecutive-squares pattern always gives 2) | The Magic Tray Trick | Three square serving trays in a row; the "always 2" trick the head chef performs to amaze staff |
| 4.2 Visualising identities, `(a+b)^2` | The Expanding Griddle | Griddle of side a grows by b on both sides; the four visible zones ARE a^2 + 2ab + b^2 |
| 4.2 `(a-b)^2` | The Trimmed Pizza Box | Cutting b off each side of a square box; why the correction is minus 2ab |
| 4.3 Factorisation with identities | Reading the Recipe Backwards | Given the finished tray layout, name the original side length |
| 4.4 `(a+b+c)^2`, and 119^2 mental trick | The Three-Ingredient Slab | Three toppings across a square slab; then the mental-maths flex 119^2 = 14161 |
| 4.4 / 4.7 `a^2 - b^2 = (a+b)(a-b)` (Shridharacharya) | The Chef's Speed Trick | 55^2 in one second at the counter, using 60 x 50 + 25 |

Each module stays under 4 minutes and keeps the strict arc: hook -> guess -> reveal -> concept -> apply -> close.

## The 3-Day Spark Session shape

Day 1 (Spark): Magic Tray Trick + Expanding Griddle. Ends on a deliberate open loop ("the trick still isn't explained — that's tomorrow").
Day 2 (Build): Trimmed Pizza Box + Three-Ingredient Slab. Ends with the 119^2 flex.
Day 3 (Flex): Reading the Recipe Backwards + Chef's Speed Trick, then a "Counter Challenge" — 5 rapid squares the student solves faster than a calculator, closing the Day 1 loop by finally proving the "always 2" pattern with algebra.

## Curiosity mechanics (the part that earns attention)

1. Unexplained trick first, algebra second. Every module opens with a result the student cannot yet justify.
2. Guess before reveal is mandatory — the guess step is never skippable, and a wrong guess is framed as useful ("good, most chefs say that too").
3. Cliffhanger close. Each day's final card ends with the next day's question, not a summary.
4. Show-off payload. Every day gives one thing the student can perform in front of someone else (119^2, 55^2, the tray trick). This is the real retention hook.
5. Visual-first concept cards. The `(a+b)^2` area square is drawn as a labelled griddle grid, not written as a formula.
6. Streak with a reason. The streak pill shows what unlocks next, not just a number.

## Build steps

1. Extend the content model in `src/data/foodInnerOS.ts`:
   - add `day: 1 | 2 | 3`, `chapterRef` (e.g. "Ch 4.2"), and an optional `visual` field on steps for the area-grid diagrams.
   - add `cliffhanger?: string` on modules, rendered on the close card.
2. Add `src/data/identitiesInnerOS.ts` with the 6 modules above (keeping `FOOD_MODULES` intact so Number Systems still works).
3. Add a lightweight journey registry so `/student/inner-os` can select between journeys, defaulting to Chapter 4.
4. Update `src/pages/StudentInnerOS.tsx`:
   - group left-panel nodes under Day 1 / Day 2 / Day 3 headers.
   - lock Day N+1 until Day N is complete.
   - render the close-card cliffhanger and a per-day "Show this to someone" callout.
   - render the area-grid visual on concept steps.
5. Add a small `AreaGrid` component (pure CSS grid, semantic tokens) for the a/b partition diagrams.
6. Add a Counter Challenge end-of-journey step type (timed rapid squares) as the Day 3 finale.

## Technical notes

- All styling stays inside the existing scoped `.ios-shell` system in `src/index.css`; no new global styles, no hardcoded colors.
- No backend work in this pass — progress stays in component state, same as today. Persisting XP/streak/day-unlock to the backend is a follow-up once the flow feels right.
- Content is authored by hand from the chapter, not scraped at runtime.
