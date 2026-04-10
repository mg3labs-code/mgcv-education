

## Active Reasoning Visual Generator — Separate Edge Function + UI Component

### What You Want

An AI-powered system that generates **rich educational infographics** like the image you shared — with numbered steps, visual breakdowns, labeled diagrams — for any topic. This is especially powerful for Chemistry (reactions, organic chem), Physics (circuits, forces), and Biology. The key insight: **visual step-by-step reasoning aids retention far better than text alone**.

### Architecture — Kept Separate from Main App

```text
┌─────────────────────────────────────┐
│  New Edge Function                  │
│  generate-reasoning-visual          │
│                                     │
│  Input: topic, subject, grade       │
│  Output: 4 AI-generated images      │
│          (one per reasoning step)   │
│          + structured text breakdown│
│          uploaded to storage bucket  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  New Component                      │
│  ActiveReasoningVisual.tsx          │
│                                     │
│  4-panel visual layout:             │
│  ① Understand the Problem           │
│  ② Break It Into Parts              │
│  ③ Explore Possibilities            │
│  ④ Logical Conclusion               │
│                                     │
│  Each panel: AI image + text labels │
└─────────────────────────────────────┘
```

### How It Works

**Edge Function (`generate-reasoning-visual`):**
1. Receives a topic (e.g., "How does electrolysis work?")
2. Uses Gemini to break the topic into the 4 reasoning steps with structured JSON (step title, key visual elements, labels, explanation)
3. Generates 4 separate images using `google/gemini-3.1-flash-image-preview` — one per step — with specific prompts like:
   - Step 1: "Educational illustration showing the problem/question about electrolysis, curious student, labeled setup"
   - Step 2: "Diagram breaking electrolysis into parts: electrodes + electrolyte + current + ions, labeled with arrows"
   - Step 3: "Visual flowchart showing possibilities: what happens at anode vs cathode, with labeled reactions"
   - Step 4: "Clean conclusion diagram: complete electrolysis process with products labeled"
4. Uploads all 4 images to a `reasoning-visuals` storage bucket
5. Returns URLs + structured text for each step

**Caching:** Uses the same pattern as `resolve-visual-aid` — checks storage for existing images before generating new ones.

**Frontend Component (`ActiveReasoningVisual.tsx`):**
- 4-panel card layout matching the image style (numbered circles, bold step titles, images with labels)
- Loading state with step-by-step progress ("Generating Step 2: Breaking it down...")
- Can be embedded in textbook episodes OR used standalone
- "Quiz Me", "Real-Life Example", "Get Diagram" action buttons after completion

**Standalone Page (`/reasoning-visual`):**
- Topic input + subject selector
- Suggested topics per subject
- No auth required — for testing and demos

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-reasoning-visual/index.ts` | **Create** — New edge function |
| `src/components/textbook/ActiveReasoningVisual.tsx` | **Create** — 4-panel visual component |
| `src/pages/ReasoningVisualDemo.tsx` | **Create** — Standalone demo page |
| `src/App.tsx` | **Modify** — Add route `/reasoning-visual` |

### Why This Is Powerful

- **Chemistry**: Reaction mechanisms broken into reactants → bonds breaking → intermediates → products (with actual molecular diagrams)
- **Physics**: Force problems decomposed into free body diagram → equations → solution steps → real-world application
- **Organic Chemistry**: Named reactions shown as substrate → reagent attack → transition state → product
- Each image is AI-generated specifically for the topic — not generic stock images

### Storage

Creates a new `reasoning-visuals` storage bucket (public, like `visual-aids`) for caching generated step images.

