import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { ContentBlock } from "@/data/textbookData";

interface TopicBlock {
  type: "definition" | "formula" | "example" | "steps" | "note" | "text" | "proof" | "question" | "scenario";
  title?: string;
  content: string | string[];
  color?: string;
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

function convertBlock(block: ContentBlock): TopicBlock[] {
  const out: TopicBlock[] = [];
  const c = block.content as any;

  switch (block.type) {
    case "concept": {
      if (c?.sections) {
        for (const s of c.sections) {
          out.push({ type: "text", title: s.heading, content: s.body, color: s.highlight ? "primary" : undefined });
        }
      }
      if (c?.keyFormulas?.length) {
        out.push({ type: "formula", title: "Key Formulas", content: c.keyFormulas });
      }
      if (c?.example?.length) {
        for (const ex of c.example) {
          out.push({ type: "example", title: "Solved Example", content: [`Q: ${ex.question}`, `Solution: ${ex.solution}`] });
        }
      }
      break;
    }
    case "reasoning": {
      if (c?.centralQuestion) out.push({ type: "question", title: "🤔 Central Question", content: c.centralQuestion, color: "amber" });
      if (c?.whyQuestions?.length) {
        for (const wq of c.whyQuestions) {
          const lines = [`❓ ${wq.question}`];
          if (wq.hint) lines.push(`💡 Hint: ${wq.hint}`);
          if (wq.deeperInsight) lines.push(`🔍 Insight: ${wq.deeperInsight}`);
          out.push({ type: "steps", title: "Why?", content: lines, color: "amber" });
        }
      }
      break;
    }
    case "assumptions": {
      if (c?.concept) out.push({ type: "text", title: "🕵️ Concept Under Investigation", content: c.concept, color: "sky" });
      if (c?.hiddenAssumptions?.length) {
        for (const ha of c.hiddenAssumptions) {
          out.push({
            type: "steps",
            title: `Assumption: ${ha.assumption}`,
            content: [`Why it matters: ${ha.whyItMatters}`, `⚡ Challenge: ${ha.challenge}`],
            color: "sky",
          });
        }
      }
      if (c?.defensePrompt) out.push({ type: "note", content: `🛡️ Defense Prompt: ${c.defensePrompt}`, color: "sky" });
      break;
    }
    case "connections": {
      if (c?.concept) out.push({ type: "text", title: "🌐 Connecting Concept", content: c.concept, color: "emerald" });
      if (c?.connections?.length) {
        for (const conn of c.connections) {
          out.push({
            type: "steps",
            title: `${conn.icon || "🔗"} ${conn.domain}`,
            content: [conn.link, conn.explanation],
            color: "emerald",
          });
        }
      }
      break;
    }
    case "application": {
      if (c?.scenario) out.push({ type: "scenario", title: "🚀 Real-World Scenario", content: c.scenario, color: "orange" });
      if (c?.context) out.push({ type: "text", title: "Context", content: c.context, color: "orange" });
      if (c?.questions?.length) {
        out.push({
          type: "steps",
          title: "Case Questions",
          content: c.questions.map((q: any, i: number) => `${i + 1}. ${q.question}${q.hint ? ` (Hint: ${q.hint})` : ""}`),
          color: "orange",
        });
      }
      if (c?.realWorldWhy) out.push({ type: "note", content: `💼 Why this matters: ${c.realWorldWhy}`, color: "orange" });
      if (c?.careers?.length) out.push({ type: "note", content: `🎯 Careers: ${c.careers.join(", ")}`, color: "orange" });
      break;
    }
    case "implications": {
      if (c?.whatIfQuestion) out.push({ type: "question", title: "🔮 What If...?", content: c.whatIfQuestion, color: "violet" });
      if (c?.reflectionPrompts?.length) {
        out.push({ type: "steps", title: "Reflection Prompts", content: c.reflectionPrompts, color: "violet" });
      }
      if (c?.essayPrompt) out.push({ type: "scenario", title: "📝 Essay Prompt", content: c.essayPrompt, color: "violet" });
      if (c?.implications?.length) {
        for (const imp of c.implications) {
          out.push({ type: "steps", title: `${imp.icon || "📌"} ${imp.category}`, content: imp.points, color: "violet" });
        }
      }
      break;
    }
    case "activity": {
      if (c?.instruction) out.push({ type: "text", title: block.title || "🎯 Activity", content: c.instruction });
      if (c?.items?.length) {
        out.push({
          type: "steps",
          title: c.type ? `Type: ${c.type}` : "Items",
          content: c.items.map((item: any) => item.value || JSON.stringify(item)),
        });
      }
      if (c?.categories?.length) {
        out.push({
          type: "steps",
          title: "Categories",
          content: c.categories.map((cat: any) => `${cat.label}: ${cat.description}`),
        });
      }
      break;
    }
    case "recall": {
      if (c?.questions?.length) {
        for (const q of c.questions) {
          const lines = [`❓ ${q.question}`];
          if (q.hint) lines.push(`💡 Hint: ${q.hint}`);
          if (q.answer) lines.push(`✅ ${q.answer}`);
          out.push({ type: "question", title: "Quick Recall", content: lines, color: "amber" });
        }
      }
      break;
    }
    case "explain": {
      if (c?.prompt) out.push({ type: "scenario", title: "🗣️ Explain This", content: c.prompt });
      if (c?.guidePoints?.length) {
        out.push({ type: "steps", title: "Guide Points", content: c.guidePoints });
      }
      if (c?.wordLimit) out.push({ type: "note", content: `📏 Word limit: ${c.wordLimit} words` });
      break;
    }
    case "exercise": {
      if (c?.source) out.push({ type: "note", content: `📖 Source: ${c.source}` });
      if (c?.problems?.length) {
        for (const p of c.problems) {
          const lines = [p.text || p.question || p.problem || ""];
          if (p.answer) lines.push(`Answer: ${p.answer}`);
          out.push({ type: "example", title: `Problem ${p.number || ""}`.trim(), content: lines, color: "green" });
        }
      }
      break;
    }
    case "assessment": {
      if (c?.questions?.length) {
        for (const q of c.questions) {
          const lines = [q.question, ...(q.options || []).map((o: string, i: number) => `  ${String.fromCharCode(65 + i)}) ${o}`)];
          if (q.explanation) lines.push(`📝 ${q.explanation}`);
          out.push({ type: "question", title: "Assessment", content: lines, color: "amber" });
        }
      }
      break;
    }
    case "bilingual_concept": {
      if (c?.sections) {
        for (const s of c.sections) {
          out.push({ type: "text", title: s.heading, content: s.body || s.content || "" });
        }
      }
      if (c?.vocabulary?.length) {
        out.push({ type: "steps", title: "Vocabulary", content: c.vocabulary.map((v: any) => `${v.word}: ${v.meaning || v.definition || ""}`) });
      }
      break;
    }
    case "vocabulary": {
      if (c?.words?.length) {
        for (const w of c.words) {
          out.push({ type: "definition", title: w.word || w.term, content: [w.meaning || w.definition || "", w.example ? `Example: ${w.example}` : ""].filter(Boolean) });
        }
      }
      break;
    }
    case "grammar_pattern": {
      if (c?.pattern) out.push({ type: "formula", title: "Grammar Pattern", content: c.pattern });
      if (c?.examples?.length) {
        out.push({ type: "steps", title: "Examples", content: c.examples.map((e: any) => typeof e === "string" ? e : e.sentence || e.text || "") });
      }
      break;
    }
    case "story_reading": {
      if (c?.title) out.push({ type: "text", title: c.title, content: c.text || c.passage || c.content || "" });
      if (c?.questions?.length) {
        out.push({ type: "steps", title: "Comprehension", content: c.questions.map((q: any) => typeof q === "string" ? q : q.question || "") });
      }
      break;
    }
    default: {
      if (c?.text) out.push({ type: "text", content: c.text });
      else if (c?.summary) out.push({ type: "text", content: c.summary });
      else if (c?.sections) {
        for (const s of c.sections) out.push({ type: "text", title: s.heading, content: s.body || s.content || "" });
      }
      else if (typeof c === "string") out.push({ type: "text", content: c });
      break;
    }
  }

  if (out.length === 0 && block.title) {
    out.push({ type: "note", content: `${block.icon || "📖"} ${block.title}` });
  }

  return out;
}

// Color palette map for themed blocks
const colorMap: Record<string, { bg: string; border: string; text: string; title: string }> = {
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-900 dark:text-amber-100", title: "text-amber-700 dark:text-amber-400" },
  sky: { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800", text: "text-sky-900 dark:text-sky-100", title: "text-sky-700 dark:text-sky-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-900 dark:text-emerald-100", title: "text-emerald-700 dark:text-emerald-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", text: "text-orange-900 dark:text-orange-100", title: "text-orange-700 dark:text-orange-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", text: "text-violet-900 dark:text-violet-100", title: "text-violet-700 dark:text-violet-400" },
  green: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", text: "text-green-900 dark:text-green-100", title: "text-green-700 dark:text-green-400" },
  primary: { bg: "bg-primary/5", border: "border-primary/30", text: "text-foreground", title: "text-primary" },
};

const FullTextbookView = ({ blocks = [], chapterTitle, episodeTitle }: FullTextbookViewProps) => {
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

  const getColors = (color?: string) => color && colorMap[color] ? colorMap[color] : null;

  const renderBlock = (block: TopicBlock, i: number) => {
    const lines = Array.isArray(block.content) ? block.content : [block.content];
    const colors = getColors(block.color);

    switch (block.type) {
      case "definition":
        return (
          <div key={i} className="p-5 rounded-xl bg-primary/5 border-l-4 border-primary space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-base leading-relaxed font-serif">{l}</p>)}
          </div>
        );
      case "formula":
        return (
          <div key={i} className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="font-mono text-base font-semibold text-amber-900 dark:text-amber-100">{l}</p>)}
          </div>
        );
      case "question":
        return (
          <div key={i} className={`p-5 rounded-xl border-2 border-dashed space-y-2 ${colors ? `${colors.bg} ${colors.border}` : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${colors?.title || "text-amber-700 dark:text-amber-400"}`}>{block.title}</p>
            {lines.map((l, j) => <p key={j} className={`text-base leading-relaxed ${colors?.text || ""}`}>{l}</p>)}
          </div>
        );
      case "scenario":
        return (
          <div key={i} className={`p-5 rounded-xl border-l-4 space-y-2 ${colors ? `${colors.bg} ${colors.border}` : "bg-orange-50 dark:bg-orange-950/30 border-orange-400 dark:border-orange-600"}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${colors?.title || "text-orange-700 dark:text-orange-400"}`}>{block.title}</p>
            {lines.map((l, j) => <p key={j} className={`text-base leading-relaxed italic ${colors?.text || ""}`}>{l}</p>)}
          </div>
        );
      case "example":
        return (
          <div key={i} className={`p-5 rounded-xl border space-y-2 ${colors ? `${colors.bg} ${colors.border}` : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${colors?.title || "text-blue-700 dark:text-blue-400"}`}>{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm font-mono">{l}</p>)}
          </div>
        );
      case "steps":
        return (
          <div key={i} className={`p-5 rounded-xl border space-y-3 ${colors ? `${colors.bg} ${colors.border}` : "bg-muted/50 border-border"}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${colors?.title || "text-foreground/70"}`}>{block.title}</p>
            <div className="space-y-2">
              {lines.map((l, j) => (
                <div key={j} className="flex gap-2 items-start">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${colors?.title ? colors.title.replace("text-", "bg-") : "bg-foreground/40"}`} />
                  <p className={`text-sm leading-relaxed ${colors?.text || ""}`}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "proof":
        return (
          <div key={i} className="p-5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm leading-relaxed">{l}</p>)}
          </div>
        );
      case "note":
        return (
          <div key={i} className={`p-4 rounded-xl border ${colors ? `${colors.bg} ${colors.border}` : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"}`}>
            <p className={`text-sm whitespace-pre-line ${colors?.text || "text-green-800 dark:text-green-300"}`}>{lines[0]}</p>
          </div>
        );
      default:
        return (
          <div key={i} className={`space-y-2 ${colors ? `p-5 rounded-xl border ${colors.bg} ${colors.border}` : ""}`}>
            {block.title && <p className={`text-xs font-bold uppercase tracking-wider ${colors?.title || "text-foreground/70"}`}>{block.title}</p>}
            {lines.map((l, j) => <p key={j} className="text-base leading-relaxed font-serif">{l}</p>)}
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
