# MGCV Pilot Edition — Full Packaging Plan

## Goal
Ship one focused pilot product around a single promise:

**See what your students actually understand.**

Preserve the genuine 3-day learning engine unchanged: Spark, Build, Master, interest lenses, AI mirror, 20-hour gate, metacognitive reflection, and 7-layer depth.

## Confirmed current state
- Student identity is stored correctly in `student_profiles`, and the compatibility profile view already derives `Class N` from the student's grade.
- Signup does not collect a student's board, grade, or section. New students therefore receive defaults before onboarding.
- Onboarding captures board, grade, and section, but it can be skipped.
- Teacher-to-student matching already uses exact board, grade, and section assignments. Current database data has matching teachers only for some student groups.
- The alternate annual calendar stores grades as `9`, while the rest of the product uses `Class 9`.
- The database contains real Day 2 explanations and AI scores, but teachers currently cannot read episode progress.
- Teacher Analytics contains fake students and generated scores. The dashboard class selector, weekly deltas, student notifications, study time, gems, and Message Bar also contain hardcoded or non-working claims.
- There is no existing demo-mode toggle.

## Product flow
```text
Student joins Class 9A
  → completes Day 1 Spark
  → waits through the 20-hour gate
  → explains the concept on Day 2
  → AI mirror scores the explanation
  → teacher opens “What my students said”
  → reads strong and weak explanations
  → sees misconceptions and tomorrow’s openers
```

## 1. Repair the student–teacher link
- Add required Board, Class, and Section fields to student signup, with classes 6–10.
- Pass those values through signup metadata and create the student profile with the selected values.
- Keep the canonical display format as `Class N`; store grade as an integer in student profiles.
- Remove onboarding Skip so a student cannot enter the product without class details.
- Pre-fill onboarding from signup data and allow corrections before completion.
- Normalize the alternate calendar from `9` to `Class 9`, including existing rows.
- Update teacher attendance, assignments, schedules, class selectors, and rosters to preserve board + grade + section rather than merging same-grade groups.
- Backfill any incomplete student class details only from verified student profile values; do not invent schools, sections, or teachers.

## 2. Build the teacher’s primary screen
Create **What my students said** as the first teacher destination.

It will include:
- Teacher assignment selector: Board / Class / Section / Subject.
- Real roster for the selected assignment.
- Day 2 student explanation, AI score band, feedback, completion time, chapter, and episode.
- Filters for all, needs support, developing, and strong explanations.
- Honest empty states when no students or explanations exist.
- A misconception summary derived only from the selected class’s real explanations.
- Suggested “tomorrow’s openers” clearly labelled as generated suggestions.

The database read will be exposed through a protected teacher-only function. It will verify exact board, grade, section, and subject coverage before returning student-authored text.

## 3. Add teacher-controlled demo mode
- Add a **Demo Data** toggle in the teacher profile menu.
- Keep one codebase and the same teacher screens; the toggle changes only the data provider.
- Put all demo fixtures in one dedicated file, never inside page components.
- Use Class 9A, Real Numbers, plausible Indian student names, and representative Day 1/Day 2 progress.
- Show a permanent, high-visibility **DEMO DATA** banner on every teacher screen while enabled.
- Keep real mode honest: no synthetic fallback when the database is empty.
- Store the preference locally for the presentation session; never write demo records into real student tables.

## 4. Remove misleading or unfinished surfaces
Hide from the Pilot Edition navigation and normal user flow without deleting the learning engine:
- Fake Analytics
- Inner OS
- Deep Dive
- Textbook Lab
- Exam Room
- Adaptive System
- Board vs JEE
- Document Translation
- Prototype/demo routes and previews
- Curiosity standalone route
- Parent Connect until delivery is complete
- Non-working Message Bar and student messages
- Hardcoded notifications and notification dot
- Hardcoded Gems and Study Time
- Development Reset controls

Also remove fabricated weekly deltas and replace hardcoded class tabs with the teacher’s real assignment list.

## 5. Consolidate the Pilot Edition navigation
### Student
- Today
- Learn
- Assignments
- Calendar
- My Progress
- Profile

### Teacher
- What my students said
- Class list
- Misconceptions
- Tomorrow’s openers
- Attendance
- Assignments
- Schedule
- Profile

Use **MGCV** consistently as the visible product name. Keep profile-circle navigation and logout in its dropdown.

## 6. Pilot package
- Add one direct chapter entry for **Class 9 → Mathematics → Real Numbers**.
- Prepare one principal-facing printable page covering the pilot problem, journey, teacher evidence, measurement approach, and privacy boundaries.
- Present retention and score improvements only as hypotheses the pilot will measure.
- Do not add fake schools, students, activity, notifications, or efficacy claims to real mode.

## Technical details
- Extend signup metadata and the existing user-creation trigger for board, grade, and section.
- Use schema migrations for policy/function changes and data updates for calendar normalization.
- Add a teacher-only function returning scoped Day 2 explanation rows from episode progress and student profiles.
- Resolve subject scope through the chapter/episode curriculum mapping before exposing explanations.
- Repair affected teacher reads with exact assignment matching.
- Keep demo fixtures typed and centralized behind a small data-source adapter.
- Add focused tests for class normalization, assignment matching, demo isolation, explanation filtering, and unauthorized reads.

## Validation
- Create or use a teacher assigned to CBSE Class 9A Mathematics.
- Verify a Class 9A student appears in that teacher’s roster and does not appear for unrelated teachers.
- Complete Day 1 and Day 2 as a student; confirm the exact explanation and AI score appear for the correct teacher.
- Confirm the 20-hour gate and all existing learning steps remain unchanged.
- Confirm demo mode is unmistakably labelled and cannot contaminate real data.
- Check phone and desktop layouts, empty states, logout, class switching, attendance, assignments, and schedule.
- Confirm hidden routes are not visible in Pilot Edition navigation.
