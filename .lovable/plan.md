# Ship MGCV as an Installable PWA

Goal: anyone with the link `https://edu.mg3verse.com` can tap "Install" and MGCV lands on their home screen with its own icon, splash screen, and fullscreen view — exactly like a Play Store app, but no store, no review, no fee. Updates ship instantly.

**Scope chosen:** Manifest-only install (no offline caching). Both a floating mobile install banner AND a dedicated `/install` landing page to share with schools and parents.

## What the user will experience

**On Android (Chrome/Edge):**
- Visit the link → small banner slides up: *"Install MGCV — open like an app"* → tap Install → icon on home screen.
- Or visit `/install` page → big "Install MGCV" button → same flow.

**On iOS (Safari):**
- Browser doesn't expose a programmatic install prompt. The `/install` page will show a clean step-by-step: *"Tap Share → Add to Home Screen"* with screenshots/icons.
- Banner on landing also detects iOS and shows the same hint.

**Once installed (both platforms):**
- Own app icon (MGCV branded)
- Opens fullscreen, no browser chrome
- Branded splash screen on launch
- Feels indistinguishable from a Play Store app for the student

## What we're NOT doing (deliberate)

- No service worker, no offline caching → avoids the Lovable preview-breaking issues and stale-content bugs. Online-only is fine for an AI learning app anyway.
- No Capacitor / Play Store wrapping yet → revisit after pilot stabilizes.
- No push notifications yet → can add later.

## Build steps

### 1. Web App Manifest (`public/manifest.webmanifest`)
- `name`: "MGCV — AI Learning for Class 6-10"
- `short_name`: "MGCV"
- `start_url`: `/student` (so installed app drops students straight into their dashboard)
- `display`: `standalone`
- `theme_color` + `background_color`: pulled from existing dark-slate/cream theme tokens
- `orientation`: `portrait`
- `icons`: 192×192, 512×512, 512×512 maskable (generated from existing favicon/branding)

### 2. Icons & splash assets (`public/icons/`)
- Generate MGCV-branded PNG icons at 192, 512, and 512-maskable sizes using imagegen, matching the teal-accent enterprise theme.
- Apple touch icon (180×180) for iOS home screen.

### 3. `index.html` meta tags
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<link rel="apple-touch-icon" ...>`
- `<meta name="theme-color" ...>`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="apple-mobile-web-app-title" content="MGCV">`

### 4. Install hook (`src/hooks/useInstallPrompt.ts`)
- Captures the `beforeinstallprompt` event on Android.
- Detects iOS Safari (no event available there).
- Detects "already installed" (standalone display mode) so we hide the prompt.
- Exposes: `{ canInstall, isIOS, isInstalled, promptInstall() }`.

### 5. Floating install banner (`src/components/InstallBanner.tsx`)
- Mobile-only, appears bottom of landing page after 5s.
- Dismissible (remembers dismissal in localStorage for 7 days).
- Android: "Install MGCV" button → triggers native prompt.
- iOS: "Add to Home Screen" → opens iOS instruction sheet.
- Hidden when already installed or on desktop.

### 6. Dedicated `/install` page (`src/pages/Install.tsx`)
- Hero: "Get MGCV on your phone"
- Big install button (Android) or step-by-step Share→Add to Home Screen card (iOS)
- Auto-detects platform, shows the right flow
- 3 trust badges: "No Play Store needed · Free · Updates instantly"
- Screenshots of the app for credibility
- Shareable link to give to schools/parents
- Route added to `App.tsx` (public, no auth)

## Important caveats to communicate

1. **Install prompt only appears on the published domain** (`edu.mg3verse.com` or `mgcv-education.lovable.app`), not inside the Lovable editor preview. Browsers refuse to install PWAs from iframes.
2. **iOS = manual install** (Apple restriction). The `/install` page handles this gracefully with a visual guide.
3. **No offline support** by choice. App needs internet (which is fine — AI features need it anyway).
4. **Updates are instant.** Push a fix in Lovable → click Publish → next time the user opens the installed app, they get the new version. No store review.

## Future option (not now)

When the pilot stabilizes and you want a real Play Store listing, we wrap this same React app with Capacitor — zero rewrite, ~1 day of work + Android Studio on your laptop + $25 Google Play account. The PWA work above is not throwaway; it complements the native path.

## Files to create / edit

- create `public/manifest.webmanifest`
- create `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`
- create `src/hooks/useInstallPrompt.ts`
- create `src/components/InstallBanner.tsx`
- create `src/pages/Install.tsx`
- edit `index.html` (manifest link + apple meta tags + theme-color)
- edit `src/App.tsx` (add `/install` route, mount `<InstallBanner />` on landing)
