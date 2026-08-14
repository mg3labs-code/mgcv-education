import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import EmptyState from "@/components/EmptyState";
import { ArrowLeft, FileText, History, Loader2, Play } from "lucide-react";

const LANGS: Record<string, string> = {
  te: "Telugu", hi: "Hindi", ta: "Tamil", kn: "Kannada", mr: "Marathi", bn: "Bengali",
};

interface JobRow {
  id: string;
  file_name: string;
  file_size: number | null;
  doc_type: string;
  target_lang: string;
  term_style: string;
  status: string;
  total_chunks: number;
  done_chunks: number;
  failed_chunks: number;
  created_at: string;
  guest_id: string | null;
}

const getGuestId = () => {
  let id = localStorage.getItem("doc_translate_guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("doc_translate_guest_id", id);
  }
  return id;
};

const fmtSize = (b?: number | null) => {
  if (!b) return null;
  const mb = b / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(Math.round(b / 1024), 1)} KB`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const DocHistory = () => {
  const navigate = useNavigate();
  const guestId = useMemo(getGuestId, []);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("doc_translation_jobs")
      .select("*")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false })
      .limit(100);
    setJobs((data as JobRow[]) || []);
    setLoading(false);
  }, [guestId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
            onClick={() => navigate("/translate")} aria-label="Back to reader">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <History className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-medium">Your conversions</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <p className="flex items-center gap-2 py-16 justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your history…
          </p>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No conversions yet"
            description="Documents you convert on this device will show up here so you can resume them anytime."
            actionLabel="Convert a document"
            onAction={() => navigate("/translate")}
          />
        ) : (
          jobs.map((j) => {
            const done = j.done_chunks + j.failed_chunks;
            const pct = j.total_chunks ? Math.round((done / j.total_chunks) * 100) : 0;
            const completed = j.status === "completed" || (j.total_chunks > 0 && done >= j.total_chunks);
            return (
              <Card key={j.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {LANGS[j.target_lang] || j.target_lang}
                      {fmtSize(j.file_size) ? ` · ${fmtSize(j.file_size)}` : ""}
                      {` · ${fmtDate(j.created_at)}`}
                    </p>
                  </div>
                  <Badge variant={completed ? "secondary" : "outline"} className="shrink-0">
                    {completed ? "Ready" : `${pct}%`}
                  </Badge>
                </div>
                {!completed && <Progress value={pct} className="h-1" />}
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => navigate(`/translate?job=${j.id}`)}>
                    <Play className="h-3.5 w-3.5" />
                    {completed ? "Open" : "Resume"}
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {j.total_chunks ? `${Math.min(done, j.total_chunks)} / ${j.total_chunks} pages` : "Preparing…"}
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
};

export default DocHistory;
