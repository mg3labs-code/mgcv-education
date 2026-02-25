

# Plan: Upgrade OCR Quality and Enhance Teacher Submissions View

## Context

The current system uses `google/gemini-2.5-flash` for OCR. While Mistral OCR is excellent, it's not available on the Lovable AI gateway. The best available option for image-text extraction is `google/gemini-2.5-pro`, which is specifically designed for visual + text and complex reasoning tasks.

The teacher submissions dialog currently shows minimal info -- just processing status, AI score, and strengths/mistakes as a single line. The extracted text and rubric breakdown are hidden unless the teacher clicks "Grade." This makes it hard to quickly review what the AI actually saw and how it evaluated.

## Changes

### 1. Upgrade OCR Model (evaluate-answer edge function)

**File:** `supabase/functions/evaluate-answer/index.ts`

- Change OCR model from `google/gemini-2.5-flash` to `google/gemini-2.5-pro` (best for image-text extraction)
- Enhance the OCR prompt to better handle handwritten math, diagrams, and multi-language scripts common in Indian school boards

### 2. Enhance Teacher Submissions View

**File:** `src/pages/TeacherAssignments.tsx`

Expand each answer card in the submissions dialog to show:

- **Uploaded file link** -- clickable link to view the student's original file (if `file_url` exists)
- **Extracted text preview** -- collapsible section showing what the OCR extracted (truncated with "show more")
- **Rubric-wise scores** -- if `ai_feedback.rubric_scores` exists, show a small table with criterion vs score
- **Full AI feedback** -- strengths, mistakes, AND suggestions (currently suggestions are missing from the view)
- **Processing error details** -- already shown, but improve formatting

This gives teachers full visibility into the AI pipeline output without needing to open the grade modal.

### Technical Details

```text
Current submissions card layout:
+------------------------------------------+
| Question text          | status | conf%  |
| [error if failed]                        |
| AI Score: X/Y                            |
| strengths (one line), mistakes (one line) |
| [Grade button]                           |
+------------------------------------------+

New submissions card layout:
+------------------------------------------+
| Question text          | status | conf%  |
| [error + retry if failed]               |
| --- Uploaded File: [View Original] ---   |
| --- Extracted Text (collapsible) ---     |
| "The student wrote..."                   |
| --- AI Evaluation ---                    |
| Score: X/Y                               |
| Rubric: Concept 3/4, Method 2/3, ...    |
| Strengths: bullet list                   |
| Mistakes: bullet list                    |
| Suggestions: bullet list                 |
| [Grade button] [Teacher: X/Y if graded] |
+------------------------------------------+
```

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/evaluate-answer/index.ts` | Switch OCR model to `gemini-2.5-pro`, improve prompt |
| `src/pages/TeacherAssignments.tsx` | Expand answer cards with file link, extracted text, rubric scores, suggestions |

No database changes needed -- all data (`extracted_text`, `file_url`, `ai_feedback.rubric_scores`, `ai_feedback.suggestions`) is already stored.

