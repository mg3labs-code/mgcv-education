# Fix the 3-Day Curiosity Arc on `/student/textbook/ch1/ch1-ep1`

## Root causes you flagged (verified in code)

1. **Same NRR cricket question twice on Day 1**
   `conceptRungs.ts` rung 1 (WARM-UP) and `dayPilotContent.ts` `hookQuestion` (FIRST GUESS) were both rewritten to the *exact same* NRR 1.3478 line in the last pass. Two different components render them on the same screen → looks duplicated.

2. **No interest / domain picker before Day 1 in the textbook flow**
   The standalone `/curiosity` arc has `InterestPicker` (cricket / nature / music / travel / food). The textbook episode at `/student/textbook/ch1/ch1-ep1` skips it entirely and hard-locks to cricket NRR.

3. **Day 2 falls back to textbook "Active Reasoning"**
   Screenshot 2 shows "Why is it important for us to have 'Real Numbers' in mathematics?" — that's a generic `ReasoningBlock` from the NCERT-style textbook, not a curiosity beat. Same break on Day 3 ("Design a 5-second test…") — it's the rung-5 prompt re-used verbatim, not interest-themed.

4. **Day 3 final reflection ("Design a 5-second test") is duplicated from the warm-up ladder** and reads like schoolwork, not the "teach a friend" tone in the Claude HTML.

## What I'll build (mirroring `day1_complete_5min_flow.html` + `interest_to_curiosity_engine.html`)

### A. Day 1 — one mystery, 5 beats, no duplicates
- **Beat 0 (new): Interest picker** — render `InterestPicker` *inside* `TextbookEpisode` on Day 1 view, persisted via `useArcProgress(conceptKey)` so Day 2/3 reuse it. Chips: 🏏 Cricket · 🌧 Monsoon · 🎵 Music · ✈️ Travel · 🌳 Nature. Skippable (defaults to cricket).
- **Beat 1: Warm-up** — change rung 1 in `conceptRungs.ts` to a *different* themed gimme (e.g. cricket: "Toss won 6/10 — is that a 'real' number you can plot?"). Keep NRR mystery only as the FIRST GUESS hook.
- **Beat 2: First Guess (hook)** — `hookQuestion` swaps per chosen interest (NRR for cricket, Kerala monsoon onset for nature, BPM for music, average flight time for travel).
- **Beat 3: Aha reveal** — `conceptText` rewritten per interest, same shape as Claude's `vf-frame` (emoji + one-line title + 2-sentence body + formula chip).
- **Beat 4: Sort the Rebels** — keep current 5-number sort, add interest-flavoured item labels (e.g. "NRR: −0.8" instead of "−100" when cricket is picked).
- **Beat 5: Believe / Doubt** — keep 0.999… = 1 trap (it's the strongest one in the Claude file).

### B. Day 2 — build (replace generic Active Reasoning)
- Override the Day 2 textbook Active Reasoning block on `ch1::ch1-ep1` with the interest-themed deep dive from `dayPilotContent.day2.deepDiveText` (already cricket-flavoured). I'll gate `ReasoningBlock` rendering when pilot content exists for the episode.
- Add a *yesterday echo* card on Day 2 top (Claude pattern) showing what they typed on Day 1.

### C. Day 3 — master (replace duplicate "Design a 5-second test")
- Replace `proveItPrompt` with the Claude HTML's "teach a friend" line: "Your cousin asks why 0.333… and 1/3 are the same. In two sentences — convince them."
- Keep the existing case study + order-sort (those already work).

### D. Verification
After edits, navigate to `/student/textbook/ch1/ch1-ep1`, walk D1 → D2 → D3 in the browser, confirm:
- no duplicate question on Day 1
- interest picker shows, persists, and changes the hook copy
- Day 2 shows the curiosity deep dive, not the NCERT Active Reasoning
- back / next stays unlocked throughout (demo mode)

## Files I'll touch (frontend only)

- `src/data/conceptRungs.ts` — rewrite rung 1 to a distinct warm-up
- `src/data/dayPilotContent.ts` — add `hooksByInterest` map for `ch1::ch1-ep1`, swap Day 3 prove-it prompt
- `src/pages/TextbookEpisode.tsx` — render `InterestPicker` once on Day 1, read tag via `useArcProgress`, pass selected hook/concept down, suppress the textbook `ReasoningBlock` when pilot is active
- `src/components/episode/Day1Spark.tsx` — accept an optional `interestBadge` for the topbar
- `src/components/episode/Day2Build.tsx` — show "Yesterday you guessed" echo card

## What I'm explicitly NOT changing

- Voice playback, 7-layer page, defense mode prompt quality, full-practice page — out of scope for this pass (you said those are working / will be tuned later).
- Backend / DB schema / RLS — pure frontend reskin.
- The standalone `/curiosity` route — already uses this pattern; this PR brings the textbook episode in line with it.

Confirm and I'll ship it in one pass.
