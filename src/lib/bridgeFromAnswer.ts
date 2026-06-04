// "Never say no" bridge.
// Takes whatever the student typed and returns a gentle line that
// reasons FORWARD from their words — never says wrong / try again / no.
//
// First tries the arc-bridge edge function (Gemini via Lovable AI Gateway).
// Falls back to a hand-authored line so the experience never breaks.

import { supabase } from "@/integrations/supabase/client";

export interface BridgeInput {
  conceptKey: string;
  step: string;             // e.g. "day1.first_thought", "day2.believe_doubt"
  studentText: string;
  interestTag?: string;
}

export interface BridgeResult {
  line: string;              // the warm bridging line to show
  source: "ai" | "fallback";
}

const handAuthoredFallback = (input: BridgeInput): string => {
  const t = input.studentText.trim();
  if (!t) {
    return "That's a real thought — let's hold on to it and walk one more step together.";
  }
  if (t.length < 4) {
    return `"${t}" is a starting point. Say a little more about what made you think that.`;
  }
  return `"${t}" — that's a real noticing. Let's see where it leads.`;
};

export async function bridgeFromAnswer(input: BridgeInput): Promise<BridgeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("arc-bridge", {
      body: input,
    });
    if (error) throw error;
    const line = (data as { line?: string } | null)?.line?.trim();
    if (line) return { line, source: "ai" };
  } catch (err) {
    console.warn("[bridgeFromAnswer] falling back:", err);
  }
  return { line: handAuthoredFallback(input), source: "fallback" };
}
