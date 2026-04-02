

# Add Visual Media (Images & Videos) to Textbook Content Blocks

## What We're Building

Enrich textbook episodes with contextual images and short educational videos that appear inline within content blocks. This applies to all subjects — STEM blocks get diagrams/illustrations, language blocks get cultural images and pronunciation videos.

## Approach

### 1. Add a new `visual_aid` block type + inline media support

Rather than modifying every existing block type, we take a two-pronged approach:

**A. New `visual_aid` content block type** — a standalone media block that can be inserted between existing blocks. Contains an image or embedded video with a caption and optional explanation. The AI content generator will produce these alongside regular blocks.

**B. Add `media` field to existing block content** — each block's JSON `content` can optionally include a `media` array with image URLs and captions that render inline within the block.

### 2. Create a `VisualAidBlock` component

New component `src/components/textbook/VisualAidBlock.tsx`:
- Renders an image (from Unsplash, Wikimedia, or AI-generated) or an embedded YouTube video (≤2 min clips)
- Image: responsive with rounded corners, lazy loading, alt text, and a caption overlay
- Video: embedded YouTube iframe with `max-width: 100%`, 16:9 aspect ratio
- Caption + brief explanation text below
- Optional "zoom" on tap for images (mobile-friendly)

### 3. Create an `InlineMedia` component

New component `src/components/textbook/InlineMedia.tsx`:
- Small reusable component that renders within existing blocks (ConceptBlock, ReasoningBlock, etc.)
- Shows a relevant image/diagram alongside text content
- Floats right on desktop, full-width on mobile

### 4. Update content generation edge functions

**`generate-chapter-content/index.ts`** — Update the AI prompt to:
- Include 2-3 `visual_aid` blocks per episode (placed after concept, reasoning, and application blocks)
- Each visual_aid block has: `{ type: "image"|"video", url: string, caption: string, explanation: string, alt: string }`
- For images: prompt instructs AI to suggest Unsplash search terms or Wikimedia Commons URLs for real diagrams
- For videos: prompt instructs AI to suggest YouTube video IDs of short (≤2 min) educational clips
- Add `media` field to concept/reasoning/application block content with relevant image suggestions

**`generate-language-content/index.ts`** — Same treatment for language blocks:
- Cultural images for story_reading blocks
- Script/calligraphy images for bilingual_concept blocks

### 5. Create an image resolution edge function

New edge function `resolve-visual-aid/index.ts`:
- Accepts a search query/topic
- Uses Unsplash API (free tier, 50 req/hr) to find high-quality images
- Alternatively uses AI image generation (Gemini flash-image) for diagrams that don't exist as photos
- Returns the resolved image URL
- Called during content generation, NOT at render time (URLs stored in DB)

### 6. Update TextbookEpisode.tsx rendering

- Add `visual_aid` to `renderBlock` switch
- Add inline media rendering within ConceptBlock, ReasoningBlock, ApplicationBlock when `content.media` exists
- Add to `blockIcons`, `blockLabels`, `blockSubtitles`, `layerMeta`

### 7. Update data types

- Add `"visual_aid"` to ContentBlock type union in `textbookData.ts`
- Define `VisualAidContent` interface

## Files to Create
1. `src/components/textbook/VisualAidBlock.tsx` — standalone visual block
2. `src/components/textbook/InlineMedia.tsx` — inline media within blocks
3. `supabase/functions/resolve-visual-aid/index.ts` — image search/generation

## Files to Modify
1. `src/pages/TextbookEpisode.tsx` — render visual_aid blocks + inline media
2. `src/data/textbookData.ts` — add visual_aid type
3. `supabase/functions/generate-chapter-content/index.ts` — add visual_aid blocks to STEM prompt
4. `supabase/functions/generate-language-content/index.ts` — add visual_aid blocks to language prompt

## Content Generation Strategy
After deploying the updated edge functions, re-generate content for existing episodes to include visual aids. The AI will suggest appropriate Unsplash URLs based on topic keywords, which get resolved and stored in the DB content JSON.

