import type { Layer } from "@/lib/sevenLayers";
import type { ContentBlock, ConceptContent } from "@/data/textbookData";

// Per-layer rich-but-generic content used ONLY when the chapter has no
// authored block for that layer. Keeps the 7-layer spine complete (never
// blank, never inactive) for every episode.
export function synthesizeLayerBlock(layer: Layer, topic: string): ContentBlock {
  const t = topic.trim();

  const byLayer: Record<Layer["key"], { icon: string; sections: ConceptContent["sections"] }> = {
    definition: {
      icon: "📘",
      sections: [
        {
          heading: `What is ${t}?`,
          body: `${t} is the central idea of this lesson. Before we use it, let's pin down what it actually means in one clear sentence — without jargon. Read the chapter's opening lines, then say the definition in your own words.`,
        },
        {
          heading: "Words that matter",
          body: `Underline 2-3 keywords from the definition of ${t}. If a word is new, write its everyday meaning next to it. A definition you can re-say in your own words is a definition you truly own.`,
        },
      ],
    },
    mechanism: {
      icon: "⚙️",
      sections: [
        {
          heading: `How ${t} actually works`,
          body: `Walk through ${t} as a sequence of small, observable steps. What happens first? What changes next? What's the final state? Drawing a tiny flow (A → B → C) on the side of your notebook makes the mechanism click.`,
        },
        {
          heading: "One example you can see",
          body: `Pick a familiar example — from class, home, sport, or your phone — where ${t} is happening. Describe each step of the mechanism in that example. If you can narrate it, you understand it.`,
        },
      ],
    },
    reasoning: {
      icon: "🤔",
      sections: [
        {
          heading: `Why does ${t} work this way?`,
          body: `A fact is not the same as a reason. Ask: why this rule and not another? What would go wrong if we changed one step? Cause → effect in one line: "${t} works this way because ___, which means ___."`,
        },
      ],
    },
    assumptions: {
      icon: "🧐",
      sections: [
        {
          heading: `What ${t} quietly assumes`,
          body: `Every idea sits on top of "we are assuming ___". List 2 conditions that must be true for ${t} to hold. Ask: what happens at the edge — when something is zero, very large, missing, or noisy?`,
        },
        {
          heading: "Common traps",
          body: `Write one wrong sentence about ${t} that a classmate could easily believe. Then write the corrected version. Spotting the trap is half of mastering the concept.`,
        },
      ],
    },
    connections: {
      icon: "🔗",
      sections: [
        {
          heading: `Where else does ${t} show up?`,
          body: `${t} is rarely a lonely idea. Name one earlier chapter it builds on, and one later chapter or different subject where the same shape of thinking appears. Drawing arrows between topics is how strong students remember.`,
        },
      ],
    },
    applications: {
      icon: "🛠️",
      sections: [
        {
          heading: `Where can you use ${t}?`,
          body: `Think of 2 real situations — a shop bill, a bus route, a kitchen task, a game score, a science lab, a phone setting — where knowing ${t} lets you make a better decision or solve a problem faster.`,
        },
        {
          heading: "One small task",
          body: `Try a 2-minute task right now: apply ${t} to a tiny number, a simple object, or a quick example from your day. The smallest application beats the longest re-reading.`,
        },
      ],
    },
    implications: {
      icon: "🌱",
      sections: [
        {
          heading: `What follows from ${t}?`,
          body: `If ${t} is true, what new questions does it open? What can we now predict, design, or refuse to believe? Strong learners don't stop at the answer — they ask "so what next?"`,
        },
        {
          heading: "Take it forward",
          body: `Write one sentence in your notebook starting with "Because of ${t}, I can now ___." That sentence is the bridge between today's lesson and tomorrow's thinking.`,
        },
      ],
    },
  };

  const { icon, sections } = byLayer[layer.key];
  return {
    type: "concept",
    title: `${layer.index}. ${layer.name} · ${layer.caption}`,
    icon,
    content: { sections } as ConceptContent,
  };
}
