import React, { useState, useEffect } from "react";
import { ConceptContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent } from "@/data/textbookData";
import { Button } from "@/components/ui/button";
import { GripHorizontal, Mic, PenLine, RotateCcw, ChevronDown, ChevronUp, Send, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import VoiceExplainWidget from "@/components/textbook/VoiceExplainWidget";
import InlineMedia from "@/components/textbook/InlineMedia";
import { supabase } from "@/integrations/supabase/client";

// ─── AI Evaluate Helper ─────────────────────────────────────

const evaluateAnswer = async (prompt: string, answer: string, topic: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke("inline-evaluate", {
      body: { topic, prompt, answer },
    });
    if (error) throw error;
    return data?.feedback || "Good effort! Keep thinking deeper. 💪";
  } catch {
    return "Nice attempt! Try to add more detail next time. 💡";
  }
};

// ─── Submit Button Component ────────────────────────────────

const SubmitEvaluate = ({ answer, prompt, topic, onComplete, minWords = 3 }: {
  answer: string; prompt: string; topic?: string; onComplete?: () => void; minWords?: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = wordCount >= minWords;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const fb = await evaluateAnswer(prompt, answer, topic || "General");
    setFeedback(fb);
    setLoading(false);
    onComplete?.();
  };

  if (feedback) {
    return (
      <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-bold">AI Feedback</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
        <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="mt-1">
          <RotateCcw className="h-3 w-3 mr-1" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSubmit}
      disabled={!canSubmit || loading}
      size="sm"
      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
    >
      {loading ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating...</>
      ) : (
        <><Send className="h-3.5 w-3.5" /> Submit for Feedback</>
      )}
    </Button>
  );
};

// ─── Concept Block (Rich Visual Presentation) ───────────────

