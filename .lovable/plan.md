

# Web-First Image Resolution with AI Fallback + Verification

## Problem
The current `resolve-visual-aid` function only generates AI images, which can be low-quality, noisy, or unsuitable. Many educational topics have excellent, professionally-made diagrams already available on the web (Wikimedia Commons, NCERT textbooks, Khan Academy).

## Solution

### Two-tier image resolution in `resolve-visual-aid/index.ts`

**Tier 1 — Web image lookup (new)**
- Ask Gemini text model to find the **best publicly accessible direct image URL** from trusted educational sources (Wikimedia Commons, NCERT, Khan Academy, OpenStax) for the given topic
- The AI returns a JSON with `{ url, source, description }`
- **Verify the URL** with a `HEAD` request: check HTTP status 200 AND `content-type` starts with `image/`
- If verification passes → return this URL with `source: "web"`
- If verification fails → proceed to Tier 2

**Tier 2 — AI generation fallback (existing)**
- Use current Gemini flash-image generation logic
- Return with `source: "generated"`

### Updated flow

```text
Request: { query, topic, type, subject }
         │
         ▼
  ┌──────────────────────────┐
  │ Tier 1: Ask AI to find   │
  │ direct image URL from    │
  │ Wikimedia/NCERT/Khan     │
  │ Academy/OpenStax         │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ HEAD-check the URL       │
  │ - Status 200?            │
  │ - Content-type: image/*? │
  └──────────┬───────────────┘
        ┌────┴────┐
       Yes       No
        │         │
        ▼         ▼
   Return URL   ┌──────────────────┐
   source:web   │ Tier 2: AI       │
                │ generate image   │
                │ (existing logic) │
                └────────┬─────────┘
                         │
                         ▼
                    Return base64
                    source:generated
```

### VisualAidBlock.tsx — Source badge

Add a small label showing "🌐 From web" vs "🎨 AI generated" based on the optional `source` field in the content JSON. Purely cosmetic, no functional change.

### Content generation prompt tweaks

Update `generate-chapter-content` and `generate-language-content` prompts to include better `searchTerms` in visual_aid blocks — e.g., "Wikimedia Commons labeled diagram of human digestive system" instead of generic "digestive system".

## Files Modified
1. `supabase/functions/resolve-visual-aid/index.ts` — Add web-first lookup with HEAD validation before AI fallback
2. `src/components/textbook/VisualAidBlock.tsx` — Add optional source badge
3. `supabase/functions/generate-chapter-content/index.ts` — Better searchTerms in prompt
4. `supabase/functions/generate-language-content/index.ts` — Better searchTerms for language visuals

## Key Safeguards
- HEAD request has a 5-second timeout to avoid hanging on dead URLs
- Only accept URLs ending in common image extensions (.jpg, .png, .svg, .webp) OR with `content-type: image/*`
- AI prompt specifically asks for **direct image file URLs** (not HTML pages)
- Double verification: AI suggests URL → code validates it actually serves an image

