// Document Understanding layer: file -> Universal Educational Representation.
// Runs in the browser, page-by-page / row-by-row, so very large files (300MB+)
// are streamed into small chunks instead of being held in memory as one blob.

import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type BlockType =
  | "heading"
  | "subheading"
  | "paragraph"
  | "question"
  | "option"
  | "answer"
  | "explanation"
  | "table"
  | "caption"
  | "formula"
  | "list_item";

export interface DocBlock {
  id: string;
  type: BlockType;
  num?: string;
  label?: string;
  text?: string;
  cells?: string[][];
  page?: number;
}

export interface DocChunk {
  idx: number;
  kind: string;
  blocks: DocBlock[];
}

export const MAX_CHUNK_CHARS = 2200;

const QUESTION_RE = /^(?:Q\.?\s*)?(\d{1,4})[.)]\s+(.*)$/i;
const OPTION_RE = /^\(?([A-Da-d1-4])[).\]]\s+(.*)$/;
const ANSWER_RE = /^(Ans(?:wer)?|Correct answer|Key)\s*[:.\-]\s*(.*)$/i;
const EXPLANATION_RE = /^(Explanation|Solution|Reason)\s*[:.\-]\s*(.*)$/i;
const FORMULA_RE = /^[^A-Za-z]*[=<>≤≥±√∑∫][^A-Za-z]*$|^[A-Za-z]\s*=\s*.+$/;
const HEADING_RE = /^(chapter|unit|lesson|section|part|exercise|topic)\b/i;

let seq = 0;
const nextId = () => `b${++seq}`;

export function classifyLine(line: string, page?: number): DocBlock | null {
  const text = line.trim();
  if (!text) return null;

  const ans = text.match(ANSWER_RE);
  if (ans) return { id: nextId(), type: "answer", label: ans[1], text: ans[2], page };

  const exp = text.match(EXPLANATION_RE);
  if (exp) return { id: nextId(), type: "explanation", label: exp[1], text: exp[2], page };

  const opt = text.match(OPTION_RE);
  if (opt && text.length < 300) return { id: nextId(), type: "option", label: opt[1], text: opt[2], page };

  const q = text.match(QUESTION_RE);
  if (q) return { id: nextId(), type: "question", num: q[1], text: q[2], page };

  if (FORMULA_RE.test(text) && text.length < 120) return { id: nextId(), type: "formula", text, page };

  if (HEADING_RE.test(text) && text.length < 120) return { id: nextId(), type: "heading", text, page };
  const isShort = text.length < 90;
  const noEndPunct = !/[.?!:;,]$/.test(text);
  if (isShort && noEndPunct && (text === text.toUpperCase() || /^[A-Z]/.test(text)) && text.split(" ").length <= 12) {
    return { id: nextId(), type: "subheading", text, page };
  }
  if (/^[-•*]\s+/.test(text)) return { id: nextId(), type: "list_item", text: text.replace(/^[-•*]\s+/, ""), page };

  return { id: nextId(), type: "paragraph", text, page };
}

// Never split a question away from its options / answer / explanation.
function groupWeight(b: DocBlock) {
  return (b.text?.length || 0) + (b.cells?.flat().join("").length || 0) + 8;
}

