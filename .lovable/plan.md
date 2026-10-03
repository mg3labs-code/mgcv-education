# Repair assignment evaluation safeguards and rerun QA

## Scope
Fix only the five confirmed assignment defects and the inaccurate submitted/finalized error wording. Keep the earlier 3/3 result as historical evidence; do not change normal scoring policy or unrelated features.

## Changes
1. **Version every answer attempt**
   - Add an answer version and evaluation attempt token with an expiry.
   - Replacing an editable answer increments the version and clears every prior AI score, confidence, feedback, and error before evaluation begins.
   - A retry reserves a fresh attempt so concurrent or older workers cannot overwrite newer work.

2. **Make evaluation completion atomic**
   - Add narrowly scoped database operations that start, fail, or complete an evaluation only when the answer version, attempt token, expiry, and submission state still match.
   - Refuse every evaluation write after submission/finalization and preserve teacher overrides.
   - Convert expired `processing` attempts into a clear retryable failure.

3. **Harden AI marking**
   - Put the saved question and rubric in trusted evaluator instructions and wrap student content as explicitly untrusted data.
   - Require criterion-level scores that sum to the returned total and validate the structured result before saving.
   - Add bounded request timeouts and safe status-specific errors without changing the approved rubric or score expectations.
   - Keep QA fault controls restricted to the existing allowlisted accounts and enabled flag.

4. **Validate actual uploaded bytes**
   - Detect JPEG, PNG, WebP, and PDF signatures server-side rather than trusting names or browser labels.
   - Parse image structure and PDF structure sufficiently to reject corrupt, disguised, or fake files before storage or answer attachment.
   - Preserve the exact 10 MB boundary and clean up interrupted or race-losing uploads.

5. **Clarify locked-state errors**
   - Distinguish student-submitted work from teacher-finalized work in all upload, retry, grade, and finalize responses.

## Verification
- Update the focused recovery checks for stale marks, timeout recovery, prompt-injection variants, corrupt/disguised files, concurrent retries, and late writes.
- Recheck upload-versus-submit/finalize races, teacher-override preservation, stored file bytes, and the approved 10 → 8 total.
- Run one complete Golden Journey regression with real AI. Record it separately from the historical 3/3 evidence.
- If those checks pass, proceed directly through Batch 2: 40-student load, IST midnight and Saturday assumptions, real-device checks where available, varied-question marking, and the launch check.
- Stop dependent workflows at their first failure while continuing independent checks, and consolidate results into one report. Pilot readiness remains pending.
