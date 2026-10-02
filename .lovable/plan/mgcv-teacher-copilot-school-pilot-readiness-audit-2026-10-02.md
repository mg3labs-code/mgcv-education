# MGCV Teacher Copilot — School-Pilot Readiness Audit

Based on code reads and live database counts taken today. No code was changed.

## Live data snapshot
- 7 teacher class/subject assignments, 11 students
- 8 auto-homework drafts generated, 2 published (6 waiting for review)
- 3 student answers submitted, 0 stuck pending, 0 failed
- 9 real Day 2 explanations recorded
- 0 Daily Plan items in the database

## 1. Genuinely working now
- **Teacher signup and class mapping:** board, class, section and subject are saved through signup into the teaching map. The Dashboard and Schedule read the teacher's real classes.
- **Schedule, Save & Publish, and the student calendar:** saving writes the calendar rows students read. Hand-edited dates are kept. The student calendar loads every row (the 1,000-row limit is fixed) and shows only real entries.
- **Auto-homework drafts and review:** the generator makes 5 questions, one per layer, as unpublished drafts. Teachers see "Needs your review" and can edit, delete, then Approve & Publish. Nothing reaches students before approval.
- **Submission and evaluation:** students upload answers, and evaluation finishes in the background. Today there are no stuck or failed answers.
- **Student Explanations:** a protected function returns real Day 2 explanations, only for the exact board, class, section and subject the teacher covers. Demo mode is clearly labelled and kept separate.

## 2. Partial or risky
- **Students see assignments by class only.** The student assignment list filters on "Class 9" and ignores board and section. All current homework rows have no section, and one has no board. With two sections or two boards in one school, students would see another section's homework.
- **Homework has no section.** Generated and manual assignments do not record the section, so the item above can't be fixed on the student side alone.
- **Dashboard numbers come from Inner OS scores** (clarity, thinking and so on) averaged by class name. That merges sections and uses scores from a surface that is hidden in the pilot. To a teacher this looks like a measured result.
- **Daily Plan is empty by design.** The page can only tick items off. Nothing in the app or server creates them, so it will always be blank.
- **Misconceptions and Tomorrow's openers** depend on Day 2 explanations. With 9 explanations in total, most classes will show empty states.
- **The homework generator doesn't check who is calling** before it creates a draft, so anyone with the address could create drafts. Drafts stay unpublished, so the risk is spam rather than leakage.
- **Voices:** ElevenLabs billing has failed. Most voice buttons now fall back to the device voice. The premium voice stays off until the invoice is paid.
- **Phone layout:** the teacher bar has 7 items, and Quick Search has no phone button. Schedule and Review have not been checked as a signed-in teacher on a phone.
- **No signed-in teacher check yet:** reload, add a holiday, approve, then see it as a student. That path has not been run start to finish with a real teacher account.

## 3. Smallest product for one school
One school, one class (CBSE Class 9, one section), 1–2 subjects (Mathematics, plus Physics if seeded):
1. The teacher signs in and sees her real classes.
2. Schedule: she plans the month, saves and publishes, and students see it on their calendar.
3. Daily homework: AI drafts 5 questions, she reviews and approves, and students see and submit them.
4. Answer evaluation: AI scores the answers, and she reviews and finalises them in Assignments.
5. Student Explanations: she reads her students' real Day 2 explanations. This is optional, for a demo moment.

Everything else is hidden.

## 4. Must-fix checklist before the pilot
1. Show students only homework for their own board and section, and save the section on both generated and manual assignments.
2. Fill in board and section on the existing homework rows, or delete those test rows.
3. Make the homework generator accept only a signed-in teacher who covers that class.
4. Remove Daily Plan from the teacher bar for now, since it can never have items.
5. Remove or relabel the Dashboard averages. Show only measured counts per section (homework published, submissions, average marks), or hide the block.
6. Protect `/admin`. It currently opens without the sign-in check.
7. Hide the public demo and prototype addresses from production: `/demo*`, `/2605`, `/preview-bc`, `/previews`, `/curiosity`, `/board-vs-jee`, `/attraction-demo`, `/reasoning-visual`, `/translate`. Hide the teacher-only extras too: analytics, exam-room, insights, performance.
8. Run the full flow once as a real teacher and a real Class 9 student, on a phone: publish schedule, approve homework, submit an answer, finalise the score.
9. Pay the ElevenLabs invoice, or accept the device voice for the pilot.
10. Clear the 6 unreviewed test drafts and any test students before the school's accounts are created.

## 5. Hide or defer
- Teacher: Analytics (fake data), Exam Room, Insights, Performance, Parent Connect, Messages, and Daily Plan until it has a source.
- Student: Inner OS, Deep Dive, Textbook Lab, Board vs JEE, profile-menu Messages.
- Public: all demo, preview, translate and pitch-style addresses, except the principal one-pager.
- Defer: retention predictions, misconception maps at scale, the 7-layer assessment generator, admin multi-school setup.

## Technical notes
- `StudentAssignments.tsx` filters `assignments` by `profiles.class_name` only. It needs board and section from `student_profiles`, and `assignments.section` filled in by `generate-daily-homework` and `manage-assignment`.
- `generate-daily-homework` has no `getUser`/`teacher_covers` check.
- `TeacherDashboard` uses `get_class_averages(_class_name)`, which works off `student_inner_os` and merges sections.
- `teacher_todos` has no writer anywhere in `src/` or `supabase/functions/`.
- `/admin`, `/admin/schools`, `/admin/analytics` and `/admin/settings` are not wrapped in `ProtectedRoute`.
- Any pilot fix must check RLS on `assignments` for section scope, and must leave existing RLS policies unchanged unless they are explicitly approved.
