

# Production Database Schema — All Features

## Current State

Almost every page uses hardcoded mock data. Here's what needs real tables:

| Feature Area | Current State | Needs |
|---|---|---|
| Student Inner OS scores | Hardcoded constants in StudentDashboard | Per-student dimension tracking |
| Student breakthroughs | Hardcoded array | Milestone event log |
| Episode/layer progress | No tracking at all | Per-student episode completion + layer scores |
| Learning streaks | Hardcoded "7 Day Streak" | Daily login/activity tracking |
| Method usage (Tutorial Defense, First Principles, etc.) | No tracking | Per-student method session log |
| Teacher class stats (Clarity, Reasoning, etc.) | Hardcoded in TeacherDashboard | Aggregated from student scores |
| Teacher alerts | Hardcoded 3 alerts | Generated from student behavioral patterns |
| Teacher AI insights | Hardcoded 4 items | Generated per class from activity data |
| Teacher daily schedule | Hardcoded in TeacherDailyTodo | Per-teacher daily plan items |
| Admin school analytics | Hardcoded in AdminDashboard | Aggregated from all classes |
| Student onboarding preferences | Partially saved | Extend profiles or new table |

## New Tables (8 tables)

### 1. `student_inner_os` — Core dimension scores per student
```
id uuid PK
user_id uuid UNIQUE → auth.users ON DELETE CASCADE
clarity_score int DEFAULT 45
thinking_score int DEFAULT 40
attention_score int DEFAULT 42
momentum_score int DEFAULT 38
character_score int DEFAULT 44
overall_score int DEFAULT 42
streak_days int DEFAULT 0
level int DEFAULT 1
weekly_growth numeric DEFAULT 0
updated_at timestamptz DEFAULT now()
created_at timestamptz DEFAULT now()
```
RLS: Student reads/updates own. Teacher reads students in their class.

### 2. `student_breakthroughs` — Achievement milestones
```
id uuid PK
user_id uuid → auth.users ON DELETE CASCADE
title text NOT NULL
description text
icon text DEFAULT '🏆'
dimension text (nullable — clarity/thinking/etc)
xp_earned int DEFAULT 10
created_at timestamptz DEFAULT now()
```
RLS: Student reads own. Teacher reads class students.

### 3. `episode_progress` — Per-student episode + layer completion
```
id uuid PK
user_id uuid → auth.users ON DELETE CASCADE
chapter_id text NOT NULL
episode_id text NOT NULL
layer_scores jsonb DEFAULT '{}'  -- e.g. {"concept":85,"reasoning":70,...}
completion_pct int DEFAULT 0
time_spent_seconds int DEFAULT 0
started_at timestamptz DEFAULT now()
completed_at timestamptz (nullable)
UNIQUE(user_id, chapter_id, episode_id)
```
RLS: Student manages own. Teacher reads class students.

### 4. `method_sessions` — Tutorial Defense, First Principles, Case Study usage
```
id uuid PK
user_id uuid → auth.users ON DELETE CASCADE
method_type text NOT NULL CHECK (method_type IN ('tutorial_defense','first_principles','case_study','peer_teaching'))
chapter_id text
episode_id text
score int (nullable)
duration_seconds int DEFAULT 0
completed boolean DEFAULT false
created_at timestamptz DEFAULT now()
```
RLS: Student manages own. Teacher reads class students.

### 5. `daily_activity` — Login/usage tracking for streaks + engagement
```
id uuid PK
user_id uuid → auth.users ON DELETE CASCADE
activity_date date DEFAULT CURRENT_DATE
episodes_completed int DEFAULT 0
time_spent_seconds int DEFAULT 0
methods_used int DEFAULT 0
layers_completed int DEFAULT 0
created_at timestamptz DEFAULT now()
UNIQUE(user_id, activity_date)
```
RLS: Student manages own. Teacher reads class students.

### 6. `teacher_alerts` — Generated alerts for teachers about students
```
id uuid PK
teacher_id uuid → auth.users ON DELETE CASCADE
student_id uuid → auth.users ON DELETE CASCADE
class_name text NOT NULL
alert_type text NOT NULL CHECK (alert_type IN ('critical','warning','success'))
title text NOT NULL
message text NOT NULL
suggested_action text
is_read boolean DEFAULT false
is_dismissed boolean DEFAULT false
created_at timestamptz DEFAULT now()
```
RLS: Teacher manages own alerts.

### 7. `teacher_todos` — Teacher daily planning items
```
id uuid PK
teacher_id uuid → auth.users ON DELETE CASCADE
date date DEFAULT CURRENT_DATE
title text NOT NULL
description text
class_name text
status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed'))
priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high'))
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```
RLS: Teacher manages own.

### 8. `student_preferences` — Onboarding + personalization data
```
id uuid PK
user_id uuid UNIQUE → auth.users ON DELETE CASCADE
grade int
learning_style text
interests text[]
preferred_language text DEFAULT 'en'
difficulty_level text DEFAULT 'medium'
onboarding_completed boolean DEFAULT false
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```
RLS: Student manages own. Teacher reads class students.

## Trigger Updates

### `handle_new_user` — Auto-seed on signup
When role = 'student':
- INSERT into `student_inner_os` with defaults
- INSERT into `student_preferences` with defaults
- INSERT into `daily_activity` for today

### `update_updated_at` trigger
Apply to: `student_inner_os`, `teacher_todos`, `student_preferences`

## Database Functions

### `get_class_averages(class_name text)`
Returns aggregated Inner OS averages for a class — used by Teacher Dashboard stat cards instead of hardcoded values.

### `get_student_streak(user_id uuid)`
Counts consecutive days in `daily_activity` — returns streak count.

## Code Changes

| File | Change |
|---|---|
| `src/pages/StudentDashboard.tsx` | Replace `INNER_OS_DIMENSIONS`, `BREAKTHROUGHS`, `OVERALL_SCORE` with `useQuery` fetches from `student_inner_os` + `student_breakthroughs` |
| `src/pages/TeacherDashboard.tsx` | Replace `STAT_CARDS`, `ALERTS`, `AI_INSIGHTS` with `useQuery` fetches from `get_class_averages()` + `teacher_alerts` |
| `src/pages/TeacherDailyTodo.tsx` | Replace hardcoded `scheduleItems` with `useQuery` from `teacher_todos` + CRUD operations |
| `src/pages/AdminDashboard.tsx` | Replace hardcoded `classData` with aggregated query across all classes |

## Migration Order

1. **Migration 1**: Create all 8 tables + RLS policies
2. **Migration 2**: Update `handle_new_user` trigger to seed student tables
3. **Migration 3**: Create `get_class_averages` and `get_student_streak` functions
4. **Migration 4**: Seed existing students with default data
5. **Code updates**: Update 4 page files to fetch from DB

## What This Enables

- Student sees **real** progress that updates as they complete episodes
- Teacher sees **real** class averages aggregated from student data
- Teacher gets **real** alerts when students show declining patterns
- Admin sees **real** school-wide metrics
- Streaks calculated from **actual** daily activity
- Episode completion tracked per layer for granular analytics
- Method usage (Tutorial Defense, etc.) tracked for pedagogy insights

