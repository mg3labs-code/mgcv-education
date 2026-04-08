

# Production Readiness Review & Launch Plan

## Current State Assessment

Your app is a **fully functional MVP** with authentication, role-based access (student/teacher/admin), a 7-layer textbook system, AI companion, voice features, assignments, attendance, and analytics. However, it has **critical security gaps** and missing production infrastructure that must be fixed before real users touch it.

---

## 🔴 CRITICAL — Fix Before Launch (Week 1)

### 1. Security Vulnerabilities (3 found by scan)

| Issue | Risk | Fix |
|-------|------|-----|
| **Privilege escalation** — any logged-in user can INSERT into `user_roles` and make themselves admin/teacher | **Critical** | Add RLS INSERT/UPDATE/DELETE policies restricting role changes to admins only using `has_role()` |
| **API keys publicly readable** — `app_config` table (ElevenLabs agent ID etc.) has `USING: true` SELECT policy | **High** | Restrict to authenticated users or move secrets to environment variables |
| **Missing INSERT policy on `student_inner_os`** — anyone can create score records for any user | **Medium** | Add `WITH CHECK (auth.uid() = user_id)` INSERT policy |
| **Teacher alerts** — students can create fake teacher alerts | **Medium** | Add `has_role` check to INSERT policy |
| **Answer file storage** — no DELETE/UPDATE policies | **Medium** | Add owner-scoped storage policies |

### 2. Enable Leaked Password Protection
Currently disabled. One toggle in Cloud → Users → Auth Settings.

### 3. Add Error Boundary
No React Error Boundary exists. A crash in any component takes down the entire app with a white screen. Add a global `ErrorBoundary` component wrapping `<Routes>`.

### 4. Onboarding State in localStorage
`ProtectedRoute` checks `localStorage` for onboarding completion — this resets if student clears browser data or switches devices. Move to database (profiles table).

---

## 🟡 IMPORTANT — Fix Before Scaling (Week 2)

### 5. Performance & Reliability
- **No query error handling UI** — when Supabase queries fail, users see blank screens. Add error states to all data-fetching pages.
- **No retry/offline handling** — configure React Query with sensible `retry`, `staleTime`, and `gcTime` defaults instead of bare `new QueryClient()`.
- **Bundle size** — 30+ pages loaded eagerly. Add `React.lazy()` + `Suspense` for route-level code splitting.

### 6. Edge Function Hardening
- Add request validation (check required fields, sanitize inputs) on all 14 edge functions.
- Add consistent error response format across all functions.
- Add request size limits to prevent abuse.

### 7. Monitoring & Logging
- Add a frontend error tracking service (e.g., Sentry via a script tag — no backend needed).
- Add basic analytics to track user engagement (page views, feature usage).

---

## 🟢 RECOMMENDED — Polish for Market (Week 3-4)

### 8. Content Completeness
- Currently only Math Chapter 1 has rich hardcoded content. Other subjects rely on AI-generated content which may have gaps.
- Audit all 8 subjects × Chapter 1 to ensure every episode has working blocks.

### 9. Mobile Testing
- Test all critical flows on actual mobile devices (textbook reading, assignments, voice features).
- The textbook episode page has complex interactions (tap-to-place, swipe) that need real device testing.

### 10. SEO & Meta Tags
- Add proper `<title>`, `<meta description>`, Open Graph tags for the landing page.
- Add `robots.txt` rules (already exists but verify).

### 11. Legal & Compliance
- Privacy Policy and Terms of Service pages (required for any education product handling student data).
- Cookie consent if targeting EU users.
- Data retention and deletion policies.

---

## Launch Checklist Summary

```text
WEEK 1 (Must-have):
 □ Fix 5 RLS security vulnerabilities
 □ Enable leaked password protection
 □ Add React Error Boundary
 □ Move onboarding state to database
 □ Test auth flows end-to-end

WEEK 2 (Should-have):
 □ Add error states to all pages
 □ Configure React Query defaults
 □ Route-level code splitting
 □ Edge function input validation
 □ Error tracking (Sentry or similar)

WEEK 3-4 (Nice-to-have):
 □ Audit content for all subjects
 □ Mobile device testing
 □ SEO meta tags
 □ Privacy Policy / Terms pages
 □ Performance audit (Lighthouse)
```

## Estimated Effort
- **Week 1 (Critical)**: ~2-3 days of implementation
- **Week 2 (Important)**: ~3-4 days
- **Week 3-4 (Polish)**: ~5-7 days

Shall I start with the critical security fixes first?

