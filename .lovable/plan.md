

# Show Related Images/GIFs While AI is Talking

## Concept
Add a visual panel that displays relevant images and GIFs alongside the AI conversation, triggered by topic keywords detected in the AI's responses. As the AI talks about cricket, physics, Magnus Effect, etc., matching visuals appear on screen to reinforce learning.

## Approach

### 1. Curated Visual Library (Static Mapping)
Create a keyword-to-image map with free-to-use images from Unsplash and GIFs from Giphy (direct embed URLs — no API key needed for embedding). Topics covered:

| Keyword Group | Visuals |
|---|---|
| Cricket (Bumrah, Dhoni, IPL, bowling) | Cricket action shots, spin bowling GIF |
| Physics (Magnus Effect, forces, motion) | Magnus effect diagram, projectile motion GIF |
| Math (equations, graphs, speed) | Math visualization, graph animation GIF |
| Science (electricity, circuits, energy) | Circuit diagram, lightning GIF |
| General learning (textbook, NCERT) | Student studying, book animation |

~30 curated URLs covering the main topics in the 6-phase flow.

### 2. Keyword Extraction from AI Response
As each assistant message streams in, scan for keywords and update a "current visuals" state. Show 1-2 images at a time, crossfading smoothly when new topics appear.

### 3. UI: Visual Panel
- On desktop: A side panel (right side) that slides in showing the current image/GIF with a subtle fade animation
- On mobile: A compact strip above the chat messages showing a smaller image
- Images crossfade with a smooth CSS transition when topics change
- Caption shows the detected topic ("Magnus Effect in Cricket")

### Files

| File | Change |
|---|---|
| `src/data/topicVisuals.ts` | New — curated keyword-to-image/GIF URL mapping |
| `src/components/student/TopicVisualPanel.tsx` | New — visual display component with crossfade animations |
| `src/pages/AttractionDemo.tsx` | Add keyword extraction from streamed text, render TopicVisualPanel |

### How It Works
1. As `streamChat` builds `assistantText`, a `useEffect` scans it for keywords
2. When a keyword matches, `currentVisual` state updates with the image URL + caption
3. `TopicVisualPanel` renders with a CSS fade transition
4. Multiple matches rotate every ~5 seconds using `setInterval`
5. No API keys needed — all images are direct Unsplash/Giphy embed URLs

