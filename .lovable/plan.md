

## Fix Authentication Flow

### Problem 1: Wrong Sign-In Page
The `ProtectedRoute` component redirects unauthenticated users to `/auth` (a separate page that was added for the retry feature). But your real sign-in experience is on the landing page (`/`) with the dark-themed modal login. Users should never see the `/auth` page.

### Problem 2: "Failed to Fetch" in Preview
The preview environment runs inside an iframe, which causes browsers to block cross-origin authentication requests. This is a known limitation of iframe-based previews -- not a code bug. The fix is to detect when the app runs in an iframe and prompt users to open in a new tab.

---

### Changes

**1. Update `ProtectedRoute.tsx`**
- Change the redirect from `/auth` to `/` so unauthenticated users land on the main page with the modal login.

**2. Remove `/auth` route from `App.tsx`**
- Remove the `AuthPage` import and route since it's not needed.

**3. Delete `src/pages/AuthPage.tsx`**
- This page is unused once the redirect points to `/`.

**4. Add iframe detection to `Index.tsx`**
- Detect if the app is running inside an iframe.
- If so, show a small banner or modify the login button to open the app in a new tab, which avoids the "Failed to fetch" issue entirely.

**5. Add iframe detection helper**
- Create a small utility `isInIframe()` that checks `window.self !== window.top`.

---

### Technical Details

```text
ProtectedRoute.tsx
  Line 19: Change <Navigate to="/auth" ...> --> <Navigate to="/" ...>

App.tsx
  Remove: import AuthPage
  Remove: <Route path="/auth" element={<AuthPage />} />

Index.tsx
  Add: iframe check at top of component
  Add: banner/link when in iframe saying "Open in new tab to sign in"
```

### Result
- Users always see the dark-themed landing page for login
- In iframe/preview: users see a prompt to open in a new tab, avoiding network errors
- On the live published URL: login works normally with no changes needed

