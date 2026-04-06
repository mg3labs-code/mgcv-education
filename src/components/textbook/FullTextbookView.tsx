import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { ContentBlock } from "@/data/textbookData";

interface TopicBlock {
  type: "definition" | "formula" | "example" | "steps" | "note" | "text" | "proof";
  title?: string;
  content: string | string[];
}

interface Topic {
  id: string;
  title: string;
  content: TopicBlock[];
}

interface FullTextbookViewProps {
  blocks?: ContentBlock[];
  chapterTitle?: string;
  episodeTitle?: string;
}

// Convert a ContentBlock from the 7-layer system into simple readable TopicBlocks
function convertBlock(block: ContentBlock): TopicBlock[] {
  const out: TopicBlock[] = [];
  const c = block.content as any;

  switch (block.type) {
    case "concept": {
      if (c?.sections) {
        for (const s of c.sections) {
          out.push({ type: "text", title: s.heading, content: s.body });
        }
      }
      if (c?.keyFormulas?.length) {
        out.push({ type: "formula", title: "Key Formulas", content: c.keyFormulas });
      }
      break;
    }
    case "reasoning": {
      if (c?.whyItWorks) out.push({ type: "text", title: "Why It Works", content: c.whyItWorks });
      if (c?.proofSketch) out.push({ type: "proof", title: "Proof Sketch", content: c.proofSketch });
      if (c?.commonMistakes?.length) {
        out.push({ type: "note", content: `⚠️ Common mistakes: ${c.commonMistakes.join("; ")}` });
      }
      break;
    }
    case "assumptions": {
      if (c?.assumptions?.length) {
        out.push({
          type: "steps",
          title: "Assumptions & Conditions",
          content: c.assumptions.map((a: any) => `${a.assumption}: ${a.explanation}`),
        });
      }
      break;
    }
    case "connections": {
      if (c?.connections?.length) {
        out.push({
          type: "note",
          content: c.connections.map((conn: any) => `🔗 ${conn.topic}: ${conn.relationship}`).join("\n"),
        });
      }
      break;
    }
    case "application": {
      if (c?.realWorldExamples?.length) {
        for (const ex of c.realWorldExamples) {
          out.push({ type: "example", title: ex.title || "Real-World Example", content: ex.description || ex.explanation || "" });
        }
      }
      break;
    }
    case "implications": {
      if (c?.implications?.length) {
        out.push({
          type: "steps",
          title: "Implications & Extensions",
          content: c.implications.map((imp: any) => `${imp.title}: ${imp.description}`),
        });
      }
      break;
    }
    case "activity": {
      if (c?.instructions) out.push({ type: "steps", title: block.title || "Activity", content: Array.isArray(c.instructions) ? c.instructions : [c.instructions] });
      break;
    }
    case "recall": {
      if (c?.questions?.length) {
        out.push({ type: "steps", title: "Recall Questions", content: c.questions.map((q: any, i: number) => `${i + 1}. ${typeof q === "string" ? q : q.question || q.text || ""}`) });
      }
      break;
    }
    case "explain": {
      if (c?.summary) out.push({ type: "text", title: "Summary", content: c.summary });
      if (c?.teacherNotes) out.push({ type: "note", content: c.teacherNotes });
      break;
    }
    case "exercise": {
      if (c?.problems?.length) {
        for (const p of c.problems) {
          const lines = [p.question || p.problem || ""];
          if (p.hint) lines.push(`💡 Hint: ${p.hint}`);
          if (p.answer) lines.push(`Answer: ${p.answer}`);
          out.push({ type: "example", title: `Problem ${p.number || ""}`.trim(), content: lines });
        }
      }
      break;
    }
    case "assessment": {
      if (c?.questions?.length) {
        for (const q of c.questions) {
          out.push({ type: "example", title: `Q${q.number || ""}`, content: [q.question || q.text || "", ...(q.options || [])] });
        }
      }
      break;
    }
    default: {
      // Generic fallback — try to extract text
      if (c?.text) out.push({ type: "text", content: c.text });
      else if (c?.summary) out.push({ type: "text", content: c.summary });
      else if (typeof c === "string") out.push({ type: "text", content: c });
      break;
    }
  }

  // If nothing extracted, show block title as a note
  if (out.length === 0 && block.title) {
    out.push({ type: "note", content: `${block.icon || "📖"} ${block.title}` });
  }

  return out;
}

const FullTextbookView = ({ blocks = [], chapterTitle, episodeTitle }: FullTextbookViewProps) => {
  // Group blocks into "topics" — each 7-layer block becomes one topic
  const topics: Topic[] = useMemo(() => {
    if (!blocks.length) return [];
    return blocks.map((block, i) => ({
      id: `block-${i}`,
      title: block.title || `${block.icon || "📖"} Section ${i + 1}`,
      content: convertBlock(block),
    })).filter(t => t.content.length > 0);
  }, [blocks]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const topic = topics[activeIndex];
  const progress = topics.length > 0 ? Math.round((completed.size / topics.length) * 100) : 0;

  const markComplete = () => {
    if (!topic) return;
    setCompleted(prev => new Set(prev).add(topic.id));
    if (activeIndex < topics.length - 1) setActiveIndex(prev => prev + 1);
  };

  const renderBlock = (block: TopicBlock, i: number) => {
    const lines = Array.isArray(block.content) ? block.content : [block.content];

    switch (block.type) {
      case "definition":
        return (
          <div key={i} className="p-4 rounded-xl bg-primary/5 border-l-4 border-primary space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm leading-relaxed">{l}</p>)}
          </div>
        );
      case "formula":
        return (
          <div key={i} className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="font-mono text-sm font-medium">{l}</p>)}
          </div>
        );
      case "example":
        return (
          <div key={i} className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm font-mono">{l}</p>)}
          </div>
        );
      case "steps":
        return (
          <div key={i} className="p-4 rounded-xl bg-muted/50 border space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm">{l}</p>)}
          </div>
        );
      case "proof":
        return (
          <div key={i} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm">{l}</p>)}
          </div>
        );
      case "note":
        return (
          <div key={i} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-line">📌 {lines[0]}</p>
          </div>
        );
      default:
        return (
          <div key={i} className="space-y-1">
            {block.title && <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">{block.title}</p>}
            {lines.map((l, j) => <p key={j} className="text-sm leading-relaxed">{l}</p>)}
          </div>
        );
    }
  };

  if (!topics.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center space-y-2">
          <BookOpen className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm">No textbook content available for this episode yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border rounded-xl bg-card flex flex-col">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {chapterTitle || "Topics"}
          </p>
          {episodeTitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{episodeTitle}</p>}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {topics.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveIndex(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  i === activeIndex ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                }`}
              >
                {completed.has(t.id) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 border rounded-xl bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{topic?.title}</h2>
          <span className="text-xs text-muted-foreground">{activeIndex + 1} of {topics.length}</span>
        </div>
        <ScrollArea className="flex-1 p-5">
          <div className="space-y-4 max-w-2xl">
            {topic?.content.map((block, i) => renderBlock(block, i))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={activeIndex === 0} onClick={() => setActiveIndex(prev => prev - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          {!completed.has(topic?.id || "") ? (
            <Button size="sm" onClick={markComplete}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete & Next
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={activeIndex === topics.length - 1} onClick={() => setActiveIndex(prev => prev + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullTextbookView;
