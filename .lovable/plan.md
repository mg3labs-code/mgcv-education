## Goals

1. Restrict teachers to only the (class, subject) pairs they teach — multi-select via checkboxes.
2. Replace the JSONB `teaching_schedules.schedule_data` blob with a row-per-date `calendar` table so a single topic can be moved, inserted, or deleted without rewriting the whole month.
3. Refresh national holidays for academic year June 2025 → May 2026.
4. Give teachers explicit instance-level actions on the annual schedule: **Reschedule**, **Extend** (push following dates by N days), **Insert**, **Delete**, **Add holiday**.

---

## 1. Database changes (one migration)

### 1a. `subjects_catalog` (seed list)
Lightweight enum-like table: `id`, `key` (math, science, social, english, hindi, telugu…), `label`. Used to populate checkboxes.

### 1b. `teacher_assignments`
Columns: `id`, `teacher_id` (FK auth.users), `school_name`, `class_name`, `subject`, `created_at`.
Unique `(teacher_id, class_name, subject)`. One row per (class, subject) pair so a teacher who teaches Class 9 Math + Class 10 Math + Class 10 Science has 3 rows.

GRANT to `authenticated` + `service_role`. RLS: teacher reads/writes their own rows. Admins manage all via `has_role`.

### 1c. `teacher_teaches()` SECURITY DEFINER helper
`teacher_teaches(_teacher_id uuid, _class_name text, _subject text) returns boolean` — used in RLS on every teacher-writable table.

### 1d. New `calendar` table (replaces JSONB)
Columns:
- `id` uuid PK
- `teacher_id` uuid (FK auth.users)
- `school_name` text
- `class_name` text
- `subject` text
- `date` date NOT NULL
- `entry_type` text CHECK in ('topic','practice','test','assignment','holiday')
- `chapter_id` text NULL
- `chapter_name` text NULL
- `chapter_color` text NULL
- `topic_key` text NULL
- `topic_title` text NULL
- `label` text NULL  (e.g. "Diwali", "Mid-term Test")
- `is_national_holiday` boolean default false
- `notes` text NULL
- `created_at` / `updated_at`

Unique `(class_name, subject, date, entry_type)` — one schedule entry per slot. (Holidays from teacher view are class-agnostic but we still scope per class so each teacher manages their own.)

Indexes: `(class_name, subject, date)`, `(teacher_id, date)`.

RLS:
- Teacher INSERT/UPDATE/DELETE: `teacher_teaches(auth.uid(), class_name, subject)`
- Teacher SELECT: same
- Student SELECT: `class_name = get_user_class(auth.uid())`

GRANTs: SELECT, INSERT, UPDATE, DELETE → `authenticated`; ALL → `service_role`.

### 1e. Tighten RLS on existing tables
Replace permissive teacher policies on `teaching_schedules`, `assignments`, `attendance`, `teacher_alerts`, `assignment_questions` so writes require `teacher_teaches(auth.uid(), class_name, subject)`. Reads stay scoped to assigned (class, subject) for teachers, and `get_user_class()` for students.

### 1f. Holiday seed data
Insert national holidays Jun 2025 → May 2026 into `calendar` per (teacher, class, subject) **lazily** — actually better: keep a separate `national_holidays(date, label)` reference table, and the calendar UI reads it as a read-only overlay. Holidays added by teachers (school-specific) live in `calendar`.

`national_holidays` seeded with:
```
2025-08-15 Independence Day · 2025-08-19 Raksha Bandhan · 2025-08-26 Janmashtami
2025-10-02 Gandhi Jayanti · 2025-10-20 Dussehra · 2025-10-21 Diwali
2025-11-15 Guru Nanak Jayanti · 2025-12-25 Christmas Day
2026-01-26 Republic Day · 2026-02-15 Maha Shivaratri · 2026-03-04 Holi
2026-03-20 Eid-ul-Fitr · 2026-04-03 Good Friday · 2026-05-01 Buddha Purnima
2026-05-27 Bakrid
```
Public read for `authenticated` and `anon`.

---

## 2. Signup + profile changes

`src/pages/StudentOnboarding.tsx` / signup flow (teacher branch):

