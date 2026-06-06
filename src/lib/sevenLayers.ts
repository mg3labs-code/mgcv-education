// The 7-Layer pedagogy spine. Single source of truth for layer names,
// short captions, and the mapping from the legacy `current_rung` (1..5)
// to the 7 named layers from the R&D doc.
//
// Doc: docs/03-product/textbook-7-layer-framework.md

export type LayerKey =
  | "definition"
  | "mechanism"
  | "reasoning"
  | "assumptions"
  | "connections"
  | "applications"
  | "implications";

export interface Layer {
  key: LayerKey;
  index: number; // 1..7
  name: string;
  caption: string; // one-line "what you're doing here"
  hue: number;    // HSL hue for the spine
}

export const LAYERS: Layer[] = [
  { key: "definition",   index: 1, name: "Definition",   caption: "What is it, really?",                 hue: 200 },
  { key: "mechanism",    index: 2, name: "Mechanism",    caption: "How does it actually work?",          hue: 175 },
  { key: "reasoning",    index: 3, name: "Reasoning",    caption: "Why does it work this way?",          hue: 150 },
  { key: "assumptions",  index: 4, name: "Assumptions",  caption: "What are we taking for granted?",     hue: 45  },
  { key: "connections",  index: 5, name: "Connections",  caption: "Where else does this show up?",       hue: 25  },
  { key: "applications", index: 6, name: "Applications", caption: "Where can you use it?",               hue: 340 },
  { key: "implications", index: 7, name: "Implications", caption: "What follows from this?",             hue: 270 },
];

/** Map legacy `current_rung` (1..5) onto the 7 layers. */
export function rungToLayer(rung: number | null | undefined): Layer {
  const r = Math.max(1, Math.min(5, rung ?? 1));
  // 1→1, 2→2/3, 3→3/4, 4→5/6, 5→7
  const map: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 5, 5: 7 };
  return LAYERS[(map[r] ?? 1) - 1];
}

export function layerByIndex(i: number): Layer {
  return LAYERS[Math.max(0, Math.min(LAYERS.length - 1, i - 1))];
}
