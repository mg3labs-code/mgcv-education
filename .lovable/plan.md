

## Landing Page UX Overhaul + Login Fix

Based on the detailed UI audit you shared, here are the fixes:

### 1. Clean Up Nav — Remove Duplication

**Current**: Nav has "Student Login", "Teacher Login", "About", "Contact Us" (button) — duplicated by hero CTAs.

**New nav structure**: `Student Inner OS` (logo) · `About` · `For Schools` · `Login` · `[Start Learning]` (primary button)

- "Login" opens a unified login modal (user picks student/teacher inside)
- "For Schools" opens the contact modal
- "Start Learning" is the single primary CTA → opens student signup
- Remove "Teacher Portal" button from hero entirely

### 2. Fix Headline Hierarchy

**Current**: "World-Class" / ImageTextEffect("THINKING") / "For Every Student." — three separate visual treatments breaking reading flow.

**New**: Clean two-line headline:
```
World-Class Thinking
For Every Student.
```
- "Thinking" gets a gradient accent color but stays as text (keep the visual pop without the image collage breaking readability)
- Subheading gets larger size and more contrast — natural follow-up, not buried

### 3. Elevate 5 Inner OS Dimensions

**Current**: Tiny floating badge on hero image corner.

**New**: Remove the floating badge. The existing "Visual Showcase Section" (lines 423-466) already shows 4 dimensions as cards — expand it to show all 5 and position it right after TrustBadges as its own prominent section.

### 4. Add Trust Signal to Hero

Add a subtle line below the hero CTA: "Trusted by 200+ schools across India" with small school/partner indicators.

### 5. Fix Login Modal

- Test and verify the login flow works correctly
- The modal code looks structurally sound — check for any runtime issues with auth state or iframe detection blocking login unnecessarily

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Restructure nav (unified Login + For Schools), simplify hero headline, remove Teacher Portal hero button, add trust line, remove floating badge |
| `src/components/landing/ImageTextEffect.tsx` | Simplify or remove — replace with styled text "Thinking" |

### Nav Before → After

```text
BEFORE: [Student Inner OS]  Student Login  Teacher Login  About  [Contact Us]
AFTER:  [Student Inner OS]  About  For Schools  Login  [Start Learning →]
```

### Hero Before → After

```text
BEFORE:                          AFTER:
World-Class                      World-Class Thinking
[IMAGE COLLAGE: THINKING]        For Every Student.
For Every Student.
                                 We bring proven methods from Stanford,
We integrate proven methods...   MIT & Oxford into your curriculum.

[Start Learning] [Teacher Portal] [Start Learning →] [For Schools]
                                 Trusted by 200+ schools across India
```

