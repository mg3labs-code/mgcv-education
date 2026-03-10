

# Recheck: Layer 1 & Layer 2 Mapping is Wrong

## The Problem

Looking at the HTML reference vs current data, the labeling is incorrect:

| Layer | HTML Reference | Current Data | Match? |
|---|---|---|---|
| Layer 1: Definition | Simplified definition + etymology + "Why it matters" — easy, friendly | `concept` block — heavy textbook content with multiple sections, formulas, examples | ❌ Too heavy |
| Layer 2: Mechanism | Step-by-step worked example showing HOW it works | `activity` block — interactive classify/explore exercise | ❌ Wrong content type |

### What the HTML Does Right

**Layer 1 (Definition):** Simple, short, friendly
- One clear definition sentence
- The key formula/equation
- What each part means (simple bullets)
- Etymology & History box (fun facts)
- "Why This Matters" box (real-world relevance)

**Layer 2 (Mechanism):** Step-by-step HOW
- One worked example broken into numbered steps
- "Key Pattern" summary
- "Why does this work?" short explanation

### What Current Data Does Wrong

**`concept` block** has too much crammed in — multiple sections, key formulas array, worked examples array. It's the full textbook dump, not a simplified Layer 1.

**`activity` block** is an interactive exercise (classify items, find q and r) — that's NOT a "mechanism." It's practice. Labeling it "LAYER 2 · Mechanism" is misleading.

## Plan

### Option A: Fix the labels only (keep data, rename layers)

Remove "Layer 1/2" badges from `concept` and `activity` blocks. Only show layer badges for Layers 3–7 (the pedagogically distinct blocks). Treat `concept` + `activity` + `recall` + `explain` + `assessment` + `exercise` as the **"Core Learning"** section (no layer numbering), and Layers 3–7 as the **"Deep Mastery"** section.

This is simpler and honest — the current data doesn't truly separate definition from mechanism.

### Option B: Restructure data to match HTML layers exactly

Split each episode's `concept` block into two: a simplified `definition` block (Layer 1) and a `mechanism` block (Layer 2). This requires changing the data model and all episodes.

**Recommendation: Option A** — it's truthful, fast, and doesn't require rewriting all episode data. The concept block already contains both definition and mechanism together, which works fine as a single "Learn the Concept" section.

## Changes (Option A)

**File: `src/pages/TextbookEpisode.tsx`**

1. Remove layer badges from `concept`, `activity`, `recall`, `explain`, `assessment`, `exercise` — these are just "Core Learning" blocks, no layer number
2. Keep layer badges only for `reasoning` (Layer 3), `assumptions` (Layer 4), `connections` (Layer 5), `application` (Layer 6), `implications` (Layer 7)
3. Add a visual divider between the core blocks and the deep layers — a simple banner: "🧠 Deep Mastery Layers" before Layer 3 starts
4. Remove colored backgrounds from `concept` and `activity` — keep them white like the HTML's Layers 1-2
5. Keep colored backgrounds only for Layers 3-7

This way:
- Core content (concept → exercise) feels like natural textbook reading
- Deep layers (3-7) are clearly marked as the "go deeper" section
- No misleading "Layer 1 · Definition" / "Layer 2 · Mechanism" labels on content that doesn't match those descriptions

