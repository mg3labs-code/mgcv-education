

# Rebuild TextbookEpisode to Match HTML Reference Exactly

## Problem
Current implementation wraps every piece of content in heavy component cards with borders, icons, rounded corners, and nested wrappers. The HTML reference is much simpler — flat sections with direct content, colored backgrounds, and minimal chrome.

## Key Differences: Current vs HTML

| Element | Current (Too Complex) | HTML Reference (Clean) |
|---|---|---|
| Layer sections | Rounded card with border + icon box + badge + nested component cards | Simple colored div with layer-header (icon circle + title) |
| Content text | Wrapped in `rounded-xl p-5 bg-muted/40 border` cards | Direct `.content` paragraphs, no wrapper |
| Formulas | Mono font inside accent card wrapper | Simple centered `.equation` box |
| Info boxes | Multiple nested card components | Simple `.box` with left-border accent |
| Questions | Separate component with button + reveal state | Simple `.question` div with textarea + inline feedback |
| Connections | Grid of individual card components with hover | Simple `.grid` of minimal `.card` divs |

## Plan: Flatten the Rendering

### 1. Replace Block Renderers with HTML-Style Inline Rendering

Instead of delegating to separate component files (`ReasoningBlock.tsx`, `AssumptionsBlock.tsx`, etc.), render content **inline** in `TextbookEpisode.tsx` using simple, flat HTML structures matching the reference:

- **Concept blocks**: Direct paragraphs + `.box` style info panels + centered equation divs
- **Reasoning blocks**: Simple question divs with textarea + always-visible hint feedback below
- **Assumptions blocks**: Listed assumptions with inline explanations, single defense button
- **Connections blocks**: Simple grid of icon+label cards + one info box with explanations
- **Application blocks**: Scenario box + textarea question + inline feedback
- **Implications blocks**: Three themed boxes (Mathematical/Future/Philosophical) + essay textarea

### 2. Simplify Layer Wrapper

Replace the current heavy wrapper:
```
rounded-2xl p-6 mb-5 bg-card border border-border → badge → icon-box + title → component
```

With the HTML's flat style:
```
layer div with colored bg → layer-header (gradient icon circle + LAYER N label + title) → direct content
```

### 3. Style Classes to Add

Match HTML reference styling:
- `.layer` sections: `py-8 px-6 border-b-2 border-gray-100` (no card borders)
- Layer icons: 50px gradient circles matching the HTML's `linear-gradient(135deg, ...)` per layer
- `.box`: `bg-muted/40 border-l-4 border-primary p-5 rounded-lg` (left-border accent)
- `.equation`: centered, larger font, primary color, gray background
- Questions: simple border card with prompt + textarea + always-visible feedback hint

### 4. Remove Unused Component Imports

Stop importing `ReasoningBlock`, `AssumptionsBlock`, `ConnectionsBlock`, `ApplicationBlock`, `ImplicationsBlock` — their rendering moves inline, simplified.

### File Changes

| File | Change |
|---|---|
| `src/pages/TextbookEpisode.tsx` | Rewrite block rendering inline with flat HTML-style layout matching the reference. Remove complex component delegation for layers 3-7. Simplify layer wrappers. |

Component files (`ReasoningBlock.tsx`, etc.) remain untouched but are no longer imported — can be cleaned up later.

