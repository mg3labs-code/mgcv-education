## Multi-Board Database Architecture

Goal: clean, conflict-free schema where students see only teachers matching their exact Board + Grade + Section, and teachers can hold many (Subject + Board + Grade + Section) mappings.

### 1. Decisions to confirm before I build

1. You said "delete old table" — this is destructive. The current DB has live data: `profiles`, `teacher_assignments`, `assignments`, `calendar`, `attendance`, `student_inner_os`, `episode_progress`, etc., many of which depend on `profiles.class_name` (text like "Class 10"). Confirm one of:
   - **A. Hard reset**: drop and recreate `profiles`, `teacher_assignments`, and wipe dependent rows (all student progress, attendance, calendar, assignments lost). Fastest, cleanest schema.
   - **B. Migrate in place**: keep existing tables, add `board`, `grade`, `section` columns alongside `class_name`, backfill `class_name = 'Class ' || grade`, keep history intact.
   I will default to **B** unless you say "hard reset".

2. You wrote "Grade 7th to 9th" in the student form but the platform today covers Class 6–10 (and JEE). Confirm grade range to expose in dropdowns: **6–10** (keep current), or strictly **7–9**.

3. "Separate collections users_admin / users_teachers / users_students" — Postgres + Supabase Auth uses one `auth.users`. The clean equivalent is one `auth.users` row + role-specific profile tables (`student_profiles`, `teacher_profiles`, `admin_profiles`) joined by `user_id`. I will implement it that way. Confirm OK.

### 2. New schema (Option B, in-place migration)

Lookup tables (seeded):
- `boards(code text pk, name text)` → CBSE, ICSE, BSE_TELANGANA, …
- `grades(grade int pk, label text)` → 6..10
- `sections(code text pk)` → A..F
- `subjects_catalog(code text pk, name text)` → Mathematics, Science, Physics, …

Profile tables (1-to-1 with `auth.users`):
- `student_profiles(user_id pk → auth.users, full_name, phone, board, grade, section, school_name)`
  - UNIQUE(user_id). Indexed on (board, grade, section).
- `teacher_profiles(user_id pk, full_name, phone, school_name, sections text[])`
- `admin_profiles(user_id pk, full_name, phone, boards text[], grades int[])`

Mapping table (replaces `teacher_assignments`):
- `teacher_teaching_map(id pk, teacher_id → auth.users, subject, board, grade, section)`
  - UNIQUE(teacher_id, subject, board, grade, section)
  - Indexed on (board, grade, section, subject) for the student lookup.
  - Multi-section entry from UI = one row per section (normalized).

Helper functions (SECURITY DEFINER, replace `teacher_teaches` / `get_user_class`):
- `student_context(uid) returns (board, grade, section)`
- `teacher_covers(teacher_id, board, grade, section, subject) returns bool`

RLS:
- Student profile: self read/write; teachers can read students where `teacher_covers(auth.uid(), board, grade, section, NULL)`.
- Teacher map: teacher self CRUD; students can read rows matching their own (board, grade, section).
- Existing tables keyed by `class_name`: add `board` + `section` columns (nullable, backfilled) and update policies to use the new helper.

### 3. Student → Teacher matching query

```sql
select tp.user_id, tp.full_name, m.subject
from teacher_teaching_map m
join teacher_profiles tp on tp.user_id = m.teacher_id
where (m.board, m.grade, m.section) =
      (select board, grade, section from student_profiles where user_id = auth.uid());
```

Exposed as a view `my_teachers` for the student app.

### 4. Onboarding UX changes

- `src/pages/StudentOnboarding.tsx`: replace "Class" buttons + Board cards with three required dropdowns — Board, Grade, Section. Drop subject picker (subjects are derived). Save to `student_profiles`.
- New `src/pages/TeacherOnboarding.tsx` (or extend signup): name, phone, sections multi-select, plus a repeatable "Teaching Preference" row builder (Subject + Board + Grade + Sections multi-select → expands to N rows in `teacher_teaching_map`). Add/Remove row buttons. Editable later from `TeacherSettings.tsx`.
- New `src/pages/AdminOnboarding.tsx`: name, phone, boards multi-select, grades multi-select.
- `AuthContext.signUp` signature extended with `board`, `grade`, `section` for students and `teachingMap[]` for teachers; `handle_new_user` trigger updated to route to the correct profile table by role.

### 5. Code touchpoints

- `src/hooks/useTeacherAssignments.ts` → read/write `teacher_teaching_map`.
- `src/components/teacher/TeacherClassSubjectMatrix.tsx` → rebuild as Board × Grade × Section × Subject matrix.
- `src/components/teacher/TeachingCalendar.tsx`, `TeacherSchedule.tsx`, `TeacherDashboard.tsx` → derive available (board, grade, section, subject) from the new map; remove hardcoded class lists.
- Student pages (`StudentDashboard`, `StudentCalendar`, `StudentAssignments`, `StudentTextbook`) → filter by `(board, grade, section)` instead of `class_name`.
- `calendar`, `assignments`, `attendance`, `teaching_schedules` tables → add `board`, `section`; policies switch to `teacher_covers` + student context.
- Seed `boards`, `grades`, `sections`, `subjects_catalog`.

### 6. Rollout order

1. Migration 1 — lookup tables + seeds + `student_profiles` / `teacher_profiles` / `admin_profiles` + `teacher_teaching_map` + helpers + RLS.
2. Migration 2 — add `board` / `section` to dependent tables, backfill from `profiles.class_name`, swap policies.
3. Frontend — onboarding flows, settings editor, matching query, remove class/subject hardcoding.
4. Migration 3 (optional, after verification) — drop legacy `teacher_assignments` and `profiles.class_name`.

### Questions for you

1. Hard reset (A) or in-place migration (B, default)?
2. Grade range: 6–10 or 7–9?
3. OK with one `auth.users` + three role-profile tables instead of literal separate user collections?
4. Should the legacy `teacher_assignments` table and `profiles.class_name` be dropped at the end, or kept as a fallback for a release?
