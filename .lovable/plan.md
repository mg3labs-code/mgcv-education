

# Missing Features from HTML Reference — Gap Analysis & Plan

## What's Missing (HTML vs Current)

| Feature | HTML Reference | Current | Status |
|---|---|---|---|
| **Harvard Case Method branding** (Layer 6) | Prominently labeled "🎓 Harvard Case Method" with warm orange bg | Generic "Scenario Card" with no Harvard label | Missing |
| **Careers box** (Layer 6) | "💼 Careers Using This" list at bottom of Application layer | Not in data model or UI | Missing |
| **3-category Implications** (Layer 7) | Three distinct boxes: Global, Future, Philosophical — each with unique bg/border color | Single `whatIfQuestion` + flat reflection prompts | Missing |
| **Oxford Essay branding** (Layer 7) | Labeled "📝 Oxford Essay Question" with red accent bg | Generic textarea, no branding | Missing |
| **Voice Essay button** (Layer 7) | "🎤 Record Voice Essay Instead" button next to essay | Not present | Missing |
| **Tutorial Defense CTA inside Layer 4** | Inline amber card with "Start Tutorial Defense (5 min)" button | Only at bottom completion section | Missing |
| **Horizontal Progress Tracker** | Dot-based layer tracker at top (completed/active/upcoming) | Sidebar-only tracker | Missing (low priority, sidebar works) |

## Plan

### 1. Update `ApplicationContent` data model + data (`textbookData.ts`)

Add `careers` field to `ApplicationContent` interface:
```ts
careers?: string[];
```
Add `harvardLabel?: string` for branding. Add careers data to Episode 1's application block.

### 2. Upgrade `ApplicationBlock.tsx`

- Add "🎓 Harvard Case Method" badge/header with warm orange gradient background on the scenario card
- Add "💼 Careers Using This" box at bottom listing careers as pills/chips
- Larger text sizes to match theme

### 3. Update `ImplicationsContent` data model + data (`textbookData.ts`)

Add structured implications:
```ts
implications?: { category: string; icon: string; color: string; points: string[] }[];
```
Add data for Episode 1: Global, Future, Philosophical implications.

### 4. Upgrade `ImplicationsBlock.tsx`

- Render 3 distinct colored boxes (Global = amber, Future = sky, Philosophical = purple) matching HTML
- Brand the essay as "📝 Oxford Essay Question" with red accent
- Add "🎤 Record Voice Essay" button (connects to existing VoiceExplainWidget or placeholder)
- Larger text, `font-serif` headings

### 5. Add inline Tutorial Defense CTA to `AssumptionsBlock.tsx`

- Add an amber-tinted card at the bottom of assumptions with "Start Tutorial Defense (5 min)" button
- This needs an `onStartDefense` callback prop passed from `TextbookEpisode.tsx`

### 6. Typography pass on all layer blocks

- All block components: `text-sm` → `text-base`, headings get `font-serif`
- Consistent with the warm theme already in `TextbookEpisode.tsx`

### Files Changed

| File | Change |
|---|---|
| `src/data/textbookData.ts` | Add `careers` to `ApplicationContent`, add `implications` array to `ImplicationsContent`, populate Ep1 data |
| `src/components/textbook/ApplicationBlock.tsx` | Harvard branding, careers box, larger text |
| `src/components/textbook/ImplicationsBlock.tsx` | 3-category boxes, Oxford Essay branding, voice button |
| `src/components/textbook/AssumptionsBlock.tsx` | Inline Tutorial Defense CTA |
| `src/pages/TextbookEpisode.tsx` | Pass `onStartDefense` to AssumptionsBlock |

