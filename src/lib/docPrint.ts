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
`;

/**
 * Build a clean, book-style printable document and open the browser's
 * print / "Save as PDF" dialog. Uses real text rendering so Telugu and other
 * Indic scripts are shaped correctly.
 */
export function downloadPagesAsPdf(pages: DocPage[], bookTitle: string, fileName: string) {
  if (!pages.length) return;
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>${esc(fileName)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>${STYLES}</style></head>
    <body>${pages.map((p, i) => pageHtml(p, i + 1, pages.length, bookTitle)).join("")}</body></html>`;

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
