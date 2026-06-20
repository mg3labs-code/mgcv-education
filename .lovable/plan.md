## Goal
Stop rejecting reasonable passwords like `Password123` and enforce a clear, predictable rule on signup.

## Root cause
The "Password is known to be weak and easy to guess" message comes from Supabase's HIBP (Have I Been Pwned) leaked-password check, which is currently enabled on this Cloud project. It rejects any password that has ever appeared in a public breach, regardless of strength. The frontend only enforces `minLength={6}` on the `<input>`, with no character-class rules.

## Changes

### 1. Backend (Lovable Cloud auth settings)
Call `supabase--configure_auth` to set `password_hibp_enabled: false` (leaving other flags unchanged: `disable_signup: false`, `external_anonymous_users_enabled: false`, `auto_confirm_email` left at current value). This removes the breach-database rejection so our own rule is the source of truth.

Note: Supabase's built-in minimum-length / required-characters settings are not modified — our frontend rule is stricter than the default 6-char minimum and runs before the API call, so this is sufficient.

### 2. Frontend validation — `src/pages/Index.tsx`
- Add a small helper:
  ```ts
  const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const PASSWORD_MESSAGE =
    "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, and one number.";
  ```
- In `handleSubmit`, when `authMode === "signup"`, validate `password` against `PASSWORD_RULE` before calling `signUp`. On failure, set `loginError` to `{ message: PASSWORD_MESSAGE, code: "AUTH_WEAK_PASSWORD", suggestion: PASSWORD_MESSAGE }` and return early.
- Update the password `<input>` at line 688: change `minLength={6}` to `minLength={8}` and add `title={PASSWORD_MESSAGE}` for native tooltip parity.
- In `parseError`, add a branch above the existing "Password should be at least" branch:
  - If `msg` includes `"weak"`, `"known to be weak"`, `"pwned"`, or `"compromised"` (defensive — in case HIBP is ever re-enabled), return `{ message: PASSWORD_MESSAGE, code: "AUTH_WEAK_PASSWORD", suggestion: PASSWORD_MESSAGE }`.
  - Also update the existing "Password should be at least" branch's `suggestion` to `PASSWORD_MESSAGE` for consistency.

### 3. Out of scope (not modified)
- `AuthContext.signUp` logic, metadata, teacher map handling
- Login flow (existing accounts with shorter passwords keep working)
- Database schema, RLS, triggers
- `ForgotPasswordModal` (reset flow uses Supabase's own UI rules; can be addressed separately if requested)

## Verification
- Try `Password123`, `Srikruthi2026`, `EduTech123`, `LearnMath9` → signup proceeds.
- Try `password123`, `PASSWORD123`, `Password`, `Pass12` → blocked client-side with the new message, no network call.
