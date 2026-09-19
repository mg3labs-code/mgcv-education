# Stabilize homework and assignment targeting

## Scope
- Keep uploaded student answers from remaining pending by registering the existing evaluation request with the edge runtime before returning, while preserving failure logging and a safe fallback.
- Generate daily homework at the selected class level instead of always using Class 10.
- Carry the selected board through both assignment creation paths: schedule-generated homework and teacher-created assignments.

## Implementation
1. Update `manage-assignment` so the answer-evaluation promise is passed to `EdgeRuntime.waitUntil(...)` when available, with the existing logged `.catch(...)`; use the same promise in the fallback path.
2. Update `generate-daily-homework` to accept `board`, use `class_name` in the AI prompt, and persist `board` on the assignment.
3. Update the teacher schedule invocation to send its resolved `board` value.
4. Update manual assignment creation to read and persist the UI-provided `board`.

## Verification
- Run focused source checks and automated tests.
- Deploy both changed edge functions.
- Test the relevant edge-function request paths and inspect their logs if a test reports an error.

## Boundaries
- Do not alter section targeting, RLS policies, `teacher_covers`, homework generation behavior beyond class-level wording and board persistence, or unrelated code.
