# Batch 2 consolidated reliability report

Date: 2026-10-04. Environment: the preview and published app share one Lovable Cloud database; no isolated QA database exists.

| Gate | Result | Evidence |
|---|---|---|
| 40-student concurrent load | **NOT TESTED** | Creating 33 accounts would affect the shared production database, so no accounts were created. |
| Limited mocked load | **PASS** | Two allowlisted QA students; 8 concurrent uploads and 2 submissions. All 8 evaluations succeeded; no duplicates or stuck rows. Upload latency 2.343–3.978s (median 3.756s); 8.513s end-to-end plus 3.125s settle. Scoped reset preserved unrelated records. |
| Small real-AI load sample | **PASS** | One QA student; 4 concurrent uploads and one submission. Four successful evaluations, 5.135s end-to-end plus 2.384s settle. Scoped reset preserved unrelated records. |
| IST midnight / local date | **PASS** | With the clock at 2026-10-02 18:31 UTC (2026-10-03 00:01 IST), the app selected 2026-10-03. The generation request sends a local `YYYY-MM-DD` date. |
| Weekend and holiday due dates | **PASS** | Live records show 2026-10-01 due 2026-10-05 (Gandhi Jayanti, Saturday, Sunday skipped), 2026-10-22 due 2026-10-23, and Friday 2026-10-23 due Monday 2026-10-26. |
| Saturday treated as school day | **PASS (configuration test)** | Friday advances to Saturday when Saturday is enabled; a Saturday holiday advances to Monday. |
| Saturday treated as non-school day | **PASS (current configuration)** | Friday advances to Monday. Manual exact-date calendar overrides persist. The school's actual Saturday policy remains **UNCONFIRMED**. |
| Varied generated-question marking | **PASS** | Fresh Linear Equations set, five different generated questions. Expectations were fixed from the actual wording before the final run. Real AI matched 10/10: correct/partial student = 2,1,3,3,4; wrong student = 0,0,0,0,0. Earlier attempts used answers for a different generated set and were discarded as faulty fixtures. |
| Evaluation recovery | **PASS** | Batch 1 recovery evidence retained: timeouts, 429, credit/service failures and malformed responses recover; concurrent retries, overrides and finalized results remain safe. Current database has zero evaluations processing for more than 10 minutes. |
| Monitoring / data integrity | **PASS** | Database and connection pool healthy; 0 duplicate student-assignment submissions, 0 duplicate question answers, 0 stuck evaluations. Teacher live intelligence refreshes every 10 seconds and shows honest empty states. |
| Student data isolation | **PASS** | Golden Journey CP10: one QA student cannot read another student's submission, answers or files; file bytes remain unchanged after rejected writes. |
| QA launch controls | **PASS** | `qa_fault_injection_enabled=false` and `qa_reset_enabled=false` in the shared production database after testing. Fault directives also require exact allowlisted QA account IDs. |
| Physical Android Chrome journey | **NOT TESTED** | Requires a real Android phone, including camera/file upload and results. Viewport emulation is not accepted. |
| Physical iPhone Safari journey | **NOT TESTED** | Requires a real iPhone, including camera/file upload and results. Viewport emulation is not accepted. |

## Overall decision

**Pilot readiness: PENDING.** The 40-student gate and both physical-device journeys remain NOT TESTED, and the school must confirm its Saturday policy. Available Batch 2 checks passed.

Supporting files: `result_batch2_load.json`, `result_batch2_varied.json`, `log_batch2_load.txt`, `log_batch2_varied.txt`; date-policy tests in `src/test/schoolDayPolicy.test.ts` and calendar persistence test.