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
// Letter options may be bare ("a) 12") or bracketed; numeric options must be
// bracketed ("(1) 12") so numbered questions like "1. ..." stay questions.
const OPTION_RE = /^(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d])[).\]])\s+(.*)$/;

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
  if (opt && text.length < 300) {
    const label = opt[1] || opt[2] || opt[3];
    return { id: nextId(), type: "option", label, text: opt[4], page };
  }

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

interface PdfItem { x: number; y: number; h: number; w: number; str: string }

/** Rules, dashes, single stray glyphs and other OCR noise carry no content. */
function isNoise(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (t.length <= 1) return true;
  if (!/[A-Za-z0-9]/.test(t)) return true;                 // pure punctuation / rules
  if (/^[-_=~.•*|IlJ\s]+$/.test(t)) return true;           // ---- / .... / | | |
  const letters = t.replace(/[^A-Za-z0-9]/g, "").length;
  if (letters / t.length < 0.35) return true;              // mostly separators
  return false;
}

/**
 * Column detection tuned for scanned exam books: find sustained low-ink vertical
 * bands. Only accepts a split when both sides carry a fair share of the text,
 * so single-column pages are never chopped.
 */
function findColumns(items: PdfItem[], width: number): number[] {
  const BINS = 60;
  const hist = new Array(BINS).fill(0);
  let total = 0;
  for (const it of items) {
    const bin = Math.min(BINS - 1, Math.max(0, Math.floor((it.x / width) * BINS)));
    const n = it.str.trim().length;
    hist[bin] += n;
    total += n;
  }
  if (total < 80) return [0];
  const noise = total / BINS * 0.06;
  const bounds: number[] = [0];
  let run = 0;
  for (let i = 4; i < BINS - 4; i++) {
    if (hist[i] <= noise) { run++; continue; }
    if (run >= 2 && bounds.length < 3) {
      const cut = ((i - run / 2) / BINS) * width;
      const left = hist.slice(0, i - run).reduce((a, b) => a + b, 0);
      const right = total - left;
      if (left > total * 0.15 && right > total * 0.15) bounds.push(cut);
    }
    run = 0;
  }
  return bounds;
}

function linesFromItems(items: PdfItem[], width: number): string[] {
  if (!items.length) return [];
  const bounds = findColumns(items, width);
  const columns: PdfItem[][] = bounds.map(() => []);
  for (const it of items) {
    let c = 0;
    for (let i = bounds.length - 1; i >= 0; i--) if (it.x >= bounds[i]) { c = i; break; }
    columns[c].push(it);
  }
  const medianH = (() => {
    const hs = items.map((i) => i.h).filter((h) => h > 0).sort((a, b) => a - b);
    return hs.length ? hs[Math.floor(hs.length / 2)] : 10;
  })();
  const yTol = Math.max(2, medianH * 0.6);

  const lines: string[] = [];
  for (const col of columns) {
    col.sort((a, b) => (Math.abs(b.y - a.y) > yTol ? b.y - a.y : a.x - b.x));
    let parts: PdfItem[] = [];
    const flush = () => {
      if (!parts.length) return;
      let line = "";
      let prev: PdfItem | null = null;
      for (const it of parts) {
        const gap = prev ? it.x - (prev.x + prev.w) : 0;
        const needSpace = prev !== null && gap > medianH * 0.22 && !line.endsWith(" ") && !it.str.startsWith(" ");
        line += (needSpace ? " " : "") + it.str;
        prev = it;
      }
      const clean = line.replace(/\s+/g, " ").trim();
      if (clean) lines.push(clean);
      parts = [];
    };
    let lastY: number | null = null;
    for (const it of col) {
      if (lastY !== null && Math.abs(it.y - lastY) > yTol) flush();
      parts.push(it);
      lastY = it.y;
    }
    flush();
  }
  return lines;
}

/** Continuation lines belong to the block above them, not to new blocks. */
function startsNewUnit(line: string): boolean {
  return (
    QUESTION_RE.test(line) ||
    OPTION_RE.test(line) ||
    ANSWER_RE.test(line) ||
    EXPLANATION_RE.test(line) ||
    HEADING_RE.test(line)
  );
}

function blocksFromLines(lines: string[], page: number): DocBlock[] {
  const out: DocBlock[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (isNoise(line)) continue;
    const prev = out[out.length - 1];
    const wrapped =
      prev &&
      !startsNewUnit(line) &&
      prev.text !== undefined &&
      (prev.type === "question" || prev.type === "option" || prev.type === "answer" || prev.type === "explanation") &&
      !/[.?!]$/.test(prev.text);
    if (wrapped && prev) {
      prev.text = `${prev.text} ${line}`.replace(/\s+/g, " ").trim();
      continue;
    }
    const b = classifyLine(line, page);
    if (b) out.push(b);
  }
  return out;
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
    const items: PdfItem[] = (content.items as { str: string; transform: number[]; width?: number; height?: number }[])
      .filter((i) => i.str && i.str.trim())
      .map((i) => ({
        x: i.transform[4],
        y: Math.round(i.transform[5]),
        h: i.height || Math.abs(i.transform[3]) || 10,
        w: i.width || i.str.length * 4,
        str: i.str,
      }));
    blocks.push(...blocksFromLines(linesFromItems(items, viewport.width), p));
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

/**
 * Trim everything before the first question of the range so a conversion always
 * starts at question 1 of the chosen page (never mid-book at e.g. 460).
 * Keeps the heading immediately above that question when present.
 */
export function startAtFirstQuestion(blocks: DocBlock[]): DocBlock[] {
  const isQ = (b: DocBlock) => b.type === "question";
  let idx = blocks.findIndex((b) => isQ(b) && (b.num || "").replace(/\D/g, "") === "1");
  if (idx === -1) idx = blocks.findIndex(isQ);
  if (idx <= 0) return blocks;
  const prev = blocks[idx - 1];
  const start = prev && (prev.type === "heading" || prev.type === "subheading") ? idx - 1 : idx;
  return blocks.slice(start);
}

export async function parseDocument(
  file: File,
  onProgress?: (p: number) => void,
  opts?: { fromPage?: number; toPage?: number; perQuestion?: boolean; startAtQuestionOne?: boolean },
) {
  const name = file.name.toLowerCase();
  let blocks: DocBlock[];
  if (name.endsWith(".pdf")) blocks = await extractPdf(file, onProgress, opts);
  else if (name.endsWith(".docx")) blocks = await extractDocx(file);
  else if (/\.(xlsx|xls|csv)$/.test(name)) blocks = await extractSheet(file);
  else blocks = await extractText(file);

  if (opts?.startAtQuestionOne !== false) blocks = startAtFirstQuestion(blocks);

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
