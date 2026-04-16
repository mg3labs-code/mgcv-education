

The user is reporting multiple critical demo-blocking issues. Let me categorize them:

**Issues raised:**
1. Section progression broken — clicking "Continue" doesn't advance; revisiting completed sections shows empty content; progress not recorded reliably
2. Analytics/tracking weak — need to show rate of change in 5 Inner OS dimensions, time spent per section, where confused, where engaged, friction signals
3. Adaptive intelligence missing — quiz difficulty should adapt to student performance (simple → advanced based on track record)
4. Brainstorming-style quizzes needed (open-ended thinking, not just MCQ)
5. Voice assistant should guide on all pages — but only when needed, not repetitive
6. Schedule/Calendar — verify it exists and is updated; "Deep Dive" should go to that day's scheduled section

Let me explore the codebase to understand current state before planning.

Key files to inspect:
- `src/pages/TextbookEpisode.tsx` — section progression logic, blockCompleted, persistence
- `src/components/student/StudyCompanion.tsx` + voice — global voice guidance
- `src/pages/StudentDashboard.tsx` + GrowthTab — analytics surface
- `src/pages/StudentDeepDive.tsx` — daily section linkage
- `src/pages/StudentCalendar.tsx` + ScheduleCalendar
- `episode_interactions` + `episode_progress` tables — data model
- `IconSelectionQuiz` / `ComprehensionCheck` — quiz adaptation hooks

I have enough context from the prior conversation summary, file listing, and DB schema. The plan is clear.