- After basic info, show a 2-column matrix: **Classes (Class 6 → Class 10)** × **Subjects** (Math, Science, Social, English, Hindi/Telugu).
- Each cell is a checkbox. Selected cells → batch `INSERT` into `teacher_assignments`.
- Minimum 1 selection required.

`AuthContext.signUp` extended to accept `assignments: {class_name, subject}[]` for teachers, inserted post-confirm.

Add `src/pages/TeacherSettings.tsx` (or extend existing settings page) with the same matrix to edit later.

---

## 3. Calendar refactor

### 3a. Teacher (`TeachingCalendar.tsx` + `TeacherSchedule.tsx`)
- Top toolbar: **Class dropdown** (only assigned classes) + **Subject dropdown** (only subjects for that class).
- Replace single Save with per-cell actions. Click a date cell → context menu/popover:
  - **Add topic** (from chapter's topic list)
  - **Add practice / test / assignment**
  - **Add holiday** (label input)
  - **Reschedule** (move this entry to another date — date picker)
  - **Extend** (push this entry + all later entries by N days)
  - **Delete**
- Each action = one row INSERT/UPDATE/DELETE on `calendar`. No more bulk JSONB upsert.
- "Auto-fill year" button: generates topic rows day-by-day skipping Sundays + national holidays, based on `getDefaultChapters()` teachingDays/practiceDays/testDays.
- Default chapters list lives in `src/data/defaultMathChapters.ts` (extract from current component).

### 3b. Student (`StudentCalendar.tsx` + `ScheduleCalendar.tsx`)
- Fetch `calendar` rows where `class_name = get_user_class()` for the visible month range, optionally filtered by subject dropdown.
- Overlay national holidays from `national_holidays`.
- Realtime: subscribe to `calendar` filtered by class for live updates when teacher reschedules.

### 3c. National holiday update
Replace hardcoded `nationalHolidays` object in `TeachingCalendar.tsx` and student calendar with a fetched list from `national_holidays`. Cached on mount.

---

## 4. Affected files

```
supabase/migrations/<new>.sql          (all schema + RLS + seeds)
src/contexts/AuthContext.tsx           (signUp accepts teacher assignments)
src/pages/StudentOnboarding.tsx        (teacher branch: class×subject matrix)
src/pages/TeacherSettings.tsx          (new — edit assignments)
src/data/defaultMathChapters.ts        (new — extracted constants)
src/data/nationalHolidays.ts           (new — fallback list)
src/hooks/useTeacherAssignments.ts     (new — list teacher's (class,subject))
src/hooks/useCalendar.ts               (new — CRUD + realtime on calendar table)
src/components/teacher/TeachingCalendar.tsx   (rewire to row-based CRUD + actions popover)
src/pages/TeacherSchedule.tsx          (drop bulk save; pass class/subject; new toolbar)
src/components/student/ScheduleCalendar.tsx   (read rows + holidays overlay)
src/pages/StudentCalendar.tsx          (fetch from calendar table + subject filter)
src/integrations/supabase/types.ts     (auto-regenerated after migration)
```

---

## 5. Order of work

1. Submit migration (tables, RLS, helper fn, holiday seeds). Wait for approval.
2. Build signup matrix + AuthContext changes.
3. Extract chapters constants and build `useCalendar` hook.
4. Refactor teacher calendar UI with action popover (reschedule / extend / insert / delete / holiday).
5. Refactor student calendar to read rows + subscribe realtime.
6. Add TeacherSettings page to edit assignments later.
7. Smoke-test: create teacher, assign Class 10 Math + Class 9 Science, schedule a topic, reschedule, delete, verify student of Class 10 sees only Class 10 math rows.

---

## 6. Risks / migration notes

- Existing `teaching_schedules` rows will not be auto-migrated to `calendar`. Acceptable since we're early — teachers re-publish via "Auto-fill year". If you want a one-time backfill SQL, say so and I'll add it.
- Tightening RLS on `assignments`/`attendance`/`teacher_alerts` may break any code that writes those tables without a subject. We'll default `subject` to the teacher's first assignment when the legacy code omits it, with a TODO to thread subject through.
- Realtime subscription on `calendar` filtered by `class_name` is cheap; one channel per logged-in student.
