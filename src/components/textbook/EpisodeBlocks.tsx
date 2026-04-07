import React, { useState, useEffect } from "react";
import { ConceptContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent } from "@/data/textbookData";
import { Button } from "@/components/ui/button";
import { GripHorizontal, Mic, PenLine, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import VoiceExplainWidget from "@/components/textbook/VoiceExplainWidget";
import InlineMedia from "@/components/textbook/InlineMedia";

// ─── Concept Block ──────────────────────────────────────────

export const ConceptBlock = ({ content, onComplete }: { content: ConceptContent; onComplete?: () => void }) => {
  // Auto-complete for content-only blocks after render
  useEffect(() => { onComplete?.(); }, []);

  return (
    <div className="space-y-5">
      {content.sections.map((s, i) => {
        const hasQuestion = s.body?.includes("?");
        return (
          <div key={i} className="rounded-xl p-4" style={{ background: i % 2 === 0 ? "hsl(var(--muted) / 0.4)" : "transparent" }}>
            <h4 className="font-semibold text-foreground text-[1.1rem] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-primary inline-block" />
              {s.heading}
            </h4>
            <div className={`text-[0.95rem] text-muted-foreground leading-[1.8] whitespace-pre-line ${hasQuestion ? "border-l-3 border-teal-400 pl-4 py-1 bg-teal-50/40 dark:bg-teal-950/10 rounded-r-lg" : ""}`}>
              {s.body}
            </div>
          </div>
        );
      })}

      {content.keyFormulas && content.keyFormulas.length > 0 && (
        <div className="rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 p-5 text-center">
          <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-3 flex items-center justify-center gap-2">
            🎯 Key Formulas
          </h4>
          <div className="space-y-2">
            {content.keyFormulas.map((f, i) => (
              <p key={i} className="text-lg font-mono text-foreground bg-white/70 dark:bg-card rounded-lg py-2 px-4 inline-block">{f}</p>
            ))}
          </div>
        </div>
      )}

      {(content as any).solvedExamples && (content as any).solvedExamples.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">✍️ Solved Examples</h4>
          {(content as any).solvedExamples.map((ex: any, i: number) => (
            <div key={i} className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10 p-5">
              <p className="text-sm font-semibold text-foreground mb-2">{ex.question}</p>
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{ex.solution}</p>
            </div>
          ))}
        </div>
      )}

      {(content as any).media && <InlineMedia media={(content as any).media} />}
    </div>
  );
};

// ─── Drag-Drop Activity Block ───────────────────────────────

interface DragDropItem { value: string; categories?: string[] }
interface ActivityCategory { id: string; description: string }
export interface ActivityContent { instruction: string; type?: string; items?: DragDropItem[]; categories?: ActivityCategory[] }

