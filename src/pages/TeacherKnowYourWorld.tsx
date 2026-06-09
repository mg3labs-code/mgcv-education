import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe2, Sparkles, RefreshCw, ExternalLink, BookOpen, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const CLASS_OPTIONS = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "Class 6": ["Mathematics", "Science", "Social Studies", "English"],
  "Class 7": ["Mathematics", "Science", "Social Studies", "English"],
  "Class 8": ["Mathematics", "Science", "Social Studies", "English"],
  "Class 9": ["Mathematics", "Physics", "Chemistry", "Biology", "Social Studies", "English"],
  "Class 10": ["Mathematics", "Physics", "Chemistry", "Biology", "Social Studies", "English"],
};
const BOARDS = ["CBSE", "Telangana"];

interface Headline {
  title: string;
  topic: string;
  what_happened: string;
  why_curious: string;
  classroom_hook: string;
  real_world_link: string;
  search_query: string;
}
interface Digest {
  headlines: Headline[];
  generated_at?: string;
  cached?: boolean;
}

const TeacherKnowYourWorld = () => {
  const qc = useQueryClient();
  const [className, setClassName] = useState("Class 10");
  const [board, setBoard] = useState("CBSE");
  const subjects = SUBJECTS_BY_CLASS[className] ?? [];
  const [subject, setSubject] = useState(subjects[0]);

  const cacheKey = useMemo(() => ["know-your-world", subject, className, board], [subject, className, board]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: cacheKey,
    enabled: !!subject,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Digest> => {
      const { data, error } = await supabase.functions.invoke("know-your-world", {
        body: { subject, class_name: className, board },
      });
      if (error) throw error;
      return data as Digest;
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("know-your-world", {
        body: { subject, class_name: className, board, force_refresh: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.setQueryData(cacheKey, d);
      toast({ title: "Refreshed", description: `New ${subject} updates for ${className}.` });
    },
    onError: (e: any) => {
      toast({
        title: "Could not refresh",
        description: e?.message?.includes("402")
          ? "AI credits exhausted. Add credits in Workspace → Usage."
          : e?.message?.includes("429")
          ? "Rate limit reached. Try again in a minute."
          : "Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const onClassChange = (c: string) => {
    setClassName(c);
    const list = SUBJECTS_BY_CLASS[c] ?? [];
    if (!list.includes(subject)) setSubject(list[0]);
  };

  return (
    <DashboardLayout role="teacher">
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
                <Globe2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Know Your World
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Fresh real-world advancements and curious facts for every subject you teach — refreshed weekly.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
                {CLASS_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onClassChange(c)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      className === c ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
                {BOARDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBoard(b)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      board === b ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh.mutate()}
                disabled={refresh.isPending || isFetching}
                className="ml-auto gap-1.5"
              >
                {refresh.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>
          </header>

          {/* Subject tabs */}
          <Tabs value={subject} onValueChange={setSubject}>
            <TabsList className="flex flex-wrap h-auto bg-muted/60 p-1">
              {subjects.map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs sm:text-sm data-[state=active]:bg-background gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>

            {subjects.map((s) => (
              <TabsContent key={s} value={s} className="mt-4">
                {s === subject && (
                  <DigestList
                    data={data}
                    isLoading={isLoading || isFetching}
                    error={error as Error | null}
                    subject={subject}
                    className={className}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

const DigestList = ({
  data,
  isLoading,
  error,
  subject,
  className,
}: {
  data: Digest | undefined;
  isLoading: boolean;
  error: Error | null;
  subject: string;
  className: string;
}) => {
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 animate-pulse space-y-3">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-destructive font-medium">Could not load updates.</p>
        <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </Card>
    );
  }

  const items = data?.headlines ?? [];
  if (!items.length) {
    return (
      <Card className="p-6 text-center">
        <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No updates yet for {subject} · {className}.</p>
        <p className="text-xs text-muted-foreground mt-1">Try Refresh.</p>
      </Card>
    );
  }

  return (
    <>
      {data?.generated_at && (
        <p className="text-[11px] text-muted-foreground mb-3">
          Updated {new Date(data.generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {data.cached ? " · cached" : " · fresh"}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((h, i) => (
          <Card key={i} className="p-5 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground leading-snug">{h.title}</h3>
              <Badge variant="secondary" className="text-[10px] shrink-0">{h.topic}</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{h.what_happened}</p>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-3 w-3" /> Why curious
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-100">{h.why_curious}</p>
            </div>

            <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                <Sparkles className="h-3 w-3" /> Classroom hook
              </div>
              <p className="text-xs text-teal-900 dark:text-teal-100 italic">"{h.classroom_hook}"</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                Everyday: {h.real_world_link}
              </p>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(h.search_query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

export default TeacherKnowYourWorld;
