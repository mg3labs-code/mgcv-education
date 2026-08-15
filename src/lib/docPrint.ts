import type { DocPage, DocUnit } from "@/lib/docPaginate";
import type { DocBlock } from "@/lib/docStructure";

const clean = (s?: string) => (s || "").replace(/^[\s•·▪●◦*\-–—]+/, "").trim();

const esc = (s?: string) =>
  clean(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const blockHtml = (b?: DocBlock): string => {
  if (!b) return "";
  if (b.cells) {
    return `<table>${b.cells
      .map((r, i) => `<tr>${r.map((c) => `<t${i === 0 ? "h" : "d"}>${esc(c)}</t${i === 0 ? "h" : "d"}>`).join("")}</tr>`)
      .join("")}</table>`;
  }
  const text = esc(b.text);
  if (!text) return "";
  switch (b.type) {
    case "heading":
      return `<h2>${text}</h2>`;
    case "subheading":
      return `<h3>${text}</h3>`;
    case "question":
      return `<p class="q">${b.num ? `<span class="qn">${esc(b.num)}.</span>` : ""}${text}</p>`;
    case "option":
      return `<p class="opt">${b.label ? `<span class="ol">${esc(b.label)})</span>` : ""}${text}</p>`;
    case "answer":
      return `<p class="ans">${text}</p>`;
    case "explanation":
      return `<p class="exp">${text}</p>`;
    case "formula":
      return `<p class="f">${text}</p>`;
    default:
      return `<p>${text}</p>`;
  }
};

const unitHtml = (u: DocUnit): string => {
  if (u.kind === "question") {
    return `<section class="unit">
      ${blockHtml(u.question)}
      ${u.options.length ? `<div class="opts">${u.options.map(blockHtml).join("")}</div>` : ""}
      ${blockHtml(u.answer)}${blockHtml(u.explanation)}
      ${u.body.map(blockHtml).join("")}
    </section>`;
  }
  return `<section class="prose">${blockHtml(u.heading)}${u.body.map(blockHtml).join("")}</section>`;
};

const pageHtml = (p: DocPage, n: number, totalPages: number, bookTitle: string) => `
  <div class="sheet">
    <header class="sheet-head">
      <span>${esc(p.title || bookTitle)}</span>
      ${p.sourcePage ? `<span>Book page ${p.sourcePage}</span>` : ""}
    </header>
    <div class="sheet-body">${p.units.map(unitHtml).join("")}</div>
    <footer class="sheet-foot">${n} / ${totalPages}</footer>
  </div>`;

const countQuestions = (pages: DocPage[]) =>
  pages.reduce((n, p) => n + p.units.filter((u) => u.kind === "question").length, 0);

const coverHtml = (pages: DocPage[], bookTitle: string, langLabel: string) => {
  const first = pages[0]?.sourcePage;
  const last = [...pages].reverse().find((p) => p.sourcePage)?.sourcePage;
  const rangeText = first ? `Book pages ${first}${last && last !== first ? `–${last}` : ""}` : "";
  return `<div class="sheet cover">
    <div class="cover-inner">
      <p class="cover-kicker">${esc(langLabel)} edition</p>
      <h1>${esc(bookTitle)}</h1>
      <p class="cover-sub">${esc(pages[0]?.title || "")}</p>
      <ul class="cover-meta">
        <li>${pages.length} reader pages</li>
        <li>${countQuestions(pages)} questions</li>
        ${rangeText ? `<li>${rangeText}</li>` : ""}
        <li>Generated ${new Date().toLocaleDateString()}</li>
      </ul>
    </div>
  </div>`;
};

const tocHtml = (pages: DocPage[]) => {
  const rows = pages
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => i === 0 || (p.title && p.title !== pages[i - 1].title))
    .map(({ p, i }) => `<li><span>${esc(p.title || `Page ${i + 1}`)}</span><span class="dots"></span><span>${i + 2}</span></li>`)
    .join("");
  if (!rows) return "";
  return `<div class="sheet">
    <h2 class="toc-title">Contents</h2>
    <ul class="toc">${rows}</ul>
  </div>`;
};


