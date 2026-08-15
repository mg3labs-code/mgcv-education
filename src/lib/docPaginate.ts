import type { DocBlock } from "@/lib/docStructure";

/** A self-contained reading unit: a question with its options/answer, or a prose run. */
export interface DocUnit {
  id: string;
  kind: "question" | "heading" | "prose";
  heading?: DocBlock;
  question?: DocBlock;
  options: DocBlock[];
  answer?: DocBlock;
  explanation?: DocBlock;
  body: DocBlock[];
}

export interface DocPage {
  index: number;
  units: DocUnit[];
  /** Source blocks aligned to the same units, for side-by-side view. */
  sourceUnits: DocUnit[];
  title?: string;
  preview: string;
  /** Page number in the original book, when known. */
  sourcePage?: number;
}


const weight = (b?: DocBlock) =>
  b ? (b.text?.length || 0) + (b.cells?.flat().join("").length || 0) + 12 : 0;

const unitWeight = (u: DocUnit) =>
  weight(u.heading) + weight(u.question) + weight(u.answer) + weight(u.explanation) +
  u.options.reduce((n, b) => n + weight(b), 0) +
  u.body.reduce((n, b) => n + weight(b), 0);

/** Group a flat block stream into units so a question never drifts from its options. */
export function groupUnits(blocks: DocBlock[]): DocUnit[] {
  const units: DocUnit[] = [];
  let cur: DocUnit | null = null;

  const push = () => { if (cur) units.push(cur); cur = null; };
  const fresh = (kind: DocUnit["kind"], id: string): DocUnit =>
    ({ id, kind, options: [], body: [] });

  for (const b of blocks) {
    switch (b.type) {
      case "question":
        push();
        cur = fresh("question", b.id);
        cur.question = b;
        break;
      case "heading":
      case "subheading":
        push();
        cur = fresh("heading", b.id);
        cur.heading = b;
        break;
      case "option":
        if (!cur || cur.kind !== "question") { push(); cur = fresh("question", b.id); }
        cur.options.push(b);
        break;
      case "answer":
        if (!cur) cur = fresh("question", b.id);
        cur.answer = b;
        break;
      case "explanation":
        if (!cur) cur = fresh("question", b.id);
        cur.explanation = b;
        break;
      default:
        if (!cur) cur = fresh("prose", b.id);
        cur.body.push(b);
    }
  }
  push();
  return units.filter((u) => u.question || u.heading || u.options.length || u.body.length);
}

const unitText = (u: DocUnit) =>
  [u.heading?.text, u.question?.text, ...u.options.map((o) => o.text), ...u.body.map((b) => b.text)]
    .filter(Boolean)
    .join(" ");

const PAGE_CHARS = 1800;
const MAX_QUESTIONS = 5;

/**
 * Repaginate the whole document into evenly-sized, structure-respecting pages.
 * Pages break at headings and between questions — never inside a question group.
 */
export function paginate(translated: DocBlock[], source: DocBlock[]): DocPage[] {
  const tUnits = groupUnits(translated);
  const sUnits = groupUnits(source);
  const pages: DocPage[] = [];

  let units: DocUnit[] = [];
  let srcUnits: DocUnit[] = [];
  let size = 0;
  let questions = 0;
  let title: string | undefined;

  const flush = () => {
    if (!units.length) return;
    pages.push({
      index: pages.length,
      units,
      sourceUnits: srcUnits,
      title,
      preview: units.map(unitText).join(" ").slice(0, 160),
    });
    units = [];
    srcUnits = [];
    size = 0;
    questions = 0;
  };

  tUnits.forEach((u, i) => {
    const w = unitWeight(u);
    const breakBefore =
      units.length > 0 &&
      ((u.kind === "heading" && u.heading?.type === "heading") ||
        size + w > PAGE_CHARS ||
        questions >= MAX_QUESTIONS);
    if (breakBefore) flush();
    if (u.heading?.type === "heading") title = u.heading.text;
    if (!units.length && !title && u.heading) title = u.heading.text;
    units.push(u);
    if (sUnits[i]) srcUnits.push(sUnits[i]);
    size += w;
    if (u.kind === "question") questions += 1;
  });
  flush();

  return pages;
}
