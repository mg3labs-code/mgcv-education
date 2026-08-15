import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseDocument, hashString, type DocBlock, type PageDiagnostic } from "@/lib/docStructure";
import ExtractionDiagnostics from "@/components/translate/ExtractionDiagnostics";
import { paginate, type DocPage, type DocUnit } from "@/lib/docPaginate";
import { downloadPagesAsPdf } from "@/lib/docPrint";
import DocChat from "@/components/translate/DocChat";
import {
  Upload, FileText, ChevronLeft, ChevronRight, Loader2, RefreshCw,
  BookOpen, Columns2, Plus, X, LayoutGrid, History, Download, CheckCircle2,
} from "lucide-react";



const LANGS = [
  { code: "te", label: "Telugu" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
];

const STYLES = [
  { code: "bracket", label: "Native + English in brackets" },
  { code: "pure", label: "Pure native terminology" },
  { code: "keep_english", label: "Keep English technical terms" },
];

interface JobRow {
  id: string;
  file_name: string;
  doc_type: string;
  target_lang: string;
  term_style: string;
  status: string;
  total_chunks: number;
  done_chunks: number;
  failed_chunks: number;
  created_at: string;
}

interface ChunkRow {
  idx: number;
  status: string;
  error: string | null;
  source: { blocks: DocBlock[] };
  translated: { blocks: DocBlock[]; validation?: { pass: boolean; issues: string[] } } | null;
}

const getGuestId = () => {
  let id = localStorage.getItem("doc_translate_guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("doc_translate_guest_id", id);
  }
  return id;
};

const callEndpoint = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("translate-doc", {
    body: { ...payload, guestId: getGuestId() },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as Record<string, any>;
};


/** Clean list/label noise so the page reads like a printed book page. */
const clean = (s?: string) => (s || "").replace(/^[\s•·▪●◦*\-–—]+/, "").trim();

const BlockView = ({ block }: { block: DocBlock }) => {
  if (block.cells) {
    return (
      <div className="overflow-x-auto my-5">
        <table className="w-full text-[0.95rem] border-collapse">
          <tbody>
            {block.cells.map((row, i) => (
              <tr key={i} className={i === 0 ? "bg-muted/50 font-medium" : ""}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-border/70 px-3 py-2 align-top">{clean(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const text = clean(block.text);
  if (!text) return null;

  switch (block.type) {
    case "heading":
      return <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3 first:mt-0">{text}</h2>;
    case "subheading":
      return <h3 className="text-lg font-semibold mt-6 mb-2 first:mt-0">{text}</h3>;
    case "question":
      return (
        <p className="mt-7 mb-2 font-medium leading-8">
          {block.num ? <span className="text-muted-foreground mr-2 tabular-nums">{clean(block.num)}.</span> : null}
          {text}
        </p>
      );
    case "option":
      return (
        <p className="pl-7 leading-8 text-foreground/90">
          {block.label ? <span className="text-muted-foreground mr-2">{clean(block.label)}.</span> : null}
          {text}
        </p>
      );
    case "answer":
      return <p className="pl-7 mt-2 leading-8 font-medium text-primary">{text}</p>;
    case "explanation":
      return <p className="pl-7 mt-1 leading-8 text-muted-foreground">{text}</p>;
    case "formula":
      return <p className="my-4 font-mono text-[0.95rem] leading-8">{text}</p>;
    case "list_item":
      return (
        <p className="pl-7 leading-8 text-foreground/90 relative before:content-[''] before:absolute before:left-2 before:top-[0.95em] before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground/60">
          {text}
        </p>
      );
    default:
      return <p className="my-3 leading-8 text-foreground/90">{text}</p>;
  }
};

/** One reading unit: a question with its own options, or a prose/heading run. */
const UnitView = ({ unit }: { unit: DocUnit }) => {
  if (unit.kind === "question") {
    return (
      <section className="mb-7 border-b border-border/50 pb-6 last:border-0 last:pb-0">
        {unit.question ? <BlockView block={unit.question} /> : null}
        {unit.options.length > 0 && (
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {unit.options.map((o) => <BlockView key={o.id} block={o} />)}
          </div>
        )}
        {unit.answer ? <BlockView block={unit.answer} /> : null}
        {unit.explanation ? <BlockView block={unit.explanation} /> : null}
        {unit.body.map((b) => <BlockView key={b.id} block={b} />)}
      </section>
    );
  }
  return (
    <section className="mb-5 last:mb-0">
      {unit.heading ? <BlockView block={unit.heading} /> : null}
      {unit.body.map((b) => <BlockView key={b.id} block={b} />)}
    </section>
  );
};

const DocTranslate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [activeJob, setActiveJob] = useState<JobRow | null>(null);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [targetLang, setTargetLang] = useState("te");
  const [termStyle, setTermStyle] = useState("bracket");
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState("");
  const [startAtOne, setStartAtOne] = useState(true);
  const [maxQuestions, setMaxQuestions] = useState("100");
  const [diagnostics, setDiagnostics] = useState<PageDiagnostic[]>([]);

  const [phase, setPhase] = useState<"idle" | "parsing" | "uploading" | "translating">("idle");
  const [parseProgress, setParseProgress] = useState(0);
  const [page, setPage] = useState(0);
  const [bilingual, setBilingual] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [showThumbs, setShowThumbs] = useState(false);
  const [jumpValue, setJumpValue] = useState("1");


  const running = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await callEndpoint({ action: "list_jobs", limit: 30 });
      setJobs((res.jobs as JobRow[]) || []);
    } catch {
      setJobs([]);
    }
  }, []);

  const loadChunks = useCallback(async (jobId: string) => {
    const res = await callEndpoint({ action: "chunks", jobId });
    setChunks((res.chunks as ChunkRow[]) || []);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const runLoop = useCallback(async (jobId: string) => {
    if (running.current) return;
    running.current = true;
    setPhase("translating");
    try {
      for (let guard = 0; guard < 20000; guard++) {
        // one unit at a time, in document order, so a question is verified
        // before the next one is converted
        const res = await callEndpoint({ action: "process", jobId, batchSize: 1 });
        const { job: fresh } = await callEndpoint({ action: "status", jobId });
        if (fresh) setActiveJob(fresh as JobRow);
        if (guard % 3 === 0 || res.finished) await loadChunks(jobId);
        if (res.finished) break;
      }
      await loadChunks(jobId);

      await loadJobs();
    } catch (e) {
      toast({ title: "Conversion paused", description: String(e), variant: "destructive" });
    } finally {
      running.current = false;
      setPhase("idle");
    }
  }, [loadChunks, loadJobs, toast]);

  const openJob = useCallback(async (job: JobRow) => {
    setActiveJob(job);
    setPage(0);
    setShowUpload(false);
    await loadChunks(job.id);
    if (job.status !== "completed" && job.total_chunks > job.done_chunks + job.failed_chunks) {
      runLoop(job.id);
    }
  }, [loadChunks, runLoop]);

  // Resume a conversion opened from the history page (/translate?job=<id>)
  const requestedJob = searchParams.get("job");
  useEffect(() => {
    if (!requestedJob) return;
    let cancelled = false;
    (async () => {
      let data: JobRow | null = null;
      try {
        const res = await callEndpoint({ action: "status", jobId: requestedJob });
        data = (res.job as JobRow) ?? null;
      } catch { data = null; }
      if (cancelled) return;
      searchParams.delete("job");
      setSearchParams(searchParams, { replace: true });
      if (data) await openJob(data);
      else toast({ title: "Conversion not found", description: "It may have been removed.", variant: "destructive" });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedJob]);

  const handleFile = async (file: File) => {
    try {
      setPhase("parsing");
      setParseProgress(0);
      const from = Math.max(1, Number(fromPage) || 1);
      const to = Number(toPage) > 0 ? Math.max(from, Number(toPage)) : undefined;
      const maxQ = Number(maxQuestions) > 0 ? Number(maxQuestions) : undefined;
      const { blocks, chunks: parsed, docType, diagnostics: diag } = await parseDocument(file, setParseProgress, {
        fromPage: from,
        toPage: to,
        perQuestion: true,
        startAtQuestionOne: startAtOne,
        maxQuestions: maxQ,
      });
      setDiagnostics(diag);
      if (!blocks.length) throw new Error("No readable text found in this page range.");

      const contentHash = await hashString(
        `p${from}-${to ?? "end"}${startAtOne ? "-q1" : ""}${maxQ ? `-max${maxQ}` : ""}\n` +
          blocks.map((b) => b.text || (b.cells || []).flat().join("|")).join("\n"),
      );


      const { job, reused } = await callEndpoint({
        action: "start",
        fileName: file.name,
        fileSize: file.size,
        docType,
        targetLang,
        termStyle,
        contentHash,
      });


      if (reused) {
        toast({ title: "Already converted", description: "Opening the saved version." });
        await loadJobs();
        await openJob(job as JobRow);
        setPhase("idle");
        return;
      }

      setPhase("uploading");
      const BATCH = 25;
      for (let i = 0; i < parsed.length; i += BATCH) {
        await callEndpoint({
          action: "add_chunks",
          jobId: (job as JobRow).id,
          chunks: parsed.slice(i, i + BATCH),
          done: i + BATCH >= parsed.length,
        });
      }
      await loadJobs();
      setActiveJob(job as JobRow);
      setPage(0);
      setShowUpload(false);
      await loadChunks((job as JobRow).id);
      runLoop((job as JobRow).id);
    } catch (e) {
      setPhase("idle");
      toast({ title: "Could not read this file", description: String(e), variant: "destructive" });
    }
  };

  const pct = useMemo(() => {
    if (!activeJob?.total_chunks) return 0;
    return Math.round(((activeJob.done_chunks + activeJob.failed_chunks) / activeJob.total_chunks) * 100);
  }, [activeJob]);

  // Repaginate the entire document into structure-respecting pages so a question
  // is always shown with its own options, in document order.
  const pages: DocPage[] = useMemo(() => {
    const translated: DocBlock[] = [];
    const source: DocBlock[] = [];
    [...chunks]
      .sort((a, b) => a.idx - b.idx)
      .forEach((c) => {
        const src = c.source?.blocks || [];
        source.push(...src);
        translated.push(...(c.translated?.blocks?.length ? c.translated.blocks : src));
      });
    return paginate(translated, source, { questionsPerPage: 4, pageChars: 1500 });
  }, [chunks]);

  // Sequential verification progress, question by question
  const verify = useMemo(() => {
    const qChunks = chunks.filter((c) => (c.source?.blocks || []).some((b) => b.type === "question"));
    const list = qChunks.length ? qChunks : chunks;
    const done = list.filter((c) => !!c.translated);
    const review = done.filter((c) => c.translated?.validation && !c.translated.validation.pass).length;
    return { total: list.length, done: done.length, review };
  }, [chunks]);

  const total = pages.length;
  const current = pages[Math.min(page, Math.max(total - 1, 0))];
  const pendingPage = chunks.length > 0 && chunks.every((c) => !c.translated);


  const pageText = useMemo(() => {
    if (!current) return "";
    const flat = current.units.flatMap((u) => [
      u.heading, u.question, ...u.options, u.answer, u.explanation, ...u.body,
    ]);
    return flat
      .map((b) => (b ? clean(b.text) || (b.cells || []).flat().map(clean).join(" | ") : ""))
      .filter(Boolean)
      .join("\n")
      .slice(0, 12000);
  }, [current]);

  useEffect(() => { setJumpValue(String(Math.min(page + 1, Math.max(total, 1)))); }, [page, total]);

  const jumpTo = useCallback((n: number) => {

    if (!Number.isFinite(n)) return;
    const target = Math.min(Math.max(Math.round(n), 1), Math.max(total, 1)) - 1;
    setPage(target);
    readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [total]);


  const go = useCallback((dir: -1 | 1) => {
    setPage((p) => Math.min(Math.max(p + dir, 0), Math.max(total - 1, 0)));
    readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [total]);

  // Keyboard page turning — feels like a book, no cursor scrubbing needed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!activeJob) return;
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeJob, go]);

  const langLabel = LANGS.find((l) => l.code === (activeJob?.target_lang || targetLang))?.label;

  const baseName = (activeJob?.file_name || "document").replace(/\.[a-z0-9]+$/i, "").slice(0, 60);

  const downloadPdf = useCallback((scope: "page" | "all") => {
    if (!pages.length) return;
    const sel = scope === "page" && current ? [current] : pages;
    const first = sel[0]?.sourcePage;
    const last = sel[sel.length - 1]?.sourcePage;
    const range = first ? `-p${first}${last && last !== first ? `-${last}` : ""}` : "";
    if (scope === "all" && verify.done < verify.total) {
      toast({
        title: "Still converting",
        description: `${verify.done} of ${verify.total} verified — pages not yet converted will print in English.`,
      });
    }
    downloadPagesAsPdf(sel, baseName, `${baseName}-${activeJob?.target_lang || targetLang}${range}`, {
      comprehensive: scope === "all",
      langLabel: langLabel || "Translated",
    });
  }, [pages, current, baseName, activeJob, targetLang, verify, langLabel]);



  return (
    <div className="min-h-screen bg-background">
      {/* Slim sticky bar: title, doc switcher, view toggle */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium truncate">
            {activeJob ? activeJob.file_name : "Document Converter"}
          </p>
          {activeJob && total > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
              · Page {Math.min(page + 1, total)} / {total}
              {current?.sourcePage ? ` · book p.${current.sourcePage}` : ""}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {activeJob && total > 0 && (
              <>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => downloadPdf("page")}>
                  <Download className="h-4 w-4" />
                  <span className="hidden lg:inline">This page</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadPdf("all")}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Full book PDF</span>
                </Button>

              </>
            )}
            {activeJob && total > 0 && (
              <Button variant={showThumbs ? "secondary" : "ghost"} size="sm" className="gap-1.5"
                onClick={() => setShowThumbs((s) => !s)}>
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Pages</span>
              </Button>
            )}
            {activeJob && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setBilingual((b) => !b)}>
                <Columns2 className="h-4 w-4" />
                <span className="hidden sm:inline">{bilingual ? langLabel : "Side by side"}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/translate/history")}>
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button variant={showUpload ? "secondary" : "outline"} size="sm" className="gap-1.5"
              onClick={() => setShowUpload((s) => !s)}>
              {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="hidden sm:inline">{showUpload ? "Close" : "New"}</span>
            </Button>
          </div>
        </div>
        {activeJob && verify.total > 0 && verify.done < verify.total && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Question {Math.min(verify.done + 1, verify.total)} of {verify.total} — converting and verifying in order
            {verify.review > 0 && <span>· {verify.review} need review</span>}
          </div>
        )}
        {activeJob && verify.total > 0 && verify.done >= verify.total && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {verify.total} questions verified
            {verify.review > 0 && <span>· {verify.review} flagged for review</span>}
          </div>
        )}

        {/* Reading position — always visible */}
        {activeJob && total > 0 && (
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((Math.min(page + 1, total)) / total) * 100}%` }}
            />
          </div>
        )}
        {activeJob && activeJob.status !== "completed" && (
          <Progress value={pct} className="h-0.5 rounded-none" />
        )}
      </header>


      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {showUpload && (
          <Card className="p-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={termStyle} onValueChange={setTermStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                From page
                <Input type="number" min={1} value={fromPage}
                  onChange={(e) => setFromPage(e.target.value)} className="h-9 w-24" />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                To page
                <Input type="number" min={1} placeholder="end" value={toPage}
                  onChange={(e) => setToPage(e.target.value)} className="h-9 w-24" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              First
              <Input type="number" min={1} placeholder="all" value={maxQuestions}
                onChange={(e) => setMaxQuestions(e.target.value)} className="h-9 w-24" />
              questions only — keeps trial runs small and fast (blank = all)
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={startAtOne}
                onChange={(e) => setStartAtOne(e.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                Start at question 1 — skips leftover questions from the previous chapter,
                so numbering begins at 1 instead of continuing from 460.
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              Only these PDF pages are converted — e.g. start at 13 to begin from Chapter 1.
            </p>




            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            <Button className="w-full gap-2" size="lg" disabled={phase !== "idle"}
              onClick={() => fileRef.current?.click()}>
              {phase === "idle" ? <Upload className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              {phase === "idle" && "Choose a document"}
              {phase === "parsing" && `Reading… ${Math.round(parseProgress * 100)}%`}
              {phase === "uploading" && "Saving…"}
              {phase === "translating" && "Converting…"}
            </Button>
            {phase === "parsing" && <Progress value={parseProgress * 100} />}

            {jobs.length > 0 && (
              <div className="grid gap-1.5 pt-1">
                {jobs.slice(0, 6).map((j) => (
                  <button
                    key={j.id}
                    onClick={() => openJob(j)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{j.file_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {LANGS.find((l) => l.code === j.target_lang)?.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {diagnostics.length > 0 && <ExtractionDiagnostics diagnostics={diagnostics} />}

        {activeJob && total > 0 && (
          <>
            <article
              ref={readerRef}
              className="rounded-xl border border-border bg-card px-6 py-8 sm:px-12 sm:py-12 min-h-[60vh]"
            >
              {current?.title && current.units[0]?.heading?.text !== current.title && (
                <p className="mb-6 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {clean(current.title)}
                </p>
              )}

              {bilingual ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <div>{current?.sourceUnits.map((u) => <UnitView key={u.id} unit={u} />)}</div>
                  <div className="md:border-l md:border-border md:pl-8">
                    {current?.units.map((u) => <UnitView key={u.id} unit={u} />)}
                  </div>
                </div>
              ) : (
                current?.units.map((u) => <UnitView key={u.id} unit={u} />)
              )}

              {pendingPage && (
                <p className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Converting — showing the original meanwhile.
                </p>
              )}
            </article>

            {/* Page thumbnails + quick jump */}
            {showThumbs && (
              <Card className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Jump to page</p>
                  <div className="ml-auto flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={total}
                      value={jumpValue}
                      onChange={(e) => setJumpValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") jumpTo(Number(jumpValue)); }}
                      className="h-8 w-20"
                      aria-label="Page number"
                    />
                    <Button size="sm" variant="secondary" onClick={() => jumpTo(Number(jumpValue))}>Go</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[45vh] overflow-y-auto">
                  {pages.map((pg, i) => {
                    const preview = clean(pg.preview);
                    return (
                      <button
                        key={pg.index}
                        onClick={() => { setPage(i); readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        className={`text-left rounded-lg border p-2 h-24 overflow-hidden transition-colors ${
                          i === page ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"
                        }`}
                      >
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{i + 1}</span>
                        <span className="mt-1 block text-[10px] leading-4 text-muted-foreground/90 line-clamp-4">
                          {preview || "…"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Page turner */}
            <div className="sticky bottom-4 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 backdrop-blur px-2 py-1.5 shadow-sm">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                  disabled={page === 0} onClick={() => go(-1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium tabular-nums text-muted-foreground px-2">
                  Page {Math.min(page + 1, total)} of {total}
                </span>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                  disabled={page >= total - 1} onClick={() => go(1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant={showThumbs ? "secondary" : "ghost"} size="icon" className="rounded-full h-9 w-9"
                  onClick={() => setShowThumbs((s) => !s)} aria-label="Page thumbnails">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                {activeJob.status !== "completed" && (
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                    disabled={phase !== "idle"} onClick={() => runLoop(activeJob.id)} aria-label="Resume conversion">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <DocChat
              docName={activeJob.file_name}
              pageText={pageText}
              pageNumber={Math.min(page + 1, total)}
              targetLang={activeJob.target_lang}
            />

          </>
        )}

        {!activeJob && !showUpload && (
          <div className="py-20 text-center space-y-3">
            <Badge variant="secondary">Nothing open</Badge>
            <p className="text-sm text-muted-foreground">Tap “New” to convert a document.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocTranslate;
