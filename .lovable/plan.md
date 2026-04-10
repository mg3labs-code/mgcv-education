

## Elite Reasoning Visuals: Maximum Retention Quality

### The Problem
Current prompts are too generic ("educational illustration showing..."). The uploaded screenshots from Claude show decent but not elite-level visuals. The original photosynthesis image you shared earlier had **specific chemical formulas, color-coded arrows, mascot characters, numbered callouts, cross-section views** — that level of granularity is what creates real retention.

### Two Changes

#### 1. Gallery of Previously Generated Visuals
Add a "Previously Generated" section at the bottom of `/reasoning-visual` that queries `reasoning_visuals` table and shows clickable cards. Clicking loads the cached steps instantly.

#### 2. Elite Prompt Engineering (The Core Fix)

**Decomposition prompt upgrade** — force the AI to output hyper-specific visual instructions:

- **Chemistry**: Molecular structures with bond angles, electron movement arrows (curly arrows for mechanisms), color-coded atoms (O=red, H=white, C=black, N=blue), reaction flask/beaker setups, chemical equations as `reactants → products`
- **Physics**: Free-body diagrams with force vectors and magnitudes, circuit diagrams with labeled components, ray diagrams with angles of incidence/reflection, before/after energy bar charts
- **Biology**: Cross-section anatomical views, organelle cutaways with numbered callouts, food web arrows with energy percentages, cell division stages side-by-side
- **Mathematics**: Geometric constructions with compass arcs visible, number line visualizations, coordinate plane with plotted points and labeled intercepts

**Image generation prompt upgrade** — from vague to textbook-quality:

```text
BEFORE (current):
"Create an educational infographic illustration: [vague prompt].
Style: Flat design, clean, bright colors..."

AFTER (elite):
"NCERT/CBSE textbook-quality educational diagram for Grade 10:
[step-specific detailed prompt with exact molecules/forces/structures]

MANDATORY visual elements:
1. Chemical formulas/equations written clearly (e.g. 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂)
2. Color-coded arrows: [yellow=energy, blue=water, red=heat, green=product]
3. Numbered callout boxes (①②③) with connecting lines to diagram parts
4. Cute cartoon mascot character (scientist/student) pointing at key element
5. Color legend box in bottom-right corner
6. Cross-section/cutaway view where applicable
7. Before → After comparison if showing a process
8. Scale/measurement labels where relevant

Style: Indian NCERT textbook illustration, flat design, pastel palette,
clean white background, large Hindi-style educational poster feel,
hand-drawn but professional, labeled with clear English text annotations"
```

**Subject-specific prompt templates** built into the edge function — Chemistry gets molecular diagrams, Physics gets vector arrows, Biology gets anatomical cross-sections, Math gets geometric constructions.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-reasoning-visual/index.ts` | Rewrite decomposition system prompt with subject-specific templates; rewrite image generation prompt for elite granularity; add subject-aware prompt builder function |
| `src/pages/ReasoningVisualDemo.tsx` | Add gallery section querying `reasoning_visuals` table; clickable cards load cached visuals instantly |

### Why This Creates Best Retention

The science of visual learning shows retention jumps from ~10% (text only) to ~65% (text + specific labeled visuals) when images include:
- Exact terminology embedded in the visual (not just nearby text)
- Color coding that maps to meaning (not decoration)
- Spatial relationships showing process flow
- Familiar characters/mascots creating emotional anchoring
- Numbered sequences showing causation, not just correlation

The current generic prompts produce "nice pictures." The upgraded prompts produce **teaching tools**.

