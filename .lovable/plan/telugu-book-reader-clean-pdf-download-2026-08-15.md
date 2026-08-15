# Telugu Book Reader + Clean PDF Download

Goal: convert a chosen page range of the uploaded book (e.g. start at PDF page 13, Chapter 01 Percentage) into Telugu, one question at a time in strict order with a verification pass, show it as a calm book-like page, and let it be downloaded as a good-looking PDF.

## 1. Choose where to start (page range)

- Add a "Pages" control on the upload panel: **From page / To page** (defaults: from 1, to end).
- Only that range is parsed and converted, so nothing before page 13 gets processed and no credits are wasted on the front matter.
- The source PDF page number is kept on every block, so the reader can show "Book page 13" alongside the reader page.

## 2. Convert one question at a time, in order

- Instead of sending big mixed chunks, each unit = one question with its own options, answer key and exam tag (or one prose/heading run).
- Units are queued and processed strictly in ascending order, one at a time, with a small concurrency of 1 so order never scrambles.
- After each unit returns, a check runs before moving on:
  - same question number and option labels (a/b/c/d) as the source
  - all numbers, fractions, currency, percentages and dates unchanged
  - option count matches, nothing merged or dropped
- If a unit fails the check it is retried once; if it still fails it is marked "needs review" and shown with the English original underneath, and the queue continues.
- Live status while it runs: "Question 14 of 96 verified" with a progress bar, so it is visible that it is sequential and ordered.

## 3. Reader that feels like a book, not congested

- One question block per card: number, question text, options in a 2-column grid, exam tag as a small muted line, answer/explanation revealed below.
- Fewer questions per page (default 4) with generous line height and margins; no bullet symbols, no italic labels, no stray glyphs.
- Header: book page + reader page, progress bar, Prev/Next buttons, keyboard arrows, thumbnails/jump (already present) reused with the new units.
- Toggle: Telugu only / Telugu + English (side by side) per page.

## 4. Download as PDF

- "Download PDF" button with two options: **current page** or **whole converted range**.
- PDF is generated with a proper Telugu font embedded (Noto Sans Telugu) so no boxes or broken glyphs.
- Layout: book-style page — chapter title header, page number footer, questions numbered in order, options in two columns, comfortable margins and spacing; page breaks never split a question from its options.
- File name: `<book>-telugu-p13-p20.pdf`.

## Technical notes

- `src/lib/docStructure.ts`: accept `fromPage`/`toPage`, tag each block with its source page.
- `src/lib/docPaginate.ts`: unit grouping stays the source of truth; add a questions-per-page setting (4) and expose the source page of each unit.
- `supabase/functions/translate-doc/index.ts`: add a per-unit translate action that returns one unit plus a structural verification result (numbers/labels/counts), and keep the cache keyed per unit so re-runs are instant.
- New `src/lib/docPdf.ts`: jsPDF + embedded Noto Sans Telugu, book layout renderer, used for single-page and full-range export.
- `src/pages/DocTranslate.tsx`: page-range inputs, sequential queue with per-question verified status, calmer typography, download menu.
- QA: convert pages 13-16 of the uploaded book, then render the exported PDF to images and inspect every page for clipped text, wrong option order, mismatched numbering and font boxes before calling it done.