const STYLES = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif;
    color: #14181f;
    font-size: 12.5pt;
    line-height: 1.85;
  }
  .sheet { page-break-after: always; break-after: page; }
  .sheet:last-child { page-break-after: auto; break-after: auto; }
  .sheet-head {
    display: flex; justify-content: space-between; gap: 12px;
    font-size: 9pt; letter-spacing: 0.06em; text-transform: uppercase;
    color: #6b7280; border-bottom: 1px solid #d8dde5;
    padding-bottom: 6px; margin-bottom: 18px;
  }
  .sheet-foot { margin-top: 20px; text-align: center; font-size: 9pt; color: #8b93a1; }
  h2 { font-size: 16pt; margin: 0 0 10px; }
  h3 { font-size: 13pt; margin: 14px 0 6px; }
  .unit { padding: 0 0 14px; margin-bottom: 16px; border-bottom: 1px solid #e6e9ef; page-break-inside: avoid; break-inside: avoid; }
  .unit:last-child { border-bottom: 0; }
  .prose { margin-bottom: 14px; }
  p { margin: 0 0 6px; }
  .q { font-weight: 600; margin-bottom: 8px; }
  .qn { color: #6b7280; margin-right: 6px; }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 24px; margin: 4px 0 6px; }
  .opt { padding-left: 4px; }
  .ol { color: #6b7280; margin-right: 6px; }
  .ans { font-weight: 600; color: #0f766e; margin-top: 6px; }
  .exp { color: #4b5563; }
  .f { font-family: ui-monospace, monospace; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11pt; }
  th, td { border: 1px solid #d8dde5; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f5f9; }
  .cover { display: flex; align-items: center; min-height: 240mm; }
  .cover-inner { width: 100%; border-top: 3px solid #0f766e; border-bottom: 1px solid #d8dde5; padding: 28px 0; }
  .cover-kicker { font-size: 10pt; letter-spacing: 0.14em; text-transform: uppercase; color: #0f766e; margin-bottom: 14px; }
  .cover h1 { font-size: 30pt; line-height: 1.25; margin: 0 0 10px; }
  .cover-sub { font-size: 14pt; color: #4b5563; margin-bottom: 22px; }
  .cover-meta { list-style: none; padding: 0; margin: 0; font-size: 11pt; color: #6b7280; }
  .cover-meta li { padding: 3px 0; }
  .toc-title { font-size: 20pt; margin-bottom: 16px; }
  .toc { list-style: none; padding: 0; margin: 0; font-size: 12pt; }
  .toc li { display: flex; align-items: baseline; gap: 8px; padding: 5px 0; }
  .toc .dots { flex: 1; border-bottom: 1px dotted #c3cad6; }
`;

export interface PdfOptions {
  /** Add a cover page and a contents page (comprehensive full-book export). */
  comprehensive?: boolean;
  /** Language name shown on the cover. */
  langLabel?: string;
}

/**
 * Build a clean, book-style printable document and open the browser's
 * print / "Save as PDF" dialog. Uses real text rendering so Telugu and other
 * Indic scripts are shaped correctly.
 */
export function downloadPagesAsPdf(
  pages: DocPage[],
  bookTitle: string,
  fileName: string,
  opts: PdfOptions = {},
) {
  if (!pages.length) return;
  const front = opts.comprehensive
    ? coverHtml(pages, bookTitle, opts.langLabel || "Translated") + tocHtml(pages)
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>${esc(fileName)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>${STYLES}</style></head>
    <body>${front}${pages.map((p, i) => pageHtml(p, i + 1, pages.length, bookTitle)).join("")}</body></html>`;


  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  const print = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60000);
  };
  // wait for webfonts so Telugu glyphs are not substituted
  const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts?.ready) fonts.ready.then(() => setTimeout(print, 400));
  else setTimeout(print, 1200);
}