export function chunkBlocks(blocks: DocBlock[], startIdx = 0): DocChunk[] {
  const chunks: DocChunk[] = [];
  let current: DocBlock[] = [];
  let size = 0;
  let idx = startIdx;

  const flush = () => {
    if (current.length) {
      chunks.push({ idx: idx++, kind: "block", blocks: current });
      current = [];
      size = 0;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const startsGroup = b.type === "question" || b.type === "heading";
    if (startsGroup && size > MAX_CHUNK_CHARS * 0.6) flush();
    current.push(b);
    size += groupWeight(b);
    const nextStartsGroup = blocks[i + 1]?.type === "question" || blocks[i + 1]?.type === "heading";
    if (size >= MAX_CHUNK_CHARS && (nextStartsGroup || b.type === "paragraph" || b.type === "table")) flush();
  }
  flush();
  return chunks;
}

/**
 * One chunk per reading unit: a single question with its own options / answer /
 * explanation, or one heading + prose run. Keeps conversion strictly sequential
 * and makes per-question verification possible.
 */
export function chunkUnits(blocks: DocBlock[], startIdx = 0): DocChunk[] {
  const chunks: DocChunk[] = [];
  let current: DocBlock[] = [];
  let idx = startIdx;
  let kind = "prose";

  const flush = () => {
    if (current.length) {
      chunks.push({ idx: idx++, kind, blocks: current });
      current = [];
    }
  };

  for (const b of blocks) {
    if (b.type === "question") {
      flush();
      kind = "question";
      current.push(b);
      continue;
    }
    if (b.type === "heading" || b.type === "subheading") {
      flush();
      kind = "prose";
      current.push(b);
      continue;
    }
    if (kind === "question" && (b.type === "option" || b.type === "answer" || b.type === "explanation" || b.type === "formula")) {
      current.push(b);
      continue;
    }
    if (kind === "question") {
      // prose after a finished question starts a new unit
      flush();
      kind = "prose";
    }
    current.push(b);
    // keep prose runs small so pages stay light
    if (current.reduce((n, x) => n + groupWeight(x), 0) > 1200) flush();
  }
  flush();
  return chunks;
}


export function detectDocType(blocks: DocBlock[]) {
  const questions = blocks.filter((b) => b.type === "question").length;
  const options = blocks.filter((b) => b.type === "option").length;
  if (questions >= 3 && options >= questions * 2) return "question_bank";
  if (questions >= 3) return "exam_paper";
  if (blocks.some((b) => b.type === "heading")) return "study_material";
  return "document";
}

// ---------- Extractors ----------

interface PdfItem { x: number; y: number; str: string }

/** Find vertical text columns by looking for empty vertical bands. */
function findColumns(items: PdfItem[], width: number): number[] {
  const BINS = 48;
  const hist = new Array(BINS).fill(0);
  for (const it of items) {
    const bin = Math.min(BINS - 1, Math.max(0, Math.floor((it.x / width) * BINS)));
    hist[bin] += it.str.trim().length;
  }
  const bounds: number[] = [0];
  let run = 0;
  for (let i = 0; i < BINS; i++) {
    if (hist[i] === 0) { run++; continue; }
    if (run >= 3 && bounds.length < 4) bounds.push(((i - run / 2) / BINS) * width);
    run = 0;
  }
  return bounds;
}

function linesFromItems(items: PdfItem[], width: number): string[] {
  const bounds = findColumns(items, width);
  const columns: PdfItem[][] = bounds.map(() => []);
  for (const it of items) {
    let c = 0;
    for (let i = bounds.length - 1; i >= 0; i--) if (it.x >= bounds[i]) { c = i; break; }
    columns[c].push(it);
  }
  const lines: string[] = [];
  for (const col of columns) {
    col.sort((a, b) => (Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x));
    let line = "";
    let lastY: number | null = null;
    for (const it of col) {
      if (lastY !== null && Math.abs(it.y - lastY) > 3) { lines.push(line); line = ""; }
      line += (line && !line.endsWith(" ") && !it.str.startsWith(" ") ? " " : "") + it.str;
      lastY = it.y;
    }
    if (line.trim()) lines.push(line);
  }
  return lines;
}

async function extractPdf(
  file: File,
  onProgress?: (p: number) => void,
  range?: { fromPage?: number; toPage?: number },
): Promise<DocBlock[]> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const from = Math.max(1, Math.min(range?.fromPage || 1, pdf.numPages));
  const to = Math.min(pdf.numPages, Math.max(from, range?.toPage || pdf.numPages));
  const span = to - from + 1;
  const blocks: DocBlock[] = [];
  for (let p = from; p <= to; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: PdfItem[] = (content.items as { str: string; transform: number[] }[])
      .filter((i) => i.str && i.str.trim())
      .map((i) => ({ x: i.transform[4], y: Math.round(i.transform[5]), str: i.str }));
    for (const line of linesFromItems(items, viewport.width)) {
      const b = classifyLine(line, p);
      if (b) blocks.push(b);
    }
    page.cleanup();
    onProgress?.((p - from + 1) / span);
  }
  return blocks;
}


function htmlToBlocks(html: string): DocBlock[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: DocBlock[] = [];
  doc.body.querySelectorAll("h1,h2,h3,h4,p,li,table").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "table") {
      const cells = Array.from(el.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.querySelectorAll("th,td")).map((td) => td.textContent?.trim() || ""),
      );
      if (cells.length) blocks.push({ id: nextId(), type: "table", cells });
      return;
    }
    const text = el.textContent?.replace(/\s+/g, " ").trim();
    if (!text) return;
    if (tag === "h1" || tag === "h2") {
      blocks.push({ id: nextId(), type: "heading", text });
    } else if (tag === "h3" || tag === "h4") {
      blocks.push({ id: nextId(), type: "subheading", text });
    } else {
      const b = classifyLine(text);
      if (b) blocks.push(b);
    }
  });
  return blocks;
}

async function extractDocx(file: File): Promise<DocBlock[]> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  return htmlToBlocks(value);
}

async function extractSheet(file: File): Promise<DocBlock[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const blocks: DocBlock[] = [];
  for (const name of wb.SheetNames) {
    blocks.push({ id: nextId(), type: "heading", text: name });
    const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, blankrows: false });
    // keep each row as its own small table block so numbering/columns stay aligned
    const header = (rows[0] || []).map((c) => String(c ?? ""));
    for (let i = 1; i < rows.length; i++) {
      const row = (rows[i] || []).map((c) => String(c ?? ""));
      if (!row.join("").trim()) continue;
      blocks.push({ id: nextId(), type: "table", cells: [header, row] });
    }
  }
  return blocks;
}

async function extractText(file: File): Promise<DocBlock[]> {
  const text = await file.text();
  return text
    .split(/\r?\n/)
    .map((l) => classifyLine(l))
    .filter((b): b is DocBlock => !!b);
}

export async function parseDocument(
  file: File,
  onProgress?: (p: number) => void,
  opts?: { fromPage?: number; toPage?: number; perQuestion?: boolean },
) {
  const name = file.name.toLowerCase();
  let blocks: DocBlock[];
  if (name.endsWith(".pdf")) blocks = await extractPdf(file, onProgress, opts);
  else if (name.endsWith(".docx")) blocks = await extractDocx(file);
  else if (/\.(xlsx|xls|csv)$/.test(name)) blocks = await extractSheet(file);
  else blocks = await extractText(file);

  onProgress?.(1);
  const docType = detectDocType(blocks);
  const perQuestion = opts?.perQuestion ?? true;
  const chunks = perQuestion ? chunkUnits(blocks) : chunkBlocks(blocks);
  return { blocks, chunks, docType };
}


export async function hashString(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
