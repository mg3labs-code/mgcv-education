# Batch 3: subject coverage audit, upload regression and checkpoint 9

Date: 2026-10-04 (IST evening). This audit changed no app behavior and no subject data. The only test data created belongs to the QA teacher and QA students. Earlier passing evidence is unchanged.

## Subject coverage (CBSE Class 9, read-only)

| Subject / check | Expected | Actual | Result | Evidence | Smallest required fix |
|---|---|---|---|---|---|
| Maths 9A (qa.t1): syllabus vs plan vs calendar | 13 chapters in all three | 13 / 13 / 13; lessons 2026-10-05 → 2027-01-07 | PASS | live tables | none |
| Maths 9A (qa.t1): homework topic matches calendar | every homework linked to a lesson on its date | 12 do not match. All 12 are labelled QA test homework (`qa-fault-*`, `qa-due-*`, `qa_batch2_*`) | PASS (QA test homework, expected) | assignment topic keys | none; QA cleanup can remove them later |
| Maths 9A: one teacher per class and subject | one Maths plan reaches 9A students | Two teachers (qa.t1 and the pilot teacher account) both publish Maths lessons for CBSE 9A. The student sees 58 Maths lessons from both | FAIL (data) | student calendar read as qa.s1 | school decides which teacher owns 9A Maths; remove the other mapping |
| Maths 9B (qa.t2) | a plan, or a clear "no plan" | no plan, no calendar, no homework | NO PUBLISHED PLAN | live tables | QA account only; no fix needed unless 9B is in the pilot |
| Physics 9A | 5 chapters in all three | 5 / 5 / 5; 56 lessons through 2026-10-05; 1 of 3 homework published, all correctly scoped | PASS | live tables; student sees 56 lessons and the 1 published homework | none |
| Physics: calendar continues past today | plan dates run to the end of term | last lesson is 2026-10-05 | FAIL (stale) | calendar range | teacher extends the Physics plan (no regeneration of others) |
| English 9A | 18 chapters in all three | 18 / 18 / 18, correctly scoped; last lesson 2026-10-05 | PASS, but stale after 10-05 | live tables | teacher extends the plan |
| Chemistry 9A / 9F: syllabus | CBSE Chemistry chapters exist | CBSE Class 9 has no separate Chemistry syllabus. Its chemistry is inside "Science" (12 chapters) | FAIL (configuration) | syllabus table | school confirms whether Chemistry is taught as its own subject or as part of Science |
| Chemistry: saved plan matches the subject | chemistry chapters only | the plan holds all 12 Science chapters, including Motion, Sound, Tissues and other Physics and Biology chapters | FAIL (mismatch) | saved plan chapter list | teacher removes the non-chemistry chapters (Matter, Pure, Atoms, Structure of Atom stay) |
| Chemistry: calendar matches the plan | 12 planned chapters on the calendar | only 2 chapters appear (Matter in Our Surroundings, Atoms and Molecules) | FAIL (mismatch) | calendar | rebuild the Chemistry calendar from the corrected plan |
| Chemistry: published vs what students see | 9A students see the Chemistry calendar | lessons are saved without a section, and 2 lack a board. A 9A student sees **0** Chemistry lessons | FAIL | student calendar read as qa.s1 = 0 | save the board and section (A/F) on Chemistry lessons |
| Chemistry: homework scope | board + section set | 2 drafts, neither published; one has no board, neither has a section | FAIL (would be invisible if approved) | assignments | set board/section before approving |
| Sanskrit 9A | Sanskrit chapters | no syllabus and no saved plan. The calendar shows 13 "Sanskrit" chapters, 12 of which are Science chapter names | FAIL (mismatch) | calendar chapter names; the student sees these 33 lessons | remove the wrongly labelled lessons; add the Sanskrit syllabus |
| Science 9D | a plan, or a clear "no plan" | mapped teacher, but no plan, calendar or homework | NO PUBLISHED PLAN | live tables | teacher creates the plan if 9D is in the pilot |
| Biology, Hindi, Social Science | appear only if a teacher is assigned | about 25–30 lessons each from the pilot teacher account, saved without a section or a teacher assignment, one chapter each | FAIL (orphan data) | calendar | remove them, or assign the teacher and section |

## Upload regression after tonight's JPG/PDF fix (real AI, qa.t1 and qa.s1, homework 668eabe7…)

| Check | Expected | Actual | Result |
|---|---|---|---|
| Phone photo with motion-video data after the picture (old check would reject) | accepted | 200 | PASS |
| Compressed scanned PDF with a hidden page list (old check would reject) | accepted | 200 | PASS |
| Stored file bytes | identical to the upload | identical (JPG and PDF) | PASS |
| AI marking of the photo / PDF | 3/3 each | 3/3 each, no errors | PASS |
| Teacher review → finalize | total 6 | 6; student sees finalized 6 | PASS |
| Finalized answer replaced by a new photo | refused | 409 | PASS |
| Program renamed as photo, text as PDF, corrupt JPG, half-cut PDF, PDF labelled JPG | refused, nothing stored | all 400, no answers stored | PASS |
| Earlier accepted files (journey PDFs/PNG, plain PDF) | still accepted | accepted | PASS |
| Genuine camera file from a physical phone | accepted | phone-style files generated here, not from a device | NOT TESTED (physical-device gate) |

## Checkpoint 9: Student Understanding isolation

| Check | Expected | Actual | Result |
|---|---|---|---|
| T1 (9A Maths) sees the student's Day-2 explanation | visible | visible | PASS |
| T2 (9B) asking for 9A; T2's own 9B list | nothing | nothing | PASS |
| T1 asking for another board (stand-in for T3; no third QA teacher exists) | nothing | nothing | PASS |
| Classmate student, signed-out request, direct row read | nothing | nothing | PASS |

The test explanation was deleted afterwards.

## Decision

The upload fix and checkpoint 9 pass. The subject audit found data problems in Chemistry, Sanskrit, the orphan subjects, the duplicate 9A Maths teacher and stale plans for Physics and English. These are data and configuration issues, not app defects. Each needs a school or teacher decision before anything changes, so nothing was changed. **Pilot readiness: PENDING.** Remaining gates: real Android and iPhone, Saturday policy, the isolated 40-student test, and the subject data decisions above.

Evidence: `result_upload_regression.json`, `log_upload_regression.txt`, `result_cp9.json`, `log_cp9.txt`.