export const ConceptBlock = ({ content, onComplete }: { content: ConceptContent; onComplete?: () => void }) => {
  return (
    <div className="space-y-5">
      {content.sections.map((s, i) => {
        const hasQuestion = s.body?.includes("?");
        const isDefinition = s.heading?.toLowerCase().includes("what is") || s.heading?.toLowerCase().includes("definition") || i === 0;
        const isStep = s.heading?.toLowerCase().includes("step") || s.heading?.toLowerCase().includes("how to") || s.heading?.toLowerCase().includes("method") || s.heading?.toLowerCase().includes("algorithm");
        const isImportant = s.heading?.toLowerCase().includes("important") || s.heading?.toLowerCase().includes("remember") || s.heading?.toLowerCase().includes("key point") || s.heading?.toLowerCase().includes("note");

        // Definition-style box for the first section or explicit definitions
        if (isDefinition && i === 0) {
          return (
            <div key={i} className="rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 px-5 py-3 border-b border-indigo-200 dark:border-indigo-800">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-lg flex items-center gap-2">
                  📖 {s.heading}
                </h4>
              </div>
              <div className="px-5 py-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10">
                <p className="text-[0.95rem] text-foreground leading-[1.9] whitespace-pre-line">{s.body}</p>
              </div>
            </div>
          );
        }

        // Important/Note box
        if (isImportant) {
          return (
            <div key={i} className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/20 p-5 shadow-sm">
              <h4 className="font-bold text-amber-700 dark:text-amber-400 text-base mb-2 flex items-center gap-2">
                ⚠️ {s.heading}
              </h4>
              <p className="text-[0.95rem] text-foreground leading-[1.8] whitespace-pre-line">{s.body}</p>
            </div>
          );
        }

        // Step-by-step box
        if (isStep) {
          const steps = s.body?.split('\n').filter(line => line.trim()) || [];
          return (
            <div key={i} className="rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden shadow-sm">
              <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 text-base flex items-center gap-2">
                  🔢 {s.heading}
                </h4>
              </div>
              <div className="p-4 space-y-2">
                {steps.map((step, j) => (
                  <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900">
                    <span className="h-7 w-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    <p className="text-[0.95rem] text-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Question/Think-about box
        if (hasQuestion) {
          return (
            <div key={i} className="rounded-xl border-2 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/60 to-cyan-50/40 dark:from-teal-950/20 dark:to-cyan-950/10 p-5 shadow-sm">
              <h4 className="font-semibold text-teal-700 dark:text-teal-400 text-base mb-2 flex items-center gap-2">
                🤔 {s.heading}
              </h4>
              <p className="text-[0.95rem] text-foreground leading-[1.8] whitespace-pre-line border-l-4 border-teal-400 dark:border-teal-600 pl-4">{s.body}</p>
            </div>
          );
        }

        // Standard content section with visual lift
        return (
          <div key={i} className="rounded-xl p-5 border border-border/50 bg-card/80 hover:shadow-sm transition-shadow">
            <h4 className="font-semibold text-foreground text-[1.05rem] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-primary inline-block" />
              {s.heading}
            </h4>
            <p className="text-[0.95rem] text-muted-foreground leading-[1.9] whitespace-pre-line">{s.body}</p>
          </div>
        );
      })}

      {/* Key Formulas — gradient highlight box */}
      {content.keyFormulas && content.keyFormulas.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-md">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">🎯 Key Formulas</h4>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 p-5 space-y-3">
            {content.keyFormulas.map((f, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-mono font-semibold text-foreground bg-white/80 dark:bg-card/80 rounded-xl py-3 px-5 inline-block shadow-sm border border-violet-200 dark:border-violet-800">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solved Examples — step-by-step visual */}
      {(content as any).solvedExamples && (content as any).solvedExamples.length > 0 && (
        <div className="space-y-3">
          {(content as any).solvedExamples.map((ex: any, i: number) => (
            <div key={i} className="rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 px-5 py-3 border-b border-emerald-200 dark:border-emerald-800">
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  💡 Solved Example {i + 1}
                </h4>
              </div>
              <div className="p-5 bg-emerald-50/30 dark:bg-emerald-950/10">
                <p className="text-base font-semibold text-foreground mb-3">{ex.question}</p>
                <p className="text-[0.95rem] text-muted-foreground leading-relaxed whitespace-pre-line">{ex.solution}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {(content as any).media && <InlineMedia media={(content as any).media} />}
    </div>
  );
};

// ─── Tap-to-Place Activity Block (touch + desktop friendly) ─

interface DragDropItem { value: string; categories?: string[] }
interface ActivityCategory { id: string; description: string }
export interface ActivityContent { instruction: string; type?: string; items?: DragDropItem[]; categories?: ActivityCategory[] }

const DragDropActivityBlock = ({ content, onComplete }: { content: ActivityContent; onComplete?: () => void }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<Record<string, Record<string, "correct" | "wrong">>>({});
  const items = content.items || [];
  const categories = content.categories || [];

  const placedValues = new Set(Object.values(placements).flat());

  const handleSelectItem = (value: string) => {
    if (placedValues.has(value)) return;
    setSelectedItem(prev => prev === value ? null : value);
  };

  const handlePlaceInCategory = (categoryId: string) => {
    if (!selectedItem) return;
    const item = items.find(it => it.value === selectedItem);
    if (!item) return;
    if (placements[categoryId]?.includes(selectedItem)) return;
    const isCorrect = item.categories?.includes(categoryId);
    const newPlacements = { ...placements, [categoryId]: [...(placements[categoryId] || []), selectedItem] };
    setPlacements(newPlacements);
    setFeedback(prev => ({ ...prev, [categoryId]: { ...(prev[categoryId] || {}), [selectedItem]: isCorrect ? "correct" : "wrong" } }));
    setSelectedItem(null);
    const totalPlaced = Object.values(newPlacements).flat().length;
    if (totalPlaced >= items.length) onComplete?.();
  };

  const handleReset = () => { setPlacements({}); setFeedback({}); setSelectedItem(null); };
  const totalPlaced = Object.values(placements).flat().length;
  const totalCorrect = Object.values(feedback).flatMap(f => Object.values(f)).filter(v => v === "correct").length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.instruction}</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {selectedItem ? "Now tap a category below to place it ↓" : "Tap an item to select it"}
        </p>
        <div className="flex flex-wrap gap-3">
          {items.map((item) => {
            const isPlaced = placedValues.has(item.value);
            const isSelected = selectedItem === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleSelectItem(item.value)}
                disabled={isPlaced}
                className={`px-5 py-2.5 rounded-full font-semibold text-base transition-all select-none flex items-center gap-2 border-2 ${
                  isPlaced
                    ? "opacity-40 cursor-not-allowed border-border bg-muted text-muted-foreground"
                    : isSelected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 scale-105"
                    : "border-border bg-card text-foreground hover:border-primary hover:shadow-md cursor-pointer"
                }`}
              >
                <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />{item.value}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => {
          const catPlacements = placements[cat.id] || [];
          const catFeedback = feedback[cat.id] || {};
          return (
            <button
              key={cat.id}
              onClick={() => handlePlaceInCategory(cat.id)}
              disabled={!selectedItem}
              className={`rounded-xl border-2 border-dashed p-4 min-h-[120px] transition-all text-left ${
                selectedItem
                  ? "border-primary/60 bg-primary/5 cursor-pointer hover:bg-primary/10"
                  : "border-border bg-muted/20 cursor-default"
              }`}
            >
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">{cat.id}</span>
                <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {catPlacements.length === 0 && <p className="text-xs text-muted-foreground/50 italic">Tap to place here…</p>}
                {catPlacements.map((val) => (
                  <span key={val} className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${catFeedback[val] === "correct" ? "bg-green-50 border-green-400 text-green-800" : catFeedback[val] === "wrong" ? "bg-red-50 border-red-400 text-red-800 line-through" : "bg-card border-border text-foreground"}`}>
                    {val} {catFeedback[val] === "correct" ? "✓" : catFeedback[val] === "wrong" ? "✗" : ""}
                  </span>
                ))}
              </div>
            </button>
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
      {Object.values(answers).some(v => v.trim().length > 2) && (
        <SubmitEvaluate
          answer={Object.values(answers).join("; ")}
          prompt={content.instruction}
          topic="Activity"
          onComplete={onComplete}
          minWords={1}
        />
      )}
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
  const [selfAssessed, setSelfAssessed] = useState<Record<number, "got_it" | "not_yet">>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const assessedCount = Object.keys(selfAssessed).length;
    if (assessedCount === content.questions.length) onComplete?.();
  }, [selfAssessed]);

  const handleAssess = (i: number, result: "got_it" | "not_yet") => {
    setSelfAssessed(prev => ({ ...prev, [i]: result }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 shadow-sm">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 px-5 py-3">
          <h4 className="text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center gap-2">🧠 Quick Check — Can you remember?</h4>
        </div>
        <div className="px-5 py-2 bg-amber-50/30 dark:bg-amber-950/10 border-t border-amber-200/50 dark:border-amber-800/30">
          <p className="text-xs text-muted-foreground italic">Try to recall BEFORE revealing. Be honest — it builds your Character dimension 💪</p>
        </div>
      </div>
      <div className="space-y-3">
        {content.questions.map((q, i) => (
          <div key={i} className={`rounded-xl border-2 bg-card p-5 transition-all ${
            selfAssessed[i] === "got_it" ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/10" :
            selfAssessed[i] === "not_yet" ? "border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10" :
            "border-border/50 hover:border-amber-300 hover:shadow-sm cursor-pointer"
          }`} onClick={() => !revealed[i] && setRevealed({ ...revealed, [i]: true })}>
            <p className="text-[0.95rem] font-medium text-foreground flex items-start gap-3">
              <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                selfAssessed[i] === "got_it" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
                selfAssessed[i] === "not_yet" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
              }`}>Q{i + 1}</span>
              {q.question}
            </p>

            {/* Hint hidden behind tap */}
            {q.hint && !revealed[i] && (
              !showHint[i] ? (
                <button onClick={(e) => { e.stopPropagation(); setShowHint(prev => ({ ...prev, [i]: true })); }}
                  className="ml-10 mt-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium flex items-center gap-1">
                  💡 Need a hint? Tap here
                </button>
              ) : (
                <div className="ml-10 mt-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 animate-fade-in">
                  <p className="text-sm text-amber-700 dark:text-amber-400 italic">💡 {q.hint}</p>
                </div>
              )
            )}

            {revealed[i] && (
              <div className="ml-10 mt-3 space-y-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border-2 border-emerald-200 dark:border-emerald-800 p-4">
                  <p className="text-[0.95rem] text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-600 shrink-0 mt-0.5">✓</span> {q.answer}
                  </p>
                </div>

                {/* Self-assessment buttons */}
                {!selfAssessed[i] && (
                  <div className="flex gap-3 animate-fade-in">
                    <button onClick={(e) => { e.stopPropagation(); handleAssess(i, "got_it"); }}
                      className="flex-1 py-2.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Got it ✓
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleAssess(i, "not_yet"); }}
                      className="flex-1 py-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-semibold text-sm hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-all flex items-center justify-center gap-2">
                      <RotateCcw className="h-4 w-4" /> Not yet ✗
                    </button>
                  </div>
                )}

                {selfAssessed[i] === "got_it" && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Nice! Your recall is getting stronger 🎯
                  </p>
                )}
                {selfAssessed[i] === "not_yet" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Honest answer = Character growing! You'll review this later 📌
                  </p>
                )}
              </div>
            )}
            {!revealed[i] && <p className="text-xs text-muted-foreground mt-2 ml-10">Think first, then tap to reveal →</p>}
          </div>
        ))}
      </div>

      {/* Summary of "Not yet" items */}
      {Object.values(selfAssessed).some(v => v === "not_yet") && Object.keys(selfAssessed).length === content.questions.length && (
        <div className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10 p-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">📌 Review these before moving on:</p>
          {content.questions.map((q, i) => selfAssessed[i] === "not_yet" && (
            <p key={i} className="text-sm text-foreground ml-4 mb-1">• Q{i + 1}: {q.question}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Explain Block (with Submit) ────────────────────────────

export const ExplainBlock = ({ content, onComplete }: { content: ExplainContent; onComplete?: () => void }) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border-2 border-purple-200 dark:border-purple-800 shadow-sm">
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/30 px-5 py-3 border-b border-purple-200 dark:border-purple-800">
          <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">🗣️ Teach Your Friend</h4>
        </div>
        <div className="px-5 py-4 bg-purple-50/20 dark:bg-purple-950/10">
          <p className="text-[0.95rem] font-medium text-foreground leading-relaxed">{content.prompt}</p>
        </div>
      </div>
      {content.guidePoints && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Think about:</p>
          <ul className="space-y-1">
            {content.guidePoints.map((p, i) => (
              <li key={i} className="text-[0.95rem] text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button onClick={() => setMode("text")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "text" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <PenLine className="h-3.5 w-3.5" /> Write It
        </button>
        <button onClick={() => setMode("voice")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "voice" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Mic className="h-3.5 w-3.5" /> Speak It
        </button>
      </div>
      {mode === "voice" ? (
        <VoiceExplainWidget topic="Real Numbers — Chapter 1" prompt={content.prompt} guidePoints={content.guidePoints} onTranscript={(t) => setText(t)} />
      ) : (
        <div>
          <textarea
            className="w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-[0.95rem] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px] leading-relaxed"
            placeholder="Explain this concept as if you're teaching a friend who missed class... ✍️"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">{wordCount} words {wordCount < 5 && wordCount > 0 ? "(write at least 5 words to submit)" : ""}</span>
            {content.wordLimit && <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>Limit: {content.wordLimit}</span>}
          </div>
        </div>
      )}
      {/* Submit for AI feedback — always visible when enough words */}
      {wordCount >= 5 && (
        <SubmitEvaluate
          answer={text}
          prompt={content.prompt}
          topic="Explain — Teach Your Friend"
          onComplete={onComplete}
          minWords={5}
        />
      )}
    </div>
  );
};

// ─── Assessment Block ───────────────────────────────────────

export const AssessmentBlock = ({ content, onComplete, onWrongAttempt }: { content: AssessmentContent; onComplete?: () => void; onWrongAttempt?: () => void }) => {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const handleSelect = (qi: number, oi: number) => { if (submitted[qi]) return; setSelected({ ...selected, [qi]: oi }); };
  const handleSubmit = (qi: number) => {
    const isCorrect = selected[qi] === content.questions[qi].correctIndex;
    if (!isCorrect) onWrongAttempt?.();
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

// ─── Exercise Block (Enhanced with workspace + AI feedback) ─

export const ExerciseBlock = ({ content, onComplete }: { content: ExerciseContent; onComplete?: () => void }) => {
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<number, string>>({});
  const [workAnswers, setWorkAnswers] = useState<Record<number, string>>({});
  const [showWorkspace, setShowWorkspace] = useState<Record<number, boolean>>({});

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
    setTimeout(() => handleReveal(i), 600);
  };

  const completedCount = Object.values(showAnswer).filter(Boolean).length;
  const totalProblems = content.problems.length;

  return (
    <div className="space-y-4">
      {/* Header with source and progress */}
      <div className="flex items-center justify-between gap-3">
        <div className="border-l-4 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-r-lg px-4 py-3 text-sm text-muted-foreground flex-1">
          📖 {content.source}
        </div>
        <div className="shrink-0 text-xs font-semibold text-muted-foreground bg-muted rounded-full px-3 py-1.5">
          {completedCount}/{totalProblems} done
        </div>
      </div>

      {content.problems.map((p, i) => {
        const isTF = isTrueFalse(p.text);
        const correctAnswer = p.answer?.toLowerCase().includes("true") ? "true" : p.answer?.toLowerCase().includes("false") ? "false" : null;
        const hasWorkspace = showWorkspace[i];
        const workAnswer = workAnswers[i] || "";

        return (
          <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Problem header */}
            <div className="px-5 py-4 border-b border-border/50">
              {p.number && (
                <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
                  {p.number}
                </span>
              )}
              <p className="text-[0.95rem] text-foreground leading-[1.8]">{p.text}</p>
            </div>

            {/* True/False interactive */}
            {isTF && !showAnswer[i] ? (
              <div className="flex gap-3 px-5 py-4">
                <button
                  onClick={() => handleTfSelect(i, "true")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                    tfAnswers[i] === "true"
                      ? correctAnswer === "true"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
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
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      : "border-border bg-muted/30 text-foreground hover:border-rose-400 hover:bg-rose-50/50"
                  }`}
                >
                  ❌ False
                </button>
              </div>
            ) : (
              <div className="px-5 py-3 space-y-3">
                {/* Workspace toggle */}
                {!showAnswer[i] && !isTF && (
                  <>
                    {!hasWorkspace ? (
                      <button
                        onClick={() => setShowWorkspace({ ...showWorkspace, [i]: true })}
                        className="text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
                      >
                        <PenLine className="h-3.5 w-3.5" /> Try solving it here ✍️
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-lg border bg-background px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          rows={3}
                          placeholder="Work out your solution here..."
                          value={workAnswer}
                          onChange={(e) => setWorkAnswers({ ...workAnswers, [i]: e.target.value })}
                        />
                        {workAnswer.trim().length > 2 && (
                          <SubmitEvaluate
                            answer={workAnswer}
                            prompt={p.text}
                            topic={content.source}
                            onComplete={() => handleReveal(i)}
                            minWords={1}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Reveal answer */}
                {p.answer && (
                  showAnswer[i] ? (
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border-2 border-emerald-200 dark:border-emerald-800 p-4">
                      <p className="text-[0.95rem] text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2">
                        <span className="text-emerald-600 shrink-0 mt-0.5">✓</span> {p.answer}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReveal(i)}
                      className="text-sm text-muted-foreground font-medium hover:text-primary flex items-center gap-1"
                    >
                      <ChevronDown className="h-3.5 w-3.5" /> Reveal answer
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Progress summary */}
      {completedCount > 0 && completedCount < totalProblems && (
        <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {completedCount} of {totalProblems} problems done — keep going! 💪
        </div>
      )}
      {completedCount === totalProblems && totalProblems > 0 && (
        <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          All {totalProblems} problems completed! You're a champion! 🏆
        </div>
      )}
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
