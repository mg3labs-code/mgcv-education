

# Fix Episode Page: Better Colors + Reading Checkpoint Before Completion

## Problems
1. **Dark header text invisible** — The gradient header (`#1E3A5F → #1E293B`) makes the episode title hard to read (font-weight 300 is too thin for white-on-dark).
2. **Auto-completion on Continue** — Clicking "Continue →" auto-marks the current block as understood (`if (!isUnderstood) toggleUnderstood(activeBlock)`). Students can skip through without reading anything.

## Plan

### 1. Fix header readability and colors

**Episode header** (lines 751-768):
- Change gradient to a lighter, more readable combo: `linear-gradient(135deg, #0F766E, #115E59)` (teal family, matches brand)
- Increase title font-weight from 300 → 600
- Make subtitle color brighter: `rgba(255,255,255,0.85)` instead of `0.7`

**Phase header block** (lines 817-835):
- Increase background opacity from `08` → `15` for better visibility
- Ensure text color stays dark and readable

### 2. Add reading checkpoint — require "Got it!" before Continue

**Current behavior**: "Continue →" auto-marks as understood and moves forward. No engagement needed.

**New behavior**:
- "Continue →" button stays **disabled** (grayed out) until the student explicitly clicks "Got it! ✓"
- Once "Got it!" is clicked, block is marked understood and "Continue →" becomes active (teal)
- Remove the auto-mark logic from Continue's onClick — it only navigates now
- Visual: disabled Continue shows gray background + "Read & mark complete first" tooltip-style hint text

**Code change** (lines 892-905):
```
// Before: auto-marks + navigates
onClick={() => {
  if (!isUnderstood) toggleUnderstood(activeBlock);
  goToBlock(activeBlock + 1);
}}

// After: only navigates, disabled until understood
disabled={!isUnderstood}
onClick={() => goToBlock(activeBlock + 1)}
style={{ 
  ...existing styles,
  background: isUnderstood ? "#0D9488" : "#D6D3D1",
  cursor: isUnderstood ? "pointer" : "not-allowed",
}}
```

Same for "Finish ✓" button on last block — disabled until "Got it!" is clicked.

### Files Modified
1. `src/pages/TextbookEpisode.tsx` — Header color fix + checkpoint gate on Continue/Finish buttons

### No backend/DB changes

