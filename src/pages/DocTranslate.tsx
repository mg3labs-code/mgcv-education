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
import { parseDocument, hashString, type DocBlock } from "@/lib/docStructure";
import DocChat from "@/components/translate/DocChat";
import {
  Upload, FileText, ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertTriangle,
  BookOpen, Columns2, Plus, X, LayoutGrid, History,
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

const DocTranslate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [activeJob, setActiveJob] = useState<JobRow | null>(null);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [targetLang, setTargetLang] = useState("te");
  const [termStyle, setTermStyle] = useState("bracket");
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
    const { data } = await supabase
      .from("doc_translation_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setJobs((data as JobRow[]) || []);
  }, []);

  const loadChunks = useCallback(async (jobId: string) => {
    const { data } = await supabase
      .from("doc_translation_chunks")
      .select("idx, status, error, source, translated")
      .eq("job_id", jobId)
      .order("idx", { ascending: true });
    setChunks((data as unknown as ChunkRow[]) || []);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const runLoop = useCallback(async (jobId: string) => {
    if (running.current) return;
    running.current = true;
    setPhase("translating");
    try {
      for (let guard = 0; guard < 5000; guard++) {
        const res = await callEndpoint({ action: "process", jobId, batchSize: 3 });
        const { data: fresh } = await supabase
          .from("doc_translation_jobs").select("*").eq("id", jobId).maybeSingle();
        if (fresh) setActiveJob(fresh as JobRow);
        await loadChunks(jobId);
        if (res.finished) break;
      }
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
      const { data } = await supabase
        .from("doc_translation_jobs").select("*").eq("id", requestedJob).maybeSingle();
      if (cancelled) return;
      searchParams.delete("job");
      setSearchParams(searchParams, { replace: true });
      if (data) await openJob(data as JobRow);
      else toast({ title: "Conversion not found", description: "It may have been removed.", variant: "destructive" });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedJob]);

  const handleFile = async (file: File) => {
    try {
      setPhase("parsing");
      setParseProgress(0);
      const { blocks, chunks: parsed, docType } = await parseDocument(file, setParseProgress);
      if (!blocks.length) throw new Error("No readable text found in this file.");

      const contentHash = await hashString(
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

  const total = chunks.length;
  const current = chunks[Math.min(page, Math.max(total - 1, 0))];

  const pageText = useMemo(() => {
    const blocks = current?.translated?.blocks || current?.source.blocks || [];
    return blocks
      .map((b) => clean(b.text) || (b.cells || []).flat().map(clean).join(" | "))
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
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
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

        {activeJob && total > 0 && (
          <>
            <article
              ref={readerRef}
              className="rounded-xl border border-border bg-card px-6 py-8 sm:px-12 sm:py-12 min-h-[60vh]"
            >
              {bilingual ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <div>{current?.source.blocks.map((b) => <BlockView key={b.id} block={b} />)}</div>
                  <div className="md:border-l md:border-border md:pl-8">
                    {current?.translated?.blocks
                      ? current.translated.blocks.map((b) => <BlockView key={b.id} block={b} />)
                      : <p className="text-muted-foreground">Converting…</p>}
                  </div>
                </div>
              ) : current?.translated?.blocks ? (
                current.translated.blocks.map((b) => <BlockView key={b.id} block={b} />)
              ) : (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Converting this page…
                </p>
              )}

              {current?.error && (
                <p className="mt-6 text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {current.error}
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
                  {chunks.map((c, i) => {
                    const blocks = c.translated?.blocks || c.source.blocks;
                    const preview = blocks
                      .map((b) => clean(b.text) || (b.cells || []).flat().map(clean).join(" "))
                      .filter(Boolean)
                      .join(" ")
                      .slice(0, 140);
                    return (
                      <button
                        key={c.idx}
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
