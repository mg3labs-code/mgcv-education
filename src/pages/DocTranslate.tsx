import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseDocument, hashString, type DocBlock } from "@/lib/docStructure";
import {
  Upload, FileText, Languages, CheckCircle2, AlertTriangle, Loader2, Sparkles, RefreshCw,
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

const callEndpoint = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("translate-doc", { body: payload });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as Record<string, any>;
};

const BlockView = ({ block }: { block: DocBlock }) => {
  if (block.cells) {
    return (
      <div className="overflow-x-auto my-2">
        <table className="text-sm border border-border rounded">
          <tbody>
            {block.cells.map((row, i) => (
              <tr key={i} className={i === 0 ? "bg-muted/60 font-semibold" : ""}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-border px-2 py-1 align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const base = "leading-relaxed";
  switch (block.type) {
    case "heading":
      return <h3 className="text-lg font-bold mt-4 mb-1 text-foreground">{block.text}</h3>;
    case "subheading":
      return <h4 className="text-base font-semibold mt-3 mb-1 text-foreground">{block.text}</h4>;
    case "question":
      return <p className={`${base} font-semibold mt-3 text-foreground`}>{block.num}. {block.text}</p>;
    case "option":
      return <p className={`${base} pl-4 text-foreground/90`}>{block.label}. {block.text}</p>;
    case "answer":
      return <p className={`${base} pl-4 font-medium text-primary`}>{block.label}: {block.text}</p>;
    case "explanation":
      return <p className={`${base} pl-4 text-muted-foreground italic`}>{block.label}: {block.text}</p>;
    case "formula":
      return <p className={`${base} font-mono text-sm bg-muted/50 rounded px-2 py-1 my-1`}>{block.text}</p>;
    case "list_item":
      return <p className={`${base} pl-4 text-foreground/90`}>• {block.text}</p>;
    default:
      return <p className={`${base} text-foreground/90 my-1`}>{block.text}</p>;
  }
};

const DocTranslate = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [activeJob, setActiveJob] = useState<JobRow | null>(null);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [targetLang, setTargetLang] = useState("te");
  const [termStyle, setTermStyle] = useState("bracket");
  const [phase, setPhase] = useState<"idle" | "parsing" | "uploading" | "translating">("idle");
  const [parseProgress, setParseProgress] = useState(0);
  const running = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // Resumable translation loop — only touches chunks that are not done yet,
  // so reopening a finished document costs nothing.
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
    await loadChunks(job.id);
    if (job.status !== "completed" && job.total_chunks > job.done_chunks + job.failed_chunks) {
      runLoop(job.id);
    }
  }, [loadChunks, runLoop]);

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
        toast({ title: "Already converted", description: "Loading the saved version — no re-conversion needed." });
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
      await loadChunks((job as JobRow).id);
      runLoop((job as JobRow).id);
    } catch (e) {
      setPhase("idle");
      toast({ title: "Could not process file", description: String(e), variant: "destructive" });
    }
  };

  const pct = useMemo(() => {
    if (!activeJob?.total_chunks) return 0;
    return Math.round(((activeJob.done_chunks + activeJob.failed_chunks) / activeJob.total_chunks) * 100);
  }, [activeJob]);

  const reviewCount = chunks.filter((c) => c.status === "error" || c.translated?.validation?.pass === false).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> Structure-preserving engine</Badge>
          <h1 className="text-3xl font-bold text-foreground">English → Indian Language Document Converter</h1>
          <p className="text-muted-foreground max-w-3xl">
            Convert full question banks, exam papers and study guides without changing numbering,
            options, answer keys, tables or formulas. Every conversion is stored once and reopened instantly.
          </p>
        </header>

        <Card className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target language</label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Terminology style</label>
              <Select value={termStyle} onValueChange={setTermStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={phase !== "idle"}
            onClick={() => fileRef.current?.click()}
          >
            {phase === "idle" ? <Upload className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {phase === "idle" && "Upload document (PDF, DOCX, Excel, CSV, TXT)"}
            {phase === "parsing" && `Reading structure… ${Math.round(parseProgress * 100)}%`}
            {phase === "uploading" && "Saving document structure…"}
            {phase === "translating" && "Converting…"}
          </Button>
          {phase === "parsing" && <Progress value={parseProgress * 100} />}
          <p className="text-xs text-muted-foreground">
            Large files are read page-by-page in your browser and split into small chunks, so 300MB+ documents work.
          </p>
        </Card>

        {jobs.length > 0 && (
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-foreground">Your converted documents</h2>
            <div className="grid gap-2">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => openJob(j)}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${activeJob?.id === j.id ? "border-primary bg-muted/40" : "border-border"}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{j.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {j.doc_type.replace("_", " ")} · {LANGS.find((l) => l.code === j.target_lang)?.label} · {j.done_chunks}/{j.total_chunks} sections
                      </p>
                    </div>
                  </div>
                  <Badge variant={j.status === "completed" ? "default" : j.status === "needs_review" ? "destructive" : "secondary"}>
                    {j.status.replace("_", " ")}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        )}

        {activeJob && (
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Languages className="h-4 w-4" /> {activeJob.file_name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeJob.status === "completed"
                    ? "Saved conversion — loaded from storage, nothing re-converted."
                    : `Converting ${activeJob.done_chunks + activeJob.failed_chunks}/${activeJob.total_chunks} sections`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {reviewCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" /> {reviewCount} need review
                  </Badge>
                )}
                {activeJob.status === "completed" && reviewCount === 0 && (
                  <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Validated</Badge>
                )}
                {activeJob.status !== "completed" && (
                  <Button size="sm" variant="outline" className="gap-1" disabled={phase !== "idle"}
                    onClick={() => runLoop(activeJob.id)}>
                    <RefreshCw className="h-3 w-3" /> Resume
                  </Button>
                )}
              </div>
            </div>
            {activeJob.status !== "completed" && <Progress value={pct} />}

            <Tabs defaultValue="translated">
              <TabsList>
                <TabsTrigger value="translated">
                  {LANGS.find((l) => l.code === activeJob.target_lang)?.label}
                </TabsTrigger>
                <TabsTrigger value="bilingual">Side by side</TabsTrigger>
                <TabsTrigger value="source">English</TabsTrigger>
              </TabsList>

              <TabsContent value="translated" className="pt-4">
                {chunks.map((c) => (
                  <div key={c.idx} className="border-b border-border/60 pb-3 mb-3 last:border-0">
                    {c.translated?.blocks
                      ? c.translated.blocks.map((b) => <BlockView key={b.id} block={b} />)
                      : <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Section {c.idx + 1} pending…
                        </p>}
                    {c.error && (
                      <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {c.error}
                      </p>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="bilingual" className="pt-4 space-y-4">
                {chunks.map((c) => (
                  <div key={c.idx} className="grid gap-4 md:grid-cols-2 border-b border-border/60 pb-4">
                    <div>{c.source.blocks.map((b) => <BlockView key={b.id} block={b} />)}</div>
                    <div className="md:border-l md:border-border md:pl-4">
                      {c.translated?.blocks
                        ? c.translated.blocks.map((b) => <BlockView key={b.id} block={b} />)
                        : <p className="text-sm text-muted-foreground italic">pending…</p>}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="source" className="pt-4">
                {chunks.map((c) => (
                  <div key={c.idx} className="border-b border-border/60 pb-3 mb-3 last:border-0">
                    {c.source.blocks.map((b) => <BlockView key={b.id} block={b} />)}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocTranslate;
