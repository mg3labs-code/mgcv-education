

# Better Textbook Reference: Inline Per-Block Snippets (Not a Full Toggle)

## Why the Current Toggle is Wrong

The current design has ONE toggle per block that shows a generic placeholder. Problems:

1. **Extra tap friction** — students won't click it, so they never see the textbook
2. **All-or-nothing** — when we populate it, dumping a whole section is overwhelming
3. **No connection** — the textbook text doesn't visually connect to the specific concept the student just read

## What Elite Learning Apps Actually Do

Brilliant, Khan Academy, and Coursera don't hide reference text behind toggles. They **weave it into the flow** as a distinct visual element — like a quote callout or a "from your textbook" card that appears naturally after each concept.

The best pattern: **inline textbook callout cards per concept section**, not one toggle per block.

```text
CURRENT (one toggle per entire block):
┌─────────────────────────────┐
│ 🔢 The Number Family        │
│ [5 concept sections...]     │
│                              │
│ 📖 See original textbook ▼  │  ← ONE toggle, dumps everything
└─────────────────────────────┘

BETTER (inline callout per section):
┌─────────────────────────────┐
│ 🔢 Counting Numbers (N)     │
│ N = {1, 2, 3, 4, 5, ...}   │
│ ┌─ 📖 Your Textbook Says ─┐│
│ │ "The counting numbers    ││
│ │ 1, 2, 3... are known as  ││
│ │ natural numbers..."      ││
│ │ — Ch.1, Section 1.1, p.2 ││
│ └──────────────────────────┘│
│                              │
│ 0️⃣ Whole Numbers (W)        │
│ W = {0, 1, 2, 3, ...}      │
│ ┌─ 📖 Your Textbook Says ─┐│
│ │ "If we include zero..."  ││
│ └──────────────────────────┘│
└─────────────────────────────┘
```

Each concept section gets its OWN small textbook snippet — just 1-2 sentences, not the whole page. Students read the simplified version first, then see the formal textbook language right below it. No tap needed. For activity/quiz/recall blocks, one small reference snippet at the top is enough.

## Implementation

### 1. Add `textbookRef` field to `ContentBlock` interface (`src/data/textbookData.ts`)

```ts
textbookRef?: {
  snippets: { text: string; source: string }[];  // per-section snippets for concept blocks
} | {
  text: string;    // single snippet for activity/quiz/recall blocks
  source: string;
};
```

### 2. Populate Ch1 Ep1 blocks with NCERT content (`src/data/textbookData.ts`)

Map each concept section to its corresponding 1-2 sentence NCERT paragraph:
- "Counting Numbers" → "The counting numbers 1, 2, 3... are known as natural numbers, denoted by N."
- "Whole Numbers" → "If we include zero along with natural numbers, we obtain whole numbers, denoted by W."
- "Integers" → "The collection of whole numbers and their negatives is known as integers, denoted by Z."
- "Rational Numbers" → "A number r is called rational if it can be written as p/q, where p and q are integers and q ≠ 0."
- "Containment" → "N ⊂ W ⊂ Z ⊂ Q"

For non-concept blocks (activity, recall, explain, assessment): one short reference like "Exercise 1.1: Is zero a rational number? Find six rational numbers between 3 and 4."

### 3. Render inline callouts in `TextbookEpisode.tsx`

- **For concept blocks**: After each `<section>` rendered by `ConceptBlock`, insert a small callout card styled with a left purple border, serif font, cream background
- **For other block types**: Show one callout card at the top of the block content
- **No toggle** — always visible but compact (max 2-3 lines per snippet)
- **Collapsible only if snippet is long** (>3 lines) — auto-shown for short ones

### 4. Remove the current single toggle

Delete the existing "📖 See original textbook text" toggle button (lines 770-795) and replace with the inline rendering described above.

## Visual Design of Callout Card

```text
┌─ 📖 ────────────────────────────┐
│ "The counting numbers 1, 2, 3…  │  ← serif font, #57534E
│ are known as natural numbers."   │
│                   — Section 1.1  │  ← italic, #A8A29E, 11px
└──────────────────────────────────┘
  left-border: 3px solid #C4B5FD
  background: #FAFAFE
  padding: 10px 14px
  border-radius: 8px
```

## Files Modified
1. `src/data/textbookData.ts` — Add `textbookRef` field to interface + populate all 11 blocks of Ch1 Ep1
2. `src/pages/TextbookEpisode.tsx` — Remove toggle, render inline callout cards per section
3. `src/components/textbook/EnhancedReader.tsx` — May need minor update if it renders concept sections (to inject callouts after each section)

### No backend/DB changes

