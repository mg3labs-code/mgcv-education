import { describe, it, expect } from "vitest";
import { LAYERS, rungToLayer, blockToLayer, layerByIndex } from "@/lib/sevenLayers";

describe("rungToLayer — legacy 1..5 confidence-ladder compatibility", () => {
  // Legacy mapping: 1→1 (Definition), 2→2 (Mechanism), 3→4 (Assumptions),
  // 4→5 (Connections), 5→7 (Implications). Documented in src/lib/sevenLayers.ts.
  const cases: [number, number, string][] = [
    [1, 1, "definition"],
    [2, 2, "mechanism"],
    [3, 4, "assumptions"],
    [4, 5, "connections"],
    [5, 7, "implications"],
  ];
  it.each(cases)("legacy rung %i maps to layer %i (%s)", (rung, idx, key) => {
    const layer = rungToLayer(rung);
    expect(layer.index).toBe(idx);
    expect(layer.key).toBe(key);
  });
});

describe("rungToLayer — direct 7-layer values from textbook full reader", () => {
  it.each([6, 7])("value %i is treated as a direct layer index", (i) => {
    expect(rungToLayer(i).index).toBe(i);
  });
});

describe("rungToLayer — defensive bounds", () => {
  it("null/undefined fall back to layer 1", () => {
    expect(rungToLayer(null).index).toBe(1);
    expect(rungToLayer(undefined).index).toBe(1);
  });
  it("0 and negative values clamp to layer 1", () => {
    expect(rungToLayer(0).index).toBe(1);
    expect(rungToLayer(-3).index).toBe(1);
  });
  it("values above 7 clamp to layer 7", () => {
    expect(rungToLayer(99).index).toBe(7);
  });
});

describe("blockToLayer — every layer key is reachable from at least one block_type", () => {
  const samples: Record<string, string> = {
    hook: "definition",
    intro: "definition",
    ladder_climb: "mechanism",
    sort_activity: "mechanism",
    tricky_mcq: "reasoning",
    why_question: "reasoning",
    trap_tf: "assumptions",
    believe_doubt: "assumptions",
    bridge_block: "connections",
    cross_connect: "connections",
    apply_case: "applications",
    vibe_check: "applications",
    implications_essay: "implications",
    teach_back: "implications",
    defense_round: "implications",
  };
  it.each(Object.entries(samples))("block %s → %s", (block, key) => {
    expect(blockToLayer(block).key).toBe(key);
  });
});

describe("LAYERS spine is the single source of truth", () => {
  it("has exactly 7 layers in order", () => {
    expect(LAYERS).toHaveLength(7);
    LAYERS.forEach((l, i) => expect(l.index).toBe(i + 1));
  });
  it("layerByIndex round-trips against LAYERS", () => {
    for (let i = 1; i <= 7; i += 1) {
      expect(layerByIndex(i).key).toBe(LAYERS[i - 1].key);
    }
  });
});
