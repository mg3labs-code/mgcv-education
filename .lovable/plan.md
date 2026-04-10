

## Plan: Implement Friction Architecture + "Why This Works" Vision (All 3 Phases)

### What's NOT built yet (confirming)
- No "Why This Works" landing section exists
- No IIT/JEE/Oxford/Harvard university method mapping UI
- No micro-connection toasts after block completion
- No RecallBlock self-assessment ("Got it / Not yet")
- No ReasoningBlock think-first delay gate
- No AssumptionsBlock believe/doubt toggle

### Phase 1: Friction Polish on Existing Textbook Blocks

**RecallBlock** (in `EpisodeBlocks.tsx`)
- After revealing answer, show "Got it ✓" / "Not yet ✗" self-assessment buttons
- "Not yet" items visually marked for end-of-episode review
- Hints hidden behind tap by default

**ReasoningBlock** (`ReasoningBlock.tsx`)
- "Reveal Answer" button appears only after 10-second think-first delay with a gentle countdown
- Larger text, more breathing room for productive struggle

**AssumptionsBlock** (`AssumptionsBlock.tsx`)
- Add "I believe this / I doubt this" toggle before revealing the myth-bust
- Post-reveal reflection prompt: "Why did you think that?"

### Phase 2: "Why This Works" Landing Section

**New component**: `src/components/landing/WhyThisWorks.tsx`
- Section title: "Why This Actually Works"
- 3-column comparison: School (teaches WHAT) → Coaching (teaches HOW TO SCORE) → EduTech (teaches HOW TO THINK)
- University method mapping cards with scroll-reveal animations:
  - Oxford Tutorial → "Debate Challenge" (Assumptions block)
  - Harvard Case Method → "Use it in real life" (Application block)
  - IIT Problem-Based → "Break it down" (Reasoning block)
  - Feynman Technique → "Teach your friend" (Explain block)
- Placed in `Index.tsx` between FeatureShowcase and footer
- Parent-friendly language, mobile-responsive grid

### Phase 3: Micro-Connection Toasts

**In `TextbookEpisode.tsx`** — after completing specific block types:
- Assumptions block → "You just practiced the same skill IIT interviewers test 🏛️"
- Application block → "Harvard calls this the Case Method — you're already doing it 🎓"
- Reasoning block → "This is how JEE Advanced separates toppers from memorizers 🧠"
- Explain block → "Feynman won a Nobel Prize using this exact technique 🔬"
- Subtle toast, 4-second auto-dismiss, non-intrusive

### Files modified
- `src/components/textbook/EpisodeBlocks.tsx` — RecallBlock self-assessment
- `src/components/textbook/ReasoningBlock.tsx` — think-first gate
- `src/components/textbook/AssumptionsBlock.tsx` — believe/doubt toggle
- `src/components/landing/WhyThisWorks.tsx` — new component
- `src/pages/Index.tsx` — add WhyThisWorks section
- `src/pages/TextbookEpisode.tsx` — micro-connection toasts

### What stays the same
- All existing block rendering, navigation, progress tracking
- Voice explain, TutorialDefense, FirstPrinciples modals
- Mobile layout, auth, onboarding, dashboards

### Priority order
Phase 1 (friction polish) → Phase 2 (landing section) → Phase 3 (toasts)

