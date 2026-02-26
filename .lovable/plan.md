

# Fix Expired File URLs + Enhance Deep Dive with Daily Quiz

## Two Changes

### 1. Fix "InvalidJWT" on View Original File (Permanent File Storage Fix)

**Problem**: The `manage-assignment` edge function stores a pre-signed URL (expires in 1 hour) in `student_answers.file_url`. When teachers click "View Original File" later, the URL has expired.

**Fix**: In `src/pages/TeacherAssignments.tsx`, add a helper function that extracts the storage path from the expired signed URL and generates a fresh signed URL on click.

**File: `src/pages/TeacherAssignments.tsx`**
- Add `openFile(fileUrl)` helper that:
  1. Parses the stored URL to extract the path after `answer-files/` and before `?token=`
  2. Calls `supabase.storage.from("answer-files").createSignedUrl(path, 3600)`
  3. Opens the fresh URL in a new tab
- Replace the two `<a href={ans.file_url}>` links (lines ~451 and ~544) with `<button onClick={() => openFile(...)}>` elements

**Also fix the edge function** (`supabase/functions/manage-assignment/index.ts`):
- In the `upload_answer` action, store the raw storage path (e.g. `userId/assignmentId/questionId.ext`) instead of the signed URL in `file_url`. This prevents future expiry issues for new uploads.
- Keep the signed URL only for the immediate AI evaluation call.

### 2. Enhance Deep Dive + Add Daily Knowledge Quiz (from HTML)

The HTML file has a "Daily Knowledge Quiz" that unlocks after 100% class completion. It pulls questions from all subjects, shuffles them, and presents 10 at a time. This is separate from the per-subject "Pop Quiz".

**Changes:**

**File: `src/pages/StudentDashboard.tsx`**
- Add a "Daily Knowledge Quiz" button in the sidebar "Today" card (matching the HTML's `quiz-btn`)
- Quiz unlocks only when all classes are marked complete (100% progress), matching the HTML behavior
- Show celebration animation when 100% reached
- Display quiz score in the Quick Stats section

**File: `src/data/popQuizData.ts`**
- Add the missing "study skills" / general questions from the HTML (3 questions about study techniques)
- Add a `getDailyQuiz(count)` function that pulls questions from ALL subjects + general, shuffles, and returns `count` questions

**File: `src/components/student/PopQuizModal.tsx`**
- Support a `mode` prop: `"subject"` (existing per-subject quiz) or `"daily"` (cross-subject daily quiz)
- In daily mode, show the subject label next to each question
- After submission, show detailed answer review (matching the HTML's `showDetailedAnswers`)

**File: `src/pages/StudentDeepDive.tsx`** - No changes needed (already working)

### Summary of Files

| File | Action |
|------|--------|
| `src/pages/TeacherAssignments.tsx` | Add `openFile` helper, replace 2 anchor tags |
| `supabase/functions/manage-assignment/index.ts` | Store raw path instead of signed URL |
| `src/pages/StudentDashboard.tsx` | Add daily quiz unlock logic + button + celebration |
| `src/data/popQuizData.ts` | Add general questions + `getDailyQuiz` function |
| `src/components/student/PopQuizModal.tsx` | Add daily mode with cross-subject questions + answer review |