const DragDropActivityBlock = ({ content, onComplete }: { content: ActivityContent; onComplete?: () => void }) => {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<Record<string, Record<string, "correct" | "wrong">>>({});
  const items = content.items || [];
  const categories = content.categories || [];
  const handleDragStart = (e: React.DragEvent, value: string) => { e.dataTransfer.setData("text/plain", value); setDragItem(value); };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    const value = e.dataTransfer.getData("text/plain");
    const item = items.find(it => it.value === value);
    if (!item) return;
    if (placements[categoryId]?.includes(value)) return;
    const isCorrect = item.categories?.includes(categoryId);
    const newPlacements = { ...placements, [categoryId]: [...(placements[categoryId] || []), value] };
    setPlacements(newPlacements);
    setFeedback(prev => ({ ...prev, [categoryId]: { ...(prev[categoryId] || {}), [value]: isCorrect ? "correct" : "wrong" } }));
    setDragItem(null);
    // Check if all items placed
    const totalPlaced = Object.values(newPlacements).flat().length;
    if (totalPlaced >= items.length) onComplete?.();
  };
  const handleReset = () => { setPlacements({}); setFeedback({}); };
  const totalPlaced = Object.values(placements).flat().length;
  const totalCorrect = Object.values(feedback).flatMap(f => Object.values(f)).filter(v => v === "correct").length;
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.instruction}</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Drag these numbers</p>
        <div className="flex flex-wrap gap-3">
          {items.map((item) => (
            <div key={item.value} draggable onDragStart={(e) => handleDragStart(e, item.value)} className="px-5 py-2.5 rounded-full bg-card border-2 border-border text-foreground font-semibold text-base cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all select-none flex items-center gap-2">
              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />{item.value}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => {
          const catPlacements = placements[cat.id] || [];
          const catFeedback = feedback[cat.id] || {};
          return (
            <div key={cat.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, cat.id)} className={`rounded-xl border-2 border-dashed p-4 min-h-[120px] transition-all ${dragItem ? "border-primary/60 bg-primary/5" : "border-border bg-muted/20"}`}>
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">{cat.id}</span>
                <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {catPlacements.length === 0 && <p className="text-xs text-muted-foreground/50 italic">Drop numbers here…</p>}
                {catPlacements.map((val) => (
                  <span key={val} className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${catFeedback[val] === "correct" ? "bg-green-50 border-green-400 text-green-800" : catFeedback[val] === "wrong" ? "bg-red-50 border-red-400 text-red-800 line-through" : "bg-card border-border text-foreground"}`}>
                    {val} {catFeedback[val] === "correct" ? "✓" : catFeedback[val] === "wrong" ? "✗" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {totalPlaced > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">{totalCorrect} correct of {totalPlaced} placed</span>
          <Button variant="ghost" size="sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
        </div>
      )}
    </div>
  );
};

const FallbackActivityBlock = ({ content, onComplete }: { content: ActivityContent; onComplete?: () => void }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  useEffect(() => {
    const filled = Object.values(answers).filter(v => v.trim().length > 0).length;
    if (filled > 0) onComplete?.();
  }, [answers]);
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.instruction}</p>
      </div>
      {content.items?.map((item, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-base font-medium text-foreground mb-2">({i + 1}) {item.value}</p>
          <textarea className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={2} placeholder="Work it out here..." value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
        </div>
      ))}
    </div>
  );
};

export const ActivityBlock = ({ content, onComplete }: { content: ActivityContent; onComplete?: () => void }) => {
  if (content.type === "classify" && content.categories && content.items) return <DragDropActivityBlock content={content} onComplete={onComplete} />;
  return <FallbackActivityBlock content={content} onComplete={onComplete} />;
};

// ─── Recall Block ───────────────────────────────────────────

export const RecallBlock = ({ content, onComplete }: { content: RecallContent; onComplete?: () => void }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  useEffect(() => {
    const revealedCount = Object.values(revealed).filter(Boolean).length;
    if (revealedCount === content.questions.length) onComplete?.();
  }, [revealed]);
  return (
    <div className="border-2 border-dashed border-amber-400 rounded-lg p-5 bg-amber-50/50 dark:bg-amber-950/10">
      <h4 className="text-amber-600 dark:text-amber-400 font-semibold mb-4 flex items-center gap-2">🧠 Quick Check</h4>
      <div className="space-y-3">
        {content.questions.map((q, i) => (
          <div key={i} className="bg-white dark:bg-card rounded-lg p-4 cursor-pointer hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors" onClick={() => !revealed[i] && setRevealed({ ...revealed, [i]: true })}>
            <p className="text-[0.95rem] font-medium text-foreground"><strong>Q{i + 1}:</strong> {q.question}</p>
            {q.hint && !revealed[i] && <p className="text-sm text-muted-foreground italic mt-1">💡 Hint: {q.hint}</p>}
            {revealed[i] && <div className="mt-2 p-3 bg-green-100 dark:bg-green-950/30 rounded-md text-green-800 dark:text-green-300 text-[0.95rem]">✓ {q.answer}</div>}
            {!revealed[i] && <p className="text-xs text-muted-foreground mt-2">Click to reveal answer</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Explain Block ──────────────────────────────────────────

export const ExplainBlock = ({ content, onComplete }: { content: ExplainContent; onComplete?: () => void }) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("voice");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  useEffect(() => {
    if (wordCount >= 5) onComplete?.();
  }, [wordCount]);
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.prompt}</p>
      </div>
      {content.guidePoints && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Think about:</p>
          <ul className="space-y-1">
            {content.guidePoints.map((p, i) => (
              <li key={i} className="text-base text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button onClick={() => setMode("voice")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "voice" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Mic className="h-3.5 w-3.5" /> Speak It
        </button>
        <button onClick={() => setMode("text")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "text" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <PenLine className="h-3.5 w-3.5" /> Write It
        </button>
      </div>
      {mode === "voice" ? (
        <VoiceExplainWidget topic="Real Numbers — Chapter 1" prompt={content.prompt} guidePoints={content.guidePoints} onTranscript={(t) => setText(t)} />
      ) : (
        <div>
          <textarea className="w-full rounded-xl border bg-background px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]" placeholder="Write your explanation here..." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
            {content.wordLimit && <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>Limit: {content.wordLimit}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Assessment Block ───────────────────────────────────────

export const AssessmentBlock = ({ content, onComplete }: { content: AssessmentContent; onComplete?: () => void }) => {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const handleSelect = (qi: number, oi: number) => { if (submitted[qi]) return; setSelected({ ...selected, [qi]: oi }); };
  const handleSubmit = (qi: number) => {
    const newSubmitted = { ...submitted, [qi]: true };
    setSubmitted(newSubmitted);
    if (Object.keys(newSubmitted).length === content.questions.length) onComplete?.();
  };
  return (
    <div className="space-y-5">
      {content.questions.map((q, qi) => {
        const isSubmitted = submitted[qi];
        const isCorrect = selected[qi] === q.correctIndex;
        return (
          <div key={qi} className="rounded-xl border bg-card p-5">
            <p className="text-base font-medium text-foreground mb-3">Q{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let optClass = "border bg-background hover:border-primary/40";
                if (selected[qi] === oi && !isSubmitted) optClass = "border-primary bg-primary/5";
                if (isSubmitted && oi === q.correctIndex) optClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                if (isSubmitted && selected[qi] === oi && oi !== q.correctIndex) optClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                return (
                  <button key={oi} onClick={() => handleSelect(qi, oi)} className={`w-full text-left rounded-lg px-4 py-3 text-base transition-all flex items-center gap-3 ${optClass}`}>
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected[qi] !== undefined && !isSubmitted && <Button size="sm" className="mt-3" onClick={() => handleSubmit(qi)}>Check Answer</Button>}
            {isSubmitted && (
              <div className={`mt-3 rounded-lg p-3 text-base ${isCorrect ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
                <p className="font-medium">{isCorrect ? "✅ Correct!" : "❌ Not quite."}</p>
                <p className="mt-1">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Exercise Block ─────────────────────────────────────────

export const ExerciseBlock = ({ content, onComplete }: { content: ExerciseContent; onComplete?: () => void }) => {
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<number, string>>({});

  // Detect True/False problems
  const isTrueFalse = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes("true or false") || lower.includes("true/false") || lower.includes("(true/false)") || lower.includes("state whether");
  };

  const handleReveal = (i: number) => {
    const next = { ...showAnswer, [i]: true };
    setShowAnswer(next);
    const revealedCount = Object.values(next).filter(Boolean).length;
    if (revealedCount === content.problems.length) onComplete?.();
  };

  const handleTfSelect = (i: number, val: string) => {
    const next = { ...tfAnswers, [i]: val };
    setTfAnswers(next);
    // Auto-reveal after selection
    setTimeout(() => handleReveal(i), 600);
  };

  return (
    <div className="space-y-3">
      <div className="border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 rounded-r-lg px-4 py-3 text-sm text-muted-foreground">📖 {content.source}</div>
      {content.problems.map((p, i) => {
        const isTF = isTrueFalse(p.text);
        const answered = tfAnswers[i] !== undefined;
        const correctAnswer = p.answer?.toLowerCase().includes("true") ? "true" : p.answer?.toLowerCase().includes("false") ? "false" : null;

        return (
          <div key={i} className="bg-white dark:bg-card rounded-xl border shadow-sm p-4">
            <p className="text-[0.95rem] text-foreground leading-[1.8] mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2">{p.number || i + 1}</span>
              {p.text}
            </p>

            {isTF && !showAnswer[i] ? (
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => handleTfSelect(i, "true")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                    tfAnswers[i] === "true"
                      ? correctAnswer === "true"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-border bg-muted/30 text-foreground hover:border-emerald-400 hover:bg-emerald-50/50"
                  }`}
                >
                  ✅ True
                </button>
                <button
                  onClick={() => handleTfSelect(i, "false")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                    tfAnswers[i] === "false"
                      ? correctAnswer === "false"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-border bg-muted/30 text-foreground hover:border-rose-400 hover:bg-rose-50/50"
                  }`}
                >
                  ❌ False
                </button>
              </div>
            ) : p.answer ? (
              <div className="mt-2">
                {showAnswer[i] ? (
                  <div className="rounded-lg bg-green-100 dark:bg-green-950/30 p-3 text-[0.95rem] text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                    ✓ Answer: {p.answer}
                  </div>
                ) : (
                  <button
                    onClick={() => handleReveal(i)}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <ChevronDown className="h-3.5 w-3.5" /> Click to reveal answer
                  </button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ─── Shared Config ──────────────────────────────────────────

export const blockLabels: Record<string, string> = {
  concept: "What's the big idea?", activity: "Try it yourself!", recall: "Can you remember?",
  explain: "Teach your friend", assessment: "Prove it!", exercise: "Level up",
  reasoning: "But WHY though?", assumptions: "What if we're wrong?",
  connections: "Where else does this hide?", application: "Use it in real life",
  implications: "What does this change?", visual_aid: "See it in action",
};

export const blockSubtitles: Record<string, string> = {
  concept: "The core idea, made simple",
  activity: "Get your hands dirty",
  exercise: "Practice makes permanent",
  recall: "No peeking allowed!",
  assessment: "Show what you really know",
  explain: "If you can explain it, you own it",
  reasoning: "The reason behind the rule",
  assumptions: "Challenge what everyone assumes",
  connections: "Surprising links you didn't expect",
  application: "How the real world uses this",
  implications: "How this idea shapes tomorrow",
  bilingual_concept: "Read in both languages side-by-side",
  story_reading: "A story to read and understand",
  vocabulary: "New words to master today",
  grammar_pattern: "Spot the pattern in the language",
  visual_aid: "A picture is worth a thousand words",
};

export const layerMeta: Record<string, { border: string; bg: string; badge?: string; badgeColor?: string; dotColor: string }> = {
  concept:     { border: "border-l-blue-600",    bg: "",  badge: "🔍 Discover",     badgeColor: "bg-amber-500 text-white", dotColor: "bg-blue-600" },
  activity:    { border: "border-l-rose-500",    bg: "",  badge: "🎮 Play",         badgeColor: "bg-rose-500 text-white", dotColor: "bg-rose-500" },
  recall:      { border: "border-l-amber-500",   bg: "",  badge: "🧩 Challenge",    badgeColor: "bg-amber-500 text-white", dotColor: "bg-amber-500" },
  explain:     { border: "border-l-purple-500",  bg: "",  badge: "🗣️ Your Turn",    badgeColor: "bg-purple-500 text-white", dotColor: "bg-purple-500" },
  assessment:  { border: "border-l-green-600",   bg: "",  badge: "✅ Prove It",      badgeColor: "bg-green-600 text-white", dotColor: "bg-green-600" },
  exercise:    { border: "border-l-indigo-500",  bg: "",  badge: "📝 Practice",     badgeColor: "bg-indigo-500 text-white", dotColor: "bg-indigo-500" },
  reasoning:   { border: "border-l-orange-500",  bg: "",  badge: "🧪 Deep Dive",    badgeColor: "bg-orange-500 text-white", dotColor: "bg-orange-500" },
  assumptions: { border: "border-l-red-500",     bg: "",  badge: "🔥 Challenge",    badgeColor: "bg-red-500 text-white", dotColor: "bg-red-500" },
  connections: { border: "border-l-cyan-500",    bg: "",  badge: "🌐 Connect",      badgeColor: "bg-cyan-500 text-white", dotColor: "bg-cyan-500" },
  application: { border: "border-l-emerald-500", bg: "",  badge: "🛠️ Apply",        badgeColor: "bg-emerald-500 text-white", dotColor: "bg-emerald-500" },
  implications:{ border: "border-l-violet-500",  bg: "",  badge: "💡 Impact",       badgeColor: "bg-violet-500 text-white", dotColor: "bg-violet-500" },
  visual_aid:  { border: "border-l-pink-500",    bg: "",  badge: "👁️ Visual",       badgeColor: "bg-pink-500 text-white", dotColor: "bg-pink-500" },
  bilingual_concept: { border: "border-l-teal-500", bg: "", badge: "📖 Read", badgeColor: "bg-teal-500 text-white", dotColor: "bg-teal-500" },
  story_reading: { border: "border-l-amber-600", bg: "", badge: "📚 Story", badgeColor: "bg-amber-600 text-white", dotColor: "bg-amber-600" },
  vocabulary:  { border: "border-l-sky-500",     bg: "",  badge: "📝 Words",        badgeColor: "bg-sky-500 text-white", dotColor: "bg-sky-500" },
  grammar_pattern: { border: "border-l-fuchsia-500", bg: "", badge: "🔤 Grammar", badgeColor: "bg-fuchsia-500 text-white", dotColor: "bg-fuchsia-500" },
};
